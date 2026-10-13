import { useState, type FormEvent } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { Alerte } from '../components/ui';
import { useAuth } from '../context/AuthContext';
import { IMAGE_HERO } from '../utils/images';

/** Page de connexion minimaliste : photographie pleine hauteur + formulaire epure */
export function Connexion() {
  const { connexion, chargement, erreur, connecte } = useAuth();
  const naviguer = useNavigate();
  const emplacement = useLocation() as { state?: { depuis?: string } };

  // Un visiteur deja connecte n'a pas besoin de se reconnecter.
  if (connecte) return <Navigate to={emplacement.state?.depuis ?? '/'} replace />;

  const [formulaire, setFormulaire] = useState({ email: '', motDePasse: '' });
  const [erreurLocale, setErreurLocale] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormulaire({ ...formulaire, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErreurLocale(null);
    try {
      await connexion(formulaire.email, formulaire.motDePasse);
      naviguer(emplacement.state?.depuis ?? '/', { replace: true });
    } catch {
      setErreurLocale('Connexion refusee. Verifiez votre email et votre mot de passe.');
    }
  };

  return (
    <div className="ecran-connexion">
      <section className="ecran-connexion-image">
        <img src={IMAGE_HERO} alt="Façade d'Arena Hotels" />
        <div className="ecran-connexion-image-legende">
          Arena Hotels — un lieu pensé pour le calme et le confort.
        </div>
      </section>

      <section className="ecran-connexion-formulaire">
        <div className="boite-connexion">
          <div className="boite-connexion-marque">Arena Hotels</div>
          <h1>Connexion</h1>
          <p className="boite-connexion-sous-titre">
            Accedez a votre espace pour gerer les sejours.
          </p>

          <Alerte type="erreur">{erreurLocale ?? erreur}</Alerte>

          <form className="formulaire" onSubmit={handleSubmit}>
            <div className="champ">
              <label className="champ-label" htmlFor="email">
                Adresse email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                placeholder="vous@exemple.com"
                value={formulaire.email}
                onChange={handleChange}
                required
              />
            </div>

            <div className="champ">
              <label className="champ-label" htmlFor="motDePasse">
                Mot de passe
              </label>
              <input
                id="motDePasse"
                name="motDePasse"
                type="password"
                autoComplete="current-password"
                placeholder="••••••••"
                value={formulaire.motDePasse}
                onChange={handleChange}
                required
              />
            </div>

            <button type="submit" className="bouton" disabled={chargement} style={{ marginTop: 6 }}>
              {chargement ? 'Connexion...' : 'Se connecter'}
            </button>
          </form>

          <div className="pied-page-connexion">
            Pas encore de compte ?{' '}
            <Link to="/inscription" className="lien">
              Creer un compte client
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
