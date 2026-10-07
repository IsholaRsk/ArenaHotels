import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common';
import { isValidIsoDate } from '../utils/date.utils';

/**
 * Pipe personnalise : verifie qu'un parametre de requete est une date ISO (YYYY-MM-DD).
 */
@Injectable()
export class ParseIsoDatePipe implements PipeTransform<string, string> {
  constructor(private readonly obligatoire = false) {}

  transform(value: string): string {
    if (value === undefined || value === null || value === '') {
      if (this.obligatoire) {
        throw new BadRequestException('Date obligatoire au format YYYY-MM-DD.');
      }
      return value;
    }
    if (!isValidIsoDate(value)) {
      throw new BadRequestException(
        `Date invalide : "${value}". Format attendu : YYYY-MM-DD.`,
      );
    }
    return value;
  }
}
