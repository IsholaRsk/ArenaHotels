import { PartialType } from '@nestjs/mapped-types';
import { Type } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Length,
  Matches,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { StatutChambre, TypeChambre } from '../../common/enums';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';

/** Donnees attendues pour creer une chambre (POST /chambres) */
export class CreateChambreDto {
  @IsString()
  @Length(1, 20, { message: 'Le numero doit contenir entre 1 et 20 caracteres' })
  @Matches(/^[A-Za-z0-9-]+$/, {
    message: 'Le numero ne peut contenir que des lettres, chiffres et tirets',
  })
  @IsNotEmpty({ message: 'Le numero de chambre est obligatoire' })
  numero: string;

  @IsEnum(TypeChambre, {
    message: `Type invalide. Valeurs autorisees : ${Object.values(TypeChambre).join(', ')}`,
  })
  type: TypeChambre;

  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 0 }, { message: 'Le prix doit etre un nombre' })
  @Min(1000, { message: 'Le prix par nuit doit etre d au moins 1000 FCFA' })
  prixParNuit: number;

  @Type(() => Number)
  @IsInt({ message: 'La capacite doit etre un entier' })
  @Min(1, { message: 'La capacite doit etre d au moins 1 personne' })
  @Max(12, { message: 'La capacite ne peut pas depasser 12 personnes' })
  capacite: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(50)
  etage?: number;

  @IsOptional()
  @IsString()
  @MaxLength(1000, { message: 'La description ne doit pas depasser 1000 caracteres' })
  description?: string;

  @IsOptional()
  @IsEnum(StatutChambre, { message: 'Statut invalide' })
  statut?: StatutChambre;
}

export class UpdateChambreDto extends PartialType(CreateChambreDto) {}

/** Filtres de la liste des chambres (GET /chambres) */
export class FiltreChambresQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsEnum(TypeChambre)
  type?: TypeChambre;

  @IsOptional()
  @IsEnum(StatutChambre)
  statut?: StatutChambre;

  @IsOptional()
  @IsString()
  @MaxLength(60)
  recherche?: string;
}
