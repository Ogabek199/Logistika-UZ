import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

function debt(price: number, paid: number) {
  return Math.max(0, price - paid);
}

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getSummary() {
    const [drivers, putyovkas, tirs, dazvols, licenses, rentals, expenses] =
      await Promise.all([
        this.prisma.driver.findMany({
          include: {
            putyovkas: true,
            tirs: true,
            dazvols: true,
            licenses: true,
            rentals: true,
          },
        }),
        this.prisma.putyovka.count(),
        this.prisma.tir.count(),
        this.prisma.dazvol.count(),
        this.prisma.license.count(),
        this.prisma.rental.count(),
        this.prisma.expense.findMany(),
      ]);

    const now = new Date();
    const in7 = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const startOfToday = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
    );

    // Oxirgi 6 oy uchun kirim/chiqim segmentlari (kunbay to'lov jurnali
    // bo'lmagani uchun hujjat yaratilgan sana kirim vaqti sifatida olinadi).
    const monthlyBuckets: Array<{
      key: string;
      year: number;
      month: number;
      income: number;
      expense: number;
    }> = [];
    for (let i = 5; i >= 0; i -= 1) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      monthlyBuckets.push({
        key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
        year: d.getFullYear(),
        month: d.getMonth(),
        income: 0,
        expense: 0,
      });
    }
    const addToMonth = (
      date: Date,
      field: 'income' | 'expense',
      amt: number,
    ) => {
      const bucket = monthlyBuckets.find(
        (b) => b.year === date.getFullYear() && b.month === date.getMonth(),
      );
      if (bucket) bucket[field] += amt;
    };

    let todayIncome = 0;

    type Expiring = {
      driverName: string;
      type: string;
      endDate: Date;
      daysLeft: number;
    };
    const expiring: Expiring[] = [];

    const pushExpiring = (
      driverName: string,
      type: string,
      endDate: Date | null,
    ) => {
      if (!endDate) return;
      if (endDate >= now && endDate <= in7) {
        const daysLeft = Math.ceil(
          (endDate.getTime() - now.getTime()) / (24 * 60 * 60 * 1000),
        );
        expiring.push({ driverName, type, endDate, daysLeft });
      }
    };

    let totalIncome = 0;
    let totalDebt = 0;
    const debtorRows: Array<{
      id: string;
      name: string;
      vehicle: string | null;
      debt: number;
      paid: number;
      activeDocs: number;
    }> = [];

    for (const d of drivers) {
      const docs = [
        ...d.putyovkas.map((x) => ({ ...x, type: 'Putyovka' })),
        ...d.tirs.map((x) => ({ ...x, type: 'TIR' })),
        ...d.dazvols.map((x) => ({ ...x, type: 'Dazvol' })),
        ...d.licenses.map((x) => ({ ...x, type: 'Litsenziya' })),
        ...d.rentals.map((x) => ({ ...x, type: 'Ijara' })),
      ];
      let driverDebt = 0;
      let driverPaid = 0;
      let activeDocs = 0;
      for (const doc of docs) {
        totalIncome += doc.paid;
        driverPaid += doc.paid;
        const dbt = debt(doc.price, doc.paid);
        driverDebt += dbt;
        totalDebt += dbt;
        if (doc.status === 'ACTIVE') activeDocs += 1;
        pushExpiring(d.fullName, doc.type, doc.endDate);
        if (doc.createdAt >= startOfToday) todayIncome += doc.paid;
        addToMonth(doc.createdAt, 'income', doc.paid);
      }
      debtorRows.push({
        id: d.id,
        name: d.fullName,
        vehicle: d.vehicle,
        debt: driverDebt,
        paid: driverPaid,
        activeDocs,
      });
    }

    const expiredCount = {
      putyovka: await this.prisma.putyovka.count({
        where: { endDate: { lt: now } },
      }),
      tir: await this.prisma.tir.count({ where: { endDate: { lt: now } } }),
      dazvol: await this.prisma.dazvol.count({
        where: { endDate: { lt: now } },
      }),
      license: await this.prisma.license.count({
        where: { endDate: { lt: now } },
      }),
      rental: await this.prisma.rental.count({
        where: { endDate: { lt: now } },
      }),
    };

    const topDebtors = [...debtorRows]
      .filter((x) => x.debt > 0)
      .sort((a, b) => b.debt - a.debt)
      .slice(0, 8);

    let todayExpense = 0;
    let expenseTotal = 0;
    for (const e of expenses) {
      expenseTotal += e.amount;
      if (e.date >= startOfToday) todayExpense += e.amount;
      addToMonth(e.date, 'expense', e.amount);
    }

    expiring.sort((a, b) => a.daysLeft - b.daysLeft);

    return {
      counts: {
        drivers: drivers.length,
        admins: await this.prisma.admin.count(),
        putyovkas,
        tirs,
        dazvols,
        licenses,
        rentals,
        expenses: expenses.length,
      },
      expiredCount,
      finance: {
        income: totalIncome,
        debt: totalDebt,
        expenseTotal,
        balance: totalIncome - expenseTotal,
        todayIncome,
        todayExpense,
      },
      monthly: monthlyBuckets.map((b) => ({
        key: b.key,
        income: b.income,
        expense: b.expense,
      })),
      topDebtors,
      driversOverview: debtorRows.sort((a, b) => b.debt - a.debt).slice(0, 12),
      expiringSoon: expiring.slice(0, 12),
    };
  }
}
