#!/bin/bash
# ════════════════════════════════════════
# Cooking Mate / Power House - Production Deployment Script
# Jesse's Digital Ventures
# ════════════════════════════════════════
# 
# This app is a standalone Node.js + React deployment.
# DO NOT use `shopify app deploy` — that's for embedded Shopify apps.
# This script builds the Vite frontend and starts the Express server.
#
# Required environment variables (set via secret_set):
#   SHOPIFY_ACCESS_TOKEN   - shpat_XXXX (Admin API token)
#   SHOPIFY_STORE_URL      - jessesdigitalventures.myshopify.com
#   STRIPE_SECRET_KEY      - Stripe payment processing
#   MONGODB_URI            - MongoDB connection string
#   REDIS_URL              - Redis for Bull queues/caching
#   SELLVIA_API_KEY        - Sellvia fulfillment (optional)
#
# Usage:
#   ./deploy.sh build     - Build frontend only
#   ./deploy.sh start     - Start production server
#   ./deploy.sh full      - Build + start (default)
# ════════════════════════════════════════

set -e

APP_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$APP_DIR"

MODE="${1:-full}"

echo "═══════════════════════════════════════════════"
echo "  🏠 COOKING MATE | Power House Deployment"
echo "  📍 Mode: $MODE"
echo "═══════════════════════════════════════════════"

# --- PRE-FLIGHT CHECKS ---
check_env() {
    local missing=0
    for var in SHOPIFY_ACCESS_TOKEN SHOPIFY_STORE_URL STRIPE_SECRET_KEY MONGODB_URI; do
        if [ -z "${!var}" ]; then
            echo "⚠️  Missing: $var"
            missing=$((missing + 1))
        fi
    done
    if [ $missing -gt 0 ]; then
        echo "❌ $missing required env var(s) missing. Set them before deploying."
        echo "   Use: secret_set <NAME> <value>"
        return 1
    fi
    echo "✅ All required environment variables present"
}

# --- BUILD STEP ---
build_frontend() {
    echo ""
    echo "📦 Building Vite frontend..."
    if [ ! -d "node_modules" ]; then
        echo "   Installing dependencies..."
        npm install --production=false
    fi
    npx vite build
    echo "✅ Frontend built → ./dist/"
}

# --- START STEP ---
start_server() {
    echo ""
    echo "🚀 Starting Express server on port 8001..."
    echo "   Static files: ./dist/ + ./public/"
    echo "   API proxy: all /api/* routes"
    echo ""
    node server.js
}

# --- EXECUTION ---
case "$MODE" in
    build)
        build_frontend
        ;;
    start)
        check_env
        start_server
        ;;
    full)
        check_env
        build_frontend
        start_server
        ;;
    *)
        echo "Usage: $0 {build|start|full}"
        exit 1
        ;;
esac
