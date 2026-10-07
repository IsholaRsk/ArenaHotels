import { Injectable, Logger, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';

/**
 * Middleware : s'execute AVANT les controleurs.
 * Ici il journalise chaque requete entrante (chapitre "Middleware" du cours).
 */
@Injectable()
export class LoggerMiddleware implements NestMiddleware {
  private readonly logger = new Logger('Requete');

  use(req: Request, res: Response, next: NextFunction): void {
    const { method, originalUrl, ip } = req;
    const agent = req.get('user-agent') ?? '';
    this.logger.log(`-> ${method} ${originalUrl} [${ip}] ${agent}`);
    next();
  }
}
