# Disco2000

Plateforme pour créer et partager des listes de disques à partir de métadonnées Discogs.

Trois rôles :
- Visiteur : consulte les disques et listes publiques.
- Utilisateur : crée et gère ses listes (privées/public selon permissions).
- Administrateur : importe des disques, publie des listes.

Stack principale : **React + TypeScript + Chakra UI** (frontend) & **FastAPI + SQLAlchemy + Pydantic** (backend).

## Sommaire
- [Disco2000](#disco2000)
  - [Sommaire](#sommaire)
  - [Fonctionnalités](#fonctionnalités)
  - [Structure du dépôt](#structure-du-dépôt)
  - [Démarrage rapide](#démarrage-rapide)
    - [Prérequis](#prérequis)
    - [Backend](#backend)
    - [Frontend](#frontend)
    - [Test liaison](#test-liaison)
  - [Scripts utiles (à venir)](#scripts-utiles-à-venir)
  - [Tests](#tests)
  - [Qualité \& Conventions](#qualité--conventions)
  - [Roadmap](#roadmap)
  - [Déploiement (Vercel - Option A Serverless)](#déploiement-vercel---option-a-serverless)
    - [Fichiers clés](#fichiers-clés)
    - [Variables d'environnement (dans le dashboard Vercel)](#variables-denvironnement-dans-le-dashboard-vercel)
    - [Processus de déploiement](#processus-de-déploiement)
    - [Requêtes frontend](#requêtes-frontend)
    - [Limitations serverless](#limitations-serverless)
  - [Guidelines IA / Contribution](#guidelines-ia--contribution)
  - [Licence](#licence)

## Fonctionnalités
Etat actuel (MVP en cours) :
- Backend API FastAPI avec endpoint santé `/health` et CRUD minimal en mémoire sur `/records/`.
- Frontend Vite + React + Chakra : affichage des records et ajout basique (API connectée).

Prévu :
- Persistance réelle (SQLite puis PostgreSQL).
- Authentification JWT (access + refresh) & gestion des rôles.
- Import Discogs & caching.
- Pagination / recherche.
- Internationalisation (fr -> multi-langue).
- Tests unitaires + E2E.

## Structure du dépôt
```
backend/
	app/
		core/        # config, sécurité
		models/      # ORM SQLAlchemy
		schemas/     # Pydantic
		routers/     # Endpoints FastAPI
		services/    # Intégrations externes (Discogs, etc.)
		main.py      # Entrée application
	pyproject.toml
frontend/
	src/
		components/
		hooks/
		services/    # appels API (axios)
		theme/       # thème Chakra personnalisé
		App.tsx
		main.tsx
	package.json
docs/
	GUIDELINES.md  # Prompt & règles projet
```

## Démarrage rapide
### Prérequis
- Node.js >= 18
- Python >= 3.11

### Backend
```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -e .
uvicorn app.main:app --reload --port 8001
```
Serveur accessible sur http://localhost:8001

### Frontend
```bash
cd frontend
npm install
npm run dev
```
Application accessible sur http://localhost:5173

### Test liaison
Dans l’UI : ajouter un record. Vérifier retour dans la liste. Ou via curl :
```bash
curl http://localhost:8001/records/
```

## Scripts utiles (à venir)
Un Makefile ou scripts racine sera ajouté pour orchestrer :
- `make dev` : lancer front + back.
- `make test` : exécuter tests.
- `make lint` : lint & format.

## Tests
Plan :
- Backend : pytest + coverage (objectif ≥85%).
- Frontend : Jest + React Testing Library + Playwright (E2E) + Storybook pour documentation visuelle.

## Qualité & Conventions
- Lint : ESLint (front), Ruff + Black (back).
- Types : TypeScript strict / Pydantic v2.
- Commits : Conventional Commits (feat:, fix:, chore:, docs:, refactor:, test:).
- Branches : main (stable), develop, feature/*.

## Roadmap
- [ ] Persistance SQLAlchemy + migrations Alembic
- [ ] Auth & rôles
- [ ] Import Discogs + cache
- [ ] Pagination / filtres records
- [ ] Tests initiaux (health, records)
- [ ] CI pipeline (lint + tests)
- [ ] Docker Compose (api + front + db)
- [ ] i18n
- [ ] WebSocket notifications (publication liste)

## Déploiement (Vercel - Option A Serverless)
Le frontend est construit statiquement (Vite) et servi par Vercel. L'API FastAPI est exposée via une fonction serverless `api/index.py` avec préfixe `/api`.

### Fichiers clés
- `vercel.json` : configuration des builds et routes.
- `api/index.py` : point d'entrée FastAPI serverless.
- `requirements.txt` : dépendances Python pour Vercel (runtime serverless ne lit pas le `pyproject.toml`).

### Variables d'environnement (dans le dashboard Vercel)
`FRONTEND_URL` = https://<ton-projet>.vercel.app
`VITE_API_BASE_URL` = https://<ton-projet>.vercel.app/api
`JWT_SECRET` (à définir pour la suite auth)

### Processus de déploiement
1. Créer un dépôt Git (si non fait) et pousser.
2. Importer le projet dans Vercel.
3. Vérifier que la détection crée deux builds (static-build + python).
4. Ajouter les variables d'environnement.
5. Déployer (Vercel déclenche le build et provisionne la fonction).
6. Test: `curl https://<ton-projet>.vercel.app/api/health` puis ouvrir le site frontend.

### Requêtes frontend
`frontend/src/services/api.ts` utilise `VITE_API_BASE_URL` ou fallback sur `/api` (utile en production car même domaine).

### Limitations serverless
- Cold start possible (quelques centaines de ms).
- Connexions persistantes DB doivent utiliser pooling adapté (à implémenter plus tard).
- WebSockets non optimaux sur fonctions classiques (prévoir alternative plus tard: Edge functions ou autre plateforme).

Pour un backend étatful ou longues connexions, envisager un déploiement conteneur (Option B) dans le futur.

## Guidelines IA / Contribution
Le prompt complet et les règles de contribution se trouvent dans `docs/GUIDELINES.md`.
Avant une PR : tests OK, lint OK, description claire, pas de TODO orphelin.

## Licence
À définir (MIT probable).

---
Pour toute amélioration prioritaire, ouvrir une issue ou proposer une PR.

