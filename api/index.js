/**
 * Fonction serverless Vercel.
 *
 * L'application NestJS est compilee en JavaScript par `npm run build`
 * (tsc, qui genere les metadonnees de decoration necessaires a l'injection
 * de dependances) puis reexportee ici.
 *
 * vercel.json redirige toutes les requetes /api/* vers cette fonction.
 *
 * IMPORTANT : le require ci-dessous doit rester litteral. Vercel analyse
 * statiquement le fichier (node-file-trace) pour empaqueter les dependances :
 * un chemin calcule ne serait pas suivi et le module serait absent au runtime.
 */

let gestionnaire = null;
let erreurChargement = null;

try {
  const moduleCharge = require('../backend/dist/serverless.js');
  gestionnaire = moduleCharge.default || moduleCharge.handler || moduleCharge;
} catch (erreur) {
  erreurChargement = erreur;
}

module.exports = async function handler(req, res) {
  if (!gestionnaire) {
    res.status(500).json({
      succes: false,
      message: "Echec du chargement de l'API NestJS",
      erreur: erreurChargement ? erreurChargement.message : 'module introuvable',
      diagnostic: {
        repertoireCourant: process.cwd(),
        url: req.url,
        versionNode: process.version,
      },
    });
    return undefined;
  }
  return gestionnaire(req, res);
};
