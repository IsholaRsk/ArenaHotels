import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  /** Etat de l'API : renvoye par GET /api */
  ping() {
    return {
      application: 'ArenaHotels API',
      projet: 'Projet Final 2 - Systeme de reservation d\'hotels',
      statut: 'en ligne',
      version: '1.0.0',
      routes: {
        authentification: ['/auth/login', '/auth/register', '/auth/profil'],
        chambres: ['/chambres', '/chambres/:id', '/chambres/disponibilites'],
        clients: ['/clients', '/clients/:id'],
        reservations: [
          '/reservations',
          '/reservations/:id',
          '/reservations/:id/statut',
          '/reservations/planning?mois=YYYY-MM',
        ],
        statistiques: ['/stats/tableau-de-bord'],
      },
      comptesDeDemo: [
        { role: 'ADMIN', email: 'admin@arenahotels.bj', motDePasse: 'Admin@2026' },
        {
          role: 'RECEPTIONNISTE',
          email: 'reception@arenahotels.bj',
          motDePasse: 'Reception@2026',
        },
        { role: 'CLIENT', email: 'client@arenahotels.bj', motDePasse: 'Client@2026' },
      ],
    };
  }
}
