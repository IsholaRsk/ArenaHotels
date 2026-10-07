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
