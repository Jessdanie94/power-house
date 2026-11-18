# Power House — read-only operator release

This release is an **operator status surface, not a customer storefront**. It does not connect to commerce providers, capture payments, acknowledge webhooks, fulfill orders, transfer money, send messages or load the project's `.env`. Missing revenue and telemetry actuals are `null`, never mock sales or zero balances. AI is unavailable.

## Local validation and start

Use Node **22.23.4** (supported range 22.12–22.x) and npm **10.9.9**. Dependency versions and the npm lockfile are pinned. Installation uses npm's enabled lifecycle scripts, including the reviewed frontend toolchain; no application/provider scripts are installation hooks.

```sh
npm ci
npm run validate
npm start
```

`validate` runs real syntax/boundary checks, Vite build, selected-pattern source/build/staged-index credential scans, and offline HTTP tests. `npm test` expects an existing build; `npm run validate` builds first. `PORT` defaults to `8001`; `HOST` defaults to `0.0.0.0`. For a local-only listener set `HOST=127.0.0.1`. `npm run preview` uses the same safe runtime, not a blanket static server. `npm run dev` is a local frontend development server, not a production business service.

| Route | Meaning |
| --- | --- |
| `/`, `/operator` | Distinct operator-only page; 503 if the reviewed build is missing |
| `/health/live`, `/api/health` | 200 means this process responds; it does not prove merchant/business health |
| `/health/ready` | 503: business readiness unknown/unavailable |
| `/api/status`, `/api/telemetry`, `/api/revenue` | Read-only status, null missing actuals, disabled capabilities |
| Payment/checkout/webhook/supplier/payout/order action routes | 503, `executed: false`, approval required; no provider requests |

Unrecognized routes return 404, and mutations of status return 405. Only the built index and manifest-listed JavaScript/CSS assets are served. `publicDir: false` excludes **all** legacy public files; there is no legacy storefront fallback, source-file serving, sourcemap publication or remote analytics tag. The operator build uses a separate absent environment directory rather than loading the project `.env`.

## Legacy boundary and security

Root `server.js`, historical storefront components, workers, provider routes, logs and dumps remain migration evidence, **not supported runtime code**. Do not start the root server, worker shell scripts, orchestrators or provider reconnaissance scripts. Legacy CommonJS/ESM compatibility and checkout endpoints have not been migrated. The three selected reconnaissance scripts use environment lookups instead of credential literals and no longer auto-run; they are not approved integration tools.

Selected revenue modules have no autorun, environment loader, account routing or money execution. The revenue allocation function is pure proposal math and requires an explicit reviewed percentage. That estimate is not revenue, profit, available cash or a deposit.

The credential guard covers selected payment, commerce and source-control token formats in selected working sources, staged blobs and build output. It is **not a complete incident or secret audit**. Legacy public notes were replaced with a redacted notice; history and unrelated tracked evidence were not erased. Native credential coordination and review are still required; no rotation or external verification was performed. Never attach incident originals, raw credential diffs, private logs or dumps to a public review.

## CI and audit

All three workflows run validation only. The historical deploy workflow is manual-only and has no deployment step. The retained daily schedule now runs offline application validation without provider secrets or production requests. Dependency downloads are still needed for CI installation. Hosting-native auto-deploy settings are external to these files and were not changed.

Validated locally: clean `npm ci`, build, source/artifact guard, and **21 tests**. Both `npm audit --omit=dev` and full `npm audit` against the current lockfile report **2 moderate, 0 high, 0 critical** vulnerabilities: retained legacy `bull` and transitive `uuid` (GHSA-w5hq-g745-h8pq). Both exit 1. They are not imported by the new runtime. npm suggests a semver-major Bull replacement; no automatic major upgrade or audit suppression was applied. This remains technical debt requiring separate review.

See [ROLLOUT.md](ROLLOUT.md) for review gates and rollback boundaries. This local work makes no claim that any hosted service or merchant operation is verified.
