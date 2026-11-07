// The route to 100 signups a day, with no paid ads. Targets are a ramp, not a prediction:
// they say where the company needs to be, week by week, and the page compares them with
// the real numbers. Every channel is marked with what is automated and what needs a person.

export const DAILY_TARGET = 100

/** Required average signups a day, by date. Between points it rises in a straight line. */
export const RAMP: { date: string; perDay: number }[] = [
  { date: '2026-11-09', perDay: 2 },
  { date: '2026-11-30', perDay: 10 },
  { date: '2026-12-31', perDay: 25 },
  { date: '2027-01-31', perDay: 45 },
  { date: '2027-02-28', perDay: 70 },
  { date: '2027-03-31', perDay: 100 },
]

export function targetOn(date: string): number {
  const t = new Date(`${date}T00:00:00Z`).getTime()
  const pts = RAMP.map(p => ({ t: new Date(`${p.date}T00:00:00Z`).getTime(), v: p.perDay }))
  if (t <= pts[0].t) return pts[0].v
  if (t >= pts[pts.length - 1].t) return pts[pts.length - 1].v
  for (let i = 1; i < pts.length; i++) if (t <= pts[i].t) return Math.round(pts[i - 1].v + ((t - pts[i - 1].t) / (pts[i].t - pts[i - 1].t)) * (pts[i].v - pts[i - 1].v))
  return pts[pts.length - 1].v
}

export interface Channel {
  id: string
  name: string
  /** Signups a day this channel could add once it is working, as a planning figure only. */
  planPerDay: number
  automated: string
  needsYou: string
  firstStep: string
}

export const CHANNELS: Channel[] = [
  { id: 'seo', name: 'Search: "build a ___ app" pages', planPerDay: 30, automated: 'The /build pages exist (28 at the last count) and a quality gate keeps them honest.', needsYou: 'Approve new page topics; the pages need weeks to rank.', firstStep: 'Add 10 new /build pages a week from real search questions.' },
  { id: 'linkedin', name: 'LinkedIn posts', planPerDay: 15, automated: 'The Content agent drafts the week\'s posts from the calendar.', needsYou: 'Edit and post them (10 minutes a day). Replies to comments are yours.', firstStep: 'Publish today\'s calendar topic.' },
  { id: 'video', name: 'Short videos (Reels, Shorts, LinkedIn video)', planPerDay: 20, automated: 'The calendar gives the topic and the hook for each video.', needsYou: 'Record a 30-second screen recording of an app being built, twice a week.', firstStep: 'Record the "one paragraph in, working app out" build.' },
  { id: 'community', name: 'Founder and business communities', planPerDay: 10, automated: 'The calendar gives a Wednesday topic written as a helpful post, not a pitch.', needsYou: 'Post it yourself and answer comments. Do not paste links where the rules forbid it.', firstStep: 'Pick three communities you already belong to.' },
  { id: 'directory', name: 'Claude connector directory and tool directories', planPerDay: 10, automated: 'The Claude connector is built and was listed at the last check.', needsYou: 'Submit to more directories (one afternoon).', firstStep: 'List WyberAi on three AI tool directories.' },
  { id: 'referral', name: 'Referral loop', planPerDay: 10, automated: 'Referral credits exist (check they still work before leaning on this).', needsYou: 'A prompt after a first build asking users to invite one friend.', firstStep: 'Show the invite prompt right after a user\'s first build.' },
  { id: 'colleges', name: 'Colleges and students', planPerDay: 5, automated: 'A student credit offer exists (check it still works).', needsYou: 'Contact 20 college clubs.', firstStep: 'Send one message to the ten most active clubs near you.' },
  { id: 'expo', name: 'Tech Expo Gujarat', planPerDay: 5, automated: 'Slot form, email sequence, booth capture and follow-ups are built.', needsYou: 'Be at the booth. Capture every conversation.', firstStep: 'Practice Booth capture on your phone before the 27th.' },
]

export const planTotal = (): number => CHANNELS.reduce((s, c) => s + c.planPerDay, 0)

/** Weekly review: are we ahead of or behind the ramp, and by how much? */
export function pace(actualAvgPerDay: number, date: string): { target: number; actual: number; gap: number; status: 'ahead' | 'on_track' | 'behind' } {
  const target = targetOn(date)
  const gap = Math.round((actualAvgPerDay - target) * 10) / 10
  return { target, actual: actualAvgPerDay, gap, status: actualAvgPerDay >= target ? 'ahead' : actualAvgPerDay >= target * 0.8 ? 'on_track' : 'behind' }
}
