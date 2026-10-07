import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, In, MoreThanOrEqual, Repository } from 'typeorm';
import {
  StatutChambre,
  StatutReservation,
  TypeChambre,
} from '../common/enums';
import { addDays, joursDuMois, todayIso } from '../common/utils/date.utils';
import { Chambre } from '../entities/chambre.entity';
import { Client } from '../entities/client.entity';
import { Reservation } from '../entities/reservation.entity';
import { Utilisateur } from '../entities/utilisateur.entity';

/**
 * Service statistiques : indicateurs du tableau de bord
 * (occupation, arrivees du jour, revenus, alertes).
 */
@Injectable()
export class StatsService {
  constructor(
    @InjectRepository(Chambre)
    private readonly chambres: Repository<Chambre>,
    @InjectRepository(Client)
    private readonly clients: Repository<Client>,
    @InjectRepository(Reservation)
    private readonly reservations: Repository<Reservation>,
    @InjectRepository(Utilisateur)
    private readonly utilisateurs: Repository<Utilisateur>,
  ) {}

  async tableauDeBord() {
    const aujourdHui = todayIso();
    const mois = aujourdHui.slice(0, 7);
    const debutMois = `${mois}-01`;
    const finMois = addDays(debutMois, joursDuMois(mois).length);

    const [
      totalChambres,
      libres,
      occupees,
      maintenance,
      totalClients,
      clientsDuMois,
      totalReservations,
      arriveesDuJour,
      departsDuJour,
      enAttente,
      confirmees,
      annulees,
      terminees,
      reservationsDuMois,
      prochainesArrivees,
    ] = await Promise.all([
      this.chambres.count(),
      this.chambres.count({ where: { statut: StatutChambre.LIBRE } }),
      this.chambres.count({ where: { statut: StatutChambre.OCCUPEE } }),
      this.chambres.count({ where: { statut: StatutChambre.MAINTENANCE } }),
      this.clients.count(),
      this.clients.count({
        where: {
          createdAt: Between(
            new Date(`${debutMois}T00:00:00.000Z`),
            new Date(`${finMois}T00:00:00.000Z`),
          ),
        },
      }),
      this.reservations.count(),
      this.reservations.count({
        where: {
          dateArrivee: aujourdHui,
          statut: In([
            StatutReservation.CONFIRMEE,
            StatutReservation.EN_ATTENTE,
          ]),
        },
      }),
      this.reservations.count({
        where: {
          dateDepart: aujourdHui,
          statut: In([StatutReservation.CONFIRMEE, StatutReservation.TERMINEE]),
        },
      }),
      this.reservations.count({
        where: { statut: StatutReservation.EN_ATTENTE },
      }),
      this.reservations.count({ where: { statut: StatutReservation.CONFIRMEE } }),
      this.reservations.count({ where: { statut: StatutReservation.ANNULEE } }),
      this.reservations.count({ where: { statut: StatutReservation.TERMINEE } }),
      this.reservations.find({
        where: [
          {
            dateArrivee: MoreThanOrEqual(debutMois),
            statut: In([
              StatutReservation.CONFIRMEE,
              StatutReservation.EN_ATTENTE,
            ]),
          },
        ],
        relations: { chambre: true, client: true },
        order: { dateArrivee: 'ASC' },
      }),
      this.reservations.find({
        where: {
          dateArrivee: MoreThanOrEqual(aujourdHui),
          statut: In([
            StatutReservation.CONFIRMEE,
            StatutReservation.EN_ATTENTE,
          ]),
        },
        relations: { chambre: true, client: true },
        order: { dateArrivee: 'ASC' },
        take: 6,
      }),
    ]);

    const reservationsDuMoisActives = reservationsDuMois.filter((r) =>
      [StatutReservation.CONFIRMEE, StatutReservation.TERMINEE].includes(
        r.statut,
      ),
    );
    const revenuDuMois = reservationsDuMoisActives.reduce(
      (somme, r) => somme + (r.montantTotal || 0),
      0,
    );
    const revenusAVenir = (
      await this.reservations.find({
        where: {
          dateArrivee: MoreThanOrEqual(aujourdHui),
          statut: StatutReservation.CONFIRMEE,
        },
      })
    ).reduce((somme, r) => somme + (r.montantTotal || 0), 0);

    const joursDuMoisCourant = joursDuMois(mois).length;
    const nuitsVenduesDuMois = this.nuitsConsommees(
      reservationsDuMoisActives,
      debutMois,
      finMois,
    );
    const tauxOccupation = totalChambres
      ? Math.round(
          (nuitsVenduesDuMois / (totalChambres * joursDuMoisCourant)) * 100,
        )
      : 0;

    // Repartition du parc par type de chambre
    const parcParType = await Promise.all(
      Object.values(TypeChambre).map(async (type) => ({
        type,
        nombre: await this.chambres.count({ where: { type } }),
      })),
    );

    return {
      date: aujourdHui,
      mois,
      chambres: {
        total: totalChambres,
        libres,
        occupees,
        maintenance,
        parType: parcParType,
      },
      clients: { total: totalClients, nouveauxCeMois: clientsDuMois },
      reservations: {
        total: totalReservations,
        arriveesDuJour,
        departsDuJour,
        enAttente,
        confirmees,
        annulees,
        terminees,
        ceMois: reservationsDuMois.length,
      },
      revenus: { duMois: revenuDuMois, aVenir: revenusAVenir },
      tauxOccupation,
      prochainesArrivees: prochainesArrivees.map((r) => ({
        id: r.id,
        reference: r.reference,
        dateArrivee: r.dateArrivee,
        dateDepart: r.dateDepart,
        statut: r.statut,
        chambre: r.chambre?.numero,
        type: r.chambre?.type,
        client: `${r.client?.prenom ?? ''} ${r.client?.nom ?? ''}`.trim(),
        montantTotal: r.montantTotal,
      })),
      alertes: {
        maintenance,
        enAttente,
      },
      utilisateurs: await this.utilisateurs.count(),
    };
  }

  /** Nuits effectivement vendues dans une fenetre de dates */
  private nuitsConsommees(
    reservations: Reservation[],
    debut: string,
    fin: string,
  ): number {
    let nuits = 0;
    for (const r of reservations) {
      const a = r.dateArrivee < debut ? debut : r.dateArrivee;
      const b = r.dateDepart > fin ? fin : r.dateDepart;
      if (b > a) {
        nuits += Math.round(
          (new Date(`${b}T00:00:00.000Z`).getTime() -
            new Date(`${a}T00:00:00.000Z`).getTime()) /
            86400000,
        );
      }
    }
    return nuits;
  }
}
