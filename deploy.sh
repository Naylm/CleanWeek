#!/bin/bash
# Script de déploiement à lancer sur le serveur
# Usage : ./deploy.sh
# Prérequis : nvm installé, pm2 installé, repo cloné dans /var/www/cleanweek

set -e

APP_DIR="/var/www/cleanweek"
FRONTEND_DIR="$APP_DIR/frontend"
BACKEND_DIR="$APP_DIR/backend"

echo "==> Pull des dernières modifications..."
cd "$APP_DIR"
git pull origin main

echo "==> Build du frontend..."
cd "$FRONTEND_DIR"
npm ci
npm run build

echo "==> Installation des dépendances backend..."
cd "$BACKEND_DIR"
npm ci --omit=dev

echo "==> Redémarrage du backend (pm2)..."
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"

pm2 restart cleanweek-backend 2>/dev/null || pm2 start src/index.js --name cleanweek-backend
pm2 save

echo "==> Déployé avec succès !"
