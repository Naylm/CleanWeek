# CleanWeek 🧹

Application de gestion des tâches ménagères pour Laura & Melvin.

PWA mobile-first, installable sur iOS depuis Safari.

---

## Stack

- **Frontend** : React + Vite (PWA)
- **Backend** : Node.js + Express
- **Base de données** : Supabase (PostgreSQL)
- **Notifications** : Web Push (node web-push)

---

## Installation

### 1. Créer un projet Supabase

1. Va sur [supabase.com](https://supabase.com) et crée un compte
2. Crée un nouveau projet
3. Dans **SQL Editor**, colle et exécute le contenu de `supabase_schema.sql`
4. Dans **Project Settings > API**, note :
   - `Project URL`
   - `anon public key`
   - `service_role key` (garder secret !)

### 2. Générer les clés VAPID

```bash
node generate-vapid.js
```

Note les clés affichées (public + private).

### 3. Configurer le frontend

```bash
cd frontend
cp .env.example .env
# Remplis .env avec tes valeurs Supabase et VAPID_PUBLIC_KEY
```

### 4. Configurer le backend

```bash
cd backend
cp .env.example .env
# Remplis .env avec tes valeurs Supabase, VAPID keys, et email
```

### 5. Lancer en développement

Terminal 1 (backend) :
```bash
cd backend
npm run dev
```

Terminal 2 (frontend) :
```bash
cd frontend
npm run dev
```

L'app est disponible sur `http://localhost:5173`

---

## Déploiement

### Option recommandée : VPS (ton serveur)

**Frontend** : Build + nginx
```bash
cd frontend
npm run build
# Copie le dossier dist/ dans ton nginx
```

**Backend** : PM2
```bash
cd backend
npm install -g pm2
pm2 start src/index.js --name cleanweek-backend
pm2 save
```

### Option alternative : Vercel + Railway

- Frontend sur **Vercel** (gratuit)
- Backend sur **Railway** (petit plan payant)

---

## Installer l'app sur iOS

1. Ouvre Safari sur iPhone
2. Va sur l'URL de l'app
3. Tape le bouton **Partager** → **Sur l'écran d'accueil**
4. L'app s'installe comme une app native !

---

## Ajouter des membres (enfants plus tard)

Il suffit de créer un compte avec leur email sur l'app.
Leur profil apparaît automatiquement pour l'attribution des tâches.

---

## Tâches par défaut

Décommente les lignes dans `supabase_schema.sql` pour avoir des tâches exemples,
ou crée-les directement depuis l'app.
