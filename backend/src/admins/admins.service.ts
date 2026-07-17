import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAdminDto } from './dto/admin.dto';

@Injectable()
export class AdminsService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.admin.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        username: true,
        email: true,
        createdAt: true,
      },
    });
  }

  async create(dto: CreateAdminDto) {
    const username = dto.username.trim().toLowerCase();
    const email = dto.email.trim().toLowerCase();

    if (!username) throw new BadRequestException('Login kiriting');

    const byUsername = await this.prisma.admin.findUnique({
      where: { username },
    });
    if (byUsername) throw new BadRequestException('Bu login band');

    const byEmail = await this.prisma.admin.findFirst({ where: { email } });
    if (byEmail) throw new BadRequestException('Bu email band');

    return this.prisma.admin.create({
      data: {
        username,
        email,
        passwordHash: await bcrypt.hash(dto.password, 10),
      },
      select: {
        id: true,
        username: true,
        email: true,
        createdAt: true,
      },
    });
  }

  async remove(id: string, currentAdminId: string) {
    if (id === currentAdminId) {
      throw new BadRequestException('O‘zingizni o‘chira olmaysiz');
    }

    const admin = await this.prisma.admin.findUnique({ where: { id } });
    if (!admin) throw new NotFoundException('Admin topilmadi');

    const total = await this.prisma.admin.count();
    if (total <= 1) {
      throw new BadRequestException('Oxirgi adminni o‘chirib bo‘lmaydi');
    }

    await this.prisma.admin.delete({ where: { id } });
    return { ok: true };
  }
}
