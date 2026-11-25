import { PostShell } from '@/components/signal/PostShell'
import { getPost, postMetadata } from '@/lib/blog/meta'

const post = getPost('whatsapp-click-to-chat-vs-business-api')
export const metadata = postMetadata(post)

export default function Page() {
  return (
    <PostShell
      post={post}
      dek="In India your customers are on WhatsApp. In the US they text. Either way you face the same choice: let a person tap send, or let a server do it."
      cta={{
        title: 'Start with the records, add messaging second',
        body: 'Build the app that holds the data first. A prefilled message button needs no account and is a small change to add.',
        href: '/create',
        label: 'Describe your app',
      }}
    >
      <p>Almost every small business app ends up needing to message customers: a fee reminder, an appointment confirmation, “your order is ready”. There are two very different ways to do it, and choosing the wrong one first costs weeks. One is a link. The other is an API.</p>

      <h2>The link: a person taps send</h2>
      <p>A WhatsApp click-to-chat link opens WhatsApp with the chat addressed and the message already typed. A text-message link does the same with the phone’s messaging app. No server sends anything and no account is needed.</p>
      <pre><code>{`https://wa.me/919876543210?text=Hello%2C%20your%20fee%20of%20%E2%82%B91%2C200%20is%20due

sms:+15551234567?body=Hi%2C%20your%20estimate%20is%20ready`}</code></pre>
      <p>The WhatsApp number is international format, digits only: no plus sign, spaces, dashes or leading zero. A bare Indian mobile like 98765 43210 becomes <code>919876543210</code>. The message has to be URL-encoded, which <code>encodeURIComponent</code> does, rupee sign included. On a phone the link opens the app; on a computer it opens WhatsApp Web. The <code>sms:</code> link behaves slightly differently between iPhone and Android, so test it on both before you put it in front of customers.</p>
      <p>What the link cannot do is send by itself, attach a file, tell you whether the message was delivered or read, or message anyone at 3 a.m. A person always taps the button. That limit is also a feature. You are texting a customer you chose to contact, so there is no consent paperwork to get wrong.</p>

      <h2>The API: a server sends</h2>
      <p>An API lets software send and receive messages with nobody at a desk. It is how automatic receipts, appointment reminders and bots work. It comes with setup and rules, and they differ by channel.</p>
      <p><strong>WhatsApp Business API.</strong> You need a business account and a phone number registered with Meta, and that number cannot be used in the normal WhatsApp app at the same time. Most small businesses go through a provider that supplies the dashboard and API. To start a conversation, or to write to someone who has not messaged you in the last 24 hours, you must use a template message that Meta has approved in advance. Inside that 24-hour window after the customer writes, you can reply freely. Template messages are billed per message by category and country, and you need the customer’s permission to send them.</p>
      <p><strong>Business text messages in the US.</strong> You send through a provider such as Twilio, but carriers require you to register your brand and your use case before application-to-person texts will reliably arrive. This is called 10DLC registration, and approval can take days, so start it before you launch, not after. Marketing texts also need clear prior consent, and you must honour STOP replies. Toll-free numbers have their own verification.</p>
      <p><strong>Business text messages in India.</strong> Commercial SMS goes through registered sender IDs and approved templates under TRAI’s rules, arranged with a provider.</p>
      <p>All of these are accounts of yours at an outside service. A builder can write the code that calls them, but it cannot supply the account.</p>

      <h2>A rule for choosing</h2>
      <p>Use the link while a person at a desk can send the messages. A handful of reminders a day, a “Chat with us” button on a website, a “Send me the details” button: all links. Move to an API when the person becomes the bottleneck. That means messages that must go out with nobody present, a need to know delivered, read or failed per message, hundreds of customers needing the same notice, or a bot or shared inbox answering people.</p>
      <p>Our sample school fee tracker is a good example of starting small. Every overdue row has a button that opens WhatsApp with the parent’s number and a ready message. Nothing sends automatically. For a school office that is enough, and it took no accounts and no approvals.</p>

      <h2>Save the phone number properly</h2>
      <p>Normalise numbers when you save them, not when you build the link. If half your records say <code>98765 43210</code> and half say <code>+91-98765-43210</code>, every link and every duplicate check turns into a guess. Store the number in the international E.164 form, <code>+919876543210</code> or <code>+15551234567</code>, with the country kept explicitly.</p>
      <p>Do not guess the country from the digits. A bare ten-digit number can be Indian or American, and an app that sells in both has to ask, or default from the customer’s address, or use a phone-number library that parses with a stated region. Guessing wrong sends a customer’s reminder to a stranger.</p>
    </PostShell>
  )
}
