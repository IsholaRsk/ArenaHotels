import { SetMetadata } from '@nestjs/common';
import { Permission } from '../enums';

export const PERMISSIONS_KEY = 'permissions';

/**
 * Decorateur @Permissions(...) : declare les permissions requises sur une route.
 * Utilise par le PermissionsGuard (autorisation granulaire par role).
 */
export const Permissions = (...permissions: Permission[]) =>
  SetMetadata(PERMISSIONS_KEY, permissions);
