import { PostShell } from '@/components/signal/PostShell'
import { getPost, postMetadata } from '@/lib/blog/meta'

const post = getPost('prompting-a-data-app-tables-roles-states')
export const metadata = postMetadata(post)

export default function Page() {
  return (
    <PostShell
      post={post}
      dek="A builder reads your words and decides what to store. Name the things, the stages they pass through and the rules between them, and it stops guessing."
      cta={{
        title: 'Try the template on your own problem',
        body: 'Write the things, the stages and the rules. Read the estimate on screen, then build.',
        href: '/create',
        label: 'Describe your app',
        second: { href: '/signup', label: 'Start free' },
      }}
    >
      <p>A data app is a few lists with rules between them. Say “a tracker for my shop” and the builder has to guess which lists, which columns and which rules. Write the lists yourself and there is nothing to guess. Most disappointing first builds come from the first kind of sentence.</p>

      <h2>How your words turn into a database</h2>
      <p>Every noun you give a record of becomes a table: a challan, a student, a delivery, an estimate. Every fact about it becomes a column: estimated hours, price, supplier GSTIN, job address. Words that describe a stage, like paid or unpaid, delivered or pending, become a status column with fixed values. Who does what decides the logins and screens: the driver photographs, the client approves. And any condition that matters, such as “warn me before the one-year return limit”, becomes a calculation or a flag on the list.</p>
      <p>If you remember nothing else, remember that a status word in your sentence is doing real work. It is the difference between a list of things and a process.</p>

      <h2>A shape that works</h2>
      <pre><code>{`Build a [kind of app] for [who uses it].

Records: [the things, with the facts you track on each]
Statuses: [the stages each record moves through]
People: [who logs in and what each can do]
Rules: [anything that must be checked, calculated or warned about]
Screens: [the one or two views you open every day]`}</code></pre>
      <p>You will not always fill every line. Fill the ones where you have an opinion.</p>

      <h2>Three real prompts, taken apart</h2>
      <p>The first is vague: <em>a tool to track client changes</em>. Here is the version we use:</p>
      <pre><code>{`Build a change-request tracker. I log each client request with
estimated hours and price, the client approves it, and I mark it
as billed.`}</code></pre>
      <p>A request is a record, hours and price are columns, and “approves” and “billed” make the status run from logged to approved to billed. There are two people, you and the client, which tells the builder the client needs their own way in. One sentence carried all of that.</p>
      <pre><code>{`Build a job-work tracker. I log a challan for goods sent to a
job worker, record what comes back, and get a warning before the
one-year return limit.`}</code></pre>
      <p>Two tables hide in there: challans, and returns against a challan. “What comes back” tells the builder a challan can be partly returned, so it needs a quantity sent and a quantity returned instead of a simple done flag. The deadline becomes a date calculation and a warning on the list.</p>
      <pre><code>{`Build a tool where I upload my purchase register and my GSTR-2B
file. Match them by supplier GSTIN and invoice number, then show
the mismatches and a list of suppliers to chase.`}</code></pre>
      <p>The key phrase is “match them by”. It names what the two files are joined on. Leave it out and the builder has to pick, and a wrong key produces matches that look correct.</p>
      <p>The same thinking works for a US business. Take a roofing contractor’s estimates: <em>Build an estimate tool. I add a customer and a list of line items with quantity and price, the customer accepts or declines, and when they accept I see the deposit due.</em> Customer and estimate are the tables, line items belong to an estimate, accepted or declined is the status, and the deposit is a calculation on acceptance. We wrote that one for this post rather than from a test run, so treat it as an example of the shape.</p>

      <h2>Decide four things before you type</h2>
      <p>Where the data lives. An app that only saves in the browser you used is fine for one person at one computer, and wrong for a team. Our sample fee tracker saves in the browser, which is why it suits one desk and not two. If two people need the same records, say so.</p>
      <p>Who logs in. Name every kind of person. “The client approves” means a second kind of user.</p>
      <p>What should be impossible. “A paid invoice cannot be edited” is a rule, and a builder will enforce it if you write it down.</p>
      <p>What you will take out. If you will want a CSV or a printout, ask in the first prompt.</p>

      <h2>What to leave out of the first prompt</h2>
      <p>Payments, WhatsApp or text sending, and email. Each needs an account of yours at an outside service, and each is easier to add once the records and screens exist. Every report you can imagine is also best left out: ask for the one screen you will open daily and add the others when you have real data. And skip adjectives that are only taste. “Clean and modern” gives the builder nothing. “Large text, used at a shop counter” does.</p>
      <p>A change after the first build usually costs a fraction of a new build, so a small first prompt followed by changes is cheaper as well as safer.</p>

      <h2>Websites need facts, not data</h2>
      <p>A website lives or dies on real details. Put your business name, area, WhatsApp number (or phone number) and opening hours in the prompt. Leave them out and the dashboard asks for them once before the build. You can skip that step, but then the site has blanks exactly where only you know the truth.</p>
    </PostShell>
  )
}
