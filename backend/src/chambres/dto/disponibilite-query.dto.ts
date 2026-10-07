import { Type } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  Matches,
  Max,
  Min,
} from 'class-validator';
import { TypeChambre } from '../../common/enums';
import { DATE_ISO_REGEX } from '../../common/utils/date.utils';

/**
 * Parametres de la recherche de disponibilites :
 * GET /chambres/disponibilites?arrivee=2026-10-10&depart=2026-10-14&personnes=2
 */
export class DisponibiliteQueryDto {
  @Matches(DATE_ISO_REGEX, {
    message: "arrivee doit etre au format YYYY-MM-DD",
  })
  @IsNotEmpty({ message: 'La date d arrivee est obligatoire' })
  arrivee: string;

  @Matches(DATE_ISO_REGEX, {
    message: 'depart doit etre au format YYYY-MM-DD',
  })
  @IsNotEmpty({ message: 'La date de depart est obligatoire' })
  depart: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'personnes doit etre un entier' })
  @Min(1)
  @Max(12)
  personnes?: number;

  @IsOptional()
  @IsEnum(TypeChambre, { message: 'Type de chambre invalide' })
  type?: TypeChambre;
}
