# JDV Master Orchestrator V3 — Environment Variables

All values stored securely via Wingman secret vault. Reference by name only.

## Active Secrets (verified 2026-07-10)

| Secret Name | Purpose | Status |
|---|---|---|
| SELLVIA_API_KEY_JUL10_1 | Primary Sellvia API key | Active |
| SELLVIA_API_KEY_JUL10_2 | Fallback Sellvia API key | Active |
| SHOPIFY_STORE_URL_TECHNICAL | cc5311-j4-store.myshopify.com | Stored |
| SHOPIFY_CLIENT_ID | Shopify dynamic client ID | Stored |
| SHOPIFY_CLIENT_SECRET | Shopify dynamic client secret | Stored |
| SHOPIFY_ACCESS_TOKEN | shpat_ token (stale) | Expired |
| MONGODB_URI_FINAL | Cluster 618954 connection string | Stored |
| MONGO_PASSWORD | Atlas password | Stored |

## Blocked Items

1. Shopify Token: client_credentials returns app_not_installed. Jesse must install custom app on cc5311-j4-store.
2. Stripe: Awaiting reconnection status.
