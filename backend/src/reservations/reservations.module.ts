import { Module } from '@nestjs/common';
import { ChambresModule } from '../chambres/chambres.module';
import { ClientsModule } from '../clients/clients.module';
import { ReservationsController } from './reservations.controller';
import { ReservationsService } from './reservations.service';

@Module({
  imports: [ChambresModule, ClientsModule],
  controllers: [ReservationsController],
  providers: [ReservationsService],
  exports: [ReservationsService],
})
export class ReservationsModule {}
