# ArenaHotels — Système de réservation d'hôtels

**Projet Final n°2** du cours *Développement React & NestJS*.

Application complète de gestion hôtelière : catalogue de **chambres**, fiches **clients**,
**planning de réservations** et **gestion des disponibilités** (les 4 exigences du sujet).

- **Frontend** : React 18 + TypeScript + Vite + React Router
- **Backend** : NestJS 11 + TypeScript + TypeORM
- **Authentification** : JWT + Passport (stratégies `local` et `jwt`), rôles et guards
- **Base de données** : PostgreSQL / MySQL (production) ou SQLite `sql.js` (zéro configuration)

---

## 1. Démonstration

Comptes de démonstration créés automatiquement au démarrage :

| Rôle             | Email                       | Mot de passe     | Droits                                            |
| ---------------- | --------------------------- | ---------------- | ------------------------------------------------- |
| `ADMIN`          | `admin@arenahotels.bj`      | `Admin@2026`     | Tout, y compris la suppression et les comptes     |
| `RECEPTIONNISTE` | `reception@arenahotels.bj`  | `Reception@2026` | Chambres, clients, réservations                   |
| `CLIENT`         | `client@arenahotels.bj`     | `Client@2026`    | Consultation des chambres et des disponibilités   |

Le jeu de démonstration contient **14 chambres**, **8 clients** et **17 réservations**
réparties autour de la date du jour (séjours passés, en cours et à venir).

---

## 2. Compétences du cours et où les retrouver

### Frontend — React

| Compétence du cours                    | Fichier                                                        |
| -------------------------------------- | -------------------------------------------------------------- |
| Composants fonctionnels + JSX + props  | `frontend/src/components/ui.tsx`, `Layout.tsx`                   |
| `useState` (formulaires contrôlés)     | `pages/Connexion.tsx`, `pages/Chambres.tsx`, `pages/Clients.tsx`|
| `useEffect` (chargement des données)   | `hooks/useFetch.ts`, `pages/Reservations.tsx`                   |
| Context API + `useReducer`             | `context/AuthContext.tsx`                                       |
| Hook personnalisé                      | `hooks/useFetch.ts` (chargement / erreur / rechargement)        |
| Événements (`onSubmit`, `onChange`…)   | tous les formulaires                                            |
| Affichage conditionnel                 | `pages/TableauDeBord.tsx` (vue client vs vue réception)         |
| Rendu de listes avec `.map()` + `key`  | tableaux et planning                                            |
| `fetch` GET / POST / PATCH / DELETE    | `api/client.ts`                                                 |
| Fichier d'API centralisé               | `api/client.ts` (aucune URL d'API ailleurs)                     |
| États `loading` / `error`              | `components/ui.tsx` (`Chargement`, `Alerte`, `EtatVide`)        |
| Routes + `Link` / `NavLink`            | `App.tsx`, `components/Layout.tsx`                              |
| Routes dynamiques (`useParams`)        | `pages/ChambreDetail.tsx`, `pages/ClientDetail.tsx`             |
| Query params (`useSearchParams`)       | filtres + pagination (`Chambres`, `Clients`, `Reservations`)    |
| Routes imbriquées (`Outlet`)           | `components/Layout.tsx`                                         |
| Redirection (`Navigate`)               | `App.tsx`, `ProtectedRoute.tsx`                                 |
| Page 404                               | `pages/Introuvable.tsx`                                         |
| Routes protégées                       | `components/ProtectedRoute.tsx` (`RouteProtegee`, `RouteParRole`)|
| Token JWT en `localStorage`            | `api/client.ts` → `gestionToken`                                |

### Backend — NestJS

| Compétence du cours                     | Fichier                                                            |
| --------------------------------------- | ------------------------------------------------------------------ |
| Modules / Contrôleurs / Services        | `backend/src/<module>/…` (chambres, clients, reservations, stats)  |
| CRUD complet (GET, POST, PATCH, DELETE) | `chambres.controller.ts`, `clients.controller.ts`, …               |
| Entités TypeORM                         | `entities/chambre.entity.ts`, `client.entity.ts`, …                |
| Connexion base de données               | `database/typeorm.config.ts`, `database/database.module.ts`        |
| DTO ≠ Entité                            | `*/dto/*.dto.ts` vs `entities/*.entity.ts`                         |
| Validation `class-validator`            | `@IsEmail`, `@IsEnum`, `@Min`, `@Matches`, `@Length`…              |
| `PartialType` pour les mises à jour     | `UpdateChambreDto`, `UpdateClientDto`, `UpdateReservationDto`      |
| Authentification JWT                    | `auth/auth.service.ts`, `auth/auth.controller.ts`                  |
| Stratégie Passport `local`              | `auth/strategies/local.strategy.ts`                                |
| Stratégie Passport `jwt`                | `auth/strategies/jwt.strategy.ts`                                  |
| Guards d'authentification               | `common/guards/jwt-auth.guard.ts`, `local-auth.guard.ts`           |
| Autorisation par rôles                  | `common/decorators/roles.decorator.ts` + `common/guards/roles.guard.ts` |
| Middleware (journalisation)             | `common/middleware/logger.middleware.ts`, activé dans `app.module.ts` |
| Pipe global de validation               | `bootstrap.ts` (`ValidationPipe` : whitelist + forbidNonWhitelisted) |
| Pipe personnalisé                       | `common/pipes/parse-id.pipe.ts`, `parse-iso-date.pipe.ts`          |
| Intercepteur (temps d'exécution)        | `common/interceptors/logging.interceptor.ts`                       |
| Intercepteur (format de réponse)        | `common/interceptors/transform.interceptor.ts`                     |
| CORS                                    | `bootstrap.ts` → `app.enableCors()`                                |
| Intégration front/back                  | proxy Vite en dev, même domaine en production                      |

---

## 3. Règles métier implémentées

1. **Pas de sur-réservation** : deux périodes se chevauchent si
   `arriveeA < departB && arriveeB < departA`. Un conflit renvoie **409** avec la
   référence de la réservation bloquante.
2. **Cohérence des dates** : départ > arrivée, arrivée ≥ aujourd'hui.
3. **Capacité** : le nombre de voyageurs ne peut pas dépasser la capacité de la chambre.
4. **Chambre en maintenance** : réservation refusée (409).
5. **Montant calculé côté serveur** : `nombre de nuits × prix par nuit`.
6. **Transitions de statut contrôlées** : `EN_ATTENTE → CONFIRMEE | ANNULEE`,
   `CONFIRMEE → TERMINEE | ANNULEE`, `ANNULEE → EN_ATTENTE`, `TERMINEE →` (aucune).
7. **Statut des chambres recalculé** automatiquement après chaque mouvement de réservation.
8. **Suppression protégée** : une chambre ou un client avec des réservations actives à
   venir ne peut pas être supprimé.
9. **Références uniques** : `RES-0001`, `RES-0002`, …
10. **Inscription publique** forcée au rôle `CLIENT` (le personnel est créé par un admin).

---

## 4. API

Préfixe global `/api`. Toutes les réponses ont la forme
`{ succes, donnees, meta?, horodatage }` (intercepteur de transformation).

| Méthode | Route                                   | Accès            | Description                            |
| ------- | --------------------------------------- | ---------------- | -------------------------------------- |
| GET     | `/api`                                  | public           | État de l'API                          |
| POST    | `/api/auth/register`                    | public           | Inscription (rôle CLIENT)              |
| POST    | `/api/auth/login`                       | public           | Connexion → `access_token`             |
| GET     | `/api/auth/profil`                      | JWT              | Profil de l'utilisateur                |
| GET     | `/api/chambres`                         | public           | Liste paginée + filtres                |
| GET     | `/api/chambres/:id`                     | public           | Détail + historique                    |
| GET     | `/api/chambres/disponibilites`          | public           | Chambres libres sur une période        |
| POST    | `/api/chambres`                         | ADMIN, RECEPT.   | Création                               |
| PATCH   | `/api/chambres/:id`                     | ADMIN, RECEPT.   | Modification                           |
| DELETE  | `/api/chambres/:id`                     | ADMIN            | Suppression                            |
| GET     | `/api/clients`                          | ADMIN, RECEPT.   | Liste paginée + recherche              |
| GET     | `/api/clients/:id`                      | ADMIN, RECEPT.   | Fiche + historique + statistiques      |
| POST    | `/api/clients`                          | ADMIN, RECEPT.   | Création                               |
| PATCH   | `/api/clients/:id`                      | ADMIN, RECEPT.   | Modification                           |
| DELETE  | `/api/clients/:id`                      | ADMIN            | Suppression                            |
| GET     | `/api/reservations`                     | ADMIN, RECEPT.   | Liste + filtres (statut, mois…)        |
| GET     | `/api/reservations/planning?mois=`      | ADMIN, RECEPT.   | Planning mensuel par chambre           |
| GET     | `/api/reservations/:id`                 | ADMIN, RECEPT.   | Détail                                 |
| POST    | `/api/reservations`                     | tous rôles       | Création (contrôle des disponibilités) |
| PATCH   | `/api/reservations/:id`                 | ADMIN, RECEPT.   | Modification                           |
| PATCH   | `/api/reservations/:id/statut`          | ADMIN, RECEPT.   | Confirmer / annuler / clôturer         |
| DELETE  | `/api/reservations/:id`                 | ADMIN, RECEPT.   | Suppression                            |
| GET     | `/api/stats/tableau-de-bord`            | ADMIN, RECEPT.   | Indicateurs de l'hôtel                 |
| GET     | `/api/utilisateurs`                     | ADMIN            | Comptes utilisateurs                   |

---

## 5. Démarrer en local

Prérequis : Node.js 20+ et npm.

```bash
npm install                 # installe les workspaces backend/ et frontend/

# Terminal 1 — API sur http://localhost:4000/api
npm run start:dev

# Terminal 2 — frontend sur http://localhost:5173
npm run dev:web
```

Ou les deux d'un coup : `npm run dev`.

Aucune base de données n'est à installer : SQLite (`sql.js`) est utilisé par défaut et
le fichier est créé dans `backend/data/arena-hotels.sqlite`.

### Build de production

```bash
npm run build     # compile l'API (tsc) puis le frontend (vite)
npm start         # démarre l'API compilée
```

---

## 6. Variables d'environnement

Voir `backend/.env.example`. Les principales :

| Variable            | Rôle                                                            |
| ------------------- | --------------------------------------------------------------- |
| `PORT`              | Port du serveur (4000 par défaut)                                |
| `JWT_SECRET`        | Clé de signature des tokens — **à changer en production**        |
| `JWT_EXPIRES_IN`    | Durée de vie du token (`7d` par défaut)                          |
| `CORS_ORIGIN`       | Origines autorisées, séparées par des virgules                   |
| `DATABASE_URL`      | Si présente → PostgreSQL                                         |
| `DB_TYPE`           | `postgres`, `mysql` ou `sqljs` (défaut)                          |
| `SQLJS_LOCATION`    | Emplacement du fichier SQLite local                              |
| `SQLJS_PERSIST`     | `false` pour une base en mémoire uniquement                      |

### Passer à PostgreSQL

```bash
DATABASE_URL=postgresql://user:pass@hote:5432/arena_hotels DB_SSL=true npm start
```

Les entités, services et contrôleurs sont inchangés : seul le pilote change.

---

## 7. Déploiement sur Vercel

Un seul projet Vercel sert le frontend **et** l'API (même domaine, donc pas de CORS) :

- `frontend/dist` → fichiers statiques (SPA, avec repli sur `index.html`)
- `api/index.js` → fonction serverless qui expose l'application NestJS compilée

```jsonc
// vercel.json (extrait)
{
  "buildCommand": "npm run build",
  "outputDirectory": "frontend/dist",
  "rewrites": [
    { "source": "/api/(.*)", "destination": "/api/index" },
    { "source": "/((?!api/).*)", "destination": "/index.html" }
  ]
}
```

L'application NestJS est **compilée par `tsc`** avant le déploiement : c'est `tsc` qui
génère les métadonnées de décorateurs nécessaires à l'injection de dépendances
(esbuild, utilisé par Vercel pour empaqueter les fonctions, ne les produit pas).

### Persistance des données sur Vercel

Le plan Hobby de Vercel n'offre ni disque persistant ni base de données managée créée
par API. L'API démarre donc avec **SQLite en mémoire** et recharge le jeu de
démonstration à chaque *cold start* : la navigation, les filtres, le planning et les
règles métier fonctionnent pleinement, mais une chambre créée disparaîtra lorsque
l'instance sera recyclée.

Pour des données durables, ajoutez simplement `DATABASE_URL` dans les variables
d'environnement du projet Vercel (Neon, Supabase, Railway ou Vercel Postgres, tous avec
un plan gratuit) :

```
DATABASE_URL=postgresql://...
DB_SSL=true
JWT_SECRET=<cle-aleatoire>
```

Aucune modification de code n'est nécessaire.

---

## 8. Structure du dépôt

```
ArenaHotels/
├── api/index.js                     # fonction serverless Vercel
├── vercel.json                      # build, rewrites, configuration de la fonction
├── package.json                     # workspaces npm + scripts
├── backend/
│   └── src/
│       ├── main.ts                  # serveur local
│       ├── serverless.ts            # adaptation serverless (Vercel)
│       ├── bootstrap.ts             # CORS, ValidationPipe, intercepteurs, préfixe
│       ├── app.module.ts            # module racine + activation du middleware
│       ├── entities/                # Utilisateur, Chambre, Client, Reservation
│       ├── database/                # configuration TypeORM + jeu de démonstration
│       ├── common/                  # guards, décorateurs, pipes, intercepteurs, DTO communs
│       ├── auth/                    # JWT + stratégies Passport
│       ├── utilisateurs/
│       ├── chambres/
│       ├── clients/
│       ├── reservations/            # règles métier + planning
│       └── stats/                   # tableau de bord
└── frontend/
    └── src/
        ├── api/client.ts            # appels API centralisés
        ├── context/AuthContext.tsx  # Context + useReducer
        ├── hooks/useFetch.ts
        ├── components/              # UI réutilisable, layout, routes protégées
        └── pages/                   # une page par écran
```
