/**
 * Helper to auto-provision a WyberAI Cloud database for a new project.
 * Called after project creation if user has opted in.
 */

import { createAdminClient } from '@/lib/supabase/server'
import { internalCallHeaders } from '@/lib/internal-auth'

export interface ProvisionOptions {
  projectId: string
  userId: string
  autoProvision?: boolean // if true, skip credit check and provision immediately
}

/**
 * Check if user should auto-provision (has credits, has opted in, etc.)
 */
export async function shouldAutoProvision(userId: string): Promise<boolean> {
  try {
    const admin = await createAdminClient()
    const { data: profile } = await admin
      .from('profiles')
      .select('credits, cloud_auto_provision')
      .eq('id', userId)
      .single()

    return (
      profile?.cloud_auto_provision === true &&
      (profile?.credits ?? 0) >= 5
    )
  } catch {
    return false
  }
}

/**
 * Trigger auto-provisioning for a project.
 * Returns true if successful, false if already provisioned or insufficient credits.
 */
export async function autoProvisionCloudDatabase(options: ProvisionOptions): Promise<{ success: boolean; cloudDatabaseId?: string; reason?: string }> {
  const { projectId, userId, autoProvision } = options

  console.log('[cloud-provision] Starting for project:', projectId, 'user:', userId)

  try {
    // Check if cloud database already exists for this project
    const admin = await createAdminClient()
    const { data: existing } = await admin
      .from('cloud_databases')
      .select('id')
      .eq('wyber_project_id', projectId)
      .maybeSingle()

    if (existing) {
      console.log('[cloud-provision] Already provisioned')
      return { success: false, reason: 'already-provisioned' }
    }

    // Check credits unless force flag set
    if (!autoProvision) {
      const { data: profile } = await admin
        .from('profiles')
        .select('credits')
        .eq('id', userId)
        .single()

      console.log('[cloud-provision] User credits:', profile?.credits)
      if (!profile || profile.credits < 5) {
        console.log('[cloud-provision] Insufficient credits')
        return { success: false, reason: 'insufficient-credits' }
      }
    }

    // Trigger provisioning via the /api/cloud/create-database endpoint
    console.log('[cloud-provision] Calling /api/cloud/create-database...')
    console.log('[cloud-provision] APP_URL:', process.env.NEXT_PUBLIC_APP_URL)
    console.log('[cloud-provision] CRON_SECRET set:', !!process.env.CRON_SECRET)

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const url = `${appUrl}/api/cloud/create-database`
    console.log('[cloud-provision] Fetching:', url)

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...internalCallHeaders(userId) },
      body: JSON.stringify({ projectId }),
    })

    console.log('[cloud-provision] Response status:', response.status)
    const result = await response.json()
    console.log('[cloud-provision] Response body:', result)

    if (!response.ok) {
      console.error('[cloud-provision] API error:', result.error || result)
      return { success: false, reason: result.error || 'provisioning-failed' }
    }

    console.log('[cloud-provision] SUCCESS! Database ID:', result.cloudDatabaseId)
    return {
      success: true,
      cloudDatabaseId: result.cloudDatabaseId,
    }
  } catch (err) {
    console.error('[cloud-provision] EXCEPTION:', err)
    return { success: false, reason: 'provisioning-error' }
  }
}
