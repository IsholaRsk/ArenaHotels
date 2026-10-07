import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { apiAuth } from '../api/client';
import { useAuth } from '../context/AuthContext';
import type { Role } from '../types';

interface ElementNav {
  vers: string;
  libelle: string;
  roles?: Role[];
}

const NAVIGATION: ElementNav[] = [
  { vers: '/', libelle: 'Accueil' },
  { vers: '/chambres', libelle: 'Chambres' },
  { vers: '/disponibilites', libelle: 'Disponibilites' },
  { vers: '/planning', libelle: 'Planning' },
  { vers: '/reservations', libelle: 'Reservations' },
  { vers: '/clients', libelle: 'Clients' },
  { vers: '/profil', libelle: 'Profil' },
];

const LIBELLES_ROLE: Record<Role, string> = {
  ADMIN: 'Administrateur',
  RECEPTIONNISTE: 'Receptionniste',
  CLIENT: 'Client',
};

function initiales(nom: string): string {
  return nom
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((mot) => mot[0]?.toUpperCase())
    .join('');
}

/**
 * Mise en page minimaliste : fine barre superieure + contenu.
 * Routes imbriquees via <Outlet />.
 */
export function Layout() {
  const { utilisateur, deconnexion } = useAuth();
  const naviguer = useNavigate();

  const quitter = () => {
    apiAuth.deconnexion().catch(() => undefined);
    deconnexion();
    naviguer('/connexion', { replace: true });
  };

  const liensVisibles = NAVIGATION.filter(
    (element) =>
      !element.roles || (utilisateur && element.roles.includes(utilisateur.role)),
  );

  return (
    <div className="app">
      <header className="barre-haute">
        <div className="barre-haute-marque">
          Arena<small>Hotels</small>
        </div>

        <nav className="barre-haute-nav">
          {liensVisibles.map((element) => (
            <NavLink
              key={element.vers}
              to={element.vers}
              end={element.vers === '/'}
              className={({ isActive }) =>
                `barre-haute-lien ${isActive ? 'actif' : ''}`
              }
            >
              {element.libelle}
            </NavLink>
          ))}
        </nav>

        <div className="barre-haute-compte">
          <div style={{ textAlign: 'right' }}>
            <div className="barre-haute-compte-nom">{utilisateur?.nom}</div>
            <div className="barre-haute-compte-role">
              {utilisateur ? LIBELLES_ROLE[utilisateur.role] : ''}
            </div>
          </div>
          <div className="avatar" title={utilisateur?.nom ?? ''}>
            {initiales(utilisateur?.nom ?? '?')}
          </div>
          <button
            type="button"
            className="bouton-icone"
            onClick={quitter}
            title="Se deconnecter"
            aria-label="Se deconnecter"
          >
            ⎋
          </button>
        </div>
      </header>

      <main className="contenu">
        <Outlet />
      </main>
    </div>
  );
}

/** Entete de page reutilisable */
export function EntetePage({
  titre,
  sousTitre,
  actions,
}: {
  titre: string;
  sousTitre?: string;
  actions?: React.ReactNode;
}) {
  return (
    <header className="entete">
      <div>
        <h1 className="entete-titre">{titre}</h1>
        {sousTitre ? <div className="entete-sous-titre">{sousTitre}</div> : null}
      </div>
      {actions ? <div className="entete-actions">{actions}</div> : null}
    </header>
  );
}
