import { useState, type FormEvent } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { apiChambres } from '../api/client';
import { EntetePage } from '../components/Layout';
import {
  Alerte,
  BadgeChambre,
  BadgeType,
  Chargement,
  EtatVide,
  Modale,
  Pagination,
} from '../components/ui';
import { useAuth } from '../context/AuthContext';
import { useFetch } from '../hooks/useFetch';
import type { Chambre } from '../types';
import {
  LIBELLES_STATUT_CHAMBRE,
  LIBELLES_TYPE_CHAMBRE,
  STATUTS_CHAMBRE,
  TYPES_CHAMBRE,
  formaterMontant,
} from '../utils/format';

const FORMULAIRE_VIDE = {
  numero: '',
  type: 'DOUBLE',
  prixParNuit: '40000',
  capacite: '2',
  etage: '1',
  description: '',
  statut: 'LIBRE',
};

/** Gestion du catalogue des chambres (CRUD complet) */
export function Chambres() {
  const { aLeRole } = useAuth();
  const peutGerer = aLeRole('ADMIN', 'RECEPTIONNISTE');
  const estAdmin = aLeRole('ADMIN');

  const [params, setParams] = useSearchParams();
  const page = Number(params.get('page') ?? 1);
  const recherche = params.get('recherche') ?? '';
  const type = params.get('type') ?? '';
  const statut = params.get('statut') ?? '';

  const [filtres, setFiltres] = useState({ recherche, type, statut });
  const [modaleOuverte, setModaleOuverte] = useState(false);
  const [enEdition, setEnEdition] = useState<Chambre | null>(null);
  const [formulaire, setFormulaire] = useState(FORMULAIRE_VIDE);
  const [erreur, setErreur] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [envoiEnCours, setEnvoiEnCours] = useState(false);
  const [suppression, setSuppression] = useState<Chambre | null>(null);

  const liste = useFetch(
    () => apiChambres.lister({ page, limit: 10, recherche, type, statut }),
    [page, recherche, type, statut],
  );

  const appliquerFiltres = (e: FormEvent) => {
    e.preventDefault();
    setParams((precedents) => {
      const suivants = new URLSearchParams(precedents);
      suivants.set('page', '1');
      Object.entries(filtres).forEach(([cle, valeur]) => {
        if (valeur) suivants.set(cle, valeur);
        else suivants.delete(cle);
      });
      return suivants;
    });
  };

  const changerPage = (nouvellePage: number) => {
    setParams((precedents) => {
      const suivants = new URLSearchParams(precedents);
      suivants.set('page', String(nouvellePage));
      return suivants;
    });
  };

  const ouvrirCreation = () => {
    setEnEdition(null);
    setFormulaire(FORMULAIRE_VIDE);
    setErreur(null);
    setModaleOuverte(true);
  };

  const ouvrirEdition = (chambre: Chambre) => {
    setEnEdition(chambre);
    setFormulaire({
      numero: chambre.numero,
      type: chambre.type,
      prixParNuit: String(chambre.prixParNuit),
      capacite: String(chambre.capacite),
      etage: String(chambre.etage),
      description: chambre.description ?? '',
      statut: chambre.statut,
    });
    setErreur(null);
    setModaleOuverte(true);
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
  ) => setFormulaire({ ...formulaire, [e.target.name]: e.target.value });

  const enregistrer = async (e: FormEvent) => {
    e.preventDefault();
    setEnvoiEnCours(true);
    setErreur(null);
    const corps: Partial<Chambre> = {
      numero: formulaire.numero,
      type: formulaire.type as Chambre['type'],
      prixParNuit: Number(formulaire.prixParNuit),
      capacite: Number(formulaire.capacite),
      etage: Number(formulaire.etage),
      description: formulaire.description || undefined,
      statut: formulaire.statut as Chambre['statut'],
    };
    try {
      if (enEdition) {
        await apiChambres.modifier(enEdition.id, corps);
        setMessage(`Chambre ${corps.numero} mise a jour.`);
      } else {
        await apiChambres.creer(corps);
        setMessage(`Chambre ${corps.numero} ajoutee au catalogue.`);
      }
      setModaleOuverte(false);
      liste.recharger();
    } catch (err) {
      setErreur(err instanceof Error ? err.message : 'Enregistrement impossible');
    } finally {
      setEnvoiEnCours(false);
    }
  };

  const confirmerSuppression = async () => {
    if (!suppression) return;
    setEnvoiEnCours(true);
    setErreur(null);
    try {
      await apiChambres.supprimer(suppression.id);
      setMessage(`Chambre ${suppression.numero} supprimee.`);
      setSuppression(null);
      liste.recharger();
    } catch (err) {
      setErreur(err instanceof Error ? err.message : 'Suppression impossible');
      setSuppression(null);
    } finally {
      setEnvoiEnCours(false);
    }
  };

  const meta = liste.meta as
    | { total: number; page: number; limit: number; pages: number }
    | undefined;

  return (
    <>
      <EntetePage
        titre="Chambres"
        sousTitre="Catalogue de l'hotel : types, tarifs, capacites et etat."
        actions={
          peutGerer ? (
            <button type="button" className="bouton bouton-accent" onClick={ouvrirCreation}>
              + Nouvelle chambre
            </button>
          ) : null
        }
      />

      <div className="page">
        <Alerte type="erreur">{erreur ?? liste.erreur}</Alerte>
        <Alerte type="succes">{message}</Alerte>

        <form className="barre-filtres" onSubmit={appliquerFiltres}>
          <div className="champ">
            <label className="champ-label" htmlFor="recherche">
              Recherche
            </label>
            <input
              id="recherche"
              name="recherche"
              placeholder="Numero ou mot-cle"
              value={filtres.recherche}
              onChange={(e) => setFiltres({ ...filtres, recherche: e.target.value })}
            />
          </div>
          <div className="champ">
            <label className="champ-label" htmlFor="type">
              Type
            </label>
            <select
              id="type"
              value={filtres.type}
              onChange={(e) => setFiltres({ ...filtres, type: e.target.value })}
            >
              <option value="">Tous</option>
              {TYPES_CHAMBRE.map((t) => (
                <option key={t} value={t}>
                  {LIBELLES_TYPE_CHAMBRE[t]}
                </option>
              ))}
            </select>
          </div>
          <div className="champ">
            <label className="champ-label" htmlFor="statut">
              Statut
            </label>
            <select
              id="statut"
              value={filtres.statut}
              onChange={(e) => setFiltres({ ...filtres, statut: e.target.value })}
            >
              <option value="">Tous</option>
              {STATUTS_CHAMBRE.map((s) => (
                <option key={s} value={s}>
                  {LIBELLES_STATUT_CHAMBRE[s]}
                </option>
              ))}
            </select>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button type="submit" className="bouton">
              Filtrer
            </button>
            <button
              type="button"
              className="bouton bouton-secondaire"
              onClick={() => {
                setFiltres({ recherche: '', type: '', statut: '' });
                setParams(new URLSearchParams());
              }}
            >
              Reinitialiser
            </button>
          </div>
        </form>

        <div className="carte">
          {liste.chargement ? <Chargement /> : null}

          {!liste.chargement && (liste.donnees ?? []).length === 0 ? (
            <EtatVide
              icone="🛏️"
              titre="Aucune chambre ne correspond a ces criteres"
              texte="Modifiez les filtres ou ajoutez une nouvelle chambre au catalogue."
            />
          ) : null}

          {!liste.chargement && (liste.donnees ?? []).length > 0 ? (
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
                    <th className="alignement-droite">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {(liste.donnees ?? []).map((chambre) => (
                    <tr key={chambre.id}>
                      <td className="cellule-principale">
                        <Link to={`/chambres/${chambre.id}`} className="lien">
                          {chambre.numero}
                        </Link>
                      </td>
                      <td>
                        <BadgeType type={chambre.type} />
                      </td>
                      <td>{chambre.capacite} pers.</td>
                      <td>{chambre.etage}</td>
                      <td className="alignement-droite cellule-principale">
                        {formaterMontant(chambre.prixParNuit)}
                      </td>
                      <td>
                        <BadgeChambre statut={chambre.statut} />
                      </td>
                      <td>
                        <div className="actions-ligne">
                          <Link to={`/chambres/${chambre.id}`} className="bouton-icone" title="Detail">
                            👁
                          </Link>
                          {peutGerer ? (
                            <button
                              type="button"
                              className="bouton-icone"
                              title="Modifier"
                              onClick={() => ouvrirEdition(chambre)}
                            >
                              ✎
                            </button>
                          ) : null}
                          {estAdmin ? (
                            <button
                              type="button"
                              className="bouton-icone"
                              title="Supprimer"
                              onClick={() => {
                                setErreur(null);
                                setMessage(null);
                                setSuppression(chambre);
                              }}
                            >
                              🗑
                            </button>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}

          {meta ? (
            <Pagination
              page={meta.page}
              pages={meta.pages}
              total={meta.total}
              onChanger={changerPage}
            />
          ) : null}
        </div>
      </div>

      <Modale
        ouvert={modaleOuverte}
        onFermer={() => setModaleOuverte(false)}
        titre={enEdition ? `Modifier la chambre ${enEdition.numero}` : 'Nouvelle chambre'}
        pied={
          <>
            <button
              type="button"
              className="bouton bouton-secondaire"
              onClick={() => setModaleOuverte(false)}
            >
              Annuler
            </button>
            <button type="submit" form="formulaire-chambre" className="bouton" disabled={envoiEnCours}>
              {envoiEnCours ? 'Enregistrement...' : 'Enregistrer'}
            </button>
          </>
        }
      >
        <Alerte type="erreur">{erreur}</Alerte>
        <form id="formulaire-chambre" className="formulaire" onSubmit={enregistrer}>
          <div className="grille-champs">
            <div className="champ">
              <label className="champ-label" htmlFor="numero">
                Numero <span className="champ-obligatoire">*</span>
              </label>
              <input
                id="numero"
                name="numero"
                value={formulaire.numero}
                onChange={handleChange}
                placeholder="Ex : 205"
                required
              />
            </div>
            <div className="champ">
              <label className="champ-label" htmlFor="type-chambre">
                Type <span className="champ-obligatoire">*</span>
              </label>
              <select id="type-chambre" name="type" value={formulaire.type} onChange={handleChange}>
                {TYPES_CHAMBRE.map((t) => (
                  <option key={t} value={t}>
                    {LIBELLES_TYPE_CHAMBRE[t]}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grille-champs">
            <div className="champ">
              <label className="champ-label" htmlFor="prix">
                Prix par nuit (FCFA) <span className="champ-obligatoire">*</span>
              </label>
              <input
                id="prix"
                name="prixParNuit"
                type="number"
                min={1000}
                value={formulaire.prixParNuit}
                onChange={handleChange}
                required
              />
            </div>
            <div className="champ">
              <label className="champ-label" htmlFor="capacite">
                Capacite (personnes) <span className="champ-obligatoire">*</span>
              </label>
              <input
                id="capacite"
                name="capacite"
                type="number"
                min={1}
                max={12}
                value={formulaire.capacite}
                onChange={handleChange}
                required
              />
            </div>
            <div className="champ">
              <label className="champ-label" htmlFor="etage">
                Etage
              </label>
              <input
                id="etage"
                name="etage"
                type="number"
                min={0}
                max={50}
                value={formulaire.etage}
                onChange={handleChange}
              />
            </div>
            <div className="champ">
              <label className="champ-label" htmlFor="statut-chambre">
                Statut
              </label>
              <select
                id="statut-chambre"
                name="statut"
                value={formulaire.statut}
                onChange={handleChange}
              >
                {STATUTS_CHAMBRE.map((s) => (
                  <option key={s} value={s}>
                    {LIBELLES_STATUT_CHAMBRE[s]}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="champ">
            <label className="champ-label" htmlFor="description">
              Description
            </label>
            <textarea
              id="description"
              name="description"
              value={formulaire.description}
              onChange={handleChange}
              placeholder="Equipements, vue, services inclus..."
            />
            <span className="champ-aide">
              Le statut d'occupation est recalcule automatiquement selon les reservations.
            </span>
          </div>
        </form>
      </Modale>

      <Modale
        ouvert={Boolean(suppression)}
        onFermer={() => setSuppression(null)}
        titre="Confirmer la suppression"
        pied={
          <>
            <button
              type="button"
              className="bouton bouton-secondaire"
              onClick={() => setSuppression(null)}
            >
              Annuler
            </button>
            <button
              type="button"
              className="bouton bouton-danger"
              onClick={confirmerSuppression}
              disabled={envoiEnCours}
            >
              {envoiEnCours ? 'Suppression...' : 'Supprimer definitivement'}
            </button>
          </>
        }
      >
        <p style={{ margin: 0 }}>
          Vous allez supprimer la chambre{' '}
          <strong>{suppression?.numero}</strong> du catalogue. Les reservations passees
          associees seront egalement supprimees.
        </p>
        <Alerte type="erreur">{erreur}</Alerte>
      </Modale>
    </>
  );
}
