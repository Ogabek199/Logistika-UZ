import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { DriverPortalModule } from './driver-portal/driver-portal.module';
import { DriversModule } from './drivers/drivers.module';
import { DocumentsModule } from './documents/documents.module';
import { AdminsModule } from './admins/admins.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    DashboardModule,
    DriverPortalModule,
    DriversModule,
    DocumentsModule,
    AdminsModule,
  ],
})
export class AppModule {}
