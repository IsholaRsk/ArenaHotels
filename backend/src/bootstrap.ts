import { ValidationPipe } from '@nestjs/common';
import { INestApplication } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import { AppModule } from './app.module';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';

/**
 * Configuration commune de l'application Nest :
 *  - CORS pour que le frontend React puisse appeler l'API
 *  - ValidationPipe global : valide automatiquement tous les DTO
 *    (whitelist + forbidNonWhitelisted : les champs non prevus sont rejetes)
 *  - Prefixe global "api"
 *  - Intercepteurs globaux (journalisation + format homogene des reponses)
 */
export async function configurerApplication(app: INestApplication) {
  app.setGlobalPrefix('api');

  app.enableCors({
    origin: process.env.CORS_ORIGIN
      ? process.env.CORS_ORIGIN.split(',')
      : true,
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: false },
    }),
  );

  app.useGlobalInterceptors(
    new LoggingInterceptor(),
    new TransformInterceptor(),
  );

  app.enableShutdownHooks();
  return app;
}

/** Fabrique utilisee par le serveur local (npm start) et par la fonction Vercel */
export async function creerApplication(
  adaptateur?: ExpressAdapter,
): Promise<INestApplication> {
  const app = await NestFactory.create(AppModule, adaptateur, {
    logger: ['error', 'warn', 'log'],
    bodyParser: true,
  });
  return configurerApplication(app);
}
