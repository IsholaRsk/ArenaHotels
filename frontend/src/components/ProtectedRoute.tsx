import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Chargement } from './ui';
import type { Role } from '../types';

/**
 * Route protegee : exige une session valide (token JWT present).
 * Redirige sinon vers /connexion en memorisant la page demandee.
 */
export function RouteProtegee() {
  const { connecte, chargement } = useAuth();
  const emplacement = useLocation();

  if (chargement) {
    return <Chargement texte="Verification de la session..." />;
  }
  if (!connecte) {
    return (
      <Navigate
        to="/connexion"
        replace
        state={{ depuis: emplacement.pathname + emplacement.search }}
      />
    );
  }
  return <Outlet />;
}

/** Route reservee a certains roles (autorisation cote client) */
export function RouteParRole({ roles }: { roles: Role[] }) {
  const { utilisateur, chargement } = useAuth();
  if (chargement) return <Chargement texte="Verification des droits..." />;
  if (!utilisateur || !roles.includes(utilisateur.role)) {
    return <Navigate to="/" replace />;
  }
  return <Outlet />;
}
