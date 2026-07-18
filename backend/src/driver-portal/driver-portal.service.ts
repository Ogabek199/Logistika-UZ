import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TelegramService } from '../telegram/telegram.service';
import { DriversService } from '../drivers/drivers.service';
import { DoverennostDto } from '../drivers/dto/doverennost.dto';

function debt(price: number, paid: number) {
  return Math.max(0, price - paid);
}

function daysLeft(endDate: Date | null) {
  if (!endDate) return null;
  return Math.ceil((endDate.getTime() - Date.now()) / (24 * 60 * 60 * 1000));
}

const DOC_KIND_LABEL: Record<string, string> = {
  putyovka: 'putyovka',
  tir: 'tir',
  dazvol: 'dazvol',
  license: 'license',
  rental: 'rental',
};

@Injectable()
export class DriverPortalService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly telegram: TelegramService,
    private readonly drivers: DriversService,
  ) {}

  async getPortal(driverId: string) {
    const driver = await this.prisma.driver.findUnique({
      where: { id: driverId },
      include: {
        putyovkas: { orderBy: { createdAt: 'desc' } },
        tirs: { orderBy: { createdAt: 'desc' } },
        dazvols: { orderBy: { createdAt: 'desc' } },
        licenses: { orderBy: { createdAt: 'desc' } },
        rentals: { orderBy: { createdAt: 'desc' } },
        payments: { orderBy: { createdAt: 'desc' }, take: 50 },
      },
    });
    if (!driver) throw new NotFoundException('Haydovchi topilmadi');

    const mapDoc = <
      T extends {
        id: string;
        price: number;
        paid: number;
        endDate: Date | null;
        status: string;
      },
    >(
      docs: T[],
      kind: string,
    ) =>
      docs.map((d) => ({
        ...d,
        kind,
        debt: debt(d.price, d.paid),
        daysLeft: daysLeft(d.endDate),
      }));

    const putyovkas = mapDoc(driver.putyovkas, 'putyovka');
    const tirs = mapDoc(driver.tirs, 'tir');
    const dazvols = mapDoc(driver.dazvols, 'dazvol');
    const licenses = mapDoc(driver.licenses, 'license');
    const rentals = mapDoc(driver.rentals, 'rental');

    const allDocs = [
      ...putyovkas,
      ...tirs,
      ...dazvols,
      ...licenses,
      ...rentals,
    ];

    const totalDebt = allDocs.reduce((s, d) => s + d.debt, 0);

    const expiringSoon = allDocs
      .filter(
        (d) =>
          d.status === 'ACTIVE' &&
          d.daysLeft !== null &&
          d.daysLeft >= 0 &&
          d.daysLeft <= 7,
      )
      .sort((a, b) => (a.daysLeft ?? 0) - (b.daysLeft ?? 0))
      .map((d) => ({
        id: d.id,
        kind: d.kind,
        endDate: d.endDate,
        daysLeft: d.daysLeft,
        debt: d.debt,
      }));

    const payments = driver.payments.map((p) => ({
      id: p.id,
      amount: p.amount,
      documentKind: p.documentKind,
      documentId: p.documentId,
      note: p.note,
      createdAt: p.createdAt,
      kindLabel: DOC_KIND_LABEL[p.documentKind] || p.documentKind,
    }));

    return {
      driver: {
        id: driver.id,
        fullName: driver.fullName,
        phone: driver.phone,
        vehicle: driver.vehicle,
        plateNumber: driver.plateNumber,
        passportSeries: driver.passportSeries,
      },
      totalDebt,
      telegram: {
        linked: Boolean(driver.telegramChatId),
        linkedAt: driver.telegramLinkedAt,
      },
      expiringSoon,
      payments,
      documents: {
        putyovkas,
        tirs,
        dazvols,
        licenses,
        rentals,
      },
    };
  }

  async getTelegramLink(driverId: string) {
    const driver = await this.telegram.ensureLinkToken(driverId);
    return {
      url: this.telegram.getLinkUrl(driver.telegramLinkToken!),
      linked: Boolean(driver.telegramChatId),
      linkedAt: driver.telegramLinkedAt,
    };
  }

  generateBlanka(driverId: string, dto?: DoverennostDto) {
    return this.drivers.generateBlanka(driverId, dto);
  }

  generateBlankaDocx(driverId: string, dto?: DoverennostDto) {
    return this.drivers.generateBlankaDocx(driverId, dto);
  }

  generateDoverennost(driverId: string, dto: DoverennostDto) {
    return this.drivers.generateDoverennost(driverId, dto);
  }

  generateDoverennostDocx(driverId: string, dto: DoverennostDto) {
    return this.drivers.generateDoverennostDocx(driverId, dto);
  }
}
