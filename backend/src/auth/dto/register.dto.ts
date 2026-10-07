import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  Length,
  MinLength,
} from 'class-validator';
import { Role } from '../../common/enums';

/** Donnees attendues pour l'inscription (POST /auth/register) */
export class RegisterDto {
  @IsString({ message: 'Le nom doit etre une chaine de caracteres' })
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
  @IsString()
  @Length(7, 30)
  telephone?: string;

  /**
   * Le role n'est accepte que lorsqu'un administrateur cree un compte.
   * Pour une inscription publique il est force a CLIENT dans le service.
   */
  @IsOptional()
  @IsEnum(Role, { message: 'Role invalide' })
  role?: Role;
}
