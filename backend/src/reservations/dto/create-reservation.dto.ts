import { PartialType } from '@nestjs/mapped-types';
import { Type } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { StatutReservation } from '../../common/enums';
import { DATE_ISO_REGEX } from '../../common/utils/date.utils';

/** Donnees attendues pour creer une reservation (POST /reservations) */
export class CreateReservationDto {
  @Type(() => Number)
  @IsInt({ message: 'chambreId doit etre un entier' })
  @Min(1)
  @IsNotEmpty({ message: 'La chambre est obligatoire' })
  chambreId: number;

  @Type(() => Number)
  @IsInt({ message: 'clientId doit etre un entier' })
  @Min(1)
  @IsNotEmpty({ message: 'Le client est obligatoire' })
  clientId: number;

  @Matches(DATE_ISO_REGEX, {
    message: "La date d'arrivee doit etre au format YYYY-MM-DD",
  })
  @IsNotEmpty({ message: "La date d'arrivee est obligatoire" })
  dateArrivee: string;

  @Matches(DATE_ISO_REGEX, {
    message: 'La date de depart doit etre au format YYYY-MM-DD',
  })
  @IsNotEmpty({ message: 'La date de depart est obligatoire' })
  dateDepart: string;

  @Type(() => Number)
  @IsInt({ message: 'Le nombre de personnes doit etre un entier' })
  @Min(1, { message: 'Il faut au moins 1 personne' })
  @Max(12, { message: 'Le nombre de personnes ne peut pas depasser 12' })
  nombrePersonnes: number;

  @IsOptional()
  @IsEnum(StatutReservation, {
    message: `Statut invalide. Valeurs autorisees : ${Object.values(StatutReservation).join(', ')}`,
  })
  statut?: StatutReservation;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;
}

export class UpdateReservationDto extends PartialType(CreateReservationDto) {}

/** Changement de statut d'une reservation (PATCH /reservations/:id/statut) */
export class UpdateStatutReservationDto {
  @IsEnum(StatutReservation, { message: 'Statut invalide' })
  @IsNotEmpty({ message: 'Le statut est obligatoire' })
  statut: StatutReservation;
}

/** Filtres de la liste des reservations (GET /reservations) */
export class FiltreReservationsQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsEnum(StatutReservation)
  statut?: StatutReservation;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  chambreId?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  clientId?: number;

  /** Filtre sur un mois complet, ex: 2026-10 */
  @IsOptional()
  @Matches(/^\d{4}-\d{2}$/, { message: 'mois doit etre au format YYYY-MM' })
  mois?: string;
}
