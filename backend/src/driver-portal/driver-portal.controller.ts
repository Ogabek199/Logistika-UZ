import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Response } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles, RolesGuard } from '../auth/roles.guard';
import { DriverPortalService } from './driver-portal.service';
import { DoverennostDto } from '../drivers/dto/doverennost.dto';

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

@Controller('driver')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('DRIVER')
export class DriverPortalController {
  constructor(private readonly portal: DriverPortalService) {}

  @Get('portal')
  portalData(@Req() req: { user: { userId: string } }) {
    return this.portal.getPortal(req.user.userId);
  }

  @Get('telegram-link')
  telegramLink(@Req() req: { user: { userId: string } }) {
    return this.portal.getTelegramLink(req.user.userId);
  }

  @Get('blanka')
  async blanka(@Req() req: { user: { userId: string } }, @Res() res: Response) {
    const file = await this.portal.generateBlanka(req.user.userId);
    sendFile(res, { ...file, mime: PDF_MIME });
  }

  @Get('blanka/docx')
  async blankaDocx(
    @Req() req: { user: { userId: string } },
    @Res() res: Response,
  ) {
    const file = await this.portal.generateBlankaDocx(req.user.userId);
    sendFile(res, { ...file, mime: DOCX_MIME });
  }

  @Post('blanka')
  async blankaPost(
    @Req() req: { user: { userId: string } },
    @Body() dto: DoverennostDto,
    @Res() res: Response,
  ) {
    const file = await this.portal.generateBlanka(req.user.userId, dto);
    sendFile(res, { ...file, mime: PDF_MIME });
  }

  @Post('blanka/docx')
  async blankaDocxPost(
    @Req() req: { user: { userId: string } },
    @Body() dto: DoverennostDto,
    @Res() res: Response,
  ) {
    const file = await this.portal.generateBlankaDocx(req.user.userId, dto);
    sendFile(res, { ...file, mime: DOCX_MIME });
  }

  @Post('doverennost')
  async doverennost(
    @Req() req: { user: { userId: string } },
    @Body() dto: DoverennostDto,
    @Res() res: Response,
  ) {
    const file = await this.portal.generateDoverennost(req.user.userId, dto);
    sendFile(res, { ...file, mime: PDF_MIME });
  }

  @Post('doverennost/docx')
  async doverennostDocx(
    @Req() req: { user: { userId: string } },
    @Body() dto: DoverennostDto,
    @Res() res: Response,
  ) {
    const file = await this.portal.generateDoverennostDocx(
      req.user.userId,
      dto,
    );
    sendFile(res, { ...file, mime: DOCX_MIME });
  }
}
