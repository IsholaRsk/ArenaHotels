import { Logger } from '@nestjs/common';
import { ExpressAdapter } from '@nestjs/platform-express';
import { Request, Response } from 'express';
import express from 'express';
import { creerApplication } from './bootstrap';

type Gestionnaire = (req: Request, res: Response) => void;

let gestionnaireEnCache: Gestionnaire | null = null;
let initialisation: Promise<Gestionnaire> | null = null;

/**
 * Adaptation serverless : sur Vercel, une seule fonction recoit toutes les
 * requetes /api/*. L'application Nest est creee une seule fois puis reusee
 * (cold start unique) entre les invocations.
 */
async function initialiser(): Promise<Gestionnaire> {
  if (gestionnaireEnCache) return gestionnaireEnCache;
  if (initialisation) return initialisation;

  initialisation = (async () => {
    const instanceExpress = express();
    const app = await creerApplication(new ExpressAdapter(instanceExpress));
    await app.init();
    gestionnaireEnCache = instanceExpress as unknown as Gestionnaire;
    Logger.log('Application Nest initialisee (mode serverless)', 'Serverless');
    return gestionnaireEnCache;
  })();

  return initialisation;
}

export default async function handler(req: Request, res: Response) {
  try {
    const gestionnaire = await initialiser();
    // Le rewrite Vercel pointe vers /api : on s'assure que le prefixe est present
    if (!req.url.startsWith('/api')) {
      req.url = `/api${req.url}`;
    }
    return gestionnaire(req, res);
  } catch (erreur) {
    const message = erreur instanceof Error ? erreur.message : 'Erreur inconnue';
    Logger.error(`Echec de l initialisation : ${message}`, 'Serverless');
    res.status(500).json({
      succes: false,
      statusCode: 500,
      message: `Erreur d'initialisation de l'API : ${message}`,
    });
  }
}
