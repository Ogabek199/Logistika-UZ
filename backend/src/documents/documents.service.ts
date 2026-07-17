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
    if (dto.months !== undefined) data.months = dto.months;
    if (dto.trailerNo !== undefined) data.trailerNo = dto.trailerNo;
    if (dto.code !== undefined) data.code = dto.code;
    if (dto.tirNumber !== undefined) data.tirNumber = dto.tirNumber;
    if (dto.country !== undefined) data.country = dto.country;
    if (dto.dazvolNumber !== undefined) data.dazvolNumber = dto.dazvolNumber;
    if (dto.licenseNumber !== undefined) data.licenseNumber = dto.licenseNumber;
    if (dto.address !== undefined) data.address = dto.address;

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
            note: dto.note || null,
          },
        });
      }

      return updated;
    });
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
