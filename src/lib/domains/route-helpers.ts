import { NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { getProvider, inrPerUsd } from './index'
import { supabaseStore } from './store'

export async function requireUser() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

export const unauthorized = () => NextResponse.json({ error: 'Please sign in' }, { status: 401 })
export const notConfigured = () => NextResponse.json({ error: 'Domains are not available yet' }, { status: 503 })

export async function context() {
  const provider = getProvider()
  if (!provider) return null
  const admin = await createAdminClient()
  return { provider, admin, store: supabaseStore(admin), inr: inrPerUsd() }
}
