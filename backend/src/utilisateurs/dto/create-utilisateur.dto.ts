import {
  IsBoolean,
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  Length,
  MinLength,
} from 'class-validator';
import { Role } from '../../common/enums';

/** Donnees attendues pour creer un utilisateur (POST /utilisateurs) */
export class CreateUtilisateurDto {
  @IsString()
  @Length(3, 120, { message: 'Le nom doit contenir entre 3 et 120 caracteres' })
  @IsNotEmpty({ message: 'Le nom est obligatoire' })
  nom: string;

  @IsEmail({}, { message: "L'adresse email n'est pas valide" })
  @IsNotEmpty({ message: "L'email est obligatoire" })
  email: string;

  @IsString()
  @MinLength(6, { message: 'Le mot de passe doit contenir au moins 6 caracteres' })
  @IsNotEmpty({ message: 'Le mot de passe est obligatoire' })
  motDePasse: string;

  @IsOptional()
  @IsEnum(Role, { message: 'Role invalide' })
  role?: Role;

  @IsOptional()
  @IsString()
  @Length(7, 30)
  telephone?: string;

  @IsOptional()
  @IsBoolean({ message: 'actif doit etre un booleen' })
  actif?: boolean;
}

/** Mise a jour partielle : tous les champs deviennent optionnels */
/** Mise a jour partielle d'un compte utilisateur (tous les champs optionnels) */
export class UpdateUtilisateurDto {
  @IsOptional()
  @IsString()
  @Length(3, 120)
  nom?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  @MinLength(6)
  motDePasse?: string;

  @IsOptional()
  @IsEnum(Role)
  role?: Role;

  @IsOptional()
  @IsString()
  @Length(7, 30)
  telephone?: string;

  @IsOptional()
  @IsBoolean()
  actif?: boolean;
}
