import {
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService, JwtSignOptions } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { Role } from '../common/enums';
import { Utilisateur } from '../entities/utilisateur.entity';
import { UtilisateursService } from '../utilisateurs/utilisateurs.service';
import { RegisterDto } from './dto/register.dto';
import { JwtPayload } from './strategies/jwt.strategy';

export interface ReponseConnexion {
  access_token: string;
  type: string;
  expireDans: string;
  utilisateur: {
    id: number;
    nom: string;
    email: string;
    role: Role;
  };
}

/**
 * Service d'authentification : validation des identifiants,
 * inscription et generation du token JWT.
 */
@Injectable()
export class AuthService {
  private readonly expiration = process.env.JWT_EXPIRES_IN || '7d';

  constructor(
    private readonly utilisateurs: UtilisateursService,
    private readonly jwt: JwtService,
  ) {}

  /** Verifie email + mot de passe (utilisee par la LocalStrategy) */
  async validateUser(
    email: string,
    motDePasse: string,
  ): Promise<Utilisateur | null> {
    const utilisateur = await this.utilisateurs.findOneWithPassword(email);
    if (!utilisateur) return null;

    const valide = await bcrypt.compare(motDePasse, utilisateur.motDePasse);
    if (!valide) return null;

    if (utilisateur.actif === false) {
      throw new ForbiddenException(
        'Ce compte est desactive. Contactez un administrateur.',
      );
    }
    return utilisateur;
  }

  /** Genere le JWT renvoye au frontend React */
  login(utilisateur: Utilisateur): ReponseConnexion {
    const payload: JwtPayload = {
      sub: utilisateur.id,
      email: utilisateur.email,
      nom: utilisateur.nom,
      role: utilisateur.role,
    };
    return {
      access_token: this.jwt.sign(payload, {
        expiresIn: this.expiration as JwtSignOptions['expiresIn'],
      }),
      type: 'Bearer',
      expireDans: this.expiration,
      utilisateur: {
        id: utilisateur.id,
        nom: utilisateur.nom,
        email: utilisateur.email,
        role: utilisateur.role,
      },
    };
  }

  /**
   * Inscription publique : le role est force a CLIENT.
   * Un administrateur passe par POST /utilisateurs pour creer un membre du personnel.
   */
  async register(dto: RegisterDto): Promise<ReponseConnexion> {
    const utilisateur = await this.utilisateurs.create(dto, Role.CLIENT);
    return this.login(utilisateur);
  }

  /** Verifie qu'un token est toujours valide (route GET /auth/profil) */
  async profil(id: number): Promise<Utilisateur> {
    const utilisateur = await this.utilisateurs.findOne(id);
    if (!utilisateur) throw new UnauthorizedException('Session invalide');
    return utilisateur;
  }
}
