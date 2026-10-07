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
 * Chaque chambre possede sa propre image (dans /images/chambres/).
 * Les chambres non listees ici retombent sur la photo de leur type.
 */
const PRINCIPALE_PAR_NUMERO: Record<string, string> = {
  '101': `${BASE}/chambres/101.jpg`,
  '102': `${BASE}/chambres/102.jpg`,
  '103': `${BASE}/chambres/103.jpg`,
  '104': `${BASE}/chambres/104.jpg`,
  '105': `${BASE}/chambres/105.jpg`,
  '106': `${BASE}/chambres/106.jpg`,
  '201': `${BASE}/chambres/201.jpg`,
  '202': `${BASE}/chambres/202.jpg`,
  '203': `${BASE}/chambres/203.jpg`,
  '204': `${BASE}/chambres/204.jpg`,
  '205': `${BASE}/chambres/205.jpg`,
  '206': `${BASE}/chambres/206.jpg`,
  '301': `${BASE}/chambres/301.jpg`,
  '302': `${BASE}/chambres/302.jpg`,
  '303': `${BASE}/chambres/303.jpg`,
  '304': `${BASE}/chambres/304.jpg`,
  '305': `${BASE}/chambres/305.jpg`,
  '401': `${BASE}/chambres/401.jpg`,
  '402': `${BASE}/chambres/402.jpg`,
  '403': `${BASE}/chambres/403.jpg`,
  '404': `${BASE}/chambres/404.jpg`,
  '405': `${BASE}/chambres/405.jpg`,
  '501': `${BASE}/chambres/501.jpg`,
  '502': `${BASE}/chambres/502.jpg`,
};

/**
 * Mini galerie par chambre : d'autres pieces / angles de la meme chambre
 * (salle de bain, vue, coin salon-bureau, balcon...). Indexee par numero.
 */
const GALERIE_PAR_NUMERO: Record<string, string[]> = {
  '101': [
    `${BASE}/chambres/101-1.jpg`,
    `${BASE}/chambres/101-2.jpg`,
    `${BASE}/chambres/101-3.jpg`,
  ],
  '102': [
    `${BASE}/chambres/102-1.jpg`,
    `${BASE}/chambres/102-2.jpg`,
    `${BASE}/chambres/102-3.jpg`,
  ],
  '103': [
    `${BASE}/chambres/103-1.jpg`,
    `${BASE}/chambres/103-2.jpg`,
    `${BASE}/chambres/103-3.jpg`,
  ],
  '104': [
    `${BASE}/chambres/104-1.jpg`,
    `${BASE}/chambres/104-2.jpg`,
    `${BASE}/chambres/104-3.jpg`,
  ],
  '105': [
    `${BASE}/chambres/105-1.jpg`,
    `${BASE}/chambres/105-2.jpg`,
    `${BASE}/chambres/105-3.jpg`,
  ],
  '106': [
    `${BASE}/chambres/106-1.jpg`,
    `${BASE}/chambres/106-2.jpg`,
    `${BASE}/chambres/106-3.jpg`,
  ],
  '201': [
    `${BASE}/chambres/201-1.jpg`,
    `${BASE}/chambres/201-2.jpg`,
    `${BASE}/chambres/201-3.jpg`,
  ],
  '202': [
    `${BASE}/chambres/202-1.jpg`,
    `${BASE}/chambres/202-2.jpg`,
    `${BASE}/chambres/202-3.jpg`,
  ],
  '203': [
    `${BASE}/chambres/203-1.jpg`,
    `${BASE}/chambres/203-2.jpg`,
    `${BASE}/chambres/203-3.jpg`,
  ],
  '204': [
    `${BASE}/chambres/204-1.jpg`,
    `${BASE}/chambres/204-2.jpg`,
    `${BASE}/chambres/204-3.jpg`,
  ],
  '205': [
    `${BASE}/chambres/205-1.jpg`,
    `${BASE}/chambres/205-2.jpg`,
    `${BASE}/chambres/205-3.jpg`,
  ],
  '206': [
    `${BASE}/chambres/206-1.jpg`,
    `${BASE}/chambres/206-2.jpg`,
    `${BASE}/chambres/206-3.jpg`,
  ],
  '301': [
    `${BASE}/chambres/301-1.jpg`,
    `${BASE}/chambres/301-2.jpg`,
    `${BASE}/chambres/301-3.jpg`,
  ],
  '302': [
    `${BASE}/chambres/302-1.jpg`,
    `${BASE}/chambres/302-2.jpg`,
    `${BASE}/chambres/302-3.jpg`,
  ],
  '303': [
    `${BASE}/chambres/303-1.jpg`,
    `${BASE}/chambres/303-2.jpg`,
    `${BASE}/chambres/303-3.jpg`,
  ],
  '304': [
    `${BASE}/chambres/304-1.jpg`,
    `${BASE}/chambres/304-2.jpg`,
    `${BASE}/chambres/304-3.jpg`,
  ],
  '305': [
    `${BASE}/chambres/305-1.jpg`,
    `${BASE}/chambres/305-2.jpg`,
    `${BASE}/chambres/305-3.jpg`,
  ],
  '401': [
    `${BASE}/chambres/401-1.jpg`,
    `${BASE}/chambres/401-2.jpg`,
    `${BASE}/chambres/401-3.jpg`,
  ],
  '402': [
    `${BASE}/chambres/402-1.jpg`,
    `${BASE}/chambres/402-2.jpg`,
    `${BASE}/chambres/402-3.jpg`,
  ],
  '403': [
    `${BASE}/chambres/403-1.jpg`,
    `${BASE}/chambres/403-2.jpg`,
    `${BASE}/chambres/403-3.jpg`,
  ],
  '404': [
    `${BASE}/chambres/404-1.jpg`,
    `${BASE}/chambres/404-2.jpg`,
    `${BASE}/chambres/404-3.jpg`,
  ],
  '405': [
    `${BASE}/chambres/405-1.jpg`,
    `${BASE}/chambres/405-2.jpg`,
    `${BASE}/chambres/405-3.jpg`,
  ],
  '501': [
    `${BASE}/chambres/501-1.jpg`,
    `${BASE}/chambres/501-2.jpg`,
    `${BASE}/chambres/501-3.jpg`,
  ],
};

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
