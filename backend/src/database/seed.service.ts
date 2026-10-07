import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcryptjs';
import { Repository } from 'typeorm';
import { Role, StatutChambre, StatutReservation, TypeChambre } from '../common/enums';
import {
  addDays,
  nombreDeNuits,
  todayIso,
} from '../common/utils/date.utils';
import { Chambre } from '../entities/chambre.entity';
import { Client } from '../entities/client.entity';
import { Reservation } from '../entities/reservation.entity';
import { Utilisateur } from '../entities/utilisateur.entity';

/**
 * Charge un jeu de donnees de demonstration au demarrage si les tables sont vides.
 * Utile en local comme sur Vercel (base ephemere reinitialisee a chaque cold start).
 */
@Injectable()
export class SeedService implements OnApplicationBootstrap {
  private readonly logger = new Logger('Seed');

  constructor(
    @InjectRepository(Utilisateur)
    private readonly utilisateurs: Repository<Utilisateur>,
    @InjectRepository(Chambre) private readonly chambres: Repository<Chambre>,
    @InjectRepository(Client) private readonly clients: Repository<Client>,
    @InjectRepository(Reservation)
    private readonly reservations: Repository<Reservation>,
  ) {}

  async onApplicationBootstrap(): Promise<void> {
    await this.seedUtilisateurs();
    await this.seedMetier();
  }

  private async seedUtilisateurs(): Promise<void> {
    const comptes: Array<{
      nom: string;
      email: string;
      motDePasse: string;
      role: Role;
      telephone: string;
    }> = [
      {
        nom: 'Rodrigue Ishola',
        email: 'admin@arenahotels.bj',
        motDePasse: 'Admin@2026',
        role: Role.ADMIN,
        telephone: '+229 97 00 00 01',
      },
      {
        nom: 'Awa Adjovi',
        email: 'reception@arenahotels.bj',
        motDePasse: 'Reception@2026',
        role: Role.RECEPTIONNISTE,
        telephone: '+229 97 00 00 02',
      },
      {
        nom: 'Kofi Mensah',
        email: 'client@arenahotels.bj',
        motDePasse: 'Client@2026',
        role: Role.CLIENT,
        telephone: '+229 97 00 00 03',
      },
    ];

    for (const compte of comptes) {
      const existe = await this.utilisateurs.findOne({
        where: { email: compte.email },
      });
      if (!existe) {
        await this.utilisateurs.save(
          this.utilisateurs.create({
            ...compte,
            motDePasse: await bcrypt.hash(compte.motDePasse, 10),
          }),
        );
        this.logger.log(`Compte de demonstration cree : ${compte.email}`);
      }
    }
  }

  private async seedMetier(): Promise<void> {
    const nbChambres = await this.chambres.count();
    if (nbChambres > 0) return;

    const aujourdHui = todayIso();

    // ---------------- Chambres ----------------
    const plan: Array<{
      numeros: string[];
      type: TypeChambre;
      prix: number;
      capacite: number;
      etage: number;
      description: string;
    }> = [
      {
        numeros: ['101', '102', '103', '104'],
        type: TypeChambre.SIMPLE,
        prix: 25000,
        capacite: 1,
        etage: 1,
        description:
          'Chambre simple confortable avec lit 120 cm, climatiseur et Wi-Fi fibre.',
      },
      {
        numeros: ['201', '202', '203', '204'],
        type: TypeChambre.DOUBLE,
        prix: 40000,
        capacite: 2,
        etage: 2,
        description:
          'Chambre double avec grand lit, bureau, television et vue sur la cour.',
      },
      {
        numeros: ['301', '302', '303'],
        type: TypeChambre.TWIN,
        prix: 45000,
        capacite: 2,
        etage: 3,
        description:
          'Chambre twin (2 lits separes), ideale pour les voyages professionnels.',
      },
      {
        numeros: ['401', '402'],
        type: TypeChambre.SUITE,
        prix: 85000,
        capacite: 4,
        etage: 4,
        description:
          'Suite avec salon prive, minibar, baignoire et balcon panoramique.',
      },
      {
        numeros: ['403'],
        type: TypeChambre.FAMILIALE,
        prix: 70000,
        capacite: 5,
        etage: 4,
        description:
          'Chambre familiale spacieuse : 1 grand lit + 3 lits simples, coin enfants.',
      },
    ];

    const chambresCreees: Chambre[] = [];
    for (const ligne of plan) {
      for (const numero of ligne.numeros) {
        const chambre = await this.chambres.save(
          this.chambres.create({
            numero,
            type: ligne.type,
            prixParNuit: ligne.prix,
            capacite: ligne.capacite,
            etage: ligne.etage,
            description: ligne.description,
            statut: StatutChambre.LIBRE,
          }),
        );
        chambresCreees.push(chambre);
      }
    }

    // Une chambre en maintenance
    const maintenance = chambresCreees.find((c) => c.numero === '104');
    if (maintenance) {
      await this.chambres.update(maintenance.id, {
        statut: StatutChambre.MAINTENANCE,
      });
      maintenance.statut = StatutChambre.MAINTENANCE;
    }

    // ---------------- Clients ----------------
    const donneesClients = [
      { nom: 'Sossou', prenom: 'Marie', email: 'marie.sossou@gmail.com', telephone: '+229 95 12 34 56', ville: 'Cotonou', pays: 'Benin' },
      { nom: 'Dossou', prenom: 'Jean', email: 'jean.dossou@yahoo.fr', telephone: '+229 96 22 33 44', ville: 'Porto-Novo', pays: 'Benin' },
      { nom: 'Adjovi', prenom: 'Claire', email: 'claire.adjovi@gmail.com', telephone: '+229 97 45 67 89', ville: 'Abomey-Calavi', pays: 'Benin' },
      { nom: 'Traore', prenom: 'Ibrahim', email: 'ibrahim.traore@orange.ml', telephone: '+223 76 11 22 33', ville: 'Bamako', pays: 'Mali' },
      { nom: 'Mensah', prenom: 'Kofi', email: 'client@arenahotels.bj', telephone: '+229 97 00 00 03', ville: 'Lome', pays: 'Togo' },
      { nom: 'Dupont', prenom: 'Sophie', email: 'sophie.dupont@gmail.com', telephone: '+33 6 12 34 56 78', ville: 'Paris', pays: 'France' },
      { nom: 'Hounkpatin', prenom: 'Eric', email: 'eric.hounkpatin@gmail.com', telephone: '+229 94 77 88 99', ville: 'Parakou', pays: 'Benin' },
      { nom: 'Adeyemi', prenom: 'Bolanle', email: 'bolanle.adeyemi@gmail.com', telephone: '+234 803 445 5667', ville: 'Lagos', pays: 'Nigeria' },
    ];

    const clientsCrees: Client[] = [];
    for (const d of donneesClients) {
      clientsCrees.push(
        await this.clients.save(
          this.clients.create({ ...d, adresse: `${d.ville}, quartier Ganhi` }),
        ),
      );
    }

    // ---------------- Reservations ----------------
    // Decalages (en jours) par rapport a aujourd'hui : passe / present / futur
    const creneaux: Array<{
      debut: number;
      duree: number;
      chambre: string;
      client: number;
      personnes: number;
      statut: StatutReservation;
      notes?: string;
    }> = [
      { debut: -9, duree: 3, chambre: '101', client: 0, personnes: 1, statut: StatutReservation.TERMINEE },
      { debut: -8, duree: 5, chambre: '201', client: 5, personnes: 2, statut: StatutReservation.TERMINEE },
      { debut: -5, duree: 2, chambre: '301', client: 3, personnes: 2, statut: StatutReservation.TERMINEE },
      { debut: -4, duree: 6, chambre: '401', client: 7, personnes: 3, statut: StatutReservation.TERMINEE },
      { debut: -2, duree: 4, chambre: '102', client: 1, personnes: 1, statut: StatutReservation.CONFIRMEE },
      { debut: -1, duree: 3, chambre: '202', client: 2, personnes: 2, statut: StatutReservation.CONFIRMEE },
      { debut: 0, duree: 2, chambre: '302', client: 4, personnes: 2, statut: StatutReservation.CONFIRMEE, notes: 'Arrivee prevue a 14h' },
      { debut: 0, duree: 4, chambre: '402', client: 5, personnes: 4, statut: StatutReservation.CONFIRMEE, notes: 'Lit bebe a ajouter' },
      { debut: 1, duree: 3, chambre: '101', client: 6, personnes: 1, statut: StatutReservation.CONFIRMEE },
      { debut: 2, duree: 5, chambre: '203', client: 0, personnes: 2, statut: StatutReservation.EN_ATTENTE, notes: 'En attente du virement' },
      { debut: 3, duree: 2, chambre: '301', client: 1, personnes: 2, statut: StatutReservation.CONFIRMEE },
      { debut: 4, duree: 7, chambre: '403', client: 7, personnes: 5, statut: StatutReservation.EN_ATTENTE },
      { debut: 6, duree: 2, chambre: '103', client: 2, personnes: 1, statut: StatutReservation.CONFIRMEE },
      { debut: 7, duree: 3, chambre: '204', client: 3, personnes: 2, statut: StatutReservation.EN_ATTENTE },
      { debut: 9, duree: 4, chambre: '303', client: 5, personnes: 2, statut: StatutReservation.CONFIRMEE },
      { debut: 12, duree: 3, chambre: '401', client: 6, personnes: 3, statut: StatutReservation.EN_ATTENTE },
      { debut: 5, duree: 2, chambre: '102', client: 4, personnes: 1, statut: StatutReservation.ANNULEE, notes: 'Annulee par le client' },
    ];

    let compteur = 1;
    for (const c of creneaux) {
      const chambre = chambresCreees.find((x) => x.numero === c.chambre);
      const client = clientsCrees[c.client];
      if (!chambre || !client) continue;
      const arrivee = addDays(aujourdHui, c.debut);
      const depart = addDays(arrivee, c.duree);
      await this.reservations.save(
        this.reservations.create({
          reference: `RES-${String(compteur).padStart(4, '0')}`,
          chambre,
          client,
          dateArrivee: arrivee,
          dateDepart: depart,
          nombrePersonnes: Math.min(c.personnes, chambre.capacite),
          statut: c.statut,
          montantTotal: nombreDeNuits(arrivee, depart) * chambre.prixParNuit,
          notes: c.notes,
        }),
      );
      compteur++;
    }

    // Statut des chambres occupees aujourd'hui
    const reservationsActives = await this.reservations.find({
      where: [
        { statut: StatutReservation.CONFIRMEE },
        { statut: StatutReservation.EN_ATTENTE },
      ],
    });
    for (const chambre of chambresCreees) {
      const occupee = reservationsActives.some(
        (r) =>
          r.chambre?.id === chambre.id &&
          r.dateArrivee <= aujourdHui &&
          r.dateDepart > aujourdHui,
      );
      if (occupee && chambre.statut === StatutChambre.LIBRE) {
        await this.chambres.update(chambre.id, {
          statut: StatutChambre.OCCUPEE,
        });
      }
    }

    this.logger.log(
      `Jeu de demonstration charge : ${chambresCreees.length} chambres, ${clientsCrees.length} clients, ${compteur - 1} reservations`,
    );
  }
}
