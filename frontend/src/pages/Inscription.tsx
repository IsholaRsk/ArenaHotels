import { useState, type ChangeEvent, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Alerte } from '../components/ui';
import { useAuth } from '../context/AuthContext';

const PAYS = ['Benin', 'Togo', 'Nigeria', 'Cote d\'Ivoire', 'Senegal', 'France', 'Autre'];

/** Page d'inscription publique (le compte cree a le role CLIENT) */
export function Inscription() {
  const { inscription, chargement, erreur } = useAuth();
  const naviguer = useNavigate();

  const [formulaire, setFormulaire] = useState({
    nom: '',
    email: '',
    telephone: '',
    pays: '',
    motDePasse: '',
    confirmation: '',
    accepte: false,
  });
  const [erreurLocale, setErreurLocale] = useState<string | null>(null);

  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value, type } = e.target;
    const cible = e.target as HTMLInputElement;
    setFormulaire({
      ...formulaire,
      [name]: type === 'checkbox' ? cible.checked : value,
    });
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErreurLocale(null);

    if (formulaire.motDePasse !== formulaire.confirmation) {
      setErreurLocale('Les deux mots de passe ne correspondent pas.');
      return;
    }
    if (!formulaire.accepte) {
      setErreurLocale('Vous devez accepter les conditions de reservation.');
      return;
    }

    try {
      await inscription({
        nom: formulaire.nom,
        email: formulaire.email,
        motDePasse: formulaire.motDePasse,
        telephone: formulaire.telephone || undefined,
      });
      naviguer('/', { replace: true });
    } catch {
      setErreurLocale("L'inscription a echoue. Verifiez les informations saisies.");
    }
  };

  return (
    <div className="ecran-connexion">
      <section className="ecran-connexion-panneau">
        <div className="marque" style={{ border: 'none', padding: 0, margin: 0 }}>
          <div className="marque-logo">A</div>
          <div>
            <div className="marque-titre">ArenaHotels</div>
            <div className="marque-sous-titre">Espace client</div>
          </div>
        </div>
        <h1 className="ecran-connexion-titre">Reservez votre sejour en quelques clics.</h1>
        <p className="ecran-connexion-texte">
          Un compte client vous permet de consulter les chambres disponibles, de suivre
          vos reservations et de retrouver l'historique de vos sejours.
        </p>
      </section>

      <section className="ecran-connexion-formulaire">
        <div className="boite-connexion">
          <h1>Creer un compte</h1>
          <p className="boite-connexion-sous-titre">
            Inscription gratuite, sans engagement.
          </p>

          <Alerte type="erreur">{erreurLocale ?? erreur}</Alerte>

          <form className="formulaire" onSubmit={handleSubmit}>
            <div className="champ">
              <label className="champ-label" htmlFor="nom">
                Nom complet <span className="champ-obligatoire">*</span>
              </label>
              <input
                id="nom"
                name="nom"
                type="text"
                placeholder="Ex : Kossi Amegnon"
                value={formulaire.nom}
                onChange={handleChange}
                required
              />
            </div>

            <div className="champ">
              <label className="champ-label" htmlFor="email-inscription">
                Adresse email <span className="champ-obligatoire">*</span>
              </label>
              <input
                id="email-inscription"
                name="email"
                type="email"
                placeholder="vous@exemple.com"
                value={formulaire.email}
                onChange={handleChange}
                required
              />
            </div>

            <div className="grille-champs">
              <div className="champ">
                <label className="champ-label" htmlFor="telephone">
                  Telephone
                </label>
                <input
                  id="telephone"
                  name="telephone"
                  type="tel"
                  placeholder="+229 ..."
                  value={formulaire.telephone}
                  onChange={handleChange}
                />
              </div>
              <div className="champ">
                <label className="champ-label" htmlFor="pays">
                  Pays
                </label>
                <select id="pays" name="pays" value={formulaire.pays} onChange={handleChange}>
                  <option value="">— Choisir —</option>
                  {PAYS.map((pays) => (
                    <option key={pays} value={pays}>
                      {pays}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grille-champs">
              <div className="champ">
                <label className="champ-label" htmlFor="motDePasse-inscription">
                  Mot de passe <span className="champ-obligatoire">*</span>
                </label>
                <input
                  id="motDePasse-inscription"
                  name="motDePasse"
                  type="password"
                  placeholder="6 caracteres minimum"
                  value={formulaire.motDePasse}
                  onChange={handleChange}
                  required
                  minLength={6}
                />
              </div>
              <div className="champ">
                <label className="champ-label" htmlFor="confirmation">
                  Confirmation <span className="champ-obligatoire">*</span>
                </label>
                <input
                  id="confirmation"
                  name="confirmation"
                  type="password"
                  value={formulaire.confirmation}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <label className="case-a-cocher">
              <input
                type="checkbox"
                name="accepte"
                checked={formulaire.accepte}
                onChange={handleChange}
              />
              J'accepte les conditions generales de reservation
            </label>

            <button type="submit" className="bouton" disabled={chargement}>
              {chargement ? 'Creation du compte...' : 'Creer mon compte'}
            </button>
          </form>

          <div className="pied-page-connexion">
            Deja inscrit ?{' '}
            <Link to="/connexion" className="lien">
              Se connecter
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
