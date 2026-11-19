import { PostShell } from '@/components/signal/PostShell'
import { getPost, postMetadata } from '@/lib/blog/meta'

const post = getPost('build-saas-mvp-with-ai-2026')
export const metadata = postMetadata(post)

export default function Page() {
  return (
    <PostShell
      post={post}
      dek="You can get from a paragraph to a working product with sign-in, a database and billing in an afternoon. Here is what the builder does, which parts only you can do, and what to leave out."
      cta={{
        title: 'Write your paragraph and see the first version',
        body: 'Describe who it is for, what it stores and the one action that matters. Read the estimate, then build.',
        href: '/create',
        label: 'Describe your product',
        second: { href: '/signup', label: 'Start free' },
      }}
    >
      <p>Most of the old advice on building a software product assumed the hard part was writing code. That part is now fast. What is still slow is knowing who you are building for and what they will pay for, and no tool shortens that. So the honest version of “build a SaaS in an afternoon” is: get a real first version in an afternoon, then spend the rest of the week finding out if anyone wants it.</p>

      <h2>Write one paragraph first</h2>
      <p>Before you open any tool, write a paragraph that says who it is for, what data it manages, and the one action they will do most. Vague briefs produce generic apps. Here is one that works:</p>
      <pre><code>{`Build a CRM for freelancers with a client list, a project pipeline
(Prospect, Active, Invoiced, Paid), an invoice tracker, and a
dashboard showing monthly revenue, active clients and overdue invoices.`}</code></pre>
      <p>Every noun is a record, and “Prospect, Active, Invoiced, Paid” is a status that runs through the pipeline. If you want the long version of why that wording matters, see <a href="/blog/prompting-a-data-app-tables-roles-states">how to describe a data app</a>.</p>

      <h2>Generate, then use it for ten minutes</h2>
      <p>Paste it into WyberAi, choose Web App, and read the estimate before you confirm. You get a working React project with the screens and data wired up. Then click through it as if you were the customer. You will spot three things that are wrong in the first ten minutes, which is far more useful than reading the code.</p>

      <h2>What needs your decision, not the builder’s</h2>
      <p><strong>Your pricing.</strong> The builder can build a pricing page and gate features by plan, but it will not decide what you charge or what is in each tier, and it should not invent them. Write the plans down before you ask for them.</p>
      <p><strong>Payments.</strong> Taking money means a Stripe account of your own, connected to the app. Stripe is the route we support for payments. In India, check which payment methods your Stripe account can accept before you promise UPI to a customer, and for any country decide up front what you will do about refunds.</p>
      <p><strong>Tax.</strong> If you invoice, you collect tax. GST in India and sales tax in the US work very differently, and <a href="/blog/gst-invoice-data-model">this post</a> covers how to store it. Talk to an accountant before your first paying customer.</p>
      <p><strong>Legal pages.</strong> A product that takes sign-ups needs a privacy policy and terms. India’s data protection law and US state privacy laws both expect you to say what you collect and why. Use a real policy written for your situation, not a placeholder.</p>

      <h2>The database and your own domain</h2>
      <p>The generated app starts with example data. For real users, connect a database: that is Supabase, on the Builder plan and above, which also includes your own domain. Connect it, then protect it with row-level security before anyone signs up. The next two posts to read are <a href="/blog/row-level-security-patterns-for-small-apps">the security patterns</a> and <a href="/blog/how-to-deploy-ai-generated-app">the deploy checklist</a>.</p>

      <h2>Cut more than you think</h2>
      <p>An MVP should do one thing well enough that someone will use it twice. Leave out roles, teams, analytics, integrations and notifications until a customer asks. Each of those is easy to add as a change once you know it matters, and each is a distraction when you do not. A smaller first build is also cheaper, and it is quicker to put in front of five people.</p>
      <p>Give those five people the live link the same day, watch what they do, and write down what confused them. The next version should fix that, not anything you thought of on your own.</p>
    </PostShell>
  )
}
