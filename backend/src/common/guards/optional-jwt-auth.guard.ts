import { ExecutionContext, Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * Garde JWT "optionnelle" : si un token valide est present, l'utilisateur est
 * attache a la requete ; sinon la requete reste publique (aucune erreur).
 * Utilisee sur les routes publiques (ex. detail d'une chambre) pour adapter
 * la reponse selon que le visiteur est authentifie (et son role) ou non.
 */
@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard('jwt') {
  // Ne leve jamais d'erreur d'authentification : renvoie l'utilisateur ou undefined.
  handleRequest<TUser = any>(err: any, user: any): TUser {
    return user as TUser;
  }

  // Evite que Passport rejette la requete quand aucun token n'est fourni.
  canActivate(context: ExecutionContext) {
    return super.canActivate(context);
  }
}
