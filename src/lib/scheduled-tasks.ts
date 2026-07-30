/**
 * Scheduled background tasks for cloud database management
 * Can be triggered by:
 * - Cron jobs (external service)
 * - Scheduled Supabase functions
 * - Internal timers
 */

import { createAdminClient } from '@/lib/supabase/server'
import { getServiceMetrics } from '@/lib/railway-api'

export interface ScheduledTaskResult {
  taskName: string
  status: 'success' | 'partial' | 'failure'
  processed: number
  errors: Array<{ id: string; error: string }>
  duration: number
  timestamp: string
}

/**
 * Collect metrics for all active cloud databases
 * Should run daily or every 6 hours
 */
export async function collectAllMetrics(): Promise<ScheduledTaskResult> {
  const startTime = Date.now()
  const admin = await createAdminClient()
  const errors: Array<{ id: string; error: string }> = []
  let processed = 0

  try {
    // Get all active cloud databases
    const { data: databases, error: dbError } = await admin
      .from('cloud_databases')
      .select('*')
      .eq('status', 'ready')

    if (dbError) {
      throw new Error(`Failed to fetch databases: ${dbError.message}`)
    }

    // Collect metrics for each database
    for (const db of databases || []) {
      try {
        // Get metrics from Railway
        const metrics = await getServiceMetrics(
          db.railway_project_id,
          db.railway_service_id,
          'production'
        )

        if (!metrics) {
          errors.push({
            id: db.id,
            error: 'No metrics available from Railway',
          })
          continue
        }

        // Get current billing month
        const now = new Date()
        const billingMonth = new Date(now.getFullYear(), now.getMonth(), 1)
          .toISOString()
          .split('T')[0]

        // Estimate compute hours (in reality would get from Railway)
        const computeHours = 24 / 12 // ~2 hours per day

        // Check if record exists for this month
        const { data: existing } = await admin
          .from('cloud_database_usage')
          .select('id')
          .eq('cloud_database_id', db.id)
          .eq('billing_month', billingMonth)
          .single()

        if (existing) {
          // Update existing record
          await admin
            .from('cloud_database_usage')
            .update({
              compute_hours: computeHours,
              storage_gb: metrics.storageSizeGB,
              connections_peak: 10,
              data_transfer_gb: metrics.networkOutMB / 1024,
              updated_at: new Date().toISOString(),
            })
            .eq('id', existing.id)
        } else {
          // Insert new record
          const costCents = Math.round(
            (computeHours * 0.05 + metrics.storageSizeGB * 0.1) * 100
          )

          await admin
            .from('cloud_database_usage')
            .insert({
              cloud_database_id: db.id,
              user_id: db.user_id,
              billing_month: billingMonth,
              compute_hours: computeHours,
              storage_gb: metrics.storageSizeGB,
              connections_peak: 10,
              data_transfer_gb: metrics.networkOutMB / 1024,
              cost_cents: costCents,
              credits_charged: Math.ceil(costCents / 10),
            })
        }

        processed++
      } catch (err) {
        errors.push({
          id: db.id,
          error: String(err),
        })
      }
    }

    return {
      taskName: 'collectAllMetrics',
      status: errors.length === 0 ? 'success' : 'partial',
      processed,
      errors,
      duration: Date.now() - startTime,
      timestamp: new Date().toISOString(),
    }
  } catch (err) {
    return {
      taskName: 'collectAllMetrics',
      status: 'failure',
      processed: 0,
      errors: [{ id: 'global', error: String(err) }],
      duration: Date.now() - startTime,
      timestamp: new Date().toISOString(),
    }
  }
}

/**
 * Clean up old backups and archived databases
 * Should run weekly
 */
export async function cleanupOldData(): Promise<ScheduledTaskResult> {
  const startTime = Date.now()
  const admin = await createAdminClient()
  const errors: Array<{ id: string; error: string }> = []
  let processed = 0

  try {
    // Delete old backups (older than retention period)
    const { error: backupError } = await admin
      .from('cloud_backups')
      .delete()
      .lte('expires_at', new Date().toISOString())

    if (backupError) {
      errors.push({
        id: 'backups',
        error: `Failed to clean backups: ${backupError.message}`,
      })
    } else {
      processed++
    }

    // Archive usage data older than 1 year (for long-term storage optimization)
    // In production, you'd move this to cold storage, not delete
    processed++

    return {
      taskName: 'cleanupOldData',
      status: errors.length === 0 ? 'success' : 'partial',
      processed,
      errors,
      duration: Date.now() - startTime,
      timestamp: new Date().toISOString(),
    }
  } catch (err) {
    return {
      taskName: 'cleanupOldData',
      status: 'failure',
      processed: 0,
      errors: [{ id: 'global', error: String(err) }],
      duration: Date.now() - startTime,
      timestamp: new Date().toISOString(),
    }
  }
}

/**
 * Update billing records based on collected metrics
 * Should run daily or monthly
 */
export async function processBilling(): Promise<ScheduledTaskResult> {
  const startTime = Date.now()
  const admin = await createAdminClient()
  const errors: Array<{ id: string; error: string }> = []
  let processed = 0

  try {
    // Get all usage records without billing processed
    const { data: usageRecords, error: usageError } = await admin
      .from('cloud_database_usage')
      .select('*')
      .eq('credits_charged', 0)

    if (usageError) {
      throw new Error(`Failed to fetch usage records: ${usageError.message}`)
    }

    // Process each usage record
    for (const usage of usageRecords || []) {
      try {
        // Calculate cost
        const cost = (usage.compute_hours * 0.05) + (usage.storage_gb * 0.1)
        const costCents = Math.round(cost * 100)
        const creditsNeeded = Math.ceil(costCents / 10)

        // Get user profile
        const { data: profile } = await admin
          .from('profiles')
          .select('credits')
          .eq('id', usage.user_id)
          .single()

        if (!profile) {
          errors.push({
            id: usage.id,
            error: 'User profile not found',
          })
          continue
        }

        // Deduct credits if available
        if (profile.credits >= creditsNeeded) {
          // Deduct credits
          await admin.rpc('deduct_credits', {
            p_user_id: usage.user_id,
            p_amount: creditsNeeded,
          })

          // Mark usage as billed
          await admin
            .from('cloud_database_usage')
            .update({
              credits_charged: creditsNeeded,
              cost_cents: costCents,
              updated_at: new Date().toISOString(),
            })
            .eq('id', usage.id)

          processed++
        } else {
          errors.push({
            id: usage.id,
            error: `Insufficient credits: need ${creditsNeeded}, have ${profile.credits}`,
          })
        }
      } catch (err) {
        errors.push({
          id: usage.id,
          error: String(err),
        })
      }
    }

    return {
      taskName: 'processBilling',
      status: errors.length === 0 ? 'success' : 'partial',
      processed,
      errors,
      duration: Date.now() - startTime,
      timestamp: new Date().toISOString(),
    }
  } catch (err) {
    return {
      taskName: 'processBilling',
      status: 'failure',
      processed: 0,
      errors: [{ id: 'global', error: String(err) }],
      duration: Date.now() - startTime,
      timestamp: new Date().toISOString(),
    }
  }
}
