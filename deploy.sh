#!/bin/bash
# Script de déploiement à lancer sur le serveur
# Usage : ./deploy.sh
# Prérequis : nvm installé, pm2 installé, repo cloné dans /var/www/cleanweek

set -e

APP_DIR="/var/www/cleanweek"
FRONTEND_DIR="$APP_DIR/frontend"
BACKEND_DIR="$APP_DIR/backend"

echo "==> Pull des dernières modifications (force)..."
cd "$APP_DIR"
git fetch origin main
git reset --hard origin/main

echo "==> Build du frontend..."
cd "$FRONTEND_DIR"
npm install
npm run build

echo "==> Installation des dépendances backend..."
cd "$BACKEND_DIR"
npm install --omit=dev

echo "==> Redémarrage du backend (pm2)..."
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"

pm2 restart cleanweek-backend 2>/dev/null || pm2 start src/index.js --name cleanweek-backend
pm2 save

echo "==> Rechargement de Nginx..."
if sudo -n systemctl reload nginx 2>/dev/null; then
  echo "Nginx rechargé."
else
  echo "Rechargement Nginx ignoré (sudo non interactif indisponible)."
fi

echo ""
echo "==> Vérification backend..."
sleep 2
curl -s http://localhost:3001/api/health && echo " <- backend OK" || echo " <- ERREUR backend"

echo ""
echo "==> Déployé avec succès ! (Ctrl+F5 dans le navigateur pour rafraîchir)"
