import { useEffect, useState, type FormEvent } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { apiChambres, apiClients, apiReservations } from '../api/client';
import { EntetePage } from '../components/Layout';
import {
  Alerte,
  BadgeReservation,
  BadgeType,
  Chargement,
  EtatVide,
  Modale,
  Pagination,
} from '../components/ui';
import { useAuth } from '../context/AuthContext';
import { useFetch } from '../hooks/useFetch';
import type { Reservation } from '../types';
import {
  LIBELLES_STATUT_RESERVATION,
  STATUTS_RESERVATION,
  ajouterJours,
  dateAujourdhui,
  formaterDate,
  formaterMontant,
  moisCourant,
  nuitsEntre,
} from '../utils/format';

const FORMULAIRE_VIDE = {
  chambreId: '',
  clientId: '',
  dateArrivee: dateAujourdhui(),
  dateDepart: ajouterJours(dateAujourdhui(), 2),
  nombrePersonnes: '1',
  statut: 'EN_ATTENTE',
  notes: '',
};

/** Gestion des reservations : creation, suivi du statut, annulation */
export function Reservations() {
  const { aLeRole } = useAuth();
  const estAdmin = aLeRole('ADMIN');
  const [params, setParams] = useSearchParams();

  const page = Number(params.get('page') ?? 1);
  const filtreStatut = params.get('statut') ?? '';
  const filtreMois = params.get('mois') ?? '';

  const [statutLocal, setStatutLocal] = useState(filtreStatut);
  const [moisLocal, setMoisLocal] = useState(filtreMois);
  const [erreur, setErreur] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [modaleOuverte, setModaleOuverte] = useState(false);
  const [formulaire, setFormulaire] = useState(FORMULAIRE_VIDE);
  const [envoiEnCours, setEnvoiEnCours] = useState(false);
  const [suppression, setSuppression] = useState<Reservation | null>(null);
  const [actionEnCours, setActionEnCours] = useState<number | null>(null);

  const liste = useFetch(
    () =>
      apiReservations.lister({
        page,
        limit: 10,
        statut: filtreStatut || undefined,
        mois: filtreMois || undefined,
      }),
    [page, filtreStatut, filtreMois],
  );

  // Listes deroulantes : chambres et clients
  const chambres = useFetch(() => apiChambres.lister({ limit: 100 }), []);
  const clients = useFetch(() => apiClients.lister({ limit: 200 }), []);

  // Prefill depuis la page "Disponibilites" (?chambreId=&arrivee=&depart=&personnes=)
  useEffect(() => {
    const chambreId = params.get('chambreId');
    if (!chambreId) return;
    setFormulaire({
      ...FORMULAIRE_VIDE,
      chambreId,
      dateArrivee: params.get('arrivee') ?? dateAujourdhui(),
      dateDepart: params.get('depart') ?? ajouterJours(dateAujourdhui(), 2),
      nombrePersonnes: params.get('personnes') ?? '1',
    });
    setModaleOuverte(true);
    // On nettoie l'URL pour ne pas rouvrir la modale a chaque rendu
    setParams(
      (precedents) => {
        const suivants = new URLSearchParams(precedents);
        ['chambreId', 'arrivee', 'depart', 'personnes'].forEach((cle) =>
          suivants.delete(cle),
        );
        return suivants;
      },
      { replace: true },
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const appliquerFiltres = (e: FormEvent) => {
    e.preventDefault();
    setParams((precedents) => {
      const suivants = new URLSearchParams(precedents);
      suivants.set('page', '1');
      if (statutLocal) suivants.set('statut', statutLocal);
      else suivants.delete('statut');
      if (moisLocal) suivants.set('mois', moisLocal);
      else suivants.delete('mois');
      return suivants;
    });
  };

  const chambreSelectionnee = (chambres.donnees ?? []).find(
    (c) => String(c.id) === formulaire.chambreId,
  );
  const nuits = nuitsEntre(formulaire.dateArrivee, formulaire.dateDepart);
  const estimation = chambreSelectionnee ? nuits * chambreSelectionnee.prixParNuit : 0;

  const ouvrirCreation = () => {
    setFormulaire(FORMULAIRE_VIDE);
    setErreur(null);
    setModaleOuverte(true);
  };

  const enregistrer = async (e: FormEvent) => {
    e.preventDefault();
    setEnvoiEnCours(true);
    setErreur(null);
    try {
      await apiReservations.creer({
        chambreId: Number(formulaire.chambreId),
        clientId: Number(formulaire.clientId),
        dateArrivee: formulaire.dateArrivee,
        dateDepart: formulaire.dateDepart,
        nombrePersonnes: Number(formulaire.nombrePersonnes),
        statut: formulaire.statut as Reservation['statut'],
        notes: formulaire.notes || undefined,
      });
      setMessage('Reservation enregistree.');
      setModaleOuverte(false);
      liste.recharger();
      chambres.recharger();
    } catch (err) {
      setErreur(err instanceof Error ? err.message : 'Enregistrement impossible');
    } finally {
      setEnvoiEnCours(false);
    }
  };

  const changerStatut = async (reservation: Reservation, statut: Reservation['statut']) => {
    setActionEnCours(reservation.id);
    setErreur(null);
    setMessage(null);
    try {
      await apiReservations.changerStatut(reservation.id, statut);
      setMessage(`Reservation ${reservation.reference} : ${LIBELLES_STATUT_RESERVATION[statut]}.`);
      liste.recharger();
      chambres.recharger();
    } catch (err) {
      setErreur(err instanceof Error ? err.message : 'Modification impossible');
    } finally {
      setActionEnCours(null);
    }
  };

  const confirmerSuppression = async () => {
    if (!suppression) return;
    setEnvoiEnCours(true);
    setErreur(null);
    try {
      await apiReservations.supprimer(suppression.id);
      setMessage(`Reservation ${suppression.reference} supprimee.`);
      setSuppression(null);
      liste.recharger();
      chambres.recharger();
    } catch (err) {
      setErreur(err instanceof Error ? err.message : 'Suppression impossible');
      setSuppression(null);
    } finally {
      setEnvoiEnCours(false);
    }
  };

  const meta = liste.meta as { total: number; page: number; pages: number } | undefined;

  return (
    <>
      <EntetePage
        titre="Reservations"
        sousTitre="Suivi des sejours : confirmation, annulation et cloture."
        actions={
          <>
            <Link to="/planning" className="bouton bouton-secondaire">
              Planning mensuel
            </Link>
            <button type="button" className="bouton bouton-accent" onClick={ouvrirCreation}>
              + Nouvelle reservation
            </button>
          </>
        }
      />

      <div className="page">
        <Alerte type="erreur">{erreur ?? liste.erreur}</Alerte>
        <Alerte type="succes">{message}</Alerte>

        <form className="barre-filtres" onSubmit={appliquerFiltres}>
          <div className="champ">
            <label className="champ-label" htmlFor="filtre-statut">
              Statut
            </label>
            <select
              id="filtre-statut"
              value={statutLocal}
              onChange={(e) => setStatutLocal(e.target.value)}
            >
              <option value="">Tous les statuts</option>
              {STATUTS_RESERVATION.map((s) => (
                <option key={s} value={s}>
                  {LIBELLES_STATUT_RESERVATION[s]}
                </option>
              ))}
            </select>
          </div>
          <div className="champ">
            <label className="champ-label" htmlFor="filtre-mois">
              Mois
            </label>
            <input
              id="filtre-mois"
              type="month"
              value={moisLocal}
              onChange={(e) => setMoisLocal(e.target.value)}
            />
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button type="submit" className="bouton">
              Filtrer
            </button>
            <button
              type="button"
              className="bouton bouton-secondaire"
              onClick={() => {
                setStatutLocal('');
                setMoisLocal('');
                setParams(new URLSearchParams());
              }}
            >
              Reinitialiser
            </button>
          </div>
        </form>

        <div className="carte">
          {liste.chargement ? <Chargement /> : null}

          {!liste.chargement && (liste.donnees ?? []).length === 0 ? (
            <EtatVide
              icone="📅"
              titre="Aucune reservation"
              texte="Aucun sejour ne correspond a ces filtres."
              action={
                <button type="button" className="bouton bouton-accent" onClick={ouvrirCreation}>
                  Creer une reservation
                </button>
              }
            />
          ) : null}

          {!liste.chargement && (liste.donnees ?? []).length > 0 ? (
            <div className="tableau-conteneur">
              <table>
                <thead>
                  <tr>
                    <th>Reference</th>
                    <th>Client</th>
                    <th>Chambre</th>
                    <th>Sejour</th>
                    <th>Pers.</th>
                    <th className="alignement-droite">Montant</th>
                    <th>Statut</th>
                    <th className="alignement-droite">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {(liste.donnees ?? []).map((r) => (
                    <tr key={r.id}>
                      <td className="cellule-principale">{r.reference}</td>
                      <td>
                        <Link to={`/clients/${r.client.id}`} className="lien">
                          {r.client.prenom} {r.client.nom}
                        </Link>
                        <div className="cellule-secondaire">{r.client.email}</div>
                      </td>
                      <td>
                        <Link to={`/chambres/${r.chambre.id}`} className="lien">
                          {r.chambre.numero}
                        </Link>
                        <div className="cellule-secondaire">
                          <BadgeType type={r.chambre.type} />
                        </div>
                      </td>
                      <td>
                        {formaterDate(r.dateArrivee)}
                        <div className="cellule-secondaire">
                          → {formaterDate(r.dateDepart)} ({r.nuits ?? 0} nuit
                          {(r.nuits ?? 0) > 1 ? 's' : ''})
                        </div>
                      </td>
                      <td>{r.nombrePersonnes}</td>
                      <td className="alignement-droite cellule-principale">
                        {formaterMontant(r.montantTotal)}
                      </td>
                      <td>
                        <BadgeReservation statut={r.statut} />
                      </td>
                      <td>
                        <div className="actions-ligne">
                          {r.statut === 'EN_ATTENTE' ? (
                            <button
                              type="button"
                              className="bouton bouton-mini"
                              disabled={actionEnCours === r.id}
                              onClick={() => changerStatut(r, 'CONFIRMEE')}
                            >
                              Confirmer
                            </button>
                          ) : null}
                          {r.statut === 'CONFIRMEE' ? (
                            <>
                              <button
                                type="button"
                                className="bouton bouton-mini bouton-secondaire"
                                disabled={actionEnCours === r.id}
                                onClick={() => changerStatut(r, 'TERMINEE')}
                              >
                                Cloturer
                              </button>
                              <button
                                type="button"
                                className="bouton bouton-mini bouton-danger"
                                disabled={actionEnCours === r.id}
                                onClick={() => changerStatut(r, 'ANNULEE')}
                              >
                                Annuler
                              </button>
                            </>
                          ) : null}
                          {estAdmin && r.statut !== 'TERMINEE' ? (
                            <button
                              type="button"
                              className="bouton-icone"
                              title="Supprimer"
                              onClick={() => {
                                setErreur(null);
                                setMessage(null);
                                setSuppression(r);
                              }}
                            >
                              🗑
                            </button>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}

          {meta ? (
            <Pagination
              page={meta.page}
              pages={meta.pages}
              total={meta.total}
              onChanger={(nouvellePage) =>
                setParams((precedents) => {
                  const suivants = new URLSearchParams(precedents);
                  suivants.set('page', String(nouvellePage));
                  return suivants;
                })
              }
            />
          ) : null}
        </div>
      </div>

      <Modale
        ouvert={modaleOuverte}
        onFermer={() => setModaleOuverte(false)}
        titre="Nouvelle reservation"
        large
        pied={
          <>
            <button
              type="button"
              className="bouton bouton-secondaire"
              onClick={() => setModaleOuverte(false)}
            >
              Annuler
            </button>
            <button
              type="submit"
              form="formulaire-reservation"
              className="bouton"
              disabled={envoiEnCours}
            >
              {envoiEnCours ? 'Enregistrement...' : 'Reserver'}
            </button>
          </>
        }
      >
        <Alerte type="erreur">{erreur}</Alerte>
        <form id="formulaire-reservation" className="formulaire" onSubmit={enregistrer}>
          <div className="grille-champs">
            <div className="champ">
              <label className="champ-label" htmlFor="chambre">
                Chambre <span className="champ-obligatoire">*</span>
              </label>
              <select
                id="chambre"
                name="chambreId"
                value={formulaire.chambreId}
                onChange={(e) => setFormulaire({ ...formulaire, chambreId: e.target.value })}
                required
              >
                <option value="">— Choisir une chambre —</option>
                {(chambres.donnees ?? []).map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.numero} · {c.type} · {c.capacite} pers ·{' '}
                    {formaterMontant(c.prixParNuit)}
                  </option>
                ))}
              </select>
            </div>

            <div className="champ">
              <label className="champ-label" htmlFor="client">
                Client <span className="champ-obligatoire">*</span>
              </label>
              <select
                id="client"
                name="clientId"
                value={formulaire.clientId}
                onChange={(e) => setFormulaire({ ...formulaire, clientId: e.target.value })}
                required
              >
                <option value="">— Choisir un client —</option>
                {(clients.donnees ?? []).map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.prenom} {c.nom} · {c.email}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grille-champs">
            <div className="champ">
              <label className="champ-label" htmlFor="date-arrivee">
                Arrivee <span className="champ-obligatoire">*</span>
              </label>
              <input
                id="date-arrivee"
                name="dateArrivee"
                type="date"
                value={formulaire.dateArrivee}
                min={dateAujourdhui()}
                onChange={(e) => setFormulaire({ ...formulaire, dateArrivee: e.target.value })}
                required
              />
            </div>
            <div className="champ">
              <label className="champ-label" htmlFor="date-depart">
                Depart <span className="champ-obligatoire">*</span>
              </label>
              <input
                id="date-depart"
                name="dateDepart"
                type="date"
                value={formulaire.dateDepart}
                min={ajouterJours(formulaire.dateArrivee, 1)}
                onChange={(e) => setFormulaire({ ...formulaire, dateDepart: e.target.value })}
                required
              />
            </div>
            <div className="champ">
              <label className="champ-label" htmlFor="nombre-personnes">
                Voyageurs <span className="champ-obligatoire">*</span>
              </label>
              <input
                id="nombre-personnes"
                name="nombrePersonnes"
                type="number"
                min={1}
                max={chambreSelectionnee?.capacite ?? 12}
                value={formulaire.nombrePersonnes}
                onChange={(e) =>
                  setFormulaire({ ...formulaire, nombrePersonnes: e.target.value })
                }
                required
              />
              {chambreSelectionnee ? (
                <span className="champ-aide">
                  Capacite maximale : {chambreSelectionnee.capacite} personne(s)
                </span>
              ) : null}
            </div>
            <div className="champ">
              <label className="champ-label" htmlFor="statut-reservation">
                Statut initial
              </label>
              <select
                id="statut-reservation"
                name="statut"
                value={formulaire.statut}
                onChange={(e) => setFormulaire({ ...formulaire, statut: e.target.value })}
              >
                <option value="EN_ATTENTE">En attente</option>
                <option value="CONFIRMEE">Confirmee</option>
              </select>
            </div>
          </div>

          <div className="champ">
            <label className="champ-label" htmlFor="notes">
              Notes
            </label>
            <textarea
              id="notes"
              name="notes"
              value={formulaire.notes}
              onChange={(e) => setFormulaire({ ...formulaire, notes: e.target.value })}
              placeholder="Heure d'arrivee, prestations particulieres..."
            />
          </div>

          {chambreSelectionnee ? (
            <div
              style={{
                background: '#f6f8fd',
                border: '1px solid var(--bordure)',
                borderRadius: 10,
                padding: '12px 14px',
                fontSize: 13.5,
              }}
            >
              <strong>Estimation du sejour</strong> : {nuits} nuit{nuits > 1 ? 's' : ''} ×{' '}
              {formaterMontant(chambreSelectionnee.prixParNuit)} ={' '}
              <strong>{formaterMontant(estimation)}</strong>
              <div className="champ-aide" style={{ marginTop: 4 }}>
                Le montant est recalcule par l'API et la disponibilite verifiee avant
                enregistrement.
              </div>
            </div>
          ) : null}
        </form>
      </Modale>

      <Modale
        ouvert={Boolean(suppression)}
        onFermer={() => setSuppression(null)}
        titre="Supprimer la reservation"
        pied={
          <>
            <button
              type="button"
              className="bouton bouton-secondaire"
              onClick={() => setSuppression(null)}
            >
              Annuler
            </button>
            <button
              type="button"
              className="bouton bouton-danger"
              onClick={confirmerSuppression}
              disabled={envoiEnCours}
            >
              {envoiEnCours ? 'Suppression...' : 'Supprimer'}
            </button>
          </>
        }
      >
        <p style={{ margin: 0 }}>
          Supprimer la reservation <strong>{suppression?.reference}</strong> ? La chambre
          redeviendra disponible sur la periode concernee.
        </p>
        <Alerte type="erreur">{erreur}</Alerte>
      </Modale>
    </>
  );
}
