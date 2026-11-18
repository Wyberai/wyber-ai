import { PostShell } from '@/components/signal/PostShell'
import { getPost, postMetadata } from '@/lib/blog/meta'

const post = getPost('email-deliverability-spf-dkim-dmarc')
export const metadata = postMetadata(post)

export default function Page() {
  return (
    <PostShell
      post={post}
      dek="Password resets and booking confirmations are worthless if they land in spam. Three DNS records decide whether mail from your domain is trusted, and most apps get at least one wrong."
      cta={{
        title: 'Build the app first, then fix the mail',
        body: 'Describe the app and check the estimate. When it needs to send email, you bring your own provider account.',
        href: '/signup',
        label: 'Start free',
      }}
    >
      <p>When your app sends an email, the receiving server asks two things: is this really from the domain it claims, and did that domain’s owner allow it? Three records in your DNS answer. If one is missing or wrong, Gmail and Outlook start treating your mail as suspect, and your customers never see the reset link.</p>

      <h2>SPF says who may send</h2>
      <p>SPF is one <code>TXT</code> record on your domain listing the servers allowed to send for it.</p>
      <pre><code>{`yourdomain.com.  TXT  "v=spf1 include:amazonses.com -all"`}</code></pre>
      <p>A domain may have only one SPF record. When you add a second provider, merge it into the same record rather than adding another, because two separate records make SPF fail for everyone. SPF also stops after ten DNS lookups, and every <code>include:</code> spends one or more, so remove providers you no longer use. <code>-all</code> says reject anything not listed; <code>~all</code> says treat it as suspicious. If you are not sure you know every sender, start with <code>~all</code>.</p>

      <h2>DKIM signs the message</h2>
      <p>Your provider signs each message with a private key and publishes the matching public key in DNS, under a name like <code>resend._domainkey.yourdomain.com</code>. Receivers fetch it and check the signature. You paste the record exactly as the provider gives it. The usual trap is a DNS host that appends your domain to whatever you type, producing <code>resend._domainkey.yourdomain.com.yourdomain.com</code>. Check what the DNS actually returns, not what you typed.</p>

      <h2>DMARC decides what happens on failure</h2>
      <pre><code>{`_dmarc.yourdomain.com.  TXT  "v=DMARC1; p=none; rua=mailto:dmarc@yourdomain.com"`}</code></pre>
      <p><code>p=none</code> means watch and report without blocking. Leave it that way for a few weeks, read the reports to find any sender you forgot, then tighten to <code>p=quarantine</code> and eventually <code>p=reject</code>. DMARC also checks alignment: the domain in the visible From address has to match the domain that passed SPF or DKIM. A provider that signs with its own domain can pass DKIM and still fail DMARC for your From address, which is why you set up custom-domain signing.</p>

      <h2>Check it from a terminal</h2>
      <pre><code>{`dig TXT yourdomain.com +short
dig TXT _dmarc.yourdomain.com +short
dig TXT resend._domainkey.yourdomain.com +short`}</code></pre>
      <p>On Windows, <code>nslookup -type=TXT yourdomain.com</code> does the same. You want exactly one record starting <code>v=spf1</code> and exactly one starting <code>v=DMARC1</code>. Then send a real message from the app to a Gmail address, open it, choose Show original, and look for <code>spf=pass</code>, <code>dkim=pass</code> and <code>dmarc=pass</code>. Whichever says otherwise is the record to fix.</p>

      <h2>The mistakes we would check first</h2>
      <p>Two DMARC or two SPF records. Receivers do not guess which you meant; they ignore both.</p>
      <p>A provider still in sandbox. Some, such as Amazon SES on a new account, deliver only to addresses you have verified until you request production access, so mail to real customers goes nowhere and nothing tells you.</p>
      <p>Sending from a free address like a Gmail account through your provider. You cannot authenticate a domain you do not own.</p>
      <p>One domain for everything. Send receipts and resets from a subdomain such as <code>mail.yourdomain.com</code> so a marketing complaint cannot drag them down with it.</p>

      <h2>Where the rules differ between India and the US</h2>
      <p>The technical records are the same everywhere. The law around them is not. In the US, the CAN-SPAM Act requires marketing email to carry a working unsubscribe, your postal address and an honest subject line, and it expects opt-outs to be honoured promptly. In India there is no direct equivalent for email, but the Digital Personal Data Protection Act expects you to have a lawful basis, usually consent, for using someone’s address, and business texts are regulated separately: commercial SMS has to go through registered sender IDs and templates under TRAI’s rules.</p>
      <p>Whatever the country, Google and Yahoo have required since 2024 that anyone sending in volume (over 5,000 messages a day to their users) has SPF, DKIM and DMARC in place, offers one-click unsubscribe on marketing mail, and keeps spam complaints low. A small app is judged on the same signals even when it is under that line.</p>
    </PostShell>
  )
}
