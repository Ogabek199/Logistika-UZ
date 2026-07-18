import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomBytes } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';

type TelegramUpdate = {
  update_id: number;
  message?: {
    text?: string;
    chat: { id: number };
  };
};

@Injectable()
export class TelegramService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(TelegramService.name);
  private polling = false;
  private pollAbort: AbortController | null = null;
  private offset = 0;

  constructor(
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
  ) {}

  async onModuleInit() {
    const token = this.botToken();
    if (!token) {
      this.logger.warn('TELEGRAM_BOT_TOKEN yo‘q — Telegram o‘chirilgan');
      return;
    }

    const webhookUrl = this.config.get<string>('TELEGRAM_WEBHOOK_URL')?.trim();
    if (webhookUrl) {
      await this.registerWebhook(webhookUrl);
      return;
    }

    await this.deleteWebhook();
    this.startPolling();
  }

  onModuleDestroy() {
    this.polling = false;
    this.pollAbort?.abort();
  }

  botToken(): string | undefined {
    return this.config.get<string>('TELEGRAM_BOT_TOKEN')?.trim() || undefined;
  }

  botUsername(): string | undefined {
    const raw = this.config.get<string>('TELEGRAM_BOT_USERNAME')?.trim();
    if (!raw) return undefined;
    return raw.replace(/^@/, '');
  }

  webhookSecret(): string | undefined {
    return (
      this.config.get<string>('TELEGRAM_WEBHOOK_SECRET')?.trim() || undefined
    );
  }

  assertWebhookSecret(headerValue?: string) {
    const secret = this.webhookSecret();
    if (!secret) return;
    if (headerValue !== secret) {
      throw new BadRequestException('Webhook secret noto‘g‘ri');
    }
  }

  getLinkUrl(token: string): string {
    const username = this.botUsername();
    if (!username) {
      throw new BadRequestException(
        'TELEGRAM_BOT_USERNAME .env faylida belgilang.',
      );
    }
    return `https://t.me/${username}?start=${token}`;
  }

  async ensureLinkToken(driverId: string) {
    const driver = await this.prisma.driver.findUnique({
      where: { id: driverId },
    });
    if (!driver) throw new NotFoundException('Haydovchi topilmadi');
    if (driver.telegramLinkToken) return driver;

    for (let i = 0; i < 5; i++) {
      const telegramLinkToken = randomBytes(16).toString('hex');
      try {
        return await this.prisma.driver.update({
          where: { id: driverId },
          data: { telegramLinkToken },
        });
      } catch {
        // unique collision — retry
      }
    }
    throw new BadRequestException('Link token yaratilmadi');
  }

  async handleUpdate(update: TelegramUpdate) {
    const message = update.message;
    if (!message?.text) return;

    const text = message.text.trim();
    if (!text.startsWith('/start')) return;

    const chatId = String(message.chat.id);
    const payload = text.split(/\s+/)[1]?.trim();

    if (!payload) {
      await this.sendMessage(
        chatId,
        'OOO "MUSFIRA SAVDO TRANS" botiga xush kelibsiz.\nHaydovchi panelidagi «Telegramni ulash» havolasi orqali /start bosing.',
      );
      return;
    }

    const driver = await this.prisma.driver.findUnique({
      where: { telegramLinkToken: payload },
    });
    if (!driver) {
      await this.sendMessage(
        chatId,
        'Havola noto‘g‘ri yoki eskirgan. Admindan yangi havola so‘rang.',
      );
      return;
    }

    await this.prisma.driver.updateMany({
      where: {
        telegramChatId: chatId,
        NOT: { id: driver.id },
      },
      data: { telegramChatId: null, telegramLinkedAt: null },
    });

    await this.prisma.driver.update({
      where: { id: driver.id },
      data: {
        telegramChatId: chatId,
        telegramLinkedAt: new Date(),
      },
    });

    await this.sendMessage(
      chatId,
      `Salom, <b>${escapeHtml(driver.fullName)}</b>!\nTelegram muvaffaqiyatli bog‘landi.`,
    );
  }

  async sendMessage(chatId: string, text: string) {
    const token = this.botToken();
    if (!token) {
      throw new BadRequestException(
        'Telegram bot sozlanmagan. TELEGRAM_BOT_TOKEN .env faylida belgilang.',
      );
    }

    const res = await fetch(
      `https://api.telegram.org/bot${token}/sendMessage`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text,
          parse_mode: 'HTML',
        }),
      },
    );

    const body = (await res.json()) as { ok: boolean; description?: string };
    if (!res.ok || !body.ok) {
      throw new BadRequestException(
        body.description || 'Telegram xabari yuborilmadi',
      );
    }

    return { ok: true };
  }

  private async registerWebhook(url: string) {
    const token = this.botToken();
    if (!token) return;

    const secret = this.webhookSecret();
    const res = await fetch(`https://api.telegram.org/bot${token}/setWebhook`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        url,
        secret_token: secret || undefined,
        allowed_updates: ['message'],
        drop_pending_updates: true,
      }),
    });
    const body = (await res.json()) as { ok: boolean; description?: string };
    if (!body.ok) {
      this.logger.error(`setWebhook xato: ${body.description}`);
      return;
    }
    this.logger.log(`Telegram webhook: ${url}`);
  }

  private async deleteWebhook() {
    const token = this.botToken();
    if (!token) return;
    try {
      await fetch(`https://api.telegram.org/bot${token}/deleteWebhook`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ drop_pending_updates: false }),
      });
    } catch (e) {
      this.logger.warn(`deleteWebhook: ${String(e)}`);
    }
  }

  private startPolling() {
    this.polling = true;
    this.logger.log('Telegram long-polling yoqildi (webhook URL yo‘q)');
    void this.pollLoop();
  }

  private async pollLoop() {
    while (this.polling) {
      try {
        await this.pollOnce();
      } catch (e) {
        if (!this.polling) break;
        this.logger.warn(`Polling xato: ${String(e)}`);
        await sleep(3000);
      }
    }
  }

  private async pollOnce() {
    const token = this.botToken();
    if (!token) return;

    this.pollAbort = new AbortController();
    const url = new URL(`https://api.telegram.org/bot${token}/getUpdates`);
    url.searchParams.set('timeout', '25');
    url.searchParams.set('offset', String(this.offset));
    url.searchParams.set('allowed_updates', JSON.stringify(['message']));

    const res = await fetch(url, {
      signal: this.pollAbort.signal,
    });
    const body = (await res.json()) as {
      ok: boolean;
      result?: TelegramUpdate[];
      description?: string;
    };

    if (!body.ok) {
      throw new Error(body.description || 'getUpdates failed');
    }

    for (const update of body.result || []) {
      this.offset = update.update_id + 1;
      try {
        await this.handleUpdate(update);
      } catch (e) {
        this.logger.warn(`Update #${update.update_id}: ${String(e)}`);
      }
    }
  }
}

function escapeHtml(s: string) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
