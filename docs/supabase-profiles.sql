-- ============================================================
--  Supabase - table `profiles` (projet wpwgvhlfbcvsfcgbstbn)
--  A executer une fois dans : Dashboard > SQL Editor > New query
--  Rend les profils lisibles par la cle "publishable" (role anon)
--  => le bloc "Telecharger mes donnees" de la page Profil y puise.
--
--  Les noms ci-dessous sont ceux des comptes de demonstration de
--  l'application : Koffi DOSSA (administrateur), Hannane DAOUDA
--  (receptionniste) et Lucio OLORY (client).
-- ============================================================

create table if not exists public.profiles (
  id        bigserial primary key,
  nom       text not null,
  email     text unique not null,
  role      text,
  telephone text,
  actif     boolean default true,
  cree_le   timestamptz default now()
);

alter table public.profiles enable row level security;

drop policy if exists "profiles_select_anon" on public.profiles;
create policy "profiles_select_anon"
  on public.profiles
  for select
  to anon, authenticated
  using (true);

-- Upsert : reexecuter ce script met aussi a jour les noms des lignes
-- deja presentes (anciens noms de demonstration).
insert into public.profiles (nom, email, role, telephone, actif) values
  ('Koffi DOSSA',    'admin@arenahotels.bj',     'ADMIN',          '+229 97 00 00 01', true),
  ('Hannane DAOUDA', 'reception@arenahotels.bj', 'RECEPTIONNISTE', '+229 97 00 00 02', true),
  ('Lucio OLORY',    'client@arenahotels.bj',    'CLIENT',         '+229 97 00 00 03', true)
on conflict (email) do update
  set nom       = excluded.nom,
      role      = excluded.role,
      telephone = excluded.telephone,
      actif     = excluded.actif;
