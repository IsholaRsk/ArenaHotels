import { useState, type FormEvent } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Alerte } from '../components/ui';
import { useAuth } from '../context/AuthContext';

const COMPTES_DEMO = [
  { role: 'Administrateur', email: 'admin@arenahotels.bj', motDePasse: 'Admin@2026' },
  { role: 'Receptionniste', email: 'reception@arenahotels.bj', motDePasse: 'Reception@2026' },
  { role: 'Client', email: 'client@arenahotels.bj', motDePasse: 'Client@2026' },
];

/** Page de connexion : formulaire controle avec useState */
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
      <section className="ecran-connexion-panneau">
        <div className="marque" style={{ border: 'none', padding: 0, margin: 0 }}>
          <div className="marque-logo">A</div>
          <div>
            <div className="marque-titre">ArenaHotels</div>
            <div className="marque-sous-titre">Gestion des reservations</div>
          </div>
        </div>

        <h1 className="ecran-connexion-titre">
          Pilotez votre hotel, de la chambre au check-out.
        </h1>
        <p className="ecran-connexion-texte">
          Catalogue des chambres, fiches clients, planning d'occupation en temps reel et
          controle automatique des disponibilites : une seule interface pour toute la
          reception.
        </p>

        <div className="ecran-connexion-liste">
          <div className="ecran-connexion-element">
            <span className="ecran-connexion-puce">01</span>
            <span>Gestion des chambres par type, etage et capacite</span>
          </div>
          <div className="ecran-connexion-element">
            <span className="ecran-connexion-puce">02</span>
            <span>Fiches clients avec historique des sejours</span>
          </div>
          <div className="ecran-connexion-element">
            <span className="ecran-connexion-puce">03</span>
            <span>Planning mensuel et detection des sur-reservations</span>
          </div>
          <div className="ecran-connexion-element">
            <span className="ecran-connexion-puce">04</span>
            <span>Indicateurs d'occupation et revenus du mois</span>
          </div>
        </div>

        <div className="ecran-connexion-comptes">
          <strong style={{ color: '#fff' }}>Comptes de demonstration</strong> — cliquez pour
          remplir le formulaire :
          {COMPTES_DEMO.map((compte) => (
            <div key={compte.email} style={{ marginTop: 6 }}>
              <code onClick={() => remplir(compte.email, compte.motDePasse)}>
                {compte.role} : {compte.email}
              </code>
            </div>
          ))}
        </div>
      </section>

      <section className="ecran-connexion-formulaire">
        <div className="boite-connexion">
          <h1>Connexion</h1>
          <p className="boite-connexion-sous-titre">
            Accedez a votre espace avec votre compte ArenaHotels.
          </p>

          <Alerte type="erreur">{erreurLocale ?? erreur}</Alerte>

          <form className="formulaire" onSubmit={handleSubmit}>
            <div className="champ">
              <label className="champ-label" htmlFor="email">
                Adresse email <span className="champ-obligatoire">*</span>
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
                Mot de passe <span className="champ-obligatoire">*</span>
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
              {chargement ? 'Connexion en cours...' : 'Se connecter'}
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
