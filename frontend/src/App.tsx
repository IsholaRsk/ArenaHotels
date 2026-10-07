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
import { Profil } from './pages/Profil';
import { Reservations } from './pages/Reservations';
import { TableauDeBord } from './pages/TableauDeBord';

/**
 * Plan de routage de l'application.
 *  - routes publiques : /connexion, /inscription
 *  - routes protegees : tout le reste (token JWT obligatoire)
 *  - routes reservees au personnel : clients, reservations, planning
 *  - route * : page 404
 */
export default function App() {
  const { connecte, chargement } = useAuth();

  if (chargement) {
    return <div className="chargement" style={{ height: '100vh', justifyContent: 'center' }}><div className="roue" /></div>;
  }

  return (
    <Routes>
      <Route
        path="/connexion"
        element={connecte ? <Navigate to="/" replace /> : <Connexion />}
      />
      <Route
        path="/inscription"
        element={connecte ? <Navigate to="/" replace /> : <Inscription />}
      />

      <Route element={<RouteProtegee />}>
        <Route element={<Layout />}>
          <Route index element={<TableauDeBord />} />
          <Route path="chambres" element={<Chambres />} />
          <Route path="chambres/:id" element={<ChambreDetail />} />
          <Route path="disponibilites" element={<Disponibilites />} />
          <Route path="profil" element={<Profil />} />

          {/* Reserve au personnel de l'hotel */}
          <Route element={<RouteParRole roles={['ADMIN', 'RECEPTIONNISTE']} />}>
            <Route path="planning" element={<Planning />} />
            <Route path="reservations" element={<Reservations />} />
            <Route path="clients" element={<Clients />} />
            <Route path="clients/:id" element={<ClientDetail />} />
          </Route>
        </Route>
      </Route>

      <Route path="*" element={<Introuvable />} />
    </Routes>
  );
}
