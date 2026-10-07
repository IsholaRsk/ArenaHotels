import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-local';
import { AuthService } from '../auth.service';

/**
 * Strategie locale : verifie le couple email / mot de passe.
 * Les champs du body sont nommes "email" et "motDePasse".
 */
@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy, 'local') {
  constructor(private readonly authService: AuthService) {
    super({ usernameField: 'email', passwordField: 'motDePasse' });
  }

  async validate(email: string, motDePasse: string) {
    const utilisateur = await this.authService.validateUser(email, motDePasse);
    if (!utilisateur) {
      throw new UnauthorizedException('Email ou mot de passe incorrect');
    }
    return utilisateur;
  }
}
