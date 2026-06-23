import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY!)

// Wyber-owned default domain for employee mailboxes. Enterprise customers can
// override per-employee with a delegated domain (stored in ai_employees.email_domain).
export const DEFAULT_EMPLOYEE_DOMAIN =
  process.env.EMPLOYEE_EMAIL_DOMAIN ?? 'employees.wyberai.com'

// Turn "Marcus Sutar" → "marcus-sutar" (handle) / "marcus.sutar" (email local part).
function slugify(name: string, sep: string): string {
  const stripped = name
    .toLowerCase()
    .normalize('NFKD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/[^a-z0-9]+/g, sep)
  return stripped.replace(new RegExp(`^\\${sep}+|\\${sep}+$`, 'g'), '') || 'employee'
}

// Short, unambiguous id (no 0/o/1/l) to keep addresses unique across customers
// without making them ugly.
function shortId(len = 4): string {
  const alphabet = 'abcdefghjkmnpqrstuvwxyz23456789'
  let out = ''
  for (let i = 0; i < len; i++) out += alphabet[Math.floor(Math.random() * alphabet.length)]
  return out
}

export interface EmailIdentity {
  email_local: string
  email_domain: string
  email_address: string
  handle: string
}

// Build a fresh identity for a newly hired employee. The caller is responsible
// for persisting it and for retrying on the (rare) unique-constraint collision.
export function buildEmailIdentity(
  name: string,
  domain: string = DEFAULT_EMPLOYEE_DOMAIN,
): EmailIdentity {
  const base = slugify(name, '.')
  const id = shortId()
  const local = `${base}.${id}`
  return {
    email_local: local,
    email_domain: domain,
    email_address: `${local}@${domain}`,
    handle: `${slugify(name, '-')}-${id}`,
  }
}

export interface SendAsEmployeeArgs {
  fromName: string          // display name, e.g. "Marcus Sutar"
  fromAddress: string       // the employee's own address
  to: string | string[]
  subject: string
  text?: string
  html?: string
  inReplyTo?: string        // Message-ID of the email being replied to (threading)
  references?: string
}

// Send mail AS the employee, from its own address. Requires the employee domain
// to be verified for sending in Resend (SPF/DKIM) — otherwise Resend rejects it.
export async function sendAsEmployee(args: SendAsEmployeeArgs) {
  const headers: Record<string, string> = {}
  if (args.inReplyTo) {
    headers['In-Reply-To'] = args.inReplyTo
    headers['References'] = args.references ?? args.inReplyTo
  }
  // Resend's CreateEmailOptions is a union requiring text OR html; ensure at least
  // one is present, then satisfy the type.
  const text = args.text ?? (args.html ? undefined : '')
  return resend.emails.send({
    from: `${args.fromName} <${args.fromAddress}>`,
    to: args.to,
    subject: args.subject,
    text,
    html: args.html,
    headers: Object.keys(headers).length ? headers : undefined,
  } as Parameters<typeof resend.emails.send>[0])
}
