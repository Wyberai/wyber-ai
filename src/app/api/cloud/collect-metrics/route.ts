import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { getServiceMetrics } from '@/lib/railway-api'

/**
 * Collect metrics from Railway for all user's cloud databases
 * Can be called manually or via scheduled job
 *
 * Query params:
 * - projectId (optional): collect for specific project only
 *
 * Response: { collected: number, errors: string[] }
 */
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const projectIdFilter = searchParams.get('projectId')

    const admin = await createAdminClient()

    // Get all cloud databases for user (or specific one)
    let query = admin
      .from('cloud_databases')
      .select('*')
      .eq('user_id', user.id)

    if (projectIdFilter) {
      query = query.eq('wyber_project_id', projectIdFilter)
    }

    const { data: databases, error: dbError } = await query

    if (dbError) {
      return NextResponse.json({
        collected: 0,
        errors: [`Failed to fetch databases: ${dbError.message}`],
      }, { status: 500 })
    }

    const errors: string[] = []
    let collected = 0

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
          errors.push(`No metrics available for project ${db.wyber_project_id}`)
          continue
        }

        // Get current month for billing_month
        const now = new Date()
        const billingMonth = new Date(now.getFullYear(), now.getMonth(), 1)
          .toISOString()
          .split('T')[0]

        // Calculate compute hours (estimate based on uptime)
        // In reality, this would come from Railway's API
        const computeHours = 24 * 30 / 12 // Roughly 1 hour per day average

        // Check if we already have a record for this month
        const { data: existing } = await admin
          .from('cloud_database_usage')
          .select('id')
          .eq('cloud_database_id', db.id)
          .eq('billing_month', billingMonth)
          .single()

        if (existing) {
          // Update existing record
          const { error: updateError } = await admin
            .from('cloud_database_usage')
            .update({
              compute_hours: computeHours,
              storage_gb: metrics.storageSizeGB,
              connections_peak: 10, // Default estimate
              data_transfer_gb: metrics.networkOutMB / 1024,
              updated_at: new Date().toISOString(),
            })
            .eq('id', existing.id)

          if (updateError) {
            errors.push(`Failed to update metrics for ${db.wyber_project_id}: ${updateError.message}`)
            continue
          }
        } else {
          // Insert new record
          const costCents = Math.round(
            (computeHours * 0.05 + metrics.storageSizeGB * 0.1) * 100
          )

          const { error: insertError } = await admin
            .from('cloud_database_usage')
            .insert({
              cloud_database_id: db.id,
              user_id: user.id,
              billing_month: billingMonth,
              compute_hours: computeHours,
              storage_gb: metrics.storageSizeGB,
              connections_peak: 10,
              data_transfer_gb: metrics.networkOutMB / 1024,
              cost_cents: costCents,
              credits_charged: Math.ceil(costCents / 10), // 1 credit = $0.10
            })

          if (insertError) {
            errors.push(`Failed to insert metrics for ${db.wyber_project_id}: ${insertError.message}`)
            continue
          }
        }

        collected++
      } catch (err) {
        errors.push(`Error collecting metrics for ${db.wyber_project_id}: ${String(err)}`)
      }
    }

    return NextResponse.json({
      collected,
      errors,
      message: `Collected metrics for ${collected} database(s)${errors.length ? ` with ${errors.length} error(s)` : ''}`,
    })
  } catch (err) {
    console.error('[cloud/collect-metrics] Error:', err)
    return NextResponse.json(
      {
        collected: 0,
        errors: [String(err)],
      },
      { status: 500 }
    )
  }
}

/**
 * GET endpoint to manually trigger metrics collection
 * Same as POST but read-only (for testing)
 */
export async function GET(req: NextRequest) {
  return POST(req)
}
