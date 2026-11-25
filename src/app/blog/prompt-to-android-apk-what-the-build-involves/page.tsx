import { PostShell } from '@/components/signal/PostShell'
import { getPost, postMetadata } from '@/lib/blog/meta'

const post = getPost('prompt-to-android-apk-what-the-build-involves')
export const metadata = postMetadata(post)

export default function Page() {
  return (
    <PostShell
      post={post}
      dek="A mobile app built in WyberAi is a React Native project using Expo. Turning it into something people can install is a separate job with its own files, accounts and waiting time."
      cta={{
        title: 'Preview a mobile app on your phone',
        body: 'Describe the app, scan the code to try it on your own phone, then decide whether to build an installable file.',
        href: '/use-cases/build-mobile-app-with-ai',
        label: 'How mobile builds work',
        second: { href: '/signup', label: 'Start free' },
      }}
    >
      <p>There are three different things people mean by “my app is ready”. The preview is what you see when you scan a QR code and the app runs inside Expo’s viewer on your phone. It is quick and needs no accounts, but it is not an installed app, and some device features behave differently. The second is an installable file, a real Android package you can put on a phone. The third is a store release, where you upload a package to Google Play from your own developer account and pass its review. They need different things, and mixing them up is where the delays come from.</p>

      <h2>APK or AAB</h2>
      <p>An APK is a finished package you can install directly, after allowing installs from outside the store. It is what you want for testing on your own devices or handing to a client or a few staff. An AAB, an Android App Bundle, is a publishing format. Google Play takes it and produces the right package for each phone. Google requires it for new apps. So the usual route is an APK first, to see the app on real phones, and an AAB when you are ready to publish.</p>

      <h2>What the build step does</h2>
      <p>It compiles your code and assets into the Android package, signs it, and gives you a download. That happens on a build server, because it needs the Android toolchain. With Expo’s build service you describe each kind of build in <code>eas.json</code>:</p>
      <pre><code>{`{
  "build": {
    "preview": {
      "distribution": "internal",
      "android": { "buildType": "apk" }
    },
    "production": {}
  }
}`}</code></pre>
      <p>The <code>preview</code> profile gives you an APK you can pass around. <code>production</code> gives an AAB by default, ready for Google Play. You start one with <code>eas build --platform android --profile preview</code>.</p>
      <p>It is not instant. The build queues, sets up the toolchain, compiles and signs. In our own pipeline an Android build finished in 19 minutes, and we allow up to 35 before treating one as stuck. Plan for the wait, and do not start a second build while the first is running.</p>

      <h2>Signing, and why not to lose the key</h2>
      <p>Every Android app is signed with a key, and Google Play uses it to know an update really comes from you. Let Expo manage the credentials the first time, and keep access to that account recoverable. Lose the signing setup and updating the same app becomes very hard. Google Play’s app signing service lets Google hold the final key, which lowers the risk.</p>
      <p>Some identifiers are close to permanent. The package name, something like <code>com.yourshop.fees</code>, is the app’s identity forever once it is published, so choose it on purpose. The version code is a whole number that has to go up with every upload. The version name is the text customers see, like 1.0.2. The app name and icon you can change, though customers will remember them.</p>

      <h2>Accounts, and which phone to start with</h2>
      <p>You need an Expo account for builds, which is free to start, and a Google Play developer account, which has a one-time registration fee at the time of writing and asks you to verify your identity. If you also want an iPhone version, you need an Apple Developer Program membership, billed yearly. The stages are the same for iPhone, with Apple’s own signing and review.</p>
      <p>Which to do first depends on where your users are. Android is the large majority of phones in India, so for an app aimed at Indian customers it is the natural first release, and an APK you share directly works for early users. In the US the iPhone has the larger share, so an Android-only launch would miss many of your customers. Check the phones your first twenty users actually carry before you decide.</p>

      <h2>Before you upload to Google Play</h2>
      <p>Install the APK on at least two real phones, one older and one newer, and use every screen. Try it with no internet, a weak connection, and a permission denied. Have a public privacy policy page ready, because Play asks for its address, and fill in the data safety form honestly about what the app collects. Prepare screenshots and a short description, then build the AAB and upload it to an internal test track before you go public.</p>
      <p>WyberAi writes the project and can produce an installable file. Publishing to the store is done from your own developer account, because the listing, the signing relationship and the legal responsibility are yours.</p>
    </PostShell>
  )
}
