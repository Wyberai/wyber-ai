// Store pack for an exported mobile app: plain-language drafts the owner needs to fill the Play Console and App Store Connect forms,
// built from what the code actually does (permissions it asks for, whether it has accounts, whether data leaves the phone, whether it
// calls an AI service). Deterministic, no model call, 0 credits. These are drafts to check, not legal advice or a compliance claim.
//
// Rules this reflects (secondary sources read 14 Nov 2026, confirm in the consoles before submitting):
//   - Google Play: new apps and updates must target Android 16 (API 36) since 31 Aug 2026; apps with AI features must document what user
//     data reaches AI services (policy update of 15 Jul 2026); an app needs a completed content rating; in-app account deletion plus a web link.
//   - Apple: builds must come from Xcode 26 or later since 28 Apr 2026; App Privacy answers and the age-rating questions are required;
//     in-app account deletion when the app has accounts.

type FileVal = { content?: string } | string | undefined
const contentOf = (v: FileVal): string => (typeof v === 'string' ? v : (v?.content ?? ''))

export interface StoreFacts {
  appName: string
  permissions: { camera: boolean; photos: boolean; location: boolean; notifications: boolean; contacts: boolean; microphone: boolean }
  hasAccounts: boolean
  dataLeavesPhone: boolean
  usesAi: boolean
  hasPayments: boolean
  hasAds: boolean
}

export function detectStoreFacts(files: Record<string, FileVal>, appName: string): StoreFacts {
  const code = Object.entries(files || {}).filter(([p]) => /\.(tsx?|jsx?|json)$/.test(p)).map(([, v]) => contentOf(v)).join('\n')
  return {
    appName: appName || 'Your app',
    permissions: {
      camera: /expo-camera|useCameraPermissions|requestCameraPermissionsAsync/.test(code),
      photos: /expo-image-picker|expo-media-library/.test(code),
      location: /expo-location/.test(code),
      notifications: /expo-notifications/.test(code),
      contacts: /expo-contacts/.test(code),
      microphone: /expo-audio|requestRecordingPermissionsAsync|expo-av/.test(code) && /record/i.test(code),
    },
    hasAccounts: /signInWith|createUserWithEmail|supabase\.auth|signUp\(/i.test(code),
    dataLeavesPhone: /fetch\(\s*['"`]https?:|supabase|axios|firebase/i.test(code),
    usesAi: /anthropic|openai|api\.openai\.com|generativelanguage|gemini|claude/i.test(code),
    hasPayments: /revenuecat|react-native-purchases|stripe|expo-in-app-purchases|billing/i.test(code),
    hasAds: /admob|react-native-google-mobile-ads|facebook-ads/i.test(code),
  }
}

const yes = (b: boolean) => (b ? 'Yes' : 'No')

export function buildStorePack(files: Record<string, FileVal>, appName: string): Record<string, string> {
  const f = detectStoreFacts(files, appName)
  const perms = Object.entries(f.permissions).filter(([, v]) => v).map(([k]) => k)
  const out: Record<string, string> = {}

  out['store/README.md'] = `# Store pack for ${f.appName}

These drafts were written from what your app's code does. Read each one, correct anything that is wrong, and fill the store forms yourself.
They are not legal advice and they do not say your app is compliant with any law.

What the code shows: permissions used: ${perms.length ? perms.join(', ') : 'none'}; accounts: ${yes(f.hasAccounts)}; data leaves the phone: ${yes(f.dataLeavesPhone)}; calls an AI service: ${yes(f.usesAi)}; payments: ${yes(f.hasPayments)}; ads: ${yes(f.hasAds)}.

Files: listing.md, privacy-policy.md, google-data-safety.md, apple-privacy-and-age-rating.md, release-checklist.md${f.usesAi ? ', ai-disclosure.md' : ''}${f.hasAccounts ? ', account-deletion.md' : ''}.
`

  out['store/listing.md'] = `# Store listing draft

App name: ${f.appName}
Short description (80 characters at most): <write one plain sentence about what the app does and for whom>
Full description: <what it does, the three things people use it for most, what it costs, how to contact you>
Category: <pick the closest>
Contact email: <yours>
Privacy policy URL: <the public address where you publish store/privacy-policy.md>

Screenshots needed: at least 2 phone screenshots for each store (Google Play: 16:9 or 9:16, 320 to 3840 px; App Store: 6.9 inch and 6.5 inch iPhone sizes). Take them from a real device or the simulator with the empty first run and the demo data loaded.
Do not put text in the listing that the app does not deliver: no ratings, download counts, awards or "AI-powered" unless true.
`

  out['store/privacy-policy.md'] = `# Privacy policy for ${f.appName} (draft; have it reviewed)

Last updated: <date>
Who we are: <your name or business>, contact <email>.

What the app stores: ${f.dataLeavesPhone ? 'Some data is sent to a server we use to run the app: <name the service and say what is sent>.' : 'The app stores its data on your phone only. We do not receive it.'}
${f.hasAccounts ? 'Accounts: if you create an account we store your email address and the content you add so you can sign in on this device.\n' : ''}${perms.length ? `Permissions: the app asks for ${perms.join(', ')} only when you use the feature that needs it, and works without it where possible.\n` : ''}${f.usesAi ? 'AI features: text you send to an AI feature is sent to <the AI provider> to produce a reply. <say how long it is kept and whether it is used to train models>.\n' : ''}Your choices: you can export your data and delete it inside the app (Settings).${f.hasAccounts ? ' You can delete your account inside the app.' : ''}
Children: <say the minimum age>.
Changes: we will update this page and the date above.
`

  out['store/google-data-safety.md'] = `# Google Play Data safety answers (draft; confirm in Play Console)

Does the app collect or share user data: ${yes(f.dataLeavesPhone || f.hasAccounts || f.usesAi || f.hasAds)}
Data types likely to declare: ${[f.hasAccounts && 'email address (account)', f.permissions.location && 'location', f.permissions.photos && 'photos', f.permissions.contacts && 'contacts', f.permissions.camera && 'photos or video (camera)', f.permissions.microphone && 'audio', f.dataLeavesPhone && 'app content you store on our server', f.usesAi && 'text sent to an AI service'].filter(Boolean).join('; ') || 'none'}
Is data encrypted in transit: ${f.dataLeavesPhone ? 'Yes if every request uses https (check)' : 'Not applicable, nothing is sent'}
Can users ask for deletion: Yes, inside the app${f.hasAccounts ? ' and by a web link you must publish' : ''}.
${f.usesAi ? 'AI services: Google Play requires you to document what user data goes to AI services, why, how long it is kept and how consent is handled (policy update of 15 July 2026). See ai-disclosure.md.\n' : ''}Ads: ${yes(f.hasAds)}
`

  out['store/apple-privacy-and-age-rating.md'] = `# App Store Connect: App Privacy and age rating (draft; confirm in App Store Connect)

Data collected: ${[f.hasAccounts && 'Contact info: email address', f.permissions.location && 'Location', f.permissions.photos && 'Photos or videos', f.permissions.contacts && 'Contacts', f.dataLeavesPhone && 'User content', f.usesAi && 'User content sent to an AI service'].filter(Boolean).join('; ') || 'None'}
Used for tracking: ${yes(f.hasAds)}
Age rating questions: answer each question in App Store Connect about violence, mature themes, gambling, unrestricted web access and user-generated content. If the app lets people post content others see, say so.
Account deletion: ${f.hasAccounts ? 'Required: the app must let people delete their account inside the app.' : 'Not needed, the app has no accounts.'}
Review notes: say how to reach every feature, and give a demo account if sign-in is needed.
`

  if (f.usesAi) {
    out['store/ai-disclosure.md'] = `# AI data disclosure (draft)

Which AI service: <name>
What user data is sent to it: <the text, images or other data a user enters in the AI features>
Why: <what the feature does with it>
How long it is kept, and whether it is used to train models: <check the provider's terms and write what is true>
How consent is handled: <for example a one-time notice before the first AI use, with a way to turn the feature off>
`
  }

  if (f.hasAccounts) {
    out['store/account-deletion.md'] = `# Account deletion

In the app: Settings, Delete my account, then a typed confirmation. This must really delete the account and its data.
On the web: both stores want a public page where a person can ask for deletion without installing the app. Publish a short page with your contact email and what happens (what is deleted, how long it takes), and paste its address in the store forms.
`
  }

  out['store/release-checklist.md'] = `# Release checklist

Build targets (stores enforce these; confirm the current numbers before you submit):
- Google Play: new apps and updates must target Android 16 (API 36) since 31 August 2026. Keep Expo SDK and EAS build settings on a version that does.
- App Store: upload builds made with Xcode 26 or later (required since 28 April 2026); expect the next Xcode requirement around April 2027.
- Content rating: complete the questionnaire in Play Console (apps without one cannot be listed) and the age-rating questions in App Store Connect.

Before you build:
1. Test on one real Android phone and one real iPhone, with and without network, light and dark mode, large system text.
2. Check every permission prompt and the "denied" path.
3. Make sure the privacy policy URL works in a browser.

Building the store files (an .aab for Google Play, an .ipa for the App Store) is a paid step in WyberAi and runs only when you ask for it.
`
  return out
}
