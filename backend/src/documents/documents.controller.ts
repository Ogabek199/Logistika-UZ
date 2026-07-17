import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles, RolesGuard } from '../auth/roles.guard';
import { DocumentsService } from './documents.service';
import {
  CreateDocDto,
  CreateExpenseDto,
  UpdateDocDto,
} from './dto/document.dto';

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class DocumentsController {
  constructor(private readonly docs: DocumentsService) {}

  @Get('putyovkalar')
  putyovkas(@Query('q') q?: string) {
    return this.docs.list('putyovka', q);
  }

  @Post('putyovkalar')
  createPutyovka(@Body() dto: CreateDocDto) {
    return this.docs.create('putyovka', dto);
  }

  @Patch('putyovkalar/:id')
  updatePutyovka(@Param('id') id: string, @Body() dto: UpdateDocDto) {
    return this.docs.update('putyovka', id, dto);
  }

  @Delete('putyovkalar/:id')
  deletePutyovka(@Param('id') id: string) {
    return this.docs.remove('putyovka', id);
  }

  @Get('tirlar')
  tirs(@Query('q') q?: string) {
    return this.docs.list('tir', q);
  }

  @Post('tirlar')
  createTir(@Body() dto: CreateDocDto) {
    return this.docs.create('tir', dto);
  }

  @Patch('tirlar/:id')
  updateTir(@Param('id') id: string, @Body() dto: UpdateDocDto) {
    return this.docs.update('tir', id, dto);
  }

  @Delete('tirlar/:id')
  deleteTir(@Param('id') id: string) {
    return this.docs.remove('tir', id);
  }

  @Get('dazvollar')
  dazvols(@Query('q') q?: string) {
    return this.docs.list('dazvol', q);
  }

  @Post('dazvollar')
  createDazvol(@Body() dto: CreateDocDto) {
    return this.docs.create('dazvol', dto);
  }

  @Patch('dazvollar/:id')
  updateDazvol(@Param('id') id: string, @Body() dto: UpdateDocDto) {
    return this.docs.update('dazvol', id, dto);
  }

  @Delete('dazvollar/:id')
  deleteDazvol(@Param('id') id: string) {
    return this.docs.remove('dazvol', id);
  }

  @Get('litsenziyalar')
  licenses(@Query('q') q?: string) {
    return this.docs.list('license', q);
  }

  @Post('litsenziyalar')
  createLicense(@Body() dto: CreateDocDto) {
    return this.docs.create('license', dto);
  }

  @Patch('litsenziyalar/:id')
  updateLicense(@Param('id') id: string, @Body() dto: UpdateDocDto) {
    return this.docs.update('license', id, dto);
  }

  @Delete('litsenziyalar/:id')
  deleteLicense(@Param('id') id: string) {
    return this.docs.remove('license', id);
  }

  @Get('ijara')
  rentals(@Query('q') q?: string) {
    return this.docs.list('rental', q);
  }

  @Post('ijara')
  createRental(@Body() dto: CreateDocDto) {
    return this.docs.create('rental', dto);
  }

  @Patch('ijara/:id')
  updateRental(@Param('id') id: string, @Body() dto: UpdateDocDto) {
    return this.docs.update('rental', id, dto);
  }

  @Delete('ijara/:id')
  deleteRental(@Param('id') id: string) {
    return this.docs.remove('rental', id);
  }

  @Get('chiqimlar')
  expenses(@Query('q') q?: string) {
    return this.docs.listExpenses(q);
  }

  @Post('chiqimlar')
  createExpense(
    @Body() dto: CreateExpenseDto,
    @Req() req: { user: { userId: string } },
  ) {
    return this.docs.createExpense(dto, req.user.userId);
  }

  @Delete('chiqimlar/:id')
  deleteExpense(@Param('id') id: string) {
    return this.docs.removeExpense(id);
  }
}
