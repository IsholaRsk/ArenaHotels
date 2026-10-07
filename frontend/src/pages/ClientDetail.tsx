import { Link, useParams } from 'react-router-dom';
import { apiClients } from '../api/client';
import { EntetePage } from '../components/Layout';
import {
  Alerte,
  BadgeReservation,
  CarteStat,
  Chargement,
  EtatVide,
} from '../components/ui';
import { useFetch } from '../hooks/useFetch';
import { formaterDate, formaterMontant } from '../utils/format';

/** Fiche client (route dynamique /clients/:id) avec historique des sejours */
export function ClientDetail() {
  const { id } = useParams<{ id: string }>();
  const identifiant = Number(id);
  const client = useFetch(() => apiClients.detail(identifiant), [identifiant]);
  const d = client.donnees;

  return (
    <>
      <EntetePage
        titre={d ? `${d.prenom} ${d.nom}` : 'Client'}
        sousTitre={d?.email}
        actions={<Link to="/clients" className="bouton bouton-secondaire">← Retour aux clients</Link>}
      />

      <div className="page">
        <Alerte type="erreur">{client.erreur}</Alerte>
        {client.chargement ? <Chargement /> : null}

        {d ? (
          <>
            <div className="grille grille-stats">
              <CarteStat
                libelle="Sejours effectues"
                valeur={d.statistiques?.nombreSejours ?? 0}
                detail="Toutes reservations confondues"
                variante="info"
              />
              <CarteStat
                libelle="Total depense"
                valeur={formaterMontant(d.statistiques?.montantTotal ?? 0)}
                variante="accent"
              />
              <CarteStat
                libelle="Dernier sejour"
                valeur={d.statistiques?.dernierSejour ? formaterDate(d.statistiques.dernierSejour) : '—'}
                variante="succes"
              />
            </div>

            <div className="carte">
              <h2 className="carte-titre">Coordonnees</h2>
              <div className="liste-details" style={{ marginTop: 14 }}>
                <div>
                  <div className="detail-libelle">Telephone</div>
                  <div className="detail-valeur">{d.telephone || '—'}</div>
                </div>
                <div>
                  <div className="detail-libelle">Ville</div>
                  <div className="detail-valeur">{d.ville || '—'}</div>
                </div>
                <div>
                  <div className="detail-libelle">Pays</div>
                  <div className="detail-valeur">{d.pays || '—'}</div>
                </div>
                <div>
                  <div className="detail-libelle">Adresse</div>
                  <div className="detail-valeur">{d.adresse || '—'}</div>
                </div>
              </div>
              {d.notes ? (
                <p style={{ marginTop: 16, color: 'var(--encre-doux)' }}>
                  <strong>Notes :</strong> {d.notes}
                </p>
              ) : null}
            </div>

            <div className="carte">
              <h2 className="carte-titre">Historique des reservations</h2>
              <p className="carte-description">Chronologie des sejours de ce client.</p>

              {(d.reservations ?? []).length === 0 ? (
                <EtatVide icone="🧳" titre="Aucun sejour enregistre" />
              ) : (
                <div className="tableau-conteneur">
                  <table>
                    <thead>
                      <tr>
                        <th>Reference</th>
                        <th>Chambre</th>
                        <th>Arrivee</th>
                        <th>Depart</th>
                        <th>Personnes</th>
                        <th className="alignement-droite">Montant</th>
                        <th>Statut</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(d.reservations ?? []).map((r) => (
                        <tr key={r.id}>
                          <td className="cellule-principale">{r.reference}</td>
                          <td>
                            <Link to={`/chambres/${r.chambre.id}`} className="lien">
                              {r.chambre.numero}
                            </Link>
                          </td>
                          <td>{formaterDate(r.dateArrivee)}</td>
                          <td>{formaterDate(r.dateDepart)}</td>
                          <td>{r.nombrePersonnes}</td>
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
          </>
        ) : null}
      </div>
    </>
  );
}
