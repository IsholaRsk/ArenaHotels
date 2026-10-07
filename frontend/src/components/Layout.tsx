import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { apiAuth } from '../api/client';
import { useAuth } from '../context/AuthContext';
import type { Role } from '../types';

interface ElementNav {
  vers: string;
  libelle: string;
  icone: string;
  roles?: Role[];
  section?: string;
}

const NAVIGATION: ElementNav[] = [
  { vers: '/', libelle: 'Tableau de bord', icone: '◈', section: 'Pilotage' },
  { vers: '/chambres', libelle: 'Chambres', icone: '⌂', section: 'Pilotage' },
  { vers: '/disponibilites', libelle: 'Disponibilites', icone: '🔎', section: 'Pilotage' },
  { vers: '/planning', libelle: 'Planning', icone: '▦', section: 'Pilotage' },
  { vers: '/reservations', libelle: 'Reservations', icone: '✎', section: 'Exploitation' },
  { vers: '/clients', libelle: 'Clients', icone: '☺', section: 'Exploitation' },
  { vers: '/profil', libelle: 'Mon profil', icone: '⚙', section: 'Compte' },
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
 * Mise en page commune : barre laterale + zone de contenu.
 * Utilise les routes imbriquees (<Outlet />) de React Router.
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

  let sectionCourante = '';

  return (
    <div className="app">
      <aside className="barre-laterale">
        <div className="marque">
          <div className="marque-logo">A</div>
          <div>
            <div className="marque-titre">ArenaHotels</div>
            <div className="marque-sous-titre">Cotonou</div>
          </div>
        </div>

        <nav className="nav">
          {liensVisibles.map((element) => {
            const entete =
              element.section && element.section !== sectionCourante
                ? element.section
                : null;
            sectionCourante = element.section ?? sectionCourante;
            return (
              <div key={element.vers}>
                {entete ? <div className="nav-section">{entete}</div> : null}
                <NavLink
                  to={element.vers}
                  end={element.vers === '/'}
                  className={({ isActive }) => `nav-lien ${isActive ? 'actif' : ''}`}
                >
                  <span className="nav-icone">{element.icone}</span>
                  <span>{element.libelle}</span>
                </NavLink>
              </div>
            );
          })}
        </nav>

        <div className="pied-barre">
          <div className="avatar">{initiales(utilisateur?.nom ?? '?')}</div>
          <div className="pied-barre-infos">
            <div className="pied-barre-nom">{utilisateur?.nom}</div>
            <div className="pied-barre-role">
              {utilisateur ? LIBELLES_ROLE[utilisateur.role] : ''}
            </div>
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
      </aside>

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
