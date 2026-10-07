import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  type ReactNode,
} from 'react';
import { apiAuth, definirGestionnaireExpiration, gestionToken } from '../api/client';
import type { Role, Utilisateur } from '../types';

/**
 * Etat global d'authentification : Context API + useReducer
 * (gestion d'etat avancee vue dans le cours).
 */
interface EtatAuth {
  utilisateur: Utilisateur | null;
  token: string | null;
  chargement: boolean;
  erreur: string | null;
}

type ActionAuth =
  | { type: 'CHARGEMENT' }
  | { type: 'CONNEXION'; utilisateur: Utilisateur; token: string }
  | { type: 'HYDRATATION'; utilisateur: Utilisateur }
  | { type: 'DECONNEXION' }
  | { type: 'ERREUR'; message: string };

const etatInitial: EtatAuth = {
  utilisateur: null,
  token: gestionToken.lire(),
  chargement: Boolean(gestionToken.lire()),
  erreur: null,
};

function reducteur(etat: EtatAuth, action: ActionAuth): EtatAuth {
  switch (action.type) {
    case 'CHARGEMENT':
      return { ...etat, chargement: true, erreur: null };
    case 'CONNEXION':
      return {
        utilisateur: action.utilisateur,
        token: action.token,
        chargement: false,
        erreur: null,
      };
    case 'HYDRATATION':
      return { ...etat, utilisateur: action.utilisateur, chargement: false };
    case 'DECONNEXION':
      return { utilisateur: null, token: null, chargement: false, erreur: null };
    case 'ERREUR':
      return { ...etat, chargement: false, erreur: action.message };
    default:
      return etat;
  }
}

interface ContexteAuth {
  utilisateur: Utilisateur | null;
  chargement: boolean;
  erreur: string | null;
  connecte: boolean;
  aLeRole: (...roles: Role[]) => boolean;
  connexion: (email: string, motDePasse: string) => Promise<void>;
  inscription: (donnees: {
    nom: string;
    email: string;
    motDePasse: string;
    telephone?: string;
  }) => Promise<void>;
  deconnexion: () => void;
}

const ContexteAuth = createContext<ContexteAuth | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [etat, dispatch] = useReducer(reducteur, etatInitial);

  const deconnexion = useCallback(() => {
    gestionToken.effacer();
    dispatch({ type: 'DECONNEXION' });
  }, []);

  // Session deja presente (token en localStorage) : on verifie le profil
  useEffect(() => {
    if (!etatInitial.token) return;
    let actif = true;
    apiAuth
      .profil()
      .then(({ donnees }) => {
        if (actif) dispatch({ type: 'HYDRATATION', utilisateur: donnees });
      })
      .catch(() => {
        if (actif) deconnexion();
      });
    return () => {
      actif = false;
    };
  }, [deconnexion]);

  // Token refuse par l'API (401) -> retour a la page de connexion
  useEffect(() => {
    definirGestionnaireExpiration(() => deconnexion());
  }, [deconnexion]);

  const connexion = useCallback(
    async (email: string, motDePasse: string) => {
      dispatch({ type: 'CHARGEMENT' });
      try {
        const { donnees } = await apiAuth.connexion(email, motDePasse);
        gestionToken.ecrire(donnees.access_token);
        dispatch({
          type: 'CONNEXION',
          utilisateur: donnees.utilisateur,
          token: donnees.access_token,
        });
      } catch (erreur) {
        dispatch({
          type: 'ERREUR',
          message:
            erreur instanceof Error
              ? erreur.message
              : 'Connexion impossible. Reessayez.',
        });
        throw erreur;
      }
    },
    [],
  );

  const inscription = useCallback(
    async (donnees: {
      nom: string;
      email: string;
      motDePasse: string;
      telephone?: string;
    }) => {
      dispatch({ type: 'CHARGEMENT' });
      try {
        const { donnees: reponse } = await apiAuth.inscription(donnees);
        gestionToken.ecrire(reponse.access_token);
        dispatch({
          type: 'CONNEXION',
          utilisateur: reponse.utilisateur,
          token: reponse.access_token,
        });
      } catch (erreur) {
        dispatch({
          type: 'ERREUR',
          message:
            erreur instanceof Error ? erreur.message : 'Inscription impossible.',
        });
        throw erreur;
      }
    },
    [],
  );

  const valeur = useMemo<ContexteAuth>(
    () => ({
      utilisateur: etat.utilisateur,
      chargement: etat.chargement,
      erreur: etat.erreur,
      connecte: Boolean(etat.utilisateur),
      aLeRole: (...roles: Role[]) =>
        Boolean(etat.utilisateur && roles.includes(etat.utilisateur.role)),
      connexion,
      inscription,
      deconnexion,
    }),
    [etat, connexion, inscription, deconnexion],
  );

  return <ContexteAuth.Provider value={valeur}>{children}</ContexteAuth.Provider>;
}

export function useAuth(): ContexteAuth {
  const contexte = useContext(ContexteAuth);
  if (!contexte) {
    throw new Error('useAuth doit etre utilise dans un <AuthProvider>');
  }
  return contexte;
}
