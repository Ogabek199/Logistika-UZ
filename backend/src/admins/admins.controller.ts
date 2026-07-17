import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles, RolesGuard } from '../auth/roles.guard';
import { AdminsService } from './admins.service';
import { CreateAdminDto } from './dto/admin.dto';

@Controller('admin/admins')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class AdminsController {
  constructor(private readonly admins: AdminsService) {}

  @Get()
  findAll() {
    return this.admins.findAll();
  }

  @Post()
  create(@Body() dto: CreateAdminDto) {
    return this.admins.create(dto);
  }

  @Delete(':id')
  remove(
    @Param('id') id: string,
    @Req() req: { user: { userId: string } },
  ) {
    return this.admins.remove(id, req.user.userId);
  }
}
