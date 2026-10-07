/** Types partages avec l'API NestJS */

export type Role = 'ADMIN' | 'RECEPTIONNISTE' | 'CLIENT';
export type TypeChambre =
  | 'SIMPLE'
  | 'DOUBLE'
  | 'TWIN'
  | 'SUITE'
  | 'FAMILIALE';
export type StatutChambre = 'LIBRE' | 'OCCUPEE' | 'MAINTENANCE';
export type StatutReservation =
  | 'EN_ATTENTE'
  | 'CONFIRMEE'
  | 'ANNULEE'
  | 'TERMINEE';

export interface Utilisateur {
  id: number;
  nom: string;
  email: string;
  role: Role;
  telephone?: string | null;
  actif?: boolean;
  createdAt?: string;
}

export interface Chambre {
  id: number;
  numero: string;
  type: TypeChambre;
  prixParNuit: number;
  capacite: number;
  etage: number;
  description?: string | null;
  statut: StatutChambre;
  reservations?: Reservation[];
}

export interface ChambreDisponible extends Chambre {
  disponible: boolean;
  motif?: string;
  conflit?: { id: number; reference: string; dateArrivee: string; dateDepart: string } | null;
  nuits: number;
  prixSejour: number;
}

export interface Client {
  id: number;
  nom: string;
  prenom: string;
  email: string;
  telephone?: string | null;
  adresse?: string | null;
  ville?: string | null;
  pays?: string | null;
  notes?: string | null;
  createdAt?: string;
  reservations?: Reservation[];
  statistiques?: {
    nombreSejours: number;
    montantTotal: number;
    dernierSejour: string | null;
  };
}

export interface Reservation {
  id: number;
  reference: string;
  chambre: Chambre | { id: number; numero: string; type: TypeChambre };
  client: Client | { id: number; nom: string; prenom: string; email: string };
  dateArrivee: string;
  dateDepart: string;
  nombrePersonnes: number;
  statut: StatutReservation;
  montantTotal: number;
  notes?: string | null;
  nuits?: number;
  createdAt?: string;
}

export interface MetaPagination {
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export interface LignePlanning {
  chambreId: number;
  numero: string;
  type: TypeChambre;
  etage: number;
  statut: StatutChambre;
  occupation: Record<
    string,
    {
      reservationId: number;
      reference: string;
      statut: StatutReservation;
      client: string;
    } | null
  >;
  tauxOccupation: number;
}

export interface TableauDeBord {
  date: string;
  mois: string;
  chambres: {
    total: number;
    libres: number;
    occupees: number;
    maintenance: number;
    parType: Array<{ type: TypeChambre; nombre: number }>;
  };
  clients: { total: number; nouveauxCeMois: number };
  reservations: {
    total: number;
    arriveesDuJour: number;
    departsDuJour: number;
    enAttente: number;
    confirmees: number;
    annulees: number;
    terminees: number;
    ceMois: number;
  };
  revenus: { duMois: number; aVenir: number };
  tauxOccupation: number;
  prochainesArrivees: Array<{
    id: number;
    reference: string;
    dateArrivee: string;
    dateDepart: string;
    statut: StatutReservation;
    chambre: string;
    type: TypeChambre;
    client: string;
    montantTotal: number;
  }>;
  alertes: { maintenance: number; enAttente: number };
  utilisateurs: number;
}
