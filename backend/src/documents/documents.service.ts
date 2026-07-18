import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateDocDto,
  CreateExpenseDto,
  UpdateDocDto,
} from './dto/document.dto';
import { renderDocx } from './docx.util';

type DocKind = 'putyovka' | 'tir' | 'dazvol' | 'license' | 'rental';

function debt(price: number, paid: number) {
  return Math.max(0, price - paid);
}

function parseDate(v?: string | null) {
  return v ? new Date(v) : null;
}

function fileName(prefix: string, fullName: string, ext = 'docx') {
  const slug = fullName
    .trim()
    .replace(/[^\p{L}\p{N}]+/gu, '_')
    .replace(/^_+|_+$/g, '');
  return `${prefix}_${slug || 'haydovchi'}.${ext}`;
}

@Injectable()
export class DocumentsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(kind: DocKind, q?: string, filter?: string) {
    const items = await this.delegate(kind).findMany({
      orderBy: { createdAt: 'desc' },
      include: { driver: true },
    });

    let mapped = items.map((item: any) => ({
      ...item,
      debt: debt(item.price, item.paid),
      driverName: item.driver?.fullName,
      driverPhone: item.driver?.phone,
      driverId: item.driver?.id,
      driverVehicle: item.driver?.vehicle,
      driverPlateNumber: item.driver?.plateNumber,
      driverTrailer: item.driver?.trailer,
      driverTrailerNo: item.driver?.trailerNo,
    }));

    if (filter === 'active') {
      mapped = mapped.filter((item: any) => item.status === 'ACTIVE');
    } else if (filter === 'finished') {
      mapped = mapped.filter((item: any) => item.status === 'FINISHED');
    } else if (filter === 'debtor') {
      mapped = mapped.filter((item: any) => item.debt > 0);
    }

    if (!q?.trim()) return mapped;
    const s = q.toLowerCase();
    return mapped.filter((item: any) =>
      JSON.stringify(item).toLowerCase().includes(s),
    );
  }

  async create(kind: DocKind, dto: CreateDocDto, adminId?: string) {
    const driver = await this.prisma.driver.findUnique({
      where: { id: dto.driverId },
    });
    if (!driver) throw new NotFoundException('Haydovchi topilmadi');

    const paid = dto.paid ?? 0;
    const base = {
      driverId: dto.driverId,
      price: dto.price,
      paid,
      startDate: parseDate(dto.startDate),
      endDate: parseDate(dto.endDate),
      note: dto.note || null,
      status: dto.status || 'ACTIVE',
    };

    return this.prisma.$transaction(async (tx) => {
      let created: { id: string; driverId: string; paid: number };
      if (kind === 'putyovka') {
        created = await tx.putyovka.create({
          data: {
            ...base,
            trailerNo: dto.trailerNo || null,
            code: dto.code || null,
            months: dto.months ?? null,
          },
        });
      } else if (kind === 'tir') {
        created = await tx.tir.create({
          data: {
            ...base,
            tirNumber: dto.tirNumber || null,
            months: dto.months ?? null,
          },
        });
      } else if (kind === 'dazvol') {
        created = await tx.dazvol.create({
          data: {
            ...base,
            country: dto.country || null,
            dazvolNumber: dto.dazvolNumber || null,
          },
        });
      } else if (kind === 'license') {
        created = await tx.license.create({
          data: {
            ...base,
            licenseNumber: dto.licenseNumber || null,
          },
        });
      } else {
        created = await tx.rental.create({
          data: {
            ...base,
            address: dto.address || null,
          },
        });
      }

      if (paid > 0) {
        await tx.payment.create({
          data: {
            driverId: created.driverId,
            adminId: adminId || null,
            documentKind: kind,
            documentId: created.id,
            amount: paid,
            note: dto.note || null,
          },
        });
      }

      return created;
    });
  }

  async update(kind: DocKind, id: string, dto: UpdateDocDto, adminId?: string) {
    const existing = await this.ensure(kind, id);
    const data: Record<string, unknown> = {};
    if (dto.driverId !== undefined) data.driverId = dto.driverId;
    if (dto.price !== undefined) data.price = dto.price;
    if (dto.paid !== undefined) data.paid = dto.paid;
    if (dto.startDate !== undefined) data.startDate = parseDate(dto.startDate);
    if (dto.endDate !== undefined) data.endDate = parseDate(dto.endDate);
    if (dto.note !== undefined) data.note = dto.note;
    if (dto.status !== undefined) data.status = dto.status;

    if (kind === 'putyovka') {
      if (dto.months !== undefined) data.months = dto.months;
      if (dto.trailerNo !== undefined) data.trailerNo = dto.trailerNo;
      if (dto.code !== undefined) data.code = dto.code;
    } else if (kind === 'tir') {
      if (dto.months !== undefined) data.months = dto.months;
      if (dto.tirNumber !== undefined) data.tirNumber = dto.tirNumber;
    } else if (kind === 'dazvol') {
      if (dto.country !== undefined) data.country = dto.country;
      if (dto.dazvolNumber !== undefined) data.dazvolNumber = dto.dazvolNumber;
    } else if (kind === 'license') {
      if (dto.licenseNumber !== undefined) data.licenseNumber = dto.licenseNumber;
    } else if (kind === 'rental') {
      if (dto.address !== undefined) data.address = dto.address;
    }

    const paidDelta =
      dto.paid !== undefined ? Number(dto.paid) - Number(existing.paid) : 0;

    return this.prisma.$transaction(async (tx) => {
      const updated = await this.delegate(kind, tx).update({
        where: { id },
        data,
      });

      if (paidDelta > 0) {
        await tx.payment.create({
          data: {
            driverId: updated.driverId,
            adminId: adminId || null,
            documentKind: kind,
            documentId: updated.id,
            amount: paidDelta,
            note: dto.paymentNote?.trim() || null,
          },
        });
      }

      return updated;
    });
  }

  async remove(kind: DocKind, id: string) {
    await this.ensure(kind, id);
    await this.prisma.$transaction(async (tx) => {
      await tx.payment.deleteMany({
        where: { documentId: id, documentKind: kind },
      });
      await this.delegate(kind, tx).delete({ where: { id } });
    });
    return { ok: true };
  }

  async listExpenses(q?: string) {
    const items = await this.prisma.expense.findMany({
      orderBy: { date: 'desc' },
      include: { driver: true },
    });
    const mapped = items.map((e) => ({
      ...e,
      driverName: e.driver?.fullName || null,
    }));
    if (!q?.trim()) return mapped;
    const s = q.toLowerCase();
    return mapped.filter((e) => JSON.stringify(e).toLowerCase().includes(s));
  }

  async createExpense(dto: CreateExpenseDto, adminId?: string) {
    if (dto.driverId) {
      const d = await this.prisma.driver.findUnique({
        where: { id: dto.driverId },
      });
      if (!d) throw new NotFoundException('Haydovchi topilmadi');
    }
    return this.prisma.expense.create({
      data: {
        driverId: dto.driverId || null,
        adminId: adminId || null,
        type: dto.type,
        amount: dto.amount,
        note: dto.note || null,
        date: dto.date ? new Date(dto.date) : new Date(),
      },
    });
  }

  async removeExpense(id: string) {
    const e = await this.prisma.expense.findUnique({ where: { id } });
    if (!e) throw new NotFoundException('Chiqim topilmadi');
    await this.prisma.expense.delete({ where: { id } });
    return { ok: true };
  }

  async generatePutyovkaDocx(id: string) {
    const putyovka = await this.prisma.putyovka.findUnique({
      where: { id },
      include: { driver: true },
    });
    if (!putyovka) throw new NotFoundException('Putyovka topilmadi');

    const driver = putyovka.driver;
    const textRules: Array<{ find: RegExp; replace: string }> = [];

    const pad2 = (n: number) => String(n).padStart(2, '0');
    const today = new Date(
      new Date().toLocaleString('en-US', { timeZone: 'Asia/Tashkent' }),
    );
    const next = new Date(today);
    next.setMonth(next.getMonth() + 1);

    const d1 = pad2(today.getDate());
    const m1 = pad2(today.getMonth() + 1);
    const y1 = String(today.getFullYear());
    const d2 = pad2(next.getDate());
    const m2 = pad2(next.getMonth() + 1);
    const y2 = String(next.getFullYear());

    // Ikki qator: "18.07.2026" / "18.08.2026"
    textRules.push({
      find: /07 {18}11\s+2025г\s*/g,
      replace: `${d1}.${m1}.${y1}`,
    });
    textRules.push({
      find: /06 {16}122025/g,
      replace: `${d2}.${m2}.${y2}`,
    });
    // Jadvaldagi "Выезд из гар" — Число / Месяц
    textRules.push({
      find: /(?<=Выезд из гар)07/g,
      replace: d1,
    });
    textRules.push({
      find: /(?<=Выезд из гар07)11/g,
      replace: m1,
    });

    if (driver.fullName?.trim()) {
      textRules.push({
        find: /Джуманбаев\s*А/g,
        replace: driver.fullName.trim(),
      });
    }

    if (driver.vehicle?.trim()) {
      textRules.push({
        find: /DAF\s+/g,
        replace: `${driver.vehicle.trim()} `,
      });
    }

    if (driver.plateNumber?.trim()) {
      textRules.push({
        find: /40[\s\u00a0]*D\s*545\s*RA/g,
        replace: driver.plateNumber.trim(),
      });
    }

    const trailer = driver.trailer?.trim() || null;
    const trailerNo =
      driver.trailerNo?.trim() || putyovka.trailerNo?.trim() || null;

    if (trailer && trailerNo) {
      textRules.push({
        find: /KOEGEL\s*№\s*40\s*9787\s*AA/g,
        replace: `${trailer} № ${trailerNo}`,
      });
    } else if (trailer) {
      textRules.push({ find: /KOEGEL/g, replace: trailer });
      if (trailerNo) {
        textRules.push({
          find: /40\s*9787\s*AA/g,
          replace: trailerNo,
        });
      }
    } else if (trailerNo) {
      textRules.push({
        find: /KOEGEL\s*№\s*40\s*9787\s*AA/g,
        replace: trailerNo,
      });
    }

    if (putyovka.code?.trim()) {
      textRules.push({
        find: /ПУТЕВОЙ ЛИСТ\s*№\s*11/g,
        replace: `ПУТЕВОЙ ЛИСТ  № ${putyovka.code.trim()}`,
      });
    }

    const buffer = renderDocx('putyovka.docx', textRules, [], {
      forceBlackText: true,
    });
    return {
      buffer,
      filename: fileName('Putyovka', driver.fullName, 'docx'),
    };
  }

  private delegate(kind: DocKind, client: any = this.prisma): any {
    const map = {
      putyovka: client.putyovka,
      tir: client.tir,
      dazvol: client.dazvol,
      license: client.license,
      rental: client.rental,
    };
    return map[kind];
  }

  private async ensure(kind: DocKind, id: string) {
    const item = await this.delegate(kind).findUnique({ where: { id } });
    if (!item) throw new NotFoundException('Hujjat topilmadi');
    return item as { id: string; driverId: string; paid: number };
  }
}
