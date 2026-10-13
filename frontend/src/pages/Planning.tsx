import { Link } from 'react-router-dom';
import { apiStats } from '../api/client';
import { EntetePage } from '../components/Layout';
import {
  Alerte,
  BadgeReservation,
  BarreProgression,
  CarteStat,
  Chargement,
  EtatVide,
} from '../components/ui';
import { useFetch } from '../hooks/useFetch';
import type { StatutReservation } from '../types';
import { formaterDate, formaterMontant } from '../utils/format';

function pourcentage(part: number, total: number): number {
  return total > 0 ? Math.round((part / total) * 100) : 0;
}

/** Tableau de bord des performances accessible depuis la rubrique Planning. */
export function Planning() {
  const performances = useFetch(() => apiStats.tableauDeBord(), []);
  const d = performances.donnees;

  const statuts: Array<{ statut: StatutReservation; nombre: number }> = d
    ? [
        { statut: 'CONFIRMEE', nombre: d.reservations.confirmees },
        { statut: 'EN_ATTENTE', nombre: d.reservations.enAttente },
        { statut: 'TERMINEE', nombre: d.reservations.terminees },
        { statut: 'ANNULEE', nombre: d.reservations.annulees },
      ]
    : [];
  const totalStatuts = statuts.reduce((total, ligne) => total + ligne.nombre, 0);
  const periode = d
    ? new Intl.DateTimeFormat('fr-FR', {
        month: 'long',
        year: 'numeric',
        timeZone: 'UTC',
      }).format(new Date(`${d.mois}-01T00:00:00.000Z`))
    : '';

  return (
    <>
      <EntetePage
        titre="Performances de l'hôtel"
        sousTitre="Suivi de l'occupation, des réservations et des revenus."
        actions={
          <Link to="/reservations" className="bouton bouton-secondaire">
            Voir les réservations
          </Link>
        }
      />

      <div className="page">
        <Alerte type="erreur">{performances.erreur}</Alerte>
        {performances.chargement ? <Chargement texte="Chargement des performances..." /> : null}

        {d ? (
          <>
            <div className="performance-periode">
              <span>Période analysée : <strong>{periode}</strong></span>
              <span>Données actualisées le {formaterDate(d.date)}</span>
            </div>

            <div className="grille grille-stats">
              <CarteStat
                libelle="Occupation du mois"
                valeur={`${d.tauxOccupation}%`}
                detail={periode}
                variante="accent"
              />
              <CarteStat
                libelle="Revenus du mois"
                valeur={formaterMontant(d.revenus.duMois)}
                detail={`${formaterMontant(d.revenus.aVenir)} confirmés à venir`}
                variante="succes"
              />
              <CarteStat
                libelle="Réservations du mois"
                valeur={d.reservations.ceMois}
                detail={`${d.reservations.enAttente} en attente de traitement`}
                variante="info"
              />
              <CarteStat
                libelle="Nouveaux clients"
                valeur={d.clients.nouveauxCeMois}
                detail={`${d.clients.total} clients au total`}
              />
            </div>

            <div className="grille grille-2 performance-grille">
              <section className="carte performance-carte">
                <h2 className="carte-titre">Occupation du parc</h2>
                <p className="carte-description">
                  Nuits réservées rapportées à la capacité disponible sur le mois.
                </p>
                <div className="performance-taux">
                  <strong>{d.tauxOccupation}%</strong>
                  <span>occupation moyenne · {periode}</span>
                </div>
                <BarreProgression pourcentage={d.tauxOccupation} />

                <div className="performance-mesures">
                  {[
                    { libelle: 'Chambres occupées', valeur: d.chambres.occupees },
                    { libelle: 'Chambres libres', valeur: d.chambres.libres },
                    { libelle: 'En maintenance', valeur: d.chambres.maintenance },
                  ].map((mesure) => (
                    <div className="performance-mesure" key={mesure.libelle}>
                      <div className="performance-mesure-entete">
                        <span>{mesure.libelle}</span>
                        <strong>{mesure.valeur} / {d.chambres.total}</strong>
                      </div>
                      <BarreProgression
                        pourcentage={pourcentage(mesure.valeur, d.chambres.total)}
                      />
                    </div>
                  ))}
                </div>
              </section>

              <section className="carte performance-carte">
                <h2 className="carte-titre">Réservations par statut</h2>
                <p className="carte-description">
                  Répartition des réservations enregistrées dans le système.
                </p>
                {statuts.map((ligne) => (
                  <div className="performance-statut" key={ligne.statut}>
                    <div className="performance-statut-entete">
                      <BadgeReservation statut={ligne.statut} />
                      <strong>{ligne.nombre}</strong>
                    </div>
                    <BarreProgression
                      pourcentage={pourcentage(ligne.nombre, totalStatuts)}
                    />
                  </div>
                ))}
                <div className="performance-total-reservations">
                  {d.reservations.total} réservation(s) au total
                </div>
              </section>
            </div>

            <div className="grille grille-2 performance-grille">
              <section className="carte performance-carte">
                <h2 className="carte-titre">Performance financière</h2>
                <p className="carte-description">Revenus réalisés et séjours confirmés à venir.</p>
                <div className="performance-revenu-principal">
                  <span className="detail-libelle">Revenus réalisés ce mois</span>
                  <strong>{formaterMontant(d.revenus.duMois)}</strong>
                </div>
                <div className="performance-revenu-secondaire">
                  <span>Revenus confirmés à venir</span>
                  <strong>{formaterMontant(d.revenus.aVenir)}</strong>
                </div>
                <div className="performance-revenu-secondaire">
                  <span>Réservations prises ce mois</span>
                  <strong>{d.reservations.ceMois}</strong>
                </div>
              </section>

              <section className="carte performance-carte">
                <h2 className="carte-titre">Activité du jour</h2>
                <p className="carte-description">Mouvements attendus et points à traiter.</p>
                <div className="performance-flux">
                  <div className="performance-flux-item">
                    <span>Arrivées prévues</span>
                    <strong>{d.reservations.arriveesDuJour}</strong>
                  </div>
                  <div className="performance-flux-item">
                    <span>Départs prévus</span>
                    <strong>{d.reservations.departsDuJour}</strong>
                  </div>
                </div>
                {d.alertes.maintenance > 0 || d.alertes.enAttente > 0 ? (
                  <div className="performance-alerte">
                    {d.alertes.enAttente > 0
                      ? `${d.alertes.enAttente} réservation(s) en attente. `
                      : ''}
                    {d.alertes.maintenance > 0
                      ? `${d.alertes.maintenance} chambre(s) en maintenance.`
                      : ''}
                  </div>
                ) : (
                  <p className="performance-sans-alerte">Aucun point prioritaire à traiter.</p>
                )}
              </section>
            </div>

            <section className="carte performance-arrivees">
              <h2 className="carte-titre">Prochaines arrivées</h2>
              <p className="carte-description">
                Séjours à préparer parmi les prochaines réservations confirmées ou en attente.
              </p>
              {d.prochainesArrivees.length === 0 ? (
                <EtatVide
                  titre="Aucune arrivée à venir"
                  texte="Les prochaines réservations apparaîtront ici."
                />
              ) : (
                <div className="tableau-conteneur">
                  <table>
                    <thead>
                      <tr>
                        <th>Référence</th>
                        <th>Client</th>
                        <th>Chambre</th>
                        <th>Arrivée</th>
                        <th>Départ</th>
                        <th className="alignement-droite">Montant</th>
                        <th>Statut</th>
                      </tr>
                    </thead>
                    <tbody>
                      {d.prochainesArrivees.map((arrivee) => (
                        <tr key={arrivee.id}>
                          <td className="cellule-principale">{arrivee.reference}</td>
                          <td>{arrivee.client}</td>
                          <td>Chambre {arrivee.chambre}</td>
                          <td>{formaterDate(arrivee.dateArrivee)}</td>
                          <td>{formaterDate(arrivee.dateDepart)}</td>
                          <td className="alignement-droite">
                            {formaterMontant(arrivee.montantTotal)}
                          </td>
                          <td><BadgeReservation statut={arrivee.statut} /></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </>
        ) : null}
      </div>
    </>
  );
}
