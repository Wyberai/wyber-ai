import { PostShell } from '@/components/signal/PostShell'
import { getPost, postMetadata } from '@/lib/blog/meta'

const post = getPost('replace-calendly-with-your-own-app')
export const metadata = postMetadata(post)

export default function Page() {
  return (
    <PostShell
      post={post}
      dek="Twenty-four features, sorted into what we can build, what we can only build in a smaller form, and the one thing we will not fake."
      cta={{
        title: 'Try it with a tool you pay for',
        body: 'Pick the features you use. We show what we build, what you bring, and what we will not pretend to do.',
        href: '/byos',
        label: 'Replace your SaaS',
      }}
    >
      <p>The monthly price of a scheduling tool covers far more than a booking link and a reminder email. So we went through Calendly feature by feature to see how much of it can be rebuilt, and how much would be a bluff.</p>
      <p>We read only the public website, so anything behind a login or paywall we cannot see is not counted. The same exercise runs for 44 tools on our <a href="/byos">Replace your SaaS</a> page. Take what follows as a map, not a promise.</p>
      <p>Of 24 features, 16 are buildable, 7 only in a simpler form, and 1 we will not fake.</p>
      <p>If you check this against the <a href="/byos">Replace your SaaS</a> page, you will see different numbers there: 10 need nothing from you, 11 need an outside service, 2 are simplified with nothing extra, and 1 cannot be built. It is the same 24 features counted a different way. That page groups by what you have to bring, so five of the &ldquo;simpler form&rdquo; features below, which also need an outside account, move into its &ldquo;outside service&rdquo; group. This post groups by how much of the feature we can deliver.</p>

      <h2>The 16 we can build</h2>
      <p>Ten need nothing from you: booking links and event types, availability rules, reschedule and cancel, meeting polls, website embeds, lead routing forms, spreading meetings across a team, contact records with meeting history, team roles and permissions, and analytics dashboards.</p>
      <p>Six lean on an outside service, which you connect with your own account:</p>
      <div className="sg-table-wrap">
        <table className="sg-table">
          <thead><tr><th>Feature</th><th>What you bring</th></tr></thead>
          <tbody>
            <tr><td>Calendar connection and conflict avoidance</td><td>A Google and a Microsoft app registration so the sync can read busy times</td></tr>
            <tr><td>Email reminders and follow-ups</td><td>An email delivery service</td></tr>
            <tr><td>Text message reminders</td><td>An SMS provider. Each message costs money.</td></tr>
            <tr><td>Upfront meeting payments</td><td>A Stripe account</td></tr>
            <tr><td>Meeting packages</td><td>A Stripe account</td></tr>
            <tr><td>Invoices and payment links</td><td>A Stripe account and an email service</td></tr>
          </tbody>
        </table>
      </div>
      <p>The calendar one is the one people forget. Not double-booking you means reading your Google or Outlook calendar, which needs an app registered with Google and Microsoft. It is a real setup job, not a button.</p>
      <p>The text-message row reads differently depending on where your clients are. In the US, sending business texts means registering your brand and campaign with the carriers, which can take days to approve. In India, many people skip SMS and send the reminder on WhatsApp instead; <a href="/blog/whatsapp-click-to-chat-vs-business-api">that post</a> explains the two ways to do it.</p>

      <h2>The 7 we can only build smaller</h2>
      <ul>
        <li><strong>CRM sync.</strong> Custom connections to the CRMs you name. No catalogue of ready-made connectors.</li>
        <li><strong>The AI scheduling assistant that works from email threads.</strong> Possible with a language model and mailbox access, but not the same product. It needs inbox sync and AI costs.</li>
        <li><strong>Meeting prep and recall questions.</strong> Basic question answering over notes you stored. No custom-trained model.</li>
        <li><strong>Pre-drafted follow-up emails.</strong> They need a written recap, so they depend on the transcription feature below.</li>
        <li><strong>Google, Microsoft and video-tool integrations.</strong> A few custom ones. A catalogue of 150 or more is not realistic.</li>
        <li><strong>Browser extension and mobile app.</strong> A mobile app is possible with Expo. The extension is not included, only a web app.</li>
        <li><strong>Enterprise single sign-on.</strong> Possible, but you must set up an identity provider.</li>
      </ul>

      <h2>The 1 we will not fake</h2>
      <p>Meeting transcription and recaps. It needs a bot that joins calls on third-party video tools plus transcription services, so it cannot be built as something you run yourself. We do not offer a pretend version.</p>

      <h2>Reading the list for yourself</h2>
      <p>Write down what you actually use, including anything buried in settings you last opened a year ago. If all of it sits in the first group, replacing the tool is realistic, and the real cost is the time to set up the accounts you bring. If one thing you depend on sits in the last two groups, keep paying for the tool. That is the right answer, and we would rather you reach it now than after you have built the replacement.</p>
    </PostShell>
  )
}
