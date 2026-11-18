import { PostShell } from '@/components/signal/PostShell'
import { getPost, postMetadata } from '@/lib/blog/meta'
import { buildCosts, editCost } from '@/lib/pricing-facts'

const post = getPost('build-mobile-app-with-ai-2026')
export const metadata = postMetadata(post)

export default function Page() {
  return (
    <PostShell
      post={post}
      dek="Describe the screens, scan a code, and see the app on your own phone. That first part is quick. Getting from there to the app stores is a separate job, and worth knowing about early."
      cta={{
        title: 'Try a mobile app on your own phone',
        body: 'Describe the screens and the data, then scan the code to open it. No build tools to install.',
        href: '/use-cases/build-mobile-app-with-ai',
        label: 'How mobile builds work',
        second: { href: '/blog/prompt-to-android-apk-what-the-build-involves', label: 'What the build step does' },
      }}
    >
      <p>Making a mobile app used to begin with an afternoon of setup: pick a framework, install the toolchain, get a simulator running, wait for a first build that might not run. WyberAi skips that. It writes a React Native project using Expo from your description, and you see it on your phone by scanning a code.</p>

      <h2>Describe the screens and the data</h2>
      <p>Be specific about screens and what each one shows. The more you give it, the less you will change afterwards.</p>
      <pre><code>{`Build a fitness tracker with a Home screen showing today's workout
summary, a History screen with a weekly chart, and a Profile screen
with total workouts and current streak. Bottom tab navigation.`}</code></pre>
      <p>Mobile has its own habits worth stating in the prompt: whether the app works offline, what happens when a permission such as the camera is denied, and whether data stays on the phone or syncs to an account. Those decisions change the app more than colours do.</p>

      <h2>See it on your phone</h2>
      <p>When the build finishes, the preview offers a code to scan, and the app opens on your phone through Expo. It is real React Native, not a web page in a frame, so touch, scrolling and navigation behave as they will in the finished app. Some device features can behave differently in the preview than in an installed app, which is why testing an installed build later matters.</p>

      <h2>Change it by asking</h2>
      <p>Say what you want different: a settings screen with a notification toggle, a bar chart where there is a line, a green accent. The affected files are rewritten and the preview updates. Small changes cost a few credits where a new build costs more, so make the first build as complete as you can and change the details after.</p>

      <h2>Export, build and publish</h2>
      <p>You can export the whole Expo project as a ZIP and open it in an editor. To get an installable app you build it, either with Expo’s cloud build service, which makes the Android or iPhone package on its own servers so you do not need a Mac or a Windows build machine, or with the build WyberAi can produce for you. <a href="/blog/prompt-to-android-apk-what-the-build-involves">That post</a> explains APK versus AAB and what the wait looks like.</p>
      <p>Publishing to a store is done from your own developer account. Google Play has a one-time registration fee and Apple’s program is billed yearly, and both ask you to verify who you are. Plan for that before you plan a launch date, because the review and verification steps, not the building, are what take the time.</p>

      <h2>Where to start if you are choosing one platform</h2>
      <p>Look at your first customers’ phones. In India Android is the large majority of devices, so an Android release is the natural first step and you can hand early users an installable file directly. In the US the iPhone has the larger share, so an Android-only release would miss many of the people you are trying to reach. If you cannot tell, ask twenty of them what they carry.</p>

      <h2>What it costs</h2>
      <p>You start with 30 free credits and no card. A small build is {buildCosts().small} credits and a small edit starts at {editCost()}, so the free credits cover a few edits and part of a first build; buy a pack or a plan to finish one. Starter is $29 a month in the US (₹1,499 in India, ₹1,199 on annual billing) with 450 credits, and India also has the Spark plan from ₹499. Plans and top-ups are on the <a href="/pricing">pricing page</a>.</p>
    </PostShell>
  )
}
