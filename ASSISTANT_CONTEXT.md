# Contexte assistant

Objectif: Application React/Vite + Chakra UI pour gérer et explorer des albums (Disco 2000).

## Environnements / API
- Variables d’environnement (Vite):
  - `VITE_API_URL`: Base URL de l’API (ex: https://api.exemple.com)
  - `VITE_API_KEY`: Clé API (si requise)
- Endpoints courants:
  - `GET /api/albums?page=&page_size=&artist=&year_from=&year_to=`
  - `GET /api/artists/search?q=&limit=`
  - `GET /api/albums/stats`
  - `GET /api/collection/stats`
- Authentification:
  - JWT stocké en cookie `jwt`
  - `refresh_token` en cookie pour renouvellement
  - En-tête `X-API-KEY` requis sur les requêtes (si activé côté serveur)

## Conventions UI/UX
- Dark mode: fonds en slate (`slate.*`), bordures discrètes
- Accents: `colorScheme="brand"` (cyan/teal), éviter le violet hérité
- Onglets stats: segmented control (pills arrondies)
- Pagination: compacte (flèches + numéros, ellipses)

## Composants et fichiers clés
- `src/App.jsx`: navigation, pagination, filtres, vue principale
- `src/components/StudioStats.jsx`: statistiques générales
- `src/components/CollectionStats.jsx`: statistiques de la collection utilisateur
- `src/components/AlbumCard.jsx`: carte affichage album
- `src/utils/authFetch.js`: wrapper fetch avec JWT et `X-API-KEY`
- `src/theme.js`: thème Chakra UI (brand cyan/teal, dark slate)

## Règles de développement
- Lazy-load des composants lourds via `React.lazy`/`Suspense`
- Debounce pour la recherche d’artistes (300ms)
- Utiliser `authFetch` pour les appels API (gestion JWT/refresh + API key)
- Préférer les fonds/bordures `slate.*` en dark mode

## Priorités pour l’assistant
- Performance et lisibilité
- Sobriété + accents doux (brand)
- Vérifier lint/erreurs après modifications

## Comment fournir les valeurs d’API
- Créer un fichier `.env.local` à la racine (non commité):
```
VITE_API_URL=https://ton-api.exemple.com
VITE_API_KEY=ta_clef_secrete
```
- Optionnel: `.env.development`, `.env.production` pour environnements distincts

## Option: module de config et contexte
- `src/config/api.js` (proposé): centralise `VITE_API_URL`/`VITE_API_KEY` et valide leur présence.
- `src/context/ApiContext.jsx` (optionnel): expose ces valeurs via React Context si besoin de switch dynamique.

## API Endpoints

### Artistes
- `GET /api/artists` - Liste tous les artistes avec leur pays (code ISO et nom)
- `GET /api/artists/search?q=beatles` - Recherche d'artistes par nom (recherche partielle)
- `GET /api/artists/{artist_id}` - Détails d'un artiste
- `PATCH /api/artists/{artist_id}` - Met à jour un artiste (nécessite authentification contributeur)
  ```json
  {
    "country": "FR"
  }
  ```
  Le pays doit être un code ISO 3166-1 alpha-2 valide (2 lettres) : FR, US, GB, DE, JP, etc.

### Pays
- `GET /api/countries` - Liste tous les codes pays ISO 3166-1 alpha-2 disponibles

### Statistiques (Public - sans authentification)
- `GET /api/statistics/genres-styles` - Statistiques complètes par genre et style
- `GET /api/statistics/genres` - Statistiques uniquement par genre
- `GET /api/statistics/styles` - Statistiques uniquement par style
- `GET /api/statistics/overview` - Vue d'ensemble (albums, artistes, labels, décennies)

### Albums
- `GET /api/albums` - Liste paginée des albums avec filtres optionnels :
  - `?page=1` - Numéro de page
  - `?page_size=20` - Nombre d'albums par page
  - `?artist=Beatles` - Filtre par nom d'artiste (recherche partielle)
  - `?year_from=1970` - Année de début (incluse)
  - `?year_to=1980` - Année de fin (incluse)
