# PWA - Mode Offline 📱

Disco2000 est maintenant une Progressive Web App (PWA) complète avec support offline.

## ✨ Fonctionnalités

### 🌐 Mode Hors Ligne
- **Cache intelligent** : Les albums, images et données API sont mis en cache automatiquement
- **Consultation sans connexion** : Parcourez votre collection même hors ligne
- **Synchronisation automatique** : Dès que la connexion revient, les données sont actualisées

### 📲 Installation
- **Installable** : Ajoutez l'application à votre écran d'accueil (iOS/Android/Desktop)
- **Expérience native** : Fonctionne comme une application native
- **Pas de store** : Installation directe depuis le navigateur

### 🔄 Mises à Jour
- **Détection automatique** : L'app vérifie les nouvelles versions
- **Notification** : Vous êtes informé quand une mise à jour est disponible
- **Refresh intelligent** : Mise à jour en un clic

### 🎯 Indicateurs Visuels
- **Badge de connexion** : Affiche le statut online/offline en temps réel
- **Notifications** : Alertes lors des changements de connexion
- **Badge PWA** : Indique si l'app est installée

## 🛠️ Architecture Technique

### Service Worker
Le fichier `/public/sw.js` gère :
- **Cache statique** : HTML, CSS, JS, fonts
- **Cache API** : Réponses des endpoints (30min TTL)
- **Cache images** : Images Discogs et pochettes (7 jours TTL)
- **Stratégies** :
  - `Cache First` pour les assets statiques
  - `Network First` avec fallback cache pour les APIs
  - `Cache First` avec refresh en arrière-plan pour les images

### Manifest
Le fichier `/public/manifest.json` définit :
- Nom et description de l'app
- Icônes (8 tailles de 72px à 512px)
- Couleurs de thème
- Mode d'affichage (standalone)
- Shortcuts (raccourcis rapides)

### Utilitaires
`src/utils/serviceWorkerUtils.js` fournit :
- `registerServiceWorker()` - Enregistrement du SW
- `unregisterServiceWorker()` - Désinscription
- `clearAllCaches()` - Vidage des caches
- `isOnline()` - État de connexion
- `addConnectionListener()` - Écoute des changements
- `isStandalone()` - Détection mode PWA
- `getCacheStats()` - Statistiques de cache

### Composant PWAStatus
`src/components/PWAStatus.jsx` affiche :
- Badge online/offline avec animation
- Bouton d'installation (si disponible)
- Bouton de rafraîchissement des données
- Badge PWA (si installé)
- Notifications toast pour les événements

## 📱 Installation sur Différentes Plateformes

### iOS (Safari)
1. Ouvrez l'app dans Safari
2. Tapez sur le bouton "Partager" (carré avec flèche)
3. Sélectionnez "Sur l'écran d'accueil"
4. Confirmez

### Android (Chrome)
1. Ouvrez l'app dans Chrome
2. Tapez sur le menu (⋮)
3. Sélectionnez "Ajouter à l'écran d'accueil"
4. Ou utilisez le bouton "Installer" dans la barre d'adresse

### Desktop (Chrome/Edge)
1. Ouvrez l'app dans Chrome ou Edge
2. Cliquez sur l'icône "Installer" (➕) dans la barre d'adresse
3. Ou cliquez sur le bouton d'installation dans l'interface
4. Confirmez l'installation

## 🧪 Test du Mode Offline

### Dans Chrome DevTools
1. Ouvrez DevTools (F12)
2. Allez dans l'onglet "Application"
3. Section "Service Workers" : vérifiez qu'il est actif
4. Section "Cache Storage" : inspectez les caches
5. Onglet "Network" : Sélectionnez "Offline" pour tester

### Test Réel
1. Naviguez dans l'application (chargez des albums)
2. Activez le mode avion ou déconnectez le Wi-Fi
3. Rafraîchissez la page
4. Vérifiez que les données en cache sont toujours accessibles
5. Le badge "Hors ligne" devrait apparaître

## 📊 Gestion du Cache

### Durées de Vie
- **Assets statiques** : Permanent (jusqu'à mise à jour de l'app)
- **Réponses API** : 30 minutes
- **Images** : 7 jours

### Vider le Cache
Deux méthodes :
1. **Via l'interface** : Cliquez sur le bouton de rafraîchissement
2. **Via DevTools** : Application > Clear storage > Clear site data

### Taille du Cache
Le cache utilise l'espace de stockage du navigateur. Les limites varient :
- **Chrome Desktop** : ~60% de l'espace disque disponible
- **Chrome Mobile** : ~60% de l'espace disponible
- **Safari** : ~1GB
- **Firefox** : ~50% de l'espace libre

## 🔧 Configuration Avancée

### Modifier les Durées de Cache
Dans `/public/sw.js` :
```javascript
const API_CACHE_DURATION = 1000 * 60 * 30; // 30 minutes
const IMAGE_CACHE_DURATION = 1000 * 60 * 60 * 24 * 7; // 7 jours
```

### Ajouter des Assets à Pré-cacher
Dans `/public/sw.js`, section `STATIC_ASSETS` :
```javascript
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  // Ajoutez vos fichiers ici
];
```

### Personnaliser les Notifications
Dans `src/components/PWAStatus.jsx`, modifiez les `toast` :
```javascript
toast({
  title: 'Votre titre',
  description: 'Votre message',
  status: 'success', // success, error, warning, info
  duration: 3000,
  isClosable: true,
});
```

## 🐛 Dépannage

### Le Service Worker ne s'enregistre pas
- Vérifiez que vous êtes en HTTPS (ou localhost)
- Ouvrez DevTools > Console pour voir les erreurs
- Vérifiez que `/sw.js` est accessible

### Les Données ne se Mettent pas en Cache
- Vérifiez la console pour les erreurs de cache
- Inspectez Application > Cache Storage dans DevTools
- Assurez-vous que les URLs matchent les patterns du SW

### L'App ne s'Installe pas
- Vérifiez que le `manifest.json` est valide
- Assurez-vous d'avoir toutes les icônes requises
- Testez avec Lighthouse (DevTools > Lighthouse)

### Le Badge Offline ne s'Affiche pas
- Vérifiez `navigator.onLine` dans la console
- Testez les event listeners `online`/`offline`
- Simulez offline dans DevTools > Network

## 📈 Métriques PWA

Utilisez Lighthouse pour auditer votre PWA :
1. DevTools > Lighthouse
2. Sélectionnez "Progressive Web App"
3. Cliquez sur "Generate report"

Objectifs :
- ✅ Installable
- ✅ Fonctionne offline
- ✅ Responsive
- ✅ HTTPS
- ✅ Temps de chargement < 3s
- ✅ Splash screen personnalisé

## 🚀 Améliorations Futures

- [ ] Background Sync pour synchroniser les modifications offline
- [ ] Push Notifications pour les nouveaux albums
- [ ] Stratégies de cache plus granulaires
- [ ] Compression des images en cache
- [ ] Statistiques d'utilisation du cache
- [ ] Mode "Économie de données"
- [ ] Préchargement intelligent des albums populaires

## 📚 Ressources

- [MDN - Progressive Web Apps](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps)
- [Web.dev - PWA](https://web.dev/progressive-web-apps/)
- [Service Worker API](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)
- [Cache API](https://developer.mozilla.org/en-US/docs/Web/API/Cache)
