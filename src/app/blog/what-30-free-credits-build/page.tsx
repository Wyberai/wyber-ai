import { PostShell } from '@/components/signal/PostShell'
import { getPost, postMetadata } from '@/lib/blog/meta'
import { buildCosts, editCost } from '@/lib/pricing-facts'

const post = getPost('what-30-free-credits-build')
export const metadata = postMetadata(post)

export default function Page() {
  return (
    <PostShell
      post={post}
      dek="Thirty credits will not finish a whole app. We would rather tell you that now than have you find out when the estimate appears."
      cta={{
        title: 'Start with one real problem',
        body: 'Describe it and read the estimate. Nothing is charged until you confirm.',
        href: '/signup',
        label: 'Start free',
        second: { href: '/gallery', label: 'Browse free apps first' },
      }}
    >
      <p>Every new account gets 30 credits and no card is asked for. A small first build starts at {buildCosts().small}. Do that sum and you can see what the free balance is: not a whole app. It pays for a handful of small edits ({editCost()} credits each) and for trying the builder, and it is the reason the estimate appears before anything is charged.</p>
      <p>To finish a first build you buy a credit pack or take a plan. That is not a trick, but it is the kind of detail that is annoying to discover halfway through, so here it is up front.</p>

      <h2>What a credit pays for</h2>
      <p>Credits pay for generation: writing a new app, or changing one in a way that makes the builder write more code. Browsing is free. So is previewing an app, and opening any template in the free gallery costs nothing. Before every build you see an estimate on screen, and if a build fails the credits come back.</p>
      <p>Bigger things cost more because they write more files. A multi-page product or a mobile app costs more than a small build, and the estimate says so before you commit. Plans are priced in rupees, with UPI, for visitors in India, and in US dollars elsewhere.</p>

      <h2>Two builds from our own testing</h2>
      <p>In mid-November we built a couple of sample apps for businesses that do not exist, to see what the builder does with a short brief. We did not record their credit cost, so we will not put a number on them. What we can describe is what came out.</p>
      <p>SlateFee is a fee tracker for a school. For the month it shows what is expected, what has been collected and what is overdue, with a bar for each class, a student list, receipts and a history. It exports to CSV, it prints, and a fee still unpaid after the 10th shows as overdue. The reminder button opens WhatsApp with the message already written; nothing is sent until a person taps send. It keeps its data in the browser you used, which means two computers will not see the same records until a database is connected. That is the kind of limit worth knowing about before you give an app to a school office with three desks.</p>
      <p>Smile Care Dental Clinic is a website. It switches between English, Hindi and Gujarati, has a WhatsApp button, and puts opening hours at the top of the page.</p>
      <p>We ran the same automated checks on both at phone, tablet and desktop widths: no sideways scrolling, no unlabelled buttons or form fields, no errors in the browser console on load. Those checks tell you the basics hold. They cannot tell you whether the copy suits your business. Only you can.</p>

      <h2>Making your credits go further</h2>
      <p>Pick one job. “Track which students have paid this month” builds better than “a school management system”, and costs less because it writes less. Say who uses it and what they do each day. If the estimate is more than you want to spend, cut the brief or split the idea in two and build the half you need first.</p>
      <p>And look at the <a href="/gallery">gallery</a> before you build anything. It holds hundreds of ready-made apps that cost nothing to open, and a template you adjust a little often beats a custom build you pay for.</p>
    </PostShell>
  )
}
