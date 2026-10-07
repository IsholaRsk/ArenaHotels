import type {
  Chambre,
  ChambreDisponible,
  Client,
  LignePlanning,
  MetaPagination,
  Reservation,
  StatutReservation,
  TableauDeBord,
  Utilisateur,
} from '../types';

/**
 * Fichier centralise des appels API (chapitre "Organisation des URLs").
 * Toutes les pages passent par ce module : aucune URL d'API n'est ecrite ailleurs.
 */

/** En developpement le proxy Vite renvoie /api vers NestJS ; en production meme domaine */
export const API_BASE =
  (import.meta.env.VITE_API_URL as string | undefined) ?? '/api';

const CLE_TOKEN = 'arena_hotels_token';

export const gestionToken = {
  lire: () => localStorage.getItem(CLE_TOKEN),
  ecrire: (token: string) => localStorage.setItem(CLE_TOKEN, token),
  effacer: () => localStorage.removeItem(CLE_TOKEN),
};

/** Erreur remontee par l'API (message lisible + code HTTP) */
export class ApiError extends Error {
  constructor(
    message: string,
    public statut: number,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export interface Reponse<T> {
  donnees: T;
  meta?: MetaPagination & Record<string, unknown>;
}

type Parametres = Record<string, string | number | boolean | undefined | null>;

function construireUrl(chemin: string, params?: Parametres): string {
  if (!params) return `${API_BASE}${chemin}`;
  const recherche = new URLSearchParams();
  Object.entries(params).forEach(([cle, valeur]) => {
    if (valeur !== undefined && valeur !== null && valeur !== '') {
      recherche.append(cle, String(valeur));
    }
  });
  const query = recherche.toString();
  return `${API_BASE}${chemin}${query ? `?${query}` : ''}`;
}

/** Appel declenche quand le token est refuse : permet de deconnecter l'utilisateur */
let surExpiration: (() => void) | null = null;
export const definirGestionnaireExpiration = (fn: () => void) => {
  surExpiration = fn;
};

interface Options {
  methode?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  corps?: unknown;
  params?: Parametres;
}

/**
 * Requete unique : ajoute le token JWT, gere les erreurs et
 * deballe l'enveloppe { succes, donnees, meta } renvoyee par NestJS.
 */
async function requete<T>(chemin: string, options: Options = {}): Promise<Reponse<T>> {
  const { methode = 'GET', corps, params } = options;
  const token = gestionToken.lire();

  let reponse: Response;
  try {
    reponse = await fetch(construireUrl(chemin, params), {
      method: methode,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: corps ? JSON.stringify(corps) : undefined,
    });
  } catch {
    throw new ApiError(
      "Impossible de joindre l'API. Verifiez que le backend est demarre.",
      0,
    );
  }

  if (reponse.status === 204) return { donnees: undefined as unknown as T };

  const json = await reponse.json().catch(() => null);

  if (!reponse.ok) {
    const message =
      typeof json?.message === 'string'
        ? json.message
        : Array.isArray(json?.message)
          ? json.message.join(' • ')
          : `Erreur ${reponse.status}`;
    if (reponse.status === 401 && token) surExpiration?.();
    throw new ApiError(message, reponse.status);
  }

  // Les reponses Nest sont enveloppees par un intercepteur
  if (json && typeof json === 'object' && 'donnees' in json) {
    return { donnees: json.donnees as T, meta: json.meta };
  }
  return { donnees: json as T };
}

// ------------------------------------------------------------------ Auth

export interface ReponseConnexion {
  access_token: string;
  type: string;
  expireDans: string;
  utilisateur: Utilisateur;
}

export const apiAuth = {
  connexion: (email: string, motDePasse: string) =>
    requete<ReponseConnexion>('/auth/login', {
      methode: 'POST',
      corps: { email, motDePasse },
    }),
  inscription: (donnees: {
    nom: string;
    email: string;
    motDePasse: string;
    telephone?: string;
  }) =>
    requete<ReponseConnexion>('/auth/register', {
      methode: 'POST',
      corps: donnees,
    }),
  profil: () => requete<Utilisateur>('/auth/profil'),
  deconnexion: () => requete<{ deconnecte: boolean }>('/auth/logout', { methode: 'POST' }),
};

// --------------------------------------------------------------- Chambres

export const apiChambres = {
  lister: (params?: Parametres) => requete<Chambre[]>('/chambres', { params }),
  detail: (id: number) => requete<Chambre>(`/chambres/${id}`),
  disponibilites: (params: Parametres) =>
    requete<ChambreDisponible[]>('/chambres/disponibilites', { params }),
  creer: (donnees: Partial<Chambre>) =>
    requete<Chambre>('/chambres', { methode: 'POST', corps: donnees }),
  modifier: (id: number, donnees: Partial<Chambre>) =>
    requete<Chambre>(`/chambres/${id}`, { methode: 'PATCH', corps: donnees }),
  supprimer: (id: number) =>
    requete<{ supprime: boolean }>(`/chambres/${id}`, { methode: 'DELETE' }),
};

// ---------------------------------------------------------------- Clients

export const apiClients = {
  lister: (params?: Parametres) => requete<Client[]>('/clients', { params }),
  detail: (id: number) => requete<Client>(`/clients/${id}`),
  creer: (donnees: Partial<Client>) =>
    requete<Client>('/clients', { methode: 'POST', corps: donnees }),
  modifier: (id: number, donnees: Partial<Client>) =>
    requete<Client>(`/clients/${id}`, { methode: 'PATCH', corps: donnees }),
  supprimer: (id: number) =>
    requete<{ supprime: boolean }>(`/clients/${id}`, { methode: 'DELETE' }),
};

// ----------------------------------------------------------- Reservations

export const apiReservations = {
  lister: (params?: Parametres) =>
    requete<Reservation[]>('/reservations', { params }),
  detail: (id: number) => requete<Reservation>(`/reservations/${id}`),
  planning: (mois: string) =>
    requete<LignePlanning[]>('/reservations/planning', { params: { mois } }),
  creer: (donnees: {
    chambreId: number;
    clientId?: number;
    dateArrivee: string;
    dateDepart: string;
    nombrePersonnes: number;
    statut?: StatutReservation;
    notes?: string;
  }) => requete<Reservation>('/reservations', { methode: 'POST', corps: donnees }),
  modifier: (id: number, donnees: Record<string, unknown>) =>
    requete<Reservation>(`/reservations/${id}`, { methode: 'PATCH', corps: donnees }),
  changerStatut: (id: number, statut: StatutReservation) =>
    requete<Reservation>(`/reservations/${id}/statut`, {
      methode: 'PATCH',
      corps: { statut },
    }),
  supprimer: (id: number) =>
    requete<{ supprime: boolean }>(`/reservations/${id}`, { methode: 'DELETE' }),
};

// ------------------------------------------------------------ Statistiques

export const apiStats = {
  tableauDeBord: () => requete<TableauDeBord>('/stats/tableau-de-bord'),
};
