import {
  CanActivate,
  ExecutionContext,
  Injectable,
  ForbiddenException,
  SetMetadata,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';

export const ROLES_KEY = 'roles';
export const Roles = (...roles: Array<'ADMIN' | 'DRIVER'>) =>
  SetMetadata(ROLES_KEY, roles);

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const roles = this.reflector.getAllAndOverride<Array<'ADMIN' | 'DRIVER'>>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (!roles?.length) return true;
    const req = context.switchToHttp().getRequest();
    const user = req.user as { role?: string } | undefined;
    if (!user?.role || !roles.includes(user.role as 'ADMIN' | 'DRIVER')) {
      throw new ForbiddenException('Ruxsat yo‘q');
    }
    return true;
  }
}
