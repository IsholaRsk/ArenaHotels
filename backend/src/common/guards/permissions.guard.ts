import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSIONS_KEY } from '../decorators/permissions.decorator';
import { Permission, Role, roleAPermissions } from '../enums';

/**
 * Guard d'autorisation granulaire : verifie que le role de l'utilisateur
 * (issu du JWT) possede les permissions declarees avec @Permissions(...).
 *
 * Certaines permissions sont "auto-portee" pour un CLIENT (il n'agit que sur
 * ses propres donnees) : le controle de portee est fait cote service.
 */
@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requis = this.reflector.getAllAndOverride<Permission[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );

    // Aucune permission exigee => route accessible a tout utilisateur authentifie
    if (!requis || requis.length === 0) return true;

    const { user } = context.switchToHttp().getRequest();
    if (!user || !roleAPermissions(user.role as Role, requis)) {
      throw new ForbiddenException(
        'Acces refuse : permissions insuffisantes pour cette operation.',
      );
    }
    return true;
  }
}
