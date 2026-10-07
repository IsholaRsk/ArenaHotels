import { Link } from 'react-router-dom';
import { apiChambres, apiStats } from '../api/client';
import {
  Alerte,
  BarreProgression,
  BadgeChambre,
  BadgeReservation,
  CarteStat,
  Chargement,
  EtatVide,
} from '../components/ui';
import { EntetePage } from '../components/Layout';
import { useAuth } from '../context/AuthContext';
import { useFetch } from '../hooks/useFetch';
import {
  LIBELLES_TYPE_CHAMBRE,
  dateAujourdhui,
  formaterDate,
  formaterMontant,
} from '../utils/format';

/** Page d'accueil : indicateurs de l'hotel et arrivees du jour */
export function TableauDeBord() {
  const { utilisateur, aLeRole } = useAuth();
  const estDuPersonnel = aLeRole('ADMIN', 'RECEPTIONNISTE');

  const stats = useFetch(
    () => apiStats.tableauDeBord(),
    [estDuPersonnel],
  );

  // Les clients ne voient pas les indicateurs internes : on leur affiche le catalogue
  const catalogue = useFetch(
    () => apiChambres.lister({ limit: 100 }),
    [],
  );

  if (!estDuPersonnel) {
    return (
      <>
        <EntetePage
          titre={`Bonjour ${utilisateur?.nom?.split(' ')[0] ?? ''} 👋`}
          sousTitre="Consultez nos chambres et preparez votre prochain sejour."
          actions={
            <Link to="/disponibilites" className="bouton">
              Chercher une disponibilite
            </Link>
          }
        />
        <div className="page">
          {catalogue.chargement ? <Chargement /> : null}
          <Alerte type="erreur">{catalogue.erreur}</Alerte>
          <div className="carte">
            <h2 className="carte-titre">Nos chambres</h2>
            <p className="carte-description">
              Tarifs en francs CFA, par nuit. Les disponibilites sont verifiees en temps
              reel au moment de la reservation.
            </p>
            <div className="tableau-conteneur">
              <table>
                <thead>
                  <tr>
                    <th>Numero</th>
                    <th>Type</th>
                    <th>Capacite</th>
                    <th>Etage</th>
                    <th className="alignement-droite">Prix / nuit</th>
                    <th>Statut</th>
                  </tr>
                </thead>
                <tbody>
                  {(catalogue.donnees ?? []).map((chambre) => (
                    <tr key={chambre.id}>
                      <td className="cellule-principale">
                        <Link to={`/chambres/${chambre.id}`} className="lien">
                          {chambre.numero}
                        </Link>
                      </td>
                      <td>{LIBELLES_TYPE_CHAMBRE[chambre.type]}</td>
                      <td>{chambre.capacite} pers.</td>
                      <td>{chambre.etage}</td>
                      <td className="alignement-droite cellule-principale">
                        {formaterMontant(chambre.prixParNuit)}
                      </td>
                      <td>
                        <BadgeChambre statut={chambre.statut} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {(catalogue.donnees ?? []).length === 0 && !catalogue.chargement ? (
              <EtatVide titre="Aucune chambre publiee" />
            ) : null}
          </div>
        </div>
      </>
    );
  }

  const d = stats.donnees;

  return (
    <>
      <EntetePage
        titre="Tableau de bord"
        sousTitre={`Situation de l'hotel au ${formaterDate(dateAujourdhui())}`}
        actions={
          <>
            <Link to="/disponibilites" className="bouton bouton-secondaire">
              Disponibilites
            </Link>
            <Link to="/planning" className="bouton">
              Voir le planning
            </Link>
          </>
        }
      />

      <div className="page">
        <Alerte type="erreur">{stats.erreur}</Alerte>

        {stats.chargement || !d ? (
          <Chargement texte="Calcul des indicateurs..." />
        ) : (
          <>
            <div className="grille grille-stats">
              <CarteStat
                libelle="Chambres disponibles"
                valeur={`${d.chambres.libres}/${d.chambres.total}`}
                detail={`${d.chambres.occupees} occupee(s) • ${d.chambres.maintenance} en maintenance`}
                variante="succes"
              />
              <CarteStat
                libelle="Arrivees aujourd'hui"
                valeur={d.reservations.arriveesDuJour}
                detail={`${d.reservations.departsDuJour} depart(s) prevu(s)`}
                variante="info"
              />
              <CarteStat
                libelle="Taux d'occupation du mois"
                valeur={`${d.tauxOccupation}%`}
                detail={`${d.reservations.ceMois} reservation(s) sur ${d.mois}`}
                variante="accent"
              />
              <CarteStat
                libelle="Revenus du mois"
                valeur={formaterMontant(d.revenus.duMois)}
                detail={`${formaterMontant(d.revenus.aVenir)} deja confirmes a venir`}
              />
            </div>

            {d.alertes.maintenance > 0 || d.alertes.enAttente > 0 ? (
              <div style={{ marginTop: 18 }}>
                <Alerte type="attente">
                  {d.alertes.enAttente > 0
                    ? `${d.alertes.enAttente} reservation(s) en attente de confirmation.`
                    : ''}{' '}
                  {d.alertes.maintenance > 0
                    ? `${d.alertes.maintenance} chambre(s) indisponible(s) pour maintenance.`
                    : ''}
                </Alerte>
              </div>
            ) : null}

            <div className="grille grille-2" style={{ marginTop: 20 }}>
              <section className="carte" style={{ margin: 0 }}>
                <h2 className="carte-titre">Prochaines arrivees</h2>
                <p className="carte-description">
                  Les six prochains check-in attendus a la reception.
                </p>
                {d.prochainesArrivees.length === 0 ? (
                  <EtatVide icone="🛎️" titre="Aucune arrivee a venir" />
                ) : (
                  <div className="liste-simple">
                    {d.prochainesArrivees.map((r) => (
                      <div className="liste-simple-ligne" key={r.id}>
                        <div>
                          <div className="cellule-principale">
                            {r.client}{' '}
                            <span className="cellule-secondaire">
                              · chambre {r.chambre}
                            </span>
                          </div>
                          <div className="cellule-secondaire">
                            {formaterDate(r.dateArrivee)} → {formaterDate(r.dateDepart)} ·{' '}
                            {formaterMontant(r.montantTotal)}
                          </div>
                        </div>
                        <BadgeReservation statut={r.statut} />
                      </div>
                    ))}
                  </div>
                )}
                <Link to="/reservations" className="lien">
                  Voir toutes les reservations →
                </Link>
              </section>

              <section className="carte" style={{ margin: 0 }}>
                <h2 className="carte-titre">Parc de chambres</h2>
                <p className="carte-description">
                  Repartition par type et etat d'occupation actuel.
                </p>
                <div className="liste-simple">
                  {d.chambres.parType.map((ligne) => (
                    <div className="liste-simple-ligne" key={ligne.type}>
                      <span className="cellule-principale">
                        {LIBELLES_TYPE_CHAMBRE[ligne.type]}
                      </span>
                      <span className="cellule-secondaire">
                        {ligne.nombre} chambre{ligne.nombre > 1 ? 's' : ''}
                      </span>
                    </div>
                  ))}
                </div>

                <div style={{ marginTop: 18 }}>
                  <div className="detail-libelle">Occupation du mois</div>
                  <div style={{ marginTop: 8 }}>
                    <BarreProgression pourcentage={d.tauxOccupation} />
                  </div>
                </div>

                <div className="liste-details" style={{ marginTop: 20 }}>
                  <div>
                    <div className="detail-libelle">Clients enregistres</div>
                    <div className="detail-valeur">{d.clients.total}</div>
                  </div>
                  <div>
                    <div className="detail-libelle">Nouveaux ce mois</div>
                    <div className="detail-valeur">{d.clients.nouveauxCeMois}</div>
                  </div>
                  <div>
                    <div className="detail-libelle">Reservations annulees</div>
                    <div className="detail-valeur">{d.reservations.annulees}</div>
                  </div>
                </div>
              </section>
            </div>
          </>
        )}
      </div>
    </>
  );
}
