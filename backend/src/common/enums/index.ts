/**
 * Enumerations metier partagees par toute l'API.
 */

/** Roles utilises pour l'autorisation (payload du JWT + guard RolesGuard) */
export enum Role {
  ADMIN = 'ADMIN',
  RECEPTIONNISTE = 'RECEPTIONNISTE',
  CLIENT = 'CLIENT',
}

export enum TypeChambre {
  SIMPLE = 'SIMPLE',
  DOUBLE = 'DOUBLE',
  TWIN = 'TWIN',
  SUITE = 'SUITE',
  FAMILIALE = 'FAMILIALE',
}

export enum StatutChambre {
  LIBRE = 'LIBRE',
  OCCUPEE = 'OCCUPEE',
  MAINTENANCE = 'MAINTENANCE',
}

export enum StatutReservation {
  EN_ATTENTE = 'EN_ATTENTE',
  CONFIRMEE = 'CONFIRMEE',
  ANNULEE = 'ANNULEE',
  TERMINEE = 'TERMINEE',
}

/** Statuts qui bloquent une chambre (utilises pour la gestion des disponibilites) */
export const STATUTS_BLOQUANTS: StatutReservation[] = [
  StatutReservation.EN_ATTENTE,
  StatutReservation.CONFIRMEE,
];

/**
 * Catalogue de permissions granulaires (autorisation fine).
 * Un role donne acces a un ensemble de permissions (voir ROLE_PERMISSIONS).
 */
export enum Permission {
  RESERVATION_CREATE = 'RESERVATION_CREATE',
  RESERVATION_READ = 'RESERVATION_READ',
  RESERVATION_UPDATE = 'RESERVATION_UPDATE',
  RESERVATION_CANCEL = 'RESERVATION_CANCEL',
  CLIENT_READ = 'CLIENT_READ',
  CLIENT_UPDATE = 'CLIENT_UPDATE',
  ROOM_CREATE = 'ROOM_CREATE',
  ROOM_UPDATE = 'ROOM_UPDATE',
  ROOM_DELETE = 'ROOM_DELETE',
  PAYMENT_READ = 'PAYMENT_READ',
  PAYMENT_CREATE = 'PAYMENT_CREATE',
  USER_CREATE = 'USER_CREATE',
  USER_UPDATE = 'USER_UPDATE',
  USER_DELETE = 'USER_DELETE',
  REPORT_READ = 'REPORT_READ',
  SETTINGS_UPDATE = 'SETTINGS_UPDATE',
}

/**
 * Matrice d'habilitation par role.
 *  - CLIENT : agit uniquement sur ses propres donnees (reservations, profil, paiements)
 *  - RECEPTIONNISTE : exploitation courante (reservations, clients, chambres en lecture/maj, stats)
 *  - ADMIN : tous les droits (chambres, tarifs, utilisateurs, permissions, parametres, journal)
 */
export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  [Role.CLIENT]: [
    Permission.RESERVATION_CREATE,
    Permission.RESERVATION_READ,
    Permission.RESERVATION_UPDATE,
    Permission.RESERVATION_CANCEL,
    Permission.CLIENT_READ,
    Permission.CLIENT_UPDATE,
    Permission.PAYMENT_READ,
    Permission.PAYMENT_CREATE,
  ],
  [Role.RECEPTIONNISTE]: [
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
  [Role.ADMIN]: Object.values(Permission),
};

/** Permissions d'un role (liste dedupliee) */
export function permissionsDuRole(role: Role): Permission[] {
  return ROLE_PERMISSIONS[role] ?? [];
}

/** Le role possede-t-il toutes les permissions demandees ? */
export function roleAPermissions(role: Role, requis: Permission[]): boolean {
  const possedees = permissionsDuRole(role);
  return requis.every((p) => possedees.includes(p));
}
