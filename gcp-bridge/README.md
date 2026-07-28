# WyberCloud GCP bridge

Vercel (where the main app runs) has no ambient GCP identity, and the `wyberai`
org enforces `iam.disableServiceAccountKeyCreation`, so a downloadable service
account JSON key isn't an option. This tiny service solves that: deployed to
Cloud Run under the `wybercloud-provisioner` service account, it gets that
account's identity automatically (no key file, ever) and exposes the Cloud SQL
Admin operations the main app needs over HTTP, gated by a shared bearer
secret.

## Deploy (from Cloud Shell, or any shell with `gcloud` authenticated as an
owner/editor on the `wyberai` project)

```bash
git clone https://github.com/Wyberai/wyber-ai.git
cd wyber-ai/gcp-bridge

gcloud config set project wyberai

gcloud run deploy wybercloud-bridge \
  --source . \
  --region us-central1 \
  --service-account wybercloud-provisioner@wyberai.iam.gserviceaccount.com \
  --allow-unauthenticated \
  --set-env-vars BRIDGE_SECRET=<paste the generated secret>,GOOGLE_CLOUD_PROJECT=wyberai,GOOGLE_CLOUD_REGION=us-central1
```

`--allow-unauthenticated` is required because Vercel has no way to attach a
Google-signed identity token to its requests — the real gate is the
`BRIDGE_SECRET` bearer check inside the service itself (see `server.js`).
Anyone without that secret gets a 401 on every route except `/health`.

After deploy, `gcloud run deploy` prints a Service URL
(`https://wybercloud-bridge-xxxxx-uc.a.run.app`). Set that as `GCP_BRIDGE_URL`
and the same secret as `GCP_BRIDGE_SECRET` in the main app's Vercel
environment variables (Production + Preview).

## Endpoints

- `GET /health` — no auth, liveness check
- `POST /instances` `{ instanceName, region?, database?, password? }` — kick off Cloud SQL instance creation
- `GET /operations/:operationName?instanceName=...&database=...` — poll a creation operation, creates the named database once the instance is up
- `DELETE /instances/:instanceName` — tear down an instance
- `GET /instances/:instanceName` — instance details

All except `/health` require `Authorization: Bearer <BRIDGE_SECRET>`.

Mirrors the logic in `src/lib/google-cloud-sql.ts` in the main repo — if that
file's Cloud SQL Admin API calls change, update `server.js` to match.
