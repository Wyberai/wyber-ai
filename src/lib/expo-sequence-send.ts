import { deliver, type SeqKind } from '@/lib/expo-sequence'
import { sendExpoSequenceEmail } from '@/lib/email'

// Kill switch: set EXPO_SEQUENCE_DISABLED=true on Vercel to stop every expo email.
export function expoSequenceDisabled(): boolean {
  return process.env.EXPO_SEQUENCE_DISABLED === 'true'
}

export interface ExpoLeadRow {
  id: string
  name: string
  email: string
  preferred_day: string | null
  pain_point: string
}

// Minimal shape of the supabase admin client used here (keeps this testable).
type Admin = { from: (table: string) => any }

/** Claim-then-send one sequence email. Never throws. */
export async function deliverExpoEmail(admin: Admin, lead: ExpoLeadRow, kind: SeqKind): Promise<'sent' | 'skipped' | 'failed'> {
  try {
    return await deliver(lead.id, kind, {
      claim: async (leadId, k) => {
        const { error } = await admin.from('expo_lead_emails').insert({ lead_id: leadId, kind: k })
        if (!error) return true
        // 23505 = already claimed (normal). Anything else (e.g. table missing):
        // do NOT send, since without the lock we could double-send.
        if (error.code !== '23505') console.error('[expo-sequence] claim failed, not sending:', error.message)
        return false
      },
      release: async (leadId, k) => {
        await admin.from('expo_lead_emails').delete().eq('lead_id', leadId).eq('kind', k)
      },
      send: async (k) => {
        await sendExpoSequenceEmail(k, lead.email, { name: lead.name, day: lead.preferred_day, painPoint: lead.pain_point })
      },
    })
  } catch (err) {
    console.error('[expo-sequence] unexpected error:', err)
    return 'failed'
  }
}
