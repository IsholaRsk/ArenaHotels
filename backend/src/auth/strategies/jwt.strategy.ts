import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Role } from '../../common/enums';

export interface JwtPayload {
  sub: number;
  email: string;
  nom: string;
  role: Role;
}

/**
 * Strategie JWT : verifie la signature et l'expiration du token
 * puis place l'utilisateur dans la requete (request.user).
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(config: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey:
        config.get<string>('JWT_SECRET') || 'arena-hotels-cle-de-developpement',
    });
  }

  /** Retourne l'objet qui sera disponible via @CurrentUser() */
  async validate(payload: JwtPayload) {
    return {
      sub: payload.sub,
      email: payload.email,
      nom: payload.nom,
      role: payload.role,
    };
  }
}
