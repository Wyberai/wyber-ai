// Fire-and-forget GTM demo funnel logging. Never throws — a logging failure must
// never affect the page render, the claim redirect, or ownership transfer.

type AdminClient = { from: (t: string) => any }

export type DemoEvent = 'view' | 'cta_click' | 'claimed'

export async function logDemoEvent(
  admin: AdminClient,
  e: { event: DemoEvent; slug?: string | null; token?: string | null; ref?: string | null; ua?: string | null },
): Promise<void> {
  try {
    await admin.from('gtm_demo_events').insert({
      event: e.event,
      slug: e.slug ?? null,
      token: e.token ?? null,
      ref: e.ref ?? null,
      ua: (e.ua ?? '').slice(0, 300) || null,
    })
  } catch {
    /* analytics is best-effort */
  }
}
