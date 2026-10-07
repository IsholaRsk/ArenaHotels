import { Link } from 'react-router-dom';

/** Page 404 */
export function Introuvable() {
  return (
    <div className="chargement" style={{ height: '100vh', justifyContent: 'center' }}>
      <div style={{ fontSize: 58, fontWeight: 700, color: 'var(--primaire)' }}>404</div>
      <h1>Cette page n'existe pas</h1>
      <p style={{ color: 'var(--muted)', marginTop: 4 }}>
        L'adresse demandee est introuvable ou la ressource a ete supprimee.
      </p>
      <Link to="/" className="bouton" style={{ marginTop: 12 }}>
        Retour au tableau de bord
      </Link>
    </div>
  );
}
