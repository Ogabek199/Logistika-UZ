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

const PDF_MIME = 'application/pdf';

function sendPdf(
  res: Response,
  { buffer, filename }: { buffer: Buffer; filename: string },
) {
  res.set({
    'Content-Type': PDF_MIME,
    'Content-Disposition': `attachment; filename="document.pdf"; filename*=UTF-8''${encodeURIComponent(
      filename,
    )}`,
    'Content-Length': String(buffer.length),
  });
  res.end(buffer);
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
      parsedPage !== undefined && !Number.isNaN(parsedPage) ? parsedPage : undefined,
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

  @Post(':id/doverennost')
  async doverennost(
    @Param('id') id: string,
    @Body() dto: DoverennostDto,
    @Res() res: Response,
  ) {
    sendPdf(res, await this.drivers.generateDoverennost(id, dto));
  }
}
