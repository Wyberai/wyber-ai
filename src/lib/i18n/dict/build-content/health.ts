import type { Locale } from '../../locales'

export interface TranslatedBuildPage {
  h1: string
  metaTitle: string
  metaDesc: string
  tagline: string
  body: string[]
  features: { title: string; desc: string }[]
  promptExample: string
  faqs: { q: string; a: string }[]
}

// AI-drafted, not yet native-reviewed (see AutoTranslateNotice). Per-page
// content for the "health" category /build/[slug] pages (English source:
// src/app/build/data/health.ts). Proper nouns, brand names, and tech terms
// (WyberAi, React Native, Expo, CSV, Calm) are left untranslated across
// every locale — only the surrounding prose is translated. slug/target/
// category/related live on BuildPage itself and aren't duplicated here.
export const HEALTH_BUILD_CONTENT: Record<Locale, Record<string, TranslatedBuildPage>> = {
  en: {
    'workout-tracker-app': {
      h1: 'Build a Workout Tracker App with AI',
      metaTitle: 'Build a Workout Tracker App with AI — No Code',
      metaDesc: 'A gym log that matches your program: exercises, sets, progressive overload charts. Describe it in English, get a working mobile app in minutes.',
      tagline: 'Log sets between sets. See the overload curve. Built around your program — push/pull/legs, 5×5, or your coach\'s spreadsheet.',
      body: [
        'A workout log has one job: capture the set you just did before the rest timer ends, and prove next week that the bar is moving up. Store-bought fitness apps wrap that in social feeds, coaching upsells, and subscriptions — while your actual program probably lives in a spreadsheet a coach gave you.',
        'WyberAi turns that spreadsheet into an app. Describe your split and what you record per set, and it generates the mobile app: a today-workout screen with your programmed exercises, fast set logging with previous-session numbers beside each input, and per-exercise charts that show whether squat volume is actually climbing. It\'s your program as software, not someone else\'s app with your program squeezed in.',
      ],
      features: [
        { title: 'Your split, programmed in', desc: 'Push/pull/legs, upper/lower, 5×5 — workout days generated from your routine, each with its exercise list.' },
        { title: 'Rest-timer-speed logging', desc: 'Weight and reps per set with last session\'s numbers shown inline — log a set in the time it takes to rack the bar.' },
        { title: 'Progressive overload charts', desc: 'Per-exercise graphs of top set and total volume over time — the proof the program is working.' },
        { title: 'PR tracking', desc: 'Personal records detected from your logs and celebrated on a records screen, per lift.' },
      ],
      promptExample: 'Build a workout tracker mobile app for a push/pull/legs program: a Today screen showing the scheduled day\'s exercises where I log weight and reps per set with last session\'s numbers displayed next to each input; a Progress screen with a per-exercise chart of heaviest set over time; and a Records screen listing my PR for each lift. Dark theme, big touch targets.',
      faqs: [
        { q: 'Can it follow my coach\'s program?', a: 'Yes — describe the days, exercises, and set/rep scheme (or paste the plan into chat) and the app is generated around that exact program.' },
        { q: 'Can I change my program mid-cycle?', a: 'Ask in chat — "swap bench for incline dumbbell press on push day" — and the program updates while your history stays intact.' },
        { q: 'Does it work offline at the gym?', a: 'The generated app is a standard React Native + Expo project; ask for offline-first logging in your prompt and entries sync when you\'re back online.' },
        { q: 'How fast can I have it on my phone?', a: 'Builds take minutes, and you preview on your own phone via Expo immediately — most people log their next session in their own app.' },
      ],
    },
    'meal-planner-app': {
      h1: 'Build a Meal Planner App with AI',
      metaTitle: 'Build a Meal Planning App with AI — No Code',
      metaDesc: 'Weekly meal plans, a recipe box, and an auto-built grocery list — a meal planner generated from your description, shaped to how your household eats.',
      tagline: 'Plan the week on Sunday, shop from an auto-built list, stop asking "what\'s for dinner" at 6pm.',
      body: [
        'Meal planning fails at the seams: the recipes live in screenshots, the plan lives in your head, and the grocery list gets rewritten from scratch every week. Planner apps exist, but they push their recipe catalogs and their idea of a week — when the recipes that matter are the twelve your household actually eats.',
        'Describe how you plan — how many meals a day, who\'s vegetarian, what a shopping trip looks like — and WyberAi generates the planner around your kitchen: a recipe box you fill once, a drag-together weekly grid, and a grocery list that compiles itself from the week\'s ingredients, grouped by aisle. Prep-day cooking, macro targets, or a picky-kid column — it\'s your app, so the plan bends to the household.',
      ],
      features: [
        { title: 'Your recipe box', desc: 'Your dishes with ingredients, servings, and tags — the dozen meals you rotate, not a database of 40,000 you don\'t.' },
        { title: 'Weekly planning grid', desc: 'Assign recipes to days and meals for the week ahead; repeat last week in one tap when it was a good week.' },
        { title: 'Auto-compiled grocery list', desc: 'Ingredients from the planned week merged into one list — quantities summed, grouped by aisle, checkable in the shop.' },
        { title: 'Household preferences', desc: 'Dietary tags and per-person rules (vegetarian Mondays, no mushrooms for the kids) respected in the plan view.' },
      ],
      promptExample: 'Build a meal planner web app: a Recipes page where I add dishes with ingredients (name, quantity, unit), servings, and tags like vegetarian or quick; a Planner page with a Monday-to-Sunday grid for lunch and dinner where I assign recipes; and a Grocery List page that compiles all ingredients from the planned week, sums quantities, groups them by category, and lets me check items off while shopping.',
      faqs: [
        { q: 'Can it scale recipes for different serving counts?', a: 'Yes — set servings per planned meal and ingredient quantities scale before they land on the grocery list.' },
        { q: 'Can my partner and I share the same planner?', a: 'Yes — it\'s a web app with logins, so the whole household sees one plan and one list, updated live.' },
        { q: 'Can it track calories or macros?', a: 'Add per-ingredient or per-recipe macro fields in your prompt (or later in chat) and the planner can show daily totals against targets.' },
        { q: 'Do I need to code anything?', a: 'No — you describe the planner, WyberAi generates the working app, and further changes are plain-English requests in chat.' },
      ],
    },
    'meditation-app': {
      h1: 'Build a Meditation App with AI',
      metaTitle: 'Build a Meditation & Mindfulness App with AI',
      metaDesc: 'A personal mindfulness app — session timer, breathing guides, and a calm streak — generated from plain English. Yours, with no subscription attached.',
      tagline: 'A timer, a breathing guide, and a quiet record of your practice — without a $70/year subscription between you and ten minutes of silence.',
      body: [
        'The strange economics of mindfulness apps: you pay a yearly subscription mostly for a timer, some bells, and a streak counter — then the app interrupts your calm to upsell sleep stories. A personal meditation app inverts that: exactly the practice you do, nothing on the screen you didn\'t put there.',
        'Tell WyberAi how you practice — timed silent sits, box breathing, a morning body scan — and it generates a React Native app around it: a session timer with gentle start and end chimes, an animated breathing pacer set to your count, and a history that shows your practice building without gamifying it. It\'s the rare app category where less is the feature, and owning it is how you get less.',
      ],
      features: [
        { title: 'Session timer with chimes', desc: 'Pick a duration, get start/end bells and optional interval markers — the screen stays dark in between.' },
        { title: 'Breathing pacer', desc: 'An animated guide for box breathing or 4-7-8 — the circle expands and contracts to your chosen counts.' },
        { title: 'Practice history', desc: 'Sessions logged with duration and type; a calm calendar view of your consistency, no badges shouting at you.' },
        { title: 'Your practices, listed', desc: 'Silent sit, body scan, walking meditation — your own practice menu, each with its own default timer.' },
      ],
      promptExample: 'Build a meditation mobile app: a Home screen listing my practices (Silent Sit, Box Breathing, Body Scan) each with a default duration; a Session screen with a minimal countdown timer, start and end chime, and screen kept dark during the sit; a Breathing screen with an animated circle pacing 4-4-4-4 box breathing; and a History screen with a monthly calendar of completed sessions. Very minimal, dark, no gamification.',
      faqs: [
        { q: 'Can it play ambient sounds or guided audio?', a: 'Yes — ask for an audio option in your prompt and add your own tracks; the app plays them under the timer.' },
        { q: 'Can I adjust the breathing rhythm?', a: 'The pacer counts are settings — change 4-4-4-4 to any pattern in the app, or ask chat to add presets like 4-7-8.' },
        { q: 'Why build this instead of subscribing to Calm?', a: 'If your practice needs a library of celebrity sleep stories, subscribe. If it needs a timer, a pacer, and a record — that\'s an afternoon build you own forever.' },
        { q: 'Does it need an account?', a: 'Your call — build it as a purely personal single-user app, or add login later if you want your history synced across devices.' },
      ],
    },
    'period-tracker-app': {
      h1: 'Build a Period Tracker App with AI',
      metaTitle: 'Build a Private Period Tracker App with AI',
      metaDesc: 'Cycle predictions, symptom logging, and a history view — on your own database, not a big-tech app selling your health data. Built from plain English.',
      tagline: 'Cycle predictions and symptom logging that live on YOUR database — not a big-tech app with a business model built on your health data.',
      body: [
        'Period tracking apps have earned genuine distrust: several mainstream ones have been caught selling or sharing exactly the data — cycle dates, symptoms, sexual activity — that users least want leaving their phone. For something this personal, "who owns this data" isn\'t a minor detail, it\'s the whole decision.',
        'Building your own collapses that risk to zero: describe how you want to log and predict cycles, and WyberAi generates an app that stores everything in a database only you control, with no analytics SDK bundled in by a company whose revenue model depends on your data. Cycle predictions, symptom and mood logging, and a history view that helps you actually spot patterns — the features, without the tradeoff.',
      ],
      features: [
        { title: 'Cycle logging and predictions', desc: 'Log period start and end dates; the app predicts your next cycle based on your own history, not a population average.' },
        { title: 'Symptom and mood tracking', desc: 'Log symptoms, flow intensity, and mood per day — your own tags, not a fixed list a product team chose for you.' },
        { title: 'Private by construction', desc: 'Your data lives in your own database with no third-party analytics or ad SDKs bundled in — because you didn\'t build any in.' },
        { title: 'History and patterns', desc: 'A calendar view across past cycles so patterns — irregular timing, symptom clusters — are visible over months, not just this cycle.' },
      ],
      promptExample: 'Build a period tracker mobile app: a Log screen to record period start/end dates, flow intensity, symptoms (cramps, headache, fatigue), and mood for any day; a Calendar screen showing past cycles and a predicted next start date based on average cycle length; and a History screen with trends in cycle length and most common symptoms over the last 6 months. Simple, private, no social features.',
      faqs: [
        { q: 'Is my data really private?', a: 'It\'s stored in your own app\'s database, generated with no analytics or tracking SDKs unless you explicitly ask for them — nothing to sell because nothing is collected by a third party.' },
        { q: 'How accurate are the predictions?', a: 'Predictions are based on your own logged cycle history — the more cycles logged, the more the average reflects your actual pattern rather than a generic 28-day assumption.' },
        { q: 'Can I export my data?', a: 'Ask for a CSV export in your prompt — your history is yours to take with you, unlike a closed app\'s walled-off records.' },
        { q: 'Can a partner or doctor see specific data?', a: 'Ask for a shareable summary or PDF report screen if you want to hand specific data to a doctor — sharing stays entirely your choice.' },
      ],
    },
    'sleep-tracker-app': {
      h1: 'Build a Sleep Tracker App with AI',
      metaTitle: 'Build a Sleep Tracker App with AI — No Code',
      metaDesc: 'Log bedtime and wake time, see your sleep debt, and spot what wrecks a night — a sleep tracker generated from plain English, no wearable required.',
      tagline: 'Log the night, see the debt add up, and spot that late coffee is the actual reason Wednesdays feel awful.',
      body: [
        'You don\'t need a $300 ring to notice you\'re tired — you need an honest record of when you actually went to sleep and woke up, compared against what you know you need. Wearable-linked apps drown that simple fact in scores and stages measured by consumer sensors of questionable accuracy.',
        'A logged sleep tracker skips the sensor entirely: tell WyberAi how you want to record nights — bedtime, wake time, how rested you felt — and it builds an app around that habit. A weekly chart shows the pattern, a running sleep-debt number makes the deficit concrete, and optional notes (late coffee, a stressful day, a nightcap) let you correlate cause with the groggy mornings without needing a device on your wrist to tell you what you already suspected.',
      ],
      features: [
        { title: 'Bedtime and wake logging', desc: 'A quick nightly entry for when you went to bed and woke up — the two numbers that actually matter.' },
        { title: 'Sleep duration chart', desc: 'A weekly view of hours slept per night, so a bad streak is visible instead of just felt.' },
        { title: 'Sleep debt tracker', desc: 'A running total against your target hours per night — the number that explains why Thursday feels worse than Monday.' },
        { title: 'Correlation notes', desc: 'Tag nights with caffeine, screen time, or stress and see which tags cluster with your worst-rated mornings.' },
      ],
      promptExample: 'Build a sleep tracker mobile app: a Log screen to enter bedtime, wake time, and a 1-5 rested rating each morning, with optional tags (caffeine after 3pm, late screen time, stressful day); a Weekly screen with a bar chart of hours slept per night against a target I set; and a Debt screen showing my running sleep debt or surplus versus target over the last 30 days.',
      faqs: [
        { q: 'Does it need a wearable or phone sensor?', a: 'No — this is a manual log, which takes ten seconds a day and avoids the accuracy problems of consumer sleep-sensing hardware.' },
        { q: 'Can it show what correlates with bad sleep?', a: 'Tag nights with anything you suspect matters — caffeine, screen time, stress — and a correlation view can group your rested-rating by tag.' },
        { q: 'Can I set a personal sleep target?', a: 'Yes — set your target hours per night in settings and the debt tracker calculates against that number, not a generic recommendation.' },
        { q: 'Will it remind me to log before bed?', a: 'Ask for a nightly reminder notification in your prompt — a simple push at a time you set.' },
      ],
    },
  },
  hi: {
    'workout-tracker-app': {
      h1: 'AI से वर्कआउट ट्रैकर ऐप बनाएं',
      metaTitle: 'AI से वर्कआउट ट्रैकर ऐप बनाएं — बिना कोड',
      metaDesc: 'आपके प्रोग्राम से मेल खाता एक जिम लॉग: एक्सरसाइज़, सेट्स, प्रोग्रेसिव ओवरलोड चार्ट्स। इसे अंग्रेज़ी में बताएं, मिनटों में एक काम करता मोबाइल ऐप पाएं।',
      tagline: 'सेट्स के बीच सेट्स लॉग करें। ओवरलोड कर्व देखें। आपके प्रोग्राम के इर्द-गिर्द बना — पुश/पुल/लेग्स, 5×5, या आपके कोच की स्प्रेडशीट।',
      body: [
        'एक वर्कआउट लॉग का एक ही काम है: रेस्ट टाइमर ख़त्म होने से पहले वह सेट कैप्चर करना जो आपने अभी किया, और अगले हफ़्ते साबित करना कि बार ऊपर जा रही है। दुकान से ख़रीदे गए फ़िटनेस ऐप्स इसे सोशल फ़ीड्स, कोचिंग अपसेल्स, और सब्सक्रिप्शन्स में लपेट देते हैं — जबकि आपका असली प्रोग्राम शायद किसी कोच की दी हुई स्प्रेडशीट में रहता है।',
        'WyberAi उस स्प्रेडशीट को एक ऐप में बदल देता है। अपना स्प्लिट बताएं और प्रति-सेट आप क्या रिकॉर्ड करते हैं, और यह मोबाइल ऐप जनरेट करता है: आपकी प्रोग्राम्ड एक्सरसाइज़ेज़ वाली आज-का-वर्कआउट स्क्रीन, हर इनपुट के बगल में पिछले-सेशन के नंबर्स के साथ तेज़ सेट लॉगिंग, और प्रति-एक्सरसाइज़ चार्ट्स जो दिखाते हैं कि स्क्वाट वॉल्यूम असल में बढ़ रहा है या नहीं। यह आपका प्रोग्राम सॉफ़्टवेयर के रूप में है, किसी और का ऐप नहीं जिसमें आपका प्रोग्राम ठूंसा गया हो।',
      ],
      features: [
        { title: 'आपका स्प्लिट, प्रोग्राम्ड इन', desc: 'पुश/पुल/लेग्स, अपर/लोअर, 5×5 — आपकी रूटीन से जनरेट किए गए वर्कआउट दिन, हर एक की अपनी एक्सरसाइज़ लिस्ट के साथ।' },
        { title: 'रेस्ट-टाइमर-स्पीड लॉगिंग', desc: 'हर इनपुट के साथ इनलाइन दिखे पिछले सेशन के नंबर्स के साथ प्रति-सेट वज़न और रेप्स — बार रैक करने में लगने वाले समय में एक सेट लॉग करें।' },
        { title: 'प्रोग्रेसिव ओवरलोड चार्ट्स', desc: 'समय के साथ टॉप सेट और टोटल वॉल्यूम के प्रति-एक्सरसाइज़ ग्राफ़्स — इसका सबूत कि प्रोग्राम काम कर रहा है।' },
        { title: 'PR ट्रैकिंग', desc: 'आपके लॉग्स से डिटेक्ट किए गए पर्सनल रिकॉर्ड्स, प्रति-लिफ़्ट एक रिकॉर्ड्स स्क्रीन पर सेलिब्रेट किए गए।' },
      ],
      promptExample: 'एक पुश/पुल/लेग्स प्रोग्राम के लिए एक वर्कआउट ट्रैकर मोबाइल ऐप बनाएं: शेड्यूल्ड दिन की एक्सरसाइज़ेज़ दिखाने वाली एक Today स्क्रीन जहां मैं हर इनपुट के बगल में पिछले सेशन के नंबर्स के साथ प्रति-सेट वज़न और रेप्स लॉग करूं; समय के साथ सबसे भारी सेट के प्रति-एक्सरसाइज़ चार्ट वाली एक Progress स्क्रीन; और हर लिफ़्ट के लिए मेरा PR लिस्ट करने वाली एक Records स्क्रीन। डार्क थीम, बड़े टच टारगेट्स।',
      faqs: [
        { q: 'क्या यह मेरे कोच के प्रोग्राम को फ़ॉलो कर सकता है?', a: 'हां — दिन, एक्सरसाइज़ेज़, और सेट/रेप स्कीम बताएं (या प्लान चैट में पेस्ट करें) और ऐप उसी सटीक प्रोग्राम के इर्द-गिर्द जनरेट होता है।' },
        { q: 'क्या मैं बीच साइकिल में अपना प्रोग्राम बदल सकता हूं?', a: 'चैट में पूछें — "पुश डे पर बेंच की जगह इनक्लाइन डम्बल प्रेस करें" — और प्रोग्राम अपडेट होता है जबकि आपकी हिस्ट्री बरकरार रहती है।' },
        { q: 'क्या यह जिम में ऑफ़लाइन काम करता है?', a: 'जनरेट किया गया ऐप एक स्टैंडर्ड React Native + Expo प्रोजेक्ट है; अपने प्रॉम्प्ट में ऑफ़लाइन-फ़र्स्ट लॉगिंग मांगें और ऑनलाइन वापस आने पर एंट्रीज़ सिंक हो जाती हैं।' },
        { q: 'यह मेरे फ़ोन पर कितनी जल्दी आ सकता है?', a: 'बनने में मिनट लगते हैं, और आप तुरंत Expo के ज़रिए अपने ही फ़ोन पर प्रीव्यू करते हैं — ज़्यादातर लोग अपना अगला सेशन अपने ही ऐप में लॉग करते हैं।' },
      ],
    },
    'meal-planner-app': {
      h1: 'AI से मील प्लानर ऐप बनाएं',
      metaTitle: 'AI से मील प्लानिंग ऐप बनाएं — बिना कोड',
      metaDesc: 'साप्ताहिक मील प्लान्स, एक रेसिपी बॉक्स, और एक ऑटो-बना ग्रॉसरी लिस्ट — आपके विवरण से जनरेट किया गया मील प्लानर, आपका हाउसहोल्ड जैसे खाता है उसके हिसाब से बना।',
      tagline: 'रविवार को हफ़्ते की प्लानिंग करें, एक ऑटो-बनी लिस्ट से शॉपिंग करें, शाम 6 बजे "डिनर में क्या है" पूछना बंद करें।',
      body: [
        'मील प्लानिंग किनारों पर फेल होती है: रेसिपीज़ स्क्रीनशॉट्स में रहती हैं, प्लान आपके सिर में रहता है, और ग्रॉसरी लिस्ट हर हफ़्ते शुरू से दोबारा लिखी जाती है। प्लानर ऐप्स मौजूद हैं, लेकिन वे अपने रेसिपी कैटलॉग्स और अपने हफ़्ते के आइडिया को धकेलते हैं — जबकि जो रेसिपीज़ मायने रखती हैं वे वे बारह हैं जो आपका हाउसहोल्ड असल में खाता है।',
        'आप कैसे प्लान करते हैं यह बताएं — दिन में कितने मील्स, कौन वेजिटेरियन है, शॉपिंग ट्रिप कैसी दिखती है — और WyberAi आपकी किचन के इर्द-गिर्द प्लानर जनरेट करता है: एक रेसिपी बॉक्स जो आप एक बार भरते हैं, एक ड्रैग-टुगेदर वीकली ग्रिड, और एक ग्रॉसरी लिस्ट जो हफ़्ते की सामग्रियों से ख़ुद बन जाती है, आइल के हिसाब से ग्रुप की गई। प्रेप-डे कुकिंग, मैक्रो टारगेट्स, या एक पिकी-किड कॉलम — यह आपका ऐप है, तो प्लान हाउसहोल्ड के हिसाब से मुड़ता है।',
      ],
      features: [
        { title: 'आपका रेसिपी बॉक्स', desc: 'सामग्री, सर्विंग्स, और टैग्स के साथ आपके व्यंजन — वे बारह मील्स जो आप घुमाते हैं, न कि 40,000 का डेटाबेस जो आप नहीं करते।' },
        { title: 'वीकली प्लानिंग ग्रिड', desc: 'आने वाले हफ़्ते के दिनों और मील्स को रेसिपीज़ असाइन करें; जब हफ़्ता अच्छा हो तो एक टैप में पिछला हफ़्ता दोहराएं।' },
        { title: 'ऑटो-कम्पाइल्ड ग्रॉसरी लिस्ट', desc: 'प्लान किए गए हफ़्ते की सामग्रियां एक लिस्ट में मिला दी जाती हैं — मात्राएं जोड़ी गईं, आइल के हिसाब से ग्रुप की गईं, दुकान में चेक करने योग्य।' },
        { title: 'हाउसहोल्ड प्रेफ़रेंस', desc: 'डायटरी टैग्स और प्रति-व्यक्ति नियम (सोमवार को वेजिटेरियन, बच्चों के लिए मशरूम नहीं) प्लान व्यू में माने जाते हैं।' },
      ],
      promptExample: 'एक मील प्लानर वेब ऐप बनाएं: एक Recipes पेज जहां मैं सामग्री (नाम, मात्रा, यूनिट), सर्विंग्स, और वेजिटेरियन या क्विक जैसे टैग्स के साथ व्यंजन जोड़ूं; एक Planner पेज जिसमें लंच और डिनर के लिए सोमवार-से-रविवार ग्रिड हो जहां मैं रेसिपीज़ असाइन करूं; और एक Grocery List पेज जो प्लान किए हफ़्ते की सभी सामग्रियों को जोड़े, मात्राएं टोटल करे, कैटेगरी के हिसाब से ग्रुप करे, और शॉपिंग करते समय आइटम्स चेक करने दे।',
      faqs: [
        { q: 'क्या यह अलग-अलग सर्विंग काउंट्स के लिए रेसिपीज़ स्केल कर सकता है?', a: 'हां — प्रति प्लान किए मील सर्विंग्स सेट करें और सामग्री की मात्राएं ग्रॉसरी लिस्ट में आने से पहले स्केल होती हैं।' },
        { q: 'क्या मेरा पार्टनर और मैं एक ही प्लानर शेयर कर सकते हैं?', a: 'हां — यह लॉगिन वाला एक वेब ऐप है, तो पूरा हाउसहोल्ड एक प्लान और एक लिस्ट देखता है, लाइव अपडेट की गई।' },
        { q: 'क्या यह कैलोरीज़ या मैक्रोज़ ट्रैक कर सकता है?', a: 'अपने प्रॉम्प्ट में (या बाद में चैट में) प्रति-सामग्री या प्रति-रेसिपी मैक्रो फ़ील्ड्स जोड़ें और प्लानर टारगेट्स के मुक़ाबले डेली टोटल्स दिखा सकता है।' },
        { q: 'क्या मुझे कुछ भी कोड करना होगा?', a: 'नहीं — आप प्लानर बताते हैं, WyberAi काम करता ऐप जनरेट करता है, और आगे के बदलाव चैट में सादी अंग्रेज़ी वाली रिक्वेस्ट्स हैं।' },
      ],
    },
    'meditation-app': {
      h1: 'AI से मेडिटेशन ऐप बनाएं',
      metaTitle: 'AI से मेडिटेशन और माइंडफ़ुलनेस ऐप बनाएं',
      metaDesc: 'एक पर्सनल माइंडफ़ुलनेस ऐप — सेशन टाइमर, ब्रीदिंग गाइड्स, और एक शांत स्ट्रीक — सादी अंग्रेज़ी से जनरेट किया गया। आपका, बिना किसी सब्सक्रिप्शन के।',
      tagline: 'एक टाइमर, एक ब्रीदिंग गाइड, और आपकी प्रैक्टिस का एक शांत रिकॉर्ड — आपके और दस मिनट की ख़ामोशी के बीच $70/साल की सब्सक्रिप्शन के बिना।',
      body: [
        'माइंडफ़ुलनेस ऐप्स की अजीब इकॉनॉमिक्स: आप ज़्यादातर एक टाइमर, कुछ घंटियों, और एक स्ट्रीक काउंटर के लिए सालाना सब्सक्रिप्शन देते हैं — फिर ऐप स्लीप स्टोरीज़ अपसेल करने के लिए आपकी शांति में ख़लल डालता है। एक पर्सनल मेडिटेशन ऐप इसे उल्टा कर देता है: बिल्कुल वही प्रैक्टिस जो आप करते हैं, स्क्रीन पर कुछ भी नहीं जो आपने वहां नहीं डाला।',
        'WyberAi को बताएं आप कैसे प्रैक्टिस करते हैं — टाइम्ड साइलेंट सिट्स, बॉक्स ब्रीदिंग, एक सुबह की बॉडी स्कैन — और यह उसके इर्द-गिर्द एक React Native ऐप जनरेट करता है: शुरुआत और अंत की सौम्य घंटियों वाला एक सेशन टाइमर, आपकी गिनती पर सेट एक एनिमेटेड ब्रीदिंग पेसर, और एक हिस्ट्री जो आपकी प्रैक्टिस को गेमिफ़ाई किए बिना बढ़ते हुए दिखाती है। यह वह दुर्लभ ऐप कैटेगरी है जहां कम ही फ़ीचर है, और इसका मालिक होना ही कम पाने का तरीक़ा है।',
      ],
      features: [
        { title: 'घंटियों वाला सेशन टाइमर', desc: 'एक अवधि चुनें, शुरुआत/अंत की घंटियां और ऑप्शनल इंटरवल मार्कर्स पाएं — बीच में स्क्रीन डार्क रहती है।' },
        { title: 'ब्रीदिंग पेसर', desc: 'बॉक्स ब्रीदिंग या 4-7-8 के लिए एक एनिमेटेड गाइड — सर्कल आपकी चुनी गिनतियों पर फैलता और सिकुड़ता है।' },
        { title: 'प्रैक्टिस हिस्ट्री', desc: 'अवधि और प्रकार के साथ लॉग किए सेशंस; आपकी निरंतरता का एक शांत कैलेंडर व्यू, कोई बैज आप पर चिल्लाते नहीं।' },
        { title: 'आपकी प्रैक्टिसेज़, लिस्टेड', desc: 'साइलेंट सिट, बॉडी स्कैन, वॉकिंग मेडिटेशन — आपका अपना प्रैक्टिस मेन्यू, हर एक का अपना डिफ़ॉल्ट टाइमर।' },
      ],
      promptExample: 'एक मेडिटेशन मोबाइल ऐप बनाएं: मेरी प्रैक्टिसेज़ (Silent Sit, Box Breathing, Body Scan) लिस्ट करने वाली एक Home स्क्रीन, हर एक की एक डिफ़ॉल्ट अवधि हो; एक मिनिमल काउंटडाउन टाइमर, शुरुआत और अंत की घंटी, और सिट के दौरान डार्क रखी गई स्क्रीन वाली एक Session स्क्रीन; 4-4-4-4 बॉक्स ब्रीदिंग की गति वाले एक एनिमेटेड सर्कल के साथ एक Breathing स्क्रीन; और पूरे किए सेशंस के मासिक कैलेंडर वाली एक History स्क्रीन। बहुत मिनिमल, डार्क, कोई गेमिफ़िकेशन नहीं।',
      faqs: [
        { q: 'क्या यह एम्बिएंट साउंड्स या गाइडेड ऑडियो चला सकता है?', a: 'हां — अपने प्रॉम्प्ट में एक ऑडियो ऑप्शन मांगें और अपने ट्रैक्स जोड़ें; ऐप उन्हें टाइमर के नीचे चलाता है।' },
        { q: 'क्या मैं ब्रीदिंग रिदम एडजस्ट कर सकता हूं?', a: 'पेसर काउंट्स सेटिंग्स हैं — ऐप में 4-4-4-4 को किसी भी पैटर्न में बदलें, या चैट से 4-7-8 जैसे प्रीसेट्स जोड़ने को कहें।' },
        { q: 'Calm सब्सक्राइब करने की बजाय यह क्यों बनाएं?', a: 'अगर आपकी प्रैक्टिस को सेलिब्रिटी स्लीप स्टोरीज़ की लाइब्रेरी चाहिए, तो सब्सक्राइब करें। अगर इसे बस एक टाइमर, एक पेसर, और एक रिकॉर्ड चाहिए — वह एक दोपहर का बिल्ड है जिसका आप हमेशा के लिए मालिक हैं।' },
        { q: 'क्या इसे अकाउंट चाहिए?', a: 'आपकी मर्ज़ी — इसे पूरी तरह पर्सनल सिंगल-यूज़र ऐप के रूप में बनाएं, या अगर आप डिवाइसेज़ में अपनी हिस्ट्री सिंक चाहते हैं तो बाद में लॉगिन जोड़ें।' },
      ],
    },
    'period-tracker-app': {
      h1: 'AI से पीरियड ट्रैकर ऐप बनाएं',
      metaTitle: 'AI से एक प्राइवेट पीरियड ट्रैकर ऐप बनाएं',
      metaDesc: 'साइकिल प्रेडिक्शन्स, सिम्पटम लॉगिंग, और एक हिस्ट्री व्यू — आपके अपने डेटाबेस पर, किसी बड़ी-टेक कंपनी के ऐप पर नहीं जो आपका हेल्थ डेटा बेचती है। सादी अंग्रेज़ी से बना।',
      tagline: 'साइकिल प्रेडिक्शन्स और सिम्पटम लॉगिंग जो आपके अपने डेटाबेस पर रहती है — किसी बड़ी-टेक कंपनी के ऐप पर नहीं जिसका बिज़नेस मॉडल आपके हेल्थ डेटा पर बना है।',
      body: [
        'पीरियड ट्रैकिंग ऐप्स ने असली अविश्वास कमाया है: कई मुख्यधारा वाले ठीक वही डेटा — साइकिल की तारीख़ें, लक्षण, यौन गतिविधि — बेचते या शेयर करते पकड़े गए हैं जिसे यूज़र्स सबसे कम अपने फ़ोन से बाहर जाते देखना चाहते हैं। इतनी निजी चीज़ के लिए, "इस डेटा का मालिक कौन है" कोई मामूली विवरण नहीं है, यह पूरा फ़ैसला है।',
        'अपना ख़ुद का बनाना उस जोख़िम को शून्य कर देता है: आप साइकिल कैसे लॉग और प्रेडिक्ट करना चाहते हैं यह बताएं, और WyberAi एक ऐसा ऐप जनरेट करता है जो सब कुछ सिर्फ़ आपके नियंत्रण वाले डेटाबेस में स्टोर करता है, बिना किसी ऐसी कंपनी के एनालिटिक्स SDK के जिसका रेवेन्यू मॉडल आपके डेटा पर निर्भर करता हो। साइकिल प्रेडिक्शन्स, सिम्पटम और मूड लॉगिंग, और एक हिस्ट्री व्यू जो आपको असल में पैटर्न देखने में मदद करे — फ़ीचर्स, बिना किसी ट्रेडऑफ़ के।',
      ],
      features: [
        { title: 'साइकिल लॉगिंग और प्रेडिक्शन्स', desc: 'पीरियड की शुरुआत और अंत की तारीख़ें लॉग करें; ऐप आपके अपने इतिहास के आधार पर आपकी अगली साइकिल प्रेडिक्ट करता है, किसी जनसंख्या औसत पर नहीं।' },
        { title: 'सिम्पटम और मूड ट्रैकिंग', desc: 'हर दिन के लक्षण, फ़्लो इंटेंसिटी, और मूड लॉग करें — आपके अपने टैग्स, किसी प्रोडक्ट टीम द्वारा आपके लिए चुनी गई एक तय लिस्ट नहीं।' },
        { title: 'बनावट से प्राइवेट', desc: 'आपका डेटा आपके अपने डेटाबेस में रहता है, बिना किसी थर्ड-पार्टी एनालिटिक्स या एड SDK के — क्योंकि आपने कोई नहीं बनाया।' },
        { title: 'हिस्ट्री और पैटर्न्स', desc: 'पिछली साइकिल्स का एक कैलेंडर व्यू ताकि पैटर्न — अनियमित टाइमिंग, सिम्पटम क्लस्टर्स — महीनों में दिखें, सिर्फ़ इस साइकिल में नहीं।' },
      ],
      promptExample: 'एक पीरियड ट्रैकर मोबाइल ऐप बनाएं: किसी भी दिन के लिए पीरियड शुरू/अंत की तारीख़ें, फ़्लो इंटेंसिटी, लक्षण (ऐंठन, सिरदर्द, थकान), और मूड रिकॉर्ड करने के लिए एक Log स्क्रीन; पिछली साइकिल्स और औसत साइकिल लंबाई के आधार पर अनुमानित अगली शुरुआत तारीख़ दिखाने वाली एक Calendar स्क्रीन; और पिछले 6 महीनों में साइकिल की लंबाई और सबसे आम लक्षणों में ट्रेंड्स वाली एक History स्क्रीन। सिंपल, प्राइवेट, कोई सोशल फ़ीचर्स नहीं।',
      faqs: [
        { q: 'क्या मेरा डेटा असल में प्राइवेट है?', a: 'यह आपके अपने ऐप के डेटाबेस में स्टोर होता है, जब तक आप साफ़ तौर पर न मांगें तब तक बिना किसी एनालिटिक्स या ट्रैकिंग SDK के जनरेट किया गया — बेचने के लिए कुछ नहीं क्योंकि किसी थर्ड पार्टी द्वारा कुछ भी कलेक्ट नहीं किया जाता।' },
        { q: 'प्रेडिक्शन्स कितने सटीक हैं?', a: 'प्रेडिक्शन्स आपकी अपनी लॉग की गई साइकिल हिस्ट्री पर आधारित हैं — जितनी ज़्यादा साइकिल्स लॉग होंगी, औसत उतना ही ज़्यादा आपके असली पैटर्न को दिखाएगा, न कि किसी जेनेरिक 28-दिन के अनुमान को।' },
        { q: 'क्या मैं अपना डेटा एक्सपोर्ट कर सकता हूं?', a: 'अपने प्रॉम्प्ट में CSV एक्सपोर्ट मांगें — आपकी हिस्ट्री आपकी है, किसी बंद ऐप के दीवार-घिरे रिकॉर्ड्स की तरह नहीं।' },
        { q: 'क्या कोई पार्टनर या डॉक्टर ख़ास डेटा देख सकता है?', a: 'अगर आप किसी डॉक्टर को ख़ास डेटा देना चाहते हैं तो एक शेयर करने योग्य समरी या PDF रिपोर्ट स्क्रीन मांगें — शेयरिंग पूरी तरह आपकी पसंद रहती है।' },
      ],
    },
    'sleep-tracker-app': {
      h1: 'AI से स्लीप ट्रैकर ऐप बनाएं',
      metaTitle: 'AI से स्लीप ट्रैकर ऐप बनाएं — बिना कोड',
      metaDesc: 'सोने और उठने का समय लॉग करें, अपना स्लीप डेट देखें, और समझें रात को क्या ख़राब करता है — सादी अंग्रेज़ी से जनरेट किया गया स्लीप ट्रैकर, किसी वियरेबल की ज़रूरत नहीं।',
      tagline: 'रात लॉग करें, डेट बढ़ते देखें, और समझें कि देर की कॉफ़ी ही असली वजह है कि बुधवार बुरे क्यों लगते हैं।',
      body: [
        'आपको यह नोटिस करने के लिए $300 की रिंग नहीं चाहिए कि आप थके हुए हैं — आपको एक ईमानदार रिकॉर्ड चाहिए कि आप असल में कब सोए और उठे, इसकी तुलना उससे करते हुए जो आपको पता है आपको चाहिए। वियरेबल-लिंक्ड ऐप्स इस सिंपल तथ्य को स्कोर्स और शक़ के दायरे वाले कंज़्यूमर सेंसर्स से नापे गए स्टेजेज़ में डुबो देते हैं।',
        'एक लॉग किया हुआ स्लीप ट्रैकर सेंसर को पूरी तरह छोड़ देता है: WyberAi को बताएं आप रातों को कैसे रिकॉर्ड करना चाहते हैं — सोने का समय, उठने का समय, आप कितने आराम महसूस करते थे — और यह उस आदत के इर्द-गिर्द एक ऐप बनाता है। एक साप्ताहिक चार्ट पैटर्न दिखाता है, एक चलता हुआ स्लीप-डेट नंबर घाटे को असल बनाता है, और ऑप्शनल नोट्स (देर की कॉफ़ी, एक तनावभरा दिन, एक नाइटकैप) आपको सुस्त सुबहों के साथ कारण जोड़ने देते हैं, बिना कलाई पर किसी डिवाइस की ज़रूरत के जो आपको वह बताए जो आप पहले ही सोचते थे।',
      ],
      features: [
        { title: 'सोने और उठने की लॉगिंग', desc: 'आप कब सोए और उठे इसकी एक तेज़ रात्रि एंट्री — वे दो नंबर्स जो असल में मायने रखते हैं।' },
        { title: 'स्लीप ड्यूरेशन चार्ट', desc: 'प्रति-रात सोए घंटों का एक साप्ताहिक व्यू, तो एक बुरी स्ट्रीक सिर्फ़ महसूस होने की बजाय दिखती है।' },
        { title: 'स्लीप डेट ट्रैकर', desc: 'आपके टारगेट घंटों के मुक़ाबले एक चलता हुआ टोटल — वह नंबर जो बताता है कि गुरुवार सोमवार से ज़्यादा बुरा क्यों लगता है।' },
        { title: 'कोरिलेशन नोट्स', desc: 'रातों को कैफ़ीन, स्क्रीन टाइम, या तनाव से टैग करें और देखें कौन से टैग्स आपकी सबसे-ख़राब-रेटेड सुबहों के साथ क्लस्टर करते हैं।' },
      ],
      promptExample: 'एक स्लीप ट्रैकर मोबाइल ऐप बनाएं: हर सुबह सोने का समय, उठने का समय, और 1-5 आराम रेटिंग, ऑप्शनल टैग्स (3 बजे के बाद कैफ़ीन, देर की स्क्रीन टाइम, तनावभरा दिन) के साथ दर्ज करने वाली एक Log स्क्रीन; मैंने सेट किए टारगेट के मुक़ाबले प्रति-रात सोए घंटों का बार चार्ट वाली एक Weekly स्क्रीन; और पिछले 30 दिनों में टारगेट बनाम मेरे चलते स्लीप डेट या सरप्लस को दिखाने वाली एक Debt स्क्रीन।',
      faqs: [
        { q: 'क्या इसे किसी वियरेबल या फ़ोन सेंसर की ज़रूरत है?', a: 'नहीं — यह एक मैन्युअल लॉग है, जिसमें दिन में दस सेकंड लगते हैं और यह कंज़्यूमर स्लीप-सेंसिंग हार्डवेयर की सटीकता समस्याओं से बचता है।' },
        { q: 'क्या यह दिखा सकता है कि बुरी नींद के साथ क्या जुड़ता है?', a: 'रातों को उससे टैग करें जिसके बारे में आपको शक़ हो कि वह मायने रखता है — कैफ़ीन, स्क्रीन टाइम, तनाव — और एक कोरिलेशन व्यू टैग के हिसाब से आपकी आराम-रेटिंग को ग्रुप कर सकता है।' },
        { q: 'क्या मैं पर्सनल स्लीप टारगेट सेट कर सकता हूं?', a: 'हां — सेटिंग्स में प्रति-रात अपने टारगेट घंटे सेट करें और डेट ट्रैकर उसी नंबर के मुक़ाबले कैलकुलेट करता है, किसी जेनेरिक सिफ़ारिश के नहीं।' },
        { q: 'क्या यह सोने से पहले मुझे लॉग करने की याद दिलाएगा?', a: 'अपने प्रॉम्प्ट में एक रात्रि रिमाइंडर नोटिफ़िकेशन मांगें — आपके तय किए समय पर एक सिंपल पुश।' },
      ],
    },
  },
  kn: {
    'workout-tracker-app': {
      h1: 'AI ಮೂಲಕ ವರ್ಕ್‌ಔಟ್ ಟ್ರ್ಯಾಕರ್ ಆ್ಯಪ್ ರಚಿಸಿ',
      metaTitle: 'AI ಮೂಲಕ ವರ್ಕ್‌ಔಟ್ ಟ್ರ್ಯಾಕರ್ ಆ್ಯಪ್ ರಚಿಸಿ — ಕೋಡ್ ಇಲ್ಲದೆ',
      metaDesc: 'ನಿಮ್ಮ ಪ್ರೋಗ್ರಾಂಗೆ ಹೊಂದುವ ಜಿಮ್ ಲಾಗ್: ವ್ಯಾಯಾಮಗಳು, ಸೆಟ್‌ಗಳು, ಪ್ರೋಗ್ರೆಸಿವ್ ಓವರ್‌ಲೋಡ್ ಚಾರ್ಟ್‌ಗಳು. ಇಂಗ್ಲಿಷ್‌ನಲ್ಲಿ ವಿವರಿಸಿ, ನಿಮಿಷಗಳಲ್ಲಿ ಕೆಲಸ ಮಾಡುವ ಮೊಬೈಲ್ ಆ್ಯಪ್ ಪಡೆಯಿರಿ.',
      tagline: 'ಸೆಟ್‌ಗಳ ನಡುವೆ ಸೆಟ್‌ಗಳನ್ನು ಲಾಗ್ ಮಾಡಿ. ಓವರ್‌ಲೋಡ್ ಕರ್ವ್ ನೋಡಿ. ನಿಮ್ಮ ಪ್ರೋಗ್ರಾಂ ಸುತ್ತ ನಿರ್ಮಿಸಲಾಗಿದೆ — ಪುಶ್/ಪುಲ್/ಲೆಗ್ಸ್, 5×5, ಅಥವಾ ನಿಮ್ಮ ಕೋಚ್‌ನ ಸ್ಪ್ರೆಡ್‌ಶೀಟ್.',
      body: [
        'ವರ್ಕ್‌ಔಟ್ ಲಾಗ್‌ಗೆ ಒಂದೇ ಕೆಲಸವಿದೆ: ರೆಸ್ಟ್ ಟೈಮರ್ ಮುಗಿಯುವ ಮೊದಲು ನೀವು ಈಗಷ್ಟೇ ಮಾಡಿದ ಸೆಟ್ ಅನ್ನು ಸೆರೆಹಿಡಿಯುವುದು, ಮತ್ತು ಮುಂದಿನ ವಾರ ಬಾರ್ ಮೇಲಕ್ಕೆ ಹೋಗುತ್ತಿದೆ ಎಂದು ಸಾಬೀತುಪಡಿಸುವುದು. ಅಂಗಡಿಯಿಂದ ಖರೀದಿಸಿದ ಫಿಟ್‌ನೆಸ್ ಆ್ಯಪ್‌ಗಳು ಇದನ್ನು ಸೋಶಿಯಲ್ ಫೀಡ್‌ಗಳು, ಕೋಚಿಂಗ್ ಅಪ್‌ಸೆಲ್‌ಗಳು, ಮತ್ತು ಚಂದಾದಾರಿಕೆಗಳಲ್ಲಿ ಸುತ್ತುತ್ತವೆ — ನಿಮ್ಮ ನಿಜವಾದ ಪ್ರೋಗ್ರಾಂ ಬಹುಶಃ ಕೋಚ್ ನೀಡಿದ ಸ್ಪ್ರೆಡ್‌ಶೀಟ್‌ನಲ್ಲಿ ಇರುತ್ತದೆ.',
        'WyberAi ಆ ಸ್ಪ್ರೆಡ್‌ಶೀಟ್ ಅನ್ನು ಆ್ಯಪ್ ಆಗಿ ಬದಲಾಯಿಸುತ್ತದೆ. ನಿಮ್ಮ ಸ್ಪ್ಲಿಟ್ ಮತ್ತು ಪ್ರತಿ-ಸೆಟ್‌ಗೆ ನೀವು ಏನು ದಾಖಲಿಸುತ್ತೀರಿ ಎಂದು ವಿವರಿಸಿ, ಮತ್ತು ಇದು ಮೊಬೈಲ್ ಆ್ಯಪ್ ಅನ್ನು ಜನರೇಟ್ ಮಾಡುತ್ತದೆ: ನಿಮ್ಮ ಪ್ರೋಗ್ರಾಮ್ಡ್ ವ್ಯಾಯಾಮಗಳಿರುವ ಇಂದಿನ-ವರ್ಕ್‌ಔಟ್ ಸ್ಕ್ರೀನ್, ಪ್ರತಿ ಇನ್‌ಪುಟ್ ಪಕ್ಕ ಹಿಂದಿನ-ಸೆಷನ್ ಸಂಖ್ಯೆಗಳೊಂದಿಗೆ ವೇಗದ ಸೆಟ್ ಲಾಗಿಂಗ್, ಮತ್ತು ಸ್ಕ್ವಾಟ್ ವಾಲ್ಯೂಮ್ ನಿಜವಾಗಿ ಏರುತ್ತಿದೆಯೇ ಎಂದು ತೋರಿಸುವ ಪ್ರತಿ-ವ್ಯಾಯಾಮ ಚಾರ್ಟ್‌ಗಳು. ಇದು ಸಾಫ್ಟ್‌ವೇರ್ ಆಗಿ ನಿಮ್ಮ ಪ್ರೋಗ್ರಾಂ, ನಿಮ್ಮ ಪ್ರೋಗ್ರಾಂ ಒಳಗೆ ತುರುಕಿದ ಬೇರೊಬ್ಬರ ಆ್ಯಪ್ ಅಲ್ಲ.',
      ],
      features: [
        { title: 'ನಿಮ್ಮ ಸ್ಪ್ಲಿಟ್, ಪ್ರೋಗ್ರಾಮ್ ಮಾಡಲಾಗಿದೆ', desc: 'ಪುಶ್/ಪುಲ್/ಲೆಗ್ಸ್, ಅಪ್ಪರ್/ಲೋಯರ್, 5×5 — ನಿಮ್ಮ ದಿನಚರಿಯಿಂದ ಜನರೇಟ್ ಆದ ವರ್ಕ್‌ಔಟ್ ದಿನಗಳು, ಪ್ರತಿಯೊಂದೂ ತನ್ನ ವ್ಯಾಯಾಮ ಪಟ್ಟಿಯೊಂದಿಗೆ.' },
        { title: 'ರೆಸ್ಟ್-ಟೈಮರ್-ವೇಗದ ಲಾಗಿಂಗ್', desc: 'ಪ್ರತಿ ಇನ್‌ಪುಟ್‌ನೊಂದಿಗೆ ಇನ್‌ಲೈನ್ ತೋರಿಸಿದ ಕೊನೆಯ ಸೆಷನ್ ಸಂಖ್ಯೆಗಳೊಂದಿಗೆ ಪ್ರತಿ-ಸೆಟ್ ತೂಕ ಮತ್ತು ರೆಪ್‌ಗಳು — ಬಾರ್ ರ್ಯಾಕ್ ಮಾಡಲು ತೆಗೆದುಕೊಳ್ಳುವ ಸಮಯದಲ್ಲಿ ಒಂದು ಸೆಟ್ ಲಾಗ್ ಮಾಡಿ.' },
        { title: 'ಪ್ರೋಗ್ರೆಸಿವ್ ಓವರ್‌ಲೋಡ್ ಚಾರ್ಟ್‌ಗಳು', desc: 'ಸಮಯದೊಂದಿಗೆ ಟಾಪ್ ಸೆಟ್ ಮತ್ತು ಒಟ್ಟು ವಾಲ್ಯೂಮ್‌ನ ಪ್ರತಿ-ವ್ಯಾಯಾಮ ಗ್ರಾಫ್‌ಗಳು — ಪ್ರೋಗ್ರಾಂ ಕೆಲಸ ಮಾಡುತ್ತಿದೆ ಎಂಬ ಪುರಾವೆ.' },
        { title: 'PR ಟ್ರ್ಯಾಕಿಂಗ್', desc: 'ನಿಮ್ಮ ಲಾಗ್‌ಗಳಿಂದ ಪತ್ತೆಯಾದ ವೈಯಕ್ತಿಕ ದಾಖಲೆಗಳು, ಪ್ರತಿ-ಲಿಫ್ಟ್ ಒಂದು ದಾಖಲೆಗಳ ಸ್ಕ್ರೀನ್‌ನಲ್ಲಿ ಆಚರಿಸಲಾಗಿದೆ.' },
      ],
      promptExample: 'ಪುಶ್/ಪುಲ್/ಲೆಗ್ಸ್ ಪ್ರೋಗ್ರಾಂಗಾಗಿ ವರ್ಕ್‌ಔಟ್ ಟ್ರ್ಯಾಕರ್ ಮೊಬೈಲ್ ಆ್ಯಪ್ ರಚಿಸಿ: ಪ್ರತಿ ಇನ್‌ಪುಟ್ ಪಕ್ಕ ಕೊನೆಯ ಸೆಷನ್ ಸಂಖ್ಯೆಗಳು ಪ್ರದರ್ಶಿತವಾಗಿ ನಾನು ಪ್ರತಿ-ಸೆಟ್ ತೂಕ ಮತ್ತು ರೆಪ್‌ಗಳನ್ನು ಲಾಗ್ ಮಾಡುವ ಶೆಡ್ಯೂಲ್ ಮಾಡಿದ ದಿನದ ವ್ಯಾಯಾಮಗಳನ್ನು ತೋರಿಸುವ Today ಸ್ಕ್ರೀನ್; ಸಮಯದೊಂದಿಗೆ ಅತ್ಯಂತ ಭಾರವಾದ ಸೆಟ್‌ನ ಪ್ರತಿ-ವ್ಯಾಯಾಮ ಚಾರ್ಟ್ ಇರುವ Progress ಸ್ಕ್ರೀನ್; ಮತ್ತು ಪ್ರತಿ ಲಿಫ್ಟ್‌ಗೆ ನನ್ನ PR ಪಟ್ಟಿ ಮಾಡುವ Records ಸ್ಕ್ರೀನ್. ಡಾರ್ಕ್ ಥೀಮ್, ದೊಡ್ಡ ಟಚ್ ಟಾರ್ಗೆಟ್‌ಗಳು.',
      faqs: [
        { q: 'ಇದು ನನ್ನ ಕೋಚ್‌ನ ಪ್ರೋಗ್ರಾಂ ಅನ್ನು ಅನುಸರಿಸಬಹುದೇ?', a: 'ಹೌದು — ದಿನಗಳು, ವ್ಯಾಯಾಮಗಳು, ಮತ್ತು ಸೆಟ್/ರೆಪ್ ಸ್ಕೀಮ್ ವಿವರಿಸಿ (ಅಥವಾ ಪ್ಲಾನ್ ಅನ್ನು ಚಾಟ್‌ಗೆ ಪೇಸ್ಟ್ ಮಾಡಿ) ಮತ್ತು ಆ ನಿಖರ ಪ್ರೋಗ್ರಾಂ ಸುತ್ತ ಆ್ಯಪ್ ಜನರೇಟ್ ಆಗುತ್ತದೆ.' },
        { q: 'ನಾನು ಚಕ್ರದ ಮಧ್ಯದಲ್ಲಿ ನನ್ನ ಪ್ರೋಗ್ರಾಂ ಬದಲಾಯಿಸಬಹುದೇ?', a: 'ಚಾಟ್‌ನಲ್ಲಿ ಕೇಳಿ — "ಪುಶ್ ದಿನದಂದು ಬೆಂಚ್ ಬದಲಿಗೆ ಇಂಕ್ಲೈನ್ ಡಂಬೆಲ್ ಪ್ರೆಸ್ ಮಾಡಿ" — ಮತ್ತು ನಿಮ್ಮ ಇತಿಹಾಸ ಹಾಗೆಯೇ ಉಳಿದಿರುವಾಗ ಪ್ರೋಗ್ರಾಂ ಅಪ್‌ಡೇಟ್ ಆಗುತ್ತದೆ.' },
        { q: 'ಇದು ಜಿಮ್‌ನಲ್ಲಿ ಆಫ್‌ಲೈನ್ ಕೆಲಸ ಮಾಡುತ್ತದೆಯೇ?', a: 'ಜನರೇಟ್ ಆದ ಆ್ಯಪ್ ಒಂದು ಸ್ಟ್ಯಾಂಡರ್ಡ್ React Native + Expo ಪ್ರಾಜೆಕ್ಟ್; ನಿಮ್ಮ ಪ್ರಾಂಪ್ಟ್‌ನಲ್ಲಿ ಆಫ್‌ಲೈನ್-ಮೊದಲ ಲಾಗಿಂಗ್ ಕೇಳಿ ಮತ್ತು ಆನ್‌ಲೈನ್‌ಗೆ ಹಿಂತಿರುಗಿದಾಗ ಎಂಟ್ರಿಗಳು ಸಿಂಕ್ ಆಗುತ್ತವೆ.' },
        { q: 'ಇದು ನನ್ನ ಫೋನ್‌ನಲ್ಲಿ ಎಷ್ಟು ವೇಗವಾಗಿ ಬರುತ್ತದೆ?', a: 'ರಚಿಸಲು ನಿಮಿಷಗಳು ತೆಗೆದುಕೊಳ್ಳುತ್ತದೆ, ಮತ್ತು ನೀವು ತಕ್ಷಣ Expo ಮೂಲಕ ನಿಮ್ಮ ಸ್ವಂತ ಫೋನ್‌ನಲ್ಲಿ ಪೂರ್ವವೀಕ್ಷಿಸುತ್ತೀರಿ — ಹೆಚ್ಚಿನ ಜನರು ತಮ್ಮ ಮುಂದಿನ ಸೆಷನ್ ಅನ್ನು ತಮ್ಮದೇ ಆ್ಯಪ್‌ನಲ್ಲಿ ಲಾಗ್ ಮಾಡುತ್ತಾರೆ.' },
      ],
    },
    'meal-planner-app': {
      h1: 'AI ಮೂಲಕ ಮೀಲ್ ಪ್ಲಾನರ್ ಆ್ಯಪ್ ರಚಿಸಿ',
      metaTitle: 'AI ಮೂಲಕ ಮೀಲ್ ಪ್ಲಾನಿಂಗ್ ಆ್ಯಪ್ ರಚಿಸಿ — ಕೋಡ್ ಇಲ್ಲದೆ',
      metaDesc: 'ಸಾಪ್ತಾಹಿಕ ಮೀಲ್ ಪ್ಲಾನ್‌ಗಳು, ಒಂದು ರೆಸಿಪಿ ಬಾಕ್ಸ್, ಮತ್ತು ಆಟೋ-ನಿರ್ಮಿತ ಗ್ರೋಸರಿ ಪಟ್ಟಿ — ನಿಮ್ಮ ವಿವರಣೆಯಿಂದ ಜನರೇಟ್ ಆದ ಮೀಲ್ ಪ್ಲಾನರ್, ನಿಮ್ಮ ಹೌಸ್‌ಹೋಲ್ಡ್ ತಿನ್ನುವ ರೀತಿಗೆ ಹೊಂದುವಂತೆ.',
      tagline: 'ಭಾನುವಾರ ವಾರವನ್ನು ಯೋಜಿಸಿ, ಆಟೋ-ನಿರ್ಮಿತ ಪಟ್ಟಿಯಿಂದ ಶಾಪಿಂಗ್ ಮಾಡಿ, ಸಂಜೆ 6 ಗಂಟೆಗೆ "ಡಿನ್ನರ್‌ಗೆ ಏನಿದೆ" ಕೇಳುವುದನ್ನು ನಿಲ್ಲಿಸಿ.',
      body: [
        'ಮೀಲ್ ಪ್ಲಾನಿಂಗ್ ಅಂಚುಗಳಲ್ಲಿ ವಿಫಲವಾಗುತ್ತದೆ: ರೆಸಿಪಿಗಳು ಸ್ಕ್ರೀನ್‌ಶಾಟ್‌ಗಳಲ್ಲಿ ಇರುತ್ತವೆ, ಪ್ಲಾನ್ ನಿಮ್ಮ ತಲೆಯಲ್ಲಿ ಇರುತ್ತದೆ, ಮತ್ತು ಗ್ರೋಸರಿ ಪಟ್ಟಿಯನ್ನು ಪ್ರತಿ ವಾರ ಶೂನ್ಯದಿಂದ ಮತ್ತೆ ಬರೆಯಲಾಗುತ್ತದೆ. ಪ್ಲಾನರ್ ಆ್ಯಪ್‌ಗಳು ಇವೆ, ಆದರೆ ಅವು ತಮ್ಮ ರೆಸಿಪಿ ಕ್ಯಾಟಲಾಗ್‌ಗಳನ್ನು ಮತ್ತು ವಾರದ ಬಗ್ಗೆ ತಮ್ಮ ಆಲೋಚನೆಯನ್ನು ತಳ್ಳುತ್ತವೆ — ಮುಖ್ಯವಾದ ರೆಸಿಪಿಗಳು ನಿಮ್ಮ ಹೌಸ್‌ಹೋಲ್ಡ್ ನಿಜವಾಗಿ ತಿನ್ನುವ ಹನ್ನೆರಡು.',
        'ನೀವು ಹೇಗೆ ಯೋಜಿಸುತ್ತೀರಿ ಎಂದು ವಿವರಿಸಿ — ದಿನಕ್ಕೆ ಎಷ್ಟು ಊಟಗಳು, ಯಾರು ಸಸ್ಯಾಹಾರಿ, ಶಾಪಿಂಗ್ ಟ್ರಿಪ್ ಹೇಗೆ ಕಾಣುತ್ತದೆ — ಮತ್ತು WyberAi ನಿಮ್ಮ ಅಡುಗೆಮನೆಯ ಸುತ್ತ ಪ್ಲಾನರ್ ಅನ್ನು ಜನರೇಟ್ ಮಾಡುತ್ತದೆ: ನೀವು ಒಮ್ಮೆ ತುಂಬುವ ರೆಸಿಪಿ ಬಾಕ್ಸ್, ಒಂದು ಡ್ರ್ಯಾಗ್-ಟುಗೆದರ್ ಸಾಪ್ತಾಹಿಕ ಗ್ರಿಡ್, ಮತ್ತು ವಾರದ ಪದಾರ್ಥಗಳಿಂದ ಸ್ವಯಂ ಸಂಕಲಿಸುವ, ಐಲ್ ಪ್ರಕಾರ ಗುಂಪುಗೊಳಿಸಿದ ಗ್ರೋಸರಿ ಪಟ್ಟಿ. ಪ್ರೆಪ್-ದಿನದ ಅಡುಗೆ, ಮ್ಯಾಕ್ರೋ ಗುರಿಗಳು, ಅಥವಾ ಒಂದು ಮೆಚ್ಚಿನ-ಆಹಾರ ಮಗುವಿನ ಕಾಲಮ್ — ಇದು ನಿಮ್ಮ ಆ್ಯಪ್, ಆದ್ದರಿಂದ ಪ್ಲಾನ್ ಹೌಸ್‌ಹೋಲ್ಡ್‌ಗೆ ಬಗ್ಗುತ್ತದೆ.',
      ],
      features: [
        { title: 'ನಿಮ್ಮ ರೆಸಿಪಿ ಬಾಕ್ಸ್', desc: 'ಪದಾರ್ಥಗಳು, ಸರ್ವಿಂಗ್‌ಗಳು, ಮತ್ತು ಟ್ಯಾಗ್‌ಗಳೊಂದಿಗೆ ನಿಮ್ಮ ಭಕ್ಷ್ಯಗಳು — ನೀವು ತಿರುಗಿಸುವ ಒಂದು ಡಜನ್ ಊಟಗಳು, ನೀವಿಲ್ಲದ 40,000 ಡೇಟಾಬೇಸ್ ಅಲ್ಲ.' },
        { title: 'ಸಾಪ್ತಾಹಿಕ ಯೋಜನೆ ಗ್ರಿಡ್', desc: 'ಮುಂದಿನ ವಾರದ ದಿನಗಳು ಮತ್ತು ಊಟಗಳಿಗೆ ರೆಸಿಪಿಗಳನ್ನು ನಿಯೋಜಿಸಿ; ಒಳ್ಳೆಯ ವಾರವಾಗಿದ್ದಾಗ ಒಂದೇ ಟ್ಯಾಪ್‌ನಲ್ಲಿ ಕಳೆದ ವಾರವನ್ನು ಪುನರಾವರ್ತಿಸಿ.' },
        { title: 'ಆಟೋ-ಸಂಕಲಿತ ಗ್ರೋಸರಿ ಪಟ್ಟಿ', desc: 'ಯೋಜಿತ ವಾರದ ಪದಾರ್ಥಗಳು ಒಂದೇ ಪಟ್ಟಿಗೆ ವಿಲೀನಗೊಂಡಿವೆ — ಪ್ರಮಾಣಗಳು ಸೇರಿಸಲ್ಪಟ್ಟಿವೆ, ಐಲ್ ಪ್ರಕಾರ ಗುಂಪುಗೊಳಿಸಲಾಗಿದೆ, ಅಂಗಡಿಯಲ್ಲಿ ಪರಿಶೀಲಿಸಬಹುದಾಗಿದೆ.' },
        { title: 'ಹೌಸ್‌ಹೋಲ್ಡ್ ಆದ್ಯತೆಗಳು', desc: 'ಡಯಟರಿ ಟ್ಯಾಗ್‌ಗಳು ಮತ್ತು ಪ್ರತಿ-ವ್ಯಕ್ತಿ ನಿಯಮಗಳು (ಸೋಮವಾರ ಸಸ್ಯಾಹಾರಿ, ಮಕ್ಕಳಿಗೆ ಮಶ್ರೂಮ್ ಇಲ್ಲ) ಪ್ಲಾನ್ ವ್ಯೂನಲ್ಲಿ ಗೌರವಿಸಲ್ಪಟ್ಟಿವೆ.' },
      ],
      promptExample: 'ಮೀಲ್ ಪ್ಲಾನರ್ ವೆಬ್ ಆ್ಯಪ್ ರಚಿಸಿ: ನಾನು ಪದಾರ್ಥಗಳು (ಹೆಸರು, ಪ್ರಮಾಣ, ಘಟಕ), ಸರ್ವಿಂಗ್‌ಗಳು, ಮತ್ತು ಸಸ್ಯಾಹಾರಿ ಅಥವಾ ಕ್ವಿಕ್‌ನಂತಹ ಟ್ಯಾಗ್‌ಗಳೊಂದಿಗೆ ಭಕ್ಷ್ಯಗಳನ್ನು ಸೇರಿಸುವ Recipes ಪೇಜ್; ನಾನು ರೆಸಿಪಿಗಳನ್ನು ನಿಯೋಜಿಸುವ ಲಂಚ್ ಮತ್ತು ಡಿನ್ನರ್‌ಗೆ ಸೋಮವಾರ-ರಿಂದ-ಭಾನುವಾರ ಗ್ರಿಡ್ ಇರುವ Planner ಪೇಜ್; ಮತ್ತು ಯೋಜಿತ ವಾರದ ಎಲ್ಲಾ ಪದಾರ್ಥಗಳನ್ನು ಸಂಕಲಿಸುವ, ಪ್ರಮಾಣಗಳನ್ನು ಒಟ್ಟುಗೂಡಿಸುವ, ಕೆಟಗರಿ ಪ್ರಕಾರ ಗುಂಪುಗೊಳಿಸುವ, ಶಾಪಿಂಗ್ ಮಾಡುವಾಗ ಐಟಂಗಳನ್ನು ಪರಿಶೀಲಿಸಲು ಬಿಡುವ Grocery List ಪೇಜ್.',
      faqs: [
        { q: 'ಇದು ವಿಭಿನ್ನ ಸರ್ವಿಂಗ್ ಎಣಿಕೆಗಳಿಗೆ ರೆಸಿಪಿಗಳನ್ನು ಸ್ಕೇಲ್ ಮಾಡಬಹುದೇ?', a: 'ಹೌದು — ಪ್ರತಿ ಯೋಜಿತ ಊಟಕ್ಕೆ ಸರ್ವಿಂಗ್‌ಗಳನ್ನು ಸೆಟ್ ಮಾಡಿ ಮತ್ತು ಪದಾರ್ಥ ಪ್ರಮಾಣಗಳು ಗ್ರೋಸರಿ ಪಟ್ಟಿಗೆ ಬರುವ ಮೊದಲು ಸ್ಕೇಲ್ ಆಗುತ್ತವೆ.' },
        { q: 'ನನ್ನ ಪಾಲುದಾರ ಮತ್ತು ನಾನು ಒಂದೇ ಪ್ಲಾನರ್ ಹಂಚಿಕೊಳ್ಳಬಹುದೇ?', a: 'ಹೌದು — ಇದು ಲಾಗಿನ್‌ಗಳಿರುವ ವೆಬ್ ಆ್ಯಪ್, ಆದ್ದರಿಂದ ಇಡೀ ಹೌಸ್‌ಹೋಲ್ಡ್ ಒಂದು ಪ್ಲಾನ್ ಮತ್ತು ಒಂದು ಪಟ್ಟಿಯನ್ನು ನೋಡುತ್ತದೆ, ಲೈವ್ ಆಗಿ ಅಪ್‌ಡೇಟ್ ಆಗಿದೆ.' },
        { q: 'ಇದು ಕ್ಯಾಲರಿಗಳು ಅಥವಾ ಮ್ಯಾಕ್ರೋಗಳನ್ನು ಟ್ರ್ಯಾಕ್ ಮಾಡಬಹುದೇ?', a: 'ನಿಮ್ಮ ಪ್ರಾಂಪ್ಟ್‌ನಲ್ಲಿ (ಅಥವಾ ನಂತರ ಚಾಟ್‌ನಲ್ಲಿ) ಪ್ರತಿ-ಪದಾರ್ಥ ಅಥವಾ ಪ್ರತಿ-ರೆಸಿಪಿ ಮ್ಯಾಕ್ರೋ ಫೀಲ್ಡ್‌ಗಳನ್ನು ಸೇರಿಸಿ ಮತ್ತು ಪ್ಲಾನರ್ ಗುರಿಗಳ ವಿರುದ್ಧ ದೈನಂದಿನ ಒಟ್ಟುಗಳನ್ನು ತೋರಿಸಬಹುದು.' },
        { q: 'ನಾನು ಏನಾದರೂ ಕೋಡ್ ಮಾಡಬೇಕೇ?', a: 'ಇಲ್ಲ — ನೀವು ಪ್ಲಾನರ್ ಅನ್ನು ವಿವರಿಸುತ್ತೀರಿ, WyberAi ಕೆಲಸ ಮಾಡುವ ಆ್ಯಪ್ ಅನ್ನು ಜನರೇಟ್ ಮಾಡುತ್ತದೆ, ಮತ್ತು ಮುಂದಿನ ಬದಲಾವಣೆಗಳು ಚಾಟ್‌ನಲ್ಲಿ ಸರಳ-ಇಂಗ್ಲಿಷ್ ವಿನಂತಿಗಳಾಗಿವೆ.' },
      ],
    },
    'meditation-app': {
      h1: 'AI ಮೂಲಕ ಧ್ಯಾನ ಆ್ಯಪ್ ರಚಿಸಿ',
      metaTitle: 'AI ಮೂಲಕ ಧ್ಯಾನ ಮತ್ತು ಮೈಂಡ್‌ಫುಲ್‌ನೆಸ್ ಆ್ಯಪ್ ರಚಿಸಿ',
      metaDesc: 'ವೈಯಕ್ತಿಕ ಮೈಂಡ್‌ಫುಲ್‌ನೆಸ್ ಆ್ಯಪ್ — ಸೆಷನ್ ಟೈಮರ್, ಉಸಿರಾಟ ಮಾರ್ಗದರ್ಶಿಗಳು, ಮತ್ತು ಶಾಂತ ಸ್ಟ್ರೀಕ್ — ಸರಳ ಇಂಗ್ಲಿಷ್‌ನಿಂದ ಜನರೇಟ್. ನಿಮ್ಮದು, ಯಾವುದೇ ಚಂದಾದಾರಿಕೆ ಇಲ್ಲದೆ.',
      tagline: 'ಟೈಮರ್, ಉಸಿರಾಟ ಮಾರ್ಗದರ್ಶಿ, ಮತ್ತು ನಿಮ್ಮ ಅಭ್ಯಾಸದ ಶಾಂತ ದಾಖಲೆ — ನಿಮ್ಮ ಮತ್ತು ಹತ್ತು ನಿಮಿಷಗಳ ಮೌನದ ನಡುವೆ $70/ವರ್ಷದ ಚಂದಾದಾರಿಕೆ ಇಲ್ಲದೆ.',
      body: [
        'ಮೈಂಡ್‌ಫುಲ್‌ನೆಸ್ ಆ್ಯಪ್‌ಗಳ ವಿಚಿತ್ರ ಅರ್ಥಶಾಸ್ತ್ರ: ನೀವು ಹೆಚ್ಚಾಗಿ ಟೈಮರ್, ಕೆಲವು ಗಂಟೆಗಳು, ಮತ್ತು ಸ್ಟ್ರೀಕ್ ಕೌಂಟರ್‌ಗಾಗಿ ವಾರ್ಷಿಕ ಚಂದಾದಾರಿಕೆ ಪಾವತಿಸುತ್ತೀರಿ — ನಂತರ ಆ್ಯಪ್ ಸ್ಲೀಪ್ ಸ್ಟೋರೀಸ್ ಅಪ್‌ಸೆಲ್ ಮಾಡಲು ನಿಮ್ಮ ಶಾಂತಿಗೆ ಅಡ್ಡಿಪಡಿಸುತ್ತದೆ. ವೈಯಕ್ತಿಕ ಧ್ಯಾನ ಆ್ಯಪ್ ಅದನ್ನು ತಲೆಕೆಳಗಾಗಿಸುತ್ತದೆ: ನೀವು ಮಾಡುವ ಅಭ್ಯಾಸ ನಿಖರವಾಗಿ, ನೀವು ಅಲ್ಲಿ ಹಾಕದ ಯಾವುದೂ ಸ್ಕ್ರೀನ್‌ನಲ್ಲಿ ಇಲ್ಲ.',
        'WyberAi ಗೆ ನೀವು ಹೇಗೆ ಅಭ್ಯಾಸ ಮಾಡುತ್ತೀರಿ ಎಂದು ಹೇಳಿ — ಟೈಮ್ಡ್ ಮೌನ ಕುಳಿತುಕೊಳ್ಳುವಿಕೆಗಳು, ಬಾಕ್ಸ್ ಉಸಿರಾಟ, ಬೆಳಗಿನ ದೇಹ ಸ್ಕ್ಯಾನ್ — ಮತ್ತು ಇದು ಅದರ ಸುತ್ತ React Native ಆ್ಯಪ್ ಅನ್ನು ಜನರೇಟ್ ಮಾಡುತ್ತದೆ: ಸೌಮ್ಯ ಆರಂಭ ಮತ್ತು ಅಂತ್ಯ ಚೈಮ್‌ಗಳಿರುವ ಸೆಷನ್ ಟೈಮರ್, ನಿಮ್ಮ ಎಣಿಕೆಗೆ ಸೆಟ್ ಮಾಡಿದ ಆನಿಮೇಟೆಡ್ ಉಸಿರಾಟ ಪೇಸರ್, ಮತ್ತು ಗೇಮಿಫೈ ಮಾಡದೆ ನಿಮ್ಮ ಅಭ್ಯಾಸ ಬೆಳೆಯುತ್ತಿರುವುದನ್ನು ತೋರಿಸುವ ಇತಿಹಾಸ. ಕಡಿಮೆಯೇ ಫೀಚರ್ ಆಗಿರುವ ಅಪರೂಪದ ಆ್ಯಪ್ ವರ್ಗ ಇದು, ಮತ್ತು ಅದನ್ನು ಹೊಂದುವುದೇ ನೀವು ಕಡಿಮೆ ಪಡೆಯುವ ವಿಧಾನ.',
      ],
      features: [
        { title: 'ಚೈಮ್‌ಗಳೊಂದಿಗೆ ಸೆಷನ್ ಟೈಮರ್', desc: 'ಅವಧಿ ಆಯ್ಕೆಮಾಡಿ, ಆರಂಭ/ಅಂತ್ಯ ಗಂಟೆಗಳು ಮತ್ತು ಐಚ್ಛಿಕ ಮಧ್ಯಂತರ ಗುರುತುಗಳನ್ನು ಪಡೆಯಿರಿ — ಮಧ್ಯದಲ್ಲಿ ಸ್ಕ್ರೀನ್ ಡಾರ್ಕ್ ಆಗಿ ಉಳಿಯುತ್ತದೆ.' },
        { title: 'ಉಸಿರಾಟ ಪೇಸರ್', desc: 'ಬಾಕ್ಸ್ ಉಸಿರಾಟ ಅಥವಾ 4-7-8 ಗಾಗಿ ಆನಿಮೇಟೆಡ್ ಮಾರ್ಗದರ್ಶಿ — ವೃತ್ತ ನಿಮ್ಮ ಆಯ್ಕೆಮಾಡಿದ ಎಣಿಕೆಗಳಿಗೆ ವಿಸ್ತರಿಸುತ್ತದೆ ಮತ್ತು ಸಂಕುಚಿಸುತ್ತದೆ.' },
        { title: 'ಅಭ್ಯಾಸ ಇತಿಹಾಸ', desc: 'ಅವಧಿ ಮತ್ತು ಪ್ರಕಾರದೊಂದಿಗೆ ಲಾಗ್ ಆದ ಸೆಷನ್‌ಗಳು; ನಿಮ್ಮ ಸ್ಥಿರತೆಯ ಶಾಂತ ಕ್ಯಾಲೆಂಡರ್ ವ್ಯೂ, ನಿಮ್ಮ ಮೇಲೆ ಕೂಗುವ ಯಾವುದೇ ಬ್ಯಾಡ್ಜ್‌ಗಳಿಲ್ಲ.' },
        { title: 'ನಿಮ್ಮ ಅಭ್ಯಾಸಗಳು, ಪಟ್ಟಿ ಮಾಡಲಾಗಿದೆ', desc: 'ಮೌನ ಕುಳಿತುಕೊಳ್ಳುವಿಕೆ, ದೇಹ ಸ್ಕ್ಯಾನ್, ವಾಕಿಂಗ್ ಧ್ಯಾನ — ನಿಮ್ಮ ಸ್ವಂತ ಅಭ್ಯಾಸ ಮೆನು, ಪ್ರತಿಯೊಂದೂ ತನ್ನ ಡೀಫಾಲ್ಟ್ ಟೈಮರ್‌ನೊಂದಿಗೆ.' },
      ],
      promptExample: 'ಧ್ಯಾನ ಮೊಬೈಲ್ ಆ್ಯಪ್ ರಚಿಸಿ: ನನ್ನ ಅಭ್ಯಾಸಗಳನ್ನು (Silent Sit, Box Breathing, Body Scan) ಪ್ರತಿಯೊಂದೂ ಡೀಫಾಲ್ಟ್ ಅವಧಿಯೊಂದಿಗೆ ಪಟ್ಟಿ ಮಾಡುವ Home ಸ್ಕ್ರೀನ್; ಒಂದು ಮಿನಿಮಲ್ ಕೌಂಟ್‌ಡೌನ್ ಟೈಮರ್, ಆರಂಭ ಮತ್ತು ಅಂತ್ಯ ಚೈಮ್, ಮತ್ತು ಕುಳಿತುಕೊಳ್ಳುವಾಗ ಡಾರ್ಕ್ ಆಗಿ ಇರುವ ಸ್ಕ್ರೀನ್ ಇರುವ Session ಸ್ಕ್ರೀನ್; 4-4-4-4 ಬಾಕ್ಸ್ ಉಸಿರಾಟದ ವೇಗವಿರುವ ಆನಿಮೇಟೆಡ್ ವೃತ್ತವಿರುವ Breathing ಸ್ಕ್ರೀನ್; ಮತ್ತು ಪೂರ್ಣಗೊಂಡ ಸೆಷನ್‌ಗಳ ಮಾಸಿಕ ಕ್ಯಾಲೆಂಡರ್ ಇರುವ History ಸ್ಕ್ರೀನ್. ತುಂಬಾ ಮಿನಿಮಲ್, ಡಾರ್ಕ್, ಗೇಮಿಫಿಕೇಶನ್ ಇಲ್ಲ.',
      faqs: [
        { q: 'ಇದು ಆಂಬಿಯೆಂಟ್ ಶಬ್ದಗಳು ಅಥವಾ ಮಾರ್ಗದರ್ಶಿ ಆಡಿಯೋ ಪ್ಲೇ ಮಾಡಬಹುದೇ?', a: 'ಹೌದು — ನಿಮ್ಮ ಪ್ರಾಂಪ್ಟ್‌ನಲ್ಲಿ ಆಡಿಯೋ ಆಯ್ಕೆ ಕೇಳಿ ಮತ್ತು ನಿಮ್ಮ ಸ್ವಂತ ಟ್ರ್ಯಾಕ್‌ಗಳನ್ನು ಸೇರಿಸಿ; ಆ್ಯಪ್ ಅವುಗಳನ್ನು ಟೈಮರ್ ಅಡಿಯಲ್ಲಿ ಪ್ಲೇ ಮಾಡುತ್ತದೆ.' },
        { q: 'ನಾನು ಉಸಿರಾಟದ ಲಯವನ್ನು ಹೊಂದಿಸಬಹುದೇ?', a: 'ಪೇಸರ್ ಎಣಿಕೆಗಳು ಸೆಟ್ಟಿಂಗ್‌ಗಳಾಗಿವೆ — ಆ್ಯಪ್‌ನಲ್ಲಿ 4-4-4-4 ಅನ್ನು ಯಾವುದೇ ಮಾದರಿಗೆ ಬದಲಾಯಿಸಿ, ಅಥವಾ 4-7-8 ರಂತಹ ಪ್ರಿಸೆಟ್‌ಗಳನ್ನು ಸೇರಿಸಲು ಚಾಟ್‌ಗೆ ಕೇಳಿ.' },
        { q: 'Calm ಗೆ ಚಂದಾದಾರರಾಗುವ ಬದಲು ಇದನ್ನೇ ಏಕೆ ರಚಿಸಬೇಕು?', a: 'ನಿಮ್ಮ ಅಭ್ಯಾಸಕ್ಕೆ ಸೆಲೆಬ್ರಿಟಿ ಸ್ಲೀಪ್ ಸ್ಟೋರೀಸ್ ಲೈಬ್ರರಿ ಬೇಕಿದ್ದರೆ, ಚಂದಾದಾರರಾಗಿ. ಅದಕ್ಕೆ ಟೈಮರ್, ಪೇಸರ್, ಮತ್ತು ದಾಖಲೆ ಬೇಕಿದ್ದರೆ — ಅದು ನೀವು ಶಾಶ್ವತವಾಗಿ ಹೊಂದಿರುವ ಒಂದು ಅಪರಾಹ್ನದ ನಿರ್ಮಾಣ.' },
        { q: 'ಇದಕ್ಕೆ ಖಾತೆ ಬೇಕೇ?', a: 'ನಿಮ್ಮ ಆಯ್ಕೆ — ಇದನ್ನು ಸಂಪೂರ್ಣವಾಗಿ ವೈಯಕ್ತಿಕ ಏಕ-ಬಳಕೆದಾರ ಆ್ಯಪ್ ಆಗಿ ರಚಿಸಿ, ಅಥವಾ ಸಾಧನಗಳಾದ್ಯಂತ ನಿಮ್ಮ ಇತಿಹಾಸ ಸಿಂಕ್ ಆಗಬೇಕಾದರೆ ನಂತರ ಲಾಗಿನ್ ಸೇರಿಸಿ.' },
      ],
    },
    'period-tracker-app': {
      h1: 'AI ಮೂಲಕ ಪೀರಿಯಡ್ ಟ್ರ್ಯಾಕರ್ ಆ್ಯಪ್ ರಚಿಸಿ',
      metaTitle: 'AI ಮೂಲಕ ಖಾಸಗಿ ಪೀರಿಯಡ್ ಟ್ರ್ಯಾಕರ್ ಆ್ಯಪ್ ರಚಿಸಿ',
      metaDesc: 'ಚಕ್ರ ಭವಿಷ್ಯವಾಣಿಗಳು, ಲಕ್ಷಣ ಲಾಗಿಂಗ್, ಮತ್ತು ಇತಿಹಾಸ ವ್ಯೂ — ನಿಮ್ಮ ಸ್ವಂತ ಡೇಟಾಬೇಸ್‌ನಲ್ಲಿ, ನಿಮ್ಮ ಆರೋಗ್ಯ ಡೇಟಾವನ್ನು ಮಾರುವ ದೊಡ್ಡ-ಟೆಕ್ ಆ್ಯಪ್ ಅಲ್ಲ. ಸರಳ ಇಂಗ್ಲಿಷ್‌ನಿಂದ ನಿರ್ಮಿಸಲಾಗಿದೆ.',
      tagline: 'ನಿಮ್ಮ ಡೇಟಾಬೇಸ್‌ನಲ್ಲಿ ವಾಸಿಸುವ ಚಕ್ರ ಭವಿಷ್ಯವಾಣಿಗಳು ಮತ್ತು ಲಕ್ಷಣ ಲಾಗಿಂಗ್ — ನಿಮ್ಮ ಆರೋಗ್ಯ ಡೇಟಾದ ಮೇಲೆ ನಿರ್ಮಿಸಲಾದ ವ್ಯಾಪಾರ ಮಾದರಿಯ ದೊಡ್ಡ-ಟೆಕ್ ಆ್ಯಪ್ ಅಲ್ಲ.',
      body: [
        'ಪೀರಿಯಡ್ ಟ್ರ್ಯಾಕಿಂಗ್ ಆ್ಯಪ್‌ಗಳು ನಿಜವಾದ ಅಪನಂಬಿಕೆಯನ್ನು ಗಳಿಸಿವೆ: ಬಳಕೆದಾರರು ತಮ್ಮ ಫೋನ್‌ನಿಂದ ಹೊರಡುವುದನ್ನು ಕಡಿಮೆ ಬಯಸುವ — ಚಕ್ರ ದಿನಾಂಕಗಳು, ಲಕ್ಷಣಗಳು, ಲೈಂಗಿಕ ಚಟುವಟಿಕೆ — ಡೇಟಾವನ್ನೇ ಹಲವಾರು ಮುಖ್ಯವಾಹಿನಿಯ ಆ್ಯಪ್‌ಗಳು ಮಾರಾಟ ಮಾಡುತ್ತಿರುವುದು ಅಥವಾ ಹಂಚಿಕೊಳ್ಳುತ್ತಿರುವುದು ಸಿಕ್ಕಿಬಿದ್ದಿದೆ. ಇಷ್ಟು ವೈಯಕ್ತಿಕವಾದ ವಿಷಯಕ್ಕೆ, "ಈ ಡೇಟಾದ ಮಾಲೀಕರು ಯಾರು" ಎಂಬುದು ಚಿಕ್ಕ ವಿವರವಲ್ಲ, ಇದು ಸಂಪೂರ್ಣ ನಿರ್ಧಾರ.',
        'ನಿಮ್ಮ ಸ್ವಂತದ್ದನ್ನು ನಿರ್ಮಿಸುವುದು ಆ ಅಪಾಯವನ್ನು ಶೂನ್ಯಕ್ಕೆ ಕುಸಿಯುತ್ತದೆ: ನೀವು ಚಕ್ರಗಳನ್ನು ಹೇಗೆ ಲಾಗ್ ಮತ್ತು ಊಹಿಸಲು ಬಯಸುತ್ತೀರಿ ಎಂದು ವಿವರಿಸಿ, ಮತ್ತು WyberAi ನಿಮ್ಮ ಡೇಟಾದ ಮೇಲೆ ಆದಾಯ ಮಾದರಿ ಅವಲಂಬಿಸಿರುವ ಕಂಪನಿಯ ಯಾವುದೇ ಅನಾಲಿಟಿಕ್ಸ್ SDK ಇಲ್ಲದೆ, ನೀವು ಮಾತ್ರ ನಿಯಂತ್ರಿಸುವ ಡೇಟಾಬೇಸ್‌ನಲ್ಲಿ ಎಲ್ಲವನ್ನೂ ಸಂಗ್ರಹಿಸುವ ಆ್ಯಪ್ ಅನ್ನು ಜನರೇಟ್ ಮಾಡುತ್ತದೆ. ಚಕ್ರ ಭವಿಷ್ಯವಾಣಿಗಳು, ಲಕ್ಷಣ ಮತ್ತು ಮನಸ್ಥಿತಿ ಲಾಗಿಂಗ್, ಮತ್ತು ನಿಜವಾಗಿ ಮಾದರಿಗಳನ್ನು ಗುರುತಿಸಲು ಸಹಾಯ ಮಾಡುವ ಇತಿಹಾಸ ವ್ಯೂ — ಟ್ರೇಡ್‌ಆಫ್ ಇಲ್ಲದೆ ಫೀಚರ್‌ಗಳು.',
      ],
      features: [
        { title: 'ಚಕ್ರ ಲಾಗಿಂಗ್ ಮತ್ತು ಭವಿಷ್ಯವಾಣಿಗಳು', desc: 'ಪೀರಿಯಡ್ ಆರಂಭ ಮತ್ತು ಅಂತ್ಯ ದಿನಾಂಕಗಳನ್ನು ಲಾಗ್ ಮಾಡಿ; ಆ್ಯಪ್ ಜನಸಂಖ್ಯೆ ಸರಾಸರಿಯಲ್ಲ, ನಿಮ್ಮ ಸ್ವಂತ ಇತಿಹಾಸದ ಆಧಾರದ ಮೇಲೆ ನಿಮ್ಮ ಮುಂದಿನ ಚಕ್ರವನ್ನು ಊಹಿಸುತ್ತದೆ.' },
        { title: 'ಲಕ್ಷಣ ಮತ್ತು ಮನಸ್ಥಿತಿ ಟ್ರ್ಯಾಕಿಂಗ್', desc: 'ದಿನಕ್ಕೆ ಲಕ್ಷಣಗಳು, ಫ್ಲೋ ತೀವ್ರತೆ, ಮತ್ತು ಮನಸ್ಥಿತಿಯನ್ನು ಲಾಗ್ ಮಾಡಿ — ಪ್ರಾಡಕ್ಟ್ ತಂಡ ನಿಮಗಾಗಿ ಆಯ್ಕೆ ಮಾಡಿದ ಸ್ಥಿರ ಪಟ್ಟಿಯಲ್ಲ, ನಿಮ್ಮ ಸ್ವಂತ ಟ್ಯಾಗ್‌ಗಳು.' },
        { title: 'ರಚನೆಯಿಂದ ಖಾಸಗಿ', desc: 'ನಿಮ್ಮ ಡೇಟಾ ಯಾವುದೇ ಥರ್ಡ್-ಪಾರ್ಟಿ ಅನಾಲಿಟಿಕ್ಸ್ ಅಥವಾ ಜಾಹೀರಾತು SDK ಗಳಿಲ್ಲದೆ ನಿಮ್ಮ ಸ್ವಂತ ಡೇಟಾಬೇಸ್‌ನಲ್ಲಿ ವಾಸಿಸುತ್ತದೆ — ಏಕೆಂದರೆ ನೀವು ಯಾವುದನ್ನೂ ನಿರ್ಮಿಸಲಿಲ್ಲ.' },
        { title: 'ಇತಿಹಾಸ ಮತ್ತು ಮಾದರಿಗಳು', desc: 'ಹಿಂದಿನ ಚಕ್ರಗಳಾದ್ಯಂತ ಕ್ಯಾಲೆಂಡರ್ ವ್ಯೂ ಇದರಿಂದ ಮಾದರಿಗಳು — ಅನಿಯಮಿತ ಸಮಯ, ಲಕ್ಷಣ ಗುಂಪುಗಳು — ಈ ಚಕ್ರದಲ್ಲಿ ಮಾತ್ರವಲ್ಲ, ತಿಂಗಳುಗಳಲ್ಲಿ ಗೋಚರಿಸುತ್ತವೆ.' },
      ],
      promptExample: 'ಪೀರಿಯಡ್ ಟ್ರ್ಯಾಕರ್ ಮೊಬೈಲ್ ಆ್ಯಪ್ ರಚಿಸಿ: ಯಾವುದೇ ದಿನಕ್ಕೆ ಪೀರಿಯಡ್ ಆರಂಭ/ಅಂತ್ಯ ದಿನಾಂಕಗಳು, ಫ್ಲೋ ತೀವ್ರತೆ, ಲಕ್ಷಣಗಳು (ಸೆಳೆತ, ತಲೆನೋವು, ಆಯಾಸ), ಮತ್ತು ಮನಸ್ಥಿತಿಯನ್ನು ದಾಖಲಿಸುವ Log ಸ್ಕ್ರೀನ್; ಹಿಂದಿನ ಚಕ್ರಗಳು ಮತ್ತು ಸರಾಸರಿ ಚಕ್ರ ಉದ್ದದ ಆಧಾರದ ಮೇಲೆ ಊಹಿಸಲಾದ ಮುಂದಿನ ಆರಂಭ ದಿನಾಂಕ ತೋರಿಸುವ Calendar ಸ್ಕ್ರೀನ್; ಮತ್ತು ಕಳೆದ 6 ತಿಂಗಳುಗಳಲ್ಲಿ ಚಕ್ರ ಉದ್ದ ಮತ್ತು ಸಾಮಾನ್ಯ ಲಕ್ಷಣಗಳ ಪ್ರವೃತ್ತಿಗಳಿರುವ History ಸ್ಕ್ರೀನ್. ಸರಳ, ಖಾಸಗಿ, ಯಾವುದೇ ಸಾಮಾಜಿಕ ಫೀಚರ್‌ಗಳಿಲ್ಲ.',
      faqs: [
        { q: 'ನನ್ನ ಡೇಟಾ ನಿಜವಾಗಿ ಖಾಸಗಿಯೇ?', a: 'ಇದು ನಿಮ್ಮ ಸ್ವಂತ ಆ್ಯಪ್‌ನ ಡೇಟಾಬೇಸ್‌ನಲ್ಲಿ ಸಂಗ್ರಹಿಸಲ್ಪಡುತ್ತದೆ, ನೀವು ಸ್ಪಷ್ಟವಾಗಿ ಕೇಳದ ಹೊರತು ಯಾವುದೇ ಅನಾಲಿಟಿಕ್ಸ್ ಅಥವಾ ಟ್ರ್ಯಾಕಿಂಗ್ SDK ಗಳಿಲ್ಲದೆ ಜನರೇಟ್ ಆಗಿದೆ — ಮಾರಲು ಏನೂ ಇಲ್ಲ ಏಕೆಂದರೆ ಯಾವುದೇ ಥರ್ಡ್ ಪಾರ್ಟಿ ಏನನ್ನೂ ಸಂಗ್ರಹಿಸುವುದಿಲ್ಲ.' },
        { q: 'ಭವಿಷ್ಯವಾಣಿಗಳು ಎಷ್ಟು ನಿಖರ?', a: 'ಭವಿಷ್ಯವಾಣಿಗಳು ನಿಮ್ಮ ಸ್ವಂತ ಲಾಗ್ ಮಾಡಿದ ಚಕ್ರ ಇತಿಹಾಸವನ್ನು ಆಧರಿಸಿವೆ — ಹೆಚ್ಚು ಚಕ್ರಗಳನ್ನು ಲಾಗ್ ಮಾಡಿದಷ್ಟೂ, ಸಾಮಾನ್ಯ 28-ದಿನದ ಊಹೆಗಿಂತ ಸರಾಸರಿ ನಿಮ್ಮ ನಿಜವಾದ ಮಾದರಿಯನ್ನು ಹೆಚ್ಚು ಪ್ರತಿಬಿಂಬಿಸುತ್ತದೆ.' },
        { q: 'ನಾನು ನನ್ನ ಡೇಟಾವನ್ನು ರಫ್ತು ಮಾಡಬಹುದೇ?', a: 'ನಿಮ್ಮ ಪ್ರಾಂಪ್ಟ್‌ನಲ್ಲಿ CSV ರಫ್ತು ಕೇಳಿ — ನಿಮ್ಮ ಇತಿಹಾಸ ನಿಮ್ಮದು, ಮುಚ್ಚಿದ ಆ್ಯಪ್‌ನ ಗೋಡೆ-ಸುತ್ತುವರಿದ ದಾಖಲೆಗಳಂತಲ್ಲ.' },
        { q: 'ಪಾಲುದಾರ ಅಥವಾ ವೈದ್ಯರು ನಿರ್ದಿಷ್ಟ ಡೇಟಾ ನೋಡಬಹುದೇ?', a: 'ವೈದ್ಯರಿಗೆ ನಿರ್ದಿಷ್ಟ ಡೇಟಾ ನೀಡಲು ಬಯಸಿದರೆ ಹಂಚಿಕೊಳ್ಳಬಹುದಾದ ಸಾರಾಂಶ ಅಥವಾ PDF ವರದಿ ಸ್ಕ್ರೀನ್ ಕೇಳಿ — ಹಂಚಿಕೊಳ್ಳುವಿಕೆ ಸಂಪೂರ್ಣವಾಗಿ ನಿಮ್ಮ ಆಯ್ಕೆಯಾಗಿ ಉಳಿಯುತ್ತದೆ.' },
      ],
    },
    'sleep-tracker-app': {
      h1: 'AI ಮೂಲಕ ಸ್ಲೀಪ್ ಟ್ರ್ಯಾಕರ್ ಆ್ಯಪ್ ರಚಿಸಿ',
      metaTitle: 'AI ಮೂಲಕ ಸ್ಲೀಪ್ ಟ್ರ್ಯಾಕರ್ ಆ್ಯಪ್ ರಚಿಸಿ — ಕೋಡ್ ಇಲ್ಲದೆ',
      metaDesc: 'ಮಲಗುವ ಮತ್ತು ಏಳುವ ಸಮಯ ಲಾಗ್ ಮಾಡಿ, ನಿಮ್ಮ ಸ್ಲೀಪ್ ಡೆಟ್ ನೋಡಿ, ಒಂದು ರಾತ್ರಿಯನ್ನು ಏನು ಹಾಳುಮಾಡುತ್ತದೆ ಎಂದು ಗುರುತಿಸಿ — ಸರಳ ಇಂಗ್ಲಿಷ್‌ನಿಂದ ಜನರೇಟ್ ಆದ ಸ್ಲೀಪ್ ಟ್ರ್ಯಾಕರ್, ಯಾವುದೇ ವೇರಬಲ್ ಅಗತ್ಯವಿಲ್ಲ.',
      tagline: 'ರಾತ್ರಿಯನ್ನು ಲಾಗ್ ಮಾಡಿ, ಡೆಟ್ ಹೆಚ್ಚಾಗುವುದನ್ನು ನೋಡಿ, ತಡವಾದ ಕಾಫಿಯೇ ಬುಧವಾರಗಳು ಕೆಟ್ಟದಾಗಿ ಅನಿಸಲು ನಿಜವಾದ ಕಾರಣ ಎಂದು ಗುರುತಿಸಿ.',
      body: [
        'ನೀವು ದಣಿದಿದ್ದೀರಿ ಎಂದು ಗಮನಿಸಲು ನಿಮಗೆ $300 ರಿಂಗ್ ಬೇಕಿಲ್ಲ — ನೀವು ನಿಜವಾಗಿ ಯಾವಾಗ ಮಲಗಿದ್ದೀರಿ ಮತ್ತು ಎದ್ದಿದ್ದೀರಿ ಎಂಬುದರ ಪ್ರಾಮಾಣಿಕ ದಾಖಲೆ ಬೇಕು, ನಿಮಗೆ ಬೇಕು ಎಂದು ತಿಳಿದಿರುವುದರ ಜೊತೆ ಹೋಲಿಸಲಾಗಿದೆ. ವೇರಬಲ್-ಲಿಂಕ್ಡ್ ಆ್ಯಪ್‌ಗಳು ಈ ಸರಳ ಸತ್ಯವನ್ನು ಪ್ರಶ್ನಾರ್ಹ ನಿಖರತೆಯ ಕನ್ಸ್ಯೂಮರ್ ಸೆನ್ಸಾರ್‌ಗಳಿಂದ ಅಳೆದ ಸ್ಕೋರ್‌ಗಳು ಮತ್ತು ಹಂತಗಳಲ್ಲಿ ಮುಳುಗಿಸುತ್ತವೆ.',
        'ಲಾಗ್ ಮಾಡಿದ ಸ್ಲೀಪ್ ಟ್ರ್ಯಾಕರ್ ಸೆನ್ಸಾರ್ ಅನ್ನು ಸಂಪೂರ್ಣವಾಗಿ ಬಿಟ್ಟುಬಿಡುತ್ತದೆ: WyberAi ಗೆ ನೀವು ರಾತ್ರಿಗಳನ್ನು ಹೇಗೆ ದಾಖಲಿಸಲು ಬಯಸುತ್ತೀರಿ ಎಂದು ಹೇಳಿ — ಮಲಗುವ ಸಮಯ, ಏಳುವ ಸಮಯ, ನೀವು ಎಷ್ಟು ವಿಶ್ರಾಂತಿ ಅನುಭವಿಸಿದ್ದೀರಿ — ಮತ್ತು ಇದು ಆ ಅಭ್ಯಾಸದ ಸುತ್ತ ಆ್ಯಪ್ ಅನ್ನು ನಿರ್ಮಿಸುತ್ತದೆ. ಸಾಪ್ತಾಹಿಕ ಚಾರ್ಟ್ ಮಾದರಿಯನ್ನು ತೋರಿಸುತ್ತದೆ, ಚಾಲನೆಯಲ್ಲಿರುವ ಸ್ಲೀಪ್-ಡೆಟ್ ಸಂಖ್ಯೆ ಕೊರತೆಯನ್ನು ನಿಜವಾಗಿಸುತ್ತದೆ, ಮತ್ತು ಐಚ್ಛಿಕ ಟಿಪ್ಪಣಿಗಳು (ತಡವಾದ ಕಾಫಿ, ಒತ್ತಡದ ದಿನ, ರಾತ್ರಿ ಪಾನೀಯ) ನಿಮ್ಮ ಮಣಿಕಟ್ಟಿನ ಮೇಲೆ ಯಾವುದೇ ಸಾಧನ ಬೇಕಾಗದೆ ಆಲಸ್ಯದ ಬೆಳಗುಗಳೊಂದಿಗೆ ಕಾರಣವನ್ನು ಸಂಬಂಧಿಸಲು ಬಿಡುತ್ತವೆ.',
      ],
      features: [
        { title: 'ಮಲಗುವ ಮತ್ತು ಏಳುವ ಲಾಗಿಂಗ್', desc: 'ನೀವು ಯಾವಾಗ ಮಲಗಿದ್ದೀರಿ ಮತ್ತು ಎದ್ದಿದ್ದೀರಿ ಎಂಬುದರ ತ್ವರಿತ ರಾತ್ರಿ ಎಂಟ್ರಿ — ನಿಜವಾಗಿ ಮುಖ್ಯವಾದ ಎರಡು ಸಂಖ್ಯೆಗಳು.' },
        { title: 'ನಿದ್ರೆ ಅವಧಿ ಚಾರ್ಟ್', desc: 'ಪ್ರತಿ-ರಾತ್ರಿ ಮಲಗಿದ ಗಂಟೆಗಳ ಸಾಪ್ತಾಹಿಕ ವ್ಯೂ, ಆದ್ದರಿಂದ ಕೆಟ್ಟ ಸ್ಟ್ರೀಕ್ ಕೇವಲ ಅನುಭವಿಸುವ ಬದಲು ಗೋಚರಿಸುತ್ತದೆ.' },
        { title: 'ಸ್ಲೀಪ್ ಡೆಟ್ ಟ್ರ್ಯಾಕರ್', desc: 'ಪ್ರತಿ-ರಾತ್ರಿ ನಿಮ್ಮ ಗುರಿ ಗಂಟೆಗಳ ವಿರುದ್ಧ ಚಾಲನೆಯಲ್ಲಿರುವ ಒಟ್ಟು — ಗುರುವಾರ ಸೋಮವಾರಕ್ಕಿಂತ ಏಕೆ ಕೆಟ್ಟದಾಗಿ ಅನಿಸುತ್ತದೆ ಎಂದು ವಿವರಿಸುವ ಸಂಖ್ಯೆ.' },
        { title: 'ಪರಸ್ಪರ ಸಂಬಂಧ ಟಿಪ್ಪಣಿಗಳು', desc: 'ಕೆಫೀನ್, ಸ್ಕ್ರೀನ್ ಸಮಯ, ಅಥವಾ ಒತ್ತಡದೊಂದಿಗೆ ರಾತ್ರಿಗಳನ್ನು ಟ್ಯಾಗ್ ಮಾಡಿ ಮತ್ತು ಯಾವ ಟ್ಯಾಗ್‌ಗಳು ನಿಮ್ಮ ಕೆಟ್ಟ-ರೇಟೆಡ್ ಬೆಳಗುಗಳೊಂದಿಗೆ ಗುಂಪುಗೂಡುತ್ತವೆ ಎಂದು ನೋಡಿ.' },
      ],
      promptExample: 'ಸ್ಲೀಪ್ ಟ್ರ್ಯಾಕರ್ ಮೊಬೈಲ್ ಆ್ಯಪ್ ರಚಿಸಿ: ಪ್ರತಿ ಬೆಳಗ್ಗೆ ಮಲಗುವ ಸಮಯ, ಏಳುವ ಸಮಯ, ಮತ್ತು 1-5 ವಿಶ್ರಾಂತಿ ರೇಟಿಂಗ್, ಐಚ್ಛಿಕ ಟ್ಯಾಗ್‌ಗಳೊಂದಿಗೆ (ಮಧ್ಯಾಹ್ನ 3 ರ ನಂತರ ಕೆಫೀನ್, ತಡವಾದ ಸ್ಕ್ರೀನ್ ಸಮಯ, ಒತ್ತಡದ ದಿನ) ನಮೂದಿಸುವ Log ಸ್ಕ್ರೀನ್; ನಾನು ಸೆಟ್ ಮಾಡಿದ ಗುರಿಯ ವಿರುದ್ಧ ಪ್ರತಿ-ರಾತ್ರಿ ಮಲಗಿದ ಗಂಟೆಗಳ ಬಾರ್ ಚಾರ್ಟ್ ಇರುವ Weekly ಸ್ಕ್ರೀನ್; ಮತ್ತು ಕಳೆದ 30 ದಿನಗಳಲ್ಲಿ ಗುರಿ ವಿರುದ್ಧ ನನ್ನ ಚಾಲನೆಯಲ್ಲಿರುವ ಸ್ಲೀಪ್ ಡೆಟ್ ಅಥವಾ ಹೆಚ್ಚುವರಿಯನ್ನು ತೋರಿಸುವ Debt ಸ್ಕ್ರೀನ್.',
      faqs: [
        { q: 'ಇದಕ್ಕೆ ವೇರಬಲ್ ಅಥವಾ ಫೋನ್ ಸೆನ್ಸಾರ್ ಬೇಕೇ?', a: 'ಇಲ್ಲ — ಇದು ದಿನಕ್ಕೆ ಹತ್ತು ಸೆಕೆಂಡ್ ತೆಗೆದುಕೊಳ್ಳುವ ಮತ್ತು ಕನ್ಸ್ಯೂಮರ್ ಸ್ಲೀಪ್-ಸೆನ್ಸಿಂಗ್ ಹಾರ್ಡ್‌ವೇರ್‌ನ ನಿಖರತೆ ಸಮಸ್ಯೆಗಳನ್ನು ತಪ್ಪಿಸುವ ಹಸ್ತಚಾಲಿತ ಲಾಗ್.' },
        { q: 'ಇದು ಕೆಟ್ಟ ನಿದ್ರೆಯೊಂದಿಗೆ ಏನು ಸಂಬಂಧಿಸಿದೆ ಎಂದು ತೋರಿಸಬಹುದೇ?', a: 'ನಿಮಗೆ ಮುಖ್ಯ ಎಂದು ಅನುಮಾನಿಸುವ ಯಾವುದನ್ನಾದರೂ ರಾತ್ರಿಗಳನ್ನು ಟ್ಯಾಗ್ ಮಾಡಿ — ಕೆಫೀನ್, ಸ್ಕ್ರೀನ್ ಸಮಯ, ಒತ್ತಡ — ಮತ್ತು ಪರಸ್ಪರ ಸಂಬಂಧ ವ್ಯೂ ಟ್ಯಾಗ್ ಪ್ರಕಾರ ನಿಮ್ಮ ವಿಶ್ರಾಂತಿ-ರೇಟಿಂಗ್ ಅನ್ನು ಗುಂಪುಗೊಳಿಸಬಹುದು.' },
        { q: 'ನಾನು ವೈಯಕ್ತಿಕ ನಿದ್ರೆ ಗುರಿಯನ್ನು ಹೊಂದಿಸಬಹುದೇ?', a: 'ಹೌದು — ಸೆಟ್ಟಿಂಗ್‌ಗಳಲ್ಲಿ ಪ್ರತಿ-ರಾತ್ರಿ ನಿಮ್ಮ ಗುರಿ ಗಂಟೆಗಳನ್ನು ಹೊಂದಿಸಿ ಮತ್ತು ಡೆಟ್ ಟ್ರ್ಯಾಕರ್ ಆ ಸಂಖ್ಯೆಯ ವಿರುದ್ಧ ಲೆಕ್ಕ ಹಾಕುತ್ತದೆ, ಸಾಮಾನ್ಯ ಶಿಫಾರಸಿನ ವಿರುದ್ಧ ಅಲ್ಲ.' },
        { q: 'ಇದು ಮಲಗುವ ಮೊದಲು ಲಾಗ್ ಮಾಡಲು ನನಗೆ ನೆನಪಿಸುತ್ತದೆಯೇ?', a: 'ನಿಮ್ಮ ಪ್ರಾಂಪ್ಟ್‌ನಲ್ಲಿ ರಾತ್ರಿ ಜ್ಞಾಪನೆ ಅಧಿಸೂಚನೆ ಕೇಳಿ — ನೀವು ಸೆಟ್ ಮಾಡಿದ ಸಮಯದಲ್ಲಿ ಒಂದು ಸರಳ ಪುಶ್.' },
      ],
    },
  },
  te: {
    'workout-tracker-app': {
      h1: 'AIతో వర్కౌట్ ట్రాకర్ యాప్‌ను నిర్మించండి',
      metaTitle: 'AIతో వర్కౌట్ ట్రాకర్ యాప్‌ను నిర్మించండి — కోడ్ లేకుండా',
      metaDesc: 'మీ ప్రోగ్రామ్‌కు సరిపోయే జిమ్ లాగ్: వ్యాయామాలు, సెట్‌లు, ప్రోగ్రెసివ్ ఓవర్‌లోడ్ చార్ట్‌లు. ఇంగ్లీష్‌లో వివరించండి, నిమిషాల్లో పని చేసే మొబైల్ యాప్‌ను పొందండి.',
      tagline: 'సెట్ల మధ్య సెట్‌లను లాగ్ చేయండి. ఓవర్‌లోడ్ కర్వ్‌ను చూడండి. మీ ప్రోగ్రామ్ చుట్టూ నిర్మించబడింది — పుష్/పుల్/లెగ్స్, 5×5, లేదా మీ కోచ్ యొక్క స్ప్రెడ్‌షీట్.',
      body: [
        'వర్కౌట్ లాగ్‌కు ఒకే పని ఉంది: విశ్రాంతి టైమర్ ముగియకముందే మీరు ఇప్పుడే చేసిన సెట్‌ను క్యాప్చర్ చేయడం, మరియు వచ్చే వారం బార్ పైకి కదులుతోందని నిరూపించడం. దుకాణం నుండి కొన్న ఫిట్‌నెస్ యాప్‌లు దీన్ని సోషల్ ఫీడ్‌లు, కోచింగ్ అప్‌సెల్‌లు, మరియు సబ్‌స్క్రిప్షన్‌లలో చుడతాయి — మీ నిజమైన ప్రోగ్రామ్ బహుశా కోచ్ ఇచ్చిన స్ప్రెడ్‌షీట్‌లో ఉంటుంది.',
        'WyberAi ఆ స్ప్రెడ్‌షీట్‌ను యాప్‌గా మారుస్తుంది. మీ స్ప్లిట్‌ను మరియు ప్రతి-సెట్‌కు మీరు ఏమి రికార్డ్ చేస్తారో వివరించండి, మరియు ఇది మొబైల్ యాప్‌ను జనరేట్ చేస్తుంది: మీ ప్రోగ్రామ్డ్ వ్యాయామాలు ఉన్న నేటి-వర్కౌట్ స్క్రీన్, ప్రతి ఇన్‌పుట్ పక్కన మునుపటి-సెషన్ సంఖ్యలతో వేగవంతమైన సెట్ లాగింగ్, మరియు స్క్వాట్ వాల్యూమ్ నిజంగా పెరుగుతుందో లేదో చూపే ప్రతి-వ్యాయామ చార్ట్‌లు. ఇది సాఫ్ట్‌వేర్‌గా మీ ప్రోగ్రామ్, మీ ప్రోగ్రామ్‌ను లోపల కుక్కిన ఇంకొకరి యాప్ కాదు.',
      ],
      features: [
        { title: 'మీ స్ప్లిట్, ప్రోగ్రామ్ చేయబడింది', desc: 'పుష్/పుల్/లెగ్స్, అప్పర్/లోయర్, 5×5 — మీ దినచర్య నుండి జనరేట్ చేయబడిన వర్కౌట్ రోజులు, ప్రతి ఒక్కటి దాని వ్యాయామ జాబితాతో.' },
        { title: 'రెస్ట్-టైమర్-వేగ లాగింగ్', desc: 'ప్రతి ఇన్‌పుట్ పక్కన ఇన్‌లైన్‌గా చూపిన చివరి సెషన్ సంఖ్యలతో ప్రతి-సెట్ బరువు మరియు రెప్స్ — బార్‌ను ర్యాక్ చేయడానికి పట్టే సమయంలో ఒక సెట్‌ను లాగ్ చేయండి.' },
        { title: 'ప్రోగ్రెసివ్ ఓవర్‌లోడ్ చార్ట్‌లు', desc: 'కాలక్రమేణా టాప్ సెట్ మరియు మొత్తం వాల్యూమ్ యొక్క ప్రతి-వ్యాయామ గ్రాఫ్‌లు — ప్రోగ్రామ్ పని చేస్తుందనే రుజువు.' },
        { title: 'PR ట్రాకింగ్', desc: 'మీ లాగ్‌ల నుండి గుర్తించబడిన వ్యక్తిగత రికార్డులు, ప్రతి-లిఫ్ట్‌కు రికార్డుల స్క్రీన్‌లో జరుపుకోబడతాయి.' },
      ],
      promptExample: 'పుష్/పుల్/లెగ్స్ ప్రోగ్రామ్ కోసం వర్కౌట్ ట్రాకర్ మొబైల్ యాప్‌ను నిర్మించండి: ప్రతి ఇన్‌పుట్ పక్కన చివరి సెషన్ సంఖ్యలు ప్రదర్శించబడిన నేను ప్రతి-సెట్ బరువు మరియు రెప్స్‌ను లాగ్ చేసే షెడ్యూల్ చేసిన రోజు వ్యాయామాలను చూపే Today స్క్రీన్; కాలక్రమేణా అత్యంత భారీ సెట్ యొక్క ప్రతి-వ్యాయామ చార్ట్ ఉన్న Progress స్క్రీన్; మరియు ప్రతి లిఫ్ట్‌కు నా PRని జాబితా చేసే Records స్క్రీన్. డార్క్ థీమ్, పెద్ద టచ్ టార్గెట్‌లు.',
      faqs: [
        { q: 'ఇది నా కోచ్ ప్రోగ్రామ్‌ను అనుసరించగలదా?', a: 'అవును — రోజులు, వ్యాయామాలు, మరియు సెట్/రెప్ స్కీమ్‌ను వివరించండి (లేదా ప్లాన్‌ను చాట్‌లో పేస్ట్ చేయండి) మరియు ఆ ఖచ్చితమైన ప్రోగ్రామ్ చుట్టూ యాప్ జనరేట్ అవుతుంది.' },
        { q: 'నేను మధ్య-చక్రంలో నా ప్రోగ్రామ్‌ను మార్చవచ్చా?', a: 'చాట్‌లో అడగండి — "పుష్ డే రోజు బెంచ్‌కు బదులుగా ఇంక్లైన్ డంబెల్ ప్రెస్ చేయండి" — మరియు మీ చరిత్ర చెక్కుచెదరకుండా ప్రోగ్రామ్ అప్‌డేట్ అవుతుంది.' },
        { q: 'ఇది జిమ్‌లో ఆఫ్‌లైన్‌లో పని చేస్తుందా?', a: 'జనరేట్ చేయబడిన యాప్ ఒక ప్రామాణిక React Native + Expo ప్రాజెక్ట్; మీ ప్రాంప్ట్‌లో ఆఫ్‌లైన్-ఫస్ట్ లాగింగ్‌ను అడగండి మరియు మీరు తిరిగి ఆన్‌లైన్‌లో ఉన్నప్పుడు ఎంట్రీలు సింక్ అవుతాయి.' },
        { q: 'నా ఫోన్‌లో ఇది ఎంత వేగంగా రాగలదు?', a: 'నిర్మించడానికి నిమిషాలు పడుతుంది, మరియు మీరు వెంటనే Expo ద్వారా మీ స్వంత ఫోన్‌లో ప్రివ్యూ చేస్తారు — చాలా మంది తమ తదుపరి సెషన్‌ను తమ స్వంత యాప్‌లో లాగ్ చేస్తారు.' },
      ],
    },
    'meal-planner-app': {
      h1: 'AIతో మీల్ ప్లానర్ యాప్‌ను నిర్మించండి',
      metaTitle: 'AIతో మీల్ ప్లానింగ్ యాప్‌ను నిర్మించండి — కోడ్ లేకుండా',
      metaDesc: 'వారపు భోజన ప్రణాళికలు, రెసిపీ బాక్స్, మరియు ఆటో-నిర్మిత కిరాణా జాబితా — మీ వివరణ నుండి జనరేట్ చేయబడిన మీల్ ప్లానర్, మీ కుటుంబం తినే విధానానికి తగినట్టుగా.',
      tagline: 'ఆదివారం వారాన్ని ప్లాన్ చేయండి, ఆటో-నిర్మిత జాబితా నుండి షాపింగ్ చేయండి, సాయంత్రం 6 గంటలకు "డిన్నర్‌కు ఏముంది" అని అడగడం ఆపండి.',
      body: [
        'భోజన ప్రణాళిక అంచుల వద్ద విఫలమవుతుంది: రెసిపీలు స్క్రీన్‌షాట్‌లలో ఉంటాయి, ప్రణాళిక మీ తలలో ఉంటుంది, మరియు కిరాణా జాబితా ప్రతి వారం మొదటి నుండి తిరిగి రాయబడుతుంది. ప్లానర్ యాప్‌లు ఉన్నాయి, కానీ అవి తమ రెసిపీ కేటలాగ్‌లను మరియు వారం గురించి తమ ఆలోచనను నెట్టివేస్తాయి — ముఖ్యమైన రెసిపీలు మీ కుటుంబం నిజంగా తినే పన్నెండు.',
        'మీరు ఎలా ప్లాన్ చేస్తారో వివరించండి — రోజుకు ఎన్ని భోజనాలు, ఎవరు శాకాహారి, షాపింగ్ ట్రిప్ ఎలా ఉంటుంది — మరియు WyberAi మీ వంటగది చుట్టూ ప్లానర్‌ను జనరేట్ చేస్తుంది: మీరు ఒకసారి నింపే రెసిపీ బాక్స్, డ్రాగ్-టుగెదర్ వారపు గ్రిడ్, మరియు వారం యొక్క పదార్థాల నుండి స్వయంగా సంకలనం చేసుకునే, ఐల్ ద్వారా సమూహం చేయబడిన కిరాణా జాబితా. ప్రెప్-డే వంట, మాక్రో లక్ష్యాలు, లేదా ఒక ఎంపిక చేసుకునే-పిల్లల కాలమ్ — ఇది మీ యాప్, కాబట్టి ప్రణాళిక కుటుంబానికి వంగుతుంది.',
      ],
      features: [
        { title: 'మీ రెసిపీ బాక్స్', desc: 'పదార్థాలు, సర్వింగ్‌లు, మరియు ట్యాగ్‌లతో మీ వంటకాలు — మీరు తిప్పే డజను భోజనాలు, మీకు లేని 40,000 డేటాబేస్ కాదు.' },
        { title: 'వారపు ప్రణాళిక గ్రిడ్', desc: 'రాబోయే వారం రోజులు మరియు భోజనాలకు రెసిపీలను కేటాయించండి; మంచి వారం అయినప్పుడు ఒక ట్యాప్‌లో గత వారాన్ని పునరావృతం చేయండి.' },
        { title: 'ఆటో-సంకలిత కిరాణా జాబితా', desc: 'ప్రణాళికాబద్ధమైన వారం నుండి పదార్థాలు ఒక జాబితాలో విలీనం చేయబడ్డాయి — పరిమాణాలు మొత్తం, ఐల్ ద్వారా సమూహం చేయబడ్డాయి, దుకాణంలో చెక్ చేయదగినవి.' },
        { title: 'కుటుంబ ప్రాధాన్యతలు', desc: 'ఆహార ట్యాగ్‌లు మరియు ప్రతి-వ్యక్తి నియమాలు (సోమవారాలు శాకాహారం, పిల్లలకు పుట్టగొడుగులు వద్దు) ప్లాన్ వ్యూలో గౌరవించబడతాయి.' },
      ],
      promptExample: 'మీల్ ప్లానర్ వెబ్ యాప్‌ను నిర్మించండి: నేను పదార్థాలు (పేరు, పరిమాణం, యూనిట్), సర్వింగ్‌లు, మరియు శాకాహారం లేదా త్వరిత వంటి ట్యాగ్‌లతో వంటకాలను జోడించే Recipes పేజీ; నేను రెసిపీలను కేటాయించే లంచ్ మరియు డిన్నర్ కోసం సోమవారం-నుండి-ఆదివారం గ్రిడ్ ఉన్న Planner పేజీ; మరియు ప్రణాళికాబద్ధమైన వారం నుండి అన్ని పదార్థాలను సంకలనం చేసే, పరిమాణాలను జోడించే, కేటగిరీల వారీగా సమూహపరిచే, షాపింగ్ చేస్తున్నప్పుడు అంశాలను చెక్ చేయడానికి అనుమతించే Grocery List పేజీ.',
      faqs: [
        { q: 'ఇది వేర్వేరు సర్వింగ్ కౌంట్‌ల కోసం రెసిపీలను స్కేల్ చేయగలదా?', a: 'అవును — ప్రతి ప్రణాళికాబద్ధమైన భోజనానికి సర్వింగ్‌లను సెట్ చేయండి మరియు అవి కిరాణా జాబితాకు చేరుకునే ముందు పదార్థాల పరిమాణాలు స్కేల్ అవుతాయి.' },
        { q: 'నా భాగస్వామి మరియు నేను ఒకే ప్లానర్‌ను పంచుకోవచ్చా?', a: 'అవును — ఇది లాగిన్‌లతో కూడిన వెబ్ యాప్, కాబట్టి మొత్తం కుటుంబం ఒక ప్రణాళిక మరియు ఒక జాబితాను చూస్తుంది, లైవ్‌గా అప్‌డేట్ చేయబడింది.' },
        { q: 'ఇది కేలరీలు లేదా మాక్రోలను ట్రాక్ చేయగలదా?', a: 'మీ ప్రాంప్ట్‌లో (లేదా తర్వాత చాట్‌లో) ప్రతి-పదార్థం లేదా ప్రతి-రెసిపీ మాక్రో ఫీల్డ్‌లను జోడించండి మరియు ప్లానర్ లక్ష్యాలకు వ్యతిరేకంగా రోజువారీ మొత్తాలను చూపగలదు.' },
        { q: 'నేను ఏదైనా కోడ్ చేయాలా?', a: 'లేదు — మీరు ప్లానర్‌ను వివరిస్తారు, WyberAi పని చేసే యాప్‌ను జనరేట్ చేస్తుంది, మరియు తదుపరి మార్పులు చాట్‌లో సాదా-ఇంగ్లీష్ అభ్యర్థనలు.' },
      ],
    },
    'meditation-app': {
      h1: 'AIతో ధ్యాన యాప్‌ను నిర్మించండి',
      metaTitle: 'AIతో ధ్యానం & మైండ్‌ఫుల్‌నెస్ యాప్‌ను నిర్మించండి',
      metaDesc: 'వ్యక్తిగత మైండ్‌ఫుల్‌నెస్ యాప్ — సెషన్ టైమర్, శ్వాస మార్గదర్శకాలు, మరియు ప్రశాంత స్ట్రీక్ — సాదా ఇంగ్లీష్ నుండి జనరేట్ చేయబడింది. మీది, ఎలాంటి సబ్‌స్క్రిప్షన్ లేకుండా.',
      tagline: 'టైమర్, శ్వాస మార్గదర్శి, మరియు మీ అభ్యాసం యొక్క నిశ్శబ్ద రికార్డు — మీకు మరియు పది నిమిషాల నిశ్శబ్దానికి మధ్య $70/సంవత్సరం సబ్‌స్క్రిప్షన్ లేకుండా.',
      body: [
        'మైండ్‌ఫుల్‌నెస్ యాప్‌ల విచిత్రమైన ఆర్థిక శాస్త్రం: మీరు ఎక్కువగా టైమర్, కొన్ని గంటలు, మరియు స్ట్రీక్ కౌంటర్ కోసం వార్షిక సబ్‌స్క్రిప్షన్ చెల్లిస్తారు — తర్వాత యాప్ స్లీప్ స్టోరీలను అప్‌సెల్ చేయడానికి మీ ప్రశాంతతకు అంతరాయం కలిగిస్తుంది. వ్యక్తిగత ధ్యాన యాప్ దానిని తారుమారు చేస్తుంది: మీరు చేసే అభ్యాసం ఖచ్చితంగా, మీరు అక్కడ ఉంచని ఏదీ స్క్రీన్‌పై లేదు.',
        'మీరు ఎలా అభ్యాసం చేస్తారో WyberAiకి చెప్పండి — టైమ్డ్ నిశ్శబ్ద కూర్చోవడాలు, బాక్స్ శ్వాస, ఉదయం శరీర స్కాన్ — మరియు ఇది దాని చుట్టూ React Native యాప్‌ను జనరేట్ చేస్తుంది: సున్నితమైన ప్రారంభ మరియు ముగింపు గంటలతో సెషన్ టైమర్, మీ లెక్కకు సెట్ చేయబడిన యానిమేటెడ్ శ్వాస పేసర్, మరియు గేమిఫై చేయకుండా మీ అభ్యాసం పెరుగుతున్నట్లు చూపే చరిత్ర. తక్కువే ఫీచర్ అయిన అరుదైన యాప్ కేటగిరీ ఇది, మరియు దాన్ని కలిగి ఉండటమే మీరు తక్కువ పొందే విధానం.',
      ],
      features: [
        { title: 'గంటలతో సెషన్ టైమర్', desc: 'వ్యవధిని ఎంచుకోండి, ప్రారంభ/ముగింపు గంటలు మరియు ఐచ్ఛిక విరామ మార్కర్‌లను పొందండి — మధ్యలో స్క్రీన్ చీకటిగా ఉంటుంది.' },
        { title: 'శ్వాస పేసర్', desc: 'బాక్స్ శ్వాస లేదా 4-7-8 కోసం యానిమేటెడ్ మార్గదర్శి — వృత్తం మీరు ఎంచుకున్న లెక్కలకు విస్తరిస్తుంది మరియు కుంచించుకుపోతుంది.' },
        { title: 'అభ్యాస చరిత్ర', desc: 'వ్యవధి మరియు రకంతో లాగ్ చేయబడిన సెషన్‌లు; మీ స్థిరత్వం యొక్క ప్రశాంత క్యాలెండర్ వ్యూ, మీపై అరిచే బ్యాడ్జ్‌లు లేవు.' },
        { title: 'మీ అభ్యాసాలు, జాబితా చేయబడ్డాయి', desc: 'నిశ్శబ్ద కూర్చోవడం, శరీర స్కాన్, నడక ధ్యానం — మీ స్వంత అభ్యాస మెనూ, ప్రతి ఒక్కటి దాని స్వంత డిఫాల్ట్ టైమర్‌తో.' },
      ],
      promptExample: 'ధ్యాన మొబైల్ యాప్‌ను నిర్మించండి: నా అభ్యాసాలను (Silent Sit, Box Breathing, Body Scan) ప్రతి ఒక్కటి డిఫాల్ట్ వ్యవధితో జాబితా చేసే Home స్క్రీన్; కనీస కౌంట్‌డౌన్ టైమర్, ప్రారంభ మరియు ముగింపు గంట, మరియు కూర్చున్న సమయంలో చీకటిగా ఉంచబడిన స్క్రీన్ ఉన్న Session స్క్రీన్; 4-4-4-4 బాక్స్ శ్వాసను నడిపే యానిమేటెడ్ వృత్తంతో Breathing స్క్రీన్; మరియు పూర్తయిన సెషన్‌ల నెలవారీ క్యాలెండర్ ఉన్న History స్క్రీన్. చాలా కనిష్టం, చీకటి, గేమిఫికేషన్ లేదు.',
      faqs: [
        { q: 'ఇది పరిసర శబ్దాలు లేదా గైడెడ్ ఆడియోను ప్లే చేయగలదా?', a: 'అవును — మీ ప్రాంప్ట్‌లో ఆడియో ఎంపికను అడగండి మరియు మీ స్వంత ట్రాక్‌లను జోడించండి; యాప్ వాటిని టైమర్ కింద ప్లే చేస్తుంది.' },
        { q: 'నేను శ్వాస లయను సర్దుబాటు చేయవచ్చా?', a: 'పేసర్ లెక్కలు సెట్టింగ్‌లు — యాప్‌లో 4-4-4-4ని ఏదైనా నమూనాకు మార్చండి, లేదా 4-7-8 వంటి ప్రీసెట్‌లను జోడించమని చాట్‌ను అడగండి.' },
        { q: 'Calmకి సబ్‌స్క్రైబ్ చేయడానికి బదులుగా దీన్ని ఎందుకు నిర్మించాలి?', a: 'మీ అభ్యాసానికి సెలబ్రిటీ స్లీప్ స్టోరీల లైబ్రరీ అవసరమైతే, సబ్‌స్క్రైబ్ చేయండి. దీనికి కేవలం టైమర్, పేసర్, మరియు రికార్డు అవసరమైతే — అది మీరు శాశ్వతంగా కలిగి ఉండే ఒక మధ్యాహ్నపు నిర్మాణం.' },
        { q: 'దీనికి ఖాతా అవసరమా?', a: 'మీ ఇష్టం — దీన్ని పూర్తిగా వ్యక్తిగత సింగిల్-యూజర్ యాప్‌గా నిర్మించండి, లేదా పరికరాలలో మీ చరిత్రను సింక్ చేయాలనుకుంటే తర్వాత లాగిన్‌ను జోడించండి.' },
      ],
    },
    'period-tracker-app': {
      h1: 'AIతో పీరియడ్ ట్రాకర్ యాప్‌ను నిర్మించండి',
      metaTitle: 'AIతో ప్రైవేట్ పీరియడ్ ట్రాకర్ యాప్‌ను నిర్మించండి',
      metaDesc: 'చక్ర అంచనాలు, లక్షణాల లాగింగ్, మరియు చరిత్ర వ్యూ — మీ స్వంత డేటాబేస్‌లో, మీ ఆరోగ్య డేటాను అమ్మే పెద్ద-టెక్ యాప్ కాదు. సాదా ఇంగ్లీష్ నుండి నిర్మించబడింది.',
      tagline: 'మీ డేటాబేస్‌లో ఉండే చక్ర అంచనాలు మరియు లక్షణాల లాగింగ్ — మీ ఆరోగ్య డేటాపై నిర్మించబడిన వ్యాపార నమూనా ఉన్న పెద్ద-టెక్ యాప్ కాదు.',
      body: [
        'పీరియడ్ ట్రాకింగ్ యాప్‌లు నిజమైన అపనమ్మకాన్ని సంపాదించాయి: వినియోగదారులు తమ ఫోన్ నుండి బయటకు వెళ్లడం కనీసం ఇష్టపడని డేటాను — చక్ర తేదీలు, లక్షణాలు, లైంగిక కార్యకలాపం — అనేక ప్రధాన స్రవంతి యాప్‌లు అమ్ముతున్నట్లు లేదా పంచుకుంటున్నట్లు పట్టుబడ్డాయి. ఇంత వ్యక్తిగతమైన దాని కోసం, "ఈ డేటాకు యజమాని ఎవరు" అనేది చిన్న వివరం కాదు, ఇది మొత్తం నిర్ణయం.',
        'మీ స్వంతదాన్ని నిర్మించడం ఆ ప్రమాదాన్ని సున్నాకి కూల్చివేస్తుంది: మీరు చక్రాలను ఎలా లాగ్ చేయాలని మరియు అంచనా వేయాలని కోరుకుంటున్నారో వివరించండి, మరియు WyberAi మీ డేటాపై ఆధారపడిన ఆదాయ నమూనా ఉన్న కంపెనీ ద్వారా ఎలాంటి అనలిటిక్స్ SDK బండిల్ చేయకుండా, మీరు మాత్రమే నియంత్రించే డేటాబేస్‌లో ప్రతిదీ నిల్వ చేసే యాప్‌ను జనరేట్ చేస్తుంది. చక్ర అంచనాలు, లక్షణం మరియు మూడ్ లాగింగ్, మరియు మీరు నిజంగా నమూనాలను గుర్తించడంలో సహాయపడే చరిత్ర వ్యూ — ట్రేడ్‌ఆఫ్ లేకుండా ఫీచర్లు.',
      ],
      features: [
        { title: 'చక్ర లాగింగ్ మరియు అంచనాలు', desc: 'పీరియడ్ ప్రారంభ మరియు ముగింపు తేదీలను లాగ్ చేయండి; యాప్ జనాభా సగటు కాదు, మీ స్వంత చరిత్ర ఆధారంగా మీ తదుపరి చక్రాన్ని అంచనా వేస్తుంది.' },
        { title: 'లక్షణం మరియు మూడ్ ట్రాకింగ్', desc: 'ప్రతి రోజు లక్షణాలు, ప్రవాహ తీవ్రత, మరియు మూడ్‌ను లాగ్ చేయండి — ఉత్పత్తి బృందం మీ కోసం ఎంచుకున్న స్థిర జాబితా కాదు, మీ స్వంత ట్యాగ్‌లు.' },
        { title: 'నిర్మాణం ద్వారా ప్రైవేట్', desc: 'మీ డేటా ఎలాంటి థర్డ్-పార్టీ అనలిటిక్స్ లేదా ప్రకటన SDKలు బండిల్ చేయకుండా మీ స్వంత డేటాబేస్‌లో ఉంటుంది — ఎందుకంటే మీరు ఏదీ నిర్మించలేదు.' },
        { title: 'చరిత్ర మరియు నమూనాలు', desc: 'గత చక్రాలలో క్యాలెండర్ వ్యూ, తద్వారా నమూనాలు — క్రమరహిత సమయం, లక్షణ సమూహాలు — ఈ చక్రంలో మాత్రమే కాకుండా నెలల్లో కనిపిస్తాయి.' },
      ],
      promptExample: 'పీరియడ్ ట్రాకర్ మొబైల్ యాప్‌ను నిర్మించండి: ఏ రోజైనా పీరియడ్ ప్రారంభ/ముగింపు తేదీలు, ప్రవాహ తీవ్రత, లక్షణాలు (తిమ్మిర్లు, తలనొప్పి, అలసట), మరియు మూడ్‌ను రికార్డ్ చేసే Log స్క్రీన్; గత చక్రాలు మరియు సగటు చక్ర పొడవు ఆధారంగా అంచనా వేయబడిన తదుపరి ప్రారంభ తేదీని చూపే Calendar స్క్రీన్; మరియు గత 6 నెలల్లో చక్ర పొడవు మరియు అత్యంత సాధారణ లక్షణాలలో ధోరణులు ఉన్న History స్క్రీన్. సరళమైన, ప్రైవేట్, సామాజిక ఫీచర్లు లేవు.',
      faqs: [
        { q: 'నా డేటా నిజంగా ప్రైవేట్‌గా ఉందా?', a: 'ఇది మీ స్వంత యాప్ యొక్క డేటాబేస్‌లో నిల్వ చేయబడుతుంది, మీరు స్పష్టంగా అడగకపోతే ఎలాంటి అనలిటిక్స్ లేదా ట్రాకింగ్ SDKలు లేకుండా జనరేట్ చేయబడింది — అమ్మడానికి ఏమీ లేదు ఎందుకంటే ఏ థర్డ్ పార్టీ ఏమీ సేకరించదు.' },
        { q: 'అంచనాలు ఎంత ఖచ్చితమైనవి?', a: 'అంచనాలు మీ స్వంత లాగ్ చేసిన చక్ర చరిత్రపై ఆధారపడి ఉంటాయి — ఎక్కువ చక్రాలు లాగ్ చేయబడితే, సాధారణ 28-రోజుల భావన కంటే సగటు మీ నిజమైన నమూనాను ఎక్కువగా ప్రతిబింబిస్తుంది.' },
        { q: 'నేను నా డేటాను ఎగుమతి చేయవచ్చా?', a: 'మీ ప్రాంప్ట్‌లో CSV ఎగుమతిని అడగండి — మూసివేసిన యాప్ యొక్క గోడల-పరిమిత రికార్డుల వలె కాకుండా, మీ చరిత్ర మీతో తీసుకెళ్లడానికి మీది.' },
        { q: 'భాగస్వామి లేదా వైద్యుడు నిర్దిష్ట డేటాను చూడగలరా?', a: 'మీరు వైద్యుడికి నిర్దిష్ట డేటాను అందించాలనుకుంటే షేర్ చేయదగిన సారాంశం లేదా PDF నివేదిక స్క్రీన్‌ను అడగండి — భాగస్వామ్యం పూర్తిగా మీ ఎంపికగానే ఉంటుంది.' },
      ],
    },
    'sleep-tracker-app': {
      h1: 'AIతో స్లీప్ ట్రాకర్ యాప్‌ను నిర్మించండి',
      metaTitle: 'AIతో స్లీప్ ట్రాకర్ యాప్‌ను నిర్మించండి — కోడ్ లేకుండా',
      metaDesc: 'నిద్రపోయే మరియు మేల్కొనే సమయాన్ని లాగ్ చేయండి, మీ నిద్ర లోటును చూడండి, ఒక రాత్రిని ఏమి పాడు చేస్తుందో గుర్తించండి — సాదా ఇంగ్లీష్ నుండి జనరేట్ చేయబడిన స్లీప్ ట్రాకర్, ధరించదగిన పరికరం అవసరం లేదు.',
      tagline: 'రాత్రిని లాగ్ చేయండి, లోటు పెరగడాన్ని చూడండి, ఆలస్యంగా తాగిన కాఫీయే బుధవారాలు భయంకరంగా అనిపించడానికి నిజమైన కారణమని గుర్తించండి.',
      body: [
        'మీరు అలసిపోయారని గమనించడానికి మీకు $300 రింగ్ అవసరం లేదు — మీకు నిజంగా ఎప్పుడు నిద్రపోయారు మరియు మేల్కొన్నారు అనే నిజాయితీ రికార్డు అవసరం, మీకు అవసరమని మీకు తెలిసిన దానితో పోల్చబడింది. ధరించదగిన-లింక్డ్ యాప్‌లు ఈ సాధారణ వాస్తవాన్ని సందేహాస్పద ఖచ్చితత్వం గల వినియోగదారు సెన్సార్‌లతో కొలిచిన స్కోర్‌లు మరియు దశలలో మునిగిపోయేలా చేస్తాయి.',
        'లాగ్ చేయబడిన స్లీప్ ట్రాకర్ సెన్సార్‌ను పూర్తిగా దాటవేస్తుంది: మీరు రాత్రులను ఎలా రికార్డ్ చేయాలనుకుంటున్నారో WyberAiకి చెప్పండి — నిద్రపోయే సమయం, మేల్కొనే సమయం, మీరు ఎంత విశ్రాంతిగా భావించారు — మరియు ఇది ఆ అలవాటు చుట్టూ యాప్‌ను నిర్మిస్తుంది. వారపు చార్ట్ నమూనాను చూపుతుంది, నడుస్తున్న నిద్ర-లోటు సంఖ్య లోటును నిర్దిష్టంగా చేస్తుంది, మరియు ఐచ్ఛిక గమనికలు (ఆలస్యంగా కాఫీ, ఒత్తిడితో కూడిన రోజు, రాత్రి పానీయం) మీ మణికట్టుపై పరికరం అవసరం లేకుండా మీకు ఇప్పటికే అనుమానం ఉన్నదాన్ని చెప్పకుండానే మగత ఉదయాలతో కారణాన్ని పరస్పరం అనుసంధానించడానికి మిమ్మల్ని అనుమతిస్తాయి.',
      ],
      features: [
        { title: 'నిద్రపోయే మరియు మేల్కొనే లాగింగ్', desc: 'మీరు ఎప్పుడు నిద్రపోయారు మరియు మేల్కొన్నారు అనే త్వరిత రాత్రి ఎంట్రీ — నిజంగా ముఖ్యమైన రెండు సంఖ్యలు.' },
        { title: 'నిద్ర వ్యవధి చార్ట్', desc: 'ప్రతి-రాత్రి నిద్రించిన గంటల వారపు వ్యూ, తద్వారా చెడు స్ట్రీక్ కేవలం అనుభూతి చెందడం కాకుండా కనిపిస్తుంది.' },
        { title: 'నిద్ర లోటు ట్రాకర్', desc: 'ప్రతి-రాత్రి మీ లక్ష్య గంటలకు వ్యతిరేకంగా నడుస్తున్న మొత్తం — గురువారం సోమవారం కంటే ఎందుకు అధ్వాన్నంగా అనిపిస్తుందో వివరించే సంఖ్య.' },
        { title: 'సహసంబంధ గమనికలు', desc: 'కెఫిన్, స్క్రీన్ సమయం, లేదా ఒత్తిడితో రాత్రులను ట్యాగ్ చేయండి మరియు మీ చెత్తగా-రేట్ చేయబడిన ఉదయాలతో ఏ ట్యాగ్‌లు సమూహమవుతాయో చూడండి.' },
      ],
      promptExample: 'స్లీప్ ట్రాకర్ మొబైల్ యాప్‌ను నిర్మించండి: ప్రతి ఉదయం నిద్రపోయే సమయం, మేల్కొనే సమయం, మరియు 1-5 విశ్రాంతి రేటింగ్‌ను, ఐచ్ఛిక ట్యాగ్‌లతో (మధ్యాహ్నం 3 తర్వాత కెఫిన్, ఆలస్యంగా స్క్రీన్ సమయం, ఒత్తిడితో కూడిన రోజు) నమోదు చేసే Log స్క్రీన్; నేను సెట్ చేసిన లక్ష్యానికి వ్యతిరేకంగా ప్రతి-రాత్రి నిద్రించిన గంటల బార్ చార్ట్ ఉన్న Weekly స్క్రీన్; మరియు గత 30 రోజులలో లక్ష్యానికి వ్యతిరేకంగా నా నడుస్తున్న నిద్ర లోటు లేదా మిగులును చూపే Debt స్క్రీన్.',
      faqs: [
        { q: 'దీనికి ధరించదగిన పరికరం లేదా ఫోన్ సెన్సార్ అవసరమా?', a: 'లేదు — ఇది మాన్యువల్ లాగ్, ఇది రోజుకు పది సెకన్లు పడుతుంది మరియు వినియోగదారు నిద్ర-సెన్సింగ్ హార్డ్‌వేర్ యొక్క ఖచ్చితత్వ సమస్యలను నివారిస్తుంది.' },
        { q: 'ఇది చెడు నిద్రతో ఏమి సహసంబంధం కలిగి ఉందో చూపగలదా?', a: 'మీకు ముఖ్యమని అనుమానం ఉన్న దేనితోనైనా రాత్రులను ట్యాగ్ చేయండి — కెఫిన్, స్క్రీన్ సమయం, ఒత్తిడి — మరియు సహసంబంధ వ్యూ ట్యాగ్ ద్వారా మీ విశ్రాంతి-రేటింగ్‌ను సమూహపరచగలదు.' },
        { q: 'నేను వ్యక్తిగత నిద్ర లక్ష్యాన్ని సెట్ చేయవచ్చా?', a: 'అవును — సెట్టింగ్‌లలో ప్రతి-రాత్రి మీ లక్ష్య గంటలను సెట్ చేయండి మరియు లోటు ట్రాకర్ ఆ సంఖ్యకు వ్యతిరేకంగా లెక్కిస్తుంది, సాధారణ సిఫార్సుకు కాదు.' },
        { q: 'ఇది నిద్రపోయే ముందు నాకు లాగ్ చేయమని గుర్తు చేస్తుందా?', a: 'మీ ప్రాంప్ట్‌లో రాత్రి రిమైండర్ నోటిఫికేషన్‌ను అడగండి — మీరు సెట్ చేసిన సమయంలో సాధారణ పుష్.' },
      ],
    },
  },
  ta: {
    'workout-tracker-app': {
      h1: 'AI மூலம் ஒர்க்அவுட் டிராக்கர் ஆப்-ஐ உருவாக்குங்கள்',
      metaTitle: 'AI மூலம் ஒர்க்அவுட் டிராக்கர் ஆப்-ஐ உருவாக்குங்கள் — கோட் இல்லாமல்',
      metaDesc: 'உங்கள் திட்டத்திற்குப் பொருந்தும் ஜிம் பதிவு: பயிற்சிகள், செட்கள், முன்னேற்ற ஓவர்லோட் விளக்கப்படங்கள். ஆங்கிலத்தில் விவரியுங்கள், நிமிடங்களில் வேலை செய்யும் மொபைல் ஆப்பைப் பெறுங்கள்.',
      tagline: 'செட்களுக்கு இடையில் செட்களைப் பதிவு செய்யுங்கள். ஓவர்லோட் வளைவைப் பாருங்கள். உங்கள் திட்டத்தைச் சுற்றி கட்டமைக்கப்பட்டது — புஷ்/புல்/லெக்ஸ், 5×5, அல்லது உங்கள் பயிற்சியாளரின் ஸ்ப்ரெட்ஷீட்.',
      body: [
        'ஒர்க்அவுட் பதிவுக்கு ஒரே ஒரு வேலை உள்ளது: ஓய்வு டைமர் முடிவதற்குள் நீங்கள் இப்போது செய்த செட்டைப் பிடிக்கவும், அடுத்த வாரம் பார் மேலே நகர்கிறது என்று நிரூபிக்கவும். கடையில் வாங்கிய ஃபிட்னெஸ் ஆப்கள் இதை சமூக ஊட்டங்கள், பயிற்சி விற்பனைகள், மற்றும் சந்தாக்களில் சுற்றுகின்றன — உங்கள் உண்மையான திட்டம் ஒரு பயிற்சியாளர் கொடுத்த ஸ்ப்ரெட்ஷீட்டில் இருக்கலாம்.',
        'WyberAi அந்த ஸ்ப்ரெட்ஷீட்டை ஒரு ஆப்பாக மாற்றுகிறது. உங்கள் ஸ்ப்லிட் மற்றும் ஒவ்வொரு-செட்டுக்கும் நீங்கள் என்ன பதிவு செய்கிறீர்கள் என்பதை விவரியுங்கள், அது மொபைல் ஆப்பை உருவாக்குகிறது: உங்கள் திட்டமிடப்பட்ட பயிற்சிகளுடன் இன்றைய-ஒர்க்அவுட் திரை, ஒவ்வொரு உள்ளீட்டின் அருகில் காட்டப்படும் முந்தைய-அமர்வு எண்களுடன் வேகமான செட் பதிவு, மற்றும் ஸ்குவாட் அளவு உண்மையில் அதிகரிக்கிறதா என்பதைக் காட்டும் ஒவ்வொரு-பயிற்சி விளக்கப்படங்கள். இது மென்பொருளாக உங்கள் திட்டம், உங்கள் திட்டம் நுழைக்கப்பட்ட வேறொருவரின் ஆப் அல்ல.',
      ],
      features: [
        { title: 'உங்கள் ஸ்ப்லிட், திட்டமிடப்பட்டது', desc: 'புஷ்/புல்/லெக்ஸ், மேல்/கீழ், 5×5 — உங்கள் வழக்கத்திலிருந்து உருவாக்கப்பட்ட ஒர்க்அவுட் நாட்கள், ஒவ்வொன்றும் அதன் பயிற்சி பட்டியலுடன்.' },
        { title: 'ஓய்வு-டைமர்-வேக பதிவு', desc: 'ஒவ்வொரு உள்ளீட்டுடனும் இன்லைனாகக் காட்டப்படும் கடைசி அமர்வு எண்களுடன் ஒவ்வொரு-செட் எடை மற்றும் ரெப்ஸ் — பாரை ரேக் செய்ய எடுக்கும் நேரத்தில் ஒரு செட்டைப் பதிவு செய்யுங்கள்.' },
        { title: 'முன்னேற்ற ஓவர்லோட் விளக்கப்படங்கள்', desc: 'காலப்போக்கில் டாப் செட் மற்றும் மொத்த அளவின் ஒவ்வொரு-பயிற்சி விளக்கப்படங்கள் — திட்டம் வேலை செய்கிறது என்பதற்கான ஆதாரம்.' },
        { title: 'PR கண்காணிப்பு', desc: 'உங்கள் பதிவுகளிலிருந்து கண்டறியப்பட்ட தனிப்பட்ட சாதனைகள், ஒவ்வொரு-லிஃப்ட்டிற்கும் ஒரு சாதனைகள் திரையில் கொண்டாடப்படுகின்றன.' },
      ],
      promptExample: 'புஷ்/புல்/லெக்ஸ் திட்டத்திற்கான ஒர்க்அவுட் டிராக்கர் மொபைல் ஆப்பை உருவாக்குங்கள்: ஒவ்வொரு உள்ளீட்டின் அருகில் கடைசி அமர்வு எண்கள் காட்டப்பட்டு நான் ஒவ்வொரு-செட் எடை மற்றும் ரெப்ஸை பதிவு செய்யும் திட்டமிடப்பட்ட நாளின் பயிற்சிகளைக் காட்டும் Today திரை; காலப்போக்கில் அதிக எடையுள்ள செட்டின் ஒவ்வொரு-பயிற்சி விளக்கப்படம் கொண்ட Progress திரை; மற்றும் ஒவ்வொரு லிஃப்ட்டிற்கும் எனது PRஐ பட்டியலிடும் Records திரை. இருண்ட தீம், பெரிய தொடு இலக்குகள்.',
      faqs: [
        { q: 'இது எனது பயிற்சியாளரின் திட்டத்தைப் பின்பற்ற முடியுமா?', a: 'ஆம் — நாட்கள், பயிற்சிகள், மற்றும் செட்/ரெப் திட்டத்தை விவரியுங்கள் (அல்லது திட்டத்தை சாட்டில் ஒட்டவும்) அந்த சரியான திட்டத்தைச் சுற்றி ஆப் உருவாக்கப்படும்.' },
        { q: 'நான் சுழற்சியின் நடுவில் எனது திட்டத்தை மாற்றலாமா?', a: 'சாட்டில் கேளுங்கள் — "புஷ் நாளில் பென்ச்சுக்கு பதிலாக இன்க்லைன் டம்பெல் ப்ரெஸ் செய்யுங்கள்" — உங்கள் வரலாறு அப்படியே இருக்கும்போது திட்டம் புதுப்பிக்கப்படும்.' },
        { q: 'இது ஜிம்மில் ஆஃப்லைனில் வேலை செய்யுமா?', a: 'உருவாக்கப்பட்ட ஆப் ஒரு நிலையான React Native + Expo திட்டம்; உங்கள் ப்ராம்ப்ட்டில் ஆஃப்லைன்-முதல் பதிவைக் கேளுங்கள், நீங்கள் மீண்டும் ஆன்லைனுக்கு வரும்போது உள்ளீடுகள் ஒத்திசைக்கப்படும்.' },
        { q: 'இது எனது ஃபோனில் எவ்வளவு விரைவாக வரும்?', a: 'உருவாக்குவதற்கு நிமிடங்கள் ஆகும், நீங்கள் உடனடியாக Expo மூலம் உங்கள் சொந்த ஃபோனில் முன்னோட்டமிடுகிறீர்கள் — பெரும்பாலான மக்கள் தங்கள் அடுத்த அமர்வை தங்கள் சொந்த ஆப்பில் பதிவு செய்கிறார்கள்.' },
      ],
    },
    'meal-planner-app': {
      h1: 'AI மூலம் உணவு திட்டமிடுபவர் ஆப்-ஐ உருவாக்குங்கள்',
      metaTitle: 'AI மூலம் உணவு திட்டமிடல் ஆப்-ஐ உருவாக்குங்கள் — கோட் இல்லாமல்',
      metaDesc: 'வாராந்திர உணவு திட்டங்கள், ஒரு செய்முறை பெட்டி, மற்றும் தானாக-கட்டமைக்கப்பட்ட மளிகை பட்டியல் — உங்கள் விவரிப்பிலிருந்து உருவாக்கப்பட்ட உணவு திட்டமிடுபவர், உங்கள் குடும்பம் உண்ணும் விதத்திற்கு ஏற்றது.',
      tagline: 'ஞாயிற்றுக்கிழமை வாரத்தைத் திட்டமிடுங்கள், தானாக-கட்டமைக்கப்பட்ட பட்டியலிலிருந்து ஷாப்பிங் செய்யுங்கள், மாலை 6 மணிக்கு "இரவு உணவுக்கு என்ன" என்று கேட்பதை நிறுத்துங்கள்.',
      body: [
        'உணவு திட்டமிடல் ஓரங்களில் தோல்வியடைகிறது: செய்முறைகள் ஸ்க்ரீன்ஷாட்களில் வாழ்கின்றன, திட்டம் உங்கள் தலையில் வாழ்கிறது, மளிகை பட்டியல் ஒவ்வொரு வாரமும் புதிதாக மீண்டும் எழுதப்படுகிறது. திட்டமிடுபவர் ஆப்கள் உள்ளன, ஆனால் அவை தங்கள் செய்முறை பட்டியல்களையும் ஒரு வாரத்தைப் பற்றிய தங்கள் யோசனையையும் தள்ளுகின்றன — முக்கியமான செய்முறைகள் உங்கள் குடும்பம் உண்மையில் உண்ணும் பன்னிரண்டு.',
        'நீங்கள் எப்படி திட்டமிடுகிறீர்கள் என்பதை விவரியுங்கள் — நாளொன்றுக்கு எத்தனை உணவுகள், யார் சைவம், ஷாப்பிங் பயணம் எப்படி இருக்கும் — WyberAi உங்கள் சமையலறையைச் சுற்றி திட்டமிடுபவரை உருவாக்குகிறது: நீங்கள் ஒருமுறை நிரப்பும் செய்முறை பெட்டி, ஒரு இழுத்து-ஒன்றிணைக்கும் வாராந்திர கட்டம், மற்றும் வாரத்தின் பொருட்களிலிருந்து தானாகவே தொகுக்கப்படும், தெருவாரியாக தொகுக்கப்பட்ட மளிகை பட்டியல். தயாரிப்பு-நாள் சமையல், மேக்ரோ இலக்குகள், அல்லது ஒரு தேர்ந்தெடுக்கும்-குழந்தை நெடுவரிசை — இது உங்கள் ஆப், எனவே திட்டம் குடும்பத்திற்கு வளைகிறது.',
      ],
      features: [
        { title: 'உங்கள் செய்முறை பெட்டி', desc: 'பொருட்கள், பரிமாறல்கள், மற்றும் குறிச்சொற்களுடன் உங்கள் உணவுகள் — நீங்கள் சுழற்றும் டஜன் கணக்கான உணவுகள், உங்களிடம் இல்லாத 40,000 தரவுத்தளம் அல்ல.' },
        { title: 'வாராந்திர திட்டமிடல் கட்டம்', desc: 'வரவிருக்கும் வாரத்தின் நாட்கள் மற்றும் உணவுகளுக்கு செய்முறைகளை ஒதுக்குங்கள்; நல்ல வாரமாக இருந்தால் ஒரே தட்டலில் கடந்த வாரத்தை மீண்டும் செய்யுங்கள்.' },
        { title: 'தானாக-தொகுக்கப்பட்ட மளிகை பட்டியல்', desc: 'திட்டமிடப்பட்ட வாரத்தின் பொருட்கள் ஒரு பட்டியலில் இணைக்கப்பட்டுள்ளன — அளவுகள் கூட்டப்பட்டு, தெருவாரியாக தொகுக்கப்பட்டு, கடையில் சரிபார்க்கக்கூடியவை.' },
        { title: 'குடும்ப விருப்பத்தேர்வுகள்', desc: 'உணவு குறிச்சொற்கள் மற்றும் ஒவ்வொரு-நபர் விதிகள் (திங்கள்கிழமைகள் சைவம், குழந்தைகளுக்கு காளான் இல்லை) திட்ட காட்சியில் மதிக்கப்படுகின்றன.' },
      ],
      promptExample: 'உணவு திட்டமிடுபவர் வெப் ஆப்பை உருவாக்குங்கள்: நான் பொருட்கள் (பெயர், அளவு, அலகு), பரிமாறல்கள், மற்றும் சைவம் அல்லது விரைவு போன்ற குறிச்சொற்களுடன் உணவுகளைச் சேர்க்கும் Recipes பக்கம்; நான் செய்முறைகளை ஒதுக்கும் மதிய உணவு மற்றும் இரவு உணவுக்கான திங்கள்-முதல்-ஞாயிறு கட்டம் கொண்ட Planner பக்கம்; மற்றும் திட்டமிடப்பட்ட வாரத்தின் அனைத்து பொருட்களையும் தொகுக்கும், அளவுகளைக் கூட்டும், வகை வாரியாக தொகுக்கும், ஷாப்பிங் செய்யும்போது பொருட்களை சரிபார்க்க அனுமதிக்கும் Grocery List பக்கம்.',
      faqs: [
        { q: 'இது வெவ்வேறு பரிமாறல் எண்ணிக்கைகளுக்கு செய்முறைகளை அளவிட முடியுமா?', a: 'ஆம் — ஒவ்வொரு திட்டமிடப்பட்ட உணவுக்கும் பரிமாறல்களை அமைக்கவும், அவை மளிகை பட்டியலுக்கு வருவதற்கு முன் பொருள் அளவுகள் அளவிடப்படும்.' },
        { q: 'எனது துணையும் நானும் ஒரே திட்டமிடுபவரைப் பகிரலாமா?', a: 'ஆம் — இது லாகின்கள் கொண்ட ஒரு வெப் ஆப், எனவே முழு குடும்பமும் ஒரு திட்டத்தையும் ஒரு பட்டியலையும் நேரலையில் புதுப்பிக்கப்பட்டதைப் பார்க்கிறது.' },
        { q: 'இது கலோரிகள் அல்லது மேக்ரோக்களைக் கண்காணிக்க முடியுமா?', a: 'உங்கள் ப்ராம்ப்ட்டில் (அல்லது பின்னர் சாட்டில்) ஒவ்வொரு-பொருள் அல்லது ஒவ்வொரு-செய்முறை மேக்ரோ புலங்களைச் சேர்க்கவும், திட்டமிடுபவர் இலக்குகளுக்கு எதிராக தினசரி மொத்தங்களைக் காட்டலாம்.' },
        { q: 'நான் ஏதாவது கோட் செய்ய வேண்டுமா?', a: 'இல்லை — நீங்கள் திட்டமிடுபவரை விவரிக்கிறீர்கள், WyberAi வேலை செய்யும் ஆப்பை உருவாக்குகிறது, மேலும் மாற்றங்கள் சாட்டில் சாதாரண-ஆங்கில கோரிக்கைகள்.' },
      ],
    },
    'meditation-app': {
      h1: 'AI மூலம் தியான ஆப்-ஐ உருவாக்குங்கள்',
      metaTitle: 'AI மூலம் தியானம் & மைண்ட்ஃபுல்னெஸ் ஆப்-ஐ உருவாக்குங்கள்',
      metaDesc: 'தனிப்பட்ட மைண்ட்ஃபுல்னெஸ் ஆப் — அமர்வு டைமர், சுவாச வழிகாட்டிகள், மற்றும் அமைதியான தொடர்ச்சி — சாதாரண ஆங்கிலத்திலிருந்து உருவாக்கப்பட்டது. உங்களுடையது, எந்த சந்தாவும் இணைக்கப்படவில்லை.',
      tagline: 'ஒரு டைமர், ஒரு சுவாச வழிகாட்டி, மற்றும் உங்கள் பயிற்சியின் அமைதியான பதிவு — உங்களுக்கும் பத்து நிமிட மௌனத்திற்கும் இடையில் $70/வருடம் சந்தா இல்லாமல்.',
      body: [
        'மைண்ட்ஃபுல்னெஸ் ஆப்களின் விசித்திரமான பொருளாதாரம்: நீங்கள் பெரும்பாலும் ஒரு டைமர், சில மணிகள், மற்றும் ஒரு தொடர்ச்சி கவுன்டருக்காக வருடாந்திர சந்தா செலுத்துகிறீர்கள் — பின்னர் ஆப் தூக்க கதைகளை விற்க உங்கள் அமைதிக்கு இடையூறு செய்கிறது. தனிப்பட்ட தியான ஆப் அதைத் தலைகீழாக்குகிறது: நீங்கள் செய்யும் பயிற்சி சரியாக, நீங்கள் அங்கு வைக்காத எதுவும் திரையில் இல்லை.',
        'நீங்கள் எப்படி பயிற்சி செய்கிறீர்கள் என்று WyberAiக்குச் சொல்லுங்கள் — நேரம் நிர்ணயிக்கப்பட்ட மௌன அமர்வுகள், பாக்ஸ் சுவாசம், காலை உடல் ஸ்கேன் — அது அதைச் சுற்றி ஒரு React Native ஆப்பை உருவாக்குகிறது: மென்மையான தொடக்க மற்றும் முடிவு மணிகளுடன் ஒரு அமர்வு டைமர், உங்கள் எண்ணிக்கைக்கு அமைக்கப்பட்ட அனிமேட்டட் சுவாச பேசர், மற்றும் கேமிஃபை செய்யாமல் உங்கள் பயிற்சி வளர்வதைக் காட்டும் வரலாறு. குறைவே அம்சமாக இருக்கும் அரிதான ஆப் வகை இது, அதை சொந்தமாக்கிக்கொள்வதே நீங்கள் குறைவைப் பெறும் வழி.',
      ],
      features: [
        { title: 'மணிகளுடன் அமர்வு டைமர்', desc: 'ஒரு கால அளவைத் தேர்ந்தெடுக்கவும், தொடக்க/முடிவு மணிகள் மற்றும் விருப்ப இடைவெளி குறிகாட்டிகளைப் பெறுங்கள் — நடுவில் திரை இருட்டாக இருக்கும்.' },
        { title: 'சுவாச பேசர்', desc: 'பாக்ஸ் சுவாசம் அல்லது 4-7-8 க்கான அனிமேட்டட் வழிகாட்டி — வட்டம் உங்கள் தேர்ந்தெடுக்கப்பட்ட எண்ணிக்கைகளுக்கு விரிவடைந்து சுருங்குகிறது.' },
        { title: 'பயிற்சி வரலாறு', desc: 'கால அளவு மற்றும் வகையுடன் பதிவு செய்யப்பட்ட அமர்வுகள்; உங்கள் நிலைத்தன்மையின் அமைதியான நாட்காட்டி காட்சி, உங்கள் மீது கத்தும் பேட்ஜ்கள் இல்லை.' },
        { title: 'உங்கள் பயிற்சிகள், பட்டியலிடப்பட்டவை', desc: 'மௌன அமர்வு, உடல் ஸ்கேன், நடை தியானம் — உங்கள் சொந்த பயிற்சி மெனு, ஒவ்வொன்றும் அதன் சொந்த இயல்பான டைமருடன்.' },
      ],
      promptExample: 'தியான மொபைல் ஆப்பை உருவாக்குங்கள்: எனது பயிற்சிகளை (Silent Sit, Box Breathing, Body Scan) ஒவ்வொன்றும் இயல்பான கால அளவுடன் பட்டியலிடும் Home திரை; ஒரு குறைந்தபட்ச கவுன்ட்டவுன் டைமர், தொடக்க மற்றும் முடிவு மணி, அமர்வின் போது திரை இருட்டாக வைக்கப்படும் Session திரை; 4-4-4-4 பாக்ஸ் சுவாசத்தை வேகப்படுத்தும் அனிமேட்டட் வட்டம் கொண்ட Breathing திரை; மற்றும் முடிக்கப்பட்ட அமர்வுகளின் மாதாந்திர நாட்காட்டி கொண்ட History திரை. மிகவும் குறைந்தபட்சம், இருள், கேமிஃபிகேஷன் இல்லை.',
      faqs: [
        { q: 'இது சுற்றுப்புற ஒலிகள் அல்லது வழிகாட்டப்பட்ட ஆடியோவை இயக்க முடியுமா?', a: 'ஆம் — உங்கள் ப்ராம்ப்ட்டில் ஆடியோ விருப்பத்தைக் கேளுங்கள், உங்கள் சொந்த டிராக்குகளைச் சேர்க்கவும்; ஆப் அவற்றை டைமருக்குக் கீழே இயக்குகிறது.' },
        { q: 'நான் சுவாச தாளத்தை சரிசெய்யலாமா?', a: 'பேசர் எண்ணிக்கைகள் அமைப்புகள் — ஆப்பில் 4-4-4-4 ஐ எந்த வடிவத்திற்கும் மாற்றவும், அல்லது 4-7-8 போன்ற ப்ரீசெட்களைச் சேர்க்க சாட்டைக் கேளுங்கள்.' },
        { q: 'Calm-க்கு சந்தா செலுத்துவதற்குப் பதிலாக இதை ஏன் உருவாக்க வேண்டும்?', a: 'உங்கள் பயிற்சிக்கு பிரபல தூக்க கதைகளின் நூலகம் தேவைப்பட்டால், சந்தா செலுத்துங்கள். அதற்கு ஒரு டைமர், ஒரு பேசர், மற்றும் ஒரு பதிவு மட்டுமே தேவைப்பட்டால் — அது நீங்கள் என்றென்றும் சொந்தமாக்கிக்கொள்ளும் ஒரு பிற்பகல் கட்டுமானம்.' },
        { q: 'இதற்கு ஒரு கணக்கு தேவையா?', a: 'உங்கள் விருப்பம் — இதை முற்றிலும் தனிப்பட்ட ஒரே-பயனர் ஆப்பாக உருவாக்குங்கள், அல்லது சாதனங்களில் உங்கள் வரலாற்றை ஒத்திசைக்க விரும்பினால் பின்னர் லாகினைச் சேர்க்கவும்.' },
      ],
    },
    'period-tracker-app': {
      h1: 'AI மூலம் மாதவிடாய் டிராக்கர் ஆப்-ஐ உருவாக்குங்கள்',
      metaTitle: 'AI மூலம் தனிப்பட்ட மாதவிடாய் டிராக்கர் ஆப்-ஐ உருவாக்குங்கள்',
      metaDesc: 'சுழற்சி கணிப்புகள், அறிகுறி பதிவு, மற்றும் வரலாறு காட்சி — உங்கள் சொந்த தரவுத்தளத்தில், உங்கள் ஆரோக்கிய தரவை விற்கும் பெரிய-டெக் ஆப் அல்ல. சாதாரண ஆங்கிலத்திலிருந்து கட்டமைக்கப்பட்டது.',
      tagline: 'உங்கள் தரவுத்தளத்தில் வாழும் சுழற்சி கணிப்புகள் மற்றும் அறிகுறி பதிவு — உங்கள் ஆரோக்கிய தரவின் மீது கட்டமைக்கப்பட்ட வணிக மாதிரி கொண்ட பெரிய-டெக் ஆப் அல்ல.',
      body: [
        'மாதவிடாய் கண்காணிப்பு ஆப்கள் உண்மையான அவநம்பிக்கையைப் பெற்றுள்ளன: பயனர்கள் தங்கள் ஃபோனில் இருந்து வெளியேறுவதை குறைவாக விரும்பும் தரவை — சுழற்சி தேதிகள், அறிகுறிகள், பாலியல் செயல்பாடு — பல முக்கிய ஆப்கள் விற்பது அல்லது பகிர்வது கண்டுபிடிக்கப்பட்டுள்ளன. இவ்வளவு தனிப்பட்ட ஒன்றுக்கு, "இந்த தரவின் உரிமையாளர் யார்" என்பது ஒரு சிறிய விவரம் அல்ல, அது முழு முடிவும்.',
        'உங்கள் சொந்தமாக உருவாக்குவது அந்த ஆபத்தை பூஜ்ஜியமாக சரிக்கிறது: நீங்கள் சுழற்சிகளை எப்படி பதிவு செய்து கணிக்க விரும்புகிறீர்கள் என்பதை விவரியுங்கள், WyberAi உங்கள் தரவை நம்பியிருக்கும் வருவாய் மாடலைக் கொண்ட ஒரு நிறுவனத்தால் எந்த அனலிட்டிக்ஸ் SDK-ம் இணைக்கப்படாமல், நீங்கள் மட்டுமே கட்டுப்படுத்தும் தரவுத்தளத்தில் அனைத்தையும் சேமிக்கும் ஆப்பை உருவாக்குகிறது. சுழற்சி கணிப்புகள், அறிகுறி மற்றும் மனநிலை பதிவு, மற்றும் நீங்கள் உண்மையில் வடிவங்களைக் கண்டறிய உதவும் வரலாறு காட்சி — சமரசம் இல்லாமல் அம்சங்கள்.',
      ],
      features: [
        { title: 'சுழற்சி பதிவு மற்றும் கணிப்புகள்', desc: 'மாதவிடாய் தொடக்க மற்றும் முடிவு தேதிகளைப் பதிவு செய்யுங்கள்; ஆப் மக்கள்தொகை சராசரி அல்ல, உங்கள் சொந்த வரலாற்றின் அடிப்படையில் உங்கள் அடுத்த சுழற்சியை கணிக்கிறது.' },
        { title: 'அறிகுறி மற்றும் மனநிலை கண்காணிப்பு', desc: 'ஒவ்வொரு நாளும் அறிகுறிகள், ஓட்ட தீவிரம், மற்றும் மனநிலையைப் பதிவு செய்யுங்கள் — தயாரிப்பு குழு உங்களுக்காக தேர்ந்தெடுத்த நிலையான பட்டியல் அல்ல, உங்கள் சொந்த குறிச்சொற்கள்.' },
        { title: 'கட்டமைப்பால் தனிப்பட்டது', desc: 'உங்கள் தரவு எந்த மூன்றாம்-தரப்பு அனலிட்டிக்ஸ் அல்லது விளம்பர SDKகள் இல்லாமல் உங்கள் சொந்த தரவுத்தளத்தில் வாழ்கிறது — ஏனெனில் நீங்கள் எதையும் உருவாக்கவில்லை.' },
        { title: 'வரலாறு மற்றும் வடிவங்கள்', desc: 'கடந்த சுழற்சிகள் முழுவதும் ஒரு நாட்காட்டி காட்சி, இதனால் வடிவங்கள் — ஒழுங்கற்ற நேரம், அறிகுறி கொத்துகள் — இந்த சுழற்சியில் மட்டுமல்ல, மாதங்களில் தெரியும்.' },
      ],
      promptExample: 'மாதவிடாய் டிராக்கர் மொபைல் ஆப்பை உருவாக்குங்கள்: எந்த நாளுக்கும் மாதவிடாய் தொடக்க/முடிவு தேதிகள், ஓட்ட தீவிரம், அறிகுறிகள் (பிடிப்புகள், தலைவலி, சோர்வு), மற்றும் மனநிலையைப் பதிவு செய்யும் Log திரை; கடந்த சுழற்சிகள் மற்றும் சராசரி சுழற்சி நீளத்தின் அடிப்படையில் கணிக்கப்பட்ட அடுத்த தொடக்க தேதியைக் காட்டும் Calendar திரை; மற்றும் கடந்த 6 மாதங்களில் சுழற்சி நீளம் மற்றும் மிகவும் பொதுவான அறிகுறிகளில் போக்குகள் கொண்ட History திரை. எளிய, தனிப்பட்ட, சமூக அம்சங்கள் இல்லை.',
      faqs: [
        { q: 'எனது தரவு உண்மையிலேயே தனிப்பட்டதா?', a: 'இது உங்கள் சொந்த ஆப்பின் தரவுத்தளத்தில் சேமிக்கப்படுகிறது, நீங்கள் வெளிப்படையாகக் கேட்காத வரை எந்த அனலிட்டிக்ஸ் அல்லது கண்காணிப்பு SDKகள் இல்லாமல் உருவாக்கப்பட்டது — விற்பதற்கு எதுவும் இல்லை ஏனெனில் எந்த மூன்றாம் தரப்பினரும் எதையும் சேகரிக்கவில்லை.' },
        { q: 'கணிப்புகள் எவ்வளவு துல்லியமானவை?', a: 'கணிப்புகள் உங்கள் சொந்த பதிவு செய்யப்பட்ட சுழற்சி வரலாற்றை அடிப்படையாகக் கொண்டவை — அதிக சுழற்சிகள் பதிவு செய்யப்படும்போது, பொதுவான 28-நாள் அனுமானத்தை விட சராசரி உங்கள் உண்மையான வடிவத்தை அதிகமாக பிரதிபலிக்கிறது.' },
        { q: 'நான் எனது தரவை ஏற்றுமதி செய்யலாமா?', a: 'உங்கள் ப்ராம்ப்ட்டில் CSV ஏற்றுமதியைக் கேளுங்கள் — மூடிய ஆப்பின் சுவரால் மூடப்பட்ட பதிவுகளைப் போலல்லாமல், உங்கள் வரலாறு உங்களுடன் எடுத்துச் செல்ல உங்களுடையது.' },
        { q: 'ஒரு துணை அல்லது மருத்துவர் குறிப்பிட்ட தரவைப் பார்க்க முடியுமா?', a: 'ஒரு மருத்துவருக்கு குறிப்பிட்ட தரவை வழங்க விரும்பினால் பகிரக்கூடிய சுருக்கம் அல்லது PDF அறிக்கை திரையைக் கேளுங்கள் — பகிர்வு முழுவதுமாக உங்கள் தேர்வாகவே இருக்கும்.' },
      ],
    },
    'sleep-tracker-app': {
      h1: 'AI மூலம் தூக்க டிராக்கர் ஆப்-ஐ உருவாக்குங்கள்',
      metaTitle: 'AI மூலம் தூக்க டிராக்கர் ஆப்-ஐ உருவாக்குங்கள் — கோட் இல்லாமல்',
      metaDesc: 'படுக்கை நேரம் மற்றும் விழிப்பு நேரத்தைப் பதிவு செய்யுங்கள், உங்கள் தூக்கக் கடனைப் பாருங்கள், ஒரு இரவை என்ன அழிக்கிறது என்று கண்டறியுங்கள் — சாதாரண ஆங்கிலத்திலிருந்து உருவாக்கப்பட்ட தூக்க டிராக்கர், அணியக்கூடிய சாதனம் தேவையில்லை.',
      tagline: 'இரவைப் பதிவு செய்யுங்கள், கடன் கூடுவதைப் பாருங்கள், தாமதமான காபியே புதன்கிழமைகள் மோசமாக உணரக் காரணம் என்று கண்டறியுங்கள்.',
      body: [
        'நீங்கள் சோர்வாக இருப்பதை கவனிக்க உங்களுக்கு $300 மோதிரம் தேவையில்லை — உங்களுக்குத் தேவை என்று தெரிந்ததோடு ஒப்பிடும்போது நீங்கள் உண்மையில் எப்போது தூங்கினீர்கள் மற்றும் எழுந்தீர்கள் என்பதற்கான நேர்மையான பதிவு உங்களுக்குத் தேவை. அணியக்கூடிய-இணைக்கப்பட்ட ஆப்கள் இந்த எளிய உண்மையை சந்தேகத்திற்குரிய துல்லியம் கொண்ட நுகர்வோர் சென்சார்களால் அளவிடப்பட்ட மதிப்பெண்கள் மற்றும் நிலைகளில் மூழ்கடிக்கின்றன.',
        'ஒரு பதிவு செய்யப்பட்ட தூக்க டிராக்கர் சென்சாரை முழுவதுமாக தவிர்க்கிறது: நீங்கள் இரவுகளை எப்படி பதிவு செய்ய விரும்புகிறீர்கள் என்று WyberAiக்குச் சொல்லுங்கள் — படுக்கை நேரம், விழிப்பு நேரம், நீங்கள் எவ்வளவு ஓய்வெடுத்ததாக உணர்ந்தீர்கள் — அது அந்த பழக்கத்தைச் சுற்றி ஒரு ஆப்பை உருவாக்குகிறது. வாராந்திர விளக்கப்படம் வடிவத்தைக் காட்டுகிறது, நடப்பு தூக்க-கடன் எண் பற்றாக்குறையை உறுதியாக்குகிறது, விருப்ப குறிப்புகள் (தாமதமான காபி, மன அழுத்த நாள், இரவு பானம்) உங்கள் மணிக்கட்டில் ஒரு சாதனம் தேவையில்லாமல் நீங்கள் ஏற்கனவே சந்தேகித்ததை உங்களுக்குச் சொல்லாமல் மந்த காலைகளுடன் காரணத்தை தொடர்பு படுத்த அனுமதிக்கின்றன.',
      ],
      features: [
        { title: 'படுக்கை நேரம் மற்றும் விழிப்பு பதிவு', desc: 'நீங்கள் எப்போது படுக்கைக்குச் சென்றீர்கள் மற்றும் எழுந்தீர்கள் என்பதற்கான விரைவான இரவு உள்ளீடு — உண்மையில் முக்கியமான இரண்டு எண்கள்.' },
        { title: 'தூக்க கால அளவு விளக்கப்படம்', desc: 'ஒரு இரவுக்கு தூங்கிய மணிநேரங்களின் வாராந்திர காட்சி, இதனால் ஒரு மோசமான தொடர்ச்சி உணரப்படுவதற்குப் பதிலாக தெரியும்.' },
        { title: 'தூக்க கடன் டிராக்கர்', desc: 'ஒரு இரவுக்கு உங்கள் இலக்கு மணிநேரங்களுக்கு எதிரான நடப்பு மொத்தம் — வியாழக்கிழமை திங்கள்கிழமையை விட ஏன் மோசமாக உணர்கிறது என்பதை விளக்கும் எண்.' },
        { title: 'தொடர்பு குறிப்புகள்', desc: 'காஃபின், திரை நேரம், அல்லது மன அழுத்தத்துடன் இரவுகளை குறியிடுங்கள், எந்த குறிச்சொற்கள் உங்கள் மோசமாக-மதிப்பிடப்பட்ட காலைகளுடன் கொத்தாக இருக்கின்றன என்று பாருங்கள்.' },
      ],
      promptExample: 'தூக்க டிராக்கர் மொபைல் ஆப்பை உருவாக்குங்கள்: ஒவ்வொரு காலையும் படுக்கை நேரம், விழிப்பு நேரம், மற்றும் 1-5 ஓய்வு மதிப்பீட்டை, விருப்ப குறிச்சொற்களுடன் (மதியம் 3 மணிக்குப் பிறகு காஃபின், தாமதமான திரை நேரம், மன அழுத்த நாள்) உள்ளிடும் Log திரை; நான் அமைத்த இலக்குக்கு எதிராக ஒரு இரவுக்கு தூங்கிய மணிநேரங்களின் பட்டை விளக்கப்படம் கொண்ட Weekly திரை; மற்றும் கடந்த 30 நாட்களில் இலக்குக்கு எதிராக எனது நடப்பு தூக்க கடன் அல்லது உபரியைக் காட்டும் Debt திரை.',
      faqs: [
        { q: 'இதற்கு அணியக்கூடிய சாதனம் அல்லது ஃபோன் சென்சார் தேவையா?', a: 'இல்லை — இது ஒரு கைமுறை பதிவு, இது நாளொன்றுக்கு பத்து வினாடிகள் எடுக்கும், நுகர்வோர் தூக்க-உணரும் வன்பொருளின் துல்லியம் சிக்கல்களைத் தவிர்க்கிறது.' },
        { q: 'இது மோசமான தூக்கத்துடன் என்ன தொடர்பு உள்ளது என்று காட்ட முடியுமா?', a: 'உங்களுக்கு முக்கியம் என்று சந்தேகிக்கும் எதனுடனும் இரவுகளை குறியிடுங்கள் — காஃபின், திரை நேரம், மன அழுத்தம் — ஒரு தொடர்பு காட்சி குறிச்சொல் மூலம் உங்கள் ஓய்வு-மதிப்பீட்டை தொகுக்கலாம்.' },
        { q: 'நான் தனிப்பட்ட தூக்க இலக்கை அமைக்கலாமா?', a: 'ஆம் — அமைப்புகளில் ஒரு இரவுக்கு உங்கள் இலக்கு மணிநேரங்களை அமைக்கவும், கடன் டிராக்கர் அந்த எண்ணுக்கு எதிராக கணக்கிடும், பொதுவான பரிந்துரைக்கு அல்ல.' },
        { q: 'இது படுக்கைக்கு முன் பதிவு செய்ய எனக்கு நினைவூட்டுமா?', a: 'உங்கள் ப்ராம்ப்ட்டில் இரவு நினைவூட்டல் அறிவிப்பைக் கேளுங்கள் — நீங்கள் அமைத்த நேரத்தில் எளிய புஷ்.' },
      ],
    },
  },
}
