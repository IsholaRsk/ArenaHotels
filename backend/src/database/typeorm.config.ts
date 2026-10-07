import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { accessSync, constants, existsSync, mkdirSync, readFileSync } from 'fs';
import { dirname, resolve } from 'path';
import { Chambre } from '../entities/chambre.entity';
import { Client } from '../entities/client.entity';
import { Reservation } from '../entities/reservation.entity';
import { Utilisateur } from '../entities/utilisateur.entity';

/**
 * Configuration TypeORM de l'API.
 *
 * Trois modes (variables d'environnement) :
 *  1. DATABASE_URL renseignee  -> PostgreSQL (Neon, Supabase, Vercel Postgres...)
 *  2. DB_TYPE=mysql            -> MySQL / MariaDB
 *  3. sinon                    -> SQLite "sql.js" (zero configuration, aucune dependance native)
 *
 * Le mode 3 persiste la base dans un fichier local en developpement. Sur les
 * plateformes serverless (Vercel) le systeme de fichiers etant ephemere, la
 * base reste en memoire et le jeu de demonstration est recharge a chaque
 * cold start : basculer sur PostgreSQL suffit a rendre les donnees durables.
 */
export const ENTITES = [Utilisateur, Chambre, Client, Reservation];

/** Emplacements possibles du binaire WASM de sql.js */
const CHEMINS_WASM = [
  'sql.js/dist/sql-wasm.wasm',
  'node_modules/sql.js/dist/sql-wasm.wasm',
  '../node_modules/sql.js/dist/sql-wasm.wasm',
  '../../node_modules/sql.js/dist/sql-wasm.wasm',
];

/**
 * Charge le binaire WASM en memoire.
 * Passe en "wasmBinary", sql.js n'a plus besoin de retrouver le fichier sur le
 * disque : indispensable quand l'application est empaquetee (serverless).
 */
function chargerBinaireWasm(): Buffer | undefined {
  for (const chemin of CHEMINS_WASM) {
    try {
      return readFileSync(require.resolve(chemin));
    } catch {
      /* emplacement suivant */
    }
  }
  for (const chemin of CHEMINS_WASM) {
    try {
      return readFileSync(resolve(process.cwd(), chemin));
    } catch {
      /* emplacement suivant */
    }
  }
  return undefined;
}

export function buildTypeOrmOptions(): TypeOrmModuleOptions {
  const url = process.env.DATABASE_URL;
  const dbType = (process.env.DB_TYPE || (url ? 'postgres' : 'sqljs')) as
    | 'postgres'
    | 'mysql'
    | 'sqljs';

  const commun = {
    entities: ENTITES,
    synchronize: process.env.DB_SYNCHRONIZE !== 'false',
    logging: process.env.DB_LOGGING === 'true',
  };

  if (dbType === 'postgres') {
    const ssl =
      process.env.DB_SSL === 'true' ||
      (Boolean(url) && !/localhost|127\.0\.0\.1/.test(url as string));
    return {
      ...commun,
      type: 'postgres',
      url: url || undefined,
      host: process.env.DB_HOST,
      port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 5432,
      username: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_DATABASE,
      ssl: ssl ? { rejectUnauthorized: false } : false,
    } as TypeOrmModuleOptions;
  }

  if (dbType === 'mysql') {
    return {
      ...commun,
      type: 'mysql',
      url: url || undefined,
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 3306,
      username: process.env.DB_USERNAME || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_DATABASE || 'arena_hotels',
    } as TypeOrmModuleOptions;
  }

  // --- SQLite via sql.js (par defaut) ---
  const emplacement = resolve(
    process.env.SQLJS_LOCATION || './data/arena-hotels.sqlite',
  );
  let persistant = process.env.SQLJS_PERSIST !== 'false';

  // Systeme de fichiers non inscriptible (serverless) : bascule en memoire
  if (persistant) {
    try {
      if (!existsSync(dirname(emplacement))) {
        mkdirSync(dirname(emplacement), { recursive: true });
      }
      accessSync(dirname(emplacement), constants.W_OK);
    } catch {
      persistant = false;
    }
  }

  const wasmBinary = chargerBinaireWasm();
  const sqlJsConfig = wasmBinary
    ? { wasmBinary, locateFile: () => 'sql-wasm.wasm' }
    : undefined;

  return {
    ...commun,
    type: 'sqljs',
    location: persistant ? emplacement : undefined,
    autoSave: persistant,
    sqlJsConfig,
  } as TypeOrmModuleOptions;
}
