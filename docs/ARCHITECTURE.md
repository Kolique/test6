# Architecture MairIA

## Vue d'ensemble

MairIA est une application multi-tenant qui permet aux petites mairies francaises
d'integrer un chatbot IA sur leur site web. Le chatbot repond aux questions des
citoyens en se basant uniquement sur les documents fournis par la mairie (RAG).

## Composants

### Frontend (Next.js 14)

- **Landing page** : page de presentation du produit
- **Widget chat** : composant integrable via `<script>` tag
- **Back-office** : interface d'administration pour les agents de mairie

### Backend (FastAPI)

- **API REST** : endpoints pour le chat, la gestion de documents, l'auth
- **Pipeline RAG** : ingestion, chunking, embedding, recherche, generation
- **Auth** : JWT avec isolation par tenant

### Base de donnees (Supabase/PostgreSQL)

- **pgvector** : stockage et recherche des embeddings
- **Multi-tenant** : chaque mairie a son tenant_id, isolation au niveau des requetes

### Services externes

- **Mistral API** : embeddings (mistral-embed) et generation (mistral-large-latest)
- Tous les appels API restent en Europe

## Pipeline RAG detaille

```
1. INGESTION
   Document PDF/DOCX/URL
   → Extraction du texte
   → Nettoyage et normalisation
   → Decoupe en chunks (1000 chars, overlap 200)
   → Embedding de chaque chunk (mistral-embed, 1024 dims)
   → Stockage dans document_chunks (avec tenant_id)

2. RECHERCHE + GENERATION
   Question du citoyen
   → Embedding de la question (mistral-embed)
   → Recherche cosine similarity dans pgvector (top 5, filtre tenant_id)
   → Construction du prompt avec contexte
   → Appel Mistral Large avec instructions strictes
   → Verification des garde-fous
   → Reponse au citoyen
```

## Securite et RGPD

- Toutes les donnees restent dans l'UE
- Pas de tracking, pas de cookies tiers
- Conversations loguees uniquement si opt-in par la mairie
- Suppression complete des donnees d'un tenant possible
- Authentification JWT pour le back-office
- CORS restreint aux domaines autorises
