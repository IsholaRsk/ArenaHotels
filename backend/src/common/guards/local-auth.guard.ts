import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/** Verifie email + mot de passe via la LocalStrategy */
@Injectable()
export class LocalAuthGuard extends AuthGuard('local') {}
