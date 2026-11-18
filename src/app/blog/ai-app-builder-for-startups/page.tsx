import { PostShell } from '@/components/signal/PostShell'
import { getPost, postMetadata } from '@/lib/blog/meta'

const post = getPost('ai-app-builder-for-startups')
export const metadata = postMetadata(post)

export default function Page() {
  return (
    <PostShell
      post={post}
      dek="Before you sign with an agency, price the first version of what you actually need. Sometimes an agency is right. Often the first version should not cost an agency’s fee."
      cta={{
        title: 'Make the first version yourself, then decide',
        body: 'Describe the product, read the estimate, and see how far a first build gets you before you spend on anything else.',
        href: '/signup',
        label: 'Start free',
        second: { href: '/pricing', label: 'See plans' },
      }}
    >
      <p>Founders usually ask the wrong question here. “Agency or builder?” sounds like a choice between two ways to get the same thing. They are different things. An agency sells a team’s time and judgement. A builder sells a first working version, fast. Which one you need depends on how sure you are about what you are making.</p>

      <h2>What an agency is genuinely better at</h2>
      <p>If you already know exactly what to build and the hard part is the work itself, a good team earns its fee. That means deep integrations with older systems, anything with hardware or real-time multiplayer behaviour, regulated products where someone has to carry the compliance, and designs where the visual craft is the product. An agency is also accountable. When something breaks, you have someone to call, and that is worth paying for.</p>
      <p>A typical engagement runs through discovery, design and build, and quotes vary enormously with scope, country and team. We will not quote you a number, because any single number would be wrong for you. Get three quotes on the same written brief and compare scope, not price.</p>

      <h2>What a builder covers</h2>
      <p>You describe the product and WyberAi writes a working React app, with screens, data and navigation. The code is yours, and GitHub export is included on every plan. That is a real first version, not a mockup, and it is the right thing to put in front of five potential customers before you commit to anything larger. Changes are a chat message instead of a change order.</p>
      <p>The arithmetic on our own plans, so you can check it: a small build starts at 30 credits and a small edit is 4. Starter is $29 a month, or ₹1,499 in India (₹1,199 on annual billing), and includes 450 credits, which is about fifteen small builds. India also has Spark, ₹499 a month or ₹399 on annual billing, with 150 credits.</p>
      <p>There is one catch that matters for a product with logins. The database connection and your own domain start at the Builder plan, $79 a month or ₹3,999 in India, according to the pricing page. A first version that only needs to be seen and clicked through does not need either. One that stores customers’ data does.</p>

      <h2>The middle route</h2>
      <p>The most useful thing a builder does for an agency project is give you something to show them. Build the rough version yourself, put real data into it, show it to a few users, and write down what they stumbled on. Then take that to an agency. A quote based on a working prototype and a list of real feedback is smaller, clearer and harder to inflate than a quote based on a paragraph. You will also have found out whether anyone wants the thing before the expensive part starts.</p>

      <h2>Questions worth asking yourself first</h2>
      <p>Is the product mostly screens, records and workflows? A builder suits that well. Does it depend on something nobody has built before, or on a licence you do not have yet? Then an agency, or a specialist, is the honest answer. Will you maintain it yourself, or will someone have to? Code that nobody on the team can read is a risk whoever wrote it. And how much of the risk is whether anyone wants it? If most of it, spend as little as possible finding out.</p>
      <p>None of this changes with the country you are in. Rates for people differ between India and the US by a large factor, which is exactly why you should compare scope instead of price. What does not differ is that a first version you can put in front of customers this week teaches you more than a perfect plan does.</p>
    </PostShell>
  )
}
