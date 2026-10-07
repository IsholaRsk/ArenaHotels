import { useNavigate } from 'react-router-dom';
import { apiAuth } from '../api/client';
import { EntetePage } from '../components/Layout';
import { Alerte, CarteStat } from '../components/ui';
import { useAuth } from '../context/AuthContext';
import { useFetch } from '../hooks/useFetch';
import { formaterDate } from '../utils/format';

const LIBELLES: Record<string, string> = {
  ADMIN: 'Administrateur : acces complet (chambres, clients, reservations, comptes).',
  RECEPTIONNISTE:
    'Receptionniste : gestion des chambres, des clients et des reservations.',
  CLIENT: 'Client : consultation des chambres et des disponibilites.',
};

/** Profil de l'utilisateur connecte (route protegee) */
export function Profil() {
  const { utilisateur, deconnexion } = useAuth();
  const naviguer = useNavigate();

  // Appel protege : le token JWT est ajoute automatiquement par le client API
  const profil = useFetch(() => apiAuth.profil(), []);

  const quitter = () => {
    apiAuth.deconnexion().catch(() => undefined);
    deconnexion();
    naviguer('/connexion', { replace: true });
  };

  return (
    <>
      <EntetePage
        titre="Mon profil"
        sousTitre="Informations du compte connecte et niveau d'acces."
        actions={
          <button type="button" className="bouton bouton-danger" onClick={quitter}>
            Se deconnecter
          </button>
        }
      />

      <div className="page">
        <Alerte type="erreur">{profil.erreur}</Alerte>

        <div className="grille grille-stats">
          <CarteStat libelle="Identifiant" valeur={utilisateur ? `#${utilisateur.id}` : '—'} />
          <CarteStat
            libelle="Role"
            valeur={utilisateur?.role ?? '—'}
            detail={utilisateur ? LIBELLES[utilisateur.role] : undefined}
            variante="accent"
          />
          <CarteStat
            libelle="Compte cree le"
            valeur={profil.donnees?.createdAt ? formaterDate(profil.donnees.createdAt.slice(0, 10)) : '—'}
            variante="info"
          />
        </div>

        <div className="carte">
          <h2 className="carte-titre">Coordonnees</h2>
          <div className="liste-details" style={{ marginTop: 14 }}>
            <div>
              <div className="detail-libelle">Nom complet</div>
              <div className="detail-valeur">{utilisateur?.nom}</div>
            </div>
            <div>
              <div className="detail-libelle">Adresse email</div>
              <div className="detail-valeur">{utilisateur?.email}</div>
            </div>
            <div>
              <div className="detail-libelle">Telephone</div>
              <div className="detail-valeur">{profil.donnees?.telephone || '—'}</div>
            </div>
            <div>
              <div className="detail-libelle">Etat du compte</div>
              <div className="detail-valeur">
                {profil.donnees?.actif === false ? 'Desactive' : 'Actif'}
              </div>
            </div>
          </div>
        </div>

        <div className="carte">
          <h2 className="carte-titre">Comment fonctionne la session ?</h2>
          <p className="carte-description">
            A la connexion, l'API NestJS renvoie un token JWT signe (header, payload,
            signature). Le frontend le conserve dans le <code>localStorage</code> et
            l'ajoute automatiquement a chaque requete dans l'en-tete{' '}
            <code>Authorization: Bearer</code>. Le guard <code>JwtAuthGuard</code> verifie
            la signature et l'expiration, puis le <code>RolesGuard</code> controle les
            droits d'acces.
          </p>
          <p className="carte-description" style={{ marginBottom: 0 }}>
            Un code <code>401</code> renvoye par l'API deconnecte automatiquement
            l'utilisateur et le ramene a la page de connexion.
          </p>
        </div>
      </div>
    </>
  );
}
