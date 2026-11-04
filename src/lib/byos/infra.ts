/**
 * The honest boundary of BYOS. Every feature of the tool a visitor wants to
 * replace is placed in exactly one bucket, and the buckets are blunt:
 *
 *   build    - we write it, it runs on the app + database we build.
 *   provider - we write all the code, but it only works on an outside service
 *              the owner signs up for and pays directly (Amazon SES for bulk
 *              email, Twilio for SMS, a video host, an AI model...).
 *   lite     - we build a deliberately simpler version; the note says what is cut.
 *   cant     - we won't pretend. The note says why.
 *
 * The model only chooses `fit` (build/lite/cant) and `needs` (kinds from this
 * file). What each kind MEANS (provider, who does what, what it costs) is fixed
 * here, in code, so the model can't hand-wave an infrastructure requirement away.
 */

export type Fit = 'build' | 'provider' | 'lite' | 'cant'
export type ModelFit = 'build' | 'lite' | 'cant'

export const INFRA_KINDS = [
  'email-transactional', 'email-sending', 'sms-whatsapp', 'voice-telephony', 'video-calls', 'video-hosting',
  'transcription', 'ai-model', 'payments', 'calendar-oauth', 'email-inbox-sync', 'sso-enterprise',
  'maps-geo', 'push-notifications',
] as const
export type NeedKind = (typeof INFRA_KINDS)[number]

export interface InfraInfo {
  /** Short label for the requirement, e.g. "Bulk email sending". */
  label: string
  /** What the owner signs up for. */
  provider: string
  alternatives: string[]
  weBuild: string
  youSetUp: string[]
  cost: string
}

export const INFRA: Record<NeedKind, InfraInfo> = {
  'email-transactional': {
    label: 'Sending notification emails',
    provider: 'Resend',
    alternatives: ['Postmark', 'Amazon SES'],
    weBuild: 'The templates and triggers for receipts, confirmations, reminders and alerts, and the code that sends them.',
    youSetUp: ['An account with the email service and your sending domain verified (SPF and DKIM records)'],
    cost: 'Free allowance, then pennies per thousand emails. Billed by the provider.',
  },
  'email-sending': {
    label: 'Bulk email campaigns',
    provider: 'Amazon SES',
    alternatives: ['Resend', 'Postmark', 'SendGrid'],
    weBuild: 'Composer, templates, lists and segments, scheduling, open and click tracking screens, unsubscribe handling.',
    youSetUp: [
      'An AWS account with SES enabled',
      'Verify your sending domain (SPF and DKIM records)',
      'Request production access: new SES accounts start in a sandbox that only sends to verified addresses',
      'Handle bounces and complaints, or your sending reputation suffers',
    ],
    cost: 'Pay per email sent, pennies per thousand. Billed by the provider, not us.',
  },
  'sms-whatsapp': {
    label: 'SMS and WhatsApp messaging',
    provider: 'Twilio',
    alternatives: ['MSG91', 'Vonage', 'WhatsApp Cloud API'],
    weBuild: 'Message composer, contact lists, templates, delivery status screens, opt-out handling.',
    youSetUp: [
      'A provider account and a sending number',
      'Sender registration the carriers require (for example 10DLC in the US, DLT in India)',
      'Business verification for WhatsApp',
    ],
    cost: 'Pay per message. Billed by the provider.',
  },
  'voice-telephony': {
    label: 'Phone calls',
    provider: 'Twilio',
    alternatives: ['Telnyx', 'Vonage'],
    weBuild: 'Call logs, click-to-call screens, call notes, routing rules in the interface.',
    youSetUp: ['A provider account and phone numbers', 'Local telephony and recording-consent compliance'],
    cost: 'Pay per minute plus number rental. Billed by the provider.',
  },
  'video-calls': {
    label: 'Live video meetings',
    provider: 'Daily',
    alternatives: ['LiveKit', 'Zoom or Google Meet links through their APIs'],
    weBuild: 'Scheduling, room pages, invites and the controls around the provider video component.',
    youSetUp: ['A video provider account and API key'],
    cost: 'Pay per participant-minute. Billed by the provider.',
  },
  'video-hosting': {
    label: 'Storing and streaming video',
    provider: 'Mux',
    alternatives: ['Cloudflare Stream', 'Amazon S3 with CloudFront'],
    weBuild: 'In-browser recorder, upload, share pages, player, comments and view tracking.',
    youSetUp: ['A video hosting account', 'A storage and bandwidth budget you watch yourself'],
    cost: 'Pay for minutes stored and streamed. This grows with use. Billed by the provider.',
  },
  transcription: {
    label: 'Transcripts and captions',
    provider: 'Deepgram',
    alternatives: ['OpenAI Whisper', 'AssemblyAI'],
    weBuild: 'Upload, transcript viewer, captions, search inside transcripts.',
    youSetUp: ['A speech-to-text API key'],
    cost: 'Pay per audio minute. Billed by the provider.',
  },
  'ai-model': {
    label: 'AI features',
    provider: 'OpenAI or Anthropic API',
    alternatives: [],
    weBuild: 'The prompts, screens, and the code that calls the model.',
    youSetUp: ['An API key and a spending limit you choose'],
    cost: 'Pay per use. Billed by the model provider.',
  },
  payments: {
    label: 'Taking payments',
    provider: 'Stripe',
    alternatives: ['Razorpay', 'PayPal'],
    weBuild: 'Checkout, invoices, payment status screens, webhooks.',
    youSetUp: ['A Stripe account and the business verification Stripe requires'],
    cost: 'A percentage per transaction, taken by the payment provider.',
  },
  'calendar-oauth': {
    label: 'Syncing with Google or Outlook calendars',
    provider: 'Google Calendar and Microsoft Graph APIs',
    alternatives: [],
    weBuild: 'Availability, booking logic, timezone handling, and the connect screens.',
    youSetUp: [
      'Register an app with Google and Microsoft',
      'Google requires an app review before the general public can connect their accounts',
    ],
    cost: 'Free to call. Your time is the cost: the review and token maintenance.',
  },
  'email-inbox-sync': {
    label: 'Syncing Gmail or Outlook inboxes',
    provider: 'Gmail API and Microsoft Graph',
    alternatives: ['Nylas', 'Unipile'],
    weBuild: 'Connect-your-inbox screens, threading, logging emails against records, and send-from-the-app.',
    youSetUp: [
      'Register an app with Google and Microsoft',
      'Google treats reading mail as a restricted permission: before the general public can connect, it requires an app review and a paid third-party security assessment',
    ],
    cost: 'Free to call. The review, and the yearly re-assessment Google requires, is the real cost. A sync provider like Nylas charges per connected inbox and handles the review for you.',
  },
  'sso-enterprise': {
    label: 'Enterprise single sign-on',
    provider: 'WorkOS',
    alternatives: ['Supabase SAML SSO on its paid plans'],
    weBuild: 'Sign-in screens and the account mapping around the provider.',
    youSetUp: ['A provider account and each customer identity provider configured'],
    cost: 'Usually priced per connected company. Billed by the provider.',
  },
  'maps-geo': {
    label: 'Maps and location search',
    provider: 'Google Maps Platform',
    alternatives: ['Mapbox'],
    weBuild: 'Map views, pins, address search, distance logic.',
    youSetUp: ['A maps account with billing enabled and a restricted API key'],
    cost: 'Pay per map load or lookup. Billed by the provider.',
  },
  'push-notifications': {
    label: 'Push notifications',
    provider: 'Firebase Cloud Messaging',
    alternatives: ['OneSignal'],
    weBuild: 'Notification rules, templates and the device registration flow.',
    youSetUp: ['A Firebase project and, for iPhones, an Apple developer account'],
    cost: 'Free at most volumes. Apple developer membership is a yearly fee.',
  },
}

/** The deterministic rule: the model never decides provider-vs-build on its own. */
export function featureFit(f: { fit?: ModelFit; needs?: NeedKind[] }): Fit {
  if (f.fit === 'cant') return 'cant'
  // Needing an outside service outranks "simplified": the owner must set the service up either way,
  // and the feature's note still says what is cut.
  if (f.needs && f.needs.length) return 'provider'
  return f.fit === 'lite' ? 'lite' : 'build'
}

export type Verdict = 'good' | 'partial' | 'poor' | 'platform'

/**
 * `isPlatform` products (Teams, Slack, Zoom, Salesforce, Shopify...) get their own verdict regardless of
 * the feature tally: their value is a network, infrastructure or a suite of many products, so a feature
 * count would flatter them.
 */
export function productVerdict(features: { fit?: ModelFit; needs?: NeedKind[] }[], isPlatform = false): { verdict: Verdict; counts: Record<Fit, number> } {
  const counts: Record<Fit, number> = { build: 0, provider: 0, lite: 0, cant: 0 }
  for (const f of features) counts[featureFit(f)]++
  const total = features.length || 1
  const cant = counts.cant / total
  const weak = (counts.cant + counts.lite) / total
  const verdict: Verdict = isPlatform ? 'platform' : cant >= 0.4 ? 'poor' : cant >= 0.2 || weak >= 0.4 ? 'partial' : 'good'
  return { verdict, counts }
}

/** Distinct outside services the picked features depend on, in a stable order. */
export function requiredInfra(picked: { fit?: ModelFit; needs?: NeedKind[] }[]): NeedKind[] {
  const seen = new Set<NeedKind>()
  for (const f of picked) if (featureFit(f) === 'provider') f.needs?.forEach(n => seen.add(n))
  return (Object.keys(INFRA) as NeedKind[]).filter(k => seen.has(k))
}
