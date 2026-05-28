-- ============================================================
-- CleanWeek - Schéma Supabase
-- À exécuter dans l'éditeur SQL de ton projet Supabase
-- ============================================================

-- Extension pour les UUID
create extension if not exists "uuid-ossp";

-- ============================================================
-- Profils utilisateurs
-- ============================================================
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default 'Utilisateur',
  avatar_color text not null default '#6C63FF',
  created_at timestamptz not null default now()
);

-- Activer RLS
alter table profiles enable row level security;

-- Tout le monde peut lire les profils (pour voir les coéquipiers)
create policy "Profiles are viewable by authenticated users"
  on profiles for select
  using (auth.role() = 'authenticated');

-- Chacun ne peut modifier que son propre profil
create policy "Users can update their own profile"
  on profiles for update
  using (auth.uid() = id);

-- Créer le profil automatiquement à l'inscription
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, split_part(new.email, '@', 1));
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ============================================================
-- Tâches ménagères
-- ============================================================
create table if not exists tasks (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  category text not null default 'autre',
  frequency text not null default 'weekly', -- daily, weekly, biweekly, monthly
  assigned_to text, -- null = tout le monde, 'both', ou UUID d'un utilisateur
  created_at timestamptz not null default now(),
  created_by uuid references auth.users(id) on delete set null
);

alter table tasks enable row level security;

-- Tous les utilisateurs authentifiés peuvent voir les tâches
create policy "Tasks are viewable by authenticated users"
  on tasks for select
  using (auth.role() = 'authenticated');

-- Tous les utilisateurs authentifiés peuvent créer des tâches
create policy "Authenticated users can create tasks"
  on tasks for insert
  with check (auth.role() = 'authenticated');

-- Tous les utilisateurs authentifiés peuvent modifier les tâches
create policy "Authenticated users can update tasks"
  on tasks for update
  using (auth.role() = 'authenticated');

-- Tous les utilisateurs authentifiés peuvent supprimer des tâches
create policy "Authenticated users can delete tasks"
  on tasks for delete
  using (auth.role() = 'authenticated');

-- ============================================================
-- Complétions de tâches
-- ============================================================
create table if not exists completions (
  id uuid primary key default uuid_generate_v4(),
  task_id uuid not null references tasks(id) on delete cascade,
  completed_by uuid not null references auth.users(id) on delete cascade,
  completed_at date not null default current_date,
  created_at timestamptz not null default now(),
  unique(task_id, completed_at) -- une seule complétion par tâche par jour
);

alter table completions enable row level security;

create policy "Completions are viewable by authenticated users"
  on completions for select
  using (auth.role() = 'authenticated');

create policy "Authenticated users can complete tasks"
  on completions for insert
  with check (auth.role() = 'authenticated');

create policy "Users can remove completions"
  on completions for delete
  using (auth.role() = 'authenticated');

-- ============================================================
-- Subscriptions push
-- ============================================================
create table if not exists push_subscriptions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  subscription text not null,
  created_at timestamptz not null default now(),
  unique(user_id)
);

alter table push_subscriptions enable row level security;

-- Seul le service_role (backend) peut gérer les subscriptions
create policy "Service role manages push subscriptions"
  on push_subscriptions for all
  using (auth.role() = 'service_role');

-- ============================================================
-- Activer Realtime sur les tables principales
-- ============================================================
alter publication supabase_realtime add table tasks;
alter publication supabase_realtime add table completions;
alter publication supabase_realtime add table profiles;

-- ============================================================
-- Données initiales (optionnel : quelques tâches exemples)
-- ============================================================
-- Note : À décommenter et adapter après avoir créé ton compte
-- insert into tasks (name, category, frequency, assigned_to) values
--   ('Passer l''aspirateur', 'salon', 'weekly', 'both'),
--   ('Faire la vaisselle', 'cuisine', 'daily', 'both'),
--   ('Nettoyer les toilettes', 'salle_de_bain', 'weekly', 'both'),
--   ('Faire la lessive', 'linge', 'weekly', 'both'),
--   ('Sortir les poubelles', 'exterieur', 'weekly', 'both'),
--   ('Nettoyer le sol cuisine', 'cuisine', 'weekly', 'both'),
--   ('Changer les draps', 'chambre', 'biweekly', 'both');
