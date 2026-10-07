-- ============================================================
--  Supabase - table `profiles` (projet wpwgvhlfbcvsfcgbstbn)
--  A executer une fois dans : Dashboard > SQL Editor > New query
--  Rend les profils lisibles par la cle "publishable" (role anon)
--  => le bloc "Telecharger mes donnees" de la page Profil y puise.
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

insert into public.profiles (nom, email, role, telephone, actif) values
  ('Rodrigue Ishola', 'admin@arenahotels.bj',     'ADMIN',          '+229 97 00 00 01', true),
  ('Awa Adjovi',      'reception@arenahotels.bj', 'RECEPTIONNISTE', '+229 97 00 00 02', true),
  ('Kofi Mensah',     'client@arenahotels.bj',    'CLIENT',         '+229 97 00 00 03', true)
on conflict (email) do nothing;
