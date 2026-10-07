import { Navigate, Route, Routes } from 'react-router-dom';
import { Layout } from './components/Layout';
import { RouteParRole, RouteProtegee } from './components/ProtectedRoute';
import { useAuth } from './context/AuthContext';
import { ChambreDetail } from './pages/ChambreDetail';
import { Chambres } from './pages/Chambres';
import { ClientDetail } from './pages/ClientDetail';
import { Clients } from './pages/Clients';
import { Connexion } from './pages/Connexion';
import { Disponibilites } from './pages/Disponibilites';
import { Inscription } from './pages/Inscription';
import { Introuvable } from './pages/Introuvable';
import { Planning } from './pages/Planning';
import { MesReservations } from './pages/MesReservations';
import { Profil } from './pages/Profil';
import { Reservations } from './pages/Reservations';
import { Reserver } from './pages/Reserver';
import { TableauDeBord } from './pages/TableauDeBord';
import { Utilisateurs } from './pages/Utilisateurs';

/**
 * Plan de routage.
 *  - consultation publique (sans connexion) : accueil, chambres, disponibilites
 *  - connexion obligatoire : finaliser une reservation, profil
 *  - reserve au personnel : planning, reservations, clients
 *  - route * : page 404
 */
export default function App() {
  const { chargement } = useAuth();

  if (chargement) {
    return (
      <div className="chargement" style={{ height: '100vh', justifyContent: 'center' }}>
        <div className="roue" />
      </div>
    );
  }

  return (
    <Routes>
      <Route
        path="/connexion"
        element={<Connexion />}
      />
      <Route
        path="/inscription"
        element={<Inscription />}
      />

      <Route element={<Layout />}>
        {/* Consultation libre, sans compte */}
        <Route index element={<TableauDeBord />} />
        <Route path="chambres" element={<Chambres />} />
        <Route path="chambres/:id" element={<ChambreDetail />} />
        <Route path="disponibilites" element={<Disponibilites />} />

        {/* Connexion obligatoire */}
        <Route element={<RouteProtegee />}>
          <Route path="reserver" element={<Reserver />} />
          <Route path="mes-reservations" element={<MesReservations />} />
          <Route path="profil" element={<Profil />} />

          {/* Reserve au personnel de l'hotel */}
          <Route element={<RouteParRole roles={['ADMIN', 'RECEPTIONNISTE']} />}>
            <Route path="planning" element={<Planning />} />
            <Route path="reservations" element={<Reservations />} />
            <Route path="clients" element={<Clients />} />
            <Route path="clients/:id" element={<ClientDetail />} />
          </Route>
          <Route element={<RouteParRole roles={['ADMIN']} />}>
            <Route path="utilisateurs" element={<Utilisateurs />} />
          </Route>
        </Route>
      </Route>

      <Route path="*" element={<Introuvable />} />
    </Routes>
  );
}
