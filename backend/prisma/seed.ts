import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const adminHash = await bcrypt.hash('1234', 10);
  const driverHash = await bcrypt.hash('1478', 10);

  await prisma.admin.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      email: 'admin@logistika.uz',
      passwordHash: adminHash,
    },
  });

  const driver = await prisma.driver.upsert({
    where: { phone: '+998903333333' },
    update: {},
    create: {
      fullName: 'Damirov A',
      phone: '+998903333333',
      vehicle: 'MAN TGX',
      plateNumber: '01 A 333 BA',
      passwordHash: driverHash,
      passportSeries: 'AA 1234567',
    },
  });

  const existing = await prisma.putyovka.count({ where: { driverId: driver.id } });
  if (existing === 0) {
    const start = new Date();
    const end = new Date();
    end.setDate(end.getDate() + 17);
    await prisma.putyovka.create({
      data: {
        driverId: driver.id,
        trailerNo: 'KRONE SD №402884CA',
        code: '1',
        price: 2_000_000,
        paid: 1_500_000,
        months: 1,
        startDate: start,
        endDate: end,
        note: 'Demo putyovka',
      },
    });
  }

  console.log('Seed OK');
  console.log('Admin: admin / 1234');
  console.log('Haydovchi: +998903333333 / 1478');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
