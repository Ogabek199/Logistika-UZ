import { Body, Controller, Headers, HttpCode, Post } from '@nestjs/common';
import { TelegramService } from './telegram.service';

@Controller('telegram')
export class TelegramController {
  constructor(private readonly telegram: TelegramService) {}

  @Post('webhook')
  @HttpCode(200)
  async webhook(
    @Body()
    body: {
      update_id: number;
      message?: { text?: string; chat: { id: number } };
    },
    @Headers('x-telegram-bot-api-secret-token') secret?: string,
  ) {
    this.telegram.assertWebhookSecret(secret);
    await this.telegram.handleUpdate(body);
    return { ok: true };
  }
}
