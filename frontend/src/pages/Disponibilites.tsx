import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { apiChambres } from '../api/client';
import { EntetePage } from '../components/Layout';
import {
  Alerte,
  BadgeChambre,
  BadgeType,
  Chargement,
  EtatVide,
} from '../components/ui';
import { useAuth } from '../context/AuthContext';
import { useFetch } from '../hooks/useFetch';
import {
  LIBELLES_TYPE_CHAMBRE,
  TYPES_CHAMBRE,
  ajouterJours,
  dateAujourdhui,
  formaterDate,
  formaterMontant,
} from '../utils/format';

/**
 * Recherche de disponibilites : la competence "gestion des disponibilites".
 * Le backend verifie le chevauchement des periodes et renvoie les chambres libres.
 */
export function Disponibilites() {
  const naviguer = useNavigate();
  const { aLeRole } = useAuth();
  const peutReserver = aLeRole('ADMIN', 'RECEPTIONNISTE');

  const aujourdHui = dateAujourdhui();
  const [criteres, setCriteres] = useState({
    arrivee: aujourdHui,
    depart: ajouterJours(aujourdHui, 2),
    personnes: '2',
    type: '',
  });
  const [rechercheActive, setRechercheActive] = useState({
    arrivee: aujourdHui,
    depart: ajouterJours(aujourdHui, 2),
    personnes: '2',
    type: '',
  });
  const [erreur, setErreur] = useState<string | null>(null);

  const resultat = useFetch(
    () =>
      apiChambres.disponibilites({
        arrivee: rechercheActive.arrivee,
        depart: rechercheActive.depart,
        personnes: rechercheActive.personnes || undefined,
        type: rechercheActive.type || undefined,
      }),
    [
      rechercheActive.arrivee,
      rechercheActive.depart,
      rechercheActive.personnes,
      rechercheActive.type,
    ],
  );

  const lancer = (e: FormEvent) => {
    e.preventDefault();
    setErreur(null);
    if (criteres.depart <= criteres.arrivee) {
      setErreur('La date de depart doit etre posterieure a la date d arrivee.');
      return;
    }
    setRechercheActive({ ...criteres });
  };

  const reserver = (chambreId: number) => {
    const params = new URLSearchParams({
      chambreId: String(chambreId),
      arrivee: rechercheActive.arrivee,
      depart: rechercheActive.depart,
      personnes: rechercheActive.personnes,
    });
    naviguer(`/reservations?${params.toString()}`);
  };

  const meta = resultat.meta as { nuits?: number; disponibles?: number; total?: number } | undefined;
  const chambres = resultat.donnees ?? [];

  return (
    <>
      <EntetePage
        titre="Disponibilites"
        sousTitre="Verifiez en temps reel les chambres libres sur une periode donnee."
      />

      <div className="page">
        <Alerte type="erreur">{erreur ?? resultat.erreur}</Alerte>

        <form className="barre-filtres carte" onSubmit={lancer}>
          <div className="champ">
            <label className="champ-label" htmlFor="arrivee">
              Arrivee <span className="champ-obligatoire">*</span>
            </label>
            <input
              id="arrivee"
              type="date"
              value={criteres.arrivee}
              min={aujourdHui}
              onChange={(e) => setCriteres({ ...criteres, arrivee: e.target.value })}
              required
            />
          </div>
          <div className="champ">
            <label className="champ-label" htmlFor="depart">
              Depart <span className="champ-obligatoire">*</span>
            </label>
            <input
              id="depart"
              type="date"
              value={criteres.depart}
              min={criteres.arrivee}
              onChange={(e) => setCriteres({ ...criteres, depart: e.target.value })}
              required
            />
          </div>
          <div className="champ">
            <label className="champ-label" htmlFor="personnes">
              Voyageurs
            </label>
            <input
              id="personnes"
              type="number"
              min={1}
              max={12}
              value={criteres.personnes}
              onChange={(e) => setCriteres({ ...criteres, personnes: e.target.value })}
            />
          </div>
          <div className="champ">
            <label className="champ-label" htmlFor="type-chambre">
              Type de chambre
            </label>
            <select
              id="type-chambre"
              value={criteres.type}
              onChange={(e) => setCriteres({ ...criteres, type: e.target.value })}
            >
              <option value="">Tous les types</option>
              {TYPES_CHAMBRE.map((t) => (
                <option key={t} value={t}>
                  {LIBELLES_TYPE_CHAMBRE[t]}
                </option>
              ))}
            </select>
          </div>
          <button type="submit" className="bouton bouton-accent">
            Rechercher
          </button>
        </form>

        {resultat.chargement ? <Chargement texte="Verification des disponibilites..." /> : null}

        {!resultat.chargement ? (
          <div className="carte">
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: 10,
                marginBottom: 14,
              }}
            >
              <div>
                <h2 className="carte-titre">
                  Sejour du {formaterDate(rechercheActive.arrivee)} au{' '}
                  {formaterDate(rechercheActive.depart)}
                </h2>
                <p className="carte-description" style={{ margin: 0 }}>
                  {meta?.nuits ?? 0} nuit(s) • {meta?.disponibles ?? 0} chambre(s) disponible(s) sur{' '}
                  {meta?.total ?? 0}
                </p>
              </div>
            </div>

            {chambres.length === 0 ? (
              <EtatVide icone="🔎" titre="Aucune chambre ne correspond a ces criteres" />
            ) : (
              <div className="tableau-conteneur">
                <table>
                  <thead>
                    <tr>
                      <th>Chambre</th>
                      <th>Type</th>
                      <th>Capacite</th>
                      <th className="alignement-droite">Prix / nuit</th>
                      <th className="alignement-droite">Total du sejour</th>
                      <th>Etat</th>
                      <th className="alignement-droite">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {chambres.map((chambre) => (
                      <tr key={chambre.id}>
                        <td className="cellule-principale">
                          <Link to={`/chambres/${chambre.id}`} className="lien">
                            {chambre.numero}
                          </Link>
                          <div className="cellule-secondaire">Etage {chambre.etage}</div>
                        </td>
                        <td>
                          <BadgeType type={chambre.type} />
                        </td>
                        <td>{chambre.capacite} pers.</td>
                        <td className="alignement-droite">{formaterMontant(chambre.prixParNuit)}</td>
                        <td className="alignement-droite cellule-principale">
                          {formaterMontant(chambre.prixSejour)}
                        </td>
                        <td>
                          {chambre.disponible ? (
                            <span className="badge badge-libre">Disponible</span>
                          ) : (
                            <>
                              <BadgeChambre statut={chambre.statut} />
                              <div className="cellule-secondaire">{chambre.motif}</div>
                            </>
                          )}
                        </td>
                        <td className="alignement-droite">
                          {chambre.disponible && peutReserver ? (
                            <button
                              type="button"
                              className="bouton bouton-mini bouton-accent"
                              onClick={() => reserver(chambre.id)}
                            >
                              Reserver
                            </button>
                          ) : null}
                          {chambre.disponible && !peutReserver ? (
                            <span className="cellule-secondaire">
                              Reservation par la reception
                            </span>
                          ) : null}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ) : null}
      </div>
    </>
  );
}
