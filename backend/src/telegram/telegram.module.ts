import { Module } from '@nestjs/common';
import { TelegramController } from './telegram.controller';
import { TelegramService } from './telegram.service';
import { TelegramReminderService } from './telegram-reminder.service';

@Module({
  controllers: [TelegramController],
  providers: [TelegramService, TelegramReminderService],
  exports: [TelegramService],
})
export class TelegramModule {}
