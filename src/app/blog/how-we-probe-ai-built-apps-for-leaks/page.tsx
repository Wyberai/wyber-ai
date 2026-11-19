import { PostShell } from '@/components/signal/PostShell'
import { getPost, postMetadata } from '@/lib/blog/meta'

const post = getPost('how-we-probe-ai-built-apps-for-leaks')
export const metadata = postMetadata(post)

export default function Page() {
  return (
    <PostShell
      post={post}
      dek="Open the network tab on almost any app built on Supabase and you will find a long key starting with eyJ. That key is public on purpose. What it can read is the part that goes wrong."
      cta={{
        title: 'Check your own app',
        body: 'The public scan needs no signup. It probes a live database the way a stranger would and audits any URL.',
        href: '/tools',
        label: 'Run the free scan',
      }}
    >
      <p>That key is called the anon key, and it ships inside every app that talks to Supabase from the browser. Anyone can copy it. It is meant to be copied. The protection is supposed to live in the database, in rules called row-level security (RLS) that decide which rows each visitor may see.</p>
      <p>When those rules are off, or when one of them says “allow everyone”, the key you were meant to be able to publish becomes a master key to that table. Names, phone numbers, invoices, orders. No exploit is involved. It takes one web request. In 2025 a vulnerability disclosure, CVE-2025-48757, described exactly this across apps produced by an AI app builder, and reports put the number affected at more than 170.</p>

      <h2>Why we test instead of reading the code</h2>
      <p>You can read an app’s code and see that RLS appears to be set up. A rule can exist and still allow everything, so “looks present” tells you very little. Our scan does what a stranger would do. It takes the public key with nobody logged in, asks the database which tables it advertises, tries to read each one, and counts the rows that come back. A table that answers with data is a finding. A table that answers 401 or 403 turned the key away. If rows come back, the leak is proven, not suspected.</p>
      <p>The scan only reads. It never inserts, changes or deletes anything.</p>

      <h2>How a finding is rated</h2>
      <p>If a table whose name looks private (users, customers, invoices, orders, payments) answers, that is critical. So is any table with a column that looks like personal or secret data: email, phone, token, password, address. A table that answers but has neither is rated medium, because plenty of tables are public on purpose, like a blog or a product list, and we ask you to confirm. The report gives a score from 0 to 100, where 100 means the public key reached nothing, and every finding comes with the evidence and the SQL to fix it.</p>
      <p>For a table with an owner column such as <code>user_id</code>, the suggested fix looks like this:</p>
      <pre><code>{`ALTER TABLE public."orders" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "orders_select_own" ON public."orders"
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "orders_modify_own" ON public."orders"
  FOR ALL TO authenticated USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);`}</code></pre>
      <p>When there is no owner column to key on, we only switch RLS on, which blocks everyone, and leave a commented template. We prefer an app that breaks loudly to one that stays open quietly. You then write the rule that matches how the data should be shared. <a href="/blog/row-level-security-patterns-for-small-apps">The next post</a> has four patterns that cover most small apps.</p>

      <h2>What it does not tell you</h2>
      <p>A clean score means the front door is shut. The scan does not test how your own rules treat two logged-in users, bugs in your code, or files in storage, and a public bucket of invoices is a leak even when every table is locked. Treat the result as a floor.</p>
      <p>It also matters outside engineering. India’s Digital Personal Data Protection Act and the privacy laws of US states such as California both expect reasonable security safeguards for personal data, and a customer table that anyone can read is hard to describe that way.</p>

      <h2>Try it on your own app in five minutes</h2>
      <p>This is for your own app only. Find the project URL and the public key in the app’s network requests, then, logged out, ask for a single row:</p>
      <pre><code>{`curl "https://YOUR-PROJECT.supabase.co/rest/v1/YOUR_TABLE?select=*&limit=1" \\
  -H "apikey: YOUR_PUBLIC_ANON_KEY"`}</code></pre>
      <p>A row means anyone on the internet can read that table. An error or an empty list means this table is closed to the public key. The scan does this for every table, on every publish from WyberAi, and the free version on the <a href="/tools">tools page</a> works on a live database without an account.</p>
    </PostShell>
  )
}
