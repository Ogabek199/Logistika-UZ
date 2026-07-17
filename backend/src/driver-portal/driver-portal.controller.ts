import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles, RolesGuard } from '../auth/roles.guard';
import { DriverPortalService } from './driver-portal.service';

@Controller('driver')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('DRIVER')
export class DriverPortalController {
  constructor(private readonly portal: DriverPortalService) {}

  @Get('portal')
  portalData(@Req() req: { user: { userId: string } }) {
    return this.portal.getPortal(req.user.userId);
  }
}
