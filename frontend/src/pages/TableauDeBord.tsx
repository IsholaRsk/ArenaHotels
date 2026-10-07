import { Link } from 'react-router-dom';
import { apiChambres, apiStats } from '../api/client';
import {
  Alerte,
  BarreProgression,
  BadgeReservation,
  CarteChambre,
  CarteStat,
  Chargement,
  EtatVide,
} from '../components/ui';
import { useAuth } from '../context/AuthContext';
import { useFetch } from '../hooks/useFetch';
import { IMAGE_LOBBY } from '../utils/images';
import {
  LIBELLES_TYPE_CHAMBRE,
  dateAujourdhui,
  formaterDate,
  formaterMontant,
} from '../utils/format';

/** Page d'accueil : bandeau photographique + indicateurs epures */
export function TableauDeBord() {
  const { utilisateur, aLeRole } = useAuth();
  const estDuPersonnel = aLeRole('ADMIN', 'RECEPTIONNISTE');

  const stats = useFetch(() => apiStats.tableauDeBord(), [estDuPersonnel]);
  const catalogue = useFetch(() => apiChambres.lister({ limit: 100 }), []);

  // -------- Vue client : catalogue photographique --------
  if (!estDuPersonnel) {
    return (
      <>
        <div className="bande-hero">
          <img src={IMAGE_LOBBY} alt="Hall de l'hotel" />
          <div className="bande-hero-voile">
            <div className="bande-hero-titre">
              {utilisateur
                ? `Bonjour, ${utilisateur.nom.split(' ')[0]}.`
                : 'Bienvenue chez Arena Hotels.'}
            </div>
            <div className="bande-hero-texte">
              Consultez nos chambres et preparez votre prochain sejour a Cotonou.
            </div>
          </div>
        </div>

        <div className="page">
          <Alerte type="erreur">{catalogue.erreur}</Alerte>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 22 }}>
            <h2 className="carte-titre" style={{ fontSize: 24 }}>Nos chambres</h2>
            <Link to="/disponibilites" className="bouton">
              Verifier une disponibilite
            </Link>
          </div>

          {catalogue.chargement ? <Chargement /> : null}
          {!catalogue.chargement && (catalogue.donnees ?? []).length === 0 ? (
            <EtatVide titre="Aucune chambre publiee" />
          ) : null}

          {!catalogue.chargement ? (
            <div className="grille-chambres">
              {(catalogue.donnees ?? []).map((chambre) => (
                <CarteChambre
                  key={chambre.id}
                  chambre={chambre}
                  action={
                    <Link to={`/chambres/${chambre.id}`} className="bouton bouton-secondaire bouton-mini">
                      Voir
                    </Link>
                  }
                />
              ))}
            </div>
          ) : null}
        </div>
      </>
    );
  }

  const d = stats.donnees;

  // -------- Vue reception : indicateurs --------
  return (
    <>
      <div className="bande-hero">
        <img src={IMAGE_LOBBY} alt="Hall de l'hotel" />
        <div className="bande-hero-voile">
          <div className="bande-hero-titre">
            {formaterDate(dateAujourdhui())} — situation de l'hotel
          </div>
          <div className="bande-hero-texte">
            {d ? `${d.reservations.arriveesDuJour} arrivee(s) et ${d.reservations.departsDuJour} depart(s) prevus aujourd'hui.` : 'Chargement des indicateurs...'}
          </div>
        </div>
      </div>

      <div className="page">
        <Alerte type="erreur">{stats.erreur}</Alerte>

        {stats.chargement || !d ? (
          <Chargement texte="Calcul des indicateurs..." />
        ) : (
          <>
            <div className="grille grille-stats">
              <CarteStat
                libelle="Chambres libres"
                valeur={`${d.chambres.libres}/${d.chambres.total}`}
                detail={`${d.chambres.occupees} occupee(s) · ${d.chambres.maintenance} en maintenance`}
              />
              <CarteStat
                libelle="Arrivees aujourd'hui"
                valeur={d.reservations.arriveesDuJour}
                detail={`${d.reservations.departsDuJour} depart(s) prevu(s)`}
              />
              <CarteStat
                libelle="Occupation du mois"
                valeur={`${d.tauxOccupation}%`}
                detail={`${d.reservations.ceMois} reservation(s) en ${d.mois}`}
              />
              <CarteStat
                libelle="Revenus du mois"
                valeur={formaterMontant(d.revenus.duMois)}
                detail={`${formaterMontant(d.revenus.aVenir)} confirmes a venir`}
              />
            </div>

            {d.alertes.maintenance > 0 || d.alertes.enAttente > 0 ? (
              <div style={{ marginTop: 20 }}>
                <Alerte type="attente">
                  {d.alertes.enAttente > 0 ? `${d.alertes.enAttente} reservation(s) en attente. ` : ''}
                  {d.alertes.maintenance > 0 ? `${d.alertes.maintenance} chambre(s) en maintenance.` : ''}
                </Alerte>
              </div>
            ) : null}

            <div className="grille grille-2" style={{ marginTop: 22 }}>
              <section className="carte" style={{ margin: 0 }}>
                <h2 className="carte-titre">Prochaines arrivees</h2>
                <p className="carte-description">Les six prochains check-in attendus a la reception.</p>
                {d.prochainesArrivees.length === 0 ? (
                  <EtatVide icone="🛎️" titre="Aucune arrivee a venir" />
                ) : (
                  <div className="liste-simple">
                    {d.prochainesArrivees.map((r) => (
                      <div className="liste-simple-ligne" key={r.id}>
                        <div>
                          <div className="cellule-principale">
                            {r.client} <span className="cellule-secondaire">· chambre {r.chambre}</span>
                          </div>
                          <div className="cellule-secondaire">
                            {formaterDate(r.dateArrivee)} → {formaterDate(r.dateDepart)} · {formaterMontant(r.montantTotal)}
                          </div>
                        </div>
                        <BadgeReservation statut={r.statut} />
                      </div>
                    ))}
                  </div>
                )}
                <Link to="/reservations" className="lien">Voir toutes les reservations →</Link>
              </section>

              <section className="carte" style={{ margin: 0 }}>
                <h2 className="carte-titre">Parc de chambres</h2>
                <p className="carte-description">Repartition par type.</p>
                <div className="liste-simple">
                  {d.chambres.parType.map((ligne) => (
                    <div className="liste-simple-ligne" key={ligne.type}>
                      <span className="cellule-principale">{LIBELLES_TYPE_CHAMBRE[ligne.type]}</span>
                      <span className="cellule-secondaire">{ligne.nombre} chambre{ligne.nombre > 1 ? 's' : ''}</span>
                    </div>
                  ))}
                </div>

                <div style={{ marginTop: 20 }}>
                  <div className="detail-libelle">Occupation du mois</div>
                  <div style={{ marginTop: 8 }}>
                    <BarreProgression pourcentage={d.tauxOccupation} />
                  </div>
                </div>

                <div className="liste-details" style={{ marginTop: 22 }}>
                  <div>
                    <div className="detail-libelle">Clients</div>
                    <div className="detail-valeur">{d.clients.total}</div>
                  </div>
                  <div>
                    <div className="detail-libelle">Nouveaux ce mois</div>
                    <div className="detail-valeur">{d.clients.nouveauxCeMois}</div>
                  </div>
                  <div>
                    <div className="detail-libelle">Annulees</div>
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
