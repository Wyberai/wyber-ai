// Real company logos via Clearbit Logo API (free, no API key)
// Usage: getToolLogo('GMAIL') → 'https://logo.clearbit.com/gmail.com'

const TOOL_DOMAINS: Record<string, string> = {
  GMAIL: 'gmail.com',
  SLACK: 'slack.com',
  NOTION: 'notion.so',
  HUBSPOT: 'hubspot.com',
  SALESFORCE: 'salesforce.com',
  AIRTABLE: 'airtable.com',
  GITHUB: 'github.com',
  LINEAR: 'linear.app',
  JIRA: 'atlassian.com',
  STRIPE: 'stripe.com',
  GOOGLECALENDAR: 'calendar.google.com',
  GOOGLEDOCS: 'docs.google.com',
  GOOGLESHEETS: 'sheets.google.com',
  LINKEDIN: 'linkedin.com',
  TWITTER: 'twitter.com',
  DISCORD: 'discord.com',
  TRELLO: 'trello.com',
  ASANA: 'asana.com',
  ZOOM: 'zoom.us',
  CALENDLY: 'calendly.com',
  INTERCOM: 'intercom.com',
  ZENDESK: 'zendesk.com',
  MAILCHIMP: 'mailchimp.com',
  SENDGRID: 'sendgrid.com',
  TWILIO: 'twilio.com',
  SHOPIFY: 'shopify.com',
  FIGMA: 'figma.com',
  DROPBOX: 'dropbox.com',
  MONGODB: 'mongodb.com',
  SUPABASE: 'supabase.com',
  VERCEL: 'vercel.com',
  AWS: 'aws.amazon.com',
  OPENAI: 'openai.com',
  ANTHROPIC: 'anthropic.com',
  ELEVENLABS: 'elevenlabs.io',
  RESEND: 'resend.com',
  POSTHOG: 'posthog.com',
  MIXPANEL: 'mixpanel.com',
  SEGMENT: 'segment.com',
  DATADOG: 'datadoghq.com',
  SENTRY: 'sentry.io',
  FIREBASE: 'firebase.google.com',
  CLOUDFLARE: 'cloudflare.com',
  HEROKU: 'heroku.com',
  DIGITALOCEAN: 'digitalocean.com',
  FRESHDESK: 'freshdesk.com',
  PIPEDRIVE: 'pipedrive.com',
  MONDAY: 'monday.com',
  CLICKUP: 'clickup.com',
  BASECAMP: 'basecamp.com',
  WORDPRESS: 'wordpress.com',
  WEBFLOW: 'webflow.com',
  QUICKBOOKS: 'quickbooks.intuit.com',
  XERO: 'xero.com',
}

export function getToolLogo(toolName: string): string | null {
  const key = toolName.toUpperCase().replace(/[^A-Z]/g, '')
  const domain = TOOL_DOMAINS[key]
  if (!domain) return null
  return `https://logo.clearbit.com/${domain}`
}

export function getToolLogoOrFallback(toolName: string): string {
  return getToolLogo(toolName) || `https://logo.clearbit.com/${toolName.toLowerCase().replace(/[^a-z]/g, '')}.com`
}

export { TOOL_DOMAINS }
