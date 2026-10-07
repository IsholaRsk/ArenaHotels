import type { Role } from '../types';

/** Catalogue de permissions (miroir du backend). */
export const Permission = {
  RESERVATION_CREATE: 'RESERVATION_CREATE',
  RESERVATION_READ: 'RESERVATION_READ',
  RESERVATION_UPDATE: 'RESERVATION_UPDATE',
  RESERVATION_CANCEL: 'RESERVATION_CANCEL',
  CLIENT_READ: 'CLIENT_READ',
  CLIENT_UPDATE: 'CLIENT_UPDATE',
  ROOM_CREATE: 'ROOM_CREATE',
  ROOM_UPDATE: 'ROOM_UPDATE',
  ROOM_DELETE: 'ROOM_DELETE',
  PAYMENT_READ: 'PAYMENT_READ',
  PAYMENT_CREATE: 'PAYMENT_CREATE',
  USER_CREATE: 'USER_CREATE',
  USER_UPDATE: 'USER_UPDATE',
  USER_DELETE: 'USER_DELETE',
  REPORT_READ: 'REPORT_READ',
  SETTINGS_UPDATE: 'SETTINGS_UPDATE',
} as const;

export type Permission = (typeof Permission)[keyof typeof Permission];

/** Matrice d'habilitation par role (identique au backend). */
export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  CLIENT: [
    Permission.RESERVATION_CREATE,
    Permission.RESERVATION_READ,
    Permission.RESERVATION_UPDATE,
    Permission.RESERVATION_CANCEL,
    Permission.CLIENT_READ,
    Permission.CLIENT_UPDATE,
    Permission.PAYMENT_READ,
    Permission.PAYMENT_CREATE,
  ],
  RECEPTIONNISTE: [
    Permission.RESERVATION_CREATE,
    Permission.RESERVATION_READ,
    Permission.RESERVATION_UPDATE,
    Permission.RESERVATION_CANCEL,
    Permission.CLIENT_READ,
    Permission.CLIENT_UPDATE,
    Permission.ROOM_UPDATE,
    Permission.PAYMENT_READ,
    Permission.PAYMENT_CREATE,
    Permission.REPORT_READ,
  ],
  ADMIN: Object.values(Permission),
};

/** Permissions d'un role. */
export function permissionsDuRole(role?: Role | null): Permission[] {
  return (role && ROLE_PERMISSIONS[role]) || [];
}

/** Le role possede-t-il toutes les permissions demandees ? */
export function roleAPermissions(
  role: Role | null | undefined,
  requis: Permission[],
): boolean {
  if (!role) return false;
  const possedees = permissionsDuRole(role);
  return requis.every((p) => possedees.includes(p));
}
