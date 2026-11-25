import { PostShell } from '@/components/signal/PostShell'
import { getPost, postMetadata } from '@/lib/blog/meta'

const post = getPost('row-level-security-patterns-for-small-apps')
export const metadata = postMetadata(post)

export default function Page() {
  return (
    <PostShell
      post={post}
      dek="Four access rules cover most small apps: owner only, shared workspace, public read, and a public form. The SQL for each, how to test it as the person it is for, and where it quietly fails."
      cta={{
        title: 'See what your public key can read',
        body: 'The free scan tries your database the way a stranger would and shows which tables answer.',
        href: '/tools',
        label: 'Run the free scan',
      }}
    >
      <p>Row-level security is a rule attached to a table that decides, row by row, who may read or change what. Switch it on with no rules and nobody can touch the table through the public interface. You then add policies that open exactly the access you want. <a href="/blog/how-we-probe-ai-built-apps-for-leaks">The scan post</a> covers why this matters. This one is about what to write.</p>
      <p>Two terms first. <code>USING</code> decides which existing rows a person can see, update or delete. <code>WITH CHECK</code> decides what a person may write, which stops them inserting a row that belongs to someone else. Supabase gives the public interface two database roles: <code>anon</code> for visitors who are not logged in and <code>authenticated</code> for those who are.</p>

      <h2>Only the owner sees their rows</h2>
      <p>For personal data: expenses, notes, a customer’s own orders. The table needs a <code>user_id</code> column.</p>
      <pre><code>{`ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "expenses_owner" ON public.expenses
  FOR ALL TO authenticated
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);`}</code></pre>
      <p>Write <code>(select auth.uid())</code> rather than <code>auth.uid()</code>. Postgres then evaluates it once per query instead of once per row, which you will notice when the table grows. Index <code>user_id</code> too.</p>

      <h2>Everyone in a workspace shares rows</h2>
      <p>For a team, a school or a shop with staff. Keep membership in its own table and give every shared table an <code>org_id</code>.</p>
      <pre><code>{`CREATE TABLE public.memberships (
  user_id uuid REFERENCES auth.users NOT NULL,
  org_id  uuid NOT NULL,
  role    text NOT NULL DEFAULT 'member',
  PRIMARY KEY (user_id, org_id)
);

ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "invoices_members" ON public.invoices
  FOR ALL TO authenticated
  USING (org_id IN (
    SELECT org_id FROM public.memberships WHERE user_id = (select auth.uid())))
  WITH CHECK (org_id IN (
    SELECT org_id FROM public.memberships WHERE user_id = (select auth.uid())));`}</code></pre>
      <p>To let only admins delete, add a second policy <code>FOR DELETE</code> that also checks <code>role = 'admin'</code>. Policies for the same action are combined with OR, so keep each one narrow. A wide one added later quietly widens everything.</p>

      <h2>Everyone reads, only the owner writes</h2>
      <p>For a catalogue, a blog, a public profile.</p>
      <pre><code>{`CREATE POLICY "products_read" ON public.products
  FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "products_write" ON public.products
  FOR ALL TO authenticated
  USING ((select auth.uid()) = owner_id)
  WITH CHECK ((select auth.uid()) = owner_id);`}</code></pre>
      <p><code>USING (true)</code> is right here and wrong almost everywhere else. Our scan will list this table as publicly readable and ask whether you meant it. You did, so confirm.</p>

      <h2>Anyone can submit, only you can read</h2>
      <p>Enquiry forms, bookings, sign-ups on a website. Visitors are not logged in, so they arrive as <code>anon</code>.</p>
      <pre><code>{`CREATE POLICY "enquiries_submit" ON public.enquiries
  FOR INSERT TO anon, authenticated WITH CHECK (true);

CREATE POLICY "enquiries_read" ON public.enquiries
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.memberships m
                 WHERE m.user_id = (select auth.uid()) AND m.role = 'admin'));`}</code></pre>
      <p>There is no <code>SELECT</code> policy for <code>anon</code>, so a stranger can drop a message in and can never read one back. Expect spam on an open insert. A hidden honeypot field and a length limit on the text columns stop most of it.</p>

      <h2>Test it as the person it is for</h2>
      <p>A policy you have not run as a restricted user is a guess. In the Supabase SQL editor you can impersonate one:</p>
      <pre><code>{`begin;
set local role authenticated;
set local request.jwt.claims = '{"sub":"11111111-1111-1111-1111-111111111111"}';
select count(*) from public.expenses;   -- only that user's rows
rollback;`}</code></pre>
      <p>Repeat as <code>anon</code> and confirm private tables return nothing, then run the <code>curl</code> check from the scan post against the live URL.</p>

      <h2>Where it fails without telling you</h2>
      <p>The service role key skips RLS completely, so it belongs on a server and nowhere near front-end code. If it ever appears in a browser bundle, every policy above is decoration.</p>
      <p>Views run with their owner’s rights and can show rows your policies would hide. On Postgres 15 and later, create them with <code>WITH (security_invoker = true)</code>.</p>
      <p>Storage buckets have their own policies, separate from your tables. A locked invoices table next to a public invoices bucket is still a leak.</p>
    </PostShell>
  )
}
