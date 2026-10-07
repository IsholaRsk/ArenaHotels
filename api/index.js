/**
 * Fonction serverless Vercel.
 *
 * L'application NestJS est compilee en JavaScript par `npm run build`
 * (tsc, qui genere les metadonnees de decoration necessaires a l'injection
 * de dependances) puis simplement reexportee ici.
 *
 * vercel.json redirige toutes les requetes /api/* vers cette fonction.
 */
const serverless = require('../backend/dist/serverless.js');

module.exports = serverless.default || serverless.handler || serverless;
