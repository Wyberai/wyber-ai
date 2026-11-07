import { EXPO } from '@/lib/ops/facts'

// A 30-day organic content calendar (no paid ads). One topic a day, published in the
// formats below. Topics use ONLY what is true and public: the problems small and
// mid-size businesses have, how WyberAi works, and the expo. No invented customers,
// numbers or results. The Content agent drafts the posts for each week's topics;
// you edit and publish. Nothing posts by itself.

export type Pillar = 'problem' | 'show' | 'expo' | 'how' | 'offer'
export interface Topic { pillar: Pillar; topic: string; hook: string }
export interface Piece { date: string; channel: 'linkedin' | 'short_video' | 'community' | 'newsletter'; format: string; pillar: Pillar; topic: string; hook: string }

export const CALENDAR_START = '2026-11-09'

// 30 topics, in order, one per day from CALENDAR_START.
export const TOPICS: Topic[] = [
  { pillar: 'problem', topic: 'Orders that arrive on WhatsApp and get lost', hook: 'Your best customer ordered on WhatsApp on Tuesday. Where is that order now?' },
  { pillar: 'how', topic: 'Describe the tool you need in plain words and get working software', hook: 'You do not need to learn to code to get the tool your business needs.' },
  { pillar: 'problem', topic: 'The spreadsheet only one person understands', hook: 'What happens to your business when the one person who understands the spreadsheet is on leave?' },
  { pillar: 'show', topic: 'Watch an app get built from a one-paragraph description', hook: 'One paragraph in. A working app out. Here is the whole thing, unedited.' },
  { pillar: 'offer', topic: 'Try it free: 30 credits, no card', hook: 'Describe your idea and see it built. It costs nothing to try.' },
  { pillar: 'problem', topic: 'Off-the-shelf software that almost fits', hook: 'Most business software is built for the average company. Yours is not average.' },
  { pillar: 'how', topic: 'Web app, mobile app or website: what to ask for first', hook: 'Before you build anything, answer one question: who will use it, and on what device?' },
  { pillar: 'problem', topic: 'Delivery proof that comes back late or not at all', hook: 'If you cannot see which deliveries are still missing a signed copy, you do not have a system. You have hope.' },
  { pillar: 'show', topic: 'From idea to first screen: what the first version should include', hook: 'The first version of your software should do one thing well. Here is how to pick it.' },
  { pillar: 'problem', topic: 'Expiry dates tracked in a notebook', hook: 'A notebook cannot warn you. Software can.' },
  { pillar: 'how', topic: 'What a good first version looks like: three screens', hook: 'Most useful business tools start as three screens. Here is a way to find yours.' },
  { pillar: 'offer', topic: 'Bring one problem: the booth offer', hook: 'Bring the one thing your tools cannot do. We will show you it turned into software.' },
  { pillar: 'problem', topic: 'Paying for five apps that do not talk to each other', hook: 'Five subscriptions. Five logins. Zero single view of your business.' },
  { pillar: 'show', topic: 'A custom tool for a stockist: what it tracks and why', hook: 'What would a tool built only for your kind of business track on day one?' },
  { pillar: 'how', topic: 'How to describe your business problem so software can be built from it', hook: 'Write the problem like you would tell a smart new employee on their first day.' },
  { pillar: 'expo', topic: 'Tech Expo Gujarat countdown: what to bring to the booth', hook: `Going to ${EXPO.name}? Here is the one thing to bring to booth ${EXPO.booth}.` },
  { pillar: 'problem', topic: 'Customer follow-ups that depend on someone remembering', hook: 'The follow-up that never happened is the sale you never knew you lost.' },
  { pillar: 'expo', topic: 'Tech Expo Gujarat starts tomorrow: one booth, fifteen minutes', hook: `Tomorrow we are at booth ${EXPO.booth}. Book a free 15-minute slot and bring one problem.` },
  { pillar: 'expo', topic: 'Day one at the expo: what people asked us to build', hook: 'The most common thing people asked for on day one.' },
  { pillar: 'expo', topic: 'Day two at the expo: the problems we heard most', hook: 'Three problems we heard again and again at the booth today.' },
  { pillar: 'expo', topic: 'Day three at the expo: thank you, and what happens next', hook: 'Thank you, Ahmedabad. If we spoke at the booth, here is what happens next.' },
  { pillar: 'offer', topic: 'After the expo: bring your problem anyway', hook: 'You missed the booth? You can still bring us the one thing your tools cannot do.' },
  { pillar: 'how', topic: 'Own your software or rent it: the question to ask', hook: 'When you rent software, you rent its limits too.' },
  { pillar: 'show', topic: 'A simple approval flow built in minutes', hook: 'Approvals by WhatsApp message do not scale. Here is a version that does.' },
  { pillar: 'problem', topic: 'Reports that take half a day to put together', hook: 'If a report takes half a day, the report is the problem, not you.' },
  { pillar: 'how', topic: 'Questions to ask any software builder before you hire them', hook: 'Five questions that tell you in ten minutes whether a builder will deliver.' },
  { pillar: 'offer', topic: 'Show us your workflow, we will tell you what to build first', hook: 'Not sure what to build first? Describe your week and we will point at the first thing.' },
  { pillar: 'problem', topic: 'The team that works around the software instead of with it', hook: 'If your team keeps a side spreadsheet, your software is not doing its job.' },
  { pillar: 'show', topic: 'Before and after: a messy process turned into one screen', hook: 'Before: three chats, two sheets and a notebook. After: one screen.' },
  { pillar: 'how', topic: 'What it takes to keep a custom tool running after launch', hook: 'Building is the easy part. Here is what keeps a tool alive for years.' },
]

const WEEKDAY_FORMATS: { dow: number; channel: Piece['channel']; format: string }[] = [
  { dow: 2, channel: 'short_video', format: '30-second vertical video: say the hook, show the problem, show the fix' },
  { dow: 3, channel: 'community', format: 'A helpful post for a business or founder community: the problem and how to think about it, no pitch in the first half' },
  { dow: 4, channel: 'short_video', format: '30-second vertical video: say the hook, show the problem, show the fix' },
  { dow: 6, channel: 'newsletter', format: 'Weekly note to subscribers: this week\'s three topics in plain words, one link to try it free' },
]

const dateAt = (i: number) => new Date(new Date(`${CALENDAR_START}T00:00:00Z`).getTime() + i * 86400_000).toISOString().slice(0, 10)
const dowOf = (date: string) => new Date(`${date}T00:00:00Z`).getUTCDay()

/** Everything to publish on a date. Empty before the calendar starts or after day 30. */
export function piecesOn(date: string): Piece[] {
  const i = Math.round((new Date(`${date}T00:00:00Z`).getTime() - new Date(`${CALENDAR_START}T00:00:00Z`).getTime()) / 86400_000)
  const t = TOPICS[i]
  if (!t) return []
  const base = { date, pillar: t.pillar, topic: t.topic, hook: t.hook }
  const out: Piece[] = [{ ...base, channel: 'linkedin', format: 'LinkedIn text post under 600 characters, first line is the hook' }]
  for (const f of WEEKDAY_FORMATS) if (f.dow === dowOf(date)) out.push({ ...base, channel: f.channel, format: f.format })
  return out
}

/** The topics for the 7 days starting `from`, for the Content agent's weekly drafts. */
export function topicsForWeek(from: string): { date: string; topic: string; hook: string }[] {
  return Array.from({ length: 7 }, (_, k) => { const d = new Date(new Date(`${from}T00:00:00Z`).getTime() + k * 86400_000).toISOString().slice(0, 10); const t = TOPICS[Math.round((new Date(`${d}T00:00:00Z`).getTime() - new Date(`${CALENDAR_START}T00:00:00Z`).getTime()) / 86400_000)]; return t ? { date: d, topic: t.topic, hook: t.hook } : null })
    .filter((x): x is { date: string; topic: string; hook: string } => !!x)
}

export const CALENDAR_END = dateAt(TOPICS.length - 1)
