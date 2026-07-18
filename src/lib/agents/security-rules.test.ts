import { describe, it, expect, beforeEach } from 'vitest'
import { reviewEmittedFile, findTablesWithoutRls, resetFindingIds } from './security-rules'

beforeEach(() => resetFindingIds())

describe('Sentinel security rules', () => {
  describe('rule 1 — secret literals', () => {
    it('flags a hardcoded Stripe live key as critical + blocking', () => {
      const findings = reviewEmittedFile(
        'src/lib/payments.ts',
        `const key = "sk_live_${'a'.repeat(24)}"`,
        '',
      )
      expect(findings.some(f => f.ruleId === 'secret-literal' && f.blocking && f.severity === 'critical')).toBe(true)
    })

    it('does not flag clean code', () => {
      const findings = reviewEmittedFile(
        'src/lib/payments.ts',
        `const key = import.meta.env.VITE_STRIPE_KEY`,
        '',
      )
      expect(findings.filter(f => f.ruleId === 'secret-literal')).toHaveLength(0)
    })
  })

  describe('rule 2 — service-role in client code', () => {
    it('flags SUPABASE_SERVICE_ROLE_KEY references in a code file', () => {
      const findings = reviewEmittedFile(
        'src/lib/supabase.ts',
        `createClient(url, process.env.SUPABASE_SERVICE_ROLE_KEY)`,
        '',
      )
      const f = findings.find(f => f.ruleId === 'service-role-client')
      expect(f?.blocking).toBe(true)
      expect(f?.severity).toBe('critical')
    })

    it('ignores service_role mentions in SQL policies (not a code file)', () => {
      const sql = `create policy "svc" on logs for select to service_role using (true);`
      const findings = reviewEmittedFile('schema.sql', sql, '')
      expect(findings.filter(f => f.ruleId === 'service-role-client')).toHaveLength(0)
    })
  })

  describe('rule 3 — SQL missing RLS', () => {
    const CREATE = `create table if not exists orders (
      id uuid primary key default gen_random_uuid(),
      user_id uuid not null,
      total numeric
    );`

    it('flags a created table with no RLS anywhere in emitted SQL', () => {
      const findings = reviewEmittedFile('schema.sql', CREATE, '')
      const f = findings.find(f => f.ruleId === 'sql-missing-rls')
      expect(f?.blocking).toBe(true)
      expect(f?.detail).toContain('orders')
    })

    it('passes when RLS + a policy exist (even in previously emitted SQL)', () => {
      const prior = `alter table orders enable row level security;
        create policy "own orders" on orders for all using (auth.uid() = user_id);`
      const findings = reviewEmittedFile('schema.sql', CREATE, prior)
      expect(findings.filter(f => f.ruleId === 'sql-missing-rls')).toHaveLength(0)
    })

    it('still flags when RLS is enabled but no policy exists', () => {
      const sql = `${CREATE}\nalter table orders enable row level security;`
      expect(findTablesWithoutRls(sql)).toEqual(['orders'])
    })

    it('handles quoted/schema-prefixed identifiers', () => {
      const sql = `create table public."Tasks" (id int);
        alter table public."Tasks" enable row level security;
        create policy p on public."Tasks" using (true);`
      expect(findTablesWithoutRls(sql)).toEqual([])
    })

    it('detects create table inside a code file comment block', () => {
      const code = `/* SQL TO RUN IN SUPABASE DASHBOARD
        create table notes (id uuid primary key, body text);
      */
      export const x = 1`
      const findings = reviewEmittedFile('src/App.tsx', code, '')
      expect(findings.some(f => f.ruleId === 'sql-missing-rls' && f.detail.includes('notes'))).toBe(true)
    })
  })

  describe('rule 4 — unauthenticated mutations (advisory)', () => {
    it('flags inserts with no auth reference, non-blocking', () => {
      const findings = reviewEmittedFile(
        'src/lib/db.ts',
        `export const addRow = (v) => supabase.from('rows').insert(v)`,
        '',
      )
      const f = findings.find(f => f.ruleId === 'unauthed-mutation')
      expect(f).toBeTruthy()
      expect(f?.blocking).toBe(false)
    })

    it('passes when auth is referenced in the same file', () => {
      const findings = reviewEmittedFile(
        'src/lib/db.ts',
        `const { data: { user } } = await supabase.auth.getUser();
         await supabase.from('rows').insert({ ...v, user_id: user.id })`,
        '',
      )
      expect(findings.filter(f => f.ruleId === 'unauthed-mutation')).toHaveLength(0)
    })
  })

  describe('rule 5 — unsafe HTML/eval (advisory)', () => {
    it('flags dangerouslySetInnerHTML with dynamic input', () => {
      const findings = reviewEmittedFile(
        'src/components/Post.tsx',
        `<div dangerouslySetInnerHTML={{ __html: post.body }} />`,
        '',
      )
      expect(findings.some(f => f.ruleId === 'unsafe-html' && !f.blocking)).toBe(true)
    })

    it('does not flag literal HTML or unrelated eval-like names', () => {
      const findings = reviewEmittedFile(
        'src/components/Post.tsx',
        `<div dangerouslySetInnerHTML={{ __html: "<b>hi</b>" }} />; const reevaluate = () => {}; reevaluate()`,
        '',
      )
      expect(findings.filter(f => f.ruleId === 'unsafe-html')).toHaveLength(0)
    })
  })

  it('patch mode runs only the secret/service-role rules', () => {
    const patchContent = `supabase.from('rows').insert(v); create table x (id int);
      const k = process.env.SUPABASE_SERVICE_ROLE_KEY`
    const findings = reviewEmittedFile('src/lib/db.ts', patchContent, '', { patch: true })
    expect(findings.map(f => f.ruleId)).toEqual(['service-role-client'])
  })

  it('uses a caller-supplied id generator when provided', () => {
    let n = 100
    const findings = reviewEmittedFile(
      'src/lib/supabase.ts',
      `createClient(url, process.env.SUPABASE_SERVICE_ROLE_KEY)`,
      '',
      { nextId: () => `sec-${++n}` },
    )
    expect(findings[0].findingId).toBe('sec-101')
  })

  it('assigns unique finding ids', () => {
    const findings = reviewEmittedFile(
      'src/lib/bad.ts',
      `const a = "sk_live_${'a'.repeat(24)}"; supabase.from('x').insert({})`,
      '',
    )
    const ids = findings.map(f => f.findingId)
    expect(new Set(ids).size).toBe(ids.length)
  })
})
