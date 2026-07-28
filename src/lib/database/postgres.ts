import { Pool, Client } from 'pg'

const pools = new Map<string, Pool>()

interface ConnectionConfig {
  host: string
  port: number
  database: string
  user: string
  password: string
}

function getPoolKey(config: ConnectionConfig): string {
  return `${config.user}@${config.host}:${config.port}/${config.database}`
}

export async function getPostgresConnection(config: ConnectionConfig) {
  const key = getPoolKey(config)

  // Reuse existing pool or create new one
  if (!pools.has(key)) {
    const pool = new Pool({
      host: config.host,
      port: config.port,
      database: config.database,
      user: config.user,
      password: config.password,
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
      // Cloud SQL instances are created with requireSsl — Cloud SQL uses a
      // self-signed CA per-instance, so we encrypt but don't verify the
      // chain against a public CA root.
      ssl: { rejectUnauthorized: false },
    })

    // Handle pool errors
    pool.on('error', (err) => {
      console.error('Unexpected error on idle client', err)
      pools.delete(key)
    })

    pools.set(key, pool)
  }

  const pool = pools.get(key)!
  const client = await pool.connect()

  return {
    query: async (text: string, values?: any[]) => {
      try {
        return await client.query(text, values)
      } catch (err) {
        console.error('Query error:', err)
        throw err
      }
    },
    end: async () => {
      client.release()
    }
  }
}

export async function closeAllConnections() {
  for (const pool of pools.values()) {
    await pool.end()
  }
  pools.clear()
}
