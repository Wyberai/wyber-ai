import { PostShell } from '@/components/signal/PostShell'
import { getPost, postMetadata } from '@/lib/blog/meta'

const post = getPost('seo-for-ai-built-websites')
export const metadata = postMetadata(post)

export default function Page() {
  return (
    <PostShell
      post={post}
      dek="A website made in the browser by an AI builder can rank in search. Whether it does depends on a short list of basics, and on a decision about your domain that many people make too late."
      cta={{
        title: 'Build a website, then run the checklist',
        body: 'Give the builder your real business name, area, phone or WhatsApp number and hours, then check the page against the list above.',
        href: '/websites',
        label: 'See website builds',
        second: { href: '/tools', label: 'Run the free SEO scan' },
      }}
    >
      <p>A local business owner asked us a fair question: if the site is built by an AI, will anyone find it on Google? The honest answer has two halves. The technology is not what stops a site from ranking. And a site is only one of the things that decide whether you show up.</p>

      <h2>How these sites are made</h2>
      <p>WyberAi websites are React apps that render in the browser. Google can read pages that depend on JavaScript, but it does so in a second pass, so a new site can be slower to appear than a plain HTML page. For a small business site with a handful of pages this is usually fine. For a site where search is your main source of customers, check how Google sees it rather than assuming. In Search Console, the URL Inspection tool shows the page as Google rendered it, and if your text is missing there, you have a real problem.</p>

      <h2>The basics, in order of effect</h2>
      <p><strong>A real title and description on every page.</strong> The title is what shows in search results and the single most visible thing you control. It should say what you are and where, in plain words: “Dentist in Navrangpura, Ahmedabad” beats “Home”. Each page needs its own.</p>
      <p><strong>One clear heading per page.</strong> Exactly one main heading that says what the page is about, with subheadings under it. Search engines and screen readers both use that structure.</p>
      <p><strong>Words on the page.</strong> A page with a gallery and two lines of text gives search nothing to work with. Describe each service in a couple of sentences, say where you are, and answer the questions customers actually ask. Real details beat adjectives.</p>
      <p><strong>Alt text on images.</strong> Short and literal. “Dental chair in the treatment room” is enough.</p>
      <p><strong>A sitemap and a robots file.</strong> They tell search engines which pages exist. Submit the sitemap in Search Console.</p>
      <p><strong>Structured data.</strong> A small block of code describing your business as a local business: name, address, phone, hours. It is how some of the extra information in search results gets filled in. Only put in facts that are true and that you gave us.</p>
      <p>In our own test builds we check for these: the title and description, a single main heading, alt text, a sitemap and robots file, structured data, and that every in-page link points at something. A page that fails them is worth fixing before you launch.</p>

      <h2>Your domain matters more than people expect</h2>
      <p>By default a published site lives at an address under wyberai.com. That is fine for sharing with a customer. For ranking, a business should be on its own domain, because the reputation you build then belongs to you and goes with you if you change tools. Your own domain starts at the Builder plan, so factor that in before you plan to rely on search.</p>

      <h2>For local businesses, the site is not the main event</h2>
      <p>Whether you are a clinic in Ahmedabad or a plumber in Phoenix, most “near me” searches are answered by the map results, not by websites. Those come from your Google Business Profile: claim it, fill in every field, keep the hours right, add real photos and reply to reviews. Keep your name, address and phone number identical everywhere they appear, including your site. A mismatch between your profile and your site quietly costs you.</p>
      <p>In India, add your WhatsApp number and make the call or message button one tap on a phone. In the US, a phone number that can be tapped to call and an obvious way to book matter more than anything clever on the page.</p>

      <h2>Be patient, and measure</h2>
      <p>A new site takes weeks, not days, to settle in search, and a handful of useful pages with accurate details will beat a large site of thin ones. Set up Search Console on day one and look at which searches show your pages after a month. That tells you what to write next.</p>
    </PostShell>
  )
}
