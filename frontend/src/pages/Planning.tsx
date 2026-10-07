import { useState } from 'react';
import { apiReservations } from '../api/client';
import { EntetePage } from '../components/Layout';
import { Alerte, CarteStat, Chargement, EtatVide } from '../components/ui';
import { useFetch } from '../hooks/useFetch';
import { dateAujourdhui, formaterDateCourte, moisCourant } from '../utils/format';

const STYLE_CELLULE = (occupe: boolean, enAttente: boolean, aujourdhui: boolean) =>
  ({
    height: 30,
    minWidth: 30,
    padding: 0,
    borderRadius: 5,
    background: occupe
      ? enAttente
        ? 'repeating-linear-gradient(45deg,#fcd34d,#fcd34d 5px,#fde68a 5px,#fde68a 10px)'
        : 'var(--primaire-clair)'
      : '#f1f4f9',
    outline: aujourdhui ? '2px solid var(--accent)' : 'none',
  }) as React.CSSProperties;

/** Planning mensuel : occupation jour par jour de chaque chambre */
export function Planning() {
  const [mois, setMois] = useState(moisCourant());
  const planning = useFetch(() => apiReservations.planning(mois), [mois]);
  const lignes = planning.donnees ?? [];
  const meta = planning.meta as
    | { jours?: string[]; tauxOccupation?: number; reservationsDuMois?: number; nombreChambres?: number }
    | undefined;
  const jours = meta?.jours ?? [];
  const aujourdHui = dateAujourdhui();

  const decalerMois = (delta: number) => {
    const [annee, m] = mois.split('-').map(Number);
    const date = new Date(Date.UTC(annee, m - 1 + delta, 1));
    setMois(
      `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`,
    );
  };

  return (
    <>
      <EntetePage
        titre="Planning des reservations"
        sousTitre="Occupation de chaque chambre, jour par jour."
        actions={
          <>
            <button type="button" className="bouton bouton-secondaire" onClick={() => decalerMois(-1)}>
              ← Mois precedent
            </button>
            <input
              type="month"
              value={mois}
              onChange={(e) => setMois(e.target.value || moisCourant())}
              style={{ width: 'auto' }}
            />
            <button type="button" className="bouton bouton-secondaire" onClick={() => decalerMois(1)}>
              Mois suivant →
            </button>
          </>
        }
      />

      <div className="page">
        <Alerte type="erreur">{planning.erreur}</Alerte>

        {meta ? (
          <div className="grille grille-stats" style={{ marginBottom: 20 }}>
            <CarteStat
              libelle="Taux d'occupation"
              valeur={`${meta.tauxOccupation ?? 0}%`}
              detail={`Mois ${mois}`}
              variante="accent"
            />
            <CarteStat
              libelle="Reservations du mois"
              valeur={meta.reservationsDuMois ?? 0}
              variante="info"
            />
            <CarteStat
              libelle="Chambres suivies"
              valeur={meta.nombreChambres ?? 0}
              variante="succes"
            />
          </div>
        ) : null}

        <div className="carte">
          <h2 className="carte-titre">Occupation {mois}</h2>
          <p className="carte-description">
            Survolez une case pour voir la reservation et le client concerne.
          </p>

          {planning.chargement ? <Chargement texte="Construction du planning..." /> : null}

          {!planning.chargement && lignes.length === 0 ? (
            <EtatVide icone="🗓️" titre="Aucune chambre a afficher" />
          ) : null}

          {!planning.chargement && lignes.length > 0 ? (
            <div className="tableau-conteneur">
              <table style={{ minWidth: 'max-content' }}>
                <thead>
                  <tr>
                    <th
                      style={{
                        position: 'sticky',
                        left: 0,
                        background: '#fafbfe',
                        zIndex: 2,
                        minWidth: 110,
                      }}
                    >
                      Chambre
                    </th>
                    {jours.map((jour) => (
                      <th
                        key={jour}
                        style={{
                          padding: '8px 2px',
                          textAlign: 'center',
                          minWidth: 30,
                          color: jour === aujourdHui ? 'var(--accent-fonce)' : undefined,
                        }}
                        title={jour}
                      >
                        {formaterDateCourte(jour)}
                      </th>
                    ))}
                    <th style={{ minWidth: 90 }}>Occupation</th>
                  </tr>
                </thead>
                <tbody>
                  {lignes.map((ligne) => (
                    <tr key={ligne.chambreId}>
                      <td
                        className="cellule-principale"
                        style={{
                          position: 'sticky',
                          left: 0,
                          background: 'var(--surface)',
                          zIndex: 1,
                        }}
                      >
                        {ligne.numero}
                        <div className="cellule-secondaire">{ligne.type}</div>
                      </td>
                      {jours.map((jour) => {
                        const caseJour = ligne.occupation[jour];
                        const aujourdhui = jour === aujourdHui;
                        return (
                          <td
                            key={jour}
                            style={STYLE_CELLULE(
                              Boolean(caseJour),
                              caseJour?.statut === 'EN_ATTENTE',
                              aujourdhui,
                            )}
                            title={
                              caseJour
                                ? `${caseJour.reference} — ${caseJour.client} (${caseJour.statut})`
                                : aujourdhui
                                  ? 'Libre aujourd\'hui'
                                  : 'Libre'
                            }
                          />
                        );
                      })}
                      <td className="cellule-secondaire">{ligne.tauxOccupation}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}

          <div className="legende">
            <span>
              <span
                className="legende-pastille"
                style={{ background: 'var(--primaire-clair)' }}
              />
              Reservation confirmee
            </span>
            <span>
              <span
                className="legende-pastille"
                style={{
                  background: 'repeating-linear-gradient(45deg,#fcd34d,#fcd34d 5px,#fde68a 5px,#fde68a 10px)',
                }}
              />
              En attente de confirmation
            </span>
            <span>
              <span className="legende-pastille" style={{ background: '#f1f4f9' }} />
              Chambre libre
            </span>
            <span>
              <span
                className="legende-pastille"
                style={{ background: '#fff', outline: '2px solid var(--accent)' }}
              />
              Jour actuel
            </span>
          </div>
        </div>
      </div>
    </>
  );
}
