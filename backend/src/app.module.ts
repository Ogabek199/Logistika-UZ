import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { DriverPortalModule } from './driver-portal/driver-portal.module';
import { DriversModule } from './drivers/drivers.module';
import { DocumentsModule } from './documents/documents.module';
import { AdminsModule } from './admins/admins.module';
import { TelegramModule } from './telegram/telegram.module';
import { HealthController } from './health.controller';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
    PrismaModule,
    AuthModule,
    DashboardModule,
    DriverPortalModule,
    DriversModule,
    DocumentsModule,
    AdminsModule,
    TelegramModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
