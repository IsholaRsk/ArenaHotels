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
import { IMAGE_ACCUEIL, IMAGE_LOBBY, IMAGE_LOUVRE } from '../utils/images';
import {
  LIBELLES_TYPE_CHAMBRE,
  dateAujourdhui,
  formaterDate,
  formaterMontant,
} from '../utils/format';

/** Services mis en avant sur l'accueil client */
const SERVICES = [
  { icone: '🛎️', titre: 'Reception 24h/24', texte: 'Une equipe attentionnee, jour et nuit.' },
  { icone: '🥐', titre: 'Petit-dejeuner', texte: 'Buffet gourmand servi chaque matin.' },
  { icone: '📶', titre: 'Wi-Fi fibre', texte: 'Connexion rapide et gratuite partout.' },
  { icone: '🧳', titre: 'Bagagerie', texte: 'Deposez vos bagages avant ou apres le sejour.' },
  { icone: '🧹', titre: 'Menage quotidien', texte: 'Une chambre impeccable chaque jour.' },
  { icone: '🗺️', titre: 'Conciergerie', texte: 'Conseils et billets pour vos visites a Paris.' },
];

/** Page d'accueil : bandeau photographique + indicateurs epures */
export function TableauDeBord() {
  const { utilisateur, aLeRole } = useAuth();
  const estDuPersonnel = aLeRole('ADMIN', 'RECEPTIONNISTE');

  const stats = useFetch(() => apiStats.tableauDeBord(), [estDuPersonnel]);
  const catalogue = useFetch(() => apiChambres.lister({ limit: 100 }), []);

  // -------- Vue client : accueil photographique + services + localisation --------
  if (!estDuPersonnel) {
    return (
      <>
        <div className="bande-hero bande-hero-grande">
          <img src={IMAGE_ACCUEIL} alt="Arena Hotels a Paris, pres du Louvre" />
          <div className="bande-hero-voile">
            <div className="bande-hero-titre">
              {utilisateur
                ? `Bonjour, ${utilisateur.nom.split(' ')[0]}.`
                : 'Bienvenue chez Arena Hotels, Paris.'}
            </div>
            <div className="bande-hero-texte">
              Un ecrin de calme a deux pas du Louvre, au coeur de Paris.
            </div>
            <div className="hero-actions">
              <Link to="/chambres" className="bouton">Decouvrir nos chambres</Link>
              <Link to="/disponibilites" className="bouton bouton-secondaire">
                Verifier une disponibilite
              </Link>
            </div>
          </div>
        </div>

        <div className="page">
          <h2 className="carte-titre" style={{ fontSize: 24 }}>Nos services</h2>
          <p className="carte-description">
            Tout pour un sejour confortable, au coeur de Paris.
          </p>
          <div className="grille-services">
            {SERVICES.map((service) => (
              <div className="carte carte-service" key={service.titre}>
                <div className="service-icone">{service.icone}</div>
                <div className="service-titre">{service.titre}</div>
                <div className="service-texte">{service.texte}</div>
              </div>
            ))}
          </div>

          <div className="carte carte-localisation">
            <div className="localisation-texte">
              <h2 className="carte-titre" style={{ fontSize: 24 }}>
                Au coeur de Paris, pres du Louvre
              </h2>
              <p className="carte-description">
                L'hotel vous place a quelques minutes des plus beaux sites de la capitale.
              </p>
            </div>
            <img src={IMAGE_LOUVRE} alt="Le Louvre, a quelques minutes de l'hotel" />
          </div>
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
