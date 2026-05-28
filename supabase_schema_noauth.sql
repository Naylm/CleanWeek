-- ============================================================
-- CleanWeek - Schéma Supabase (sans authentification)
-- À exécuter dans l'éditeur SQL de ton projet Supabase
-- ============================================================

-- Extension pour les UUID
create extension if not exists "uuid-ossp";

-- ============================================================
-- Profils utilisateurs (sans auth, IDs fixes)
-- ============================================================
create table if not exists profiles (
  id uuid primary key,
  display_name text not null default 'Utilisateur',
  avatar_color text not null default '#6C63FF',
  created_at timestamptz not null default now()
);

-- Désactiver RLS (accès libre pour usage privé à 2 personnes)
alter table profiles disable row level security;

-- Créer les profils Laura et Melvin
insert into profiles (id, display_name, avatar_color) values
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Laura', '#FF6584'),
  ('b2c3d4e5-f6a7-8901-bcde-f12345678901', 'Melvin', '#6C63FF')
on conflict (id) do update set display_name = excluded.display_name, avatar_color = excluded.avatar_color;

-- ============================================================
-- Tâches ménagères
-- ============================================================
create table if not exists tasks (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  category text not null default 'autre',
  frequency text not null default 'weekly',
  assigned_to text,
  created_at timestamptz not null default now(),
  created_by uuid
);

alter table tasks disable row level security;

-- ============================================================
-- Complétions de tâches
-- ============================================================
create table if not exists completions (
  id uuid primary key default uuid_generate_v4(),
  task_id uuid not null references tasks(id) on delete cascade,
  completed_by uuid not null,
  completed_at date not null default current_date,
  created_at timestamptz not null default now(),
  unique(task_id, completed_at)
);

alter table completions disable row level security;

-- ============================================================
-- Subscriptions push
-- ============================================================
create table if not exists push_subscriptions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null,
  subscription text not null,
  created_at timestamptz not null default now(),
  unique(user_id)
);

alter table push_subscriptions disable row level security;

-- ============================================================
-- Activer Realtime sur les tables principales
-- ============================================================
alter publication supabase_realtime add table tasks;
alter publication supabase_realtime add table completions;
alter publication supabase_realtime add table profiles;

-- ============================================================
-- Données initiales (tâches exemples)
-- ============================================================
insert into tasks (name, category, frequency, assigned_to) values
  ('Passer l''aspirateur', 'salon', 'weekly', 'both'),
  ('Faire la vaisselle', 'cuisine', 'daily', 'both'),
  ('Nettoyer les toilettes', 'salle_de_bain', 'weekly', 'both'),
  ('Faire la lessive', 'linge', 'weekly', 'both'),
  ('Sortir les poubelles', 'exterieur', 'weekly', 'both'),
  ('Nettoyer le sol cuisine', 'cuisine', 'weekly', 'both'),
  ('Changer les draps', 'chambre', 'biweekly', 'both')
on conflict do nothing;
