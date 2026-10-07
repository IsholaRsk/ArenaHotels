import { Logger } from '@nestjs/common';
import { creerApplication } from './bootstrap';

/**
 * Point d'entree du serveur local : npm run start:dev --workspace backend
 * L'API ecoute sur http://localhost:4000/api
 */
async function bootstrap() {
  const app = await creerApplication();
  const port = Number(process.env.PORT) || 4000;
  await app.listen(port);
  Logger.log(`API ArenaHotels demarree sur http://localhost:${port}/api`, 'Main');
}

bootstrap();
