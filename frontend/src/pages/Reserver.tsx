import { useState, type FormEvent } from 'react';
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { apiChambres, apiReservations } from '../api/client';
import { EntetePage } from '../components/Layout';
import { Alerte, BadgeType, Chargement } from '../components/ui';
import { useAuth } from '../context/AuthContext';
import { useFetch } from '../hooks/useFetch';
import type { Reservation } from '../types';
import {
  ajouterJours,
  dateAujourdhui,
  formaterDate,
  formaterMontant,
} from '../utils/format';
import { imageChambre } from '../utils/images';

function nuitsEntre(arrivee: string, depart: string): number {
  const ms = new Date(depart).getTime() - new Date(arrivee).getTime();
  return ms > 0 ? Math.round(ms / 86400000) : 0;
}

/**
 * Finalisation d'une reservation. Route protegee : la connexion n'est exigee
 * qu'a cette etape. Un client reserve pour lui-meme (sa fiche est retrouvee
 * cote API a partir de son compte) ; le personnel passe par la page Reservations.
 */
export function Reserver() {
  const [params] = useSearchParams();
  const naviguer = useNavigate();
  const { aLeRole } = useAuth();

  const chambreId = Number(params.get('chambreId') ?? 0);
  const aujourdHui = dateAujourdhui();
  const [formulaire, setFormulaire] = useState({
    arrivee: params.get('arrivee') ?? aujourdHui,
    depart: params.get('depart') ?? ajouterJours(aujourdHui, 2),
    personnes: params.get('personnes') ?? '1',
    notes: '',
  });
  const [erreur, setErreur] = useState<string | null>(null);
  const [envoi, setEnvoi] = useState(false);
  const [confirmation, setConfirmation] = useState<Reservation | null>(null);

  const chambre = useFetch(
    () => apiChambres.detail(chambreId),
    [chambreId],
  );

  // Le personnel dispose d'un outil complet : on le redirige.
  if (aLeRole('ADMIN', 'RECEPTIONNISTE')) {
    return <Navigate to="/reservations" replace />;
  }

  const soumettre = async (e: FormEvent) => {
    e.preventDefault();
    setErreur(null);
    if (formulaire.depart <= formulaire.arrivee) {
      setErreur('La date de depart doit etre posterieure a la date d arrivee.');
      return;
    }
    setEnvoi(true);
    try {
      const { donnees } = await apiReservations.creer({
        chambreId,
        dateArrivee: formulaire.arrivee,
        dateDepart: formulaire.depart,
        nombrePersonnes: Number(formulaire.personnes) || 1,
        notes: formulaire.notes || undefined,
      });
      setConfirmation(donnees);
    } catch (err) {
      setErreur(
        err instanceof Error
          ? err.message
          : 'Reservation impossible. Cette chambre est peut-etre deja prise sur ces dates.',
      );
    } finally {
      setEnvoi(false);
    }
  };

  // -------- Confirmation --------
  if (confirmation) {
    return (
      <>
        <EntetePage titre="Reservation enregistree" sousTitre="Votre demande a bien ete prise en compte." />
        <div className="page">
          <div className="carte" style={{ maxWidth: 620 }}>
            <div className="carte-titre">Merci, c'est reserve !</div>
            <p className="carte-description">
              Reference <strong>{confirmation.reference}</strong>. La reception confirmera votre
              sejour sous peu. Vous retrouverez le detail de votre reservation a votre arrivee.
            </p>
            <div className="liste-details" style={{ marginTop: 18 }}>
              <div>
                <div className="detail-libelle">Chambre</div>
                <div className="detail-valeur">
                  {'numero' in confirmation.chambre ? confirmation.chambre.numero : ''}
                </div>
              </div>
              <div>
                <div className="detail-libelle">Sejour</div>
                <div className="detail-valeur">
                  {formaterDate(confirmation.dateArrivee)} → {formaterDate(confirmation.dateDepart)}
                </div>
              </div>
              <div>
                <div className="detail-libelle">Montant</div>
                <div className="detail-valeur">{formaterMontant(confirmation.montantTotal)}</div>
              </div>
            </div>
            <div style={{ marginTop: 22, display: 'flex', gap: 10 }}>
              <Link to="/chambres" className="bouton bouton-secondaire">Voir les chambres</Link>
              <button type="button" className="bouton" onClick={() => naviguer('/')}>
                Retour a l'accueil
              </button>
            </div>
          </div>
        </div>
      </>
    );
  }

  const d = chambre.donnees;
  const nuits = nuitsEntre(formulaire.arrivee, formulaire.depart);

  return (
    <>
      <EntetePage
        titre="Finaliser la reservation"
        sousTitre="Plus qu'une etape : choisissez vos dates et confirmez."
        actions={<Link to="/disponibilites" className="bouton bouton-secondaire">← Disponibilites</Link>}
      />

      <div className="page">
        <Alerte type="erreur">{erreur ?? chambre.erreur}</Alerte>

        {chambre.chargement ? <Chargement texte="Chargement de la chambre..." /> : null}

        {!chambre.chargement && d ? (
          <div className="grille grille-2">
            <div className="carte" style={{ margin: 0, padding: 0, overflow: 'hidden' }}>
              <img
                src={imageChambre(d)}
                alt={`Chambre ${d.numero}`}
                style={{ width: '100%', aspectRatio: '4/3', objectFit: 'cover', display: 'block' }}
              />
              <div style={{ padding: '18px 20px' }}>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }}>
                  <BadgeType type={d.type} />
                  <span className="cellule-secondaire">Chambre {d.numero} · etage {d.etage}</span>
                </div>
                <p className="carte-description" style={{ marginBottom: 0 }}>{d.description}</p>
              </div>
            </div>

            <form className="carte" style={{ margin: 0 }} onSubmit={soumettre}>
              <h2 className="carte-titre">Votre sejour</h2>

              <div className="grille-champs">
                <div className="champ">
                  <label className="champ-label" htmlFor="arrivee">Arrivee</label>
                  <input
                    id="arrivee"
                    type="date"
                    value={formulaire.arrivee}
                    min={aujourdHui}
                    onChange={(e) => setFormulaire({ ...formulaire, arrivee: e.target.value })}
                    required
                  />
                </div>
                <div className="champ">
                  <label className="champ-label" htmlFor="depart">Depart</label>
                  <input
                    id="depart"
                    type="date"
                    value={formulaire.depart}
                    min={formulaire.arrivee}
                    onChange={(e) => setFormulaire({ ...formulaire, depart: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="champ">
                <label className="champ-label" htmlFor="personnes">Voyageurs</label>
                <input
                  id="personnes"
                  type="number"
                  min={1}
                  max={d.capacite}
                  value={formulaire.personnes}
                  onChange={(e) => setFormulaire({ ...formulaire, personnes: e.target.value })}
                  required
                />
                <div className="champ-aide">Capacite maximale : {d.capacite} personne(s).</div>
              </div>

              <div className="champ">
                <label className="champ-label" htmlFor="notes">Demandes particulieres</label>
                <textarea
                  id="notes"
                  value={formulaire.notes}
                  onChange={(e) => setFormulaire({ ...formulaire, notes: e.target.value })}
                  placeholder="Lit bebe, arrivee tardive, preferences..."
                />
              </div>

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'baseline',
                  padding: '14px 0',
                  borderTop: '1px solid var(--bordure)',
                  marginTop: 6,
                }}
              >
                <span className="cellule-secondaire">
                  {nuits} nuit(s) × {formaterMontant(d.prixParNuit)}
                </span>
                <span className="detail-valeur">{formaterMontant(nuits * d.prixParNuit)}</span>
              </div>

              <button type="submit" className="bouton bouton-accent" disabled={envoi} style={{ width: '100%' }}>
                {envoi ? 'Envoi...' : 'Confirmer la reservation'}
              </button>
              <div className="champ-aide" style={{ marginTop: 10 }}>
                Aucun paiement en ligne : la reception vous contactera pour confirmer.
              </div>
            </form>
          </div>
        ) : null}
      </div>
    </>
  );
}
