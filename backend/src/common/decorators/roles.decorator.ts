import { SetMetadata } from '@nestjs/common';
import { Role } from '../enums';

export const ROLES_KEY = 'roles';

/**
 * Decorateur @Roles(...) : declare les roles autorises sur une route.
 * Utilise par le RolesGuard (autorisation : "que peux-tu faire ?").
 */
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);
