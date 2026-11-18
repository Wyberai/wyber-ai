/**
 * Posts written for the Signal blog layout. The index (src/app/blog/page.tsx) merges these with the older
 * hand-built posts. To add a post: add an entry here, then create src/app/blog/<slug>/page.tsx using PostShell.
 */
export type SignalPost = {
  slug: string
  title: string
  excerpt: string
  tag: string
  date: string // display form
  iso: string
  readTime: string
}

export const SIGNAL_POSTS: SignalPost[] = [
  {
    slug: 'tech-expo-gujarat-booth-s23',
    title: 'Bring your slowest task to booth S23 and watch it get built',
    excerpt: 'Tech Expo Gujarat, 27 to 29 November, Ahmedabad. What to bring, what happens in the 15 minutes, and what we will not promise.',
    tag: 'Event',
    date: '18 November 2026',
    iso: '2026-11-18',
    readTime: '4 min read',
  },
  {
    slug: 'what-30-free-credits-build',
    title: 'What 30 free credits actually buy',
    excerpt: 'How credits are spent, what to expect from a first build, and two real sample builds from our own testing, with their checks.',
    tag: 'Guide',
    date: '18 November 2026',
    iso: '2026-11-18',
    readTime: '6 min read',
  },
  {
    slug: 'how-we-probe-ai-built-apps-for-leaks',
    title: 'How we probe an AI-built app the way an attacker would',
    excerpt: 'The public key shipped in every built app can read more than people expect. What our scan tries, what it never touches, and how to fix what it finds.',
    tag: 'Security',
    date: '18 November 2026',
    iso: '2026-11-18',
    readTime: '7 min read',
  },
  {
    slug: 'replace-calendly-with-your-own-app',
    title: 'Replacing Calendly with your own app: what we build, what you bring, what we will not fake',
    excerpt: 'We went through 24 Calendly features. 16 are buildable, 7 only in a simpler form, and 1 we will not fake. The full list.',
    tag: 'Replace your SaaS',
    date: '18 November 2026',
    iso: '2026-11-18',
    readTime: '6 min read',
  },
  {
    slug: 'row-level-security-patterns-for-small-apps',
    title: 'Four row-level security patterns that cover most small business apps',
    excerpt: 'Owner only, shared workspace, public read, and public form. The SQL for each, how to test it as a real user, and the three ways it quietly fails.',
    tag: 'Security',
    date: '18 November 2026',
    iso: '2026-11-18',
    readTime: '8 min read',
  },
  {
    slug: 'email-deliverability-spf-dkim-dmarc',
    title: 'Why your app’s emails land in spam, and the three DNS records that fix it',
    excerpt: 'SPF, DKIM and DMARC in plain terms, the exact checks to run from a terminal, and the mistakes that break all three.',
    tag: 'Technical',
    date: '18 November 2026',
    iso: '2026-11-18',
    readTime: '8 min read',
  },
  {
    slug: 'prompting-a-data-app-tables-roles-states',
    title: 'How to describe a data app so the builder gets the tables right',
    excerpt: 'Nouns become tables, status words become columns, rules become checks. A prompt template with three worked examples and what to leave out.',
    tag: 'Guide',
    date: '18 November 2026',
    iso: '2026-11-18',
    readTime: '7 min read',
  },
  {
    slug: 'whatsapp-click-to-chat-vs-business-api',
    title: 'Messaging customers from your app: a link, or an API?',
    excerpt: 'WhatsApp in India, text messages in the US. How a prefilled link works, what the APIs add, the registration each needs, and how to store phone numbers.',
    tag: 'Technical',
    date: '18 November 2026',
    iso: '2026-11-18',
    readTime: '7 min read',
  },
  {
    slug: 'gst-invoice-data-model',
    title: 'Invoice tables for India and the US: GST, sales tax and what they share',
    excerpt: 'One data model that works for both: snapshot the parties, store money in paise or cents, keep tax on its own rows, then the GST and US sales tax specifics.',
    tag: 'Technical',
    date: '18 November 2026',
    iso: '2026-11-18',
    readTime: '9 min read',
  },
  {
    slug: 'prompt-to-android-apk-what-the-build-involves',
    title: 'From prompt to Android app: APK, AAB and what the build step actually does',
    excerpt: 'What a React Native and Expo project becomes when you build it, why Google Play wants an AAB, and the accounts and steps you need before launch.',
    tag: 'Mobile',
    date: '18 November 2026',
    iso: '2026-11-18',
    readTime: '8 min read',
  },
]
