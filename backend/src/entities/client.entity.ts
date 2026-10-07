import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Reservation } from './reservation.entity';

/**
 * Entite "client" : la personne qui reserve une chambre.
 */
@Entity('clients')
export class Client {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 80 })
  nom: string;

  @Column({ length: 80 })
  prenom: string;

  @Column({ unique: true, length: 160 })
  email: string;

  @Column({ length: 30, nullable: true })
  telephone: string;

  @Column({ type: 'text', nullable: true })
  adresse: string;

  @Column({ length: 80, nullable: true })
  ville: string;

  @Column({ length: 80, nullable: true })
  pays: string;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @OneToMany(() => Reservation, (reservation) => reservation.client)
  reservations: Reservation[];

  @CreateDateColumn({ name: 'cree_le' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'maj_le' })
  updatedAt: Date;
}
