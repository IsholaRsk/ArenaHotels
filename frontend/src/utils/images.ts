import type { TypeChambre } from '../types';

const BASE = '/images';

/** Visuel de repli par type de chambre (utilise si la chambre n'a pas encore de photo unique). */
const PAR_TYPE: Record<TypeChambre, string> = {
  SIMPLE: `${BASE}/chambre-simple.jpg`,
  DOUBLE: `${BASE}/chambre-double.jpg`,
  TWIN: `${BASE}/chambre-twin.jpg`,
  SUITE: `${BASE}/chambre-suite.jpg`,
  FAMILIALE: `${BASE}/chambre-familiale.jpg`,
};

/**
 * Photo principale unique par chambre, indexee par numero.
 * Chaque chambre possede sa propre image (tachees dans /images/chambres/).
 */
const PRINCIPALE_PAR_NUMERO: Record<string, string> = {};

/**
 * Mini galerie par chambre : d'autres pieces / angles de la meme chambre
 * (salle de bain, vue, coin salon-bureau, balcon...). Indexee par numero.
 */
const GALERIE_PAR_NUMERO: Record<string, string[]> = {};

export const IMAGE_HERO = `${BASE}/hero.jpg`;
export const IMAGE_LOBBY = `${BASE}/lobby.jpg`;

/** Reference minimale d'une chambre pour resoudre ses visuels. */
export interface RefChambre {
  numero: string;
  type: TypeChambre;
}

/** Photo principale de la chambre (unique par numero, repli sur le type). */
export function imageChambre(chambre: RefChambre): string {
  return PRINCIPALE_PAR_NUMERO[chambre.numero] ?? PAR_TYPE[chambre.type] ?? IMAGE_LOBBY;
}

/** Mini galerie de la chambre (vide tant qu'aucune photo n'est associee). */
export function galerieChambre(chambre: RefChambre): string[] {
  return GALERIE_PAR_NUMERO[chambre.numero] ?? [];
}
