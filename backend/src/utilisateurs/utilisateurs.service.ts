import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcryptjs';
import { Repository } from 'typeorm';
import { Role } from '../common/enums';
import { Utilisateur } from '../entities/utilisateur.entity';
import {
  CreateUtilisateurDto,
  UpdateUtilisateurDto,
} from './dto/create-utilisateur.dto';

/**
 * Service utilisateurs : toute la logique metier liee aux comptes
 * (hachage du mot de passe, unicite de l'email, pagination...).
 */
@Injectable()
export class UtilisateursService {
  constructor(
    @InjectRepository(Utilisateur)
    private readonly repository: Repository<Utilisateur>,
  ) {}

  async create(dto: CreateUtilisateurDto, roleForce?: Role): Promise<Utilisateur> {
    const email = dto.email.trim().toLowerCase();
    if (await this.repository.findOne({ where: { email } })) {
      throw new ConflictException(`Un compte existe deja avec l'email ${email}`);
    }
    const utilisateur = this.repository.create({
      ...dto,
      email,
      role: roleForce ?? dto.role ?? Role.CLIENT,
      motDePasse: await bcrypt.hash(dto.motDePasse, 10),
    });
    return this.repository.save(utilisateur);
  }

  async findAll(page = 1, limit = 10): Promise<{
    donnees: Utilisateur[];
    meta: { total: number; page: number; limit: number; pages: number };
  }> {
    const [donnees, total] = await this.repository.findAndCount({
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return {
      donnees,
      meta: { total, page, limit, pages: Math.ceil(total / limit) || 1 },
    };
  }

  async findOne(id: number): Promise<Utilisateur> {
    const utilisateur = await this.repository.findOne({ where: { id } });
    if (!utilisateur) {
      throw new NotFoundException(`Utilisateur #${id} introuvable`);
    }
    return utilisateur;
  }

  findOneByEmail(email: string): Promise<Utilisateur | null> {
    return this.repository.findOne({ where: { email: email.toLowerCase() } });
  }

  /**
   * Lecture avec le mot de passe : reservee a l'authentification.
   * La colonne est marquee "select: false" dans l'entite, il faut donc
   * la demander explicitement (on utilise le nom de propriete de l'entite).
   */
  findOneWithPassword(email: string): Promise<Utilisateur | null> {
    return this.repository
      .createQueryBuilder('u')
      .addSelect('u.motDePasse')
      .where('LOWER(u.email) = :email', { email: email.toLowerCase() })
      .getOne();
  }

  async update(
    id: number,
    dto: UpdateUtilisateurDto,
  ): Promise<Utilisateur> {
    const utilisateur = await this.findOne(id);
    if (dto.email) utilisateur.email = dto.email.trim().toLowerCase();
    if (dto.nom !== undefined) utilisateur.nom = dto.nom;
    if (dto.telephone !== undefined) utilisateur.telephone = dto.telephone;
    if (dto.role !== undefined) utilisateur.role = dto.role;
    if (dto.actif !== undefined) utilisateur.actif = dto.actif;
    if (dto.motDePasse) {
      utilisateur.motDePasse = await bcrypt.hash(dto.motDePasse, 10);
    }
    return this.repository.save(utilisateur);
  }

  async remove(id: number): Promise<{ supprime: boolean; id: number }> {
    const utilisateur = await this.findOne(id);
    await this.repository.remove(utilisateur);
    return { supprime: true, id };
  }
}
