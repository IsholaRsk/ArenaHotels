import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Role } from '../common/enums';

/**
 * Entite = table "utilisateur" dans la base de donnees.
 * (DTO != Entite : le DTO valide les donnees entrantes, l'entite decrit le stockage)
 */
@Entity('utilisateurs')
export class Utilisateur {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 120 })
  nom: string;

  @Column({ unique: true, length: 160 })
  email: string;

  /** Jamais renvoye par les requetes par defaut (select: false) */
  @Column({ name: 'mot_de_passe', select: false })
  motDePasse: string;

  @Column({ type: 'varchar', length: 20, default: Role.CLIENT })
  role: Role;

  @Column({ length: 30, nullable: true })
  telephone: string;

  @Column({ default: true })
  actif: boolean;

  @CreateDateColumn({ name: 'cree_le' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'maj_le' })
  updatedAt: Date;
}
