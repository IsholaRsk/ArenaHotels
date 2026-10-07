import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

/** Donnees attendues pour la connexion (POST /auth/login) */
export class LoginDto {
  @IsEmail({}, { message: "L'adresse email n'est pas valide" })
  @IsNotEmpty({ message: "L'email est obligatoire" })
  email: string;

  @IsString({ message: 'Le mot de passe doit etre une chaine de caracteres' })
  @IsNotEmpty({ message: 'Le mot de passe est obligatoire' })
  motDePasse: string;
}
