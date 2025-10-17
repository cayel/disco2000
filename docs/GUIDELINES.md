# Guidelines & Prompt du Projet Disco2000 (version Chakra UI)

## Contexte
Application Web (desktop + mobile responsive) permettant:
1. Utilisateurs non enregistrés: consulter les disques et listes publiques.
2. Utilisateurs enregistrés: créer, modifier, gérer leurs listes privées ou publiques (si autorisés).
3. Administrateurs: ajouter/éditer des disques (import depuis Discogs), valider et publier des listes publiques.

## Stack
Frontend: React + TypeScript + Chakra UI (thème custom, mode clair/sombre, composants accessibles), React Query (data fetching), react-router (navigation).
Backend: Python (FastAPI), SQLAlchemy (ORM), PostgreSQL (prod), SQLite (dev), Auth JWT (access + refresh).
Infra locale: Docker Compose (web, api, db).
Format API: REST + JSON. Prévoir future extension WebSocket (notifications).

## Principes
- Monorepo: /frontend et /backend avec scripts racine.
- Logique métier hors des composants UI (hooks/services).
- Validation côté client ET serveur (Pydantic + schémas TS).
- Gestion d’état serveur via React Query, état UI local minimal.

## UI & Chakra
- Utiliser le thème central (`/frontend/src/theme`) pour couleurs, typographie, spacing, radii.
- Extensions: palettes brand (ex: brand.50 → brand.900), variants de Button (primary, subtle), composant ListCard.
- Activer ColorMode (localStorage) + préférence système.
- Ne pas surcharger les styles inline; privilégier props Chakra (p, m, flex, gap).
- Créer des composants réutilisables: LayoutShell, RecordCard, ListBadge.
- Responsive via props Chakra (ex: `p={{ base: 2, md: 4 }}`).
- Utiliser Grid/Flex plutôt que CSS manuel.
- Respect des tokens (pas de valeurs brutes si équivalent existe).
- Charger images via `Image` avec fallback + skeleton.
- Accessibilité: utiliser `VisuallyHidden` pour labels, aria-* sur icônes décoratives.

## Modèles (simplifiés)
Record: id, discogs_id, titre, artistes[], année, genres[], cover_url, ajout_par, date_ajout.
List: id, titre, description, créée_par, statut(public|privé|modération), records[], date_création, date_update.
User: id, email, pseudo, rôle(user|admin), password_hash, date_inscription.
AuditLog: id, entité_type, entité_id, action, acteur_id, timestamp.

## Endpoints (schéma)
GET /api/records?search=&genre=&year=
POST /api/records (admin)
GET /api/lists/public
GET /api/lists/:id
POST /api/lists (user)
PUT /api/lists/:id (owner/admin)
POST /api/auth/register /login /refresh /logout
POST /api/import/discogs (admin)
GET /api/users/me

## Sécurité
- Mots de passe Argon2.
- Refresh token HttpOnly cookie, access token mémoire volatile.
- Rate limiting (ex: 100 req / 15 min / IP).
- CORS restrictif (env FRONTEND_URL).
- Validation stricte payload Discogs.

## Import Discogs
- Service isolé: adapter -> normalise -> persiste.
- Cache réponses (TTL 24h).
- Déduplication par discogs_id.

## Tests
- Front: Jest + React Testing Library + Storybook (documentation visuelle) + Playwright (E2E).
- Back: pytest (unit + integration), couverture ≥85%.
- Cas critiques: création liste sans doublons, rôles, pagination.
- CI: lint, type-check, tests, build.

## Qualité
- ESLint + Prettier / Ruff + Black.
- TypeScript strict.
- Commits: Conventional Commits.
- Branches: main, develop, feature/*.

## Performance
- Pagination (limit+offset).
- Index DB sur discogs_id, titre, année.
- Lazy loading images + WebP.
- ETag + Cache-Control pour GET publics.
- Squelettes (Skeleton) pour chargement perceptible.

## Accessibilité & UX
- Composants Chakra (conformes WAI-ARIA).
- Focus visible (custom via theme).
- Contraste AA (vérifier palette brand).
- Navigation clavier complète (Modal, Drawer, Menu).
- Breakpoints Chakra (base, sm, md, lg, xl, 2xl).

## Internationalisation
- Prévoir i18n (fr par défaut) avec fichiers de traduction centralisés.

## Configuration & Secrets
- .env (non commité) DATABASE_URL, JWT_SECRET, DISCOGS_API_KEY.
- .env.example fourni.
- Jamais logguer de secrets.

## Logs & Observabilité
- Backend: logs JSON (info/warn/error).
- Tracer durée import Discogs.
- Front: capture erreurs critiques (Sentry possible).

## Déploiement
- Build frontend (static) derrière CDN ou reverse proxy.
- Backend uvicorn/gunicorn.
- Migrations Alembic.
- HTTPS obligatoire.

## Évolution
- Prévoir WebSocket (notifications: liste publiée).
- Event sourcing minimal via AuditLog.

## Checklist avant PR
- Tests OK.
- Lint & type-check OK.
- Description claire + issue liée.
- Pas de TODO restant.
- Storybook à jour si nouveau composant UI.

## Prompt Utilisation (copier-coller pour assistants IA)
Tu es un assistant pour le projet Disco2000. Règles:
1. Ne modifie pas les modèles fondamentaux sans justification.
2. Solutions compatibles React + FastAPI + Chakra UI.
3. Optimiser lisibilité, testabilité, sécurité, accessibilité.
4. Séparer présentation (composants Chakra) / logique (hooks/services).
5. Nouvelle API: définir schéma entrée/sortie + erreurs.
6. Pas de dépendance lourde sans analyse coût/bénéfice.
7. Respect conventions (commits, tests, qualité).
8. UI responsive + mode clair/sombre cohérent.
9. Préparer extensibilité (WebSocket, i18n).
Fin du prompt.
