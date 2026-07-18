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
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Response } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles, RolesGuard } from '../auth/roles.guard';
import { DocumentsService } from './documents.service';
import {
  CreateDocDto,
  CreateExpenseDto,
  UpdateDocDto,
} from './dto/document.dto';

const DOCX_MIME =
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

function sendDocx(
  res: Response,
  { buffer, filename }: { buffer: Buffer; filename: string },
) {
  res.set({
    'Content-Type': DOCX_MIME,
    'Content-Disposition': `attachment; filename="document"; filename*=UTF-8''${encodeURIComponent(
      filename,
    )}`,
    'Content-Length': String(buffer.length),
  });
  res.end(buffer);
}

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class DocumentsController {
  constructor(private readonly docs: DocumentsService) {}

  @Get('putyovkalar')
  putyovkas(@Query('q') q?: string, @Query('filter') filter?: string) {
    return this.docs.list('putyovka', q, filter);
  }

  @Get('putyovkalar/:id/docx')
  async putyovkaDocx(@Param('id') id: string, @Res() res: Response) {
    sendDocx(res, await this.docs.generatePutyovkaDocx(id));
  }

  @Post('putyovkalar')
  createPutyovka(
    @Body() dto: CreateDocDto,
    @Req() req: { user: { userId: string } },
  ) {
    return this.docs.create('putyovka', dto, req.user.userId);
  }

  @Patch('putyovkalar/:id')
  updatePutyovka(
    @Param('id') id: string,
    @Body() dto: UpdateDocDto,
    @Req() req: { user: { userId: string } },
  ) {
    return this.docs.update('putyovka', id, dto, req.user.userId);
  }

  @Delete('putyovkalar/:id')
  deletePutyovka(@Param('id') id: string) {
    return this.docs.remove('putyovka', id);
  }

  @Get('tirlar')
  tirs(@Query('q') q?: string, @Query('filter') filter?: string) {
    return this.docs.list('tir', q, filter);
  }

  @Post('tirlar')
  createTir(
    @Body() dto: CreateDocDto,
    @Req() req: { user: { userId: string } },
  ) {
    return this.docs.create('tir', dto, req.user.userId);
  }

  @Patch('tirlar/:id')
  updateTir(
    @Param('id') id: string,
    @Body() dto: UpdateDocDto,
    @Req() req: { user: { userId: string } },
  ) {
    return this.docs.update('tir', id, dto, req.user.userId);
  }

  @Delete('tirlar/:id')
  deleteTir(@Param('id') id: string) {
    return this.docs.remove('tir', id);
  }

  @Get('dazvollar')
  dazvols(@Query('q') q?: string, @Query('filter') filter?: string) {
    return this.docs.list('dazvol', q, filter);
  }

  @Post('dazvollar')
  createDazvol(
    @Body() dto: CreateDocDto,
    @Req() req: { user: { userId: string } },
  ) {
    return this.docs.create('dazvol', dto, req.user.userId);
  }

  @Patch('dazvollar/:id')
  updateDazvol(
    @Param('id') id: string,
    @Body() dto: UpdateDocDto,
    @Req() req: { user: { userId: string } },
  ) {
    return this.docs.update('dazvol', id, dto, req.user.userId);
  }

  @Delete('dazvollar/:id')
  deleteDazvol(@Param('id') id: string) {
    return this.docs.remove('dazvol', id);
  }

  @Get('litsenziyalar')
  licenses(@Query('q') q?: string, @Query('filter') filter?: string) {
    return this.docs.list('license', q, filter);
  }

  @Post('litsenziyalar')
  createLicense(
    @Body() dto: CreateDocDto,
    @Req() req: { user: { userId: string } },
  ) {
    return this.docs.create('license', dto, req.user.userId);
  }

  @Patch('litsenziyalar/:id')
  updateLicense(
    @Param('id') id: string,
    @Body() dto: UpdateDocDto,
    @Req() req: { user: { userId: string } },
  ) {
    return this.docs.update('license', id, dto, req.user.userId);
  }

  @Delete('litsenziyalar/:id')
  deleteLicense(@Param('id') id: string) {
    return this.docs.remove('license', id);
  }

  @Get('ijara')
  rentals(@Query('q') q?: string, @Query('filter') filter?: string) {
    return this.docs.list('rental', q, filter);
  }

  @Post('ijara')
  createRental(
    @Body() dto: CreateDocDto,
    @Req() req: { user: { userId: string } },
  ) {
    return this.docs.create('rental', dto, req.user.userId);
  }

  @Patch('ijara/:id')
  updateRental(
    @Param('id') id: string,
    @Body() dto: UpdateDocDto,
    @Req() req: { user: { userId: string } },
  ) {
    return this.docs.update('rental', id, dto, req.user.userId);
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
