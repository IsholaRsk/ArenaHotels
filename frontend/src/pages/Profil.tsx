import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiAuth, apiReservations } from '../api/client';
import { EntetePage } from '../components/Layout';
import { Alerte, CarteStat } from '../components/ui';
import { useAuth } from '../context/AuthContext';
import { useFetch } from '../hooks/useFetch';
import { formaterDate } from '../utils/format';
import {
  lireDonneesProfilSupabase,
  telechargerJson,
} from '../utils/supabase';

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
  const [telechargement, setTelechargement] = useState(false);
  const [msgTelechargement, setMsgTelechargement] = useState<string | null>(null);

  // Appel protege : le token JWT est ajoute automatiquement par le client API
  const profil = useFetch(() => apiAuth.profil(), []);

  const quitter = () => {
    apiAuth.deconnexion().catch(() => undefined);
    deconnexion();
    naviguer('/connexion', { replace: true });
  };

  // Prepare et telecharge (JSON) les donnees du profil connecte :
  // cote application + cote base Supabase du projet.
  const telechargerMesDonnees = async () => {
    if (!utilisateur) return;
    setTelechargement(true);
    setMsgTelechargement(null);
    try {
      const reservations = await apiReservations
        .lister({ limit: 100 })
        .then((r) => r.donnees ?? [])
        .catch(() => []);
      const supabase = await lireDonneesProfilSupabase(utilisateur.email);
      telechargerJson(`arena-hotels-profil-${utilisateur.email}.json`, {
        genereLe: new Date().toISOString(),
        sources: ['Arena Hotels (API)', 'Supabase'],
        profil: {
          id: utilisateur.id,
          nom: utilisateur.nom,
          email: utilisateur.email,
          role: utilisateur.role,
          telephone: profil.donnees?.telephone ?? null,
          actif: profil.donnees?.actif !== false,
          creeLe: profil.donnees?.createdAt ?? null,
        },
        reservations,
        supabase,
      });
      setMsgTelechargement('Telechargement de vos donnees lance.');
    } catch {
      setMsgTelechargement('Impossible de preparer le telechargement.');
    } finally {
      setTelechargement(false);
    }
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
          <h2 className="carte-titre">Mes donnees</h2>
          <p className="carte-description">
            Telechargez en JSON les donnees de votre profil connecte, telles
            qu'elles existent dans l'application et dans la base Supabase du projet.
          </p>
          <Alerte type="succes">{msgTelechargement}</Alerte>
          <button
            type="button"
            className="bouton"
            onClick={telechargerMesDonnees}
            disabled={telechargement}
          >
            {telechargement ? 'Preparation...' : 'Telecharger mes donnees'}
          </button>
        </div>
      </div>
    </>
  );
}
