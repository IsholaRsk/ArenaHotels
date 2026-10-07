import { Global, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SeedService } from './seed.service';
import { buildTypeOrmOptions, ENTITES } from './typeorm.config';

/**
 * Module base de donnees (global) : connexion TypeORM + jeu de donnees de demonstration.
 * forFeature() expose les repositories de toutes les entites a l'ensemble de l'application.
 */
@Global()
@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      useFactory: () => buildTypeOrmOptions(),
    }),
    TypeOrmModule.forFeature(ENTITES),
  ],
  providers: [SeedService],
  exports: [TypeOrmModule, SeedService],
})
export class DatabaseModule {}
