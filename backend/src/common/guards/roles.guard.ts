import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '../enums';
import { ROLES_KEY } from '../decorators/roles.decorator';

/**
 * Guard d'autorisation : compare le role contenu dans le JWT
 * aux roles declares avec le decorateur @Roles(...).
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const rolesRequis = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // Pas de role exige => route accessible a tout utilisateur authentifie
    if (!rolesRequis || rolesRequis.length === 0) return true;

    const { user } = context.switchToHttp().getRequest();
    if (!user || !rolesRequis.includes(user.role)) {
      throw new ForbiddenException(
        'Acces refuse : droits insuffisants pour cette operation.',
      );
    }
    return true;
  }
}
