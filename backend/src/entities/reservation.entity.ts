import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { StatutReservation } from '../common/enums';
import { Chambre } from './chambre.entity';
import { Client } from './client.entity';

/**
 * Entite "reservation" : croise une chambre, un client et une periode.
 * Les dates sont stockees au format ISO court (YYYY-MM-DD) pour simplifier
 * les comparaisons de plages (gestion des disponibilites).
 */
@Entity('reservations')
export class Reservation {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true, length: 20 })
  reference: string;

  @ManyToOne(() => Chambre, (chambre) => chambre.reservations, {
    eager: true,
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'chambre_id' })
  chambre: Chambre;

  @ManyToOne(() => Client, (client) => client.reservations, {
    eager: true,
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'client_id' })
  client: Client;

  @Column({ name: 'date_arrivee', type: 'varchar', length: 10 })
  dateArrivee: string;

  @Column({ name: 'date_depart', type: 'varchar', length: 10 })
  dateDepart: string;

  @Column({ name: 'nombre_personnes', type: 'int', default: 1 })
  nombrePersonnes: number;

  @Column({ type: 'varchar', length: 20, default: StatutReservation.EN_ATTENTE })
  statut: StatutReservation;

  @Column({ name: 'montant_total', type: 'float', default: 0 })
  montantTotal: number;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @CreateDateColumn({ name: 'cree_le' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'maj_le' })
  updatedAt: Date;
}
