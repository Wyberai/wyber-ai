import { NextRequest, NextResponse } from 'next/server'
import { collectAllMetrics, cleanupOldData, processBilling, ScheduledTaskResult } from '@/lib/scheduled-tasks'

/**
 * Cron endpoint for scheduled background tasks
 *
 * Protected by CRON_SECRET environment variable (same as Vercel's cron job auth)
 * Call from: Vercel Cron, external cron service, or internal scheduler
 *
 * Query params:
 * - task: 'metrics' | 'cleanup' | 'billing' | 'all' (default: 'all')
 */
export async function POST(req: NextRequest) {
  try {
    // Verify cron secret
    const authHeader = req.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET

    if (!cronSecret || !authHeader || authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { error: 'Unauthorized - invalid CRON_SECRET' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(req.url)
    const task = searchParams.get('task') || 'all'

    const results: ScheduledTaskResult[] = []

    // Run requested tasks
    if (task === 'metrics' || task === 'all') {
      const result = await collectAllMetrics()
      results.push(result)
    }

    if (task === 'cleanup' || task === 'all') {
      const result = await cleanupOldData()
      results.push(result)
    }

    if (task === 'billing' || task === 'all') {
      const result = await processBilling()
      results.push(result)
    }

    // Check for overall success
    const hasFailures = results.some(r => r.status === 'failure')
    const hasErrors = results.some(r => r.errors.length > 0)

    return NextResponse.json(
      {
        success: !hasFailures,
        tasks: results,
        summary: {
          tasksRun: results.length,
          totalProcessed: results.reduce((sum, r) => sum + r.processed, 0),
          totalErrors: results.reduce((sum, r) => sum + r.errors.length, 0),
          hasPartialFailures: hasErrors && !hasFailures,
        },
        timestamp: new Date().toISOString(),
      },
      { status: hasFailures ? 500 : 200 }
    )
  } catch (err) {
    console.error('[cron/tasks] Unhandled error:', err)
    return NextResponse.json(
      {
        success: false,
        error: String(err),
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    )
  }
}

/**
 * GET endpoint for manual testing
 * Same as POST, requires CRON_SECRET
 */
export async function GET(req: NextRequest) {
  return POST(req)
}
