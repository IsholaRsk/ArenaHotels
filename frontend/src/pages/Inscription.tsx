import { useState, type ChangeEvent, type FormEvent } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { Alerte } from '../components/ui';
import { useAuth } from '../context/AuthContext';
import { IMAGE_LOBBY } from '../utils/images';

/** Inscription publique : on ne demande que le strict necessaire */
export function Inscription() {
  const { inscription, chargement, erreur, connecte } = useAuth();
  const naviguer = useNavigate();

  if (connecte) return <Navigate to="/" replace />;

  const [formulaire, setFormulaire] = useState({
    nom: '',
    email: '',
    motDePasse: '',
    confirmation: '',
    accepte: false,
  });
  const [erreurLocale, setErreurLocale] = useState<string | null>(null);

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target;
    const cible = e.target as HTMLInputElement;
    setFormulaire({ ...formulaire, [name]: type === 'checkbox' ? cible.checked : value });
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
      });
      naviguer('/', { replace: true });
    } catch {
      setErreurLocale("L'inscription a echoue. Verifiez les informations saisies.");
    }
  };

  return (
    <div className="ecran-connexion">
      <section className="ecran-connexion-image">
        <img src={IMAGE_LOBBY} alt="Hall d'accueil de l'hotel" />
        <div className="ecran-connexion-image-legende">
          Un compte client pour suivre vos sejours et verifier les disponibilites.
        </div>
      </section>

      <section className="ecran-connexion-formulaire">
        <div className="boite-connexion">
          <div className="boite-connexion-marque">Arena Hotels</div>
          <h1>Creer un compte</h1>
          <p className="boite-connexion-sous-titre">Inscription gratuite, sans engagement.</p>

          <Alerte type="erreur">{erreurLocale ?? erreur}</Alerte>

          <form className="formulaire" onSubmit={handleSubmit}>
            <div className="champ">
              <label className="champ-label" htmlFor="nom">
                Nom complet
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
                Adresse email
              </label>
              <input
                id="email-inscription"
                name="email"
                type="email"
                value={formulaire.email}
                onChange={handleChange}
                required
              />
              <div className="champ-aide">
                Nom, email et mot de passe : c'est tout ce dont nous avons besoin.
              </div>
            </div>

            <div className="grille-champs">
              <div className="champ">
                <label className="champ-label" htmlFor="motDePasse-inscription">
                  Mot de passe
                </label>
                <input
                  id="motDePasse-inscription"
                  name="motDePasse"
                  type="password"
                  value={formulaire.motDePasse}
                  onChange={handleChange}
                  required
                  minLength={6}
                />
              </div>
              <div className="champ">
                <label className="champ-label" htmlFor="confirmation">
                  Confirmation
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
              {chargement ? 'Creation...' : 'Creer mon compte'}
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
