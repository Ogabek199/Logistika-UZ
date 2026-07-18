import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Response } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles, RolesGuard } from '../auth/roles.guard';
import { DriversService } from './drivers.service';
import { CreateDriverDto, UpdateDriverDto } from './dto/driver.dto';
import { DoverennostDto } from './dto/doverennost.dto';
import { TelegramMessageDto } from './dto/telegram.dto';

const PDF_MIME = 'application/pdf';
const DOCX_MIME =
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

function sendFile(
  res: Response,
  {
    buffer,
    filename,
    mime,
  }: { buffer: Buffer; filename: string; mime: string },
) {
  res.set({
    'Content-Type': mime,
    'Content-Disposition': `attachment; filename="document"; filename*=UTF-8''${encodeURIComponent(
      filename,
    )}`,
    'Content-Length': String(buffer.length),
  });
  res.end(buffer);
}

function sendPdf(
  res: Response,
  { buffer, filename }: { buffer: Buffer; filename: string },
) {
  sendFile(res, { buffer, filename, mime: PDF_MIME });
}

@Controller('admin/drivers')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class DriversController {
  constructor(private readonly drivers: DriversService) {}

  @Get()
  findAll(
    @Query('q') q?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const parsedPage = page ? Number(page) : undefined;
    const parsedLimit = limit ? Number(limit) : undefined;
    return this.drivers.findAll(
      q,
      parsedPage !== undefined && !Number.isNaN(parsedPage)
        ? parsedPage
        : undefined,
      parsedLimit !== undefined && !Number.isNaN(parsedLimit)
        ? parsedLimit
        : undefined,
    );
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.drivers.findOne(id);
  }

  @Post()
  create(@Body() dto: CreateDriverDto) {
    return this.drivers.create(dto);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateDriverDto) {
    return this.drivers.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.drivers.remove(id);
  }

  @Get(':id/blanka')
  async blanka(@Param('id') id: string, @Res() res: Response) {
    sendPdf(res, await this.drivers.generateBlanka(id));
  }

  @Get(':id/blanka/docx')
  async blankaDocx(@Param('id') id: string, @Res() res: Response) {
    const file = await this.drivers.generateBlankaDocx(id);
    sendFile(res, { ...file, mime: DOCX_MIME });
  }

  @Post(':id/blanka')
  async blankaPost(
    @Param('id') id: string,
    @Body() dto: DoverennostDto,
    @Res() res: Response,
  ) {
    sendPdf(res, await this.drivers.generateBlanka(id, dto));
  }

  @Post(':id/blanka/docx')
  async blankaDocxPost(
    @Param('id') id: string,
    @Body() dto: DoverennostDto,
    @Res() res: Response,
  ) {
    const file = await this.drivers.generateBlankaDocx(id, dto);
    sendFile(res, { ...file, mime: DOCX_MIME });
  }

  @Post(':id/doverennost')
  async doverennost(
    @Param('id') id: string,
    @Body() dto: DoverennostDto,
    @Res() res: Response,
  ) {
    sendPdf(res, await this.drivers.generateDoverennost(id, dto));
  }

  @Post(':id/doverennost/docx')
  async doverennostDocx(
    @Param('id') id: string,
    @Body() dto: DoverennostDto,
    @Res() res: Response,
  ) {
    const file = await this.drivers.generateDoverennostDocx(id, dto);
    sendFile(res, { ...file, mime: DOCX_MIME });
  }

  @Get(':id/telegram-link')
  telegramLink(@Param('id') id: string) {
    return this.drivers.getTelegramLink(id);
  }

  @Post(':id/telegram')
  telegram(@Param('id') id: string, @Body() dto: TelegramMessageDto) {
    return this.drivers.sendTelegram(id, dto);
  }
}
