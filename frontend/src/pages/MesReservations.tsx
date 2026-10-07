import { useState } from 'react';
import { Link } from 'react-router-dom';
import { apiReservations } from '../api/client';
import { EntetePage } from '../components/Layout';
import {
  Alerte,
  BadgeReservation,
  BadgeType,
  Chargement,
  EtatVide,
  Modale,
} from '../components/ui';
import { useFetch } from '../hooks/useFetch';
import type { Reservation } from '../types';
import { formaterDate, formaterMontant } from '../utils/format';

/**
 * Espace client : uniquement SES reservations (l'API filtre sur le compte).
 * Le client peut consulter et annuler ; la confirmation / le check-in sont
 * reserves a la reception.
 */
export function MesReservations() {
  const liste = useFetch(() => apiReservations.lister({ limit: 50 }), []);
  const [erreur, setErreur] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [aAnnuler, setAAnnuler] = useState<Reservation | null>(null);
  const [envoi, setEnvoi] = useState(false);

  const annuler = async () => {
    if (!aAnnuler) return;
    setEnvoi(true);
    setErreur(null);
    try {
      await apiReservations.changerStatut(aAnnuler.id, 'ANNULEE');
      setMessage(`Reservation ${aAnnuler.reference} annulee.`);
      setAAnnuler(null);
      liste.recharger();
    } catch (err) {
      setErreur(err instanceof Error ? err.message : 'Annulation impossible');
      setAAnnuler(null);
    } finally {
      setEnvoi(false);
    }
  };

  const reservations = liste.donnees ?? [];

  return (
    <>
      <EntetePage
        titre="Mes reservations"
        sousTitre="Retrouvez vos sejours et annulez si besoin."
        actions={
          <Link to="/disponibilites" className="bouton bouton-accent">
            + Nouvelle reservation
          </Link>
        }
      />

      <div className="page">
        <Alerte type="erreur">{erreur ?? liste.erreur}</Alerte>
        <Alerte type="succes">{message}</Alerte>

        {liste.chargement ? <Chargement /> : null}

        {!liste.chargement && reservations.length === 0 ? (
          <EtatVide
            icone="🧳"
            titre="Aucune reservation"
            texte="Vous n'avez pas encore de sejour. Consultez nos disponibilites pour reserver."
            action={
              <Link to="/disponibilites" className="bouton bouton-accent">
                Verifier les disponibilites
              </Link>
            }
          />
        ) : null}

        {!liste.chargement && reservations.length > 0 ? (
          <div className="carte">
            <div className="tableau-conteneur">
              <table>
                <thead>
                  <tr>
                    <th>Reference</th>
                    <th>Chambre</th>
                    <th>Sejour</th>
                    <th>Pers.</th>
                    <th className="alignement-droite">Montant</th>
                    <th>Statut</th>
                    <th className="alignement-droite">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {reservations.map((r) => {
                    const annulable =
                      r.statut === 'EN_ATTENTE' || r.statut === 'CONFIRMEE';
                    return (
                      <tr key={r.id}>
                        <td className="cellule-principale">{r.reference}</td>
                        <td>
                          <Link to={`/chambres/${r.chambre.id}`} className="lien">
                            {r.chambre.numero}
                          </Link>
                          <div className="cellule-secondaire">
                            <BadgeType type={r.chambre.type} />
                          </div>
                        </td>
                        <td>
                          {formaterDate(r.dateArrivee)} → {formaterDate(r.dateDepart)}
                          <div className="cellule-secondaire">{r.nuits} nuit(s)</div>
                        </td>
                        <td>{r.nombrePersonnes}</td>
                        <td className="alignement-droite cellule-principale">
                          {formaterMontant(r.montantTotal)}
                        </td>
                        <td>
                          <BadgeReservation statut={r.statut} />
                        </td>
                        <td className="alignement-droite">
                          {annulable ? (
                            <button
                              type="button"
                              className="bouton bouton-mini bouton-danger"
                              onClick={() => setAAnnuler(r)}
                            >
                              Annuler
                            </button>
                          ) : (
                            <span className="cellule-secondaire">—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ) : null}
      </div>

      <Modale
        ouvert={Boolean(aAnnuler)}
        titre="Annuler la reservation"
        onFermer={() => setAAnnuler(null)}
        pied={
          <>
            <button
              type="button"
              className="bouton bouton-secondaire"
              onClick={() => setAAnnuler(null)}
            >
              Retour
            </button>
            <button
              type="button"
              className="bouton bouton-danger"
              onClick={annuler}
              disabled={envoi}
            >
              {envoi ? 'Annulation...' : 'Confirmer l annulation'}
            </button>
          </>
        }
      >
        <p>
          Annuler la reservation <strong>{aAnnuler?.reference}</strong> (chambre{' '}
          {aAnnuler?.chambre.numero}) du {aAnnuler ? formaterDate(aAnnuler.dateArrivee) : ''} ?
          Cette action est definitive.
        </p>
      </Modale>
    </>
  );
}
