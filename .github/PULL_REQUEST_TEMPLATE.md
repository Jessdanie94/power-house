### Summary
This PR sets up the environment configuration and backend secret handling required for the Shopify Admin API integration.

### Changes
- Updated `.env.example` to include the `SHOPIFY_ACCESS_TOKEN` placeholder variable.
- Configured backend initialization to pull the token safely from environment variables.

### Verification Steps
1. Copy the new variable from `.env.example` to your local `.env`.
2. Add a valid test token and ensure the API client initializes without errors.

Fixes # (replace with the Issue number)
