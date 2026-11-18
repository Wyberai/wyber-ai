import { PostShell } from '@/components/signal/PostShell'
import { getPost, postMetadata } from '@/lib/blog/meta'

const post = getPost('build-internal-tools-with-ai')
export const metadata = postMetadata(post)

export default function Page() {
  return (
    <PostShell
      post={post}
      dek="Every team has a tool it needs and never gets: an admin page, an approval queue, a stock register. The people who need it can now describe it. Four prompts, and the questions to settle before anyone logs in."
      cta={{
        title: 'Describe the tool your team keeps asking for',
        body: 'Pick the one that causes the most spreadsheet pain. Describe it, read the estimate, build it.',
        href: '/create',
        label: 'Describe your tool',
        second: { href: '/blog/prompting-a-data-app-tables-roles-states', label: 'How to write the prompt' },
      }}
    >
      <p>Internal tools are important and never urgent, so they go to the bottom of the engineering list and stay there. Meanwhile somebody keeps a forty-tab spreadsheet alive, approvals happen in chat threads that get buried, and a month-end figure depends on one person remembering to copy something. The tool is usually small. Waiting for a developer to have time is what makes it feel big.</p>
      <p>A builder lets the person closest to the problem write it down and get a first version the same day. Here are four prompts in a shape that works. They are written to name the records, the stages and the people, which is what the builder needs from you. <a href="/blog/prompting-a-data-app-tables-roles-states">This post</a> explains why.</p>

      <h2>Four prompts to adapt</h2>
      <h3>An admin panel</h3>
      <pre><code>{`Build an admin panel for managing user accounts. Show a searchable
table with name, email, plan, signup date, and status (active or
suspended). Include a detail view for each user with their activity
log and a button to reset their password.`}</code></pre>
      <h3>An approval queue</h3>
      <pre><code>{`Build a purchase request approval tool. Employees submit requests
with item description, amount, vendor, and urgency. Managers see a
queue of pending requests and approve or reject with a comment. Show
total spend this month, pending count, and average approval time.`}</code></pre>
      <h3>A stock register</h3>
      <pre><code>{`Build an inventory tool for a warehouse. Track items with SKU, name,
quantity, location, and reorder threshold. Show low-stock alerts and
items by category. Include a form to log stock in and out with
timestamps.`}</code></pre>
      <h3>A support board</h3>
      <pre><code>{`Build a customer support board. Show open tickets in columns: New,
In Progress, Waiting on Customer, Resolved. Each ticket has a
customer name, issue, priority, and assigned agent. Include filters
by priority and agent, and summary counts at the top.`}</code></pre>
      <p>Adapt them to your own paperwork. For an Indian business the stock register often wants a goods-received note against each purchase, and the approval queue may need a GST invoice number on the request. For a US business the same queue might need a purchase-order number and a cost centre. Putting the word in the prompt is how the field gets created.</p>

      <h2>Settle access before you build</h2>
      <p>An internal tool nearly always holds data that not everyone should see. Decide before the first build who logs in and what each person can do: who submits, who approves, who sees everything. Say it in the prompt. “Managers approve, employees only see their own requests” changes how the whole app is built.</p>
      <p>Real sign-in and shared data need a database, which is on the Builder plan and above. Until then, the tool can run for one person with data saved in their browser, which is fine for a trial and wrong for a team. When you do connect a database, protect it. A tool full of salaries or customer records is exactly what row-level security is for, and <a href="/blog/row-level-security-patterns-for-small-apps">the patterns post</a> shows the rules for owner-only and workspace-wide access.</p>

      <h2>Start smaller than you think</h2>
      <p>Build the one screen people will open every day and add the rest as changes: a CSV export, an email when a request is approved, colour for urgent tickets. Each is a short message to the builder, and each is a small edit rather than a new build. You will also learn what the team actually uses, which is rarely what the first brief imagined.</p>
      <p>It will not replace everything. If a tool needs to plug into a payroll system or an ERP that nobody here can reach, expect that part to need an engineer. The records, screens and approvals around it usually do not.</p>
    </PostShell>
  )
}
