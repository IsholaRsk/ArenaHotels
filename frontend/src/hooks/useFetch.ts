import { useCallback, useEffect, useState } from 'react';
import { ApiError } from '../api/client';

/**
 * Hook personnalise : charge une ressource avec les etats
 * chargement / erreur / donnees (modele vu dans le cours).
 */
export function useFetch<T>(
  chargeur: () => Promise<{ donnees: T; meta?: unknown }>,
  dependances: unknown[] = [],
) {
  const [donnees, setDonnees] = useState<T | null>(null);
  const [meta, setMeta] = useState<Record<string, unknown> | undefined>(undefined);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState<string | null>(null);

  const recharger = useCallback(async () => {
    setChargement(true);
    setErreur(null);
    try {
      const reponse = await chargeur();
      setDonnees(reponse.donnees);
      setMeta(reponse.meta as Record<string, unknown> | undefined);
    } catch (e) {
      setErreur(e instanceof ApiError ? e.message : 'Erreur inattendue');
    } finally {
      setChargement(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, dependances);

  useEffect(() => {
    recharger();
  }, [recharger]);

  return { donnees, meta, chargement, erreur, recharger };
}
