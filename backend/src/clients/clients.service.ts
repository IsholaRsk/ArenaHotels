import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MoreThan, Repository } from 'typeorm';
import { StatutReservation } from '../common/enums';
import { todayIso } from '../common/utils/date.utils';
import { Client } from '../entities/client.entity';
import { Reservation } from '../entities/reservation.entity';
import {
  CreateClientDto,
  FiltreClientsQueryDto,
  UpdateClientDto,
} from './dto/create-client.dto';

/** Service clients : fiche des voyageurs et historique de leurs sejours. */
@Injectable()
export class ClientsService {
  constructor(
    @InjectRepository(Client)
    private readonly repository: Repository<Client>,
    @InjectRepository(Reservation)
    private readonly reservations: Repository<Reservation>,
  ) {}

  async findAll(query: FiltreClientsQueryDto) {
    const { page = 1, limit = 10, recherche } = query;
    const qb = this.repository
      .createQueryBuilder('c')
      .orderBy('c.nom', 'ASC')
      .addOrderBy('c.prenom', 'ASC');

    if (recherche) {
      qb.andWhere(
        '(c.nom LIKE :rech OR c.prenom LIKE :rech OR c.email LIKE :rech OR c.telephone LIKE :rech)',
        { rech: `%${recherche}%` },
      );
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

  async findOne(id: number): Promise<Client> {
    const client = await this.repository.findOne({ where: { id } });
    if (!client) throw new NotFoundException(`Client #${id} introuvable`);
    return client;
  }

  /** Fiche client complete : historique des reservations + montant total depense */
  async findOneAvecHistorique(id: number) {
    const client = await this.findOne(id);
    const reservations = await this.reservations.find({
      where: { client: { id } },
      order: { dateArrivee: 'DESC' },
      relations: { chambre: true },
    });
    const montantTotal = reservations.reduce(
      (somme, r) => somme + (r.montantTotal || 0),
      0,
    );
    return {
      ...client,
      reservations,
      statistiques: {
        nombreSejours: reservations.length,
        montantTotal,
        dernierSejour: reservations[0]?.dateArrivee ?? null,
      },
    };
  }

  async create(dto: CreateClientDto): Promise<Client> {
    const email = dto.email.trim().toLowerCase();
    if (await this.repository.findOne({ where: { email } })) {
      throw new ConflictException(`Un client existe deja avec l'email ${email}`);
    }
    return this.repository.save(this.repository.create({ ...dto, email }));
  }

  /**
   * Retrouve la fiche client correspondant a un compte (par email),
   * ou la cree a la volee. Utilise lorsqu'un client finalise une reservation :
   * il reserve pour lui-meme sans avoir a ressaisir ses informations.
   */
  async trouverOuCreerParEmail(
    email: string,
    nomComplet: string,
  ): Promise<Client> {
    const emailNormalise = email.trim().toLowerCase();
    const existant = await this.repository.findOne({
      where: { email: emailNormalise },
    });
    if (existant) return existant;

    const parties = (nomComplet ?? '').trim().split(/\s+/).filter(Boolean);
    const prenom = parties[0] ?? 'Client';
    const nom = parties.slice(1).join(' ') || prenom;
    return this.repository.save(
      this.repository.create({ nom, prenom, email: emailNormalise }),
    );
  }

  async update(id: number, dto: UpdateClientDto): Promise<Client> {
    const client = await this.findOne(id);
    if (dto.email) {
      const email = dto.email.trim().toLowerCase();
      if (email !== client.email) {
        const existe = await this.repository.findOne({ where: { email } });
        if (existe) {
          throw new ConflictException(`Un client existe deja avec l'email ${email}`);
        }
        client.email = email;
      }
    }
    Object.assign(client, dto);
    return this.repository.save(client);
  }

  async remove(id: number) {
    const client = await this.findOne(id);
    const actives = await this.reservations.count({
      where: {
        client: { id },
        statut: StatutReservation.CONFIRMEE,
        dateDepart: MoreThan(todayIso()),
      },
    });
    if (actives > 0) {
      throw new ConflictException(
        `Impossible de supprimer ce client : ${actives} reservation(s) confirmee(s) a venir.`,
      );
    }
    await this.repository.remove(client);
    return { supprime: true, id };
  }
}
