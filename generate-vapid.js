// Génère les clés VAPID pour les notifications push
// Utilisation : node generate-vapid.js

import webpush from 'web-push'

const vapidKeys = webpush.generateVAPIDKeys()

console.log('\n=== Clés VAPID générées ===\n')
console.log('VAPID_PUBLIC_KEY=' + vapidKeys.publicKey)
console.log('VAPID_PRIVATE_KEY=' + vapidKeys.privateKey)
console.log('\nAjoute ces valeurs dans :')
console.log('  frontend/.env  → VITE_VAPID_PUBLIC_KEY=<public>')
console.log('  backend/.env   → VAPID_PUBLIC_KEY=<public> et VAPID_PRIVATE_KEY=<private>\n')
