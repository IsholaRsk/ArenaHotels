import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { apiChambres } from '../api/client';
import { EntetePage } from '../components/Layout';
import {
  Alerte,
  BadgeChambre,
  BadgeReservation,
  BadgeType,
  Chargement,
  EtatVide,
} from '../components/ui';
import { useAuth } from '../context/AuthContext';
import { useFetch } from '../hooks/useFetch';
import type { Chambre } from '../types';
import { formaterDate, formaterMontant } from '../utils/format';
import { galerieChambre, imageChambre } from '../utils/images';

/** Detail d'une chambre (route dynamique /chambres/:id) + historique */
export function ChambreDetail() {
  const { id } = useParams<{ id: string }>();
  const identifiant = Number(id);
  const { aLeRole } = useAuth();
  const peutGerer = aLeRole('ADMIN', 'RECEPTIONNISTE');

  const chambre = useFetch(() => apiChambres.detail(identifiant), [identifiant]);
  const donnees = chambre.donnees as Chambre | null;

  const [photoActive, setPhotoActive] = useState(0);
  const [zoom, setZoom] = useState(false);
  const galerie = donnees ? galerieChambre(donnees) : [];
  const photos = donnees ? [imageChambre(donnees), ...galerie] : [];

  return (
    <>
      {donnees ? (
        <div className="bande-hero" style={{ height: 240 }}>
          <img src={imageChambre(donnees)} alt={`Chambre ${donnees.numero}`} />
          <div className="bande-hero-voile">
            <div className="bande-hero-titre">Chambre {donnees.numero}</div>
            <div className="bande-hero-texte">
              {formaterMontant(donnees.prixParNuit)} / nuit · {donnees.capacite} personne(s) · etage {donnees.etage}
            </div>
          </div>
        </div>
      ) : null}

      <EntetePage
        titre={donnees ? `Chambre ${donnees.numero}` : 'Chambre'}
        sousTitre="Fiche detaillee et historique des occupations"
        actions={
          <>
            <Link to="/chambres" className="bouton bouton-secondaire">← Retour</Link>
            {donnees ? (
              <Link to={`/reserver?chambreId=${donnees.id}`} className="bouton bouton-accent">
                Reserver
              </Link>
            ) : null}
          </>
        }
      />

      <div className="page">
        <Alerte type="erreur">{chambre.erreur}</Alerte>
        {chambre.chargement ? <Chargement /> : null}

        {donnees ? (
          <>
            <div className="carte">
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 16 }}>
                <BadgeType type={donnees.type} />
                <BadgeChambre statut={donnees.statut} />
              </div>

              <div className="liste-details">
                <div>
                  <div className="detail-libelle">Prix par nuit</div>
                  <div className="detail-valeur">{formaterMontant(donnees.prixParNuit)}</div>
                </div>
                <div>
                  <div className="detail-libelle">Capacite</div>
                  <div className="detail-valeur">{donnees.capacite} personne(s)</div>
                </div>
                <div>
                  <div className="detail-libelle">Etage</div>
                  <div className="detail-valeur">{donnees.etage}</div>
                </div>
                <div>
                  <div className="detail-libelle">Identifiant</div>
                  <div className="detail-valeur">#{donnees.id}</div>
                </div>
              </div>

              {donnees.description ? (
                <p style={{ marginTop: 18, color: 'var(--encre-doux)' }}>
                  {donnees.description}
                </p>
              ) : null}
            </div>

            {photos.length > 1 ? (
              <div className="carte">
                <h2 className="carte-titre">La chambre en images</h2>
                <p className="carte-description">
                  Differents espaces de la chambre {donnees.numero}. Cliquez pour agrandir.
                </p>
                <div className="galerie">
                  <button
                    type="button"
                    className="galerie-principale"
                    onClick={() => setZoom(true)}
                    aria-label="Agrandir la photo"
                  >
                    <img
                      src={photos[photoActive]}
                      alt={`Vue ${photoActive + 1} de la chambre ${donnees.numero}`}
                    />
                  </button>
                  <div className="galerie-vignettes">
                    {photos.map((src, index) => (
                      <button
                        key={`${src}-${index}`}
                        type="button"
                        className={`galerie-vignette ${index === photoActive ? 'active' : ''}`}
                        onClick={() => setPhotoActive(index)}
                        aria-label={`Voir la photo ${index + 1}`}
                      >
                        <img src={src} alt="" loading="lazy" />
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : null}

            {peutGerer ? (
            <div className="carte">
              <h2 className="carte-titre">Historique des reservations</h2>
              <p className="carte-description">
                Toutes les periodes reservees sur cette chambre.
              </p>

              {(donnees.reservations ?? []).length === 0 ? (
                <EtatVide
                  icone="🗓️"
                  titre="Aucune reservation"
                  texte="Cette chambre n'a encore jamais ete reservee."
                  action={
                    peutGerer ? (
                      <Link to="/reservations" className="bouton bouton-accent">
                        Creer une reservation
                      </Link>
                    ) : null
                  }
                />
              ) : (
                <div className="tableau-conteneur">
                  <table>
                    <thead>
                      <tr>
                        <th>Reference</th>
                        <th>Client</th>
                        <th>Arrivee</th>
                        <th>Depart</th>
                        <th className="alignement-droite">Montant</th>
                        <th>Statut</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(donnees.reservations ?? []).map((r) => (
                        <tr key={r.id}>
                          <td className="cellule-principale">{r.reference}</td>
                          <td>
                            {peutGerer ? (
                              <Link to={`/clients/${r.client.id}`} className="lien">
                                {r.client.prenom} {r.client.nom}
                              </Link>
                            ) : (
                              `${r.client.prenom} ${r.client.nom}`
                            )}
                          </td>
                          <td>{formaterDate(r.dateArrivee)}</td>
                          <td>{formaterDate(r.dateDepart)}</td>
                          <td className="alignement-droite">{formaterMontant(r.montantTotal)}</td>
                          <td>
                            <BadgeReservation statut={r.statut} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
            ) : null}
          </>
        ) : null}
      </div>

      {zoom && photos[photoActive] ? (
        <div className="voile" onClick={() => setZoom(false)}>
          <img
            src={photos[photoActive]}
            alt=""
            className="galerie-zoom"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      ) : null}
    </>
  );
}
