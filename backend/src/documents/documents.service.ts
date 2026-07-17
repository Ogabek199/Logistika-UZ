import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateDocDto,
  CreateExpenseDto,
  UpdateDocDto,
} from './dto/document.dto';

type DocKind = 'putyovka' | 'tir' | 'dazvol' | 'license' | 'rental';

function debt(price: number, paid: number) {
  return Math.max(0, price - paid);
}

function parseDate(v?: string | null) {
  return v ? new Date(v) : null;
}

@Injectable()
export class DocumentsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(kind: DocKind, q?: string) {
    const items = await this.delegate(kind).findMany({
      orderBy: { createdAt: 'desc' },
      include: { driver: true },
    });

    const mapped = items.map((item: any) => ({
      ...item,
      debt: debt(item.price, item.paid),
      driverName: item.driver?.fullName,
      driverPhone: item.driver?.phone,
    }));

    if (!q?.trim()) return mapped;
    const s = q.toLowerCase();
    return mapped.filter((item: any) =>
      JSON.stringify(item).toLowerCase().includes(s),
    );
  }

  async create(kind: DocKind, dto: CreateDocDto) {
    const driver = await this.prisma.driver.findUnique({
      where: { id: dto.driverId },
    });
    if (!driver) throw new NotFoundException('Haydovchi topilmadi');

    const base = {
      driverId: dto.driverId,
      price: dto.price,
      paid: dto.paid ?? 0,
      startDate: parseDate(dto.startDate),
      endDate: parseDate(dto.endDate),
      note: dto.note || null,
      status: dto.status || 'ACTIVE',
    };

    if (kind === 'putyovka') {
      return this.prisma.putyovka.create({
        data: {
          ...base,
          trailerNo: dto.trailerNo || null,
          code: dto.code || null,
          months: dto.months ?? null,
        },
      });
    }
    if (kind === 'tir') {
      return this.prisma.tir.create({
        data: {
          ...base,
          tirNumber: dto.tirNumber || null,
          months: dto.months ?? null,
        },
      });
    }
    if (kind === 'dazvol') {
      return this.prisma.dazvol.create({
        data: {
          ...base,
          country: dto.country || null,
          dazvolNumber: dto.dazvolNumber || null,
        },
      });
    }
    if (kind === 'license') {
      return this.prisma.license.create({
        data: {
          ...base,
          licenseNumber: dto.licenseNumber || null,
        },
      });
    }
    return this.prisma.rental.create({
      data: {
        ...base,
        address: dto.address || null,
      },
    });
  }

  async update(kind: DocKind, id: string, dto: UpdateDocDto) {
    await this.ensure(kind, id);
    const data: Record<string, unknown> = {};
    if (dto.driverId !== undefined) data.driverId = dto.driverId;
    if (dto.price !== undefined) data.price = dto.price;
    if (dto.paid !== undefined) data.paid = dto.paid;
    if (dto.startDate !== undefined) data.startDate = parseDate(dto.startDate);
    if (dto.endDate !== undefined) data.endDate = parseDate(dto.endDate);
    if (dto.note !== undefined) data.note = dto.note;
    if (dto.status !== undefined) data.status = dto.status;
    if (dto.months !== undefined) data.months = dto.months;
    if (dto.trailerNo !== undefined) data.trailerNo = dto.trailerNo;
    if (dto.code !== undefined) data.code = dto.code;
    if (dto.tirNumber !== undefined) data.tirNumber = dto.tirNumber;
    if (dto.country !== undefined) data.country = dto.country;
    if (dto.dazvolNumber !== undefined) data.dazvolNumber = dto.dazvolNumber;
    if (dto.licenseNumber !== undefined) data.licenseNumber = dto.licenseNumber;
    if (dto.address !== undefined) data.address = dto.address;

    return this.delegate(kind).update({ where: { id }, data });
  }

  async remove(kind: DocKind, id: string) {
    await this.ensure(kind, id);
    await this.delegate(kind).delete({ where: { id } });
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

  private delegate(kind: DocKind): any {
    const map = {
      putyovka: this.prisma.putyovka,
      tir: this.prisma.tir,
      dazvol: this.prisma.dazvol,
      license: this.prisma.license,
      rental: this.prisma.rental,
    };
    return map[kind];
  }

  private async ensure(kind: DocKind, id: string) {
    const item = await this.delegate(kind).findUnique({ where: { id } });
    if (!item) throw new NotFoundException('Hujjat topilmadi');
  }
}
