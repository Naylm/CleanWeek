# Guide de Déploiement CleanWeek 🚀

Déploiement complet sur ton VPS avec nginx + PM2 + SQLite.

---

## 1. Prérequis sur le serveur

```bash
# Connecte-toi en SSH à ton serveur
ssh user@ton-serveur.com

# Installe Node.js 20+ et npm
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Installe PM2 globalement
sudo npm install -g pm2

# Installe git si pas déjà fait
sudo apt-get install -y git
```

---

## 2. Cloner le projet

```bash
# Crée le dossier
sudo mkdir -p /var/www
cd /var/www

# Clone le repo (remplace par ton URL si besoin)
sudo git clone https://github.com/Naylm/CleanWeek.git

# Change le propriétaire (remplace $USER par ton user)
sudo chown -R $USER:$USER /var/www/cleanweek
```

---

## 3. Configuration environnement

### Backend (`/var/www/cleanweek/backend/.env`)

```bash
cd /var/www/cleanweek/backend
cp .env.example .env
nano .env
```

**Contenu à mettre :**
```env
PORT=3001
DB_PATH=/var/www/cleanweek/backend/data/cleanweek.db
FRONTEND_DIR=/var/www/cleanweek/frontend/dist
VAPID_EMAIL=ton-email@example.com
VAPID_PUBLIC_KEY=TA_CLE_PUBLIQUE_VAPID
VAPID_PRIVATE_KEY=TA_CLE_PRIVEE_VAPID
```

> **Obtenir les clés VAPID :** `node generate-vapid.js` sur ton PC local

---

### Frontend (`/var/www/cleanweek/frontend/.env`)

```bash
cd /var/www/cleanweek/frontend
cp .env.example .env
nano .env
```

**Contenu à mettre :**
```env
VITE_API_URL=https://ton-domaine.com/api
VITE_VAPID_PUBLIC_KEY=TA_CLE_PUBLIQUE_VAPID
```

---

## 4. Installation & Build

```bash
cd /var/www/cleanweek

# Backend
cd backend
npm install

# Crée le dossier data pour SQLite
mkdir -p data

# Frontend
cd ../frontend
npm install
npm run build
```

---

## 5. Configuration Nginx

Crée le fichier de config :

```bash
sudo nano /etc/nginx/sites-available/cleanweek
```

**Colle cette configuration :**

```nginx
server {
    listen 80;
    server_name ton-domaine.com www.ton-domaine.com;

    # Frontend (React build)
    location / {
        root /var/www/cleanweek/frontend/dist;
        try_files $uri $uri/ /index.html;
        
        # Cache statique
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }

    # Backend API
    location /api/ {
        proxy_pass http://localhost:3001/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Active le site :

```bash
sudo ln -s /etc/nginx/sites-available/cleanweek /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

---

## 6. Lancer le backend (PM2)

```bash
cd /var/www/cleanweek/backend

# Démarre avec PM2
pm2 start src/index.js --name cleanweek-backend

# Sauvegarde la config
pm2 save

# Configure le démarrage auto
pm2 startup systemd
sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u $USER --hp $HOME
```

---

## 7. Vérification

```bash
# Vérifie que le backend tourne
pm2 status

# Test l'API
curl http://localhost:3001/api/health
# → {"ok":true}

# Vérifie les logs
pm2 logs cleanweek-backend
```

---

## 8. Mettre à jour (déploiement ultérieur)

Utilise le script `deploy.sh` fourni :

```bash
cd /var/www/cleanweek
./deploy.sh
```

Ou manuellement :

```bash
cd /var/www/cleanweek
git pull origin main
cd frontend && npm ci && npm run build
cd ../backend && npm ci --omit=dev
pm2 restart cleanweek-backend
```

---

## 9. HTTPS (Certbot - optionnel mais recommandé)

```bash
sudo apt-get install certbot python3-certbot-nginx
sudo certbot --nginx -d ton-domaine.com -d www.ton-domaine.com
```

---

## Troubleshooting

| Problème | Solution |
|----------|----------|
| `EACCES: permission denied` | `sudo chown -R $USER:$USER /var/www/cleanweek` |
| Port 3001 déjà utilisé | `pm2 delete all` puis `pm2 start ...` |
| 502 Bad Gateway | Vérifier que le backend tourne : `pm2 logs` |
| Base de données inaccessible | Vérifier les permissions du dossier `data/` |

---

## Commandes utiles

```bash
# Voir les logs
pm2 logs cleanweek-backend

# Redémarrer
pm2 restart cleanweek-backend

# Arrêter
pm2 stop cleanweek-backend

# Status
pm2 status
```
