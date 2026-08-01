// WyberCloud GCP bridge
//
// Vercel serverless functions have no ambient GCP identity, and the org
// policy `iam.disableServiceAccountKeyCreation` blocks the usual fix (a
// downloadable service-account JSON key). Cloud Run doesn't have that
// problem — a service deployed here runs AS its attached service account
// automatically, no key ever created or stored anywhere. This service is
// the only thing that talks to the Cloud SQL Admin API; the main app calls
// it over HTTPS with a shared bearer secret instead.
//
// Endpoints mirror src/lib/google-cloud-sql.ts in the main repo — keep
// them in sync if that logic changes.

const express = require('express')
const { google } = require('googleapis')
const { GoogleAuth } = require('google-auth-library')
const { Storage } = require('@google-cloud/storage')

const app = express()
app.use(express.json())

const PORT = process.env.PORT || 8080
const GCP_PROJECT = process.env.GOOGLE_CLOUD_PROJECT || 'wyberai'
const GCP_REGION = process.env.GOOGLE_CLOUD_REGION || 'us-central1'
const BRIDGE_SECRET = process.env.BRIDGE_SECRET

if (!BRIDGE_SECRET) {
  console.error('FATAL: BRIDGE_SECRET is not set. Refusing to start with an unauthenticated bridge.')
  process.exit(1)
}

// Every route except /health requires this. Constant-time-ish compare isn't
// critical here (this guards infra access, not a password login), but a
// plain !== is fine for a high-entropy random secret.
app.use((req, res, next) => {
  if (req.path === '/health') return next()
  const header = req.get('authorization') || ''
  const token = header.startsWith('Bearer ') ? header.slice(7) : ''
  if (token !== BRIDGE_SECRET) return res.status(401).json({ error: 'Unauthorized' })
  next()
})

let sqlAdminClient = null
async function getSqlAdminClient() {
  if (sqlAdminClient) return sqlAdminClient
  const auth = new GoogleAuth({
    scopes: ['https://www.googleapis.com/auth/sqlservice.admin', 'https://www.googleapis.com/auth/cloud-platform'],
  })
  const authClient = await auth.getClient()
  sqlAdminClient = google.sqladmin({ version: 'v1', auth: authClient })
  return sqlAdminClient
}

// Runs under the same ambient Cloud Run service-account identity as the SQL
// admin client above — no key file, same reason. Backs the WyberCode template
// library (src/lib/template-library/ in the main repo): source-of-truth code
// for retrieved page/component templates lives in GCS, Vercel has no ambient
// GCP identity to read it directly, so it goes through this bridge like
// everything else GCP-side.
let storageClient = null
function getStorageClient() {
  if (!storageClient) storageClient = new Storage()
  return storageClient
}

// Bucket names WyberCode templates are allowed to live in — same "reject
// outside our own namespace even if the secret leaks" discipline as
// INSTANCE_NAME_RE above.
const ALLOWED_TEMPLATE_BUCKETS = new Set(
  (process.env.WYBERCODE_TEMPLATE_BUCKETS || 'wyberai-wybercode-templates').split(',').map(s => s.trim()).filter(Boolean)
)
const TEMPLATE_PATH_RE = /^[a-zA-Z0-9/_.-]{1,512}$/

function isValidTemplateRequest(bucket, path) {
  return ALLOWED_TEMPLATE_BUCKETS.has(bucket) && typeof path === 'string' && TEMPLATE_PATH_RE.test(path) && !path.includes('..')
}

function generatePassword() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*'
  let password = ''
  for (let i = 0; i < 24; i++) password += chars.charAt(Math.floor(Math.random() * chars.length))
  return password
}

app.get('/health', (req, res) => res.json({ ok: true }))

// All Cloud SQL instance names created by WyberAI follow this pattern.
// Rejecting anything that doesn't match prevents the bridge from being
// used to provision or delete instances outside of the WyberAI namespace,
// even if BRIDGE_SECRET is compromised.
const INSTANCE_NAME_RE = /^wyberai-[a-z0-9]{8}-[a-z0-9-]{1,40}$/

function isValidInstanceName(name) {
  return typeof name === 'string' && INSTANCE_NAME_RE.test(name)
}

// POST /instances { instanceName, region?, database?, password? }
app.post('/instances', async (req, res) => {
  const { instanceName, region, database, password } = req.body || {}
  if (!instanceName) return res.status(400).json({ error: 'instanceName is required' })
  if (!isValidInstanceName(instanceName)) return res.status(400).json({ error: 'Invalid instanceName format' })

  const finalRegion = region || GCP_REGION
  const finalDatabase = database || 'wyberai_db'
  const finalPassword = password || generatePassword()

  try {
    const sqladminClient = await getSqlAdminClient()
    console.log(`[bridge] Requesting instance creation: ${instanceName}`)

    try {
      const insertRes = await sqladminClient.instances.insert({
        project: GCP_PROJECT,
        requestBody: {
          name: instanceName,
          region: finalRegion,
          databaseVersion: 'POSTGRES_15',
          settings: {
            tier: 'db-f1-micro',
            availabilityType: 'ZONAL',
            backupConfiguration: {
              enabled: true,
              startTime: '03:00',
              transactionLogRetentionDays: 7,
              pointInTimeRecoveryEnabled: true,
              backupRetentionSettings: { retentionUnit: 'COUNT', retainedBackups: 7 },
            },
            ipConfiguration: {
              ipv4Enabled: true,
              authorizedNetworks: [{ name: 'all', value: '0.0.0.0/0' }],
              sslMode: 'ENCRYPTED_ONLY',
            },
            deletionProtectionEnabled: true,
          },
          rootPassword: finalPassword,
        },
      })

      return res.json({
        instanceName, projectId: GCP_PROJECT, region: finalRegion, database: finalDatabase,
        user: 'postgres', password: finalPassword, status: 'provisioning',
        operationName: insertRes.data.name,
      })
    } catch (err) {
      if (!String(err?.message || err).includes('already exists')) throw err

      console.log(`[bridge] Instance already exists, reusing it: ${instanceName}`)
      const existing = await sqladminClient.instances.get({ project: GCP_PROJECT, instance: instanceName })

      if (existing.data.state !== 'RUNNABLE') {
        const opsRes = await sqladminClient.operations.list({ project: GCP_PROJECT, instance: instanceName })
        const latestOp = opsRes.data.items?.[0]
        return res.json({
          instanceName, projectId: GCP_PROJECT, region: finalRegion, database: finalDatabase,
          user: 'postgres', password: finalPassword, status: 'provisioning',
          operationName: latestOp?.name,
        })
      }

      const passwordOpRes = await sqladminClient.users.update({
        project: GCP_PROJECT, instance: instanceName, name: 'postgres',
        requestBody: { password: finalPassword },
      })

      return res.json({
        instanceName, projectId: GCP_PROJECT, region: finalRegion, database: finalDatabase,
        user: 'postgres', password: finalPassword, status: 'provisioning',
        operationName: passwordOpRes.data.name,
      })
    }
  } catch (err) {
    console.error('[bridge] /instances failed:', err)
    return res.status(502).json({ error: 'Failed to provision database on Google Cloud SQL', details: String(err) })
  }
})

// GET /operations/:operationName?instanceName=...&database=...
app.get('/operations/:operationName', async (req, res) => {
  const { operationName } = req.params
  const { instanceName, database } = req.query
  if (!instanceName || !database) return res.status(400).json({ error: 'instanceName and database query params are required' })

  try {
    const sqladminClient = await getSqlAdminClient()
    const opRes = await sqladminClient.operations.get({ project: GCP_PROJECT, operation: operationName })

    if (opRes.data.status !== 'DONE') return res.json({ status: 'provisioning' })

    if (opRes.data.error?.errors?.length) {
      return res.json({ status: 'failed', error: opRes.data.error.errors.map(e => e.message).join('; ') })
    }

    const instanceRes = await sqladminClient.instances.get({ project: GCP_PROJECT, instance: instanceName })
    const publicIp = instanceRes.data.ipAddresses?.find(ip => ip.type === 'PRIMARY')?.ipAddress
    if (!publicIp) return res.json({ status: 'failed', error: 'No public IP assigned to instance' })

    try {
      await sqladminClient.databases.insert({ project: GCP_PROJECT, instance: instanceName, requestBody: { name: database } })
    } catch (err) {
      if (!String(err?.message || err).includes('already exists')) {
        return res.json({ status: 'failed', error: `Failed to create database: ${String(err)}` })
      }
    }

    return res.json({ status: 'ready', host: publicIp, port: 5432, database })
  } catch (err) {
    console.error('[bridge] /operations failed:', err)
    return res.status(502).json({ error: String(err) })
  }
})

// DELETE /instances/:instanceName
app.delete('/instances/:instanceName', async (req, res) => {
  if (!isValidInstanceName(req.params.instanceName)) {
    return res.status(400).json({ error: 'Invalid instanceName format' })
  }
  try {
    const sqladminClient = await getSqlAdminClient()
    console.log(`[bridge] Deleting instance: ${req.params.instanceName}`)
    await sqladminClient.instances.delete({ project: GCP_PROJECT, instance: req.params.instanceName })
    return res.json({ ok: true })
  } catch (err) {
    console.error('[bridge] delete /instances failed:', err)
    return res.status(502).json({ error: String(err) })
  }
})

// GET /instances/:instanceName
app.get('/instances/:instanceName', async (req, res) => {
  if (!isValidInstanceName(req.params.instanceName)) {
    return res.status(400).json({ error: 'Invalid instanceName format' })
  }
  try {
    const sqladminClient = await getSqlAdminClient()
    const result = await sqladminClient.instances.get({ project: GCP_PROJECT, instance: req.params.instanceName })
    return res.json(result.data)
  } catch (err) {
    console.error('[bridge] get /instances failed:', err)
    return res.status(502).json({ error: String(err) })
  }
})

// ── WyberCode template-library storage ─────────────────────────────────────
// Object bodies are plain UTF-8 source text (React/RN source files), so JSON
// in/out is fine — no base64/binary handling needed for this use case.

// GET /storage/object?bucket=...&path=... → { content: string }
app.get('/storage/object', async (req, res) => {
  const { bucket, path } = req.query
  if (!isValidTemplateRequest(bucket, path)) return res.status(400).json({ error: 'Invalid bucket/path' })
  try {
    const [content] = await getStorageClient().bucket(bucket).file(path).download()
    return res.json({ content: content.toString('utf-8') })
  } catch (err) {
    if (String(err?.message || err).includes('No such object')) return res.status(404).json({ error: 'Not found' })
    console.error('[bridge] get /storage/object failed:', err)
    return res.status(502).json({ error: String(err) })
  }
})

// POST /storage/object { bucket, path, content } — create or overwrite one object.
app.post('/storage/object', async (req, res) => {
  const { bucket, path, content } = req.body || {}
  if (!isValidTemplateRequest(bucket, path)) return res.status(400).json({ error: 'Invalid bucket/path' })
  if (typeof content !== 'string') return res.status(400).json({ error: 'content must be a string' })
  try {
    await getStorageClient().bucket(bucket).file(path).save(content, { contentType: 'text/plain; charset=utf-8' })
    return res.json({ ok: true })
  } catch (err) {
    console.error('[bridge] post /storage/object failed:', err)
    return res.status(502).json({ error: String(err) })
  }
})

// GET /storage/list?bucket=...&prefix=... → { paths: string[] }
app.get('/storage/list', async (req, res) => {
  const { bucket, prefix } = req.query
  if (!ALLOWED_TEMPLATE_BUCKETS.has(bucket)) return res.status(400).json({ error: 'Invalid bucket' })
  if (prefix && (!TEMPLATE_PATH_RE.test(prefix) || prefix.includes('..'))) return res.status(400).json({ error: 'Invalid prefix' })
  try {
    const [files] = await getStorageClient().bucket(bucket).getFiles({ prefix: prefix || '' })
    return res.json({ paths: files.map(f => f.name) })
  } catch (err) {
    console.error('[bridge] get /storage/list failed:', err)
    return res.status(502).json({ error: String(err) })
  }
})

app.listen(PORT, () => console.log(`[bridge] listening on :${PORT}`))
