import type { ReactNode } from 'react';
import {
  LIBELLES_STATUT_CHAMBRE,
  LIBELLES_STATUT_RESERVATION,
  LIBELLES_TYPE_CHAMBRE,
} from '../utils/format';
import type { StatutChambre, StatutReservation, TypeChambre } from '../types';

/** Indicateur de chargement */
export function Chargement({ texte = 'Chargement en cours...' }: { texte?: string }) {
  return (
    <div className="chargement">
      <div className="roue" />
      <span>{texte}</span>
    </div>
  );
}

/** Message d'alerte (erreur, succes, information) */
export function Alerte({
  type = 'erreur',
  children,
}: {
  type?: 'erreur' | 'succes' | 'info' | 'attente';
  children: ReactNode;
}) {
  if (!children) return null;
  return <div className={`alerte alerte-${type}`}>{children}</div>;
}

/** Etat vide d'une liste */
export function EtatVide({
  icone = '📭',
  titre,
  texte,
  action,
}: {
  icone?: string;
  titre: string;
  texte?: string;
  action?: ReactNode;
}) {
  return (
    <div className="etat-vide">
      <div className="etat-vide-icone">{icone}</div>
      <strong>{titre}</strong>
      {texte ? <p style={{ margin: '6px 0 0' }}>{texte}</p> : null}
      {action ? <div style={{ marginTop: 16 }}>{action}</div> : null}
    </div>
  );
}

const CLASSES_STATUT_RESERVATION: Record<StatutReservation, string> = {
  EN_ATTENTE: 'badge-en-attente',
  CONFIRMEE: 'badge-confirmee',
  ANNULEE: 'badge-annulee',
  TERMINEE: 'badge-terminee',
};

const CLASSES_STATUT_CHAMBRE: Record<StatutChambre, string> = {
  LIBRE: 'badge-libre',
  OCCUPEE: 'badge-occupee',
  MAINTENANCE: 'badge-maintenance',
};

export function BadgeReservation({ statut }: { statut: StatutReservation }) {
  return (
    <span className={`badge ${CLASSES_STATUT_RESERVATION[statut]}`}>
      {LIBELLES_STATUT_RESERVATION[statut]}
    </span>
  );
}

export function BadgeChambre({ statut }: { statut: StatutChambre }) {
  return (
    <span className={`badge ${CLASSES_STATUT_CHAMBRE[statut]}`}>
      {LIBELLES_STATUT_CHAMBRE[statut]}
    </span>
  );
}

export function BadgeType({ type }: { type: TypeChambre }) {
  return <span className="badge badge-neutre">{LIBELLES_TYPE_CHAMBRE[type] ?? type}</span>;
}

/** Carte d'indicateur du tableau de bord */
export function CarteStat({
  libelle,
  valeur,
  detail,
  variante = '',
}: {
  libelle: string;
  valeur: ReactNode;
  detail?: ReactNode;
  variante?: '' | 'accent' | 'succes' | 'danger' | 'info';
}) {
  return (
    <div className={`carte-stat ${variante}`}>
      <div className="carte-stat-libelle">{libelle}</div>
      <div className="carte-stat-valeur">{valeur}</div>
      {detail ? <div className="carte-stat-detail">{detail}</div> : null}
    </div>
  );
}

/** Barre de progression (taux d'occupation) */
export function BarreProgression({ pourcentage }: { pourcentage: number }) {
  const valeur = Math.max(0, Math.min(100, pourcentage));
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <div className="barre-progression" style={{ flex: 1, minWidth: 80 }}>
        <div className="barre-progression-remplissage" style={{ width: `${valeur}%` }} />
      </div>
      <span style={{ fontSize: 12.5, color: 'var(--muted)', minWidth: 38 }}>{valeur}%</span>
    </div>
  );
}

/** Fenetre modale */
export function Modale({
  titre,
  ouvert,
  onFermer,
  children,
  pied,
  large = false,
}: {
  titre: string;
  ouvert: boolean;
  onFermer: () => void;
  children: ReactNode;
  pied?: ReactNode;
  large?: boolean;
}) {
  if (!ouvert) return null;
  return (
    <div
      className="voile"
      onClick={(e) => {
        if (e.target === e.currentTarget) onFermer();
      }}
    >
      <div className={`modale ${large ? 'modale-large' : ''}`} role="dialog" aria-modal="true">
        <div className="modale-entete">
          <h3 className="modale-titre">{titre}</h3>
          <button type="button" className="bouton-icone" onClick={onFermer} aria-label="Fermer">
            ✕
          </button>
        </div>
        <div className="modale-corps">{children}</div>
        {pied ? <div className="modale-pied">{pied}</div> : null}
      </div>
    </div>
  );
}

/** Pagination simple */
export function Pagination({
  page,
  pages,
  total,
  onChanger,
}: {
  page: number;
  pages: number;
  total: number;
  onChanger: (page: number) => void;
}) {
  if (total === 0) return null;
  return (
    <div className="pagination">
      <span>
        Page {page} sur {pages} — {total} element{total > 1 ? 's' : ''}
      </span>
      <div className="pagination-boutons">
        <button
          type="button"
          className="bouton bouton-secondaire bouton-mini"
          disabled={page <= 1}
          onClick={() => onChanger(page - 1)}
        >
          ← Precedent
        </button>
        <button
          type="button"
          className="bouton bouton-secondaire bouton-mini"
          disabled={page >= pages}
          onClick={() => onChanger(page + 1)}
        >
          Suivant →
        </button>
      </div>
    </div>
  );
}
