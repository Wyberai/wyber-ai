import type { Incoming } from './upsert'

// Small CSV reader + column mapping for lead lists (Apollo exports, the
// WhatsApp outreach sheet, the master list). Pure; no dependencies.

/** RFC 4180-ish: quoted fields, doubled quotes, commas and newlines inside quotes. */
export function parseCsv(text: string): string[][] {
  const rows: string[][] = []
  let row: string[] = []
  let cur = ''
  let inQ = false
  const src = text.replace(/^﻿/, '')
  for (let i = 0; i < src.length; i++) {
    const ch = src[i]
    if (inQ) {
      if (ch === '"') { if (src[i + 1] === '"') { cur += '"'; i++ } else inQ = false }
      else cur += ch
    } else if (ch === '"') inQ = true
    else if (ch === ',') { row.push(cur); cur = '' }
    else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && src[i + 1] === '\n') i++
      row.push(cur); cur = ''
      if (row.some(c => c.trim() !== '')) rows.push(row)
      row = []
    } else cur += ch
  }
  row.push(cur)
  if (row.some(c => c.trim() !== '')) rows.push(row)
  return rows
}

const norm = (h: string) => h.toLowerCase().replace(/[^a-z0-9]+/g, '')
const COLS: Record<string, string[]> = {
  first: ['firstname', 'first', 'givenname'],
  last: ['lastname', 'last', 'surname', 'familyname'],
  name: ['name', 'fullname', 'contactname', 'contact'],
  email: ['email', 'emailaddress', 'workemail'],
  phone: ['phone', 'phonenumber', 'mobile', 'whatsapp', 'whatsappnumber', 'contactnumber'],
  company: ['company', 'companyname', 'organization', 'organisation', 'business', 'businessname'],
  title: ['title', 'jobtitle', 'jobtitle', 'role', 'designation', 'position'],
  country: ['country'],
  city: ['city', 'location'],
  industry: ['industry', 'category'],
  noteCol: ['notes', 'note', 'comments'],
  // Outreach state, as kept in the WhatsApp tracking sheet.
  sent: ['sent', 'sentdate', 'datesent', 'contacted'],
  replied: ['replied', 'reply'],
  slot: ['slotbooked', 'booked', 'meetingbooked'],
}

/** Non-empty and not an explicit "no". */
const truthy = (v: string) => v.trim() !== '' && !/^(no|n|false|0|-|none)$/i.test(v.trim())

export interface CsvImportOptions { source: string; segment?: string; country?: string; tags?: string[] }

export function csvToIncoming(text: string, opts: CsvImportOptions): { incoming: Incoming[]; headers: string[]; unmapped: string[] } {
  const rows = parseCsv(text)
  if (rows.length < 2) return { incoming: [], headers: rows[0] ?? [], unmapped: [] }
  const headers = rows[0]
  const idx: Record<string, number> = {}
  const mapped = new Set<number>()
  headers.forEach((h, i) => {
    for (const [field, names] of Object.entries(COLS)) {
      if (idx[field] === undefined && names.includes(norm(h))) { idx[field] = i; mapped.add(i) }
    }
  })
  const get = (r: string[], f: string) => (idx[f] === undefined ? '' : (r[idx[f]] ?? '').trim())

  const incoming: Incoming[] = []
  for (const r of rows.slice(1)) {
    const name = get(r, 'name') || [get(r, 'first'), get(r, 'last')].filter(Boolean).join(' ')
    // Whatever outreach already happened carries over, so people you have messaged are not re-queued as new.
    const sent = get(r, 'sent')
    const stage = truthy(get(r, 'slot')) ? 'meeting_booked' : truthy(get(r, 'replied')) ? 'replied' : truthy(sent) ? 'contacted' : undefined
    const sentDate = truthy(sent) && !Number.isNaN(new Date(sent).getTime()) ? new Date(sent).toISOString() : null
    const notes = [get(r, 'noteCol'), get(r, 'city') && `City: ${get(r, 'city')}`, get(r, 'industry') && `Industry: ${get(r, 'industry')}`].filter(Boolean).join(' | ')
    incoming.push({
      name,
      email: get(r, 'email') || null,
      phone: get(r, 'phone') || null,
      company: get(r, 'company') || null,
      title: get(r, 'title') || null,
      country: get(r, 'country') || opts.country || null,
      segment: opts.segment ?? null,
      source: opts.source,
      tags: opts.tags ?? [],
      notes: notes || null,
      stage,
      lastTouchAt: stage ? (sentDate ?? new Date().toISOString()) : null,
    })
  }
  return { incoming, headers, unmapped: headers.filter((_, i) => !mapped.has(i)) }
}
