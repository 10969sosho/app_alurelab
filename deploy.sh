#!/usr/bin/env bash
set -e

# ========================================================
# ALURELAB DEPLOYMENT SCRIPT TO VPS (103.121.122.135)
# Usage:
#   ./deploy.sh backend   -> Deploy Laravel API & Migrations
#   ./deploy.sh frontend  -> Deploy Next.js App & Reload PM2
#   ./deploy.sh landing   -> Deploy Static Landing Page
#   ./deploy.sh wa        -> Deploy Self-Hosted WhatsApp Gateway
#   ./deploy.sh all       -> Deploy Everything
# ========================================================

TARGET="alurelab-vps"
TARGET_DIR="/var/www/alurelab"

deploy_landing() {
    echo "🚀 [1/4] Deploying Landing Page..."
    rsync -avz --delete \
        --exclude='.git' \
        landing-alurelab/ ${TARGET}:${TARGET_DIR}/landing/
    echo "✅ Landing page deployed successfully!"
}

deploy_backend() {
    echo "🚀 [2/4] Deploying Backend (Laravel)..."
    rsync -avz \
        --exclude='.git' \
        --exclude='vendor' \
        --exclude='node_modules' \
        --exclude='*.bak*' \
        --exclude='storage/' \
        --exclude='bootstrap/cache/*.php' \
        --exclude='.phpunit.result.cache' \
        --exclude='.env' \
        backend/ ${TARGET}:${TARGET_DIR}/backend/

    echo "⚙️  Running migrations and optimizing on VPS..."
    ssh ${TARGET} "cd ${TARGET_DIR}/backend && \
        COMPOSER_ALLOW_SUPERUSER=1 composer install --no-dev --optimize-autoloader --no-interaction && \
        php artisan migrate --force && \
        php artisan storage:link && php artisan optimize && \
        chown -R www-data:www-data storage bootstrap/cache && \
        supervisorctl restart alurelab-worker:*"
    echo "✅ Backend deployed and workers reloaded!"
}

deploy_frontend() {
    echo "🚀 [3/4] Deploying Frontend (Next.js)..."
    rsync -avz \
        --exclude='.git' \
        --exclude='node_modules' \
        --exclude='.next' \
        --exclude='.env.local' \
        --exclude='*.bak*' \
        frontend/ ${TARGET}:${TARGET_DIR}/frontend/

    echo "⚙️  Building Next.js on VPS and reloading PM2..."
    ssh ${TARGET} "cd ${TARGET_DIR}/frontend && \
        npm install --prefer-offline --no-audit && \
        NODE_OPTIONS='--max-old-space-size=2048' npm run build && \
        pm2 reload alurelab-frontend"
    echo "✅ Frontend built and PM2 reloaded!"
}

deploy_wa() {
    echo "🚀 [4/4] Deploying WhatsApp Gateway (Baileys)..."
    rsync -avz \
        --exclude='.git' \
        --exclude='node_modules' \
        --exclude='auth_info' \
        --exclude='.env' \
        whatsapp-service/ ${TARGET}:${TARGET_DIR}/whatsapp-service/

    echo "⚙️  Reloading PM2 WhatsApp service..."
    ssh ${TARGET} "cd ${TARGET_DIR}/whatsapp-service && \
        npm install --prefer-offline --no-audit && \
        pm2 reload alurelab-wa || pm2 start index.js --name 'alurelab-wa'"
    echo "✅ WhatsApp Gateway deployed and reloaded!"
}

MODE="${1:-all}"

case "$MODE" in
    landing)
        deploy_landing
        ;;
    backend)
        deploy_backend
        ;;
    frontend)
        deploy_frontend
        ;;
    wa)
        deploy_wa
        ;;
    all)
        deploy_landing
        deploy_backend
        deploy_frontend
        deploy_wa
        ;;
    *)
        echo "Usage: $0 {backend|frontend|landing|wa|all}"
        exit 1
        ;;
esac

echo ""
echo "🎉 Deployment '$MODE' completed successfully to ${TARGET}!"
