import { useState, type FormEvent } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Alerte } from '../components/ui';
import { useAuth } from '../context/AuthContext';
import { IMAGE_HERO } from '../utils/images';

const COMPTES_DEMO = [
  { role: 'Administrateur', email: 'admin@arenahotels.bj', motDePasse: 'Admin@2026' },
  { role: 'Receptionniste', email: 'reception@arenahotels.bj', motDePasse: 'Reception@2026' },
  { role: 'Client', email: 'client@arenahotels.bj', motDePasse: 'Client@2026' },
];

/** Page de connexion minimaliste : photographie pleine hauteur + formulaire epure */
export function Connexion() {
  const { connexion, chargement, erreur } = useAuth();
  const naviguer = useNavigate();
  const emplacement = useLocation() as { state?: { depuis?: string } };

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

  const remplir = (email: string, motDePasse: string) =>
    setFormulaire({ email, motDePasse });

  return (
    <div className="ecran-connexion">
      <section className="ecran-connexion-image">
        <img src={IMAGE_HERO} alt="Facade de l'hotel au crepuscule" />
        <div className="ecran-connexion-image-legende">
          Arena Hotels — Cotonou. Quatorze chambres, une seule exigence : le calme.
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

          <div className="ecran-connexion-comptes">
            Comptes de demonstration — cliquez pour remplir :
            {COMPTES_DEMO.map((compte) => (
              <div key={compte.email} style={{ marginTop: 6 }}>
                <code onClick={() => remplir(compte.email, compte.motDePasse)}>
                  {compte.role} · {compte.email}
                </code>
              </div>
            ))}
          </div>

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
