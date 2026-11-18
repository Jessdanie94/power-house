# Operator-only review and rollout gates

## What is prepared

The expected ESM start path now launches a read-only operator process without importing legacy financial workers or loading the project's environment file. The frontend explicitly says it is not a customer storefront. Business capability routes fail closed with HTTP 503; unknown revenue, order, inventory and AI data remain unavailable/null.

Local validation consists of clean npm installation, syntax/boundary checks, frontend build, selected credential scanning, startup/HTTP tests and both current-lockfile audit modes. No commit, push, pull request, deployment, credential rotation or provider request was performed as part of this work.

## Gates before any hosted change

1. Review the local branch and **sanitized summaries**, not raw secret-bearing diffs. Do not publish legacy logs, database dumps, incident originals or personal account data. Review selected-pattern scan results separately from full incident handling.
2. Coordinate historical credential exposure through native provider/account administrators. Redacting current source does not revoke credentials or remove Git history. No key rotation is authorized by this code change.
3. Confirm the hosting service's actual startup command and deployment policy. Configure a process health check at `/health/live`, not `/health/ready`; the latter deliberately fails until business capabilities are separately implemented and verified. Existing hosting-native auto-deploy settings were not inspected or changed here.
4. **Do not silently replace a working customer checkout with this operator surface.** Choose a separately approved operator service or an explicit maintenance transition. Verify customer routing and communicate any planned outage before changing traffic.
5. Treat merchant onboarding, supplier eligibility, catalog/inventory truth, webhook verification/idempotency, order migration, authorization and payout approvals as missing. These are blockers to a commerce release, not hidden green statuses.
6. Review the two moderate Bull/uuid audit findings separately. No high/critical findings were reported in this lockfile audit; any future unresolved high/critical issue blocks release. Do not apply sweeping major upgrades or suppress audit failures as proof of readiness.

## Rollback

Keep the prior approved hosted artifact and its reviewed environment unchanged until a deployment is explicitly approved. If an operator release is later deployed and must be reversed, restore that previously approved artifact through the hosting platform's authorized rollback path; do not automatically launch the unreviewed legacy root server. No database, provider account, payout destination or order state was changed by this local work, so there is no financial rollback to execute.

## Preserved limitations

Legacy root endpoints and workers are not migrated or verified; legacy module compatibility is not guaranteed. The new status page is public-safe static status, not an authenticated private operator console. Real financial/merchant data must not be added before an access-control and data-handling review. CI validates local code only and does not prove hosting, revenue, supplier or merchant readiness.
