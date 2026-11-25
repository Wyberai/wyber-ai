import { PostShell } from '@/components/signal/PostShell'
import { getPost, postMetadata } from '@/lib/blog/meta'

const post = getPost('tech-expo-gujarat-booth-s23')
export const metadata = postMetadata(post)

export default function Page() {
  return (
    <PostShell
      post={post}
      dek="Tech Expo Gujarat, 27 to 29 November, Ahmedabad. If there is a spreadsheet in your week that you dread opening, we would like to meet it."
      cta={{
        title: 'Book 15 minutes at booth S23',
        body: 'Pick a day and tell us in a line what you want built. We message you on WhatsApp to confirm a time.',
        href: '/gujaratexpo#book',
        label: 'Book a slot',
        second: { href: '/create', label: 'Not in Gujarat? Describe it here' },
      }}
    >
      <p>We will be at booth S23 in the Gujarat University Convention &amp; Exhibition Centre on 27, 28 and 29 November. There is no slide deck. We bring a laptop, and what we ask in return is a problem: something in your business that eats time every week. We will build a first version of the fix while you stand there and watch. Fifteen minutes.</p>

      <h2>How the fifteen minutes go</h2>
      <p>You tell us the problem in your own words. “Our job workers never tell us what they have sent back” is a perfectly good brief. We type it into WyberAi where you can read it, so there is no mystery about what was asked for. Then the build runs on screen. The estimated cost appears before it starts, you see the builder catch and repair its own mistakes as it goes, and a security check runs at the end.</p>
      <p>By the time it stops you know whether this is something you would use. If it is, the code is yours and can go to your own GitHub.</p>

      <h2>What people tend to bring</h2>
      <p>Small, repeated, annoying things. The ones we have been preparing for are close to this: a developer’s timesheets that have to become a month-end invoice; a log of client change requests that arrive on WhatsApp and never get priced; a register of goods sent out on job-work challans, with a warning before the one-year return limit; a purchase register that has to be matched against GSTR-2B so you know which suppliers to chase; delivery drivers who photograph the signed LR copy so the office sees proof the same day.</p>
      <p>The wording of that last one, as we would type it: <em>Build a mobile app for my drivers. They pick a delivery, photograph the signed LR copy, and the office sees delivered or pending in one list.</em> That is the whole prompt.</p>
      <p>Bring a tool you pay for and barely use, too. We will go through its features and tell you which we can build, which need an account of yours, and which we would not pretend to copy. <a href="/blog/replace-calendly-with-your-own-app">We did it for Calendly</a> if you want to see what that conversation looks like.</p>

      <h2>If you are reading this from somewhere else</h2>
      <p>The expo is in Ahmedabad, but the exercise works from anywhere, and the problems are not specific to India. A contractor who needs an estimate with line items and a deposit when the customer accepts. A clinic that wants to see who missed an appointment last month. A small shop that keeps its reorder list in a notes app. Describe it at <a href="/create">wyberai.com/create</a> and you will see the same first version, with the estimate on screen before anything is charged.</p>

      <h2>What fifteen minutes cannot do</h2>
      <p>It produces a working first version, not a finished product. Anything that has to talk to an outside service, such as sending WhatsApp messages, taking payments or emailing in bulk, needs your account at that service. We will say so in the first minute, not the last.</p>

      <h2>Booking</h2>
      <p>The form on the <a href="/gujaratexpo#book">expo page</a> takes a day and a line about what you want built, and we confirm a time on WhatsApp. Come with the real problem, not a tidied-up one. The messier it is, the better the fifteen minutes go.</p>
    </PostShell>
  )
}
