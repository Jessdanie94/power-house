#!/bin/bash
# JDV Tactical Product Recon Test
# Usage: ./test_shopify_gql.sh
SHOP="jessesdigitalventures-gmail-com"
TOKEN=${SHOPIFY_ADMIN_API_TOKEN}

if [ -z "$TOKEN" ]; then
  echo "[!] ERROR: SHOPIFY_ADMIN_API_TOKEN not set in environment."
  exit 1
fi

echo "[*] Initiating GraphQL Handshake..."
curl -sX POST \
  "https://$SHOP.myshopify.com/admin/api/2026-04/graphql.json" \
  -H 'Content-Type: application/json' \
  -H "X-Shopify-Access-Token: $TOKEN" \
  -d '{
    "query": "{ products(first: 5) { edges { node { id handle } } pageInfo { hasNextPage } } }"
  }' | jq '.data.products.edges[].node | {id, handle}'
