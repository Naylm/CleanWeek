#!/bin/bash
# Deploy simple - à exécuter sur le serveur

cd /var/www/cleanweek

echo "=> Pull..."
git pull origin main

echo "=> Build frontend..."
cd frontend
npm install
npm run build

echo "=> Backend..."
cd ../backend
npm install --omit=dev

echo "=> Restart PM2..."
pm2 restart cleanweek-backend || pm2 start src/index.js --name cleanweek-backend
pm2 save

echo "✅ Déployé !"
