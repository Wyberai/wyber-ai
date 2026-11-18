import { PostShell } from '@/components/signal/PostShell'
import { getPost, postMetadata } from '@/lib/blog/meta'

const post = getPost('how-to-deploy-ai-generated-app')
export const metadata = postMetadata(post)

export default function Page() {
  return (
    <PostShell
      post={post}
      dek="The preview looks finished. It is not live, and the data in it is not real. The steps between a good preview and a real launch, in the order that saves you rework."
      cta={{
        title: 'Check your database before you tell anyone',
        body: 'The free scan tries your public key the way a stranger would. Run it before the first customer signs up.',
        href: '/tools',
        label: 'Run the free scan',
        second: { href: '/pricing', label: 'Compare plans' },
      }}
    >
      <p>A preview is a rehearsal. It has pages, navigation and maybe a chart, but it is running on example data in a sandbox, and the only person who can see it is you. Going live is a handful of separate jobs, and most of the lost time comes from doing them in the wrong order. This is the order we would do them in.</p>

      <h2>Decide what needs a database</h2>
      <p>If the app only shows information, or keeps its data in the visitor’s own browser, you may not need one. A school fee tracker that one person uses at one desk can save in the browser. The moment two people must see the same records, or customers log in, you need a real database.</p>
      <p>The database connection, Supabase, is on the Builder plan and above, as are custom domains and publishing without the WyberAi badge. The pricing page lists this, and prices differ between India and the US, so check the plan you are on before you plan the week around it.</p>

      <h2>Connect the database, then lock it</h2>
      <p>Connect your Supabase project from the Connectors area of your project. Then comes the step most people skip. A database that works is not a database that is safe. Switch on row-level security for every table that holds anything private and write the policies. <a href="/blog/row-level-security-patterns-for-small-apps">Four patterns</a> cover most small apps. Without them, the public key shipped in your app can read the table, and <a href="/blog/how-we-probe-ai-built-apps-for-leaks">our scan post</a> shows how little effort that takes.</p>

      <h2>Test as a stranger and as a second customer</h2>
      <p>Create two real accounts in the preview. Add a few records to the first. Log in as the second and confirm you cannot see them. Then log out entirely and try to read the data without an account. This takes ten minutes and finds the problems that matter. Fix what you find with a chat message before you publish, not after.</p>

      <h2>Publish</h2>
      <p>Click Publish in the editor’s top bar. WyberAi sends the current version to Vercel and gives you a public address at <code>wyberai.com/app/your-app</code>. Share that with a handful of people. Publishing again later updates the frontend and leaves your database as it is.</p>
      <p>On publish, WyberAi also probes your database with the public key and flags anything exposed. Treat that as a safety net, not a replacement for the test above.</p>

      <h2>Your own domain</h2>
      <p>For anything customers will rely on, use your own address. Add the domain, then at your DNS host create the records you are shown: usually a CNAME for a subdomain such as <code>app.yourdomain.com</code>, or an A record for the bare domain. A short TTL while you set it up makes mistakes cheaper to undo. Propagation is often quick, though it can take longer, so do it before the launch day, not on it.</p>
      <p>If your app will send email from that domain, set up <a href="/blog/email-deliverability-spf-dkim-dmarc">SPF, DKIM and DMARC</a> at the same time. It is the same DNS panel, and password-reset mail that lands in spam is a launch-day disaster.</p>

      <h2>Keys and secrets</h2>
      <p>Your app needs the Supabase URL and the public anon key. Those are safe to ship. Anything else, such as a Stripe secret key or an email provider’s API key, must stay on a server and never go into front-end code. If you are unsure whether a key is safe to expose, assume it is not.</p>

      <h2>After launch</h2>
      <p>Keep changing the app in the builder and publish again. Real users will ask for exports, notifications and an admin view within the first week. Look at the first week’s sign-ups and records yourself rather than assuming it all worked. A launch is the beginning of finding out.</p>
    </PostShell>
  )
}
