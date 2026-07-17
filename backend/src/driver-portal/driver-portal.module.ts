import { Module } from '@nestjs/common';
import { DriverPortalController } from './driver-portal.controller';
import { DriverPortalService } from './driver-portal.service';
import { TelegramModule } from '../telegram/telegram.module';
import { DriversModule } from '../drivers/drivers.module';

@Module({
  imports: [TelegramModule, DriversModule],
  controllers: [DriverPortalController],
  providers: [DriverPortalService],
})
export class DriverPortalModule {}
