import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, LessThan, MoreThanOrEqual, Repository } from 'typeorm';
import { ChambresService } from '../chambres/chambres.service';
import { ClientsService } from '../clients/clients.service';
import {
  Role,
  STATUTS_BLOQUANTS,
  StatutChambre,
  StatutReservation,
} from '../common/enums';
import { JwtPayload } from '../auth/strategies/jwt.strategy';
import {
  addDays,
  joursDuMois,
  nombreDeNuits,
  todayIso,
} from '../common/utils/date.utils';
import { Chambre } from '../entities/chambre.entity';
import { Client } from '../entities/client.entity';
import { Reservation } from '../entities/reservation.entity';
import {
  CreateReservationDto,
  FiltreReservationsQueryDto,
  UpdateReservationDto,
} from './dto/create-reservation.dto';

/** Transitions de statut autorisees (regle metier) */
const TRANSITIONS: Record<StatutReservation, StatutReservation[]> = {
  [StatutReservation.EN_ATTENTE]: [
    StatutReservation.CONFIRMEE,
    StatutReservation.ANNULEE,
  ],
  [StatutReservation.CONFIRMEE]: [
    StatutReservation.TERMINEE,
    StatutReservation.ANNULEE,
  ],
  [StatutReservation.ANNULEE]: [StatutReservation.EN_ATTENTE],
  [StatutReservation.TERMINEE]: [],
};

/**
 * Service reservations : coeur du systeme.
 * Regles metier : unicite de la periode par chambre (pas de sur-reservation),
 * coherence des dates, capacite de la chambre, calcul du montant,
 * mise a jour automatique du statut des chambres et planning mensuel.
 */
@Injectable()
export class ReservationsService {
  constructor(
    @InjectRepository(Reservation)
    private readonly repository: Repository<Reservation>,
    @InjectRepository(Chambre)
    private readonly chambres: Repository<Chambre>,
    @InjectRepository(Client)
    private readonly clients: Repository<Client>,
    private readonly chambresService: ChambresService,
    private readonly clientsService: ClientsService,
  ) {}

  // ------------------------------------------------------------------ CRUD

  async findAll(query: FiltreReservationsQueryDto, user?: JwtPayload) {
    const { page = 1, limit = 10, statut, chambreId, clientId, mois } = query;
    const qb = this.repository
      .createQueryBuilder('r')
      .leftJoinAndSelect('r.chambre', 'chambre')
      .leftJoinAndSelect('r.client', 'client')
      .orderBy('r.dateArrivee', 'DESC')
      .addOrderBy('r.id', 'DESC');

    // Portee : un CLIENT ne voit que SES reservations (filtre par email du compte)
    if (user?.role === Role.CLIENT) {
      qb.andWhere('client.email = :emailClient', { emailClient: user.email });
    } else if (clientId) {
      qb.andWhere('client.id = :clientId', { clientId });
    }
    if (statut) qb.andWhere('r.statut = :statut', { statut });
    if (chambreId) qb.andWhere('chambre.id = :chambreId', { chambreId });
    if (mois) {
      const debut = `${mois}-01`;
      const fin = addDays(`${mois}-01`, joursDuMois(mois).length);
      qb.andWhere('r.dateArrivee < :fin AND r.dateDepart > :debut', {
        debut,
        fin,
      });
    }

    const [donnees, total] = await qb
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return {
      donnees: donnees.map((r) => this.avecNuits(r)),
      meta: { total, page, limit, pages: Math.ceil(total / limit) || 1 },
    };
  }

  async findOne(id: number, user?: JwtPayload): Promise<Reservation> {
    const reservation = await this.repository.findOne({
      where: { id },
      relations: { chambre: true, client: true },
    });
    if (!reservation) {
      throw new NotFoundException(`Reservation #${id} introuvable`);
    }
    this.verifierPortee(reservation, user);
    return reservation;
  }

  /** Un CLIENT n'accede qu'a ses propres reservations (portee par email du compte). */
  private verifierPortee(
    reservation: Reservation,
    user?: JwtPayload,
  ): void {
    if (user?.role === Role.CLIENT && reservation.client?.email !== user.email) {
      throw new ForbiddenException(
        'Acces refuse : cette reservation ne vous appartient pas.',
      );
    }
  }

  async create(
    dto: CreateReservationDto,
    user?: JwtPayload,
  ): Promise<Reservation> {
    const chambre = await this.chambresService.findOne(dto.chambreId);
    const client = await this.resoudreClient(dto, user);
    this.verifierReglesMetier(dto, chambre);
    await this.verifierDisponibilite(
      chambre.id,
      dto.dateArrivee,
      dto.dateDepart,
    );

    const reservation = this.repository.create({
      reference: await this.genererReference(),
      chambre,
      client,
      dateArrivee: dto.dateArrivee,
      dateDepart: dto.dateDepart,
      nombrePersonnes: dto.nombrePersonnes,
      statut: dto.statut ?? StatutReservation.EN_ATTENTE,
      montantTotal:
        nombreDeNuits(dto.dateArrivee, dto.dateDepart) * chambre.prixParNuit,
      notes: dto.notes,
    });
    const enregistree = await this.repository.save(reservation);
    await this.chambresService.synchroniserStatuts();
    return this.avecNuits(await this.findOne(enregistree.id));
  }

  /**
   * Determine la fiche client a laquelle rattacher la reservation.
   * Un CLIENT reserve pour lui-meme : on retrouve (ou on cree) sa fiche
   * a partir de l'email de son compte. Le personnel doit fournir un clientId.
   */
  private async resoudreClient(
    dto: CreateReservationDto,
    user?: JwtPayload,
  ): Promise<Client> {
    if (user?.role === Role.CLIENT) {
      return this.clientsService.trouverOuCreerParEmail(user.email, user.nom);
    }
    if (!dto.clientId) {
      throw new BadRequestException('Le client est obligatoire');
    }
    return this.clientsService.findOne(dto.clientId);
  }

  async update(
    id: number,
    dto: UpdateReservationDto,
    user?: JwtPayload,
  ): Promise<Reservation> {
    const reservation = await this.findOne(id, user);

    // Un CLIENT ne peut ni changer de client, ni de chambre, ni de statut ici
    // (il annule via PATCH /statut). On neutralise ces champs pour lui.
    const estClient = user?.role === Role.CLIENT;
    if (estClient) {
      delete dto.clientId;
      delete dto.chambreId;
      delete dto.statut;
    }

    const chambre =
      dto.chambreId && dto.chambreId !== reservation.chambre.id
        ? await this.chambresService.findOne(dto.chambreId)
        : reservation.chambre;
    const client =
      dto.clientId && dto.clientId !== reservation.client.id
        ? await this.clientsService.findOne(dto.clientId)
        : reservation.client;

    const dateArrivee = dto.dateArrivee ?? reservation.dateArrivee;
    const dateDepart = dto.dateDepart ?? reservation.dateDepart;
    const nombrePersonnes = dto.nombrePersonnes ?? reservation.nombrePersonnes;

    this.verifierReglesMetier(
      {
        ...dto,
        dateArrivee,
        dateDepart,
        nombrePersonnes,
        chambreId: chambre.id,
        clientId: client.id,
      },
      chambre,
      true,
    );
    await this.verifierDisponibilite(chambre.id, dateArrivee, dateDepart, id);

    reservation.chambre = chambre;
    reservation.client = client;
    reservation.dateArrivee = dateArrivee;
    reservation.dateDepart = dateDepart;
    reservation.nombrePersonnes = nombrePersonnes;
    reservation.montantTotal =
      nombreDeNuits(dateArrivee, dateDepart) * chambre.prixParNuit;
    if (dto.notes !== undefined) reservation.notes = dto.notes;
    if (dto.statut) {
      this.verifierTransition(reservation.statut, dto.statut);
      reservation.statut = dto.statut;
    }

    const enregistree = await this.repository.save(reservation);
    await this.chambresService.synchroniserStatuts();
    return this.avecNuits(await this.findOne(enregistree.id));
  }

  /** PATCH /reservations/:id/statut — confirme, annule, check-in/out ou cloture */
  async updateStatut(
    id: number,
    statut: StatutReservation,
    user?: JwtPayload,
  ) {
    const reservation = await this.findOne(id, user);

    // Un CLIENT ne peut que ANNULER sa propre reservation (pas de check-in/out).
    if (user?.role === Role.CLIENT && statut !== StatutReservation.ANNULEE) {
      throw new ForbiddenException(
        'Un client peut uniquement annuler sa reservation.',
      );
    }

    this.verifierTransition(reservation.statut, statut);
    reservation.statut = statut;
    const enregistree = await this.repository.save(reservation);
    await this.chambresService.synchroniserStatuts();
    return this.avecNuits(await this.findOne(enregistree.id));
  }

  async remove(id: number) {
    const reservation = await this.findOne(id);
    if (reservation.statut === StatutReservation.TERMINEE) {
      throw new BadRequestException(
        'Une reservation terminee ne peut pas etre supprimee (historique comptable).',
      );
    }
    await this.repository.remove(reservation);
    await this.chambresService.synchroniserStatuts();
    return { supprime: true, id, reference: reservation.reference };
  }

  // ------------------------------------------------------- Planning mensuel

  /**
   * Planning de reservations pour un mois : pour chaque chambre, l'occupation
   * jour par jour. Sert a la vue calendrier du frontend.
   */
  async planning(mois: string) {
    if (!/^\d{4}-\d{2}$/.test(mois)) {
      throw new BadRequestException('Le mois doit etre au format YYYY-MM');
    }
    const jours = joursDuMois(mois);
    const debut = jours[0];
    const fin = addDays(debut, jours.length);

    const [chambres, reservations] = await Promise.all([
      this.chambres.find({ order: { etage: 'ASC', numero: 'ASC' } }),
      this.repository.find({
        where: [
          { dateArrivee: LessThan(fin), dateDepart: MoreThanOrEqual(debut) },
        ],
        relations: { chambre: true, client: true },
        order: { dateArrivee: 'ASC' },
      }),
    ]);
    const actives = reservations.filter((r) =>
      STATUTS_BLOQUANTS.includes(r.statut),
    );

    const lignes = chambres.map((chambre) => {
      const occupation: Record<
        string,
        { reservationId: number; reference: string; statut: StatutReservation; client: string } | null
      > = {};
      let nuitsOccupees = 0;
      for (const jour of jours) {
        const r = actives.find(
          (x) =>
            x.chambre?.id === chambre.id &&
            x.dateArrivee <= jour &&
            x.dateDepart > jour,
        );
        occupation[jour] = r
          ? {
              reservationId: r.id,
              reference: r.reference,
              statut: r.statut,
              client: `${r.client?.prenom ?? ''} ${r.client?.nom ?? ''}`.trim(),
            }
          : null;
        if (r) nuitsOccupees++;
      }
      return {
        chambreId: chambre.id,
        numero: chambre.numero,
        type: chambre.type,
        etage: chambre.etage,
        statut: chambre.statut,
        occupation,
        tauxOccupation: Math.round((nuitsOccupees / jours.length) * 100),
      };
    });

    const capaciteTotale = chambres.length * jours.length;
    const nuitsVendues = lignes.reduce(
      (somme, l) =>
        somme + Object.values(l.occupation).filter(Boolean).length,
      0,
    );

    return {
      donnees: lignes,
      meta: {
        mois,
        jours,
        nombreChambres: chambres.length,
        reservationsDuMois: reservations.length,
        tauxOccupation: capaciteTotale
          ? Math.round((nuitsVendues / capaciteTotale) * 100)
          : 0,
      },
    };
  }

  // --------------------------------------------------------- Regles metier

  private verifierReglesMetier(
    dto: CreateReservationDto | UpdateReservationDto,
    chambre: Chambre,
    modification = false,
  ): void {
    const { dateArrivee, dateDepart, nombrePersonnes } = dto;

    if (dateDepart <= dateArrivee) {
      throw new BadRequestException(
        'La date de depart doit etre strictement posterieure a la date d arrivee',
      );
    }
    if (!modification && dateArrivee < todayIso()) {
      throw new BadRequestException(
        `La date d arrivee ne peut pas etre anterieure a aujourd'hui (${todayIso()})`,
      );
    }
    if (nombrePersonnes > chambre.capacite) {
      throw new BadRequestException(
        `La chambre ${chambre.numero} accueille au maximum ${chambre.capacite} personne(s), ${nombrePersonnes} demandees.`,
      );
    }
    if (
      chambre.statut === StatutChambre.MAINTENANCE &&
      dto.statut !== StatutReservation.ANNULEE
    ) {
      throw new ConflictException(
        `La chambre ${chambre.numero} est en maintenance : reservation impossible.`,
      );
    }
  }

  /** Bloque toute sur-reservation d'une meme chambre sur une periode donnee */
  private async verifierDisponibilite(
    chambreId: number,
    dateArrivee: string,
    dateDepart: string,
    exclusion?: number,
  ): Promise<void> {
    const conflits = await this.repository.find({
      where: {
        chambre: { id: chambreId },
        statut: In(STATUTS_BLOQUANTS),
        dateArrivee: LessThan(dateDepart),
        dateDepart: MoreThanOrEqual(dateArrivee),
      },
      relations: { client: true },
    });
    const conflit = conflits.find((c) => c.id !== exclusion);
    if (conflit) {
      throw new ConflictException(
        `Chambre deja reservee du ${conflit.dateArrivee} au ${conflit.dateDepart} (${conflit.reference} - ${conflit.client?.prenom} ${conflit.client?.nom}). Choisissez une autre periode ou une autre chambre.`,
      );
    }
  }

  private verifierTransition(
    actuel: StatutReservation,
    cible: StatutReservation,
  ): void {
    if (actuel === cible) return;
    if (!TRANSITIONS[actuel]?.includes(cible)) {
      throw new BadRequestException(
        `Transition impossible : ${actuel} -> ${cible}.`,
      );
    }
  }

  private async genererReference(): Promise<string> {
    const total = await this.repository.count();
    for (let i = total + 1; i < total + 500; i++) {
      const reference = `RES-${String(i).padStart(4, '0')}`;
      const existe = await this.repository.findOne({ where: { reference } });
      if (!existe) return reference;
    }
    return `RES-${Date.now()}`;
  }

  /** Ajoute la duree du sejour a chaque reservation renvoyee */
  private avecNuits(reservation: Reservation) {
    return {
      ...reservation,
      nuits: nombreDeNuits(reservation.dateArrivee, reservation.dateDepart),
    };
  }
}
