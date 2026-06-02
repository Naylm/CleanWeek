# CleanWeek 🧹

Application de gestion des tâches ménagères pour Laura & Melvin.

PWA mobile-first, installable sur iOS depuis Safari.

---

## Stack

- **Frontend** : React + Vite (PWA)
- **Backend** : Node.js + Express
- **Base de données** : SQLite (fichier local sur le serveur)
- **Notifications** : Web Push (node web-push)

---

## Installation

### 1. Base de données SQLite

La base de données SQLite est créée automatiquement par le backend.
Le fichier est stocké sur le serveur à l'emplacement configuré dans `DB_PATH`.
Aucune configuration manuelle nécessaire !

### 2. Configuration serveur

Le backend utilise SQLite directement sur le serveur (pas besoin de Supabase).

### 3. Générer les clés VAPID

```bash
node generate-vapid.js
```

Note les clés affichées (public + private).

### 4. Configurer le frontend

```bash
cd frontend
cp .env.example .env
# Remplis .env avec l'URL de ton API backend et VAPID_PUBLIC_KEY
```

### 5. Configurer le backend

```bash
cd backend
cp .env.example .env
# Remplis .env avec les chemins de la DB, VAPID keys, et email
# DB_PATH : chemin vers le fichier SQLite
# FRONTEND_DIR : chemin vers le build du frontend
```

### 6. Lancer en développement

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

## Déploiement sur ton VPS

**Prérequis** : Node.js installé sur le serveur

### Backend (PM2)
```bash
cd backend
npm install -g pm2
npm install

# Le fichier data/cleanweek.db sera créé automatiquement
pm2 start src/index.js --name cleanweek-backend
pm2 save
```

### Frontend (Build + nginx)
```bash
cd frontend
npm install
npm run build

# Copie le dossier dist/ dans ton nginx
sudo cp -r dist/* /var/www/cleanweek/frontend/
```

### Configuration nginx exemple
```nginx
server {
    listen 80;
    server_name ton-domaine.com;
    
    location / {
        root /var/www/cleanweek/frontend;
        try_files $uri $uri/ /index.html;
    }
    
    location /api/ {
        proxy_pass http://localhost:3001/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}

---

## Installer l'app sur iOS

1. Ouvre Safari sur iPhone
2. Va sur l'URL de l'app
3. Tape le bouton **Partager** → **Sur l'écran d'accueil**
4. L'app s'installe comme une app native !

---

## Synchronisation entre appareils

Les données sont stockées sur ton serveur SQLite.
Tous les appareils connectés à ton serveur voient les mêmes données en temps réel.

Les tâches se rafraîchissent automatiquement toutes les 20 secondes.

---

## Tâches par défaut

Des tâches exemples sont créées automatiquement si la base est vide.
Tu peux aussi les créer directement depuis l'app.
