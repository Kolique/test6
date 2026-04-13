#!/bin/bash
# MairIA — Deployment script for Scaleway
#
# Prerequisites:
#   - Scaleway CLI installed and configured (scw init)
#   - Docker installed
#   - .env file configured with production values
#
# Usage:
#   ./scripts/deploy-scaleway.sh [build|push|deploy|all]

set -euo pipefail

REGISTRY="rg.fr-par.scw.cloud"
NAMESPACE="mairia"
REGION="fr-par"

BACKEND_IMAGE="${REGISTRY}/${NAMESPACE}/backend"
FRONTEND_IMAGE="${REGISTRY}/${NAMESPACE}/frontend"

TAG="${TAG:-$(git rev-parse --short HEAD)}"

case "${1:-all}" in
  build)
    echo "Building images with tag: ${TAG}"
    docker build -t "${BACKEND_IMAGE}:${TAG}" -f backend/Dockerfile.prod backend/
    docker build -t "${FRONTEND_IMAGE}:${TAG}" -f frontend/Dockerfile.prod frontend/
    docker tag "${BACKEND_IMAGE}:${TAG}" "${BACKEND_IMAGE}:latest"
    docker tag "${FRONTEND_IMAGE}:${TAG}" "${FRONTEND_IMAGE}:latest"
    echo "Build complete."
    ;;

  push)
    echo "Pushing images..."
    docker push "${BACKEND_IMAGE}:${TAG}"
    docker push "${BACKEND_IMAGE}:latest"
    docker push "${FRONTEND_IMAGE}:${TAG}"
    docker push "${FRONTEND_IMAGE}:latest"
    echo "Push complete."
    ;;

  deploy)
    echo "Deploying to Scaleway Containers..."
    echo ""
    echo "Run these commands manually (adapt container IDs):"
    echo ""
    echo "  # Backend"
    echo "  scw container container deploy <backend-container-id> \\"
    echo "    --image ${BACKEND_IMAGE}:${TAG}"
    echo ""
    echo "  # Frontend"
    echo "  scw container container deploy <frontend-container-id> \\"
    echo "    --image ${FRONTEND_IMAGE}:${TAG}"
    echo ""
    echo "Or use docker-compose.prod.yml on a Scaleway instance."
    ;;

  all)
    $0 build
    $0 push
    $0 deploy
    ;;

  *)
    echo "Usage: $0 [build|push|deploy|all]"
    exit 1
    ;;
esac
