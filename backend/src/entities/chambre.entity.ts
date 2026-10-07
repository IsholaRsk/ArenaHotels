import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { StatutChambre, TypeChambre } from '../common/enums';
import { Reservation } from './reservation.entity';

/**
 * Entite "chambre" : le catalogue de l'hotel.
 */
@Entity('chambres')
export class Chambre {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true, length: 20 })
  numero: string;

  @Column({ type: 'varchar', length: 20, default: TypeChambre.SIMPLE })
  type: TypeChambre;

  @Column({ name: 'prix_par_nuit', type: 'float' })
  prixParNuit: number;

  @Column({ type: 'int', default: 2 })
  capacite: number;

  @Column({ type: 'int', default: 1 })
  etage: number;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'varchar', length: 20, default: StatutChambre.LIBRE })
  statut: StatutChambre;

  @OneToMany(() => Reservation, (reservation) => reservation.chambre)
  reservations: Reservation[];

  @CreateDateColumn({ name: 'cree_le' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'maj_le' })
  updatedAt: Date;
}
