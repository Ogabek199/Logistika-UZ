import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { TelegramService } from './telegram.service';

function debt(price: number, paid: number) {
  return Math.max(0, price - paid);
}

function escapeHtml(s: string) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function daysLeft(endDate: Date) {
  return Math.ceil((endDate.getTime() - Date.now()) / (24 * 60 * 60 * 1000));
}

/** ISO week key for Asia/Tashkent calendar day (e.g. 2026-W29). */
function tashkentWeekKey(date = new Date()): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Tashkent',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);
  const y = Number(parts.find((p) => p.type === 'year')?.value);
  const m = Number(parts.find((p) => p.type === 'month')?.value);
  const d = Number(parts.find((p) => p.type === 'day')?.value);
  const local = new Date(Date.UTC(y, m - 1, d));
  const dayNum = local.getUTCDay() || 7;
  local.setUTCDate(local.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(local.getUTCFullYear(), 0, 1));
  const week = Math.ceil(
    ((local.getTime() - yearStart.getTime()) / 86400000 + 1) / 7,
  );
  return `${local.getUTCFullYear()}-W${String(week).padStart(2, '0')}`;
}

const DOC_LABELS: Record<string, string> = {
  putyovka: 'Putyovka',
  tir: 'TIR',
  dazvol: 'Dazvol',
  license: 'Litsenziya',
  rental: 'Ijara',
};

const EXPIRY_THRESHOLDS = [7, 3, 1] as const;

@Injectable()
export class TelegramReminderService {
  private readonly logger = new Logger(TelegramReminderService.name);
  private running = false;

  constructor(
    private readonly prisma: PrismaService,
    private readonly telegram: TelegramService,
  ) {}

  /** Every day at 09:00 Asia/Tashkent */
  @Cron('0 9 * * *', { timeZone: 'Asia/Tashkent' })
  async handleDailyReminders() {
    if (!this.telegram.botToken()) {
      this.logger.debug('Telegram token yo‘q — eslatmalar o‘tkazib yuborildi');
      return;
    }
    if (this.running) return;
    this.running = true;
    try {
      await this.sendDebtReminders();
      await this.sendExpiryReminders();
    } catch (e) {
      this.logger.warn(`Reminder job xato: ${String(e)}`);
    } finally {
      this.running = false;
    }
  }

  async sendDebtReminders() {
    const weekKey = tashkentWeekKey();
    const drivers = await this.prisma.driver.findMany({
      where: { telegramChatId: { not: null } },
      include: {
        putyovkas: true,
        tirs: true,
        dazvols: true,
        licenses: true,
        rentals: true,
      },
    });

    for (const driver of drivers) {
      if (!driver.telegramChatId) continue;
      const allDocs = [
        ...driver.putyovkas,
        ...driver.tirs,
        ...driver.dazvols,
        ...driver.licenses,
        ...driver.rentals,
      ];
      const totalDebt = allDocs.reduce((s, x) => s + debt(x.price, x.paid), 0);
      if (totalDebt <= 0) continue;

      const fingerprint = `debt:${driver.id}:${weekKey}`;
      const sent = await this.tryClaim(driver.id, fingerprint, 'debt');
      if (!sent) continue;

      const text = [
        `<b>${escapeHtml(driver.fullName)}</b>`,
        `Jami qarz: ${totalDebt.toLocaleString('uz-UZ')} so'm`,
        '',
        'Iltimos, to‘lovni amalga oshiring.',
        'OOO "MUSFIRA SAVDO TRANS"',
      ].join('\n');

      try {
        await this.telegram.sendMessage(driver.telegramChatId, text);
      } catch (e) {
        await this.releaseClaim(fingerprint);
        this.logger.warn(
          `Qarz eslatmasi yuborilmadi (${driver.id}): ${String(e)}`,
        );
      }
    }
  }

  async sendExpiryReminders() {
    const drivers = await this.prisma.driver.findMany({
      where: { telegramChatId: { not: null } },
      include: {
        putyovkas: true,
        tirs: true,
        dazvols: true,
        licenses: true,
        rentals: true,
      },
    });

    type Item = {
      driverId: string;
      chatId: string;
      fullName: string;
      kind: string;
      docId: string;
      days: number;
      endDate: Date;
    };

    const items: Item[] = [];

    for (const driver of drivers) {
      if (!driver.telegramChatId) continue;
      const groups: Array<{
        kind: string;
        docs: Array<{ id: string; status: string; endDate: Date | null }>;
      }> = [
        { kind: 'putyovka', docs: driver.putyovkas },
        { kind: 'tir', docs: driver.tirs },
        { kind: 'dazvol', docs: driver.dazvols },
        { kind: 'license', docs: driver.licenses },
        { kind: 'rental', docs: driver.rentals },
      ];

      for (const group of groups) {
        for (const doc of group.docs) {
          if (doc.status !== 'ACTIVE' || !doc.endDate) continue;
          const days = daysLeft(doc.endDate);
          if (!EXPIRY_THRESHOLDS.includes(days as 7 | 3 | 1)) continue;
          items.push({
            driverId: driver.id,
            chatId: driver.telegramChatId,
            fullName: driver.fullName,
            kind: group.kind,
            docId: doc.id,
            days,
            endDate: doc.endDate,
          });
        }
      }
    }

    for (const item of items) {
      const fingerprint = `expiry:${item.kind}:${item.docId}:${item.days}`;
      const claimed = await this.tryClaim(item.driverId, fingerprint, 'expiry');
      if (!claimed) continue;

      const label = DOC_LABELS[item.kind] || item.kind;
      const end = item.endDate.toLocaleDateString('uz-UZ');
      const text = [
        `<b>${escapeHtml(item.fullName)}</b>`,
        `${label} muddati tugashiga <b>${item.days}</b> kun qoldi.`,
        `Tugash sanasi: ${end}`,
        '',
        'OOO "MUSFIRA SAVDO TRANS"',
      ].join('\n');

      try {
        await this.telegram.sendMessage(item.chatId, text);
      } catch (e) {
        await this.releaseClaim(fingerprint);
        this.logger.warn(
          `Muddat eslatmasi yuborilmadi (${item.docId}): ${String(e)}`,
        );
      }
    }
  }

  private async tryClaim(
    driverId: string,
    fingerprint: string,
    kind: string,
  ): Promise<boolean> {
    try {
      await this.prisma.telegramReminderLog.create({
        data: { driverId, fingerprint, kind },
      });
      return true;
    } catch {
      return false;
    }
  }

  private async releaseClaim(fingerprint: string) {
    await this.prisma.telegramReminderLog.deleteMany({
      where: { fingerprint },
    });
  }
}
