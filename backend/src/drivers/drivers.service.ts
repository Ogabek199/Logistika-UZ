import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { CreateDriverDto, UpdateDriverDto } from './dto/driver.dto';
import { DoverennostDto } from './dto/doverennost.dto';
import { TelegramService } from '../telegram/telegram.service';
import { TelegramMessageDto } from './dto/telegram.dto';
import { renderDocx, formatRuDate, docxToPdf } from '../documents/docx.util';

const NAME_SOURCES = [
  /KARIMOV\s+BEKZOD\s+MAMURJONOVICH/g,
  /Aliev\s+Mukhammadrizo\s+Ahrorjon\s+Ugli/g,
];

/** Blanka11 qizil sanalar: «09»07.2026 */
function formatBlankaDate(iso?: string | null): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  return `«${dd}»${mm}.${d.getFullYear()}`;
}

function formatDotDate(iso?: string | null): string | null {
  if (!iso) return null;
  // already dd.MM.yyyy
  if (/^\d{2}\.\d{2}\.\d{4}$/.test(iso.trim())) return iso.trim();
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  return `${dd}.${mm}.${d.getFullYear()}`;
}

function contractNo(iso?: string | null): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  return `${mm}/${d.getFullYear()}`;
}

function blankaRegionPhrase(region: string) {
  const r = region.trim();
  if (/область|г\.|Республик/i.test(r)) return r;
  return `${r} область`;
}

function normalizePhone(input: string): string {
  const digits = input.replace(/\D/g, '');
  if (digits.startsWith('998') && digits.length === 12) return `+${digits}`;
  if (digits.length === 9) return `+998${digits}`;
  if (input.trim().startsWith('+') && digits.length >= 12) return `+${digits}`;
  return `+${digits}`;
}

function debt(price: number, paid: number) {
  return Math.max(0, price - paid);
}

const DOC_SELECT = {
  price: true,
  paid: true,
  driverId: true,
  status: true,
} as const;

function mapDriverRow(d: {
  id: string;
  fullName: string;
  phone: string;
  vehicle: string | null;
  plateNumber: string | null;
  trailer: string | null;
  trailerNo: string | null;
  passportSeries: string | null;
  createdAt: Date;
  putyovkas: Array<{ price: number; paid: number }>;
  tirs: Array<{ price: number; paid: number }>;
  dazvols: Array<{ price: number; paid: number }>;
  licenses: Array<{ price: number; paid: number }>;
  rentals: Array<{ price: number; paid: number }>;
}) {
  const docs = [
    ...d.putyovkas,
    ...d.tirs,
    ...d.dazvols,
    ...d.licenses,
    ...d.rentals,
  ];
  const totalDebt = docs.reduce((s, x) => s + debt(x.price, x.paid), 0);
  const totalPaid = docs.reduce((s, x) => s + x.paid, 0);
  return {
    id: d.id,
    fullName: d.fullName,
    phone: d.phone,
    vehicle: d.vehicle,
    plateNumber: d.plateNumber,
    trailer: d.trailer,
    trailerNo: d.trailerNo,
    passportSeries: d.passportSeries,
    createdAt: d.createdAt,
    totalDebt,
    totalPaid,
    docsCount: docs.length,
  };
}

function buildWhere(q?: string) {
  return q
    ? {
        OR: [
          { fullName: { contains: q } },
          { phone: { contains: q.replace(/\s/g, '') } },
          { vehicle: { contains: q } },
          { plateNumber: { contains: q } },
          { trailer: { contains: q } },
          { trailerNo: { contains: q } },
        ],
      }
    : {};
}

function maskChatId(chatId: string | null) {
  if (!chatId) return null;
  if (chatId.length <= 5) return '***';
  return `${chatId.slice(0, 3)}…${chatId.slice(-2)}`;
}

function escapeHtml(s: string) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function telegramHeader(now = new Date()) {
  const parts = new Intl.DateTimeFormat('uz-UZ', {
    timeZone: 'Asia/Tashkent',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(now);

  const get = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((p) => p.type === type)?.value || '';

  const date = `${get('day')}.${get('month')}.${get('year')}`;
  const time = `${get('hour')}:${get('minute')}`;

  return [`📢 <b>OOO "MUSFIRA SAVDO TRANS"</b>`, `📅 ${date}  🕐 ${time}`, ''].join('\n');
}

@Injectable()
export class DriversService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly telegram: TelegramService,
  ) {}

  async getStats() {
    const [driverCount, putyovkas, tirs, dazvols, licenses, rentals] =
      await Promise.all([
        this.prisma.driver.count(),
        this.prisma.putyovka.findMany({ select: DOC_SELECT }),
        this.prisma.tir.findMany({ select: DOC_SELECT }),
        this.prisma.dazvol.findMany({ select: DOC_SELECT }),
        this.prisma.license.findMany({ select: DOC_SELECT }),
        this.prisma.rental.findMany({ select: DOC_SELECT }),
      ]);

    const allDocs = [
      ...putyovkas,
      ...tirs,
      ...dazvols,
      ...licenses,
      ...rentals,
    ];
    const activeDriverIds = new Set<string>();
    let totalPaid = 0;
    let totalDebt = 0;

    for (const doc of allDocs) {
      totalPaid += doc.paid;
      totalDebt += debt(doc.price, doc.paid);
      if (doc.status === 'ACTIVE') activeDriverIds.add(doc.driverId);
    }

    return {
      totalDrivers: driverCount,
      totalDocs: allDocs.length,
      totalPaid,
      totalDebt,
      activeDrivers: activeDriverIds.size,
    };
  }

  async findAll(q?: string, page?: number, limit?: number) {
    const where = buildWhere(q);
    const include = {
      putyovkas: true,
      tirs: true,
      dazvols: true,
      licenses: true,
      rentals: true,
    } as const;

    if (page === undefined) {
      const drivers = await this.prisma.driver.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        include,
      });
      return drivers.map(mapDriverRow);
    }

    const safePage = Math.max(1, page);
    const safeLimit = Math.min(100, Math.max(1, limit ?? 20));
    const skip = (safePage - 1) * safeLimit;

    const [total, drivers, stats] = await Promise.all([
      this.prisma.driver.count({ where }),
      this.prisma.driver.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: safeLimit,
        include,
      }),
      this.getStats(),
    ]);

    return {
      stats,
      items: drivers.map(mapDriverRow),
      total,
      page: safePage,
      limit: safeLimit,
      totalPages: Math.max(1, Math.ceil(total / safeLimit)),
    };
  }

  async findOne(id: string) {
    const d = await this.prisma.driver.findUnique({
      where: { id },
      include: {
        putyovkas: { orderBy: { createdAt: 'desc' } },
        tirs: { orderBy: { createdAt: 'desc' } },
        dazvols: { orderBy: { createdAt: 'desc' } },
        licenses: { orderBy: { createdAt: 'desc' } },
        rentals: { orderBy: { createdAt: 'desc' } },
        expenses: { orderBy: { date: 'desc' } },
      },
    });
    if (!d) throw new NotFoundException('Haydovchi topilmadi');

    const withDebt = <T extends { price: number; paid: number }>(items: T[]) =>
      items.map((x) => ({ ...x, debt: debt(x.price, x.paid) }));

    return {
      id: d.id,
      fullName: d.fullName,
      phone: d.phone,
      vehicle: d.vehicle,
      plateNumber: d.plateNumber,
      trailer: d.trailer,
      trailerNo: d.trailerNo,
      passportSeries: d.passportSeries,
      telegramChatId: d.telegramChatId,
      telegramLinkedAt: d.telegramLinkedAt,
      createdAt: d.createdAt,
      putyovkas: withDebt(d.putyovkas),
      tirs: withDebt(d.tirs),
      dazvols: withDebt(d.dazvols),
      licenses: withDebt(d.licenses),
      rentals: withDebt(d.rentals),
      expenses: d.expenses,
    };
  }

  async create(dto: CreateDriverDto) {
    const phone = normalizePhone(dto.phone);
    const exists = await this.prisma.driver.findUnique({ where: { phone } });
    if (exists) throw new BadRequestException('Bu telefon band');

    const telegramChatId = dto.telegramChatId?.trim() || null;

    return this.prisma.driver.create({
      data: {
        fullName: dto.fullName.trim(),
        phone,
        vehicle: dto.vehicle?.trim() || null,
        plateNumber: dto.plateNumber?.trim() || null,
        trailer: dto.trailer?.trim() || null,
        trailerNo: dto.trailerNo?.trim() || null,
        passportSeries: dto.passportSeries?.trim() || null,
        telegramChatId,
        telegramLinkedAt: telegramChatId ? new Date() : null,
        passwordHash: await bcrypt.hash(dto.password, 10),
      },
    });
  }

  async update(id: string, dto: UpdateDriverDto) {
    await this.ensure(id);
    const data: Record<string, unknown> = {};
    if (dto.fullName !== undefined) data.fullName = dto.fullName.trim();
    if (dto.phone !== undefined) {
      const phone = normalizePhone(dto.phone);
      const exists = await this.prisma.driver.findFirst({
        where: { phone, NOT: { id } },
      });
      if (exists) throw new BadRequestException('Bu telefon band');
      data.phone = phone;
    }
    if (dto.vehicle !== undefined) data.vehicle = dto.vehicle.trim() || null;
    if (dto.plateNumber !== undefined)
      data.plateNumber = dto.plateNumber.trim() || null;
    if (dto.trailer !== undefined) data.trailer = dto.trailer.trim() || null;
    if (dto.trailerNo !== undefined)
      data.trailerNo = dto.trailerNo.trim() || null;
    if (dto.passportSeries !== undefined)
      data.passportSeries = dto.passportSeries.trim() || null;
    if (dto.telegramChatId !== undefined) {
      const telegramChatId = dto.telegramChatId.trim() || null;
      data.telegramChatId = telegramChatId;
      data.telegramLinkedAt = telegramChatId ? new Date() : null;
    }
    if (dto.password) data.passwordHash = await bcrypt.hash(dto.password, 10);

    return this.prisma.driver.update({ where: { id }, data });
  }

  async remove(id: string) {
    await this.ensure(id);
    await this.prisma.driver.delete({ where: { id } });
    return { ok: true };
  }

  private async ensure(id: string) {
    const d = await this.prisma.driver.findUnique({ where: { id } });
    if (!d) throw new NotFoundException('Haydovchi topilmadi');
  }

  async generateBlanka(id: string, dto: DoverennostDto = {}) {
    const { buffer, filename } = await this.buildBlanka(id, dto);
    const pdf = await docxToPdf(buffer);
    return { buffer: pdf, filename: filename.replace(/\.docx$/i, '.pdf') };
  }

  async generateBlankaDocx(id: string, dto: DoverennostDto = {}) {
    return this.buildBlanka(id, dto);
  }

  private async buildBlanka(id: string, dto: DoverennostDto = {}) {
    const driver = await this.prisma.driver.findUnique({ where: { id } });
    if (!driver) throw new NotFoundException('Haydovchi topilmadi');

    const fullName = [
      dto.lastName?.trim(),
      dto.firstName?.trim(),
      dto.patronymic?.trim(),
    ]
      .filter(Boolean)
      .join(' ')
      .trim() || driver.fullName;

    const textRules: Array<{ find: RegExp; replace: string }> = NAME_SOURCES.map(
      (find) => ({
        find,
        replace: fullName,
      }),
    );

    const passport = (dto.passport || driver.passportSeries || '').trim();
    if (passport) {
      textRules.push({
        find: /F\s*A\s*9316362/g,
        replace: passport,
      });
    }

    const issued = formatDotDate(dto.passportIssued);
    if (issued) {
      textRules.push({ find: /15\.03\.2024/g, replace: issued });
    }

    const start = formatBlankaDate(dto.startDate);
    const end = formatBlankaDate(dto.endDate);
    if (start) {
      textRules.push({ find: /«\s*09\s*»\s*07\s*\.\s*2026/g, replace: start });
    }
    if (end) {
      textRules.push({ find: /«\s*09\s*»\s*07\s*\.\s*2028/g, replace: end });
    }

    const no = contractNo(dto.startDate);
    if (no) {
      textRules.push({ find: /09\s*\/\s*2026/g, replace: no });
    }

    // Kompaniya manzili (qora) saqlanadi; haydovchi viloyati (qizil) almashtiriladi
    const region = dto.region?.trim();
    const seqRules = region
      ? [
          {
            find: /Ферганская\s*область/g,
            values: [
              'Ферганская область',
              blankaRegionPhrase(region),
              'Ферганская область',
              blankaRegionPhrase(region),
            ],
          },
        ]
      : [];

    const docx = renderDocx('blanka.docx', textRules, seqRules, {
      forceBlackText: true,
      stripTrailingEmpty: true,
    });
    return {
      buffer: docx,
      filename: this.fileName('Blanka', fullName, 'docx'),
    };
  }

  async generateDoverennost(id: string, dto: DoverennostDto) {
    const { buffer, filename } = await this.buildDoverennost(id, dto);
    const pdf = await docxToPdf(buffer);
    return { buffer: pdf, filename: filename.replace(/\.docx$/i, '.pdf') };
  }

  async generateDoverennostDocx(id: string, dto: DoverennostDto) {
    return this.buildDoverennost(id, dto);
  }

  private async buildDoverennost(id: string, dto: DoverennostDto) {
    const driver = await this.prisma.driver.findUnique({ where: { id } });
    if (!driver) throw new NotFoundException('Haydovchi topilmadi');

    const fullName = [
      dto.lastName?.trim(),
      dto.firstName?.trim(),
      dto.patronymic?.trim(),
    ]
      .filter(Boolean)
      .join(' ')
      .trim() || driver.fullName;

    const textRules = NAME_SOURCES.map((find) => ({
      find,
      replace: fullName,
    }));

    const passport = (dto.passport || driver.passportSeries || '').trim();
    if (passport) {
      textRules.push({
        find: /F\s*A\s*(?:9316362|6125397)/g,
        replace: passport,
      });
    }

    const region = dto.region?.trim();
    if (region) {
      textRules.push({ find: /Ферганский/g, replace: region });
    }

    if (driver.vehicle?.trim() || driver.plateNumber?.trim()) {
      const truck = [driver.vehicle?.trim(), driver.plateNumber?.trim()]
        .filter(Boolean)
        .join(' ');
      textRules.push({ find: /DAF FT XF 40D545RA/g, replace: truck });
    }

    const trailer = driver.trailer?.trim() || null;
    const trailerNo = driver.trailerNo?.trim() || null;
    if (trailer && trailerNo) {
      textRules.push({
        find: /KOEGEL\s*40\s*9787AA/g,
        replace: `${trailer} ${trailerNo}`,
      });
    } else if (trailer || trailerNo) {
      textRules.push({
        find: /KOEGEL\s*40\s*9787AA/g,
        replace: (trailer || trailerNo)!,
      });
    }

    const start = formatRuDate(dto.startDate);
    const end = formatRuDate(dto.endDate);
    const seqRules =
      start && end
        ? [
            {
              find: /«\s*\d{1,2}\s*»\s*\d{1,2}\s*\.\s*20\d{2}/g,
              values: [start, end],
            },
          ]
        : [];

    const docx = renderDocx('doverennost.docx', textRules, seqRules);
    return {
      buffer: docx,
      filename: this.fileName('Doverennost', fullName, 'docx'),
    };
  }

  async getTelegramLink(id: string) {
    const driver = await this.telegram.ensureLinkToken(id);
    return {
      url: this.telegram.getLinkUrl(driver.telegramLinkToken!),
      linked: Boolean(driver.telegramChatId),
      chatIdMasked: maskChatId(driver.telegramChatId),
      linkedAt: driver.telegramLinkedAt,
    };
  }

  async sendTelegram(id: string, dto: TelegramMessageDto) {
    const driver = await this.prisma.driver.findUnique({ where: { id } });
    if (!driver) throw new NotFoundException('Haydovchi topilmadi');
    if (!driver.telegramChatId) {
      throw new BadRequestException(
        'Telegram bog‘lanmagan. Avval havola orqali bog‘lang.',
      );
    }

    const template = dto.template || (dto.message?.trim() ? 'custom' : 'debt');
    let body: string;

    if (template === 'custom') {
      const message = dto.message?.trim();
      if (!message) {
        throw new BadRequestException('Xabar matni bo‘sh');
      }
      body = message;
    } else {
      const docs = await this.prisma.driver.findUnique({
        where: { id },
        include: {
          putyovkas: true,
          tirs: true,
          dazvols: true,
          licenses: true,
          rentals: true,
        },
      });
      const allDocs = [
        ...(docs?.putyovkas || []),
        ...(docs?.tirs || []),
        ...(docs?.dazvols || []),
        ...(docs?.licenses || []),
        ...(docs?.rentals || []),
      ];
      const totalDebt = allDocs.reduce((s, x) => s + debt(x.price, x.paid), 0);

      body = [
        `<b>${escapeHtml(driver.fullName)}</b>`,
        `Telefon: ${driver.phone}`,
        `Jami qarz: ${totalDebt.toLocaleString('uz-UZ')} so'm`,
      ].join('\n');
    }

    const text = [telegramHeader(), body, '', 'OOO "MUSFIRA SAVDO TRANS"'].join('\n');
    return this.telegram.sendMessage(driver.telegramChatId, text);
  }

  private fileName(prefix: string, fullName: string, ext = 'pdf') {
    const slug = fullName
      .trim()
      .replace(/[^\p{L}\p{N}]+/gu, '_')
      .replace(/^_+|_+$/g, '');
    return `${prefix}_${slug || 'haydovchi'}.${ext}`;
  }
}
