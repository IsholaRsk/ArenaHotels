import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common';

/**
 * Pipe personnalise : valide et transforme un parametre d'URL en entier positif.
 * Utilise sur les routes /chambres/:id, /clients/:id, /reservations/:id
 */
@Injectable()
export class ParseIdPipe implements PipeTransform<string, number> {
  transform(value: string): number {
    const id = Number(value);
    if (!Number.isInteger(id) || id <= 0) {
      throw new BadRequestException(
        `Identifiant invalide : "${value}". Un identifiant doit etre un entier positif.`,
      );
    }
    return id;
  }
}
