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
- `GET /storage/object?bucket=...&path=...` — read one WyberCode template file
- `POST /storage/object` `{ bucket, path, content }` — write/overwrite one WyberCode template file
- `GET /storage/list?bucket=...&prefix=...` — list template file paths under a prefix

All except `/health` require `Authorization: Bearer <BRIDGE_SECRET>`. The
`/storage/*` routes additionally reject any bucket not in
`WYBERCODE_TEMPLATE_BUCKETS` (comma-separated, defaults to
`wyberai-wybercode-templates`) — same "can't be used outside our own
namespace even if the secret leaks" discipline `INSTANCE_NAME_RE` gives the
Cloud SQL routes.

Mirrors the logic in `src/lib/google-cloud-sql.ts` and
`src/lib/template-library/` in the main repo — if either changes, update
`server.js` to match. Requires the `roles/storage.objectAdmin` IAM binding on
`wybercloud-provisioner@wyberai.iam.gserviceaccount.com` for the template
bucket(s) — grant it before the `/storage/*` routes will work; the SQL
routes are unaffected either way.
