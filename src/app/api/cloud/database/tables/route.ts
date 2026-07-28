import { NextRequest } from 'next/server'
import { getPostgresConnection } from '@/lib/database/postgres'
import { getCloudDatabaseCredentials } from '@/lib/cloud/get-db-credentials'
import { withCloudMiddleware } from '@/lib/cloud/middleware'
import { CloudError, classifyDatabaseError, Validation } from '@/lib/cloud/errors'

export async function GET(req: NextRequest) {
  return withCloudMiddleware(
    req,
    async (context) => {
      const { projectId } = context
      Validation.requireProjectId(projectId)

      // Get cloud database credentials (with decrypted password)
      const credentials = await getCloudDatabaseCredentials(projectId, context.userId)
      if (!credentials) {
        throw new CloudError({
          code: 'NOT_FOUND',
          message: 'Database credentials not found',
        })
      }

      // Validate credentials
      Validation.requireCredentials(
        credentials.host,
        credentials.port,
        credentials.user,
        credentials.database
      )

      let connection
      try {
        // Connect to user's database
        connection = await getPostgresConnection(credentials)
      } catch (err) {
        throw new CloudError({
          code: 'DB_CONNECTION_ERROR',
          message: 'Failed to connect to database',
          details: String(err),
        })
      }

      try {
        // Get all tables in information_schema
        const result = await connection.query(`
          SELECT
            tablename as name,
            schemaname as schema
          FROM pg_tables
          WHERE schemaname NOT IN ('pg_catalog', 'information_schema')
          ORDER BY tablename
        `)

        const tables = result.rows || []

        // Get row counts for each table (in parallel)
        const tablesWithCounts = await Promise.all(
          tables.map(async (table) => {
            try {
              const countConn = await getPostgresConnection(credentials)
              try {
                const countResult = await countConn.query(
                  `SELECT COUNT(*) as count FROM "${table.schema}"."${table.name}"`
                )
                return {
                  ...table,
                  rowCount: parseInt(countResult.rows[0]?.count || '0', 10),
                }
              } finally {
                await countConn.end()
              }
            } catch (err) {
              // Return table without row count if query fails
              console.warn(`[cloud/database/tables] Failed to count rows for ${table.name}:`, err)
              return { ...table, rowCount: null }
            }
          })
        )

        return {
          tables: tablesWithCounts,
          count: tablesWithCounts.length,
        }
      } catch (err) {
        const errorCode = classifyDatabaseError(err)
        throw new CloudError({
          code: errorCode,
          message: `Failed to fetch tables: ${String(err)}`,
          details: process.env.NODE_ENV === 'development' ? err : undefined,
        })
      } finally {
        await connection?.end()
      }
    },
    {
      rateLimit: 'info',
      requireProjectId: true,
    }
  )
}
