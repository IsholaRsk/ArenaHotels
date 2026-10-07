import type { StatutChambre, StatutReservation, TypeChambre } from '../types';

/** Formatage des montants en francs CFA */
export function formaterMontant(montant: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(montant || 0);
}

const MOIS = [
  'janvier',
  'fevrier',
  'mars',
  'avril',
  'mai',
  'juin',
  'juillet',
  'aout',
  'septembre',
  'octobre',
  'novembre',
  'decembre',
];

/** 2026-10-07 -> 07 octobre 2026 */
export function formaterDate(iso?: string | null): string {
  if (!iso) return '—';
  const [annee, mois, jour] = iso.slice(0, 10).split('-').map(Number);
  if (!annee || !mois || !jour) return iso;
  return `${String(jour).padStart(2, '0')} ${MOIS[mois - 1]} ${annee}`;
}

/** 2026-10-07 -> mardi 07/10 */
export function formaterDateCourte(iso: string): string {
  const [, mois, jour] = iso.split('-');
  return `${jour}/${mois}`;
}

export function dateAujourdhui(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
    d.getDate(),
  ).padStart(2, '0')}`;
}

export function moisCourant(): string {
  return dateAujourdhui().slice(0, 7);
}

export function ajouterJours(iso: string, jours: number): string {
  const d = new Date(`${iso}T00:00:00`);
  d.setDate(d.getDate() + jours);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
    d.getDate(),
  ).padStart(2, '0')}`;
}

export function nuitsEntre(arrivee: string, depart: string): number {
  if (!arrivee || !depart) return 0;
  const a = new Date(`${arrivee}T00:00:00`).getTime();
  const b = new Date(`${depart}T00:00:00`).getTime();
  const nuits = Math.round((b - a) / 86400000);
  return nuits > 0 ? nuits : 0;
}

export const LIBELLES_STATUT_RESERVATION: Record<StatutReservation, string> = {
  EN_ATTENTE: 'En attente',
  CONFIRMEE: 'Confirmee',
  ANNULEE: 'Annulee',
  TERMINEE: 'Terminee',
};

export const LIBELLES_STATUT_CHAMBRE: Record<StatutChambre, string> = {
  LIBRE: 'Libre',
  OCCUPEE: 'Occupee',
  MAINTENANCE: 'Maintenance',
};

export const LIBELLES_TYPE_CHAMBRE: Record<TypeChambre, string> = {
  SIMPLE: 'Simple',
  DOUBLE: 'Double',
  TWIN: 'Twin',
  SUITE: 'Suite',
  FAMILIALE: 'Familiale',
};

export const TYPES_CHAMBRE = Object.keys(LIBELLES_TYPE_CHAMBRE) as TypeChambre[];
export const STATUTS_CHAMBRE = Object.keys(LIBELLES_STATUT_CHAMBRE) as StatutChambre[];
export const STATUTS_RESERVATION = Object.keys(
  LIBELLES_STATUT_RESERVATION,
) as StatutReservation[];
