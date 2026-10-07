import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  Length,
  MaxLength,
} from 'class-validator';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';

/** Donnees attendues pour creer un client (POST /clients) */
export class CreateClientDto {
  @IsString()
  @Length(2, 80, { message: 'Le nom doit contenir entre 2 et 80 caracteres' })
  @IsNotEmpty({ message: 'Le nom est obligatoire' })
  nom: string;

  @IsString()
  @Length(2, 80, { message: 'Le prenom doit contenir entre 2 et 80 caracteres' })
  @IsNotEmpty({ message: 'Le prenom est obligatoire' })
  prenom: string;

  @IsEmail({}, { message: "L'adresse email n'est pas valide" })
  @IsNotEmpty({ message: "L'email est obligatoire" })
  email: string;

  @IsOptional()
  @IsString()
  @Length(7, 30, { message: 'Le telephone doit contenir entre 7 et 30 caracteres' })
  telephone?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  adresse?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  ville?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  pays?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;
}

/** Mise a jour partielle d'une fiche client (tous les champs optionnels) */
export class UpdateClientDto {
  @IsOptional()
  @IsString()
  @Length(2, 80)
  nom?: string;

  @IsOptional()
  @IsString()
  @Length(2, 80)
  prenom?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  @Length(7, 30)
  telephone?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  adresse?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  ville?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  pays?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;
}

/** Filtres de la liste des clients (GET /clients) */
export class FiltreClientsQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsString()
  @MaxLength(60)
  recherche?: string;
}
