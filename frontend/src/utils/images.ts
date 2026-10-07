import type { TypeChambre } from '../types';

/**
 * Photographies auto-hebergees (frontend/public/images).
 * Chaque type de chambre dispose d'un visuel editorial coherent.
 */
export const IMAGES: Record<TypeChambre, string> = {
  SIMPLE: '/images/chambre-simple.jpg',
  DOUBLE: '/images/chambre-double.jpg',
  TWIN: '/images/chambre-twin.jpg',
  SUITE: '/images/chambre-suite.jpg',
  FAMILIALE: '/images/chambre-familiale.jpg',
};

export const IMAGE_HERO = '/images/hero.jpg';
export const IMAGE_LOBBY = '/images/lobby.jpg';

export function imageChambre(type: TypeChambre): string {
  return IMAGES[type] ?? IMAGE_LOBBY;
}
