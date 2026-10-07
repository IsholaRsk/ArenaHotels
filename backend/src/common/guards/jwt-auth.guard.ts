import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/** Verifie le JWT envoye dans le header Authorization: Bearer <token> */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}
