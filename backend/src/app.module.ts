import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthController } from './auth/auth.controller';
import { AuthModule } from './auth/auth.module';
import { ChambresController } from './chambres/chambres.controller';
import { ChambresModule } from './chambres/chambres.module';
import { ClientsController } from './clients/clients.controller';
import { ClientsModule } from './clients/clients.module';
import { LoggerMiddleware } from './common/middleware/logger.middleware';
import { DatabaseModule } from './database/database.module';
import { ReservationsController } from './reservations/reservations.controller';
import { ReservationsModule } from './reservations/reservations.module';
import { StatsController } from './stats/stats.controller';
import { StatsModule } from './stats/stats.module';
import { UtilisateursController } from './utilisateurs/utilisateurs.controller';
import { UtilisateursModule } from './utilisateurs/utilisateurs.module';

/**
 * Module racine : un module par fonctionnalite (auth, chambres, clients,
 * reservations, statistiques) + la base de donnees et la configuration.
 */
@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    DatabaseModule,
    AuthModule,
    UtilisateursModule,
    ChambresModule,
    ClientsModule,
    ReservationsModule,
    StatsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule implements NestModule {
  /**
   * Activation du middleware de journalisation sur tous les controleurs.
   * Passer par les classes (et non par '*') garantit le meme comportement
   * avec Express 4 et Express 5 (NestJS 11).
   */
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggerMiddleware).forRoutes(
      AppController,
      AuthController,
      UtilisateursController,
      ChambresController,
      ClientsController,
      ReservationsController,
      StatsController,
    );
  }
}
