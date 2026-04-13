# MairIA

Assistant IA conversationnel pour les petites mairies francaises (500-3000 habitants).
Chatbot integrable en 1 ligne de code, qui repond aux questions des citoyens a partir des documents fournis par la mairie.

## Architecture

```
Citoyen / Agent mairie
        |
   [Frontend Next.js 14]  --  Widget chat + Back-office
        |
   [Backend FastAPI]       --  API REST, pipeline RAG, auth JWT
        |
   [Supabase Postgres]    --  pgvector, stockage documents
        |
   [API Mistral]           --  Embeddings + Generation (EU only)
```

**Souverainete** : toute la stack est europeenne. Aucune donnee ne transite hors UE.

## Stack technique

| Composant | Technologie |
|-----------|-------------|
| Frontend | Next.js 14 (App Router) + Tailwind CSS + shadcn/ui |
| Backend | FastAPI (Python 3.11+) |
| Base de donnees | Supabase (Postgres + pgvector) |
| LLM | Mistral Large (via API Mistral) |
| Embeddings | mistral-embed (via API Mistral) |
| Hebergement | Scaleway Paris |

## Structure du projet

```
mairia/
├── frontend/          # Application Next.js 14
│   ├── src/
│   │   ├── app/       # App Router (pages + API routes)
│   │   ├── components/# Composants React (widget, back-office)
│   │   └── lib/       # Utilitaires, clients API
│   └── public/        # Assets statiques
├── backend/           # API FastAPI
│   ├── app/
│   │   ├── api/v1/    # Endpoints REST
│   │   ├── core/      # Config, securite, deps
│   │   ├── models/    # Modeles SQLAlchemy
│   │   ├── schemas/   # Schemas Pydantic
│   │   └── services/  # Logique metier (RAG, ingestion, auth)
│   ├── tests/         # Tests pytest
│   └── alembic/       # Migrations BDD
├── docs/              # Documentation projet
├── scripts/           # Scripts utilitaires (setup, seed, etc.)
├── docker-compose.yml # Orchestration locale
└── .env.example       # Variables d'environnement requises
```

## Prerequisites

- Python 3.11+
- Node.js 20+
- Docker & Docker Compose
- Un compte [Supabase](https://supabase.com) (region EU)
- Une cle API [Mistral](https://console.mistral.ai)

## Installation

### 1. Cloner le projet

```bash
git clone <repo-url>
cd mairia
```

### 2. Configurer les variables d'environnement

```bash
cp .env.example .env
# Editer .env avec vos valeurs (voir section Variables d'environnement)
```

### 3. Lancer avec Docker Compose (recommande)

```bash
docker compose up --build
```

Le frontend sera accessible sur `http://localhost:3000` et le backend sur `http://localhost:8000`.

### 4. Lancement sans Docker (developpement)

**Backend :**

```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

**Frontend :**

```bash
cd frontend
npm install
npm run dev
```

## Variables d'environnement

Voir `.env.example` pour la liste complete. Les variables critiques :

| Variable | Description |
|----------|-------------|
| `MISTRAL_API_KEY` | Cle API Mistral (console.mistral.ai) |
| `SUPABASE_URL` | URL du projet Supabase (region EU) |
| `SUPABASE_ANON_KEY` | Cle anonyme Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | Cle service Supabase (backend only) |
| `DATABASE_URL` | URL de connexion PostgreSQL directe |
| `JWT_SECRET` | Secret pour la signature des tokens JWT |
| `CORS_ORIGINS` | Origines autorisees (domaines des mairies) |

## RGPD

- Aucune donnee personnelle n'est collectee par defaut
- Les conversations ne sont loguees que si la mairie active l'option (opt-in)
- Droit a l'oubli : suppression de toutes les donnees d'un tenant via l'API
- Toutes les donnees restent dans l'UE (Supabase EU + Mistral EU + Scaleway Paris)

## Licence

Proprietary - Tous droits reserves.
