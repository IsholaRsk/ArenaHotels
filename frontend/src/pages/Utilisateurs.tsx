import { useState, type FormEvent } from 'react';
import { apiUtilisateurs } from '../api/client';
import { EntetePage } from '../components/Layout';
import {
  Alerte,
  Chargement,
  EtatVide,
  Modale,
  Pagination,
} from '../components/ui';
import { useFetch } from '../hooks/useFetch';
import type { Role, Utilisateur } from '../types';

const LIBELLES_ROLE: Record<Role, string> = {
  ADMIN: 'Administrateur',
  RECEPTIONNISTE: 'Réceptionniste',
  CLIENT: 'Client',
};

interface FormulaireUtilisateur {
  nom: string;
  email: string;
  motDePasse: string;
  role: Role;
  actif: boolean;
}

const FORMULAIRE_VIDE: FormulaireUtilisateur = {
  nom: '',
  email: '',
  motDePasse: '',
  role: 'CLIENT',
  actif: true,
};

export function Utilisateurs() {
  const [page, setPage] = useState(1);
  const [modaleOuverte, setModaleOuverte] = useState(false);
  const [enEdition, setEnEdition] = useState<Utilisateur | null>(null);
  const [formulaire, setFormulaire] = useState<FormulaireUtilisateur>(FORMULAIRE_VIDE);
  const [suppression, setSuppression] = useState<Utilisateur | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [envoiEnCours, setEnvoiEnCours] = useState(false);

  const liste = useFetch(
    () => apiUtilisateurs.lister({ page, limit: 10 }),
    [page],
  );

  const meta = liste.meta as
    | { total: number; page: number; limit: number; pages: number }
    | undefined;

  const ouvrirCreation = () => {
    setErreur(null);
    setMessage(null);
    setEnEdition(null);
    setFormulaire(FORMULAIRE_VIDE);
    setModaleOuverte(true);
  };

  const ouvrirEdition = (utilisateur: Utilisateur) => {
    setErreur(null);
    setMessage(null);
    setEnEdition(utilisateur);
    setFormulaire({
      nom: utilisateur.nom,
      email: utilisateur.email,
      motDePasse: '',
      role: utilisateur.role,
      actif: utilisateur.actif !== false,
    });
    setModaleOuverte(true);
  };

  const enregistrer = async (e: FormEvent) => {
    e.preventDefault();
    setEnvoiEnCours(true);
    setErreur(null);
    setMessage(null);
    try {
      if (enEdition) {
        const corps: Record<string, unknown> = {
          nom: formulaire.nom,
          email: formulaire.email,
          role: formulaire.role,
          actif: formulaire.actif,
        };
        if (formulaire.motDePasse) corps.motDePasse = formulaire.motDePasse;
        await apiUtilisateurs.modifier(enEdition.id, corps as never);
        setMessage('Compte mis à jour.');
      } else {
        await apiUtilisateurs.creer({
          nom: formulaire.nom,
          email: formulaire.email,
          motDePasse: formulaire.motDePasse,
          role: formulaire.role,
          actif: formulaire.actif,
        });
        setMessage('Compte créé.');
      }
      setModaleOuverte(false);
      liste.recharger();
    } catch (err) {
      setErreur(err instanceof Error ? err.message : 'Erreur inattendue');
    } finally {
      setEnvoiEnCours(false);
    }
  };

  const confirmerSuppression = async () => {
    if (!suppression) return;
    setEnvoiEnCours(true);
    setErreur(null);
    setMessage(null);
    try {
      await apiUtilisateurs.supprimer(suppression.id);
      setMessage('Compte supprimé.');
      setSuppression(null);
      liste.recharger();
    } catch (err) {
      setErreur(err instanceof Error ? err.message : 'Erreur inattendue');
    } finally {
      setEnvoiEnCours(false);
    }
  };

  return (
    <>
      <EntetePage
        titre="Utilisateurs"
        sousTitre="Gestion des comptes et des rôles (administrateur)."
        actions={
          <button type="button" className="bouton" onClick={ouvrirCreation}>
            + Nouveau compte
          </button>
        }
      />

      <div className="page">
        <Alerte type="erreur">{erreur}</Alerte>
        <Alerte type="succes">{message}</Alerte>

        {liste.chargement ? <Chargement /> : null}

        {!liste.chargement && (liste.donnees ?? []).length === 0 ? (
          <EtatVide
            icone="👤"
            titre="Aucun utilisateur"
            texte="Créez un premier compte pour démarrer."
          />
        ) : null}

        {!liste.chargement && (liste.donnees ?? []).length > 0 ? (
          <div className="carte">
            <div className="tableau-conteneur">
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Nom</th>
                  <th>Email</th>
                  <th>Rôle</th>
                  <th>Statut</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {(liste.donnees ?? []).map((utilisateur) => (
                  <tr key={utilisateur.id}>
                    <td>{utilisateur.id}</td>
                    <td>{utilisateur.nom}</td>
                    <td>{utilisateur.email}</td>
                    <td>{LIBELLES_ROLE[utilisateur.role]}</td>
                    <td>
                      {utilisateur.actif !== false ? (
                        <span className="badge badge-libre">Actif</span>
                      ) : (
                        <span className="badge badge-occupee">Désactivé</span>
                      )}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                        <button
                          type="button"
                          className="bouton-icone"
                          title="Modifier"
                          onClick={() => ouvrirEdition(utilisateur)}
                        >
                          ✎
                        </button>
                        <button
                          type="button"
                          className="bouton-icone"
                          title="Supprimer"
                          onClick={() => {
                            setErreur(null);
                            setMessage(null);
                            setSuppression(utilisateur);
                          }}
                        >
                          🗑
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          </div>
        ) : null}

        {meta ? (
          <Pagination page={meta.page} pages={meta.pages} total={meta.total} onChanger={setPage} />
        ) : null}
      </div>

      <Modale
        ouvert={modaleOuverte}
        onFermer={() => setModaleOuverte(false)}
        titre={enEdition ? `Modifier ${enEdition.nom}` : 'Nouveau compte'}
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
              form="formulaire-utilisateur"
              className="bouton"
              disabled={envoiEnCours}
            >
              Enregistrer
            </button>
          </>
        }
      >
        <Alerte type="erreur">{erreur}</Alerte>
        <form id="formulaire-utilisateur" className="formulaire" onSubmit={enregistrer}>
          <div className="grille-champs">
            <div className="champ">
              <label className="champ-label" htmlFor="u-nom">Nom</label>
              <input
                id="u-nom"
               
                value={formulaire.nom}
                onChange={(e) => setFormulaire({ ...formulaire, nom: e.target.value })}
                required
              />
            </div>
            <div className="champ">
              <label className="champ-label" htmlFor="u-email">Email</label>
              <input
                id="u-email"
               
                type="email"
                value={formulaire.email}
                onChange={(e) => setFormulaire({ ...formulaire, email: e.target.value })}
                required
              />
            </div>
          </div>
          <div className="grille-champs">
            <div className="champ">
              <label className="champ-label" htmlFor="u-motdepasse">
                Mot de passe{enEdition ? ' (laisser vide pour conserver)' : ''}
              </label>
              <input
                id="u-motdepasse"
               
                type="password"
                value={formulaire.motDePasse}
                onChange={(e) => setFormulaire({ ...formulaire, motDePasse: e.target.value })}
                required={!enEdition}
                minLength={6}
              />
            </div>
            <div className="champ">
              <label className="champ-label" htmlFor="u-role">Rôle</label>
              <select
                id="u-role"
               
                value={formulaire.role}
                onChange={(e) => setFormulaire({ ...formulaire, role: e.target.value as Role })}
              >
                <option value="CLIENT">Client</option>
                <option value="RECEPTIONNISTE">Réceptionniste</option>
                <option value="ADMIN">Administrateur</option>
              </select>
            </div>
          </div>
          <label className="case-a-cocher">
            <input
              type="checkbox"
              checked={formulaire.actif}
              onChange={(e) => setFormulaire({ ...formulaire, actif: e.target.checked })}
            />
            Compte actif
          </label>
        </form>
      </Modale>

      <Modale
        ouvert={suppression !== null}
        onFermer={() => setSuppression(null)}
        titre="Supprimer le compte"
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
              Supprimer
            </button>
          </>
        }
      >
        <p>
          Confirmer la suppression du compte <strong>{suppression?.nom}</strong> (
          {suppression?.email}) ? Cette action est irréversible.
        </p>
      </Modale>
    </>
  );
}
