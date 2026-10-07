import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiChambres } from '../api/client';
import { EntetePage } from '../components/Layout';
import { Alerte, CarteChambre, Chargement, EtatVide } from '../components/ui';
import { useAuth } from '../context/AuthContext';
import { useFetch } from '../hooks/useFetch';
import {
  LIBELLES_TYPE_CHAMBRE,
  TYPES_CHAMBRE,
  ajouterJours,
  dateAujourdhui,
  formaterDate,
} from '../utils/format';

/**
 * Recherche de disponibilites : le backend verifie le chevauchement des
 * periodes et renvoie, pour chaque chambre, si elle est libre ou pas.
 */
export function Disponibilites() {
  const naviguer = useNavigate();
  const { aLeRole } = useAuth();
  const peutReserver = aLeRole('ADMIN', 'RECEPTIONNISTE');

  const aujourdHui = dateAujourdhui();
  const [criteres, setCriteres] = useState({
    arrivee: aujourdHui,
    depart: ajouterJours(aujourdHui, 2),
    personnes: '2',
    type: '',
  });
  const [rechercheActive, setRechercheActive] = useState({
    arrivee: aujourdHui,
    depart: ajouterJours(aujourdHui, 2),
    personnes: '2',
    type: '',
  });
  const [erreur, setErreur] = useState<string | null>(null);

  const resultat = useFetch(
    () =>
      apiChambres.disponibilites({
        arrivee: rechercheActive.arrivee,
        depart: rechercheActive.depart,
        personnes: rechercheActive.personnes || undefined,
        type: rechercheActive.type || undefined,
      }),
    [
      rechercheActive.arrivee,
      rechercheActive.depart,
      rechercheActive.personnes,
      rechercheActive.type,
    ],
  );

  const lancer = (e: FormEvent) => {
    e.preventDefault();
    setErreur(null);
    if (criteres.depart <= criteres.arrivee) {
      setErreur('La date de depart doit etre posterieure a la date d arrivee.');
      return;
    }
    setRechercheActive({ ...criteres });
  };

  const reserver = (chambreId: number) => {
    const params = new URLSearchParams({
      chambreId: String(chambreId),
      arrivee: rechercheActive.arrivee,
      depart: rechercheActive.depart,
      personnes: rechercheActive.personnes,
    });
    naviguer(`/reservations?${params.toString()}`);
  };

  const meta = resultat.meta as
    | { nuits?: number; disponibles?: number; total?: number }
    | undefined;
  const chambres = resultat.donnees ?? [];

  return (
    <>
      <EntetePage
        titre="Disponibilites"
        sousTitre="Verifiez en temps reel les chambres libres sur une periode."
      />

      <div className="page">
        <Alerte type="erreur">{erreur ?? resultat.erreur}</Alerte>

        <form className="barre-filtres carte" onSubmit={lancer} style={{ marginBottom: 26 }}>
          <div className="champ">
            <label className="champ-label" htmlFor="arrivee">
              Arrivee
            </label>
            <input
              id="arrivee"
              type="date"
              value={criteres.arrivee}
              min={aujourdHui}
              onChange={(e) => setCriteres({ ...criteres, arrivee: e.target.value })}
              required
            />
          </div>
          <div className="champ">
            <label className="champ-label" htmlFor="depart">
              Depart
            </label>
            <input
              id="depart"
              type="date"
              value={criteres.depart}
              min={criteres.arrivee}
              onChange={(e) => setCriteres({ ...criteres, depart: e.target.value })}
              required
            />
          </div>
          <div className="champ">
            <label className="champ-label" htmlFor="personnes">
              Voyageurs
            </label>
            <input
              id="personnes"
              type="number"
              min={1}
              max={12}
              value={criteres.personnes}
              onChange={(e) => setCriteres({ ...criteres, personnes: e.target.value })}
            />
          </div>
          <div className="champ">
            <label className="champ-label" htmlFor="type-chambre">
              Type
            </label>
            <select
              id="type-chambre"
              value={criteres.type}
              onChange={(e) => setCriteres({ ...criteres, type: e.target.value })}
            >
              <option value="">Tous</option>
              {TYPES_CHAMBRE.map((t) => (
                <option key={t} value={t}>{LIBELLES_TYPE_CHAMBRE[t]}</option>
              ))}
            </select>
          </div>
          <button type="submit" className="bouton">
            Rechercher
          </button>
        </form>

        {resultat.chargement ? <Chargement texte="Verification des disponibilites..." /> : null}

        {!resultat.chargement ? (
          <>
            <p className="carte-description" style={{ marginBottom: 20 }}>
              Sejour du {formaterDate(rechercheActive.arrivee)} au{' '}
              {formaterDate(rechercheActive.depart)} — {meta?.nuits ?? 0} nuit(s) ·{' '}
              {meta?.disponibles ?? 0} disponible(s) sur {meta?.total ?? 0}
            </p>

            {chambres.length === 0 ? (
              <EtatVide icone="🔎" titre="Aucune chambre pour ces criteres" />
            ) : (
              <div className="grille-chambres">
                {chambres.map((chambre) => (
                  <CarteChambre
                    key={chambre.id}
                    chambre={chambre}
                    disponible={chambre.disponible}
                    motif={chambre.disponible ? undefined : chambre.motif}
                    prix={chambre.prixSejour}
                    prixDetail={`pour ${chambre.nuits} nuit(s)`}
                    action={
                      chambre.disponible && peutReserver ? (
                        <button
                          type="button"
                          className="bouton bouton-accent bouton-mini"
                          onClick={() => reserver(chambre.id)}
                        >
                          Reserver
                        </button>
                      ) : chambre.disponible ? (
                        <span className="cellule-secondaire">via reception</span>
                      ) : null
                    }
                  />
                ))}
              </div>
            )}
          </>
        ) : null}
      </div>
    </>
  );
}
