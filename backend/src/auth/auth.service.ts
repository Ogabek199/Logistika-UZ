import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
  ) {}

  async login(dto: LoginDto) {
    if (dto.role === 'admin') {
      if (!dto.username) {
        throw new BadRequestException('Login kiriting');
      }
      const admin = await this.prisma.admin.findUnique({
        where: { username: dto.username.trim() },
      });
      if (!admin || !(await bcrypt.compare(dto.password, admin.passwordHash))) {
        throw new UnauthorizedException("Login yoki parol noto'g'ri");
      }
      const accessToken = await this.jwt.signAsync({
        sub: admin.id,
        role: 'ADMIN',
        name: admin.username,
      });
      return {
        accessToken,
        user: {
          id: admin.id,
          role: 'ADMIN' as const,
          name: admin.username,
          email: admin.email,
        },
      };
    }

    if (!dto.phone) {
      throw new BadRequestException('Telefon raqam kiriting');
    }
    const phone = normalizePhone(dto.phone);
    const driver = await this.prisma.driver.findUnique({ where: { phone } });
    if (!driver || !(await bcrypt.compare(dto.password, driver.passwordHash))) {
      throw new UnauthorizedException("Telefon yoki parol noto'g'ri");
    }
    const accessToken = await this.jwt.signAsync({
      sub: driver.id,
      role: 'DRIVER',
      name: driver.fullName,
    });
    return {
      accessToken,
      user: {
        id: driver.id,
        role: 'DRIVER' as const,
        name: driver.fullName,
        phone: driver.phone,
        vehicle: driver.vehicle,
        plateNumber: driver.plateNumber,
      },
    };
  }

  async me(userId: string, role: 'ADMIN' | 'DRIVER') {
    if (role === 'ADMIN') {
      const admin = await this.prisma.admin.findUnique({
        where: { id: userId },
      });
      if (!admin) throw new UnauthorizedException();
      return {
        id: admin.id,
        role: 'ADMIN' as const,
        name: admin.username,
        email: admin.email,
      };
    }
    const driver = await this.prisma.driver.findUnique({
      where: { id: userId },
    });
    if (!driver) throw new UnauthorizedException();
    return {
      id: driver.id,
      role: 'DRIVER' as const,
      name: driver.fullName,
      phone: driver.phone,
      vehicle: driver.vehicle,
      plateNumber: driver.plateNumber,
    };
  }
}

function normalizePhone(input: string): string {
  const digits = input.replace(/\D/g, '');
  if (digits.startsWith('998') && digits.length === 12) return `+${digits}`;
  if (digits.length === 9) return `+998${digits}`;
  if (input.trim().startsWith('+') && digits.length >= 12) return `+${digits}`;
  return `+${digits}`;
}
