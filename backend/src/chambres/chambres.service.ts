import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, LessThan, MoreThan, Repository } from 'typeorm';
import {
  STATUTS_BLOQUANTS,
  StatutChambre,
  StatutReservation,
} from '../common/enums';
import {
  nombreDeNuits,
  todayIso,
} from '../common/utils/date.utils';
import { Chambre } from '../entities/chambre.entity';
import { Reservation } from '../entities/reservation.entity';
import {
  CreateChambreDto,
  FiltreChambresQueryDto,
  UpdateChambreDto,
} from './dto/create-chambre.dto';
import { DisponibiliteQueryDto } from './dto/disponibilite-query.dto';

export interface ChambreAvecDisponibilite extends Chambre {
  disponible: boolean;
  motif?: string;
  conflit?: Partial<Reservation> | null;
  nuits?: number;
  prixSejour?: number;
}

/**
 * Service chambres : catalogue de l'hotel, recherche de disponibilites
 * et mise a jour automatique du statut d'occupation.
 */
@Injectable()
export class ChambresService {
  constructor(
    @InjectRepository(Chambre)
    private readonly repository: Repository<Chambre>,
    @InjectRepository(Reservation)
    private readonly reservations: Repository<Reservation>,
  ) {}

  async findAll(query: FiltreChambresQueryDto) {
    const { page = 1, limit = 10, type, statut, recherche } = query;
    const qb = this.repository
      .createQueryBuilder('c')
      .orderBy('c.etage', 'ASC')
      .addOrderBy('c.numero', 'ASC');

    if (type) qb.andWhere('c.type = :type', { type });
    if (statut) qb.andWhere('c.statut = :statut', { statut });
    if (recherche) {
      qb.andWhere('(c.numero LIKE :rech OR c.description LIKE :rech)', {
        rech: `%${recherche}%`,
      });
    }

    const [donnees, total] = await qb
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return {
      donnees,
      meta: { total, page, limit, pages: Math.ceil(total / limit) || 1 },
    };
  }

  async findOne(id: number): Promise<Chambre> {
    const chambre = await this.repository.findOne({ where: { id } });
    if (!chambre) throw new NotFoundException(`Chambre #${id} introuvable`);
    return chambre;
  }

  /** Chambre + ses reservations, triees par date d'arrivee */
  async findOneAvecReservations(id: number) {
    const chambre = await this.findOne(id);
    const reservations = await this.reservations.find({
      where: { chambre: { id } },
      order: { dateArrivee: 'DESC' },
      relations: { client: true },
    });
    return { ...chambre, reservations };
  }

  async create(dto: CreateChambreDto): Promise<Chambre> {
    const existe = await this.repository.findOne({
      where: { numero: dto.numero },
    });
    if (existe) {
      throw new ConflictException(
        `La chambre numero ${dto.numero} existe deja`,
      );
    }
    return this.repository.save(
      this.repository.create({ ...dto, statut: dto.statut ?? StatutChambre.LIBRE }),
    );
  }

  async update(id: number, dto: UpdateChambreDto): Promise<Chambre> {
    const chambre = await this.findOne(id);
    if (dto.numero && dto.numero !== chambre.numero) {
      const existe = await this.repository.findOne({
        where: { numero: dto.numero },
      });
      if (existe) {
        throw new ConflictException(
          `La chambre numero ${dto.numero} existe deja`,
        );
      }
    }
    Object.assign(chambre, dto);
    return this.repository.save(chambre);
  }

  async remove(id: number) {
    const chambre = await this.findOne(id);
    const actives = await this.reservations.count({
      where: {
        chambre: { id },
        statut: In([
          StatutReservation.CONFIRMEE,
          StatutReservation.EN_ATTENTE,
        ]),
        dateDepart: MoreThan(todayIso()),
      },
    });
    if (actives > 0) {
      throw new ConflictException(
        `Impossible de supprimer la chambre ${chambre.numero} : ${actives} reservation(s) active(s) en cours ou a venir.`,
      );
    }
    await this.repository.remove(chambre);
    return { supprime: true, id, numero: chambre.numero };
  }

  /**
   * Gestion des disponibilites : pour une periode donnee, retourne chaque chambre
   * avec un booleen "disponible" et la reservation qui bloque eventuellement.
   * Deux periodes se chevauchent si : arrivee < departExistant ET depart > arriveeExistante
   */
  async trouverDisponibilites(query: DisponibiliteQueryDto) {
    const { arrivee, depart, personnes, type } = query;
    if (depart <= arrivee) {
      throw new BadRequestException(
        'La date de depart doit etre strictement posterieure a la date d arrivee',
      );
    }
    const nuits = nombreDeNuits(arrivee, depart);

    const qb = this.repository
      .createQueryBuilder('c')
      .orderBy('c.prixParNuit', 'ASC');
    if (type) qb.andWhere('c.type = :type', { type });
    if (personnes) qb.andWhere('c.capacite >= :personnes', { personnes });
    const chambres = await qb.getMany();

    // Reservations bloquantes qui chevauchent la periode demandee
    const conflits = await this.reservations.find({
      where: {
        statut: In(STATUTS_BLOQUANTS),
        dateArrivee: LessThan(depart),
        dateDepart: MoreThan(arrivee),
      },
      relations: { chambre: true },
    });

    const donnees: ChambreAvecDisponibilite[] = chambres.map((chambre) => {
      if (chambre.statut === StatutChambre.MAINTENANCE) {
        return {
          ...chambre,
          disponible: false,
          motif: 'Chambre en maintenance',
          conflit: null,
          nuits,
          prixSejour: nuits * chambre.prixParNuit,
        };
      }
      const conflit =
        conflits.find((r) => r.chambre?.id === chambre.id) ?? null;
      return {
        ...chambre,
        disponible: !conflit,
        motif: conflit
          ? `Reserve du ${conflit.dateArrivee} au ${conflit.dateDepart} (${conflit.reference})`
          : undefined,
        conflit: conflit
          ? {
              id: conflit.id,
              reference: conflit.reference,
              dateArrivee: conflit.dateArrivee,
              dateDepart: conflit.dateDepart,
              statut: conflit.statut,
            }
          : null,
        nuits,
        prixSejour: nuits * chambre.prixParNuit,
      };
    });

    return {
      donnees,
      meta: {
        arrivee,
        depart,
        nuits,
        personnes: personnes ?? null,
        total: donnees.length,
        disponibles: donnees.filter((c) => c.disponible).length,
      },
    };
  }

  /**
   * Recalcule le statut d'occupation des chambres pour la date du jour.
   * Appelle apres chaque creation / modification / annulation de reservation.
   */
  async synchroniserStatuts(date = todayIso()): Promise<number> {
    const chambres = await this.repository.find();
    const actives = await this.reservations.find({
      where: { statut: In(STATUTS_BLOQUANTS) },
      relations: { chambre: true },
    });
    let maj = 0;
    for (const chambre of chambres) {
      if (chambre.statut === StatutChambre.MAINTENANCE) continue;
      const occupee = actives.some(
        (r) =>
          r.chambre?.id === chambre.id &&
          r.dateArrivee <= date &&
          r.dateDepart > date,
      );
      const nouveau = occupee ? StatutChambre.OCCUPEE : StatutChambre.LIBRE;
      if (chambre.statut !== nouveau) {
        chambre.statut = nouveau;
        await this.repository.save(chambre);
        maj++;
      }
    }
    return maj;
  }
}
