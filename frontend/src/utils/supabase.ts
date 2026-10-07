/**
 * Connexion lecture-seule a la base Supabase du projet (cle "publishable").
 * Sert au bloc "Telecharger mes donnees" de la page Profil : on interroge la
 * base pour le profil connecte (par email) et on telecharge le resultat en JSON.
 */

export const SUPABASE_URL = 'https://wpwgvhlfbcvsfcgbstbn.supabase.co';
export const SUPABASE_CLE = 'sb_publishable_pLrZMwJydr6WOG4c_3LG7g_z4tguojl';

/** Tables susceptibles de contenir des donnees de profil (meilleure effort). */
const TABLES_CANDIDATES = [
  'profiles',
  'profils',
  'utilisateurs',
  'users',
  'clients',
  'comptes',
];

/**
 * Recupere, pour un email donne, toutes les lignes presentes dans les tables
 * publiques de la base Supabase. Les tables inexistantes ou non autorisees sont
 * ignorees silencieusement.
 */
export async function lireDonneesProfilSupabase(
  email: string,
): Promise<Record<string, unknown[]>> {
  const resultat: Record<string, unknown[]> = {};

  await Promise.all(
    TABLES_CANDIDATES.map(async (table) => {
      try {
        const url =
          `${SUPABASE_URL}/rest/v1/${table}` +
          `?select=*&email=eq.${encodeURIComponent(email)}&limit=50`;
        const reponse = await fetch(url, {
          headers: {
            apikey: SUPABASE_CLE,
            Authorization: `Bearer ${SUPABASE_CLE}`,
          },
        });
        if (reponse.ok) {
          const lignes = (await reponse.json()) as unknown[];
          if (Array.isArray(lignes) && lignes.length > 0) {
            resultat[table] = lignes;
          }
        }
      } catch {
        // Table absente ou reseau indisponible : on ignore.
      }
    }),
  );

  return resultat;
}

/** Declenche le telechargement d'un objet JSON cote navigateur. */
export function telechargerJson(nomFichier: string, donnees: unknown): void {
  const blob = new Blob([JSON.stringify(donnees, null, 2)], {
    type: 'application/json',
  });
  const url = URL.createObjectURL(blob);
  const lien = document.createElement('a');
  lien.href = url;
  lien.download = nomFichier;
  document.body.appendChild(lien);
  lien.click();
  document.body.removeChild(lien);
  URL.revokeObjectURL(url);
}
