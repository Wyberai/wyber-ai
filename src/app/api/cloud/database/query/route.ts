import { NextRequest } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { getPostgresConnection } from '@/lib/database/postgres'
import { getCloudDatabaseCredentials } from '@/lib/cloud/get-db-credentials'
import { withCloudMiddleware } from '@/lib/cloud/middleware'
import { CloudError, classifyDatabaseError, Validation } from '@/lib/cloud/errors'

export async function POST(req: NextRequest) {
  return withCloudMiddleware(
    req,
    async (context) => {
      const { projectId } = context
      Validation.requireProjectId(projectId)

      const body = await req.json()
      const query = Validation.requireSQL(body.query)

      // Validate query - only allow SELECT, INSERT, UPDATE, DELETE for safety
      const upperQuery = query.toUpperCase()
      if (!['SELECT', 'INSERT', 'UPDATE', 'DELETE'].some(op => upperQuery.startsWith(op))) {
        throw new CloudError({
          code: 'INVALID_REQUEST',
          message: 'Only SELECT, INSERT, UPDATE, DELETE queries allowed',
        })
      }

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
        // Execute query
        const result = await connection.query(query)

        // Log the query — best-effort, must never fail the actual query response.
        try {
          const admin = await createAdminClient()
          const { error: logInsertErr } = await admin
            .from('cloud_query_logs')
            .insert({
              user_id: context.userId,
              wyber_project_id: projectId,
              query: query.substring(0, 1000),
              type: upperQuery.split(/\s+/)[0] as 'SELECT' | 'INSERT' | 'UPDATE' | 'DELETE',
              rows_affected: result.rowCount || 0,
              executed_at: new Date().toISOString(),
            })
          if (logInsertErr) {
            console.warn('[cloud/database/query] Failed to log query:', logInsertErr)
          }
        } catch (logErr) {
          console.warn('[cloud/database/query] Failed to log query:', logErr)
        }

        return {
          rows: result.rows || [],
          rowCount: result.rowCount || 0,
          fields: result.fields || [],
          executedAt: new Date().toISOString(),
        }
      } catch (err) {
        const errorCode = classifyDatabaseError(err)
        throw new CloudError({
          code: errorCode,
          message: `Query execution failed: ${String(err)}`,
          details: process.env.NODE_ENV === 'development' ? err : undefined,
        })
      } finally {
        await connection?.end()
      }
    },
    {
      rateLimit: 'query',
      requireProjectId: true,
    }
  )
}
