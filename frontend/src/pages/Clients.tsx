import { useState, type FormEvent } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { apiClients } from '../api/client';
import { EntetePage } from '../components/Layout';
import {
  Alerte,
  Chargement,
  EtatVide,
  Modale,
  Pagination,
} from '../components/ui';
import { useAuth } from '../context/AuthContext';
import { useFetch } from '../hooks/useFetch';
import type { Client } from '../types';

const FORMULAIRE_VIDE = {
  nom: '',
  prenom: '',
  email: '',
  telephone: '',
  ville: '',
  pays: 'Benin',
  adresse: '',
  notes: '',
};

/** Gestion des fiches clients */
export function Clients() {
  const { aLeRole } = useAuth();
  const estAdmin = aLeRole('ADMIN');
  const [params, setParams] = useSearchParams();
  const page = Number(params.get('page') ?? 1);
  const recherche = params.get('recherche') ?? '';

  const [rechercheLocale, setRechercheLocale] = useState(recherche);
  const [modaleOuverte, setModaleOuverte] = useState(false);
  const [enEdition, setEnEdition] = useState<Client | null>(null);
  const [formulaire, setFormulaire] = useState(FORMULAIRE_VIDE);
  const [erreur, setErreur] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [envoiEnCours, setEnvoiEnCours] = useState(false);
  const [suppression, setSuppression] = useState<Client | null>(null);

  const liste = useFetch(
    () => apiClients.lister({ page, limit: 10, recherche: recherche || undefined }),
    [page, recherche],
  );

  const ouvrirCreation = () => {
    setEnEdition(null);
    setFormulaire(FORMULAIRE_VIDE);
    setErreur(null);
    setModaleOuverte(true);
  };

  const ouvrirEdition = (client: Client) => {
    setEnEdition(client);
    setFormulaire({
      nom: client.nom,
      prenom: client.prenom,
      email: client.email,
      telephone: client.telephone ?? '',
      ville: client.ville ?? '',
      pays: client.pays ?? '',
      adresse: client.adresse ?? '',
      notes: client.notes ?? '',
    });
    setErreur(null);
    setModaleOuverte(true);
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) => setFormulaire({ ...formulaire, [e.target.name]: e.target.value });

  const enregistrer = async (e: FormEvent) => {
    e.preventDefault();
    setEnvoiEnCours(true);
    setErreur(null);
    const corps = Object.fromEntries(
      Object.entries(formulaire).filter(([, valeur]) => valeur !== ''),
    );
    try {
      if (enEdition) {
        await apiClients.modifier(enEdition.id, corps);
        setMessage('Fiche client mise a jour.');
      } else {
        await apiClients.creer(corps);
        setMessage('Nouveau client enregistre.');
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
      await apiClients.supprimer(suppression.id);
      setMessage('Client supprime.');
      setSuppression(null);
      liste.recharger();
    } catch (err) {
      setErreur(err instanceof Error ? err.message : 'Suppression impossible');
      setSuppression(null);
    } finally {
      setEnvoiEnCours(false);
    }
  };

  const meta = liste.meta as { total: number; page: number; pages: number } | undefined;

  return (
    <>
      <EntetePage
        titre="Clients"
        sousTitre="Fiches voyageurs et historique de leurs sejours."
        actions={
          <button type="button" className="bouton bouton-accent" onClick={ouvrirCreation}>
            + Nouveau client
          </button>
        }
      />

      <div className="page">
        <Alerte type="erreur">{erreur ?? liste.erreur}</Alerte>
        <Alerte type="succes">{message}</Alerte>

        <form
          className="barre-filtres"
          onSubmit={(e) => {
            e.preventDefault();
            setParams((precedents) => {
              const suivants = new URLSearchParams(precedents);
              suivants.set('page', '1');
              if (rechercheLocale) suivants.set('recherche', rechercheLocale);
              else suivants.delete('recherche');
              return suivants;
            });
          }}
        >
          <div className="champ">
            <label className="champ-label" htmlFor="recherche-client">
              Recherche
            </label>
            <input
              id="recherche-client"
              placeholder="Nom, prenom, email ou telephone"
              value={rechercheLocale}
              onChange={(e) => setRechercheLocale(e.target.value)}
            />
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button type="submit" className="bouton">
              Rechercher
            </button>
            <button
              type="button"
              className="bouton bouton-secondaire"
              onClick={() => {
                setRechercheLocale('');
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
              icone="🧳"
              titre="Aucun client trouve"
              texte="Ajoutez une fiche client pour enregistrer une premiere reservation."
            />
          ) : null}

          {!liste.chargement && (liste.donnees ?? []).length > 0 ? (
            <div className="tableau-conteneur">
              <table>
                <thead>
                  <tr>
                    <th>Client</th>
                    <th>Email</th>
                    <th>Telephone</th>
                    <th>Ville / Pays</th>
                    <th className="alignement-droite">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {(liste.donnees ?? []).map((client) => (
                    <tr key={client.id}>
                      <td className="cellule-principale">
                        <Link to={`/clients/${client.id}`} className="lien">
                          {client.prenom} {client.nom}
                        </Link>
                      </td>
                      <td>{client.email}</td>
                      <td>{client.telephone || '—'}</td>
                      <td className="cellule-secondaire">
                        {[client.ville, client.pays].filter(Boolean).join(', ') || '—'}
                      </td>
                      <td>
                        <div className="actions-ligne">
                          <Link to={`/clients/${client.id}`} className="bouton-icone" title="Fiche">
                            👁
                          </Link>
                          <button
                            type="button"
                            className="bouton-icone"
                            title="Modifier"
                            onClick={() => ouvrirEdition(client)}
                          >
                            ✎
                          </button>
                          {estAdmin ? (
                            <button
                              type="button"
                              className="bouton-icone"
                              title="Supprimer"
                              onClick={() => {
                                setErreur(null);
                                setMessage(null);
                                setSuppression(client);
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
              onChanger={(nouvellePage) =>
                setParams((precedents) => {
                  const suivants = new URLSearchParams(precedents);
                  suivants.set('page', String(nouvellePage));
                  return suivants;
                })
              }
            />
          ) : null}
        </div>
      </div>

      <Modale
        ouvert={modaleOuverte}
        onFermer={() => setModaleOuverte(false)}
        titre={enEdition ? 'Modifier la fiche client' : 'Nouveau client'}
        pied={
          <>
            <button
              type="button"
              className="bouton bouton-secondaire"
              onClick={() => setModaleOuverte(false)}
            >
              Annuler
            </button>
            <button
              type="submit"
              form="formulaire-client"
              className="bouton"
              disabled={envoiEnCours}
            >
              {envoiEnCours ? 'Enregistrement...' : 'Enregistrer'}
            </button>
          </>
        }
      >
        <Alerte type="erreur">{erreur}</Alerte>
        <form id="formulaire-client" className="formulaire" onSubmit={enregistrer}>
          <div className="grille-champs">
            <div className="champ">
              <label className="champ-label" htmlFor="prenom">
                Prenom <span className="champ-obligatoire">*</span>
              </label>
              <input
                id="prenom"
                name="prenom"
                value={formulaire.prenom}
                onChange={handleChange}
                required
              />
            </div>
            <div className="champ">
              <label className="champ-label" htmlFor="nom">
                Nom <span className="champ-obligatoire">*</span>
              </label>
              <input id="nom" name="nom" value={formulaire.nom} onChange={handleChange} required />
            </div>
          </div>

          <div className="grille-champs">
            <div className="champ">
              <label className="champ-label" htmlFor="email-client">
                Email <span className="champ-obligatoire">*</span>
              </label>
              <input
                id="email-client"
                name="email"
                type="email"
                value={formulaire.email}
                onChange={handleChange}
                required
              />
            </div>
            <div className="champ">
              <label className="champ-label" htmlFor="telephone-client">
                Telephone
              </label>
              <input
                id="telephone-client"
                name="telephone"
                value={formulaire.telephone}
                onChange={handleChange}
                placeholder="+229 ..."
              />
            </div>
          </div>

          <div className="grille-champs">
            <div className="champ">
              <label className="champ-label" htmlFor="ville">
                Ville
              </label>
              <input id="ville" name="ville" value={formulaire.ville} onChange={handleChange} />
            </div>
            <div className="champ">
              <label className="champ-label" htmlFor="pays">
                Pays
              </label>
              <input id="pays" name="pays" value={formulaire.pays} onChange={handleChange} />
            </div>
          </div>

          <div className="champ">
            <label className="champ-label" htmlFor="adresse">
              Adresse
            </label>
            <input
              id="adresse"
              name="adresse"
              value={formulaire.adresse}
              onChange={handleChange}
            />
          </div>

          <div className="champ">
            <label className="champ-label" htmlFor="notes-client">
              Notes
            </label>
            <textarea
              id="notes-client"
              name="notes"
              value={formulaire.notes}
              onChange={handleChange}
              placeholder="Preferences, fidelite, remarques..."
            />
          </div>
        </form>
      </Modale>

      <Modale
        ouvert={Boolean(suppression)}
        onFermer={() => setSuppression(null)}
        titre="Supprimer le client"
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
              {envoiEnCours ? 'Suppression...' : 'Supprimer'}
            </button>
          </>
        }
      >
        <p style={{ margin: 0 }}>
          Supprimer la fiche de <strong>{suppression?.prenom} {suppression?.nom}</strong> ?
          L'operation est refusee si des reservations confirmees sont encore a venir.
        </p>
        <Alerte type="erreur">{erreur}</Alerte>
      </Modale>
    </>
  );
}
