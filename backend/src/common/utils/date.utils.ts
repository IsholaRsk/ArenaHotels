/**
 * Petits utilitaires dates utilises par la logique metier
 * (duree de sejour, calcul du montant, detection des chevauchements).
 * Toutes les dates circulent au format ISO court : YYYY-MM-DD
 */

export const DATE_ISO_REGEX = /^\d{4}-\d{2}-\d{2}$/;

export function toIsoDate(date: Date): string {
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 10);
}

export function todayIso(): string {
  return toIsoDate(new Date());
}

export function addDays(iso: string, days: number): string {
  const d = new Date(`${iso}T00:00:00.000Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/** Nombre de nuits entre l'arrivee et le depart (minimum 1) */
export function nombreDeNuits(arrivee: string, depart: string): number {
  const a = new Date(`${arrivee}T00:00:00.000Z`).getTime();
  const b = new Date(`${depart}T00:00:00.000Z`).getTime();
  const nuits = Math.round((b - a) / 86400000);
  return nuits > 0 ? nuits : 0;
}

/** Deux periodes se chevauchent si debutA < finB ET debutB < finA */
export function periodesChevauchent(
  debutA: string,
  finA: string,
  debutB: string,
  finB: string,
): boolean {
  return debutA < finB && debutB < finA;
}

export function isValidIsoDate(iso: string): boolean {
  if (!DATE_ISO_REGEX.test(iso)) return false;
  const d = new Date(`${iso}T00:00:00.000Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === iso;
}

/** Liste des jours (YYYY-MM-DD) d'un mois donne, ex: "2026-10" */
export function joursDuMois(mois: string): string[] {
  const [annee, m] = mois.split('-').map(Number);
  const nbJours = new Date(Date.UTC(annee, m, 0)).getUTCDate();
  const jours: string[] = [];
  for (let i = 1; i <= nbJours; i++) {
    jours.push(`${mois}-${String(i).padStart(2, '0')}`);
  }
  return jours;
}
