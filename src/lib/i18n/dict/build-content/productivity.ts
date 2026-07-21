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
// content for the "productivity" category /build/[slug] pages (English
// source: src/app/build/data/productivity.ts). Proper nouns, brand names,
// and tech terms (WyberAi, React Native, Expo, Postgres, Supabase, CSV,
// Toggl, Trello, Goodreads) are left untranslated across every locale —
// only the surrounding prose is translated. slug/target/category/related
// live on BuildPage itself and aren't duplicated here.
export const PRODUCTIVITY_BUILD_CONTENT: Record<Locale, Record<string, TranslatedBuildPage>> = {
  en: {
    'habit-tracker-app': {
      h1: 'Build a Habit Tracker App with AI',
      metaTitle: 'Build a Habit Tracker App with AI — No Code',
      metaDesc: 'Describe your habit tracker in plain English and get a working mobile app with streaks, daily check-ins, and progress charts. Free to start, no code needed.',
      tagline: 'Streaks, daily check-ins, and a progress view that makes you want to keep the chain going — built from one prompt.',
      body: [
        'Habit apps live or die on friction: if logging a habit takes more than two taps, you stop opening the app by week two. The generic trackers on the app stores solve this with subscriptions and feature bloat. Building your own means the app tracks exactly your habits, your way — a morning-routine checklist, a gym streak, a "no sugar" counter — with nothing else in the way.',
        'Describe the habits you want to track and how you want to see progress, and WyberAi generates a React Native app around that: a today screen for one-tap check-ins, streak logic that survives timezone changes, and a history view that shows the chain. Preview it on your own phone over Expo, then keep tweaking in plain English — "make missed days break the streak only after two misses."',
      ],
      features: [
        { title: 'One-tap daily check-ins', desc: 'A today screen listing each habit with a single toggle — the whole log-your-day flow takes seconds.' },
        { title: 'Streak engine', desc: 'Current streak, best streak, and completion percentage per habit, computed from your check-in history.' },
        { title: 'Progress heatmap', desc: 'A calendar heatmap per habit so the chain is visible — the psychology that makes trackers work.' },
        { title: 'Your habits, your rules', desc: 'Weekday-only habits, quantity goals ("8 glasses of water"), or simple yes/no — described in English, wired into the schema.' },
      ],
      promptExample: 'Build a habit tracker mobile app with a Today screen listing my habits as one-tap toggles, a Stats screen with current streak, best streak and a monthly calendar heatmap per habit, and an Add Habit screen where I can set a name, icon, and schedule (daily or specific weekdays). Keep the design minimal and dark.',
      faqs: [
        { q: 'Can the streak logic handle skipped days or rest days?', a: 'Yes — describe the rule you want ("weekends don\'t break streaks" or "one skip per week is allowed") and the generated logic follows it. You can change the rule later in chat.' },
        { q: 'Does it work on both iPhone and Android?', a: 'The app is generated as React Native + Expo, which runs on both platforms from one codebase. You preview it instantly on your own phone via Expo.' },
        { q: 'Can I add reminders later?', a: 'You can add a reminders screen and schedule structure now, and wire push notifications when you export or publish — the schema is ready for it.' },
        { q: 'What does it cost to build?', a: 'Your first build is covered by the 50 free monthly credits — a full app build costs 30 credits, and small edits cost 2. No card required to start.' },
      ],
    },
    'freelance-time-tracker': {
      h1: 'Build a Time Tracking App for Freelancers with AI',
      metaTitle: 'Build a Freelance Time Tracker with AI — No Code',
      metaDesc: 'Generate a time tracking web app with client projects, billable hours, and invoice-ready summaries — described in plain English, built in minutes.',
      tagline: 'Track hours by client and project, mark what\'s billable, and export invoice-ready totals — without paying a subscription for someone else\'s workflow.',
      body: [
        'Every freelancer eventually hits the same wall: the time trackers built for teams cost per-seat money for features you\'ll never use, and the free tiers cap the one thing you need — history. Meanwhile your actual requirement is simple: which client, which project, how long, is it billable, and a clean total at invoice time.',
        'That one-paragraph spec is enough for WyberAi to build the whole tool: a timer page, a client and project structure in a real Postgres database, and a monthly summary grouped the way your invoices are. Because you own the app, the workflow bends to you — add an hourly-rate field per client, a weekly email summary, or a "mark as invoiced" flag whenever you need it.',
      ],
      features: [
        { title: 'Live timer + manual entries', desc: 'Start a timer or backfill hours after the fact — both land in the same log with client and project attached.' },
        { title: 'Clients → projects → entries', desc: 'A proper relational structure, so totals roll up cleanly by project or by client at any date range.' },
        { title: 'Billable vs. internal split', desc: 'Flag entries as billable; summaries show billable totals separately so invoicing takes one glance.' },
        { title: 'Invoice-ready monthly view', desc: 'Hours grouped by client for any month, with your hourly rate applied — the number that goes on the invoice.' },
      ],
      promptExample: 'Build a time tracking web app for a freelancer: a Timer page with a start/stop timer that saves entries with client, project and notes; a Clients page to manage clients each with an hourly rate and their projects; and a Reports page showing hours and earnings grouped by client for a selected month, with billable and non-billable separated.',
      faqs: [
        { q: 'Can it calculate what I should invoice?', a: 'Yes — give each client an hourly rate and the reports page multiplies billable hours by rate for any date range you pick.' },
        { q: 'Where is my time data stored?', a: 'In your app\'s own Postgres database (Supabase), with row-level security scanned live before you publish — your hours are yours, on your infrastructure.' },
        { q: 'Can I import history from Toggl or a spreadsheet?', a: 'Add a CSV import page by asking for it in chat — describe your export\'s columns and the app maps them into your entries table.' },
        { q: 'Is this really cheaper than a time-tracker subscription?', a: 'You build it once with free monthly credits and it runs as your own app — there\'s no per-month tracker fee, and edits cost 2 credits when you want changes.' },
      ],
    },
    'team-task-manager': {
      h1: 'Build a Team Task Manager with AI',
      metaTitle: 'Build a Team Task Management App with AI',
      metaDesc: 'Create a kanban-style task manager for your team — boards, assignees, due dates, and comments — generated from a plain-English description. Free to start.',
      tagline: 'A kanban board that matches how your team actually works — your columns, your labels, your rules — instead of renting someone else\'s.',
      body: [
        'Small teams are stuck between two bad options: heavyweight project tools priced per seat that the team half-uses, and shared spreadsheets that fall apart the moment two people edit at once. What most five-person teams need fits on a single board — if the board speaks their language.',
        'Tell WyberAi how your team works — the stages work moves through, who needs to see what, what a "done" task requires — and it generates a task manager with that exact shape: a kanban board backed by a real database, per-member assignment, and an activity trail. It ships with authentication and a security scan, so inviting the team is safe from day one.',
      ],
      features: [
        { title: 'Kanban with your columns', desc: 'Backlog → In Progress → Review → Done, or whatever your flow is — the board is generated from your description of it.' },
        { title: 'Assignees and due dates', desc: 'Every task carries an owner and a deadline; a My Tasks view filters the board to what each person owes.' },
        { title: 'Comments on tasks', desc: 'Discussion lives on the task itself, so context stops getting lost in chat threads.' },
        { title: 'Team auth built in', desc: 'Sign-in and membership come wired, with row-level security probed by a live scan before you share the link.' },
      ],
      promptExample: 'Build a team task manager web app: a kanban Board page with columns Backlog, This Week, In Progress, and Done, where tasks have a title, description, assignee, due date, and priority; a My Tasks page showing the signed-in user\'s tasks sorted by due date; and task detail with threaded comments. Include team member management.',
      faqs: [
        { q: 'Can each teammate have their own login?', a: 'Yes — the app generates with authentication included, and a members table controls who can see and edit the board.' },
        { q: 'Can I change the workflow after the team starts using it?', a: 'Yes. Ask in chat — "add a Blocked column" or "require a checklist before Done" — and the board updates without losing existing tasks.' },
        { q: 'How is this different from using Trello?', a: 'It\'s your own app: no per-seat pricing, no feature gates, and the workflow is shaped to your team instead of approximated with labels and power-ups.' },
        { q: 'Is the team\'s data secure?', a: 'Every WyberAi app gets a live database security scan that probes your app the way an attacker would — before publish, with critical leaks blocking the gate.' },
      ],
    },
    'job-application-tracker': {
      h1: 'Build a Job Application Tracker with AI',
      metaTitle: 'Build a Job Application Tracker App with AI',
      metaDesc: 'Track every application, interview stage, and follow-up in one board — a job search tracker generated from plain English, not a messy spreadsheet.',
      tagline: 'Every application, its stage, and when you last heard back — one board instead of a spreadsheet that\'s three tabs behind reality.',
      body: [
        'A serious job search generates more state than a spreadsheet wants to hold: which version of the resume went where, whether that recruiter call was a screen or a real interview, and which of the fourteen "still reviewing candidates" emails you actually need to follow up on this week. The spreadsheet degrades into colored cells only you can interpret.',
        'Describe your search and WyberAi builds the tracker around it: a pipeline board from Applied through Offer, a record per application with the role, contact, and resume version attached, and a follow-up view that surfaces anything gone quiet past your own threshold. It\'s the one system a search this stressful deserves — built in an afternoon, not maintained as a side project.',
      ],
      features: [
        { title: 'Pipeline by stage', desc: 'Applied, Screening, Interview, Offer, Rejected — a kanban board so the whole search is visible at a glance.' },
        { title: 'Per-application record', desc: 'Company, role, resume version, referral contact, and salary range, attached to the card it belongs to.' },
        { title: 'Follow-up radar', desc: 'Applications with no update past a set number of days surface automatically — the ones going cold.' },
        { title: 'Interview notes', desc: 'Log what was asked and how it went right after each round, while it\'s still fresh enough to matter for the next one.' },
      ],
      promptExample: 'Build a job application tracker web app: a Board page with kanban columns Applied, Screening, Interview, Offer, Rejected, where each card shows company, role, and date applied; a card detail view with contact name, resume version used, salary range, and free-text interview notes; and a Follow-ups page listing applications with no status change in the last 10 days.',
      faqs: [
        { q: 'Can it remind me to follow up?', a: 'The Follow-ups view lists anything stale past your threshold every time you open the app; ask chat to add email reminders if you want a push.' },
        { q: 'Can I track which resume version I sent where?', a: 'Yes — attach a resume-version field to each application so you know exactly what a recruiter has seen if they call back in three weeks.' },
        { q: 'Can I see stats on my search?', a: 'Ask for a stats view — response rate, average time in each stage, applications per week — computed from your own data.' },
        { q: 'Is this better than a spreadsheet?', a: 'A spreadsheet doesn\'t warn you when an application goes quiet or hold structured interview notes per round — this tracker does both natively.' },
      ],
    },
    'reading-list-app': {
      h1: 'Build a Reading List App with AI',
      metaTitle: 'Build a Reading List & Book Tracker App with AI',
      metaDesc: 'Track your to-be-read pile, log finished books with ratings, and hit a yearly reading goal — a book tracker built from plain English, yours to keep.',
      tagline: 'The to-be-read pile, what you\'re on now, and the yearly count — without a social feed guilt-tripping your pace.',
      body: [
        'Goodreads solves book tracking by wrapping it in a social network you didn\'t ask for, and most reading-tracker apps solve discovery, not the actual problem: an ever-growing list of books you meant to read, no memory of where you paused the current one, and no honest sense of whether this is a 20-book year or a 50-book year.',
        'Tell WyberAi how you read — physical, ebook, audiobook, or all three — and it builds a tracker shaped to that: a to-be-read shelf you add to on a whim, a currently-reading view with a page or percentage you update in seconds, and a finished shelf with your own rating and a note for future-you. A yearly goal counter turns "I should read more" into a number you can actually see moving.',
      ],
      features: [
        { title: 'To-be-read shelf', desc: 'Add books the moment someone mentions them — title, author, and why you want to read it.' },
        { title: 'Currently reading progress', desc: 'Update page number or percentage as you go; the app shows how far into each book you are.' },
        { title: 'Finished shelf with ratings', desc: 'Your own star rating and a short note per book — the log that actually helps you recommend books later.' },
        { title: 'Yearly reading goal', desc: 'Set a books-per-year target and watch a progress bar fill as finished books land on the shelf.' },
      ],
      promptExample: 'Build a reading list mobile app: a To Be Read screen where I add books with title, author, and format (physical/ebook/audiobook); a Currently Reading screen showing books in progress with a page or percentage slider I update; a Finished screen listing completed books with my star rating and a short note; and a Goal screen showing books finished this year against a target I set.',
      faqs: [
        { q: 'Can it track audiobooks differently from physical books?', a: 'Yes — set format per book, and track progress by percentage or time listened instead of page number for audiobooks.' },
        { q: 'Does it recommend books?', a: 'No — this is a personal tracker, not a discovery feed. It shows your own shelves, not what a marketplace wants you to buy next.' },
        { q: 'Can I organize books by genre or series?', a: 'Add tags or a series field in your prompt, and shelves can filter or group by them.' },
        { q: 'Is my reading data private?', a: 'It\'s your own app on your own database — nothing is shared to a social feed unless you specifically build one in.' },
      ],
    },
  },
  hi: {
    'habit-tracker-app': {
      h1: 'AI से हैबिट ट्रैकर ऐप बनाएं',
      metaTitle: 'AI से हैबिट ट्रैकर ऐप बनाएं — बिना कोड',
      metaDesc: 'अपना हैबिट ट्रैकर सादी अंग्रेज़ी में बताएं और स्ट्रीक्स, डेली चेक-इन्स, और प्रोग्रेस चार्ट्स वाला एक काम करता मोबाइल ऐप पाएं। शुरू करना मुफ़्त, कोई कोड नहीं चाहिए।',
      tagline: 'स्ट्रीक्स, डेली चेक-इन्स, और एक प्रोग्रेस व्यू जो आपको चेन चलती रखने का मन करवाए — एक प्रॉम्प्ट से बना।',
      body: [
        'हैबिट ऐप्स फ़्रिक्शन पर जीते या मरते हैं: अगर हैबिट लॉग करने में दो टैप्स से ज़्यादा लगें, तो आप दूसरे हफ़्ते तक ऐप खोलना बंद कर देते हैं। ऐप स्टोर्स पर जेनेरिक ट्रैकर्स इसे सब्सक्रिप्शन्स और फ़ीचर ब्लोट से सुलझाते हैं। अपना ख़ुद का बनाना मतलब ऐप बिल्कुल आपकी हैबिट्स ट्रैक करता है, आपके तरीक़े से — एक मॉर्निंग-रूटीन चेकलिस्ट, एक जिम स्ट्रीक, एक "नो शुगर" काउंटर — बीच में कुछ और नहीं।',
        'आप जो हैबिट्स ट्रैक करना चाहते हैं और प्रोग्रेस कैसे देखना चाहते हैं यह बताएं, और WyberAi उसके इर्द-गिर्द एक React Native ऐप जनरेट करता है: वन-टैप चेक-इन्स के लिए एक टुडे स्क्रीन, टाइमज़ोन बदलावों में भी टिकने वाला स्ट्रीक लॉजिक, और चेन दिखाने वाला एक हिस्ट्री व्यू। Expo के ज़रिए अपने ही फ़ोन पर इसे प्रीव्यू करें, फिर सादी अंग्रेज़ी में बदलते रहें — "छूटे दिनों को सिर्फ़ दो मिस के बाद स्ट्रीक तोड़ने दें।"',
      ],
      features: [
        { title: 'वन-टैप डेली चेक-इन्स', desc: 'हर हैबिट को एक सिंगल टॉगल के साथ लिस्ट करने वाली एक टुडे स्क्रीन — पूरा लॉग-योर-डे फ़्लो सेकंड्स में होता है।' },
        { title: 'स्ट्रीक इंजन', desc: 'आपकी चेक-इन हिस्ट्री से कैलकुलेट किया गया करंट स्ट्रीक, बेस्ट स्ट्रीक, और प्रति-हैबिट कम्प्लीशन पर्सेंटेज।' },
        { title: 'प्रोग्रेस हीटमैप', desc: 'प्रति-हैबिट एक कैलेंडर हीटमैप ताकि चेन दिखे — वह साइकोलॉजी जो ट्रैकर्स को काम करवाती है।' },
        { title: 'आपकी हैबिट्स, आपके नियम', desc: 'सिर्फ़-वीकडे हैबिट्स, क्वांटिटी गोल्स ("8 ग्लास पानी"), या सिंपल हां/नहीं — अंग्रेज़ी में बताया गया, स्कीमा में वायर्ड किया गया।' },
      ],
      promptExample: 'एक हैबिट ट्रैकर मोबाइल ऐप बनाएं जिसमें मेरी हैबिट्स को वन-टैप टॉगल्स के रूप में लिस्ट करने वाली एक Today स्क्रीन, करंट स्ट्रीक, बेस्ट स्ट्रीक और प्रति-हैबिट मासिक कैलेंडर हीटमैप वाली एक Stats स्क्रीन, और जहां मैं एक नाम, आइकन, और शेड्यूल (डेली या ख़ास वीकडेज़) सेट कर सकूं ऐसी एक Add Habit स्क्रीन हो। डिज़ाइन मिनिमल और डार्क रखें।',
      faqs: [
        { q: 'क्या स्ट्रीक लॉजिक स्किप्ड दिनों या रेस्ट डेज़ को हैंडल कर सकता है?', a: 'हां — जो नियम आप चाहते हैं वह बताएं ("वीकेंड्स स्ट्रीक्स नहीं तोड़ते" या "प्रति हफ़्ते एक स्किप की इजाज़त है") और जनरेट किया गया लॉजिक उसे फ़ॉलो करता है। आप बाद में चैट में नियम बदल सकते हैं।' },
        { q: 'क्या यह iPhone और Android दोनों पर काम करता है?', a: 'ऐप React Native + Expo के रूप में जनरेट होता है, जो एक कोडबेस से दोनों प्लेटफ़ॉर्म्स पर चलता है। आप इसे Expo के ज़रिए तुरंत अपने ही फ़ोन पर प्रीव्यू करते हैं।' },
        { q: 'क्या मैं बाद में रिमाइंडर्स जोड़ सकता हूं?', a: 'आप अभी एक रिमाइंडर्स स्क्रीन और शेड्यूल स्ट्रक्चर जोड़ सकते हैं, और एक्सपोर्ट या पब्लिश करते समय पुश नोटिफ़िकेशन्स वायर कर सकते हैं — स्कीमा इसके लिए तैयार है।' },
        { q: 'इसे बनाने में क्या ख़र्च आता है?', a: 'आपका पहला बिल्ड 50 मुफ़्त मासिक क्रेडिट्स से कवर होता है — एक पूरे ऐप बिल्ड की लागत 30 क्रेडिट्स है, और छोटे एडिट्स की 2। शुरू करने के लिए कोई कार्ड नहीं चाहिए।' },
      ],
    },
    'freelance-time-tracker': {
      h1: 'AI से फ़्रीलांसर्स के लिए टाइम ट्रैकिंग ऐप बनाएं',
      metaTitle: 'AI से फ़्रीलांस टाइम ट्रैकर बनाएं — बिना कोड',
      metaDesc: 'क्लाइंट प्रोजेक्ट्स, बिल करने योग्य घंटों, और इनवॉइस-रेडी समरीज़ वाला एक टाइम ट्रैकिंग वेब ऐप जनरेट करें — सादी अंग्रेज़ी में बताया गया, मिनटों में बना।',
      tagline: 'क्लाइंट और प्रोजेक्ट के हिसाब से घंटे ट्रैक करें, जो बिल करने योग्य है उसे मार्क करें, और इनवॉइस-रेडी टोटल्स एक्सपोर्ट करें — किसी और के वर्कफ़्लो के लिए सब्सक्रिप्शन दिए बिना।',
      body: [
        'हर फ़्रीलांसर आख़िरकार एक ही दीवार से टकराता है: टीमों के लिए बने टाइम ट्रैकर्स उन फ़ीचर्स के लिए प्रति-सीट पैसे लेते हैं जिनका आप कभी इस्तेमाल नहीं करेंगे, और फ़्री टियर्स उस एक चीज़ को सीमित करते हैं जो आपको चाहिए — हिस्ट्री। जबकि आपकी असली ज़रूरत सिंपल है: कौन सा क्लाइंट, कौन सा प्रोजेक्ट, कितनी देर, क्या यह बिल करने योग्य है, और इनवॉइस टाइम पर एक साफ़ टोटल।',
        'वह एक-पैराग्राफ़ स्पेक WyberAi के लिए पूरा टूल बनाने के लिए काफ़ी है: एक टाइमर पेज, असली Postgres डेटाबेस में एक क्लाइंट और प्रोजेक्ट स्ट्रक्चर, और आपके इनवॉइसेज़ जैसे ग्रुप की गई एक मासिक समरी। क्योंकि आप ऐप के मालिक हैं, वर्कफ़्लो आपके हिसाब से मुड़ता है — प्रति-क्लाइंट एक ऑवरली-रेट फ़ील्ड, एक साप्ताहिक ईमेल समरी, या जब भी ज़रूरत हो एक "मार्क ऐज़ इनवॉइस्ड" फ़्लैग जोड़ें।',
      ],
      features: [
        { title: 'लाइव टाइमर + मैन्युअल एंट्रीज़', desc: 'एक टाइमर शुरू करें या बाद में घंटे भरें — दोनों क्लाइंट और प्रोजेक्ट जुड़े एक ही लॉग में आते हैं।' },
        { title: 'क्लाइंट्स → प्रोजेक्ट्स → एंट्रीज़', desc: 'एक सही रिलेशनल स्ट्रक्चर, तो टोटल्स किसी भी तारीख़ रेंज पर प्रोजेक्ट या क्लाइंट के हिसाब से साफ़-साफ़ जुड़ते हैं।' },
        { title: 'बिल करने योग्य बनाम इंटरनल स्प्लिट', desc: 'एंट्रीज़ को बिल करने योग्य फ़्लैग करें; समरीज़ बिल करने योग्य टोटल्स अलग दिखाती हैं तो इनवॉइसिंग एक नज़र में हो जाती है।' },
        { title: 'इनवॉइस-रेडी मासिक व्यू', desc: 'किसी भी महीने के लिए क्लाइंट के हिसाब से ग्रुप किए घंटे, आपकी ऑवरली रेट लागू करके — वह नंबर जो इनवॉइस पर जाता है।' },
      ],
      promptExample: 'एक फ़्रीलांसर के लिए टाइम ट्रैकिंग वेब ऐप बनाएं: एक स्टार्ट/स्टॉप टाइमर वाला एक Timer पेज जो क्लाइंट, प्रोजेक्ट और नोट्स के साथ एंट्रीज़ सेव करे; क्लाइंट्स मैनेज करने के लिए एक Clients पेज जिसमें हर एक की ऑवरली रेट और उनके प्रोजेक्ट्स हों; और एक चुने महीने के लिए क्लाइंट के हिसाब से ग्रुप किए घंटे और कमाई दिखाने वाला, बिल करने योग्य और नॉन-बिलेबल अलग किया एक Reports पेज।',
      faqs: [
        { q: 'क्या यह कैलकुलेट कर सकता है मुझे क्या इनवॉइस करना चाहिए?', a: 'हां — हर क्लाइंट को एक ऑवरली रेट दें और रिपोर्ट्स पेज आपकी चुनी किसी भी तारीख़ रेंज के लिए बिल करने योग्य घंटों को रेट से गुणा करता है।' },
        { q: 'मेरा टाइम डेटा कहां स्टोर होता है?', a: 'आपके ऐप के अपने Postgres डेटाबेस (Supabase) में, प्रकाशित करने से पहले लाइव स्कैन की गई रो-लेवल सिक्योरिटी के साथ — आपके घंटे आपके हैं, आपके इंफ़्रास्ट्रक्चर पर।' },
        { q: 'क्या मैं Toggl या स्प्रेडशीट से हिस्ट्री इम्पोर्ट कर सकता हूं?', a: 'चैट में मांगकर एक CSV इम्पोर्ट पेज जोड़ें — अपने एक्सपोर्ट के कॉलम्स बताएं और ऐप उन्हें आपकी एंट्रीज़ टेबल में मैप करता है।' },
        { q: 'क्या यह असल में टाइम-ट्रैकर सब्सक्रिप्शन से सस्ता है?', a: 'आप इसे मुफ़्त मासिक क्रेडिट्स से एक बार बनाते हैं और यह आपके अपने ऐप के रूप में चलता है — कोई प्रति-महीना ट्रैकर फ़ीस नहीं, और बदलाव चाहने पर एडिट्स की लागत 2 क्रेडिट्स है।' },
      ],
    },
    'team-task-manager': {
      h1: 'AI से टीम टास्क मैनेजर बनाएं',
      metaTitle: 'AI से टीम टास्क मैनेजमेंट ऐप बनाएं',
      metaDesc: 'अपनी टीम के लिए एक कानबान-स्टाइल टास्क मैनेजर बनाएं — बोर्ड्स, असाइनीज़, ड्यू डेट्स, और कमेंट्स — सादी अंग्रेज़ी विवरण से जनरेट किया गया। शुरू करना मुफ़्त।',
      tagline: 'एक कानबान बोर्ड जो आपकी टीम के असल काम करने के तरीक़े से मेल खाता है — आपके कॉलम्स, आपके लेबल्स, आपके नियम — किसी और का किराए पर लेने की बजाय।',
      body: [
        'छोटी टीमें दो बुरे विकल्पों के बीच फंसी हैं: हैवीवेट प्रोजेक्ट टूल्स जो प्रति-सीट क़ीमत लेते हैं जिन्हें टीम आधा इस्तेमाल करती है, और शेयर्ड स्प्रेडशीट्स जो दो लोगों के एक साथ एडिट करते ही टूट जाती हैं। ज़्यादातर पांच-लोगों की टीमों को जो चाहिए वह एक ही बोर्ड में फ़िट होता है — अगर बोर्ड उनकी भाषा बोलता है।',
        'WyberAi को बताएं आपकी टीम कैसे काम करती है — काम किन स्टेजेज़ से गुज़रता है, किसे क्या देखना चाहिए, "डन" टास्क को क्या चाहिए — और यह बिल्कुल उसी आकार का एक टास्क मैनेजर जनरेट करता है: एक असली डेटाबेस पर बना कानबान बोर्ड, प्रति-मेंबर असाइनमेंट, और एक एक्टिविटी ट्रेल। यह ऑथेंटिकेशन और एक सिक्योरिटी स्कैन के साथ शिप होता है, तो टीम को इनवाइट करना पहले दिन से सुरक्षित है।',
      ],
      features: [
        { title: 'आपके कॉलम्स के साथ कानबान', desc: 'Backlog → In Progress → Review → Done, या आपका जो भी फ़्लो हो — बोर्ड आपके इसके विवरण से जनरेट होता है।' },
        { title: 'असाइनीज़ और ड्यू डेट्स', desc: 'हर टास्क का एक ओनर और एक डेडलाइन होती है; एक My Tasks व्यू बोर्ड को हर व्यक्ति के देय काम में फ़िल्टर करता है।' },
        { title: 'टास्क्स पर कमेंट्स', desc: 'डिस्कशन टास्क पर ही रहती है, तो कॉन्टेक्स्ट चैट थ्रेड्स में खोना बंद हो जाता है।' },
        { title: 'बिल्ट-इन टीम ऑथ', desc: 'साइन-इन और मेंबरशिप पहले से वायर्ड आते हैं, लिंक शेयर करने से पहले लाइव स्कैन से जांची गई रो-लेवल सिक्योरिटी के साथ।' },
      ],
      promptExample: 'एक टीम टास्क मैनेजर वेब ऐप बनाएं: Backlog, This Week, In Progress, और Done कॉलम्स वाला एक कानबान Board पेज, जहां टास्क्स का एक टाइटल, विवरण, असाइनी, ड्यू डेट, और प्रायोरिटी हो; साइन-इन यूज़र के टास्क्स को ड्यू डेट के हिसाब से सॉर्ट करके दिखाने वाला एक My Tasks पेज; और थ्रेडेड कमेंट्स वाला टास्क डिटेल। टीम मेंबर मैनेजमेंट शामिल करें।',
      faqs: [
        { q: 'क्या हर टीममेट का अपना लॉगिन हो सकता है?', a: 'हां — ऐप ऑथेंटिकेशन शामिल करके जनरेट होता है, और एक मेंबर्स टेबल कंट्रोल करती है कौन बोर्ड देख और एडिट कर सकता है।' },
        { q: 'क्या टीम इस्तेमाल शुरू करने के बाद मैं वर्कफ़्लो बदल सकता हूं?', a: 'हां। चैट में पूछें — "एक Blocked कॉलम जोड़ें" या "Done से पहले एक चेकलिस्ट ज़रूरी करें" — और मौजूदा टास्क्स खोए बिना बोर्ड अपडेट होता है।' },
        { q: 'यह Trello इस्तेमाल करने से कैसे अलग है?', a: 'यह आपका अपना ऐप है: कोई प्रति-सीट प्राइसिंग नहीं, कोई फ़ीचर गेट्स नहीं, और वर्कफ़्लो आपकी टीम के हिसाब से बना है, लेबल्स और पावर-अप्स से अंदाज़ा नहीं लगाया गया।' },
        { q: 'क्या टीम का डेटा सुरक्षित है?', a: 'हर WyberAi ऐप को एक लाइव डेटाबेस सिक्योरिटी स्कैन मिलता है जो प्रकाशन से पहले आपके ऐप को हमलावर की तरह जांचता है, गंभीर लीक्स गेट को ब्लॉक करते हुए।' },
      ],
    },
    'job-application-tracker': {
      h1: 'AI से जॉब एप्लिकेशन ट्रैकर बनाएं',
      metaTitle: 'AI से जॉब एप्लिकेशन ट्रैकर ऐप बनाएं',
      metaDesc: 'एक बोर्ड में हर एप्लिकेशन, इंटरव्यू स्टेज, और फ़ॉलो-अप ट्रैक करें — सादी अंग्रेज़ी से जनरेट किया गया जॉब सर्च ट्रैकर, कोई गड़बड़ स्प्रेडशीट नहीं।',
      tagline: 'हर एप्लिकेशन, उसकी स्टेज, और आख़िरी बार कब सुना — एक बोर्ड, न कि एक स्प्रेडशीट जो असलियत से तीन टैब्स पीछे है।',
      body: [
        'एक गंभीर जॉब सर्च एक स्प्रेडशीट के रखने की क्षमता से ज़्यादा स्टेट जनरेट करती है: रिज़्यूमे का कौन सा वर्ज़न कहां गया, वह रिक्रूटर कॉल एक स्क्रीन थी या असली इंटरव्यू, और चौदह "अभी भी कैंडिडेट्स रिव्यू कर रहे हैं" ईमेल्स में से किसका इस हफ़्ते असल में फ़ॉलो-अप करना है। स्प्रेडशीट रंगीन सेल्स में बिगड़ जाती है जिसे सिर्फ़ आप समझ सकते हैं।',
        'अपनी सर्च बताएं और WyberAi उसके इर्द-गिर्द ट्रैकर बनाता है: Applied से Offer तक एक पाइपलाइन बोर्ड, रोल, कॉन्टैक्ट, और रिज़्यूमे वर्ज़न जुड़ा प्रति-एप्लिकेशन रिकॉर्ड, और आपकी अपनी सीमा से आगे शांत हो गई किसी भी चीज़ को सामने लाने वाला एक फ़ॉलो-अप व्यू। यह वह इकलौता सिस्टम है जिसका इतनी तनावभरी सर्च हक़दार है — एक दोपहर में बना, न कि साइड प्रोजेक्ट के तौर पर मेंटेन किया गया।',
      ],
      features: [
        { title: 'स्टेज के हिसाब से पाइपलाइन', desc: 'Applied, Screening, Interview, Offer, Rejected — एक कानबान बोर्ड तो पूरी सर्च एक नज़र में दिखे।' },
        { title: 'प्रति-एप्लिकेशन रिकॉर्ड', desc: 'कंपनी, रोल, रिज़्यूमे वर्ज़न, रेफ़रल कॉन्टैक्ट, और सैलरी रेंज, उस कार्ड से जुड़ी जिससे वह ताल्लुक़ रखती है।' },
        { title: 'फ़ॉलो-अप रडार', desc: 'तय दिनों से आगे बिना अपडेट वाली एप्लिकेशन्स ख़ुद-ब-ख़ुद सामने आती हैं — वे जो ठंडी पड़ रही हैं।' },
        { title: 'इंटरव्यू नोट्स', desc: 'हर राउंड के तुरंत बाद क्या पूछा गया और कैसा गया यह लॉग करें, जब तक यह अगले के लिए मायने रखने लायक ताज़ा है।' },
      ],
      promptExample: 'एक जॉब एप्लिकेशन ट्रैकर वेब ऐप बनाएं: Applied, Screening, Interview, Offer, Rejected कानबान कॉलम्स वाला एक Board पेज, जहां हर कार्ड कंपनी, रोल, और अप्लाई की तारीख़ दिखाए; कॉन्टैक्ट नाम, इस्तेमाल किया रिज़्यूमे वर्ज़न, सैलरी रेंज, और फ़्री-टेक्स्ट इंटरव्यू नोट्स वाला एक कार्ड डिटेल व्यू; और पिछले 10 दिनों में कोई स्टेटस बदलाव न वाली एप्लिकेशन्स लिस्ट करने वाला एक Follow-ups पेज।',
      faqs: [
        { q: 'क्या यह मुझे फ़ॉलो-अप करने की याद दिला सकता है?', a: 'Follow-ups व्यू हर बार जब आप ऐप खोलते हैं आपकी सीमा से आगे किसी भी बासी चीज़ को लिस्ट करता है; अगर आप पुश चाहते हैं तो चैट से ईमेल रिमाइंडर्स जोड़ने को कहें।' },
        { q: 'क्या मैं ट्रैक कर सकता हूं मैंने कहां कौन सा रिज़्यूमे वर्ज़न भेजा?', a: 'हां — हर एप्लिकेशन में एक रिज़्यूमे-वर्ज़न फ़ील्ड जोड़ें तो तीन हफ़्ते बाद कॉल करने पर आप ठीक-ठीक जानते हैं कि रिक्रूटर ने क्या देखा है।' },
        { q: 'क्या मैं अपनी सर्च पर स्टैट्स देख सकता हूं?', a: 'एक स्टैट्स व्यू मांगें — रिस्पॉन्स रेट, हर स्टेज में औसत समय, प्रति-हफ़्ते एप्लिकेशन्स — आपके अपने डेटा से कैलकुलेट किया गया।' },
        { q: 'क्या यह स्प्रेडशीट से बेहतर है?', a: 'एक स्प्रेडशीट आपको चेतावनी नहीं देती जब कोई एप्लिकेशन शांत हो जाती है या प्रति-राउंड स्ट्रक्चर्ड इंटरव्यू नोट्स नहीं रखती — यह ट्रैकर दोनों नैटिवली करता है।' },
      ],
    },
    'reading-list-app': {
      h1: 'AI से रीडिंग लिस्ट ऐप बनाएं',
      metaTitle: 'AI से रीडिंग लिस्ट और बुक ट्रैकर ऐप बनाएं',
      metaDesc: 'अपना टू-बी-रेड ढेर ट्रैक करें, रेटिंग्स के साथ पूरी की गई किताबें लॉग करें, और सालाना रीडिंग गोल पूरा करें — सादी अंग्रेज़ी से बना बुक ट्रैकर, आपका रखने के लिए।',
      tagline: 'टू-बी-रेड ढेर, आप अभी क्या पढ़ रहे हैं, और सालाना गिनती — बिना किसी सोशल फ़ीड के आपकी रफ़्तार पर गिल्ट-ट्रिप किए।',
      body: [
        'Goodreads बुक ट्रैकिंग को एक ऐसे सोशल नेटवर्क में लपेटकर सुलझाता है जो आपने मांगा ही नहीं था, और ज़्यादातर रीडिंग-ट्रैकर ऐप्स डिस्कवरी सुलझाते हैं, असली समस्या नहीं: उन किताबों की एक बढ़ती हुई लिस्ट जिन्हें आप पढ़ना चाहते थे, यह याद न होना कि आपने मौजूदा किताब कहां रोकी, और यह ईमानदार अंदाज़ा न होना कि यह 20-किताब का साल है या 50-किताब का।',
        'WyberAi को बताएं आप कैसे पढ़ते हैं — फ़िज़िकल, ईबुक, ऑडियोबुक, या तीनों — और यह उसी के अनुसार बना एक ट्रैकर बनाता है: एक टू-बी-रेड शेल्फ़ जिसमें आप मन से जोड़ते हैं, एक करंटली-रीडिंग व्यू जिसमें आप सेकंड्स में एक पेज या पर्सेंटेज अपडेट करते हैं, और आपकी अपनी रेटिंग और भविष्य-के-आप के लिए एक नोट वाला फ़िनिश्ड शेल्फ़। एक सालाना गोल काउंटर "मुझे ज़्यादा पढ़ना चाहिए" को एक ऐसे नंबर में बदल देता है जो आप असल में बढ़ता देख सकते हैं।',
      ],
      features: [
        { title: 'टू-बी-रेड शेल्फ़', desc: 'जिस पल कोई किताब का ज़िक्र करे उसे जोड़ें — टाइटल, लेखक, और आप इसे क्यों पढ़ना चाहते हैं।' },
        { title: 'करंटली रीडिंग प्रोग्रेस', desc: 'जैसे-जैसे आगे बढ़ें पेज नंबर या पर्सेंटेज अपडेट करें; ऐप दिखाता है आप हर किताब में कितने अंदर हैं।' },
        { title: 'रेटिंग्स के साथ फ़िनिश्ड शेल्फ़', desc: 'आपकी अपनी स्टार रेटिंग और प्रति-किताब एक छोटा नोट — वह लॉग जो असल में बाद में किताबें सिफ़ारिश करने में मदद करता है।' },
        { title: 'सालाना रीडिंग गोल', desc: 'प्रति-वर्ष किताबों का टारगेट सेट करें और पूरी हुई किताबें शेल्फ़ पर आते ही एक प्रोग्रेस बार को भरते देखें।' },
      ],
      promptExample: 'एक रीडिंग लिस्ट मोबाइल ऐप बनाएं: एक To Be Read स्क्रीन जहां मैं टाइटल, लेखक, और फ़ॉर्मैट (फ़िज़िकल/ईबुक/ऑडियोबुक) के साथ किताबें जोड़ूं; प्रोग्रेस में किताबें दिखाने वाली एक Currently Reading स्क्रीन जिसमें मैं एक पेज या पर्सेंटेज स्लाइडर अपडेट करूं; मेरी स्टार रेटिंग और एक छोटे नोट के साथ पूरी की गई किताबें लिस्ट करने वाली एक Finished स्क्रीन; और मैंने तय किए टारगेट के मुक़ाबले इस साल पूरी हुई किताबें दिखाने वाली एक Goal स्क्रीन।',
      faqs: [
        { q: 'क्या यह ऑडियोबुक्स को फ़िज़िकल किताबों से अलग ट्रैक कर सकता है?', a: 'हां — प्रति-किताब फ़ॉर्मैट सेट करें, और ऑडियोबुक्स के लिए पेज नंबर की बजाय पर्सेंटेज या सुने गए समय से प्रोग्रेस ट्रैक करें।' },
        { q: 'क्या यह किताबें सिफ़ारिश करता है?', a: 'नहीं — यह एक पर्सनल ट्रैकर है, डिस्कवरी फ़ीड नहीं। यह आपकी अपनी शेल्फ़ें दिखाता है, न कि कोई मार्केटप्लेस आपको अगला क्या ख़रीदने के लिए चाहता है।' },
        { q: 'क्या मैं किताबों को जॉनर या सीरीज़ के हिसाब से व्यवस्थित कर सकता हूं?', a: 'अपने प्रॉम्प्ट में टैग्स या एक सीरीज़ फ़ील्ड जोड़ें, और शेल्फ़ें उनके हिसाब से फ़िल्टर या ग्रुप कर सकती हैं।' },
        { q: 'क्या मेरा रीडिंग डेटा प्राइवेट है?', a: 'यह आपके अपने डेटाबेस पर आपका अपना ऐप है — जब तक आप ख़ास तौर पर एक न बनाएं, कुछ भी सोशल फ़ीड में शेयर नहीं होता।' },
      ],
    },
  },
  kn: {
    'habit-tracker-app': {
      h1: 'AI ಮೂಲಕ ಹ್ಯಾಬಿಟ್ ಟ್ರ್ಯಾಕರ್ ಆ್ಯಪ್ ರಚಿಸಿ',
      metaTitle: 'AI ಮೂಲಕ ಹ್ಯಾಬಿಟ್ ಟ್ರ್ಯಾಕರ್ ಆ್ಯಪ್ ರಚಿಸಿ — ಕೋಡ್ ಇಲ್ಲದೆ',
      metaDesc: 'ನಿಮ್ಮ ಹ್ಯಾಬಿಟ್ ಟ್ರ್ಯಾಕರ್ ಅನ್ನು ಸರಳ ಇಂಗ್ಲಿಷ್‌ನಲ್ಲಿ ವಿವರಿಸಿ ಮತ್ತು ಸ್ಟ್ರೀಕ್‌ಗಳು, ದೈನಂದಿನ ಚೆಕ್-ಇನ್‌ಗಳು, ಮತ್ತು ಪ್ರಗತಿ ಚಾರ್ಟ್‌ಗಳಿರುವ ಕೆಲಸ ಮಾಡುವ ಮೊಬೈಲ್ ಆ್ಯಪ್ ಪಡೆಯಿರಿ. ಪ್ರಾರಂಭಿಸಲು ಉಚಿತ, ಕೋಡ್ ಅಗತ್ಯವಿಲ್ಲ.',
      tagline: 'ಸ್ಟ್ರೀಕ್‌ಗಳು, ದೈನಂದಿನ ಚೆಕ್-ಇನ್‌ಗಳು, ಮತ್ತು ಚೈನ್ ಅನ್ನು ಮುಂದುವರಿಸಲು ಬಯಸುವಂತೆ ಮಾಡುವ ಪ್ರಗತಿ ವ್ಯೂ — ಒಂದೇ ಪ್ರಾಂಪ್ಟ್‌ನಿಂದ ನಿರ್ಮಿಸಲಾಗಿದೆ.',
      body: [
        'ಹ್ಯಾಬಿಟ್ ಆ್ಯಪ್‌ಗಳು ಘರ್ಷಣೆಯ ಮೇಲೆ ಬದುಕುತ್ತವೆ ಅಥವಾ ಸಾಯುತ್ತವೆ: ಹ್ಯಾಬಿಟ್ ಲಾಗ್ ಮಾಡಲು ಎರಡು ಟ್ಯಾಪ್‌ಗಳಿಗಿಂತ ಹೆಚ್ಚು ಸಮಯ ತೆಗೆದುಕೊಂಡರೆ, ಎರಡನೇ ವಾರದ ವೇಳೆಗೆ ನೀವು ಆ್ಯಪ್ ತೆರೆಯುವುದನ್ನು ನಿಲ್ಲಿಸುತ್ತೀರಿ. ಆ್ಯಪ್ ಸ್ಟೋರ್‌ಗಳಲ್ಲಿನ ಸಾಮಾನ್ಯ ಟ್ರ್ಯಾಕರ್‌ಗಳು ಇದನ್ನು ಚಂದಾದಾರಿಕೆಗಳು ಮತ್ತು ಫೀಚರ್ ಬ್ಲೋಟ್‌ನಿಂದ ಪರಿಹರಿಸುತ್ತವೆ. ನಿಮ್ಮ ಸ್ವಂತದ್ದನ್ನು ನಿರ್ಮಿಸುವುದು ಅಂದರೆ ಆ್ಯಪ್ ನಿಖರವಾಗಿ ನಿಮ್ಮ ಹ್ಯಾಬಿಟ್‌ಗಳನ್ನು, ನಿಮ್ಮ ರೀತಿಯಲ್ಲಿ ಟ್ರ್ಯಾಕ್ ಮಾಡುತ್ತದೆ — ಬೆಳಗಿನ-ದಿನಚರಿ ಪರಿಶೀಲನಾ ಪಟ್ಟಿ, ಜಿಮ್ ಸ್ಟ್ರೀಕ್, "ಸಕ್ಕರೆ ಇಲ್ಲ" ಕೌಂಟರ್ — ಬೇರೆ ಏನೂ ದಾರಿಯಲ್ಲಿ ಇಲ್ಲದೆ.',
        'ನೀವು ಟ್ರ್ಯಾಕ್ ಮಾಡಲು ಬಯಸುವ ಹ್ಯಾಬಿಟ್‌ಗಳನ್ನು ಮತ್ತು ಪ್ರಗತಿಯನ್ನು ಹೇಗೆ ನೋಡಲು ಬಯಸುತ್ತೀರಿ ಎಂದು ವಿವರಿಸಿ, ಮತ್ತು WyberAi ಅದರ ಸುತ್ತ React Native ಆ್ಯಪ್ ಅನ್ನು ಜನರೇಟ್ ಮಾಡುತ್ತದೆ: ಒಂದು-ಟ್ಯಾಪ್ ಚೆಕ್-ಇನ್‌ಗಳಿಗಾಗಿ ಇಂದಿನ ಸ್ಕ್ರೀನ್, ಟೈಮ್‌ಝೋನ್ ಬದಲಾವಣೆಗಳಲ್ಲಿ ಬದುಕುಳಿಯುವ ಸ್ಟ್ರೀಕ್ ಲಾಜಿಕ್, ಮತ್ತು ಚೈನ್ ತೋರಿಸುವ ಇತಿಹಾಸ ವ್ಯೂ. Expo ಮೂಲಕ ನಿಮ್ಮ ಸ್ವಂತ ಫೋನ್‌ನಲ್ಲಿ ಇದನ್ನು ಪೂರ್ವವೀಕ್ಷಿಸಿ, ನಂತರ ಸರಳ ಇಂಗ್ಲಿಷ್‌ನಲ್ಲಿ ಸರಿಹೊಂದಿಸುತ್ತಿರಿ — "ತಪ್ಪಿದ ದಿನಗಳು ಎರಡು ಮಿಸ್‌ಗಳ ನಂತರ ಮಾತ್ರ ಸ್ಟ್ರೀಕ್ ಮುರಿಯಲಿ."',
      ],
      features: [
        { title: 'ಒಂದು-ಟ್ಯಾಪ್ ದೈನಂದಿನ ಚೆಕ್-ಇನ್‌ಗಳು', desc: 'ಒಂದೇ ಟಾಗಲ್‌ನೊಂದಿಗೆ ಪ್ರತಿ ಹ್ಯಾಬಿಟ್ ಅನ್ನು ಪಟ್ಟಿ ಮಾಡುವ ಇಂದಿನ ಸ್ಕ್ರೀನ್ — ಇಡೀ ಲಾಗ್-ಯುವರ್-ಡೇ ಫ್ಲೋ ಸೆಕೆಂಡುಗಳಲ್ಲಿ ನಡೆಯುತ್ತದೆ.' },
        { title: 'ಸ್ಟ್ರೀಕ್ ಇಂಜಿನ್', desc: 'ನಿಮ್ಮ ಚೆಕ್-ಇನ್ ಇತಿಹಾಸದಿಂದ ಲೆಕ್ಕಹಾಕಿದ ಪ್ರಸ್ತುತ ಸ್ಟ್ರೀಕ್, ಅತ್ಯುತ್ತಮ ಸ್ಟ್ರೀಕ್, ಮತ್ತು ಪ್ರತಿ-ಹ್ಯಾಬಿಟ್ ಪೂರ್ಣಗೊಳಿಸುವಿಕೆ ಶೇಕಡಾ.' },
        { title: 'ಪ್ರಗತಿ ಹೀಟ್‌ಮ್ಯಾಪ್', desc: 'ಚೈನ್ ಗೋಚರಿಸಲು ಪ್ರತಿ-ಹ್ಯಾಬಿಟ್ ಕ್ಯಾಲೆಂಡರ್ ಹೀಟ್‌ಮ್ಯಾಪ್ — ಟ್ರ್ಯಾಕರ್‌ಗಳನ್ನು ಕೆಲಸ ಮಾಡಿಸುವ ಮನೋವಿಜ್ಞಾನ.' },
        { title: 'ನಿಮ್ಮ ಹ್ಯಾಬಿಟ್‌ಗಳು, ನಿಮ್ಮ ನಿಯಮಗಳು', desc: 'ವಾರದ-ದಿನ-ಮಾತ್ರ ಹ್ಯಾಬಿಟ್‌ಗಳು, ಪ್ರಮಾಣ ಗುರಿಗಳು ("8 ಗ್ಲಾಸ್ ನೀರು"), ಅಥವಾ ಸರಳ ಹೌದು/ಇಲ್ಲ — ಇಂಗ್ಲಿಷ್‌ನಲ್ಲಿ ವಿವರಿಸಲಾಗಿದೆ, ಸ್ಕೀಮಾದಲ್ಲಿ ವೈರ್ ಮಾಡಲಾಗಿದೆ.' },
      ],
      promptExample: 'ನನ್ನ ಹ್ಯಾಬಿಟ್‌ಗಳನ್ನು ಒಂದು-ಟ್ಯಾಪ್ ಟಾಗಲ್‌ಗಳಾಗಿ ಪಟ್ಟಿ ಮಾಡುವ Today ಸ್ಕ್ರೀನ್, ಪ್ರಸ್ತುತ ಸ್ಟ್ರೀಕ್, ಅತ್ಯುತ್ತಮ ಸ್ಟ್ರೀಕ್ ಮತ್ತು ಪ್ರತಿ-ಹ್ಯಾಬಿಟ್ ಮಾಸಿಕ ಕ್ಯಾಲೆಂಡರ್ ಹೀಟ್‌ಮ್ಯಾಪ್ ಇರುವ Stats ಸ್ಕ್ರೀನ್, ಮತ್ತು ನಾನು ಹೆಸರು, ಐಕಾನ್, ಮತ್ತು ವೇಳಾಪಟ್ಟಿ (ದೈನಂದಿನ ಅಥವಾ ನಿರ್ದಿಷ್ಟ ವಾರದ ದಿನಗಳು) ಸೆಟ್ ಮಾಡಬಹುದಾದ Add Habit ಸ್ಕ್ರೀನ್ ಇರುವ ಹ್ಯಾಬಿಟ್ ಟ್ರ್ಯಾಕರ್ ಮೊಬೈಲ್ ಆ್ಯಪ್ ರಚಿಸಿ. ವಿನ್ಯಾಸವನ್ನು ಮಿನಿಮಲ್ ಮತ್ತು ಡಾರ್ಕ್ ಆಗಿ ಇರಿಸಿ.',
      faqs: [
        { q: 'ಸ್ಟ್ರೀಕ್ ಲಾಜಿಕ್ ಸ್ಕಿಪ್ ಮಾಡಿದ ದಿನಗಳು ಅಥವಾ ವಿಶ್ರಾಂತಿ ದಿನಗಳನ್ನು ನಿಭಾಯಿಸಬಹುದೇ?', a: 'ಹೌದು — ನಿಮಗೆ ಬೇಕಾದ ನಿಯಮವನ್ನು ವಿವರಿಸಿ ("ವಾರಾಂತ್ಯಗಳು ಸ್ಟ್ರೀಕ್‌ಗಳನ್ನು ಮುರಿಯುವುದಿಲ್ಲ" ಅಥವಾ "ಪ್ರತಿ ವಾರಕ್ಕೆ ಒಂದು ಸ್ಕಿಪ್‌ಗೆ ಅನುಮತಿ") ಮತ್ತು ಜನರೇಟ್ ಆದ ಲಾಜಿಕ್ ಅದನ್ನು ಅನುಸರಿಸುತ್ತದೆ. ನೀವು ನಂತರ ಚಾಟ್‌ನಲ್ಲಿ ನಿಯಮವನ್ನು ಬದಲಾಯಿಸಬಹುದು.' },
        { q: 'ಇದು iPhone ಮತ್ತು Android ಎರಡರಲ್ಲೂ ಕೆಲಸ ಮಾಡುತ್ತದೆಯೇ?', a: 'ಆ್ಯಪ್ React Native + Expo ಆಗಿ ಜನರೇಟ್ ಆಗುತ್ತದೆ, ಇದು ಒಂದು ಕೋಡ್‌ಬೇಸ್‌ನಿಂದ ಎರಡೂ ಪ್ಲಾಟ್‌ಫಾರ್ಮ್‌ಗಳಲ್ಲಿ ಚಲಿಸುತ್ತದೆ. ನೀವು Expo ಮೂಲಕ ತಕ್ಷಣ ನಿಮ್ಮ ಸ್ವಂತ ಫೋನ್‌ನಲ್ಲಿ ಪೂರ್ವವೀಕ್ಷಿಸುತ್ತೀರಿ.' },
        { q: 'ನಾನು ನಂತರ ಜ್ಞಾಪನೆಗಳನ್ನು ಸೇರಿಸಬಹುದೇ?', a: 'ನೀವು ಈಗ ಜ್ಞಾಪನೆಗಳ ಸ್ಕ್ರೀನ್ ಮತ್ತು ವೇಳಾಪಟ್ಟಿ ರಚನೆಯನ್ನು ಸೇರಿಸಬಹುದು, ಮತ್ತು ಎಕ್ಸ್‌ಪೋರ್ಟ್ ಅಥವಾ ಪ್ರಕಟಿಸುವಾಗ ಪುಶ್ ಅಧಿಸೂಚನೆಗಳನ್ನು ವೈರ್ ಮಾಡಬಹುದು — ಸ್ಕೀಮಾ ಇದಕ್ಕೆ ಸಿದ್ಧವಾಗಿದೆ.' },
        { q: 'ಇದನ್ನು ರಚಿಸಲು ಎಷ್ಟು ಖರ್ಚಾಗುತ್ತದೆ?', a: 'ನಿಮ್ಮ ಮೊದಲ ಬಿಲ್ಡ್ 50 ಉಚಿತ ಮಾಸಿಕ ಕ್ರೆಡಿಟ್‌ಗಳಿಂದ ಕವರ್ ಆಗುತ್ತದೆ — ಪೂರ್ಣ ಆ್ಯಪ್ ಬಿಲ್ಡ್‌ಗೆ 30 ಕ್ರೆಡಿಟ್‌ಗಳು, ಸಣ್ಣ ಎಡಿಟ್‌ಗಳಿಗೆ 2. ಪ್ರಾರಂಭಿಸಲು ಕಾರ್ಡ್ ಅಗತ್ಯವಿಲ್ಲ.' },
      ],
    },
    'freelance-time-tracker': {
      h1: 'AI ಮೂಲಕ ಫ್ರೀಲ್ಯಾನ್ಸರ್‌ಗಳಿಗಾಗಿ ಟೈಮ್ ಟ್ರ್ಯಾಕಿಂಗ್ ಆ್ಯಪ್ ರಚಿಸಿ',
      metaTitle: 'AI ಮೂಲಕ ಫ್ರೀಲ್ಯಾನ್ಸ್ ಟೈಮ್ ಟ್ರ್ಯಾಕರ್ ರಚಿಸಿ — ಕೋಡ್ ಇಲ್ಲದೆ',
      metaDesc: 'ಕ್ಲೈಂಟ್ ಪ್ರಾಜೆಕ್ಟ್‌ಗಳು, ಬಿಲ್ ಮಾಡಬಹುದಾದ ಗಂಟೆಗಳು, ಮತ್ತು ಇನ್‌ವಾಯ್ಸ್-ಸಿದ್ಧ ಸಾರಾಂಶಗಳಿರುವ ಟೈಮ್ ಟ್ರ್ಯಾಕಿಂಗ್ ವೆಬ್ ಆ್ಯಪ್ ಜನರೇಟ್ ಮಾಡಿ — ಸರಳ ಇಂಗ್ಲಿಷ್‌ನಲ್ಲಿ ವಿವರಿಸಲಾಗಿದೆ, ನಿಮಿಷಗಳಲ್ಲಿ ನಿರ್ಮಿಸಲಾಗಿದೆ.',
      tagline: 'ಕ್ಲೈಂಟ್ ಮತ್ತು ಪ್ರಾಜೆಕ್ಟ್ ಪ್ರಕಾರ ಗಂಟೆಗಳನ್ನು ಟ್ರ್ಯಾಕ್ ಮಾಡಿ, ಬಿಲ್ ಮಾಡಬಹುದಾದದನ್ನು ಗುರುತಿಸಿ, ಇನ್‌ವಾಯ್ಸ್-ಸಿದ್ಧ ಒಟ್ಟುಗಳನ್ನು ರಫ್ತು ಮಾಡಿ — ಬೇರೊಬ್ಬರ ಕೆಲಸದ ಹರಿವಿಗೆ ಚಂದಾದಾರಿಕೆ ಪಾವತಿಸದೆ.',
      body: [
        'ಪ್ರತಿ ಫ್ರೀಲ್ಯಾನ್ಸರ್ ಅಂತಿಮವಾಗಿ ಅದೇ ಗೋಡೆಗೆ ಡಿಕ್ಕಿ ಹೊಡೆಯುತ್ತಾರೆ: ತಂಡಗಳಿಗಾಗಿ ನಿರ್ಮಿಸಿದ ಟೈಮ್ ಟ್ರ್ಯಾಕರ್‌ಗಳು ನೀವು ಎಂದಿಗೂ ಬಳಸದ ಫೀಚರ್‌ಗಳಿಗೆ ಪ್ರತಿ-ಸೀಟ್ ಹಣ ವಿಧಿಸುತ್ತವೆ, ಉಚಿತ ಟಿಯರ್‌ಗಳು ನಿಮಗೆ ಬೇಕಾದ ಒಂದೇ ವಿಷಯವನ್ನು — ಇತಿಹಾಸ — ಮಿತಿಗೊಳಿಸುತ್ತವೆ. ಏತನ್ಮಧ್ಯೆ ನಿಮ್ಮ ನಿಜವಾದ ಅವಶ್ಯಕತೆ ಸರಳವಾಗಿದೆ: ಯಾವ ಕ್ಲೈಂಟ್, ಯಾವ ಪ್ರಾಜೆಕ್ಟ್, ಎಷ್ಟು ಸಮಯ, ಇದು ಬಿಲ್ ಮಾಡಬಹುದೇ, ಮತ್ತು ಇನ್‌ವಾಯ್ಸ್ ಸಮಯದಲ್ಲಿ ಸ್ವಚ್ಛ ಒಟ್ಟು.',
        'ಆ ಒಂದು-ಪ್ಯಾರಾಗ್ರಾಫ್ ಸ್ಪೆಕ್ WyberAi ಗೆ ಇಡೀ ಟೂಲ್ ಅನ್ನು ನಿರ್ಮಿಸಲು ಸಾಕು: ಒಂದು ಟೈಮರ್ ಪೇಜ್, ನಿಜವಾದ Postgres ಡೇಟಾಬೇಸ್‌ನಲ್ಲಿ ಕ್ಲೈಂಟ್ ಮತ್ತು ಪ್ರಾಜೆಕ್ಟ್ ರಚನೆ, ಮತ್ತು ನಿಮ್ಮ ಇನ್‌ವಾಯ್ಸ್‌ಗಳಂತೆ ಗುಂಪುಗೊಳಿಸಿದ ಮಾಸಿಕ ಸಾರಾಂಶ. ನೀವು ಆ್ಯಪ್‌ನ ಮಾಲೀಕರಾಗಿರುವುದರಿಂದ, ಕೆಲಸದ ಹರಿವು ನಿಮಗೆ ಬಗ್ಗುತ್ತದೆ — ಪ್ರತಿ-ಕ್ಲೈಂಟ್ ಗಂಟೆಗೆ-ದರ ಫೀಲ್ಡ್, ಸಾಪ್ತಾಹಿಕ ಇಮೇಲ್ ಸಾರಾಂಶ, ಅಥವಾ ಅಗತ್ಯವಿದ್ದಾಗ "ಇನ್‌ವಾಯ್ಸ್ ಮಾಡಲಾಗಿದೆ ಎಂದು ಗುರುತಿಸಿ" ಫ್ಲ್ಯಾಗ್ ಸೇರಿಸಿ.',
      ],
      features: [
        { title: 'ಲೈವ್ ಟೈಮರ್ + ಹಸ್ತಚಾಲಿತ ಎಂಟ್ರಿಗಳು', desc: 'ಟೈಮರ್ ಪ್ರಾರಂಭಿಸಿ ಅಥವಾ ನಂತರ ಗಂಟೆಗಳನ್ನು ಬ್ಯಾಕ್‌ಫಿಲ್ ಮಾಡಿ — ಎರಡೂ ಕ್ಲೈಂಟ್ ಮತ್ತು ಪ್ರಾಜೆಕ್ಟ್ ಜೋಡಿಸಿದ ಒಂದೇ ಲಾಗ್‌ನಲ್ಲಿ ಬರುತ್ತವೆ.' },
        { title: 'ಕ್ಲೈಂಟ್‌ಗಳು → ಪ್ರಾಜೆಕ್ಟ್‌ಗಳು → ಎಂಟ್ರಿಗಳು', desc: 'ಸರಿಯಾದ ಸಂಬಂಧಾತ್ಮಕ ರಚನೆ, ಆದ್ದರಿಂದ ಯಾವುದೇ ದಿನಾಂಕ ವ್ಯಾಪ್ತಿಯಲ್ಲಿ ಪ್ರಾಜೆಕ್ಟ್ ಅಥವಾ ಕ್ಲೈಂಟ್ ಪ್ರಕಾರ ಒಟ್ಟುಗಳು ಸ್ವಚ್ಛವಾಗಿ ಒಟ್ಟುಗೂಡುತ್ತವೆ.' },
        { title: 'ಬಿಲ್ ಮಾಡಬಹುದಾದ ವರ್ಸಸ್ ಆಂತರಿಕ ವಿಭಜನೆ', desc: 'ಎಂಟ್ರಿಗಳನ್ನು ಬಿಲ್ ಮಾಡಬಹುದಾದ ಎಂದು ಫ್ಲ್ಯಾಗ್ ಮಾಡಿ; ಸಾರಾಂಶಗಳು ಬಿಲ್ ಮಾಡಬಹುದಾದ ಒಟ್ಟುಗಳನ್ನು ಪ್ರತ್ಯೇಕವಾಗಿ ತೋರಿಸುತ್ತವೆ ಇದರಿಂದ ಇನ್‌ವಾಯ್ಸಿಂಗ್ ಒಂದೇ ನೋಟದಲ್ಲಿ ಆಗುತ್ತದೆ.' },
        { title: 'ಇನ್‌ವಾಯ್ಸ್-ಸಿದ್ಧ ಮಾಸಿಕ ವ್ಯೂ', desc: 'ಯಾವುದೇ ತಿಂಗಳಿಗೆ ಕ್ಲೈಂಟ್ ಪ್ರಕಾರ ಗುಂಪುಗೊಳಿಸಿದ ಗಂಟೆಗಳು, ನಿಮ್ಮ ಗಂಟೆಗೆ-ದರ ಅನ್ವಯಿಸಲಾಗಿದೆ — ಇನ್‌ವಾಯ್ಸ್‌ನಲ್ಲಿ ಹೋಗುವ ಸಂಖ್ಯೆ.' },
      ],
      promptExample: 'ಫ್ರೀಲ್ಯಾನ್ಸರ್‌ಗಾಗಿ ಟೈಮ್ ಟ್ರ್ಯಾಕಿಂಗ್ ವೆಬ್ ಆ್ಯಪ್ ರಚಿಸಿ: ಕ್ಲೈಂಟ್, ಪ್ರಾಜೆಕ್ಟ್ ಮತ್ತು ಟಿಪ್ಪಣಿಗಳೊಂದಿಗೆ ಎಂಟ್ರಿಗಳನ್ನು ಉಳಿಸುವ ಪ್ರಾರಂಭ/ನಿಲ್ಲಿಸು ಟೈಮರ್ ಇರುವ Timer ಪೇಜ್; ಪ್ರತಿಯೊಂದಕ್ಕೂ ಗಂಟೆಗೆ-ದರ ಮತ್ತು ಅವರ ಪ್ರಾಜೆಕ್ಟ್‌ಗಳೊಂದಿಗೆ ಕ್ಲೈಂಟ್‌ಗಳನ್ನು ನಿರ್ವಹಿಸುವ Clients ಪೇಜ್; ಮತ್ತು ಆಯ್ದ ತಿಂಗಳಿಗೆ ಕ್ಲೈಂಟ್ ಪ್ರಕಾರ ಗುಂಪುಗೊಳಿಸಿದ ಗಂಟೆಗಳು ಮತ್ತು ಗಳಿಕೆಗಳನ್ನು, ಬಿಲ್ ಮಾಡಬಹುದಾದ ಮತ್ತು ಬಿಲ್-ಅಲ್ಲದ ಬೇರ್ಪಡಿಸಿದ Reports ಪೇಜ್.',
      faqs: [
        { q: 'ನಾನು ಎಷ್ಟು ಇನ್‌ವಾಯ್ಸ್ ಮಾಡಬೇಕು ಎಂದು ಇದು ಲೆಕ್ಕ ಹಾಕಬಹುದೇ?', a: 'ಹೌದು — ಪ್ರತಿ ಕ್ಲೈಂಟ್‌ಗೆ ಗಂಟೆಗೆ-ದರ ನೀಡಿ ಮತ್ತು ನೀವು ಆಯ್ಕೆ ಮಾಡುವ ಯಾವುದೇ ದಿನಾಂಕ ವ್ಯಾಪ್ತಿಗೆ ವರದಿಗಳ ಪೇಜ್ ಬಿಲ್ ಮಾಡಬಹುದಾದ ಗಂಟೆಗಳನ್ನು ದರದಿಂದ ಗುಣಿಸುತ್ತದೆ.' },
        { q: 'ನನ್ನ ಸಮಯ ಡೇಟಾ ಎಲ್ಲಿ ಸಂಗ್ರಹವಾಗುತ್ತದೆ?', a: 'ನಿಮ್ಮ ಆ್ಯಪ್‌ನ ಸ್ವಂತ Postgres ಡೇಟಾಬೇಸ್‌ನಲ್ಲಿ (Supabase), ಪ್ರಕಟಿಸುವ ಮೊದಲು ಲೈವ್ ಸ್ಕ್ಯಾನ್ ಮಾಡಿದ ರೋ-ಲೆವೆಲ್ ಸೆಕ್ಯುರಿಟಿಯೊಂದಿಗೆ — ನಿಮ್ಮ ಗಂಟೆಗಳು ನಿಮ್ಮದು, ನಿಮ್ಮ ಇನ್‌ಫ್ರಾಸ್ಟ್ರಕ್ಚರ್‌ನಲ್ಲಿ.' },
        { q: 'ನಾನು Toggl ಅಥವಾ ಸ್ಪ್ರೆಡ್‌ಶೀಟ್‌ನಿಂದ ಇತಿಹಾಸವನ್ನು ಆಮದು ಮಾಡಬಹುದೇ?', a: 'ಚಾಟ್‌ನಲ್ಲಿ ಕೇಳುವ ಮೂಲಕ CSV ಆಮದು ಪೇಜ್ ಸೇರಿಸಿ — ನಿಮ್ಮ ಎಕ್ಸ್‌ಪೋರ್ಟ್‌ನ ಕಾಲಮ್‌ಗಳನ್ನು ವಿವರಿಸಿ ಮತ್ತು ಆ್ಯಪ್ ಅವುಗಳನ್ನು ನಿಮ್ಮ ಎಂಟ್ರಿಗಳ ಟೇಬಲ್‌ಗೆ ಮ್ಯಾಪ್ ಮಾಡುತ್ತದೆ.' },
        { q: 'ಇದು ನಿಜವಾಗಿಯೂ ಟೈಮ್-ಟ್ರ್ಯಾಕರ್ ಚಂದಾದಾರಿಕೆಗಿಂತ ಅಗ್ಗವೇ?', a: 'ನೀವು ಇದನ್ನು ಉಚಿತ ಮಾಸಿಕ ಕ್ರೆಡಿಟ್‌ಗಳೊಂದಿಗೆ ಒಮ್ಮೆ ನಿರ್ಮಿಸುತ್ತೀರಿ ಮತ್ತು ಇದು ನಿಮ್ಮ ಸ್ವಂತ ಆ್ಯಪ್ ಆಗಿ ಚಲಿಸುತ್ತದೆ — ಯಾವುದೇ ಪ್ರತಿ-ತಿಂಗಳ ಟ್ರ್ಯಾಕರ್ ಶುಲ್ಕವಿಲ್ಲ, ಮತ್ತು ಬದಲಾವಣೆಗಳು ಬೇಕಾದಾಗ ಎಡಿಟ್‌ಗಳಿಗೆ 2 ಕ್ರೆಡಿಟ್‌ಗಳು ಖರ್ಚಾಗುತ್ತವೆ.' },
      ],
    },
    'team-task-manager': {
      h1: 'AI ಮೂಲಕ ಟೀಮ್ ಟಾಸ್ಕ್ ಮ್ಯಾನೇಜರ್ ರಚಿಸಿ',
      metaTitle: 'AI ಮೂಲಕ ಟೀಮ್ ಟಾಸ್ಕ್ ಮ್ಯಾನೇಜ್‌ಮೆಂಟ್ ಆ್ಯಪ್ ರಚಿಸಿ',
      metaDesc: 'ನಿಮ್ಮ ತಂಡಕ್ಕಾಗಿ ಕಾನ್‌ಬಾನ್-ಶೈಲಿಯ ಟಾಸ್ಕ್ ಮ್ಯಾನೇಜರ್ ರಚಿಸಿ — ಬೋರ್ಡ್‌ಗಳು, ನಿಯೋಜಿತರು, ಗಡುವು ದಿನಾಂಕಗಳು, ಮತ್ತು ಕಾಮೆಂಟ್‌ಗಳು — ಸರಳ-ಇಂಗ್ಲಿಷ್ ವಿವರಣೆಯಿಂದ ಜನರೇಟ್. ಪ್ರಾರಂಭಿಸಲು ಉಚಿತ.',
      tagline: 'ನಿಮ್ಮ ತಂಡ ನಿಜವಾಗಿ ಕೆಲಸ ಮಾಡುವ ರೀತಿಗೆ ಹೊಂದುವ ಕಾನ್‌ಬಾನ್ ಬೋರ್ಡ್ — ನಿಮ್ಮ ಕಾಲಮ್‌ಗಳು, ನಿಮ್ಮ ಲೇಬಲ್‌ಗಳು, ನಿಮ್ಮ ನಿಯಮಗಳು — ಬೇರೊಬ್ಬರದನ್ನು ಬಾಡಿಗೆಗೆ ತೆಗೆದುಕೊಳ್ಳುವ ಬದಲು.',
      body: [
        'ಸಣ್ಣ ತಂಡಗಳು ಎರಡು ಕೆಟ್ಟ ಆಯ್ಕೆಗಳ ನಡುವೆ ಸಿಲುಕಿಕೊಂಡಿವೆ: ತಂಡ ಅರ್ಧ-ಬಳಸುವ ಪ್ರತಿ-ಸೀಟ್ ಬೆಲೆಯ ಭಾರೀ ಪ್ರಾಜೆಕ್ಟ್ ಟೂಲ್‌ಗಳು, ಮತ್ತು ಇಬ್ಬರು ಒಟ್ಟಿಗೆ ಎಡಿಟ್ ಮಾಡಿದ ಕ್ಷಣ ಒಡೆಯುವ ಹಂಚಿಕೊಂಡ ಸ್ಪ್ರೆಡ್‌ಶೀಟ್‌ಗಳು. ಹೆಚ್ಚಿನ ಐದು-ಜನರ ತಂಡಗಳಿಗೆ ಬೇಕಾದದ್ದು ಒಂದೇ ಬೋರ್ಡ್‌ನಲ್ಲಿ ಹೊಂದುತ್ತದೆ — ಬೋರ್ಡ್ ಅವರ ಭಾಷೆಯನ್ನು ಮಾತನಾಡಿದರೆ.',
        'ನಿಮ್ಮ ತಂಡ ಹೇಗೆ ಕೆಲಸ ಮಾಡುತ್ತದೆ ಎಂದು WyberAi ಗೆ ಹೇಳಿ — ಕೆಲಸ ಹಾದುಹೋಗುವ ಹಂತಗಳು, ಯಾರಿಗೆ ಏನು ನೋಡಬೇಕು, "ಮುಗಿದಿದೆ" ಟಾಸ್ಕ್‌ಗೆ ಏನು ಬೇಕು — ಮತ್ತು ಇದು ಆ ನಿಖರ ಆಕಾರದ ಟಾಸ್ಕ್ ಮ್ಯಾನೇಜರ್ ಅನ್ನು ಜನರೇಟ್ ಮಾಡುತ್ತದೆ: ನಿಜವಾದ ಡೇಟಾಬೇಸ್‌ನಿಂದ ಬೆಂಬಲಿತ ಕಾನ್‌ಬಾನ್ ಬೋರ್ಡ್, ಪ್ರತಿ-ಸದಸ್ಯ ನಿಯೋಜನೆ, ಮತ್ತು ಚಟುವಟಿಕೆ ಟ್ರೈಲ್. ಇದು ಪ್ರಮಾಣೀಕರಣ ಮತ್ತು ಸೆಕ್ಯುರಿಟಿ ಸ್ಕ್ಯಾನ್‌ನೊಂದಿಗೆ ಬರುತ್ತದೆ, ಆದ್ದರಿಂದ ತಂಡವನ್ನು ಆಹ್ವಾನಿಸುವುದು ಮೊದಲ ದಿನದಿಂದ ಸುರಕ್ಷಿತ.',
      ],
      features: [
        { title: 'ನಿಮ್ಮ ಕಾಲಮ್‌ಗಳೊಂದಿಗೆ ಕಾನ್‌ಬಾನ್', desc: 'Backlog → In Progress → Review → Done, ಅಥವಾ ನಿಮ್ಮ ಫ್ಲೋ ಏನೇ ಆಗಿರಲಿ — ಬೋರ್ಡ್ ನಿಮ್ಮ ವಿವರಣೆಯಿಂದ ಜನರೇಟ್ ಆಗುತ್ತದೆ.' },
        { title: 'ನಿಯೋಜಿತರು ಮತ್ತು ಗಡುವು ದಿನಾಂಕಗಳು', desc: 'ಪ್ರತಿ ಟಾಸ್ಕ್ ಒಬ್ಬ ಮಾಲೀಕ ಮತ್ತು ಗಡುವನ್ನು ಹೊಂದಿದೆ; My Tasks ವ್ಯೂ ಪ್ರತಿ ವ್ಯಕ್ತಿಗೆ ಬಾಕಿ ಇರುವುದಕ್ಕೆ ಬೋರ್ಡ್ ಅನ್ನು ಫಿಲ್ಟರ್ ಮಾಡುತ್ತದೆ.' },
        { title: 'ಟಾಸ್ಕ್‌ಗಳಲ್ಲಿ ಕಾಮೆಂಟ್‌ಗಳು', desc: 'ಚರ್ಚೆ ಟಾಸ್ಕ್‌ನಲ್ಲೇ ಇರುತ್ತದೆ, ಆದ್ದರಿಂದ ಸಂದರ್ಭ ಚಾಟ್ ಥ್ರೆಡ್‌ಗಳಲ್ಲಿ ಕಳೆದುಹೋಗುವುದನ್ನು ನಿಲ್ಲಿಸುತ್ತದೆ.' },
        { title: 'ಟೀಮ್ ಆಥ್ ಅಂತರ್ನಿರ್ಮಿತ', desc: 'ಸೈನ್-ಇನ್ ಮತ್ತು ಸದಸ್ಯತ್ವ ವೈರ್ ಆಗಿ ಬರುತ್ತವೆ, ನೀವು ಲಿಂಕ್ ಹಂಚಿಕೊಳ್ಳುವ ಮೊದಲು ಲೈವ್ ಸ್ಕ್ಯಾನ್‌ನಿಂದ ಪರಿಶೀಲಿಸಿದ ರೋ-ಲೆವೆಲ್ ಸೆಕ್ಯುರಿಟಿಯೊಂದಿಗೆ.' },
      ],
      promptExample: 'ಟೀಮ್ ಟಾಸ್ಕ್ ಮ್ಯಾನೇಜರ್ ವೆಬ್ ಆ್ಯಪ್ ರಚಿಸಿ: Backlog, This Week, In Progress, ಮತ್ತು Done ಕಾಲಮ್‌ಗಳಿರುವ ಕಾನ್‌ಬಾನ್ Board ಪೇಜ್, ಇಲ್ಲಿ ಟಾಸ್ಕ್‌ಗಳಿಗೆ ಶೀರ್ಷಿಕೆ, ವಿವರಣೆ, ನಿಯೋಜಿತ, ಗಡುವು ದಿನಾಂಕ, ಮತ್ತು ಆದ್ಯತೆ ಇರುತ್ತದೆ; ಸೈನ್-ಇನ್ ಆದ ಬಳಕೆದಾರರ ಟಾಸ್ಕ್‌ಗಳನ್ನು ಗಡುವು ದಿನಾಂಕದ ಪ್ರಕಾರ ವಿಂಗಡಿಸಿ ತೋರಿಸುವ My Tasks ಪೇಜ್; ಮತ್ತು ಥ್ರೆಡೆಡ್ ಕಾಮೆಂಟ್‌ಗಳಿರುವ ಟಾಸ್ಕ್ ವಿವರ. ಟೀಮ್ ಸದಸ್ಯ ನಿರ್ವಹಣೆಯನ್ನು ಸೇರಿಸಿ.',
      faqs: [
        { q: 'ಪ್ರತಿ ತಂಡದ ಸದಸ್ಯರಿಗೆ ತಮ್ಮದೇ ಲಾಗಿನ್ ಇರಬಹುದೇ?', a: 'ಹೌದು — ಆ್ಯಪ್ ಪ್ರಮಾಣೀಕರಣ ಸೇರಿಸಿ ಜನರೇಟ್ ಆಗುತ್ತದೆ, ಮತ್ತು ಸದಸ್ಯರ ಟೇಬಲ್ ಯಾರು ಬೋರ್ಡ್ ನೋಡಬಹುದು ಮತ್ತು ಎಡಿಟ್ ಮಾಡಬಹುದು ಎಂದು ನಿಯಂತ್ರಿಸುತ್ತದೆ.' },
        { q: 'ತಂಡ ಬಳಸಲು ಪ್ರಾರಂಭಿಸಿದ ನಂತರ ನಾನು ವರ್ಕ್‌ಫ್ಲೋ ಬದಲಾಯಿಸಬಹುದೇ?', a: 'ಹೌದು. ಚಾಟ್‌ನಲ್ಲಿ ಕೇಳಿ — "Blocked ಕಾಲಮ್ ಸೇರಿಸಿ" ಅಥವಾ "Done ಮೊದಲು ಪರಿಶೀಲನಾ ಪಟ್ಟಿ ಅಗತ್ಯ" — ಮತ್ತು ಅಸ್ತಿತ್ವದಲ್ಲಿರುವ ಟಾಸ್ಕ್‌ಗಳನ್ನು ಕಳೆದುಕೊಳ್ಳದೆ ಬೋರ್ಡ್ ಅಪ್‌ಡೇಟ್ ಆಗುತ್ತದೆ.' },
        { q: 'ಇದು Trello ಬಳಸುವುದಕ್ಕಿಂತ ಹೇಗೆ ಭಿನ್ನವಾಗಿದೆ?', a: 'ಇದು ನಿಮ್ಮ ಸ್ವಂತ ಆ್ಯಪ್: ಯಾವುದೇ ಪ್ರತಿ-ಸೀಟ್ ಬೆಲೆ ಇಲ್ಲ, ಯಾವುದೇ ಫೀಚರ್ ಗೇಟ್‌ಗಳಿಲ್ಲ, ಮತ್ತು ವರ್ಕ್‌ಫ್ಲೋ ಲೇಬಲ್‌ಗಳು ಮತ್ತು ಪವರ್-ಅಪ್‌ಗಳಿಂದ ಅಂದಾಜು ಮಾಡುವ ಬದಲು ನಿಮ್ಮ ತಂಡಕ್ಕೆ ರೂಪುಗೊಂಡಿದೆ.' },
        { q: 'ತಂಡದ ಡೇಟಾ ಸುರಕ್ಷಿತವೇ?', a: 'ಪ್ರತಿ WyberAi ಆ್ಯಪ್ ಪ್ರಕಟಣೆಗೆ ಮೊದಲು ಲೈವ್ ಡೇಟಾಬೇಸ್ ಸೆಕ್ಯುರಿಟಿ ಸ್ಕ್ಯಾನ್ ಪಡೆಯುತ್ತದೆ, ಇದು ದಾಳಿಕೋರನಂತೆ ನಿಮ್ಮ ಆ್ಯಪ್ ಅನ್ನು ಪರೀಕ್ಷಿಸುತ್ತದೆ, ಗಂಭೀರ ಸೋರಿಕೆಗಳು ಗೇಟ್ ಅನ್ನು ತಡೆಯುತ್ತವೆ.' },
      ],
    },
    'job-application-tracker': {
      h1: 'AI ಮೂಲಕ ಉದ್ಯೋಗ ಅರ್ಜಿ ಟ್ರ್ಯಾಕರ್ ರಚಿಸಿ',
      metaTitle: 'AI ಮೂಲಕ ಉದ್ಯೋಗ ಅರ್ಜಿ ಟ್ರ್ಯಾಕರ್ ಆ್ಯಪ್ ರಚಿಸಿ',
      metaDesc: 'ಒಂದೇ ಬೋರ್ಡ್‌ನಲ್ಲಿ ಪ್ರತಿ ಅರ್ಜಿ, ಸಂದರ್ಶನ ಹಂತ, ಮತ್ತು ಫಾಲೋ-ಅಪ್ ಟ್ರ್ಯಾಕ್ ಮಾಡಿ — ಸರಳ ಇಂಗ್ಲಿಷ್‌ನಿಂದ ಜನರೇಟ್ ಆದ ಉದ್ಯೋಗ ಹುಡುಕಾಟ ಟ್ರ್ಯಾಕರ್, ಗೊಂದಲಮಯ ಸ್ಪ್ರೆಡ್‌ಶೀಟ್ ಅಲ್ಲ.',
      tagline: 'ಪ್ರತಿ ಅರ್ಜಿ, ಅದರ ಹಂತ, ಮತ್ತು ನೀವು ಕೊನೆಯದಾಗಿ ಯಾವಾಗ ಕೇಳಿದ್ದೀರಿ — ವಾಸ್ತವಕ್ಕಿಂತ ಮೂರು ಟ್ಯಾಬ್‌ಗಳ ಹಿಂದೆ ಇರುವ ಸ್ಪ್ರೆಡ್‌ಶೀಟ್ ಬದಲು ಒಂದೇ ಬೋರ್ಡ್.',
      body: [
        'ಗಂಭೀರವಾದ ಉದ್ಯೋಗ ಹುಡುಕಾಟ ಸ್ಪ್ರೆಡ್‌ಶೀಟ್ ಹಿಡಿದಿಡಲು ಬಯಸುವುದಕ್ಕಿಂತ ಹೆಚ್ಚಿನ ಸ್ಥಿತಿಯನ್ನು ಉತ್ಪಾದಿಸುತ್ತದೆ: ರೆಸ್ಯೂಮೆಯ ಯಾವ ಆವೃತ್ತಿ ಎಲ್ಲಿಗೆ ಹೋಯಿತು, ಆ ರಿಕ್ರೂಟರ್ ಕರೆ ಒಂದು ಸ್ಕ್ರೀನ್ ಆಗಿತ್ತೋ ಅಥವಾ ನಿಜವಾದ ಸಂದರ್ಶನವೋ, ಮತ್ತು ಹದಿನಾಲ್ಕು "ಇನ್ನೂ ಅಭ್ಯರ್ಥಿಗಳನ್ನು ಪರಿಶೀಲಿಸುತ್ತಿದ್ದೇವೆ" ಇಮೇಲ್‌ಗಳಲ್ಲಿ ಯಾವುದನ್ನು ಈ ವಾರ ನಿಜವಾಗಿ ಫಾಲೋ-ಅಪ್ ಮಾಡಬೇಕು. ಸ್ಪ್ರೆಡ್‌ಶೀಟ್ ನೀವು ಮಾತ್ರ ಅರ್ಥಮಾಡಿಕೊಳ್ಳಬಹುದಾದ ಬಣ್ಣದ ಸೆಲ್‌ಗಳಾಗಿ ಕುಸಿಯುತ್ತದೆ.',
        'ನಿಮ್ಮ ಹುಡುಕಾಟವನ್ನು ವಿವರಿಸಿ ಮತ್ತು WyberAi ಅದರ ಸುತ್ತ ಟ್ರ್ಯಾಕರ್ ಅನ್ನು ನಿರ್ಮಿಸುತ್ತದೆ: Applied ಇಂದ Offer ವರೆಗೆ ಪೈಪ್‌ಲೈನ್ ಬೋರ್ಡ್, ಪಾತ್ರ, ಸಂಪರ್ಕ, ಮತ್ತು ರೆಸ್ಯೂಮೆ ಆವೃತ್ತಿ ಜೋಡಿಸಿದ ಪ್ರತಿ-ಅರ್ಜಿ ದಾಖಲೆ, ಮತ್ತು ನಿಮ್ಮ ಸ್ವಂತ ಮಿತಿಯನ್ನು ದಾಟಿ ಮೌನವಾಗಿರುವ ಯಾವುದನ್ನಾದರೂ ಮೇಲ್ಮೈಗೆ ತರುವ ಫಾಲೋ-ಅಪ್ ವ್ಯೂ. ಇಷ್ಟು ಒತ್ತಡದ ಹುಡುಕಾಟ ಅರ್ಹವಾಗಿರುವ ಏಕೈಕ ವ್ಯವಸ್ಥೆ ಇದು — ಒಂದು ಅಪರಾಹ್ನದಲ್ಲಿ ನಿರ್ಮಿಸಲಾಗಿದೆ, ಅಡ್ಡ ಯೋಜನೆಯಾಗಿ ನಿರ್ವಹಿಸಲಾಗಿಲ್ಲ.',
      ],
      features: [
        { title: 'ಹಂತದ ಪ್ರಕಾರ ಪೈಪ್‌ಲೈನ್', desc: 'Applied, Screening, Interview, Offer, Rejected — ಒಂದು ಕಾನ್‌ಬಾನ್ ಬೋರ್ಡ್ ಇದರಿಂದ ಸಂಪೂರ್ಣ ಹುಡುಕಾಟ ಒಂದೇ ನೋಟದಲ್ಲಿ ಗೋಚರಿಸುತ್ತದೆ.' },
        { title: 'ಪ್ರತಿ-ಅರ್ಜಿ ದಾಖಲೆ', desc: 'ಕಂಪನಿ, ಪಾತ್ರ, ರೆಸ್ಯೂಮೆ ಆವೃತ್ತಿ, ರೆಫರಲ್ ಸಂಪರ್ಕ, ಮತ್ತು ಸಂಬಳ ವ್ಯಾಪ್ತಿ, ಅದು ಸೇರಿದ ಕಾರ್ಡ್‌ಗೆ ಜೋಡಿಸಲಾಗಿದೆ.' },
        { title: 'ಫಾಲೋ-ಅಪ್ ರಾಡಾರ್', desc: 'ನಿಗದಿತ ದಿನಗಳ ಸಂಖ್ಯೆಯನ್ನು ದಾಟಿ ಯಾವುದೇ ಅಪ್‌ಡೇಟ್ ಇಲ್ಲದ ಅರ್ಜಿಗಳು ಸ್ವಯಂಚಾಲಿತವಾಗಿ ಮೇಲ್ಮೈಗೆ ಬರುತ್ತವೆ — ತಣ್ಣಗಾಗುತ್ತಿರುವವು.' },
        { title: 'ಸಂದರ್ಶನ ಟಿಪ್ಪಣಿಗಳು', desc: 'ಪ್ರತಿ ಸುತ್ತಿನ ನಂತರ ತಕ್ಷಣ ಏನು ಕೇಳಲಾಯಿತು ಮತ್ತು ಹೇಗೆ ನಡೆಯಿತು ಎಂದು ಲಾಗ್ ಮಾಡಿ, ಇದು ಇನ್ನೂ ಮುಂದಿನದಕ್ಕೆ ಮುಖ್ಯವಾಗುವಷ್ಟು ತಾಜಾವಾಗಿರುವಾಗ.' },
      ],
      promptExample: 'ಉದ್ಯೋಗ ಅರ್ಜಿ ಟ್ರ್ಯಾಕರ್ ವೆಬ್ ಆ್ಯಪ್ ರಚಿಸಿ: Applied, Screening, Interview, Offer, Rejected ಕಾನ್‌ಬಾನ್ ಕಾಲಮ್‌ಗಳಿರುವ Board ಪೇಜ್, ಇಲ್ಲಿ ಪ್ರತಿ ಕಾರ್ಡ್ ಕಂಪನಿ, ಪಾತ್ರ, ಮತ್ತು ಅರ್ಜಿ ಸಲ್ಲಿಸಿದ ದಿನಾಂಕವನ್ನು ತೋರಿಸುತ್ತದೆ; ಸಂಪರ್ಕ ಹೆಸರು, ಬಳಸಿದ ರೆಸ್ಯೂಮೆ ಆವೃತ್ತಿ, ಸಂಬಳ ವ್ಯಾಪ್ತಿ, ಮತ್ತು ಮುಕ್ತ-ಪಠ್ಯ ಸಂದರ್ಶನ ಟಿಪ್ಪಣಿಗಳಿರುವ ಕಾರ್ಡ್ ವಿವರ ವ್ಯೂ; ಮತ್ತು ಕಳೆದ 10 ದಿನಗಳಲ್ಲಿ ಯಾವುದೇ ಸ್ಥಿತಿ ಬದಲಾವಣೆ ಇಲ್ಲದ ಅರ್ಜಿಗಳನ್ನು ಪಟ್ಟಿ ಮಾಡುವ Follow-ups ಪೇಜ್.',
      faqs: [
        { q: 'ಇದು ಫಾಲೋ-ಅಪ್ ಮಾಡಲು ನನಗೆ ನೆನಪಿಸಬಹುದೇ?', a: 'ನೀವು ಆ್ಯಪ್ ತೆರೆಯುವ ಪ್ರತಿ ಬಾರಿ Follow-ups ವ್ಯೂ ನಿಮ್ಮ ಮಿತಿಯನ್ನು ದಾಟಿದ ಯಾವುದನ್ನಾದರೂ ಪಟ್ಟಿ ಮಾಡುತ್ತದೆ; ನಿಮಗೆ ಪುಶ್ ಬೇಕಾದರೆ ಇಮೇಲ್ ಜ್ಞಾಪನೆಗಳನ್ನು ಸೇರಿಸಲು ಚಾಟ್‌ಗೆ ಕೇಳಿ.' },
        { q: 'ನಾನು ಎಲ್ಲಿ ಯಾವ ರೆಸ್ಯೂಮೆ ಆವೃತ್ತಿಯನ್ನು ಕಳುಹಿಸಿದೆ ಎಂದು ಟ್ರ್ಯಾಕ್ ಮಾಡಬಹುದೇ?', a: 'ಹೌದು — ಪ್ರತಿ ಅರ್ಜಿಗೆ ರೆಸ್ಯೂಮೆ-ಆವೃತ್ತಿ ಫೀಲ್ಡ್ ಜೋಡಿಸಿ ಇದರಿಂದ ಮೂರು ವಾರಗಳ ನಂತರ ಅವರು ಮತ್ತೆ ಕರೆ ಮಾಡಿದರೆ ರಿಕ್ರೂಟರ್ ಏನನ್ನು ನೋಡಿದ್ದಾರೆ ಎಂದು ನಿಮಗೆ ನಿಖರವಾಗಿ ತಿಳಿಯುತ್ತದೆ.' },
        { q: 'ನನ್ನ ಹುಡುಕಾಟದ ಅಂಕಿಅಂಶಗಳನ್ನು ನಾನು ನೋಡಬಹುದೇ?', a: 'ಅಂಕಿಅಂಶಗಳ ವ್ಯೂ ಕೇಳಿ — ಪ್ರತಿಕ್ರಿಯೆ ದರ, ಪ್ರತಿ ಹಂತದಲ್ಲಿ ಸರಾಸರಿ ಸಮಯ, ಪ್ರತಿ-ವಾರ ಅರ್ಜಿಗಳು — ನಿಮ್ಮ ಸ್ವಂತ ಡೇಟಾದಿಂದ ಲೆಕ್ಕಹಾಕಲಾಗಿದೆ.' },
        { q: 'ಇದು ಸ್ಪ್ರೆಡ್‌ಶೀಟ್‌ಗಿಂತ ಉತ್ತಮವೇ?', a: 'ಒಂದು ಅರ್ಜಿ ಮೌನವಾದಾಗ ಸ್ಪ್ರೆಡ್‌ಶೀಟ್ ನಿಮಗೆ ಎಚ್ಚರಿಸುವುದಿಲ್ಲ ಅಥವಾ ಪ್ರತಿ-ಸುತ್ತಿಗೆ ರಚನಾತ್ಮಕ ಸಂದರ್ಶನ ಟಿಪ್ಪಣಿಗಳನ್ನು ಇಡುವುದಿಲ್ಲ — ಈ ಟ್ರ್ಯಾಕರ್ ಎರಡನ್ನೂ ಸ್ಥಳೀಯವಾಗಿ ಮಾಡುತ್ತದೆ.' },
      ],
    },
    'reading-list-app': {
      h1: 'AI ಮೂಲಕ ರೀಡಿಂಗ್ ಲಿಸ್ಟ್ ಆ್ಯಪ್ ರಚಿಸಿ',
      metaTitle: 'AI ಮೂಲಕ ರೀಡಿಂಗ್ ಲಿಸ್ಟ್ ಮತ್ತು ಬುಕ್ ಟ್ರ್ಯಾಕರ್ ಆ್ಯಪ್ ರಚಿಸಿ',
      metaDesc: 'ನಿಮ್ಮ ಓದಬೇಕಾದ-ರಾಶಿಯನ್ನು ಟ್ರ್ಯಾಕ್ ಮಾಡಿ, ರೇಟಿಂಗ್‌ಗಳೊಂದಿಗೆ ಮುಗಿದ ಪುಸ್ತಕಗಳನ್ನು ಲಾಗ್ ಮಾಡಿ, ವಾರ್ಷಿಕ ಓದುವ ಗುರಿಯನ್ನು ತಲುಪಿ — ಸರಳ ಇಂಗ್ಲಿಷ್‌ನಿಂದ ನಿರ್ಮಿಸಲಾದ ಬುಕ್ ಟ್ರ್ಯಾಕರ್, ನಿಮ್ಮದೇ ಆಗಿ ಇಟ್ಟುಕೊಳ್ಳಲು.',
      tagline: 'ಓದಬೇಕಾದ-ರಾಶಿ, ನೀವು ಈಗ ಏನನ್ನು ಓದುತ್ತಿದ್ದೀರಿ, ಮತ್ತು ವಾರ್ಷಿಕ ಎಣಿಕೆ — ನಿಮ್ಮ ವೇಗದ ಬಗ್ಗೆ ಗಿಲ್ಟ್-ಟ್ರಿಪ್ ಮಾಡುವ ಸಾಮಾಜಿಕ ಫೀಡ್ ಇಲ್ಲದೆ.',
      body: [
        'Goodreads ಪುಸ್ತಕ ಟ್ರ್ಯಾಕಿಂಗ್ ಅನ್ನು ನೀವು ಕೇಳದ ಸಾಮಾಜಿಕ ನೆಟ್‌ವರ್ಕ್‌ನಲ್ಲಿ ಸುತ್ತುವ ಮೂಲಕ ಪರಿಹರಿಸುತ್ತದೆ, ಹೆಚ್ಚಿನ ರೀಡಿಂಗ್-ಟ್ರ್ಯಾಕರ್ ಆ್ಯಪ್‌ಗಳು ಅನ್ವೇಷಣೆಯನ್ನು ಪರಿಹರಿಸುತ್ತವೆ, ನಿಜವಾದ ಸಮಸ್ಯೆಯನ್ನಲ್ಲ: ನೀವು ಓದಲು ಉದ್ದೇಶಿಸಿದ ಪುಸ್ತಕಗಳ ಬೆಳೆಯುತ್ತಿರುವ ಪಟ್ಟಿ, ಪ್ರಸ್ತುತ ಪುಸ್ತಕವನ್ನು ಎಲ್ಲಿ ನಿಲ್ಲಿಸಿದ್ದೀರಿ ಎಂಬ ನೆನಪಿಲ್ಲ, ಮತ್ತು ಇದು 20-ಪುಸ್ತಕದ ವರ್ಷವೋ ಅಥವಾ 50-ಪುಸ್ತಕದ ವರ್ಷವೋ ಎಂಬ ಪ್ರಾಮಾಣಿಕ ಅರಿವು ಇಲ್ಲ.',
        'ನೀವು ಹೇಗೆ ಓದುತ್ತೀರಿ ಎಂದು WyberAi ಗೆ ಹೇಳಿ — ಭೌತಿಕ, ಇಬುಕ್, ಆಡಿಯೋಬುಕ್, ಅಥವಾ ಮೂರೂ — ಮತ್ತು ಇದು ಅದಕ್ಕೆ ತಕ್ಕಂತೆ ಟ್ರ್ಯಾಕರ್ ನಿರ್ಮಿಸುತ್ತದೆ: ನೀವು ಮನಸೋಇಚ್ಛೆ ಸೇರಿಸುವ ಓದಬೇಕಾದ-ಶೆಲ್ಫ್, ಸೆಕೆಂಡುಗಳಲ್ಲಿ ನೀವು ಅಪ್‌ಡೇಟ್ ಮಾಡುವ ಪೇಜ್ ಅಥವಾ ಶೇಕಡಾವಾರುಗಳೊಂದಿಗೆ ಪ್ರಸ್ತುತ-ಓದುತ್ತಿರುವ ವ್ಯೂ, ಮತ್ತು ನಿಮ್ಮ ಸ್ವಂತ ರೇಟಿಂಗ್ ಮತ್ತು ಭವಿಷ್ಯದ-ನಿಮಗೆ ಟಿಪ್ಪಣಿಯೊಂದಿಗೆ ಮುಗಿದ ಶೆಲ್ಫ್. ವಾರ್ಷಿಕ ಗುರಿ ಕೌಂಟರ್ "ನಾನು ಹೆಚ್ಚು ಓದಬೇಕು" ಎಂಬುದನ್ನು ನೀವು ನಿಜವಾಗಿ ಚಲಿಸುವುದನ್ನು ನೋಡಬಹುದಾದ ಸಂಖ್ಯೆಯಾಗಿ ಬದಲಾಯಿಸುತ್ತದೆ.',
      ],
      features: [
        { title: 'ಓದಬೇಕಾದ-ಶೆಲ್ಫ್', desc: 'ಯಾರಾದರೂ ಪುಸ್ತಕವನ್ನು ಉಲ್ಲೇಖಿಸಿದ ಕ್ಷಣ ಸೇರಿಸಿ — ಶೀರ್ಷಿಕೆ, ಲೇಖಕ, ಮತ್ತು ನೀವು ಅದನ್ನು ಏಕೆ ಓದಲು ಬಯಸುತ್ತೀರಿ.' },
        { title: 'ಪ್ರಸ್ತುತ ಓದುವ ಪ್ರಗತಿ', desc: 'ನೀವು ಮುಂದುವರಿದಂತೆ ಪೇಜ್ ಸಂಖ್ಯೆ ಅಥವಾ ಶೇಕಡಾವಾರು ಅಪ್‌ಡೇಟ್ ಮಾಡಿ; ನೀವು ಪ್ರತಿ ಪುಸ್ತಕದಲ್ಲಿ ಎಷ್ಟು ದೂರ ಇದ್ದೀರಿ ಎಂದು ಆ್ಯಪ್ ತೋರಿಸುತ್ತದೆ.' },
        { title: 'ರೇಟಿಂಗ್‌ಗಳೊಂದಿಗೆ ಮುಗಿದ ಶೆಲ್ಫ್', desc: 'ನಿಮ್ಮ ಸ್ವಂತ ಸ್ಟಾರ್ ರೇಟಿಂಗ್ ಮತ್ತು ಪ್ರತಿ-ಪುಸ್ತಕಕ್ಕೆ ಸಣ್ಣ ಟಿಪ್ಪಣಿ — ನಂತರ ಪುಸ್ತಕಗಳನ್ನು ಶಿಫಾರಸು ಮಾಡಲು ನಿಜವಾಗಿ ಸಹಾಯ ಮಾಡುವ ಲಾಗ್.' },
        { title: 'ವಾರ್ಷಿಕ ಓದುವ ಗುರಿ', desc: 'ಪ್ರತಿ-ವರ್ಷ ಪುಸ್ತಕಗಳ ಗುರಿಯನ್ನು ಸೆಟ್ ಮಾಡಿ ಮತ್ತು ಮುಗಿದ ಪುಸ್ತಕಗಳು ಶೆಲ್ಫ್‌ಗೆ ಬಂದಂತೆ ಪ್ರಗತಿ ಬಾರ್ ತುಂಬುವುದನ್ನು ನೋಡಿ.' },
      ],
      promptExample: 'ರೀಡಿಂಗ್ ಲಿಸ್ಟ್ ಮೊಬೈಲ್ ಆ್ಯಪ್ ರಚಿಸಿ: ನಾನು ಶೀರ್ಷಿಕೆ, ಲೇಖಕ, ಮತ್ತು ಫಾರ್ಮ್ಯಾಟ್ (ಭೌತಿಕ/ಇಬುಕ್/ಆಡಿಯೋಬುಕ್) ಜೊತೆ ಪುಸ್ತಕಗಳನ್ನು ಸೇರಿಸುವ To Be Read ಸ್ಕ್ರೀನ್; ನಾನು ಅಪ್‌ಡೇಟ್ ಮಾಡುವ ಪೇಜ್ ಅಥವಾ ಶೇಕಡಾವಾರು ಸ್ಲೈಡರ್‌ನೊಂದಿಗೆ ಪ್ರಗತಿಯಲ್ಲಿರುವ ಪುಸ್ತಕಗಳನ್ನು ತೋರಿಸುವ Currently Reading ಸ್ಕ್ರೀನ್; ನನ್ನ ಸ್ಟಾರ್ ರೇಟಿಂಗ್ ಮತ್ತು ಸಣ್ಣ ಟಿಪ್ಪಣಿಯೊಂದಿಗೆ ಪೂರ್ಣಗೊಂಡ ಪುಸ್ತಕಗಳನ್ನು ಪಟ್ಟಿ ಮಾಡುವ Finished ಸ್ಕ್ರೀನ್; ಮತ್ತು ನಾನು ಸೆಟ್ ಮಾಡಿದ ಗುರಿಯ ವಿರುದ್ಧ ಈ ವರ್ಷ ಮುಗಿದ ಪುಸ್ತಕಗಳನ್ನು ತೋರಿಸುವ Goal ಸ್ಕ್ರೀನ್.',
      faqs: [
        { q: 'ಇದು ಭೌತಿಕ ಪುಸ್ತಕಗಳಿಂದ ಆಡಿಯೋಬುಕ್‌ಗಳನ್ನು ವಿಭಿನ್ನವಾಗಿ ಟ್ರ್ಯಾಕ್ ಮಾಡಬಹುದೇ?', a: 'ಹೌದು — ಪ್ರತಿ ಪುಸ್ತಕಕ್ಕೆ ಫಾರ್ಮ್ಯಾಟ್ ಸೆಟ್ ಮಾಡಿ, ಆಡಿಯೋಬುಕ್‌ಗಳಿಗೆ ಪೇಜ್ ಸಂಖ್ಯೆಗಿಂತ ಶೇಕಡಾವಾರು ಅಥವಾ ಆಲಿಸಿದ ಸಮಯದಿಂದ ಪ್ರಗತಿಯನ್ನು ಟ್ರ್ಯಾಕ್ ಮಾಡಿ.' },
        { q: 'ಇದು ಪುಸ್ತಕಗಳನ್ನು ಶಿಫಾರಸು ಮಾಡುತ್ತದೆಯೇ?', a: 'ಇಲ್ಲ — ಇದು ವೈಯಕ್ತಿಕ ಟ್ರ್ಯಾಕರ್, ಅನ್ವೇಷಣಾ ಫೀಡ್ ಅಲ್ಲ. ಇದು ನಿಮ್ಮ ಸ್ವಂತ ಶೆಲ್ಫ್‌ಗಳನ್ನು ತೋರಿಸುತ್ತದೆ, ಮಾರ್ಕೆಟ್‌ಪ್ಲೇಸ್ ನೀವು ಮುಂದೆ ಏನು ಖರೀದಿಸಬೇಕೆಂದು ಬಯಸುತ್ತದೋ ಅದನ್ನಲ್ಲ.' },
        { q: 'ನಾನು ಪುಸ್ತಕಗಳನ್ನು ಪ್ರಕಾರ ಅಥವಾ ಸರಣಿಯ ಪ್ರಕಾರ ಸಂಘಟಿಸಬಹುದೇ?', a: 'ನಿಮ್ಮ ಪ್ರಾಂಪ್ಟ್‌ನಲ್ಲಿ ಟ್ಯಾಗ್‌ಗಳು ಅಥವಾ ಸರಣಿ ಫೀಲ್ಡ್ ಸೇರಿಸಿ, ಮತ್ತು ಶೆಲ್ಫ್‌ಗಳು ಅವುಗಳ ಪ್ರಕಾರ ಫಿಲ್ಟರ್ ಅಥವಾ ಗುಂಪು ಮಾಡಬಹುದು.' },
        { q: 'ನನ್ನ ಓದುವ ಡೇಟಾ ಖಾಸಗಿಯೇ?', a: 'ಇದು ನಿಮ್ಮ ಸ್ವಂತ ಡೇಟಾಬೇಸ್‌ನಲ್ಲಿ ನಿಮ್ಮ ಸ್ವಂತ ಆ್ಯಪ್ — ನೀವು ನಿರ್ದಿಷ್ಟವಾಗಿ ಒಂದನ್ನು ನಿರ್ಮಿಸದ ಹೊರತು ಯಾವುದನ್ನೂ ಸಾಮಾಜಿಕ ಫೀಡ್‌ಗೆ ಹಂಚಿಕೊಳ್ಳಲಾಗುವುದಿಲ್ಲ.' },
      ],
    },
  },
  te: {
    'habit-tracker-app': {
      h1: 'AIతో అలవాటు ట్రాకర్ యాప్‌ను నిర్మించండి',
      metaTitle: 'AIతో అలవాటు ట్రాకర్ యాప్‌ను నిర్మించండి — కోడ్ లేకుండా',
      metaDesc: 'మీ అలవాటు ట్రాకర్‌ను సాదా ఇంగ్లీష్‌లో వివరించండి మరియు స్ట్రీక్‌లు, రోజువారీ చెక్-ఇన్‌లు, మరియు పురోగతి చార్ట్‌లతో పని చేసే మొబైల్ యాప్‌ను పొందండి. ప్రారంభించడం ఉచితం, కోడ్ అవసరం లేదు.',
      tagline: 'స్ట్రీక్‌లు, రోజువారీ చెక్-ఇన్‌లు, మరియు చైన్‌ను కొనసాగించాలని మీకు అనిపించే పురోగతి వ్యూ — ఒకే ప్రాంప్ట్ నుండి నిర్మించబడింది.',
      body: [
        'అలవాటు యాప్‌లు ఘర్షణపై జీవిస్తాయి లేదా చనిపోతాయి: ఒక అలవాటును లాగ్ చేయడానికి రెండు ట్యాప్‌ల కంటే ఎక్కువ సమయం పడితే, మీరు రెండవ వారానికి యాప్‌ను తెరవడం ఆపేస్తారు. యాప్ స్టోర్‌లలోని సాధారణ ట్రాకర్‌లు దీన్ని సబ్‌స్క్రిప్షన్‌లు మరియు ఫీచర్ బ్లోట్‌తో పరిష్కరిస్తాయి. మీ స్వంతదాన్ని నిర్మించడం అంటే యాప్ ఖచ్చితంగా మీ అలవాట్లను, మీ విధానంలో ట్రాక్ చేస్తుంది — ఉదయం-దినచర్య చెక్‌లిస్ట్, జిమ్ స్ట్రీక్, "చక్కెర లేదు" కౌంటర్ — మధ్యలో మరేమీ లేకుండా.',
        'మీరు ట్రాక్ చేయాలనుకుంటున్న అలవాట్లను మరియు పురోగతిని ఎలా చూడాలనుకుంటున్నారో వివరించండి, మరియు WyberAi దాని చుట్టూ React Native యాప్‌ను జనరేట్ చేస్తుంది: వన్-ట్యాప్ చెక్-ఇన్‌ల కోసం నేటి స్క్రీన్, టైమ్‌జోన్ మార్పులలో మనుగడ సాగించే స్ట్రీక్ లాజిక్, మరియు చైన్‌ను చూపే చరిత్ర వ్యూ. Expo ద్వారా మీ స్వంత ఫోన్‌లో దీన్ని ప్రివ్యూ చేయండి, తర్వాత సాదా ఇంగ్లీష్‌లో మార్పులు చేస్తూ ఉండండి — "తప్పిపోయిన రోజులు రెండు మిస్‌ల తర్వాత మాత్రమే స్ట్రీక్‌ను విచ్ఛిన్నం చేయనివ్వండి."',
      ],
      features: [
        { title: 'వన్-ట్యాప్ రోజువారీ చెక్-ఇన్‌లు', desc: 'ఒకే టోగుల్‌తో ప్రతి అలవాటును జాబితా చేసే నేటి స్క్రీన్ — మొత్తం లాగ్-యువర్-డే ఫ్లో సెకన్లలో జరుగుతుంది.' },
        { title: 'స్ట్రీక్ ఇంజిన్', desc: 'మీ చెక్-ఇన్ చరిత్ర నుండి లెక్కించబడిన ప్రస్తుత స్ట్రీక్, ఉత్తమ స్ట్రీక్, మరియు ప్రతి-అలవాటు పూర్తి శాతం.' },
        { title: 'పురోగతి హీట్‌మ్యాప్', desc: 'చైన్ కనిపించడానికి ప్రతి-అలవాటుకు క్యాలెండర్ హీట్‌మ్యాప్ — ట్రాకర్‌లను పని చేయించే మనస్తత్వశాస్త్రం.' },
        { title: 'మీ అలవాట్లు, మీ నియమాలు', desc: 'వారంరోజుల-మాత్రమే అలవాట్లు, పరిమాణ లక్ష్యాలు ("8 గ్లాసుల నీరు"), లేదా సాధారణ అవును/కాదు — ఇంగ్లీష్‌లో వివరించబడింది, స్కీమాలో వైర్ చేయబడింది.' },
      ],
      promptExample: 'నా అలవాట్లను వన్-ట్యాప్ టోగుల్‌లుగా జాబితా చేసే Today స్క్రీన్, ప్రస్తుత స్ట్రీక్, ఉత్తమ స్ట్రీక్ మరియు ప్రతి-అలవాటుకు నెలవారీ క్యాలెండర్ హీట్‌మ్యాప్ ఉన్న Stats స్క్రీన్, మరియు నేను పేరు, చిహ్నం, మరియు షెడ్యూల్ (రోజువారీ లేదా నిర్దిష్ట వారంరోజులు) సెట్ చేయగల Add Habit స్క్రీన్ ఉన్న అలవాటు ట్రాకర్ మొబైల్ యాప్‌ను నిర్మించండి. డిజైన్‌ను కనిష్టంగా మరియు చీకటిగా ఉంచండి.',
      faqs: [
        { q: 'స్ట్రీక్ లాజిక్ దాటవేసిన రోజులు లేదా విశ్రాంతి రోజులను నిర్వహించగలదా?', a: 'అవును — మీకు కావలసిన నియమాన్ని వివరించండి ("వారాంతాలు స్ట్రీక్‌లను విచ్ఛిన్నం చేయవు" లేదా "వారానికి ఒక మిస్ అనుమతించబడుతుంది") మరియు జనరేట్ చేయబడిన లాజిక్ దానిని అనుసరిస్తుంది. మీరు తర్వాత చాట్‌లో నియమాన్ని మార్చవచ్చు.' },
        { q: 'ఇది iPhone మరియు Android రెండింటిలోనూ పని చేస్తుందా?', a: 'యాప్ React Native + Expoగా జనరేట్ చేయబడింది, ఇది ఒక కోడ్‌బేస్ నుండి రెండు ప్లాట్‌ఫారమ్‌లలో నడుస్తుంది. మీరు Expo ద్వారా వెంటనే మీ స్వంత ఫోన్‌లో ప్రివ్యూ చేస్తారు.' },
        { q: 'నేను తర్వాత రిమైండర్‌లను జోడించవచ్చా?', a: 'మీరు ఇప్పుడు రిమైండర్‌ల స్క్రీన్ మరియు షెడ్యూల్ నిర్మాణాన్ని జోడించవచ్చు, మరియు మీరు ఎగుమతి చేసినప్పుడు లేదా ప్రచురించినప్పుడు పుష్ నోటిఫికేషన్‌లను వైర్ చేయవచ్చు — స్కీమా దీనికి సిద్ధంగా ఉంది.' },
        { q: 'దీన్ని నిర్మించడానికి ఎంత ఖర్చు అవుతుంది?', a: 'మీ మొదటి బిల్డ్ 50 ఉచిత నెలవారీ క్రెడిట్‌లతో కవర్ చేయబడుతుంది — పూర్తి యాప్ బిల్డ్‌కు 30 క్రెడిట్‌లు, చిన్న ఎడిట్‌లకు 2. ప్రారంభించడానికి కార్డు అవసరం లేదు.' },
      ],
    },
    'freelance-time-tracker': {
      h1: 'AIతో ఫ్రీలాన్సర్ల కోసం టైమ్ ట్రాకింగ్ యాప్‌ను నిర్మించండి',
      metaTitle: 'AIతో ఫ్రీలాన్స్ టైమ్ ట్రాకర్‌ను నిర్మించండి — కోడ్ లేకుండా',
      metaDesc: 'క్లయింట్ ప్రాజెక్టులు, బిల్ చేయదగిన గంటలు, మరియు ఇన్‌వాయిస్-సిద్ధ సారాంశాలతో టైమ్ ట్రాకింగ్ వెబ్ యాప్‌ను జనరేట్ చేయండి — సాదా ఇంగ్లీష్‌లో వివరించబడింది, నిమిషాల్లో నిర్మించబడింది.',
      tagline: 'క్లయింట్ మరియు ప్రాజెక్ట్ ద్వారా గంటలను ట్రాక్ చేయండి, బిల్ చేయదగినదాన్ని గుర్తించండి, ఇన్‌వాయిస్-సిద్ధ మొత్తాలను ఎగుమతి చేయండి — ఇంకొకరి వర్క్‌ఫ్లో కోసం సబ్‌స్క్రిప్షన్ చెల్లించకుండా.',
      body: [
        'ప్రతి ఫ్రీలాన్సర్ చివరకు అదే గోడను తాకుతారు: బృందాల కోసం నిర్మించిన టైమ్ ట్రాకర్‌లు మీరు ఎప్పటికీ ఉపయోగించని ఫీచర్‌ల కోసం ప్రతి-సీటు డబ్బు వసూలు చేస్తాయి, ఉచిత టైర్‌లు మీకు అవసరమైన ఒకే విషయాన్ని — చరిత్రను — పరిమితం చేస్తాయి. అయితే మీ నిజమైన అవసరం సరళమైనది: ఏ క్లయింట్, ఏ ప్రాజెక్ట్, ఎంత సమయం, ఇది బిల్ చేయదగినదా, మరియు ఇన్‌వాయిస్ సమయంలో స్వచ్ఛమైన మొత్తం.',
        'ఆ ఒక-పేరా స్పెక్ WyberAi మొత్తం సాధనాన్ని నిర్మించడానికి సరిపోతుంది: టైమర్ పేజీ, నిజమైన Postgres డేటాబేస్‌లో క్లయింట్ మరియు ప్రాజెక్ట్ నిర్మాణం, మరియు మీ ఇన్‌వాయిస్‌ల విధంగా సమూహం చేయబడిన నెలవారీ సారాంశం. మీరు యాప్‌కు యజమాని కాబట్టి, వర్క్‌ఫ్లో మీకు వంగుతుంది — ప్రతి-క్లయింట్ గంట-రేటు ఫీల్డ్‌ను, వారపు ఇమెయిల్ సారాంశాన్ని, లేదా మీకు అవసరమైనప్పుడు "ఇన్‌వాయిస్ చేయబడినట్లు గుర్తించండి" ఫ్లాగ్‌ను జోడించండి.',
      ],
      features: [
        { title: 'లైవ్ టైమర్ + మాన్యువల్ ఎంట్రీలు', desc: 'టైమర్‌ను ప్రారంభించండి లేదా తర్వాత గంటలను బ్యాక్‌ఫిల్ చేయండి — రెండూ క్లయింట్ మరియు ప్రాజెక్ట్ జోడించబడిన అదే లాగ్‌లో వస్తాయి.' },
        { title: 'క్లయింట్లు → ప్రాజెక్టులు → ఎంట్రీలు', desc: 'సరైన సంబంధాత్మక నిర్మాణం, కాబట్టి ఏదైనా తేదీ పరిధిలో ప్రాజెక్ట్ లేదా క్లయింట్ ద్వారా మొత్తాలు స్వచ్ఛంగా చేరతాయి.' },
        { title: 'బిల్ చేయదగిన వర్సెస్ అంతర్గత విభజన', desc: 'ఎంట్రీలను బిల్ చేయదగినవిగా ఫ్లాగ్ చేయండి; సారాంశాలు బిల్ చేయదగిన మొత్తాలను విడిగా చూపుతాయి కాబట్టి ఇన్‌వాయిసింగ్ ఒక చూపులో అవుతుంది.' },
        { title: 'ఇన్‌వాయిస్-సిద్ధ నెలవారీ వ్యూ', desc: 'ఏదైనా నెలకు క్లయింట్ ద్వారా సమూహం చేయబడిన గంటలు, మీ గంట-రేటు వర్తించబడింది — ఇన్‌వాయిస్‌పై వెళ్ళే సంఖ్య.' },
      ],
      promptExample: 'ఫ్రీలాన్సర్ కోసం టైమ్ ట్రాకింగ్ వెబ్ యాప్‌ను నిర్మించండి: క్లయింట్, ప్రాజెక్ట్ మరియు గమనికలతో ఎంట్రీలను సేవ్ చేసే ప్రారంభ/ఆపు టైమర్ ఉన్న Timer పేజీ; ప్రతి ఒక్కటికీ గంట-రేటు మరియు వారి ప్రాజెక్టులతో క్లయింట్‌లను నిర్వహించే Clients పేజీ; మరియు ఎంచుకున్న నెలకు క్లయింట్ ద్వారా సమూహం చేయబడిన గంటలు మరియు సంపాదనలను, బిల్ చేయదగిన మరియు బిల్ చేయని వాటిని వేరు చేసి చూపే Reports పేజీ.',
      faqs: [
        { q: 'నేను ఎంత ఇన్‌వాయిస్ చేయాలో ఇది లెక్కించగలదా?', a: 'అవును — ప్రతి క్లయింట్‌కు గంట-రేటు ఇవ్వండి మరియు మీరు ఎంచుకున్న ఏదైనా తేదీ పరిధికి నివేదికల పేజీ బిల్ చేయదగిన గంటలను రేటుతో గుణిస్తుంది.' },
        { q: 'నా సమయ డేటా ఎక్కడ నిల్వ చేయబడుతుంది?', a: 'మీ యాప్ యొక్క స్వంత Postgres డేటాబేస్‌లో (Supabase), ప్రచురించే ముందు లైవ్‌గా స్కాన్ చేయబడిన రో-లెవెల్ సెక్యూరిటీతో — మీ గంటలు మీవి, మీ ఇన్‌ఫ్రాస్ట్రక్చర్‌పై.' },
        { q: 'నేను Toggl లేదా స్ప్రెడ్‌షీట్ నుండి చరిత్రను దిగుమతి చేయవచ్చా?', a: 'చాట్‌లో అడగడం ద్వారా CSV దిగుమతి పేజీని జోడించండి — మీ ఎగుమతి యొక్క కాలమ్‌లను వివరించండి మరియు యాప్ వాటిని మీ ఎంట్రీల టేబుల్‌లోకి మ్యాప్ చేస్తుంది.' },
        { q: 'ఇది నిజంగా టైమ్-ట్రాకర్ సబ్‌స్క్రిప్షన్ కంటే చౌకైనదా?', a: 'మీరు దీన్ని ఉచిత నెలవారీ క్రెడిట్‌లతో ఒకసారి నిర్మిస్తారు మరియు ఇది మీ స్వంత యాప్‌గా నడుస్తుంది — ప్రతి-నెల ట్రాకర్ రుసుము లేదు, మరియు మార్పులు కావాలనుకున్నప్పుడు ఎడిట్‌లకు 2 క్రెడిట్‌లు ఖర్చవుతాయి.' },
      ],
    },
    'team-task-manager': {
      h1: 'AIతో టీమ్ టాస్క్ మేనేజర్‌ను నిర్మించండి',
      metaTitle: 'AIతో టీమ్ టాస్క్ మేనేజ్‌మెంట్ యాప్‌ను నిర్మించండి',
      metaDesc: 'మీ బృందం కోసం కాన్‌బాన్-శైలి టాస్క్ మేనేజర్‌ను సృష్టించండి — బోర్డులు, అసైన్‌మెంట్‌లు, గడువు తేదీలు, మరియు వ్యాఖ్యలు — సాదా-ఇంగ్లీష్ వివరణ నుండి జనరేట్. ప్రారంభించడం ఉచితం.',
      tagline: 'మీ బృందం నిజంగా పనిచేసే విధానానికి సరిపోయే కాన్‌బాన్ బోర్డు — మీ కాలమ్‌లు, మీ లేబుల్‌లు, మీ నియమాలు — ఇంకొకరిదాన్ని అద్దెకు తీసుకోవడానికి బదులుగా.',
      body: [
        'చిన్న బృందాలు రెండు చెడు ఎంపికల మధ్య చిక్కుకున్నాయి: బృందం సగం ఉపయోగించే ప్రతి-సీటుకు ధర నిర్ణయించిన బరువైన ప్రాజెక్ట్ సాధనాలు, మరియు ఇద్దరు వ్యక్తులు ఒకేసారి ఎడిట్ చేసిన క్షణం విడిపోయే భాగస్వామ్య స్ప్రెడ్‌షీట్‌లు. చాలా ఐదుగురు వ్యక్తుల బృందాలకు అవసరమైనది ఒకే బోర్డులో సరిపోతుంది — బోర్డు వారి భాషను మాట్లాడితే.',
        'మీ బృందం ఎలా పని చేస్తుందో WyberAiకి చెప్పండి — పని ఏ దశల ద్వారా కదులుతుంది, ఎవరు ఏమి చూడాలి, "పూర్తయింది" టాస్క్‌కు ఏమి అవసరం — మరియు ఇది ఆ ఖచ్చితమైన ఆకారంతో టాస్క్ మేనేజర్‌ను జనరేట్ చేస్తుంది: నిజమైన డేటాబేస్ మద్దతుతో కాన్‌బాన్ బోర్డు, ప్రతి-సభ్యుడి కేటాయింపు, మరియు కార్యాచరణ ట్రయిల్. ఇది ప్రామాణీకరణ మరియు సెక్యూరిటీ స్కాన్‌తో వస్తుంది, కాబట్టి బృందాన్ని ఆహ్వానించడం మొదటి రోజు నుండి సురక్షితం.',
      ],
      features: [
        { title: 'మీ కాలమ్‌లతో కాన్‌బాన్', desc: 'Backlog → In Progress → Review → Done, లేదా మీ ఫ్లో ఏదైనా కావచ్చు — బోర్డు దాని గురించి మీ వివరణ నుండి జనరేట్ చేయబడుతుంది.' },
        { title: 'అసైన్‌మెంట్‌లు మరియు గడువు తేదీలు', desc: 'ప్రతి టాస్క్‌కు యజమాని మరియు గడువు ఉంటుంది; My Tasks వ్యూ ప్రతి వ్యక్తికి బాకీ ఉన్నదానికి బోర్డును ఫిల్టర్ చేస్తుంది.' },
        { title: 'టాస్క్‌లపై వ్యాఖ్యలు', desc: 'చర్చ టాస్క్‌పైనే ఉంటుంది, కాబట్టి సందర్భం చాట్ థ్రెడ్‌లలో పోవడం ఆగిపోతుంది.' },
        { title: 'బిల్ట్-ఇన్ టీమ్ ప్రామాణీకరణ', desc: 'సైన్-ఇన్ మరియు సభ్యత్వం వైర్ చేయబడి వస్తాయి, మీరు లింక్‌ను పంచుకునే ముందు లైవ్ స్కాన్ ద్వారా పరిశీలించబడిన రో-లెవెల్ సెక్యూరిటీతో.' },
      ],
      promptExample: 'టీమ్ టాస్క్ మేనేజర్ వెబ్ యాప్‌ను నిర్మించండి: Backlog, This Week, In Progress, మరియు Done కాలమ్‌లు ఉన్న కాన్‌బాన్ Board పేజీ, ఇక్కడ టాస్క్‌లకు శీర్షిక, వివరణ, అసైనీ, గడువు తేదీ, మరియు ప్రాధాన్యత ఉంటుంది; సైన్-ఇన్ అయిన వినియోగదారు యొక్క టాస్క్‌లను గడువు తేదీ ప్రకారం క్రమబద్ధీకరించి చూపే My Tasks పేజీ; మరియు థ్రెడెడ్ వ్యాఖ్యలతో టాస్క్ వివరం. టీమ్ సభ్యుల నిర్వహణను చేర్చండి.',
      faqs: [
        { q: 'ప్రతి టీమ్‌మేట్‌కు వారి స్వంత లాగిన్ ఉండగలదా?', a: 'అవును — యాప్ ప్రామాణీకరణను చేర్చి జనరేట్ అవుతుంది, మరియు సభ్యుల టేబుల్ బోర్డును ఎవరు చూడగలరు మరియు ఎడిట్ చేయగలరో నియంత్రిస్తుంది.' },
        { q: 'బృందం ఉపయోగించడం ప్రారంభించిన తర్వాత నేను వర్క్‌ఫ్లోను మార్చవచ్చా?', a: 'అవును. చాట్‌లో అడగండి — "Blocked కాలమ్‌ను జోడించండి" లేదా "Done ముందు చెక్‌లిస్ట్ అవసరం" — మరియు ఇప్పటికే ఉన్న టాస్క్‌లను కోల్పోకుండా బోర్డు అప్‌డేట్ అవుతుంది.' },
        { q: 'ఇది Trello ఉపయోగించడం కంటే ఎలా భిన్నం?', a: 'ఇది మీ స్వంత యాప్: ప్రతి-సీటు ధర లేదు, ఫీచర్ గేట్‌లు లేవు, మరియు వర్క్‌ఫ్లో లేబుళ్లు మరియు పవర్-అప్‌లతో అంచనా వేయబడకుండా మీ బృందానికి రూపొందించబడింది.' },
        { q: 'బృందం యొక్క డేటా సురక్షితమేనా?', a: 'ప్రతి WyberAi యాప్ ప్రచురణకు ముందు లైవ్ డేటాబేస్ సెక్యూరిటీ స్కాన్‌ను పొందుతుంది, ఇది దాడి చేసేవారిలా మీ యాప్‌ను పరిశీలిస్తుంది, తీవ్రమైన లీక్‌లు గేట్‌ను అడ్డుకుంటాయి.' },
      ],
    },
    'job-application-tracker': {
      h1: 'AIతో ఉద్యోగ దరఖాస్తు ట్రాకర్‌ను నిర్మించండి',
      metaTitle: 'AIతో ఉద్యోగ దరఖాస్తు ట్రాకర్ యాప్‌ను నిర్మించండి',
      metaDesc: 'ఒకే బోర్డులో ప్రతి దరఖాస్తు, ఇంటర్వ్యూ దశ, మరియు ఫాలో-అప్‌ను ట్రాక్ చేయండి — సాదా ఇంగ్లీష్ నుండి జనరేట్ చేయబడిన ఉద్యోగ శోధన ట్రాకర్, గజిబిజి స్ప్రెడ్‌షీట్ కాదు.',
      tagline: 'ప్రతి దరఖాస్తు, దాని దశ, మరియు మీరు చివరిసారి ఎప్పుడు విన్నారు — వాస్తవికత కంటే మూడు ట్యాబ్‌లు వెనుకబడిన స్ప్రెడ్‌షీట్‌కు బదులుగా ఒకే బోర్డు.',
      body: [
        'ఒక సీరియస్ ఉద్యోగ శోధన స్ప్రెడ్‌షీట్ పట్టుకోవాలనుకునే దాని కంటే ఎక్కువ స్థితిని ఉత్పత్తి చేస్తుంది: రెజ్యూమ్ యొక్క ఏ వెర్షన్ ఎక్కడికి వెళ్లింది, ఆ రిక్రూటర్ కాల్ ఒక స్క్రీన్ అయిందా లేదా నిజమైన ఇంటర్వ్యూ అయిందా, మరియు పద్నాలుగు "ఇంకా అభ్యర్థులను సమీక్షిస్తున్నాము" ఇమెయిల్‌లలో దేనిని మీరు ఈ వారం నిజంగా ఫాలో-అప్ చేయాలి. స్ప్రెడ్‌షీట్ మీరు మాత్రమే అర్థం చేసుకోగల రంగుల సెల్‌లుగా క్షీణిస్తుంది.',
        'మీ శోధనను వివరించండి మరియు WyberAi దాని చుట్టూ ట్రాకర్‌ను నిర్మిస్తుంది: Applied నుండి Offer వరకు పైప్‌లైన్ బోర్డు, పాత్ర, సంప్రదింపు, మరియు రెజ్యూమ్ వెర్షన్ జోడించిన ప్రతి-దరఖాస్తు రికార్డు, మరియు మీ స్వంత పరిమితిని దాటి నిశ్శబ్దంగా ఉన్న దేనినైనా ఉపరితలంపైకి తీసుకువచ్చే ఫాలో-అప్ వ్యూ. ఇంత ఒత్తిడితో కూడిన శోధనకు అర్హమైన ఏకైక వ్యవస్థ ఇది — ఒక మధ్యాహ్నంలో నిర్మించబడింది, పక్క ప్రాజెక్టుగా నిర్వహించబడలేదు.',
      ],
      features: [
        { title: 'దశ వారీగా పైప్‌లైన్', desc: 'Applied, Screening, Interview, Offer, Rejected — మొత్తం శోధన ఒక్క చూపులో కనిపించేలా కాన్‌బాన్ బోర్డు.' },
        { title: 'ప్రతి-దరఖాస్తు రికార్డు', desc: 'కంపెనీ, పాత్ర, రెజ్యూమ్ వెర్షన్, రిఫరల్ సంప్రదింపు, మరియు జీతం పరిధి, అది చెందిన కార్డుకు జోడించబడింది.' },
        { title: 'ఫాలో-అప్ రాడార్', desc: 'నిర్ణీత సంఖ్యలో రోజులు దాటినా ఎలాంటి అప్‌డేట్ లేని దరఖాస్తులు స్వయంచాలకంగా ఉపరితలంపైకి వస్తాయి — చల్లబడుతున్నవి.' },
        { title: 'ఇంటర్వ్యూ గమనికలు', desc: 'ప్రతి రౌండ్ తర్వాత వెంటనే ఏమి అడిగారు మరియు ఎలా జరిగింది అని లాగ్ చేయండి, తదుపరిదానికి ఇంకా ముఖ్యమైనంత తాజాగా ఉన్నప్పుడు.' },
      ],
      promptExample: 'ఉద్యోగ దరఖాస్తు ట్రాకర్ వెబ్ యాప్‌ను నిర్మించండి: Applied, Screening, Interview, Offer, Rejected కాన్‌బాన్ కాలమ్‌లు ఉన్న Board పేజీ, ఇక్కడ ప్రతి కార్డు కంపెనీ, పాత్ర, మరియు దరఖాస్తు చేసిన తేదీని చూపుతుంది; సంప్రదింపు పేరు, ఉపయోగించిన రెజ్యూమ్ వెర్షన్, జీతం పరిధి, మరియు ఫ్రీ-టెక్స్ట్ ఇంటర్వ్యూ గమనికలతో కార్డు వివరాల వ్యూ; మరియు గత 10 రోజులలో ఎలాంటి స్థితి మార్పు లేని దరఖాస్తులను జాబితా చేసే Follow-ups పేజీ.',
      faqs: [
        { q: 'ఇది ఫాలో-అప్ చేయమని నాకు గుర్తు చేయగలదా?', a: 'మీరు యాప్‌ను తెరిచిన ప్రతిసారీ Follow-ups వ్యూ మీ పరిమితిని దాటిన ఏదైనా పాతదాన్ని జాబితా చేస్తుంది; మీకు పుష్ కావాలంటే ఇమెయిల్ రిమైండర్‌లను జోడించమని చాట్‌ను అడగండి.' },
        { q: 'నేను ఎక్కడ ఏ రెజ్యూమ్ వెర్షన్ పంపానో ట్రాక్ చేయవచ్చా?', a: 'అవును — ప్రతి దరఖాస్తుకు రెజ్యూమ్-వెర్షన్ ఫీల్డ్‌ను జోడించండి కాబట్టి మూడు వారాల్లో వారు తిరిగి కాల్ చేస్తే రిక్రూటర్ ఏమి చూశారో మీకు ఖచ్చితంగా తెలుసు.' },
        { q: 'నా శోధనపై గణాంకాలను నేను చూడగలనా?', a: 'గణాంకాల వ్యూను అడగండి — ప్రతిస్పందన రేటు, ప్రతి దశలో సగటు సమయం, వారానికి దరఖాస్తులు — మీ స్వంత డేటా నుండి లెక్కించబడింది.' },
        { q: 'ఇది స్ప్రెడ్‌షీట్ కంటే మెరుగైనదా?', a: 'ఒక దరఖాస్తు నిశ్శబ్దంగా మారినప్పుడు స్ప్రెడ్‌షీట్ మిమ్మల్ని హెచ్చరించదు లేదా ప్రతి-రౌండ్‌కు నిర్మాణాత్మక ఇంటర్వ్యూ గమనికలను ఉంచదు — ఈ ట్రాకర్ రెండింటినీ స్థానికంగా చేస్తుంది.' },
      ],
    },
    'reading-list-app': {
      h1: 'AIతో రీడింగ్ లిస్ట్ యాప్‌ను నిర్మించండి',
      metaTitle: 'AIతో రీడింగ్ లిస్ట్ & బుక్ ట్రాకర్ యాప్‌ను నిర్మించండి',
      metaDesc: 'మీ చదవాల్సిన కుప్పను ట్రాక్ చేయండి, రేటింగ్‌లతో పూర్తయిన పుస్తకాలను లాగ్ చేయండి, మరియు వార్షిక పఠన లక్ష్యాన్ని చేరుకోండి — సాదా ఇంగ్లీష్ నుండి నిర్మించిన బుక్ ట్రాకర్, మీ సొంతంగా ఉంచుకోవడానికి.',
      tagline: 'చదవాల్సిన కుప్ప, మీరు ఇప్పుడు చదువుతున్నది, మరియు వార్షిక లెక్క — మీ వేగాన్ని అపరాధభావంతో నింపే సామాజిక ఫీడ్ లేకుండా.',
      body: [
        'Goodreads మీరు అడగని సామాజిక నెట్‌వర్క్‌లో చుట్టడం ద్వారా పుస్తక ట్రాకింగ్‌ను పరిష్కరిస్తుంది, చాలా రీడింగ్-ట్రాకర్ యాప్‌లు ఆవిష్కరణను పరిష్కరిస్తాయి, నిజమైన సమస్యను కాదు: మీరు చదవాలనుకున్న పుస్తకాల ఎప్పటికప్పుడు పెరుగుతున్న జాబితా, ప్రస్తుత దాన్ని ఎక్కడ ఆపారో గుర్తు లేదు, మరియు ఇది 20-పుస్తకాల సంవత్సరమా లేదా 50-పుస్తకాల సంవత్సరమా అనే నిజాయితీ భావన లేదు.',
        'మీరు ఎలా చదువుతారో WyberAiకి చెప్పండి — భౌతిక, ఇబుక్, ఆడియోబుక్, లేదా మూడూ — మరియు ఇది దానికి తగినట్టుగా ట్రాకర్‌ను నిర్మిస్తుంది: మీరు ఇష్టానుసారంగా జోడించే చదవాల్సిన షెల్ఫ్, సెకన్లలో మీరు అప్‌డేట్ చేసే పేజీ లేదా శాతంతో ప్రస్తుతం-చదువుతున్న వ్యూ, మరియు మీ స్వంత రేటింగ్ మరియు భవిష్యత్-మీ కోసం గమనికతో పూర్తయిన షెల్ఫ్. వార్షిక లక్ష్య కౌంటర్ "నేను ఎక్కువ చదవాలి" అనే దానిని మీరు నిజంగా కదులుతున్నట్లు చూడగలిగే సంఖ్యగా మారుస్తుంది.',
      ],
      features: [
        { title: 'చదవాల్సిన షెల్ఫ్', desc: 'ఎవరైనా వాటిని ప్రస్తావించిన క్షణం పుస్తకాలను జోడించండి — శీర్షిక, రచయిత, మరియు మీరు దీన్ని ఎందుకు చదవాలనుకుంటున్నారు.' },
        { title: 'ప్రస్తుతం చదువుతున్న పురోగతి', desc: 'మీరు కొనసాగుతున్నప్పుడు పేజీ సంఖ్య లేదా శాతాన్ని అప్‌డేట్ చేయండి; ప్రతి పుస్తకంలో మీరు ఎంత దూరం ఉన్నారో యాప్ చూపుతుంది.' },
        { title: 'రేటింగ్‌లతో పూర్తయిన షెల్ఫ్', desc: 'మీ స్వంత స్టార్ రేటింగ్ మరియు ప్రతి-పుస్తకానికి చిన్న గమనిక — తర్వాత పుస్తకాలను సిఫార్సు చేయడంలో నిజంగా సహాయపడే లాగ్.' },
        { title: 'వార్షిక పఠన లక్ష్యం', desc: 'ప్రతి-సంవత్సరం పుస్తకాల లక్ష్యాన్ని సెట్ చేయండి మరియు పూర్తయిన పుస్తకాలు షెల్ఫ్‌పైకి వచ్చినప్పుడు పురోగతి బార్ నిండటాన్ని చూడండి.' },
      ],
      promptExample: 'రీడింగ్ లిస్ట్ మొబైల్ యాప్‌ను నిర్మించండి: నేను శీర్షిక, రచయిత, మరియు ఫార్మాట్ (భౌతిక/ఇబుక్/ఆడియోబుక్)తో పుస్తకాలను జోడించే To Be Read స్క్రీన్; నేను అప్‌డేట్ చేసే పేజీ లేదా శాతం స్లయిడర్‌తో పురోగతిలో ఉన్న పుస్తకాలను చూపే Currently Reading స్క్రీన్; నా స్టార్ రేటింగ్ మరియు చిన్న గమనికతో పూర్తయిన పుస్తకాలను జాబితా చేసే Finished స్క్రీన్; మరియు నేను సెట్ చేసిన లక్ష్యానికి వ్యతిరేకంగా ఈ సంవత్సరం పూర్తయిన పుస్తకాలను చూపే Goal స్క్రీన్.',
      faqs: [
        { q: 'ఇది భౌతిక పుస్తకాల నుండి ఆడియోబుక్‌లను వేరుగా ట్రాక్ చేయగలదా?', a: 'అవును — ప్రతి పుస్తకానికి ఫార్మాట్ సెట్ చేయండి, ఆడియోబుక్‌ల కోసం పేజీ సంఖ్యకు బదులుగా శాతం లేదా వినిన సమయం ద్వారా పురోగతిని ట్రాక్ చేయండి.' },
        { q: 'ఇది పుస్తకాలను సిఫార్సు చేస్తుందా?', a: 'లేదు — ఇది వ్యక్తిగత ట్రాకర్, ఆవిష్కరణ ఫీడ్ కాదు. ఇది మీ స్వంత షెల్ఫ్‌లను చూపుతుంది, మార్కెట్‌ప్లేస్ మీరు తర్వాత కొనాలని కోరుకునేది కాదు.' },
        { q: 'నేను పుస్తకాలను శైలి లేదా సిరీస్ ద్వారా నిర్వహించవచ్చా?', a: 'మీ ప్రాంప్ట్‌లో ట్యాగ్‌లు లేదా సిరీస్ ఫీల్డ్‌ను జోడించండి, మరియు షెల్ఫ్‌లు వాటి ద్వారా ఫిల్టర్ చేయవచ్చు లేదా సమూహపరచవచ్చు.' },
        { q: 'నా పఠన డేటా ప్రైవేట్‌గా ఉందా?', a: 'ఇది మీ స్వంత డేటాబేస్‌లో మీ స్వంత యాప్ — మీరు ప్రత్యేకంగా ఒకదాన్ని నిర్మించకపోతే ఏదీ సామాజిక ఫీడ్‌కు భాగస్వామ్యం చేయబడదు.' },
      ],
    },
  },
  ta: {
    'habit-tracker-app': {
      h1: 'AI மூலம் பழக்க டிராக்கர் ஆப்-ஐ உருவாக்குங்கள்',
      metaTitle: 'AI மூலம் பழக்க டிராக்கர் ஆப்-ஐ உருவாக்குங்கள் — கோட் இல்லாமல்',
      metaDesc: 'உங்கள் பழக்க டிராக்கரை சாதாரண ஆங்கிலத்தில் விவரியுங்கள், தொடர்ச்சிகள், தினசரி செக்-இன்கள், மற்றும் முன்னேற்ற விளக்கப்படங்களுடன் வேலை செய்யும் மொபைல் ஆப்பைப் பெறுங்கள். தொடங்குவது இலவசம், கோட் தேவையில்லை.',
      tagline: 'தொடர்ச்சிகள், தினசரி செக்-இன்கள், மற்றும் சங்கிலியைத் தொடர வைக்கும் முன்னேற்ற காட்சி — ஒரே ப்ராம்ப்ட்டிலிருந்து கட்டமைக்கப்பட்டது.',
      body: [
        'பழக்க ஆப்கள் உராய்வின் மீது வாழ்கின்றன அல்லது இறக்கின்றன: ஒரு பழக்கத்தைப் பதிவு செய்ய இரண்டு தட்டல்களுக்கும் மேல் நேரம் ஆனால், இரண்டாவது வாரத்திற்குள் ஆப்பைத் திறப்பதை நிறுத்திவிடுவீர்கள். ஆப் ஸ்டோர்களில் உள்ள பொதுவான டிராக்கர்கள் இதை சந்தாக்கள் மற்றும் ஃபீச்சர் வீக்கத்துடன் தீர்க்கின்றன. உங்கள் சொந்தமாக உருவாக்குவது என்பது ஆப் சரியாக உங்கள் பழக்கங்களை, உங்கள் வழியில் கண்காணிக்கிறது என்பதாகும் — காலை-வழக்கம் சரிபார்ப்பு பட்டியல், ஜிம் தொடர்ச்சி, "சர்க்கரை இல்லை" கவுண்டர் — வேறு எதுவும் வழியில் இல்லாமல்.',
        'நீங்கள் கண்காணிக்க விரும்பும் பழக்கங்களையும் முன்னேற்றத்தை எப்படிப் பார்க்க விரும்புகிறீர்கள் என்பதையும் விவரியுங்கள், WyberAi அதைச் சுற்றி ஒரு React Native ஆப்பை உருவாக்குகிறது: ஒரு-தட்டல் செக்-இன்களுக்கான இன்றைய திரை, நேர மண்டல மாற்றங்களில் தப்பிக்கும் தொடர்ச்சி தர்க்கம், மற்றும் சங்கிலியைக் காட்டும் வரலாறு காட்சி. Expo மூலம் உங்கள் சொந்த ஃபோனில் அதை முன்னோட்டமிடுங்கள், பின்னர் சாதாரண ஆங்கிலத்தில் மாற்றியமைத்துக்கொண்டே இருங்கள் — "தவறவிட்ட நாட்கள் இரண்டு தவறல்களுக்குப் பிறகு மட்டுமே தொடர்ச்சியை உடைக்கட்டும்."',
      ],
      features: [
        { title: 'ஒரு-தட்டல் தினசரி செக்-இன்கள்', desc: 'ஒரே டாகுளுடன் ஒவ்வொரு பழக்கத்தையும் பட்டியலிடும் இன்றைய திரை — முழு லாக்-யுவர்-டே ஓட்டமும் வினாடிகளில் நடக்கும்.' },
        { title: 'தொடர்ச்சி இயந்திரம்', desc: 'உங்கள் செக்-இன் வரலாற்றிலிருந்து கணக்கிடப்பட்ட தற்போதைய தொடர்ச்சி, சிறந்த தொடர்ச்சி, மற்றும் ஒவ்வொரு-பழக்கத்திற்கும் நிறைவு சதவீதம்.' },
        { title: 'முன்னேற்ற ஹீட்மேப்', desc: 'சங்கிலி தெரியும்படி ஒவ்வொரு-பழக்கத்திற்கும் ஒரு நாட்காட்டி ஹீட்மேப் — டிராக்கர்களை வேலை செய்ய வைக்கும் உளவியல்.' },
        { title: 'உங்கள் பழக்கங்கள், உங்கள் விதிகள்', desc: 'வார நாள்-மட்டும் பழக்கங்கள், அளவு இலக்குகள் ("8 கிளாஸ் தண்ணீர்"), அல்லது எளிய ஆம்/இல்லை — ஆங்கிலத்தில் விவரிக்கப்பட்டு, ஸ்கீமாவில் இணைக்கப்பட்டது.' },
      ],
      promptExample: 'எனது பழக்கங்களை ஒரு-தட்டல் டாகுள்களாகப் பட்டியலிடும் Today திரை, தற்போதைய தொடர்ச்சி, சிறந்த தொடர்ச்சி மற்றும் ஒவ்வொரு-பழக்கத்திற்கும் மாதாந்திர நாட்காட்டி ஹீட்மேப் கொண்ட Stats திரை, மற்றும் நான் பெயர், ஐகான், மற்றும் அட்டவணையை (தினசரி அல்லது குறிப்பிட்ட வார நாட்கள்) அமைக்கக்கூடிய Add Habit திரை கொண்ட பழக்க டிராக்கர் மொபைல் ஆப்பை உருவாக்குங்கள். வடிவமைப்பை குறைந்தபட்சமாகவும் இருட்டாகவும் வைத்திருங்கள்.',
      faqs: [
        { q: 'தொடர்ச்சி தர்க்கம் தவிர்க்கப்பட்ட நாட்களை அல்லது ஓய்வு நாட்களை கையாள முடியுமா?', a: 'ஆம் — உங்களுக்கு விரும்பிய விதியை விவரியுங்கள் ("வார இறுதிகள் தொடர்ச்சிகளை உடைக்காது" அல்லது "வாரத்திற்கு ஒரு தவறுதல் அனுமதிக்கப்படுகிறது") உருவாக்கப்பட்ட தர்க்கம் அதைப் பின்பற்றும். நீங்கள் பின்னர் சாட்டில் விதியை மாற்றலாம்.' },
        { q: 'இது iPhone மற்றும் Android இரண்டிலும் வேலை செய்யுமா?', a: 'ஆப் React Native + Expo ஆக உருவாக்கப்படுகிறது, இது ஒரே கோட்பேஸிலிருந்து இரண்டு தளங்களிலும் இயங்குகிறது. நீங்கள் Expo மூலம் உடனடியாக உங்கள் சொந்த ஃபோனில் முன்னோட்டமிடுகிறீர்கள்.' },
        { q: 'நான் பின்னர் நினைவூட்டல்களைச் சேர்க்கலாமா?', a: 'நீங்கள் இப்போது நினைவூட்டல் திரையையும் அட்டவணை அமைப்பையும் சேர்க்கலாம், மேலும் நீங்கள் ஏற்றுமதி செய்யும்போது அல்லது வெளியிடும்போது புஷ் அறிவிப்புகளை இணைக்கலாம் — ஸ்கீமா இதற்குத் தயார்.' },
        { q: 'இதை உருவாக்க என்ன செலவாகும்?', a: 'உங்கள் முதல் பில்ட் 50 இலவச மாதாந்திர கிரெடிட்களால் உள்ளடக்கப்பட்டுள்ளது — ஒரு முழு ஆப் பில்ட் 30 கிரெடிட்கள் செலவாகும், சிறிய எடிட்கள் 2. தொடங்க கார்டு தேவையில்லை.' },
      ],
    },
    'freelance-time-tracker': {
      h1: 'AI மூலம் ஃப்ரீலான்சர்களுக்கான நேர கண்காணிப்பு ஆப்-ஐ உருவாக்குங்கள்',
      metaTitle: 'AI மூலம் ஃப்ரீலான்ஸ் நேர டிராக்கரை உருவாக்குங்கள் — கோட் இல்லாமல்',
      metaDesc: 'கிளையண்ட் திட்டங்கள், பில் செய்யக்கூடிய மணிநேரங்கள், மற்றும் இன்வாய்ஸ்-தயார் சுருக்கங்களுடன் நேர கண்காணிப்பு வெப் ஆப்பை உருவாக்குங்கள் — சாதாரண ஆங்கிலத்தில் விவரிக்கப்பட்டது, நிமிடங்களில் கட்டமைக்கப்பட்டது.',
      tagline: 'கிளையண்ட் மற்றும் திட்டத்தின் மூலம் மணிநேரங்களைக் கண்காணிக்கவும், எது பில் செய்யக்கூடியது என்று குறியிடவும், இன்வாய்ஸ்-தயார் மொத்தங்களை ஏற்றுமதி செய்யவும் — வேறொருவரின் பணிப்பாய்வுக்கு சந்தா செலுத்தாமல்.',
      body: [
        'ஒவ்வொரு ஃப்ரீலான்சரும் இறுதியாக அதே சுவரில் மோதுகிறார்கள்: குழுக்களுக்காக கட்டமைக்கப்பட்ட நேர டிராக்கர்கள் நீங்கள் ஒருபோதும் பயன்படுத்தாத அம்சங்களுக்கு ஒவ்வொரு-சீட் பணத்தை வசூலிக்கின்றன, இலவச அடுக்குகள் உங்களுக்குத் தேவையான ஒரே விஷயத்தை — வரலாற்றை — வரம்பிடுகின்றன. இதற்கிடையில் உங்கள் உண்மையான தேவை எளிமையானது: எந்த கிளையண்ட், எந்த திட்டம், எவ்வளவு நேரம், இது பில் செய்யக்கூடியதா, மற்றும் இன்வாய்ஸ் நேரத்தில் தூய மொத்தம்.',
        'அந்த ஒரு-பத்தி விவரக்குறிப்பு WyberAi முழு கருவியையும் கட்டமைக்க போதுமானது: ஒரு டைமர் பக்கம், ஒரு உண்மையான Postgres தரவுத்தளத்தில் கிளையண்ட் மற்றும் திட்ட அமைப்பு, மற்றும் உங்கள் இன்வாய்ஸ்கள் உள்ளதைப் போல தொகுக்கப்பட்ட மாதாந்திர சுருக்கம். நீங்கள் ஆப்பின் உரிமையாளர் என்பதால், பணிப்பாய்வு உங்களுக்கு வளைகிறது — ஒவ்வொரு-கிளையண்டுக்கும் மணிக்கு-விகிதம் புலத்தைச் சேர்க்கவும், வாராந்திர மின்னஞ்சல் சுருக்கத்தைச் சேர்க்கவும், அல்லது உங்களுக்குத் தேவைப்படும்போது "இன்வாய்ஸ் செய்யப்பட்டதாக குறியிடு" கொடியைச் சேர்க்கவும்.',
      ],
      features: [
        { title: 'நேரலை டைமர் + கைமுறை உள்ளீடுகள்', desc: 'ஒரு டைமரைத் தொடங்குங்கள் அல்லது பின்னர் மணிநேரங்களை பேக்ஃபில் செய்யுங்கள் — இரண்டும் கிளையண்ட் மற்றும் திட்டம் இணைக்கப்பட்ட அதே பதிவில் வரும்.' },
        { title: 'கிளையண்ட்கள் → திட்டங்கள் → உள்ளீடுகள்', desc: 'சரியான தொடர்பு அமைப்பு, எனவே எந்த தேதி வரம்பிலும் திட்டம் அல்லது கிளையண்ட் மூலம் மொத்தங்கள் தூய்மையாக ஒன்றிணைகின்றன.' },
        { title: 'பில் செய்யக்கூடிய vs. உள் பிரிவு', desc: 'உள்ளீடுகளை பில் செய்யக்கூடியதாகக் குறியிடுங்கள்; சுருக்கங்கள் பில் செய்யக்கூடிய மொத்தங்களை தனித்தனியாக காட்டுகின்றன, எனவே இன்வாய்சிங் ஒரே பார்வையில் ஆகிறது.' },
        { title: 'இன்வாய்ஸ்-தயார் மாதாந்திர காட்சி', desc: 'எந்த மாதத்திற்கும் கிளையண்ட் மூலம் தொகுக்கப்பட்ட மணிநேரங்கள், உங்கள் மணிக்கு-விகிதம் பயன்படுத்தப்பட்டது — இன்வாய்ஸில் செல்லும் எண்.' },
      ],
      promptExample: 'ஒரு ஃப்ரீலான்சருக்கான நேர கண்காணிப்பு வெப் ஆப்பை உருவாக்குங்கள்: கிளையண்ட், திட்டம் மற்றும் குறிப்புகளுடன் உள்ளீடுகளைச் சேமிக்கும் தொடக்க/நிறுத்த டைமர் கொண்ட Timer பக்கம்; ஒவ்வொன்றிற்கும் மணிக்கு-விகிதம் மற்றும் அவர்களின் திட்டங்களுடன் கிளையண்ட்களை நிர்வகிக்கும் Clients பக்கம்; மற்றும் தேர்ந்தெடுக்கப்பட்ட மாதத்திற்கு கிளையண்ட் மூலம் தொகுக்கப்பட்ட மணிநேரங்கள் மற்றும் வருவாய்களை, பில் செய்யக்கூடிய மற்றும் பில் செய்யாதவற்றை பிரித்துக் காட்டும் Reports பக்கம்.',
      faqs: [
        { q: 'நான் எவ்வளவு இன்வாய்ஸ் செய்ய வேண்டும் என்று இது கணக்கிட முடியுமா?', a: 'ஆம் — ஒவ்வொரு கிளையண்டுக்கும் மணிக்கு-விகிதம் கொடுங்கள், நீங்கள் தேர்ந்தெடுக்கும் எந்த தேதி வரம்புக்கும் அறிக்கைகள் பக்கம் பில் செய்யக்கூடிய மணிநேரங்களை விகிதத்தால் பெருக்குகிறது.' },
        { q: 'எனது நேர தரவு எங்கே சேமிக்கப்படுகிறது?', a: 'உங்கள் ஆப்பின் சொந்த Postgres தரவுத்தளத்தில் (Supabase), வெளியிடுவதற்கு முன் நேரலையில் ஸ்கேன் செய்யப்பட்ட row-level செக்யூரிட்டியுடன் — உங்கள் மணிநேரங்கள் உங்களுடையவை, உங்கள் உள்கட்டமைப்பில்.' },
        { q: 'நான் Toggl அல்லது ஸ்ப்ரெட்ஷீட்டிலிருந்து வரலாற்றை இறக்குமதி செய்யலாமா?', a: 'சாட்டில் கேட்பதன் மூலம் CSV இறக்குமதி பக்கத்தைச் சேர்க்கவும் — உங்கள் ஏற்றுமதியின் நெடுவரிசைகளை விவரியுங்கள், ஆப் அவற்றை உங்கள் உள்ளீடுகள் அட்டவணையில் மேப் செய்யும்.' },
        { q: 'இது உண்மையில் நேர-டிராக்கர் சந்தாவை விட மலிவானதா?', a: 'நீங்கள் இதை இலவச மாதாந்திர கிரெடிட்களுடன் ஒருமுறை உருவாக்குகிறீர்கள், இது உங்கள் சொந்த ஆப்பாக இயங்குகிறது — மாத-கட்டண டிராக்கர் கட்டணம் இல்லை, மாற்றங்கள் தேவைப்படும்போது எடிட்களுக்கு 2 கிரெடிட்கள் செலவாகும்.' },
      ],
    },
    'team-task-manager': {
      h1: 'AI மூலம் குழு பணி மேலாளரை உருவாக்குங்கள்',
      metaTitle: 'AI மூலம் குழு பணி மேலாண்மை ஆப்-ஐ உருவாக்குங்கள்',
      metaDesc: 'உங்கள் குழுவிற்கான கான்பான்-பாணி பணி மேலாளரை உருவாக்குங்கள் — போர்டுகள், நியமிக்கப்பட்டவர்கள், கடைசி தேதிகள், மற்றும் கருத்துகள் — சாதாரண-ஆங்கில விவரிப்பிலிருந்து உருவாக்கப்பட்டது. தொடங்குவது இலவசம்.',
      tagline: 'உங்கள் குழு உண்மையில் வேலை செய்யும் விதத்திற்குப் பொருந்தும் கான்பான் போர்டு — உங்கள் நெடுவரிசைகள், உங்கள் லேபிள்கள், உங்கள் விதிகள் — வேறொருவரின் ஒன்றை வாடகைக்கு எடுப்பதற்குப் பதிலாக.',
      body: [
        'சிறு குழுக்கள் இரண்டு மோசமான விருப்பங்களுக்கு இடையில் சிக்கியுள்ளன: குழு பாதி பயன்படுத்தும் ஒவ்வொரு-சீட் விலை நிர்ணயிக்கப்பட்ட கனமான திட்ட கருவிகள், மற்றும் இருவர் ஒரே நேரத்தில் எடிட் செய்யும் தருணம் உடைந்துவிடும் பகிரப்பட்ட ஸ்ப்ரெட்ஷீட்கள். பெரும்பாலான ஐந்து-நபர் குழுக்களுக்குத் தேவையானது ஒரே போர்டில் பொருந்தும் — போர்டு அவர்களின் மொழியைப் பேசினால்.',
        'உங்கள் குழு எப்படி வேலை செய்கிறது என்று WyberAiக்குச் சொல்லுங்கள் — வேலை எந்த நிலைகள் வழியாகச் செல்கிறது, யாருக்கு என்ன தெரிய வேண்டும், "முடிந்தது" பணிக்கு என்ன தேவை — அது அந்த சரியான வடிவத்துடன் ஒரு பணி மேலாளரை உருவாக்குகிறது: உண்மையான தரவுத்தளத்தால் ஆதரிக்கப்படும் கான்பான் போர்டு, ஒவ்வொரு-உறுப்பினர் ஒதுக்கீடு, மற்றும் செயல்பாட்டு தடம். இது அங்கீகாரம் மற்றும் பாதுகாப்பு ஸ்கேனுடன் வருகிறது, எனவே குழுவை அழைப்பது முதல் நாளிலிருந்தே பாதுகாப்பானது.',
      ],
      features: [
        { title: 'உங்கள் நெடுவரிசைகளுடன் கான்பான்', desc: 'Backlog → In Progress → Review → Done, அல்லது உங்கள் ஓட்டம் எதுவாக இருந்தாலும் — போர்டு அதைப் பற்றிய உங்கள் விவரிப்பிலிருந்து உருவாக்கப்படுகிறது.' },
        { title: 'நியமிக்கப்பட்டவர்கள் மற்றும் கடைசி தேதிகள்', desc: 'ஒவ்வொரு பணியும் ஒரு உரிமையாளரையும் ஒரு காலக்கெடுவையும் கொண்டுள்ளது; My Tasks காட்சி ஒவ்வொரு நபருக்கும் நிலுவையிலுள்ளதற்கு போர்டை வடிகட்டுகிறது.' },
        { title: 'பணிகளில் கருத்துகள்', desc: 'விவாதம் பணியிலேயே வாழ்கிறது, எனவே சூழல் சாட் த்ரெட்களில் தொலைந்துபோவது நிற்கும்.' },
        { title: 'உள்ளமைந்த குழு அங்கீகாரம்', desc: 'நீங்கள் லிங்கைப் பகிர்வதற்கு முன் நேரலை ஸ்கேன் மூலம் சோதிக்கப்பட்ட row-level செக்யூரிட்டியுடன், உள்நுழைவும் உறுப்பினர்முறையும் இணைக்கப்பட்டு வருகின்றன.' },
      ],
      promptExample: 'குழு பணி மேலாளர் வெப் ஆப்பை உருவாக்குங்கள்: Backlog, This Week, In Progress, மற்றும் Done நெடுவரிசைகளுடன் கூடிய கான்பான் Board பக்கம், பணிகளுக்கு தலைப்பு, விளக்கம், நியமிக்கப்பட்டவர், கடைசி தேதி, மற்றும் முன்னுரிமை இருக்கும்; உள்நுழைந்த பயனரின் பணிகளை கடைசி தேதி வாரியாக வரிசைப்படுத்திக் காட்டும் My Tasks பக்கம்; மற்றும் த்ரெட் செய்யப்பட்ட கருத்துகளுடன் பணி விவரம். குழு உறுப்பினர் மேலாண்மையைச் சேர்க்கவும்.',
      faqs: [
        { q: 'ஒவ்வொரு குழு உறுப்பினருக்கும் அவரவர் லாகின் இருக்க முடியுமா?', a: 'ஆம் — ஆப் அங்கீகாரத்துடன் சேர்த்து உருவாக்கப்படுகிறது, ஒரு உறுப்பினர் அட்டவணை யார் போர்டைப் பார்க்கலாம் மற்றும் எடிட் செய்யலாம் என்பதைக் கட்டுப்படுத்துகிறது.' },
        { q: 'குழு பயன்படுத்தத் தொடங்கிய பிறகு நான் பணிப்பாய்வை மாற்றலாமா?', a: 'ஆம். சாட்டில் கேளுங்கள் — "Blocked நெடுவரிசையைச் சேர்க்கவும்" அல்லது "Done முன் ஒரு சரிபார்ப்பு பட்டியல் தேவை" — ஏற்கனவே உள்ள பணிகளை இழக்காமல் போர்டு புதுப்பிக்கப்படும்.' },
        { q: 'இது Trello பயன்படுத்துவதிலிருந்து எப்படி வேறுபடுகிறது?', a: 'இது உங்கள் சொந்த ஆப்: ஒவ்வொரு-சீட் விலை இல்லை, ஃபீச்சர் கேட்கள் இல்லை, பணிப்பாய்வு லேபிள்கள் மற்றும் பவர்-அப்களால் தோராயமாக்கப்படாமல் உங்கள் குழுவிற்கு வடிவமைக்கப்பட்டுள்ளது.' },
        { q: 'குழுவின் தரவு பாதுகாப்பானதா?', a: 'ஒவ்வொரு WyberAi ஆப்பும் வெளியீட்டுக்கு முன் ஒரு தாக்குபவரைப் போல உங்கள் ஆப்பை ஆராயும் நேரலை தரவுத்தள பாதுகாப்பு ஸ்கேனைப் பெறுகிறது, கடுமையான கசிவுகள் நுழைவாயிலைத் தடுக்கின்றன.' },
      ],
    },
    'job-application-tracker': {
      h1: 'AI மூலம் வேலை விண்ணப்ப டிராக்கரை உருவாக்குங்கள்',
      metaTitle: 'AI மூலம் வேலை விண்ணப்ப டிராக்கர் ஆப்-ஐ உருவாக்குங்கள்',
      metaDesc: 'ஒரே போர்டில் ஒவ்வொரு விண்ணப்பம், நேர்காணல் நிலை, மற்றும் பின்தொடர்தலைக் கண்காணிக்கவும் — சாதாரண ஆங்கிலத்திலிருந்து உருவாக்கப்பட்ட வேலை தேடல் டிராக்கர், குழப்பமான ஸ்ப்ரெட்ஷீட் அல்ல.',
      tagline: 'ஒவ்வொரு விண்ணப்பம், அதன் நிலை, மற்றும் நீங்கள் கடைசியாக எப்போது கேட்டீர்கள் — யதார்த்தத்தை விட மூன்று டேப்கள் பின்தங்கிய ஸ்ப்ரெட்ஷீட்டிற்குப் பதிலாக ஒரே போர்டு.',
      body: [
        'ஒரு தீவிரமான வேலை தேடல் ஒரு ஸ்ப்ரெட்ஷீட் வைத்திருக்க விரும்புவதை விட அதிக நிலையை உருவாக்குகிறது: ரெஸ்யூமேயின் எந்த பதிப்பு எங்கு சென்றது, அந்த ரிக்ரூட்டர் அழைப்பு ஒரு ஸ்க்ரீன் ஆக இருந்ததா அல்லது உண்மையான நேர்காணலா, மற்றும் பதினான்கு "இன்னும் விண்ணப்பதாரர்களை மதிப்பாய்வு செய்கிறோம்" மின்னஞ்சல்களில் எதை இந்த வாரம் நீங்கள் உண்மையில் பின்தொடர வேண்டும். ஸ்ப்ரெட்ஷீட் நீங்கள் மட்டுமே விளக்கக்கூடிய வண்ண கலங்களாக சிதைகிறது.',
        'உங்கள் தேடலை விவரியுங்கள், WyberAi அதைச் சுற்றி டிராக்கரை உருவாக்குகிறது: Applied முதல் Offer வரை ஒரு பைப்லைன் போர்டு, பங்கு, தொடர்பு, மற்றும் ரெஸ்யூமே பதிப்பு இணைக்கப்பட்ட ஒவ்வொரு-விண்ணப்ப பதிவு, மற்றும் உங்கள் சொந்த வரம்பைத் தாண்டி அமைதியாகிவிட்ட எதையும் மேற்பரப்பிற்குக் கொண்டுவரும் பின்தொடர்தல் காட்சி. இவ்வளவு மன அழுத்தமான தேடல் தகுதியான ஒரே அமைப்பு இது — ஒரு பிற்பகலில் கட்டமைக்கப்பட்டது, ஒரு பக்கத் திட்டமாக பராமரிக்கப்படவில்லை.',
      ],
      features: [
        { title: 'நிலை வாரியாக பைப்லைன்', desc: 'Applied, Screening, Interview, Offer, Rejected — முழு தேடலும் ஒரே பார்வையில் தெரியும்படி ஒரு கான்பான் போர்டு.' },
        { title: 'ஒவ்வொரு-விண்ணப்ப பதிவு', desc: 'நிறுவனம், பங்கு, ரெஸ்யூமே பதிப்பு, பரிந்துரை தொடர்பு, மற்றும் சம்பள வரம்பு, அது சேர்ந்த அட்டையுடன் இணைக்கப்பட்டுள்ளது.' },
        { title: 'பின்தொடர்தல் ரேடார்', desc: 'ஒரு குறிப்பிட்ட எண்ணிக்கையிலான நாட்களைக் கடந்தும் புதுப்பிப்பு இல்லாத விண்ணப்பங்கள் தானாகவே மேற்பரப்பிற்கு வருகின்றன — குளிர்ந்து போகின்றவை.' },
        { title: 'நேர்காணல் குறிப்புகள்', desc: 'ஒவ்வொரு சுற்றுக்குப் பிறகும் உடனடியாக என்ன கேட்கப்பட்டது மற்றும் எப்படி நடந்தது என்பதைப் பதிவு செய்யுங்கள், அது அடுத்ததற்கு இன்னும் முக்கியமானதாக இருக்கும் அளவுக்கு புதியதாக இருக்கும்போது.' },
      ],
      promptExample: 'வேலை விண்ணப்ப டிராக்கர் வெப் ஆப்பை உருவாக்குங்கள்: Applied, Screening, Interview, Offer, Rejected கான்பான் நெடுவரிசைகளுடன் Board பக்கம், ஒவ்வொரு அட்டையும் நிறுவனம், பங்கு, மற்றும் விண்ணப்பித்த தேதியைக் காட்டுகிறது; தொடர்பு பெயர், பயன்படுத்திய ரெஸ்யூமே பதிப்பு, சம்பள வரம்பு, மற்றும் இலவச-உரை நேர்காணல் குறிப்புகளுடன் அட்டை விவர காட்சி; மற்றும் கடந்த 10 நாட்களில் எந்த நிலை மாற்றமும் இல்லாத விண்ணப்பங்களைப் பட்டியலிடும் Follow-ups பக்கம்.',
      faqs: [
        { q: 'இது பின்தொடர பரிந்துரைக்க முடியுமா?', a: 'நீங்கள் ஆப்பைத் திறக்கும் ஒவ்வொரு முறையும் Follow-ups காட்சி உங்கள் வரம்பைத் தாண்டிய பழையதை பட்டியலிடுகிறது; உங்களுக்கு புஷ் தேவைப்பட்டால் மின்னஞ்சல் நினைவூட்டல்களைச் சேர்க்க சாட்டைக் கேளுங்கள்.' },
        { q: 'நான் எங்கு எந்த ரெஸ்யூமே பதிப்பை அனுப்பினேன் என்று கண்காணிக்க முடியுமா?', a: 'ஆம் — ஒவ்வொரு விண்ணப்பத்திற்கும் ஒரு ரெஸ்யூமே-பதிப்பு புலத்தை இணைக்கவும், மூன்று வாரங்களில் அவர்கள் திரும்ப அழைத்தால் ரிக்ரூட்டர் என்ன பார்த்திருக்கிறார் என்று உங்களுக்குச் சரியாகத் தெரியும்.' },
        { q: 'எனது தேடலில் புள்ளிவிவரங்களை நான் பார்க்க முடியுமா?', a: 'ஒரு புள்ளிவிவர காட்சியைக் கேளுங்கள் — பதில் விகிதம், ஒவ்வொரு நிலையிலும் சராசரி நேரம், வாரத்திற்கு விண்ணப்பங்கள் — உங்கள் சொந்த தரவிலிருந்து கணக்கிடப்பட்டது.' },
        { q: 'இது ஒரு ஸ்ப்ரெட்ஷீட்டை விட சிறந்ததா?', a: 'ஒரு விண்ணப்பம் அமைதியாகும்போது ஸ்ப்ரெட்ஷீட் உங்களை எச்சரிக்காது அல்லது ஒவ்வொரு-சுற்றுக்கும் கட்டமைக்கப்பட்ட நேர்காணல் குறிப்புகளை வைத்திருக்காது — இந்த டிராக்கர் இரண்டையும் இயல்பாகவே செய்கிறது.' },
      ],
    },
    'reading-list-app': {
      h1: 'AI மூலம் வாசிப்புப் பட்டியல் ஆப்-ஐ உருவாக்குங்கள்',
      metaTitle: 'AI மூலம் வாசிப்புப் பட்டியல் & புத்தக டிராக்கர் ஆப்-ஐ உருவாக்குங்கள்',
      metaDesc: 'உங்கள் படிக்க-வேண்டிய குவியலைக் கண்காணிக்கவும், மதிப்பீடுகளுடன் முடிக்கப்பட்ட புத்தகங்களைப் பதிவு செய்யவும், வருடாந்திர வாசிப்பு இலக்கை அடையவும் — சாதாரண ஆங்கிலத்திலிருந்து கட்டமைக்கப்பட்ட புத்தக டிராக்கர், உங்களுடையதாக வைத்திருக்க.',
      tagline: 'படிக்க-வேண்டிய குவியல், நீங்கள் இப்போது படிப்பது, மற்றும் வருடாந்திர எண்ணிக்கை — உங்கள் வேகத்தைக் குற்றவுணர்வூட்டும் சமூக ஊட்டம் இல்லாமல்.',
      body: [
        'Goodreads நீங்கள் கேட்காத ஒரு சமூக நெட்வொர்க்கில் அதைச் சுற்றுவதன் மூலம் புத்தக கண்காணிப்பைத் தீர்க்கிறது, பெரும்பாலான வாசிப்பு-டிராக்கர் ஆப்கள் கண்டுபிடிப்பைத் தீர்க்கின்றன, உண்மையான பிரச்சனையை அல்ல: நீங்கள் படிக்க நினைத்த புத்தகங்களின் எப்போதும் வளரும் பட்டியல், தற்போதைய ஒன்றை எங்கு நிறுத்தினீர்கள் என்ற நினைவு இல்லை, இது 20-புத்தக வருடமா அல்லது 50-புத்தக வருடமா என்ற நேர்மையான உணர்வு இல்லை.',
        'நீங்கள் எப்படி படிக்கிறீர்கள் என்று WyberAiக்குச் சொல்லுங்கள் — உடல் ரீதியான, இபுக், ஆடியோபுக், அல்லது மூன்றும் — அது அதற்கு ஏற்ப ஒரு டிராக்கரை உருவாக்குகிறது: நீங்கள் விருப்பப்படி சேர்க்கும் படிக்க-வேண்டிய அலமாரி, வினாடிகளில் நீங்கள் புதுப்பிக்கும் பக்கம் அல்லது சதவீதத்துடன் தற்போது-படிக்கும் காட்சி, மற்றும் உங்கள் சொந்த மதிப்பீடு மற்றும் எதிர்கால-உங்களுக்கான குறிப்புடன் முடிக்கப்பட்ட அலமாரி. வருடாந்திர இலக்கு கவுண்டர் "நான் அதிகம் படிக்க வேண்டும்" என்பதை நீங்கள் உண்மையில் நகர்வதைப் பார்க்கக்கூடிய எண்ணாக மாற்றுகிறது.',
      ],
      features: [
        { title: 'படிக்க-வேண்டிய அலமாரி', desc: 'யாராவது அவற்றைக் குறிப்பிடும் தருணத்தில் புத்தகங்களைச் சேர்க்கவும் — தலைப்பு, ஆசிரியர், மற்றும் நீங்கள் ஏன் இதைப் படிக்க விரும்புகிறீர்கள்.' },
        { title: 'தற்போது படிக்கும் முன்னேற்றம்', desc: 'நீங்கள் தொடரும்போது பக்க எண் அல்லது சதவீதத்தைப் புதுப்பிக்கவும்; ஒவ்வொரு புத்தகத்திலும் நீங்கள் எவ்வளவு தூரம் இருக்கிறீர்கள் என்பதை ஆப் காட்டுகிறது.' },
        { title: 'மதிப்பீடுகளுடன் முடிக்கப்பட்ட அலமாரி', desc: 'உங்கள் சொந்த நட்சத்திர மதிப்பீடு மற்றும் ஒவ்வொரு-புத்தகத்திற்கும் ஒரு சிறு குறிப்பு — பின்னர் புத்தகங்களைப் பரிந்துரைக்க உண்மையில் உதவும் பதிவு.' },
        { title: 'வருடாந்திர வாசிப்பு இலக்கு', desc: 'ஆண்டுக்கு-புத்தகங்கள் இலக்கை அமைத்து, முடிக்கப்பட்ட புத்தகங்கள் அலமாரியில் வரும்போது முன்னேற்றப் பட்டி நிரம்புவதைப் பாருங்கள்.' },
      ],
      promptExample: 'வாசிப்புப் பட்டியல் மொபைல் ஆப்பை உருவாக்குங்கள்: நான் தலைப்பு, ஆசிரியர், மற்றும் வடிவம் (உடல் ரீதியான/இபுக்/ஆடியோபுக்) கொண்ட புத்தகங்களைச் சேர்க்கும் To Be Read திரை; நான் புதுப்பிக்கும் பக்கம் அல்லது சதவீத ஸ்லைடருடன் முன்னேற்றத்தில் உள்ள புத்தகங்களைக் காட்டும் Currently Reading திரை; எனது நட்சத்திர மதிப்பீடு மற்றும் சிறு குறிப்புடன் முடிக்கப்பட்ட புத்தகங்களைப் பட்டியலிடும் Finished திரை; மற்றும் நான் அமைத்த இலக்குக்கு எதிராக இந்த ஆண்டு முடிக்கப்பட்ட புத்தகங்களைக் காட்டும் Goal திரை.',
      faqs: [
        { q: 'இது உடல் ரீதியான புத்தகங்களிலிருந்து ஆடியோபுக்குகளை வித்தியாசமாக கண்காணிக்க முடியுமா?', a: 'ஆம் — ஒவ்வொரு புத்தகத்திற்கும் வடிவத்தை அமைக்கவும், ஆடியோபுக்குகளுக்கு பக்க எண்ணிற்குப் பதிலாக சதவீதம் அல்லது கேட்ட நேரத்தால் முன்னேற்றத்தைக் கண்காணிக்கவும்.' },
        { q: 'இது புத்தகங்களைப் பரிந்துரைக்குமா?', a: 'இல்லை — இது ஒரு தனிப்பட்ட டிராக்கர், கண்டுபிடிப்பு ஊட்டம் அல்ல. இது உங்கள் சொந்த அலமாரிகளைக் காட்டுகிறது, ஒரு மார்க்கெட்பிளேஸ் நீங்கள் அடுத்து வாங்க வேண்டும் என்று விரும்புவதை அல்ல.' },
        { q: 'நான் புத்தகங்களை வகை அல்லது தொடர் மூலம் ஒழுங்கமைக்க முடியுமா?', a: 'உங்கள் ப்ராம்ப்ட்டில் குறிச்சொற்கள் அல்லது தொடர் புலத்தைச் சேர்க்கவும், அலமாரிகள் அவற்றின் மூலம் வடிகட்டலாம் அல்லது தொகுக்கலாம்.' },
        { q: 'எனது வாசிப்பு தரவு தனிப்பட்டதா?', a: 'இது உங்கள் சொந்த தரவுத்தளத்தில் உங்கள் சொந்த ஆப் — நீங்கள் குறிப்பாக ஒன்றை உருவாக்காத வரை எதுவும் சமூக ஊட்டத்திற்குப் பகிரப்படாது.' },
      ],
    },
  },
}
