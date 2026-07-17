import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

function debt(price: number, paid: number) {
  return Math.max(0, price - paid);
}

function daysLeft(endDate: Date | null) {
  if (!endDate) return null;
  return Math.ceil(
    (endDate.getTime() - Date.now()) / (24 * 60 * 60 * 1000),
  );
}

@Injectable()
export class DriverPortalService {
  constructor(private readonly prisma: PrismaService) {}

  async getPortal(driverId: string) {
    const driver = await this.prisma.driver.findUnique({
      where: { id: driverId },
      include: {
        putyovkas: { orderBy: { createdAt: 'desc' } },
        tirs: { orderBy: { createdAt: 'desc' } },
        dazvols: { orderBy: { createdAt: 'desc' } },
        licenses: { orderBy: { createdAt: 'desc' } },
        rentals: { orderBy: { createdAt: 'desc' } },
      },
    });
    if (!driver) throw new NotFoundException('Haydovchi topilmadi');

    const mapDoc = <
      T extends { price: number; paid: number; endDate: Date | null; status: string },
    >(
      docs: T[],
    ) =>
      docs.map((d) => ({
        ...d,
        debt: debt(d.price, d.paid),
        daysLeft: daysLeft(d.endDate),
      }));

    const putyovkas = mapDoc(driver.putyovkas);
    const tirs = mapDoc(driver.tirs);
    const dazvols = mapDoc(driver.dazvols);
    const licenses = mapDoc(driver.licenses);
    const rentals = mapDoc(driver.rentals);

    const totalDebt = [...putyovkas, ...tirs, ...dazvols, ...licenses, ...rentals].reduce(
      (s, d) => s + d.debt,
      0,
    );

    return {
      driver: {
        id: driver.id,
        fullName: driver.fullName,
        phone: driver.phone,
        vehicle: driver.vehicle,
        plateNumber: driver.plateNumber,
      },
      totalDebt,
      documents: {
        putyovkas,
        tirs,
        dazvols,
        licenses,
        rentals,
      },
    };
  }
}
