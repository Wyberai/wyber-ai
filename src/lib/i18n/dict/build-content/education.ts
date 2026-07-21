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
// content for the "education" category /build/[slug] pages (English source:
// src/app/build/data/education.ts). Proper nouns, brand names, and tech
// terms (WyberAi, React Native, Expo, Anki, CSV, YouTube, Vimeo) are left
// untranslated across every locale — only the surrounding prose is
// translated. slug/target/category/related live on BuildPage itself and
// aren't duplicated here.
export const EDUCATION_BUILD_CONTENT: Record<Locale, Record<string, TranslatedBuildPage>> = {
  en: {
    'quiz-maker-app': {
      h1: 'Build a Quiz App with AI',
      metaTitle: 'Build a Quiz Maker App with AI — No Code',
      metaDesc: 'Create a quiz app with timed questions, instant scoring, and a results dashboard — for classrooms, training, or trivia nights. Built from plain English.',
      tagline: 'Write the questions, share a link, watch the scores come in — for a classroom, a compliance training, or Friday trivia.',
      body: [
        'Quiz tools split by audience and charge accordingly: classroom platforms bill per student, corporate training tools bill per seat, and trivia apps bill the host — for what is structurally the same product. Questions in, answers scored, results tallied.',
        'Building your own collapses all three into one app shaped to your use. Describe the quiz experience you want — question types, timing, whether wrong answers show explanations — and WyberAi generates it end to end: an editor where you write questions, a clean taking experience on any device, and a results view that shows you per-question breakdowns. A teacher sees which concept the class missed; a trivia host gets a live leaderboard; a trainer gets completion records.',
      ],
      features: [
        { title: 'Question editor', desc: 'Multiple choice, true/false, short answer — write and reorder questions with correct answers and optional explanations.' },
        { title: 'Timed or untimed play', desc: 'Per-question countdowns for trivia energy, or relaxed untimed mode for learning checks.' },
        { title: 'Instant scoring', desc: 'Results at submit, with per-question review and the explanations you wrote for the misses.' },
        { title: 'Results dashboard', desc: 'Every attempt logged — scores, completion, and which questions the group got wrong most.' },
      ],
      promptExample: 'Build a quiz web app: an admin Editor page (login) where I create quizzes with multiple-choice and true/false questions, each with a correct answer and an explanation; a public quiz-taking page with one question at a time, a 30-second timer per question, and a final score screen with per-question review; and a Results dashboard showing all attempts with scores and a most-missed-questions chart.',
      faqs: [
        { q: 'Can students take it on their phones?', a: 'Yes — the taking experience is a mobile-first web page; you share a link and it works on any device with a browser.' },
        { q: 'Can I stop people from retaking a quiz?', a: 'Set attempt rules in your prompt — one attempt per email, or unlimited practice mode — and the app enforces them.' },
        { q: 'Can it show a live leaderboard for trivia night?', a: 'Yes — ask for a leaderboard screen that updates as answers come in, and project it while players answer on their phones.' },
        { q: 'How many quizzes can I create?', a: 'As many as you like — quizzes are rows in your own database, not per-quiz charges on a platform plan.' },
      ],
    },
    'flashcard-app': {
      h1: 'Build a Flashcard App with AI',
      metaTitle: 'Build a Flashcard Study App with AI — Spaced Repetition',
      metaDesc: 'Your own spaced-repetition flashcard app — decks, review scheduling, and progress stats — generated from a plain-English description in minutes.',
      tagline: 'Decks, daily reviews, and spaced repetition that resurfaces a card right before you\'d forget it — in an app built around how you study.',
      body: [
        'Flashcard software inspires strong loyalty and stronger complaints: the powerful one has a learning curve steeper than most exams, and the friendly ones meter your decks and cards through a subscription. Underneath both is an algorithm — spaced repetition — that is well understood and eminently generatable.',
        'Describe what you\'re studying and how you want reviews to feel, and WyberAi builds your version: decks for your subjects, a swipe-through review session that schedules each card by how well you knew it, and stats that show your retention actually climbing as an exam approaches. Medical mnemonics with images, language cards with audio, formula cards with rendered math — the card template is yours to define.',
      ],
      features: [
        { title: 'Decks and sub-decks', desc: 'Organize by subject, chapter, or exam — study one deck or everything due today across all of them.' },
        { title: 'Spaced-repetition scheduling', desc: 'Rate each card Again/Hard/Good/Easy and the next review lands at the interval that maximizes retention.' },
        { title: 'Your card format', desc: 'Front/back text, images, hints, example sentences — the card template matches your material.' },
        { title: 'Retention stats', desc: 'Cards due, daily streak, and per-deck accuracy — the picture of whether the studying is working.' },
      ],
      promptExample: 'Build a flashcard mobile app with spaced repetition: a Decks screen where I create decks and add cards with front, back, and an optional hint; a Review screen showing due cards one at a time — tap to flip, then rate Again, Hard, Good, or Easy, with intervals growing per rating; and a Stats screen with cards due today, current streak, and accuracy per deck. Fast and minimal, optimized for one-handed review.',
      faqs: [
        { q: 'How does the spaced repetition actually work?', a: 'Each rating adjusts the card\'s next interval — misses come back within minutes, easy cards stretch to days then weeks. The scheduling runs on your review history in your own database.' },
        { q: 'Can I import my existing Anki or CSV decks?', a: 'Ask for a CSV import in your prompt — export your decks to CSV, map the columns once, and your cards carry their content in.' },
        { q: 'Can two languages share one card?', a: 'Yes — language decks work naturally as front/back pairs, and you can add fields like pronunciation, audio, or an example sentence per card.' },
        { q: 'Will it work during my commute?', a: 'It generates as a React Native + Expo app — ask for offline review in your prompt and sessions sync back when you\'re online.' },
      ],
    },
    'online-course-platform': {
      h1: 'Build an Online Course Platform with AI',
      metaTitle: 'Build Your Own Course Platform with AI — No Code',
      metaDesc: 'Host your course on your own platform: modules, lessons, student progress, and completion tracking — generated from plain English, no revenue share.',
      tagline: 'Your course on your own domain — modules, progress tracking, your brand — with no marketplace discounting your work to $9.99.',
      body: [
        'Course creators get squeezed from both directions: marketplaces set the price floor and own the student relationship, while hosted course platforms take monthly rent that scales with the features you were promised would grow your business. Either way, the platform is the brand and you\'re the content.',
        'A course platform is modules, lessons, and a record of who finished what — well within a description\'s reach. Tell WyberAi how your course is structured and what students should experience, and it generates your school: a landing page that sells the course, gated lesson content with video embeds, progress that picks up where the student left off, and a teacher\'s view of who\'s advancing and who\'s stalled. Your domain, your pricing, your student emails.',
      ],
      features: [
        { title: 'Modules and lessons', desc: 'Your curriculum as structured content — video embeds, rich text, downloads, ordered exactly as you teach it.' },
        { title: 'Student progress tracking', desc: 'Lessons check off as completed; students resume where they stopped, and momentum stays visible.' },
        { title: 'Gated enrollment', desc: 'Content behind student accounts — enroll manually, by invite, or wire up payments when you\'re ready to sell.' },
        { title: 'Teacher dashboard', desc: 'Enrollment counts, per-student progress, and completion rates per module — where students stall is where the course needs work.' },
      ],
      promptExample: 'Build an online course platform web app: a public landing page describing my course with curriculum outline and an enroll button; a student area (login required) with modules containing lessons (video embed, rich text notes, downloadable resources), completion checkboxes, and a progress bar; and a teacher Dashboard showing enrolled students, their progress percentages, and completion rate per module.',
      faqs: [
        { q: 'Where do the videos live?', a: 'Embed from YouTube (unlisted), Vimeo, or any host — the lesson player embeds your links, so you keep your existing video workflow.' },
        { q: 'Can I charge for enrollment?', a: 'Launch free or invite-only, then add a payment step in chat when you\'re ready — the course structure underneath doesn\'t change.' },
        { q: 'Can I run more than one course?', a: 'Yes — the structure extends to multiple courses under one school, each with its own landing page and enrollment.' },
        { q: 'What about certificates?', a: 'Ask for a completion certificate page in your prompt or later — students who finish get a shareable, dated certificate with your branding.' },
      ],
    },
    'gradebook-app-for-teachers': {
      h1: 'Build a Gradebook App for Teachers with AI',
      metaTitle: 'Build a Gradebook App for Teachers with AI',
      metaDesc: 'Class rosters, assignment grades, and auto-calculated averages — a gradebook app generated from plain English, shaped to how you actually grade.',
      tagline: 'Enter one grade, watch the average update — a gradebook shaped to your weighting and your classes, not a district-wide system\'s rigid template.',
      body: [
        'School-issued gradebook systems are built for administrators first and teachers second — rigid categories, weighting rules you can\'t adjust, and a UI designed for compliance reporting rather than the daily reality of entering forty quiz scores between periods. Teachers end up keeping a personal spreadsheet anyway, just to actually understand their own class.',
        'Describe how you grade — categories, weights, how you want to see the class distribution — and WyberAi builds a gradebook around your method: a roster per class, an entry grid for assignments and scores, and averages that recalculate the instant a grade lands, weighted exactly the way your syllabus says they should be.',
      ],
      features: [
        { title: 'Class rosters', desc: 'Students grouped by class or period, each with their own assignment history and running average.' },
        { title: 'Assignment grade grid', desc: 'Enter scores for a whole class against one assignment in a fast spreadsheet-like grid.' },
        { title: 'Weighted averages', desc: 'Homework, quizzes, and tests weighted your way — the overall grade reflects your syllabus, not a generic default.' },
        { title: 'Exportable reports', desc: 'A per-student or per-class report ready to hand to parents or administration, generated from your own gradebook.' },
      ],
      promptExample: 'Build a gradebook web app for a teacher: a Classes page listing my classes with student rosters; an Assignments page per class where I create assignments (category: homework, quiz, test, each with a weight) and enter scores for every student in a grid; a Student detail view showing all their scores and a weighted current average; and a Reports page exporting grades per class to CSV.',
      faqs: [
        { q: 'Can I set my own grade weighting?', a: 'Yes — define your categories and their percentage weights in your prompt, and every average calculates using your exact syllabus rule.' },
        { q: 'Can it handle multiple classes or periods?', a: 'Yes — each class has its own roster, assignments, and grades, so a student in two of your classes is tracked separately in each.' },
        { q: 'Can students or parents view grades?', a: 'Add a student or parent login in your prompt for a read-only view of just their own grades, separate from your teacher view.' },
        { q: 'Does it calculate letter grades too?', a: 'Describe your grading scale (A is 90+, etc.) and the app can show a letter grade alongside the numeric average.' },
      ],
    },
  },
  hi: {
    'quiz-maker-app': {
      h1: 'AI से क्विज़ ऐप बनाएं',
      metaTitle: 'AI से क्विज़ मेकर ऐप बनाएं — बिना कोड',
      metaDesc: 'टाइम्ड सवालों, तुरंत स्कोरिंग, और एक रिज़ल्ट्स डैशबोर्ड वाला क्विज़ ऐप बनाएं — क्लासरूम, ट्रेनिंग, या ट्रिविया नाइट्स के लिए। सादी अंग्रेज़ी से बना।',
      tagline: 'सवाल लिखें, एक लिंक शेयर करें, स्कोर आते देखें — किसी क्लासरूम, कॉम्प्लायंस ट्रेनिंग, या शुक्रवार की ट्रिविया के लिए।',
      body: [
        'क्विज़ टूल्स ऑडियंस के हिसाब से बंटे हैं और उसी हिसाब से चार्ज करते हैं: क्लासरूम प्लेटफ़ॉर्म प्रति-स्टूडेंट बिल करते हैं, कॉर्पोरेट ट्रेनिंग टूल्स प्रति-सीट बिल करते हैं, और ट्रिविया ऐप्स होस्ट को बिल करते हैं — जबकि यह ढांचागत रूप से वही प्रोडक्ट है। सवाल अंदर, जवाब स्कोर, नतीजे गिने गए।',
        'अपना खुद बनाना इन तीनों को एक ऐप में समेट देता है जो आपके इस्तेमाल के हिसाब से बना है। जो क्विज़ अनुभव आप चाहते हैं उसे बताएं — सवालों के प्रकार, टाइमिंग, गलत जवाबों पर स्पष्टीकरण दिखे या नहीं — और WyberAi इसे शुरू से अंत तक जनरेट करता है: एक एडिटर जहां आप सवाल लिखते हैं, किसी भी डिवाइस पर एक साफ़-सुथरा देने का अनुभव, और एक रिज़ल्ट्स व्यू जो आपको हर-सवाल का ब्रेकडाउन दिखाता है। एक टीचर देखता है कि क्लास ने कौन सा कॉन्सेप्ट मिस किया; एक ट्रिविया होस्ट को लाइव लीडरबोर्ड मिलता है; एक ट्रेनर को कम्प्लीशन रिकॉर्ड मिलते हैं।',
      ],
      features: [
        { title: 'सवाल एडिटर', desc: 'मल्टीपल चॉइस, ट्रू/फ़ॉल्स, शॉर्ट आंसर — सही जवाबों और ऑप्शनल स्पष्टीकरण के साथ सवाल लिखें और उनका क्रम बदलें।' },
        { title: 'टाइम्ड या अनटाइम्ड प्ले', desc: 'ट्रिविया एनर्जी के लिए प्रति-सवाल काउंटडाउन, या लर्निंग चेक्स के लिए रिलैक्स्ड अनटाइम्ड मोड।' },
        { title: 'तुरंत स्कोरिंग', desc: 'सबमिट पर नतीजे, हर-सवाल की समीक्षा और गलत जवाबों के लिए आपके लिखे स्पष्टीकरण के साथ।' },
        { title: 'रिज़ल्ट्स डैशबोर्ड', desc: 'हर प्रयास लॉग होता है — स्कोर, कम्प्लीशन, और कौन से सवाल ग्रुप ने सबसे ज़्यादा गलत किए।' },
      ],
      promptExample: 'एक क्विज़ वेब ऐप बनाएं: एक एडमिन Editor पेज (लॉगिन) जहां मैं मल्टीपल-चॉइस और ट्रू/फ़ॉल्स सवालों के साथ क्विज़ बनाऊं, हर एक का एक सही जवाब और स्पष्टीकरण हो; एक पब्लिक क्विज़-टेकिंग पेज जिसमें एक बार में एक सवाल हो, हर सवाल पर 30-सेकंड का टाइमर हो, और हर-सवाल की समीक्षा के साथ एक फ़ाइनल स्कोर स्क्रीन हो; और एक Results डैशबोर्ड जो सभी प्रयासों को स्कोर और सबसे-ज़्यादा-गलत-सवालों वाले चार्ट के साथ दिखाए।',
      faqs: [
        { q: 'क्या स्टूडेंट इसे अपने फ़ोन पर दे सकते हैं?', a: 'हां — देने का अनुभव एक मोबाइल-फ़र्स्ट वेब पेज है; आप एक लिंक शेयर करते हैं और यह ब्राउज़र वाली किसी भी डिवाइस पर काम करता है।' },
        { q: 'क्या मैं लोगों को क्विज़ दोबारा देने से रोक सकता हूं?', a: 'अपने प्रॉम्प्ट में प्रयास नियम सेट करें — प्रति ईमेल एक प्रयास, या असीमित प्रैक्टिस मोड — और ऐप उन्हें लागू करता है।' },
        { q: 'क्या यह ट्रिविया नाइट के लिए लाइव लीडरबोर्ड दिखा सकता है?', a: 'हां — जवाब आते ही अपडेट होने वाली एक लीडरबोर्ड स्क्रीन मांगें, और प्लेयर्स के फ़ोन पर जवाब देते समय इसे प्रोजेक्ट करें।' },
        { q: 'मैं कितने क्विज़ बना सकता हूं?', a: 'जितने चाहें उतने — क्विज़ आपके अपने डेटाबेस में रो हैं, किसी प्लेटफ़ॉर्म प्लान पर प्रति-क्विज़ चार्ज नहीं।' },
      ],
    },
    'flashcard-app': {
      h1: 'AI से फ़्लैशकार्ड ऐप बनाएं',
      metaTitle: 'AI से फ़्लैशकार्ड स्टडी ऐप बनाएं — स्पेस्ड रिपिटीशन',
      metaDesc: 'आपका अपना स्पेस्ड-रिपिटीशन फ़्लैशकार्ड ऐप — डेक्स, रिव्यू शेड्यूलिंग, और प्रोग्रेस स्टैट्स — मिनटों में सादी अंग्रेज़ी विवरण से जनरेट किया गया।',
      tagline: 'डेक्स, डेली रिव्यूज़, और स्पेस्ड रिपिटीशन जो एक कार्ड को ठीक उसी वक़्त फिर दिखाता है जब आप उसे भूलने वाले होते — एक ऐप में जो आपके पढ़ने के तरीके के इर्द-गिर्द बना है।',
      body: [
        'फ़्लैशकार्ड सॉफ़्टवेयर मज़बूत वफ़ादारी और उससे भी मज़बूत शिकायतें जगाता है: पावरफ़ुल वाले की लर्निंग कर्व ज़्यादातर एग्ज़ाम से भी खड़ी है, और फ्रेंडली वाले आपके डेक्स और कार्ड्स को सब्सक्रिप्शन के ज़रिए नापते हैं। दोनों के नीचे एक अल्गोरिद्म है — स्पेस्ड रिपिटीशन — जो अच्छी तरह समझा गया और आसानी से जनरेट किया जा सकने वाला है।',
        'आप क्या पढ़ रहे हैं और रिव्यूज़ कैसे महसूस हों यह बताएं, और WyberAi आपका वर्ज़न बनाता है: आपके विषयों के लिए डेक्स, एक स्वाइप-थ्रू रिव्यू सेशन जो हर कार्ड को इस हिसाब से शेड्यूल करता है कि आप उसे कितना जानते थे, और स्टैट्स जो दिखाते हैं कि एग्ज़ाम पास आते ही आपकी रिटेंशन असल में बढ़ रही है। इमेज वाले मेडिकल निमोनिक्स, ऑडियो वाले लैंग्वेज कार्ड्स, रेंडर किए गए मैथ वाले फ़ॉर्मूला कार्ड्स — कार्ड टेम्पलेट आप ख़ुद तय करते हैं।',
      ],
      features: [
        { title: 'डेक्स और सब-डेक्स', desc: 'विषय, चैप्टर, या एग्ज़ाम के हिसाब से व्यवस्थित करें — एक डेक पढ़ें या इन सबमें आज ड्यू सब कुछ।' },
        { title: 'स्पेस्ड-रिपिटीशन शेड्यूलिंग', desc: 'हर कार्ड को Again/Hard/Good/Easy रेट करें और अगला रिव्यू उस अंतराल पर आता है जो रिटेंशन को सबसे ज़्यादा करता है।' },
        { title: 'आपका कार्ड फ़ॉर्मैट', desc: 'फ्रंट/बैक टेक्स्ट, इमेजेस, हिंट्स, उदाहरण वाक्य — कार्ड टेम्पलेट आपकी सामग्री से मेल खाता है।' },
        { title: 'रिटेंशन स्टैट्स', desc: 'ड्यू कार्ड्स, डेली स्ट्रीक, और प्रति-डेक सटीकता — यह तस्वीर कि पढ़ाई काम कर रही है या नहीं।' },
      ],
      promptExample: 'स्पेस्ड रिपिटीशन के साथ एक फ़्लैशकार्ड मोबाइल ऐप बनाएं: एक Decks स्क्रीन जहां मैं डेक्स बनाऊं और फ्रंट, बैक, और एक ऑप्शनल हिंट के साथ कार्ड्स जोड़ूं; एक Review स्क्रीन जो ड्यू कार्ड्स एक-एक करके दिखाए — टैप कर पलटें, फिर Again, Hard, Good, या Easy रेट करें, हर रेटिंग पर अंतराल बढ़ता जाए; और एक Stats स्क्रीन जिसमें आज ड्यू कार्ड्स, मौजूदा स्ट्रीक, और प्रति-डेक सटीकता हो। तेज़ और मिनिमल, एक-हाथ से रिव्यू के लिए ऑप्टिमाइज़्ड।',
      faqs: [
        { q: 'स्पेस्ड रिपिटीशन असल में कैसे काम करता है?', a: 'हर रेटिंग कार्ड के अगले अंतराल को एडजस्ट करती है — मिस्ड कार्ड मिनटों में वापस आते हैं, आसान कार्ड दिनों फिर हफ़्तों तक फैलते हैं। शेड्यूलिंग आपके अपने डेटाबेस में आपकी रिव्यू हिस्ट्री पर चलती है।' },
        { q: 'क्या मैं अपने मौजूदा Anki या CSV डेक्स इम्पोर्ट कर सकता हूं?', a: 'अपने प्रॉम्प्ट में CSV इम्पोर्ट मांगें — अपने डेक्स को CSV में एक्सपोर्ट करें, कॉलम एक बार मैप करें, और आपके कार्ड्स अपनी सामग्री के साथ अंदर आ जाते हैं।' },
        { q: 'क्या दो भाषाएं एक कार्ड शेयर कर सकती हैं?', a: 'हां — लैंग्वेज डेक्स स्वाभाविक रूप से फ्रंट/बैक जोड़ी की तरह काम करते हैं, और आप प्रति-कार्ड उच्चारण, ऑडियो, या उदाहरण वाक्य जैसे फ़ील्ड जोड़ सकते हैं।' },
        { q: 'क्या यह मेरी कम्यूट के दौरान काम करेगा?', a: 'यह React Native + Expo ऐप के रूप में जनरेट होता है — अपने प्रॉम्प्ट में ऑफ़लाइन रिव्यू मांगें और ऑनलाइन होते ही सेशंस सिंक हो जाते हैं।' },
      ],
    },
    'online-course-platform': {
      h1: 'AI से ऑनलाइन कोर्स प्लेटफ़ॉर्म बनाएं',
      metaTitle: 'AI से अपना खुद का कोर्स प्लेटफ़ॉर्म बनाएं — बिना कोड',
      metaDesc: 'अपने कोर्स को अपने प्लेटफ़ॉर्म पर होस्ट करें: मॉड्यूल्स, लेसन्स, स्टूडेंट प्रोग्रेस, और कम्प्लीशन ट्रैकिंग — सादी अंग्रेज़ी से जनरेट, कोई रेवेन्यू शेयर नहीं।',
      tagline: 'आपके अपने डोमेन पर आपका कोर्स — मॉड्यूल्स, प्रोग्रेस ट्रैकिंग, आपका ब्रांड — बिना किसी मार्केटप्लेस के जो आपके काम को $9.99 में डिस्काउंट कर दे।',
      body: [
        'कोर्स क्रिएटर्स दोनों दिशाओं से दबाए जाते हैं: मार्केटप्लेस प्राइस फ़्लोर तय करते हैं और स्टूडेंट रिलेशनशिप के मालिक बन जाते हैं, जबकि होस्टेड कोर्स प्लेटफ़ॉर्म हर महीने किराया लेते हैं जो उन्हीं फ़ीचर्स के साथ बढ़ता है जिनका वादा आपका बिज़नेस बढ़ाने का था। दोनों ही स्थिति में, प्लेटफ़ॉर्म ब्रांड है और आप सिर्फ़ कंटेंट हैं।',
        'कोर्स प्लेटफ़ॉर्म मॉड्यूल्स, लेसन्स, और किसने क्या पूरा किया इसका रिकॉर्ड है — जो एक विवरण की पहुंच में अच्छी तरह आता है। WyberAi को बताएं आपका कोर्स कैसे संरचित है और स्टूडेंट्स को क्या अनुभव मिलना चाहिए, और यह आपका स्कूल जनरेट करता है: एक लैंडिंग पेज जो कोर्स बेचता है, वीडियो एम्बेड्स के साथ गेटेड लेसन कंटेंट, प्रोग्रेस जो वहीं से शुरू होता है जहां स्टूडेंट ने छोड़ा था, और एक टीचर व्यू जो दिखाता है कौन आगे बढ़ रहा है और कौन अटका है। आपका डोमेन, आपकी प्राइसिंग, आपके स्टूडेंट ईमेल्स।',
      ],
      features: [
        { title: 'मॉड्यूल्स और लेसन्स', desc: 'आपका करिकुलम स्ट्रक्चर्ड कंटेंट के रूप में — वीडियो एम्बेड्स, रिच टेक्स्ट, डाउनलोड्स, ठीक वैसे क्रम में जैसे आप पढ़ाते हैं।' },
        { title: 'स्टूडेंट प्रोग्रेस ट्रैकिंग', desc: 'लेसन्स पूरा होने पर चेक हो जाते हैं; स्टूडेंट वहीं से फिर शुरू करते हैं जहां छोड़ा था, और मोमेंटम दिखता रहता है।' },
        { title: 'गेटेड एनरोलमेंट', desc: 'स्टूडेंट अकाउंट्स के पीछे कंटेंट — मैन्युअली, इनवाइट से एनरोल करें, या तैयार होने पर पेमेंट्स जोड़ें।' },
        { title: 'टीचर डैशबोर्ड', desc: 'एनरोलमेंट काउंट्स, प्रति-स्टूडेंट प्रोग्रेस, और प्रति-मॉड्यूल कम्प्लीशन रेट्स — जहां स्टूडेंट्स अटकते हैं वहीं कोर्स को काम की ज़रूरत है।' },
      ],
      promptExample: 'एक ऑनलाइन कोर्स प्लेटफ़ॉर्म वेब ऐप बनाएं: करिकुलम आउटलाइन और एक एनरोल बटन के साथ मेरे कोर्स को बताने वाला एक पब्लिक लैंडिंग पेज; मॉड्यूल्स (वीडियो एम्बेड, रिच टेक्स्ट नोट्स, डाउनलोड करने योग्य रिसोर्सेज़ वाले लेसन्स), कम्प्लीशन चेकबॉक्स, और एक प्रोग्रेस बार वाला एक स्टूडेंट एरिया (लॉगिन ज़रूरी); और एनरोल्ड स्टूडेंट्स, उनकी प्रोग्रेस पर्सेंटेज, और प्रति-मॉड्यूल कम्प्लीशन रेट दिखाने वाला एक टीचर Dashboard।',
      faqs: [
        { q: 'वीडियो कहां रहते हैं?', a: 'YouTube (अनलिस्टेड), Vimeo, या किसी भी होस्ट से एम्बेड करें — लेसन प्लेयर आपके लिंक्स एम्बेड करता है, तो आपका मौजूदा वीडियो वर्कफ़्लो बना रहता है।' },
        { q: 'क्या मैं एनरोलमेंट के लिए चार्ज कर सकता हूं?', a: 'फ़्री या इनवाइट-ओनली लॉन्च करें, फिर तैयार होने पर चैट में एक पेमेंट स्टेप जोड़ें — नीचे का कोर्स स्ट्रक्चर नहीं बदलता।' },
        { q: 'क्या मैं एक से ज़्यादा कोर्स चला सकता हूं?', a: 'हां — यह ढांचा एक स्कूल के तहत कई कोर्सेज़ तक बढ़ता है, हर एक का अपना लैंडिंग पेज और एनरोलमेंट।' },
        { q: 'सर्टिफ़िकेट्स के बारे में क्या?', a: 'अपने प्रॉम्प्ट में या बाद में एक कम्प्लीशन सर्टिफ़िकेट पेज मांगें — पूरा करने वाले स्टूडेंट्स को आपकी ब्रांडिंग के साथ एक शेयर करने योग्य, तारीख़ वाला सर्टिफ़िकेट मिलता है।' },
      ],
    },
    'gradebook-app-for-teachers': {
      h1: 'AI से टीचर्स के लिए ग्रेडबुक ऐप बनाएं',
      metaTitle: 'AI से टीचर्स के लिए ग्रेडबुक ऐप बनाएं',
      metaDesc: 'क्लास रोस्टर्स, असाइनमेंट ग्रेड्स, और ऑटो-कैलकुलेटेड एवरेज — सादी अंग्रेज़ी से जनरेट किया गया ग्रेडबुक ऐप, आपके ग्रेड करने के असल तरीके के हिसाब से बना।',
      tagline: 'एक ग्रेड डालें, एवरेज अपडेट होते देखें — एक ग्रेडबुक जो आपकी वेटिंग और आपकी क्लासेज़ के हिसाब से बना है, किसी डिस्ट्रिक्ट-वाइड सिस्टम के कड़े टेम्पलेट जैसा नहीं।',
      body: [
        'स्कूल की दी हुई ग्रेडबुक सिस्टम्स पहले एडमिनिस्ट्रेटर्स के लिए और बाद में टीचर्स के लिए बनी होती हैं — कड़ी कैटेगरीज़, वेटिंग नियम जिन्हें आप एडजस्ट नहीं कर सकते, और एक UI जो कम्प्लायंस रिपोर्टिंग के लिए बना है, न कि पीरियड्स के बीच चालीस क्विज़ स्कोर डालने की रोज़मर्रा की सच्चाई के लिए। टीचर्स आख़िरकार अपनी ही क्लास को असल में समझने के लिए एक पर्सनल स्प्रेडशीट रखते ही हैं।',
        'आप कैसे ग्रेड करते हैं यह बताएं — कैटेगरीज़, वेट्स, आप क्लास डिस्ट्रीब्यूशन कैसे देखना चाहते हैं — और WyberAi आपके तरीके के इर्द-गिर्द एक ग्रेडबुक बनाता है: प्रति-क्लास एक रोस्टर, असाइनमेंट्स और स्कोर्स के लिए एक एंट्री ग्रिड, और एवरेज जो ग्रेड डालते ही तुरंत दोबारा कैलकुलेट होते हैं, ठीक वैसे ही वेटेड जैसा आपका सिलेबस कहता है।',
      ],
      features: [
        { title: 'क्लास रोस्टर्स', desc: 'क्लास या पीरियड के हिसाब से ग्रुप किए गए स्टूडेंट्स, हर एक की अपनी असाइनमेंट हिस्ट्री और चलता हुआ एवरेज।' },
        { title: 'असाइनमेंट ग्रेड ग्रिड', desc: 'एक तेज़ स्प्रेडशीट-जैसे ग्रिड में एक असाइनमेंट के लिए पूरी क्लास के स्कोर डालें।' },
        { title: 'वेटेड एवरेज', desc: 'होमवर्क, क्विज़, और टेस्ट आपके तरीके से वेटेड — ओवरऑल ग्रेड आपके सिलेबस को दिखाता है, किसी जेनेरिक डिफ़ॉल्ट को नहीं।' },
        { title: 'एक्सपोर्ट करने योग्य रिपोर्ट्स', desc: 'पैरेंट्स या एडमिनिस्ट्रेशन को देने के लिए तैयार प्रति-स्टूडेंट या प्रति-क्लास रिपोर्ट, आपकी अपनी ग्रेडबुक से जनरेट की गई।' },
      ],
      promptExample: 'एक टीचर के लिए ग्रेडबुक वेब ऐप बनाएं: स्टूडेंट रोस्टर्स के साथ मेरी क्लासेज़ की लिस्ट वाला एक Classes पेज; प्रति-क्लास एक Assignments पेज जहां मैं असाइनमेंट्स बनाऊं (कैटेगरी: होमवर्क, क्विज़, टेस्ट, हर एक का एक वेट) और एक ग्रिड में हर स्टूडेंट के लिए स्कोर डालूं; सभी स्कोर्स और एक वेटेड मौजूदा एवरेज दिखाने वाला एक Student डिटेल व्यू; और प्रति-क्लास ग्रेड्स को CSV में एक्सपोर्ट करने वाला एक Reports पेज।',
      faqs: [
        { q: 'क्या मैं अपनी ग्रेड वेटिंग सेट कर सकता हूं?', a: 'हां — अपने प्रॉम्प्ट में अपनी कैटेगरीज़ और उनके पर्सेंटेज वेट्स तय करें, और हर एवरेज आपके सटीक सिलेबस नियम से कैलकुलेट होता है।' },
        { q: 'क्या यह कई क्लासेज़ या पीरियड्स हैंडल कर सकता है?', a: 'हां — हर क्लास का अपना रोस्टर, असाइनमेंट्स, और ग्रेड्स होते हैं, इसलिए आपकी दो क्लासेज़ में मौजूद एक स्टूडेंट को हर एक में अलग-अलग ट्रैक किया जाता है।' },
        { q: 'क्या स्टूडेंट या पैरेंट्स ग्रेड्स देख सकते हैं?', a: 'अपने टीचर व्यू से अलग सिर्फ़ अपने ग्रेड्स के रीड-ओनली व्यू के लिए अपने प्रॉम्प्ट में एक स्टूडेंट या पैरेंट लॉगिन जोड़ें।' },
        { q: 'क्या यह लेटर ग्रेड्स भी कैलकुलेट करता है?', a: 'अपना ग्रेडिंग स्केल बताएं (A यानी 90+, वगैरह) और ऐप न्यूमेरिक एवरेज के साथ एक लेटर ग्रेड दिखा सकता है।' },
      ],
    },
  },
  kn: {
    'quiz-maker-app': {
      h1: 'AI ಮೂಲಕ ಕ್ವಿಜ್ ಆ್ಯಪ್ ರಚಿಸಿ',
      metaTitle: 'AI ಮೂಲಕ ಕ್ವಿಜ್ ಮೇಕರ್ ಆ್ಯಪ್ ರಚಿಸಿ — ಕೋಡ್ ಇಲ್ಲದೆ',
      metaDesc: 'ಟೈಮ್ಡ್ ಪ್ರಶ್ನೆಗಳು, ತಕ್ಷಣ ಸ್ಕೋರಿಂಗ್, ಮತ್ತು ಫಲಿತಾಂಶ ಡ್ಯಾಶ್‌ಬೋರ್ಡ್‌ನೊಂದಿಗೆ ಕ್ವಿಜ್ ಆ್ಯಪ್ ರಚಿಸಿ — ತರಗತಿಗಳು, ತರಬೇತಿ, ಅಥವಾ ಟ್ರಿವಿಯಾ ರಾತ್ರಿಗಳಿಗಾಗಿ. ಸರಳ ಇಂಗ್ಲಿಷ್‌ನಿಂದ ರಚಿಸಲಾಗಿದೆ.',
      tagline: 'ಪ್ರಶ್ನೆಗಳನ್ನು ಬರೆಯಿರಿ, ಲಿಂಕ್ ಹಂಚಿಕೊಳ್ಳಿ, ಸ್ಕೋರ್‌ಗಳು ಬರುವುದನ್ನು ನೋಡಿ — ತರಗತಿ, ಕಂಪ್ಲೈಯನ್ಸ್ ತರಬೇತಿ, ಅಥವಾ ಶುಕ್ರವಾರದ ಟ್ರಿವಿಯಾಗಾಗಿ.',
      body: [
        'ಕ್ವಿಜ್ ಟೂಲ್‌ಗಳು ಪ್ರೇಕ್ಷಕರ ಪ್ರಕಾರ ವಿಭಜನೆಯಾಗಿ ಅದಕ್ಕೆ ತಕ್ಕಂತೆ ಶುಲ್ಕ ವಿಧಿಸುತ್ತವೆ: ತರಗತಿ ಪ್ಲಾಟ್‌ಫಾರ್ಮ್‌ಗಳು ಪ್ರತಿ-ವಿದ್ಯಾರ್ಥಿಗೆ ಬಿಲ್ ಮಾಡುತ್ತವೆ, ಕಾರ್ಪೊರೇಟ್ ತರಬೇತಿ ಟೂಲ್‌ಗಳು ಪ್ರತಿ-ಸೀಟ್‌ಗೆ ಬಿಲ್ ಮಾಡುತ್ತವೆ, ಮತ್ತು ಟ್ರಿವಿಯಾ ಆ್ಯಪ್‌ಗಳು ಹೋಸ್ಟ್‌ಗೆ ಬಿಲ್ ಮಾಡುತ್ತವೆ — ರಚನಾತ್ಮಕವಾಗಿ ಒಂದೇ ಪ್ರಾಡಕ್ಟ್‌ಗೆ. ಪ್ರಶ್ನೆಗಳು ಒಳಗೆ, ಉತ್ತರಗಳು ಸ್ಕೋರ್ ಆಗಿ, ಫಲಿತಾಂಶಗಳು ಲೆಕ್ಕಹಾಕಲ್ಪಟ್ಟಿವೆ.',
        'ನಿಮ್ಮದೇ ಆದ ಒಂದನ್ನು ನಿರ್ಮಿಸುವುದು ಈ ಮೂರನ್ನೂ ನಿಮ್ಮ ಬಳಕೆಗೆ ತಕ್ಕಂತೆ ಒಂದೇ ಆ್ಯಪ್‌ಗೆ ಸಂಕುಚಿಸುತ್ತದೆ. ನಿಮಗೆ ಬೇಕಾದ ಕ್ವಿಜ್ ಅನುಭವ ವಿವರಿಸಿ — ಪ್ರಶ್ನೆ ಪ್ರಕಾರಗಳು, ಟೈಮಿಂಗ್, ತಪ್ಪು ಉತ್ತರಗಳಿಗೆ ವಿವರಣೆ ತೋರಿಸಬೇಕೇ — ಮತ್ತು WyberAi ಇದನ್ನು ಆದಿಯಿಂದ ಅಂತ್ಯದವರೆಗೆ ಜನರೇಟ್ ಮಾಡುತ್ತದೆ: ನೀವು ಪ್ರಶ್ನೆಗಳನ್ನು ಬರೆಯುವ ಎಡಿಟರ್, ಯಾವುದೇ ಸಾಧನದಲ್ಲಿ ಸ್ವಚ್ಛವಾದ ಪರೀಕ್ಷೆ ಬರೆಯುವ ಅನುಭವ, ಮತ್ತು ಪ್ರತಿ-ಪ್ರಶ್ನೆ ವಿಭಜನೆ ತೋರಿಸುವ ಫಲಿತಾಂಶ ವ್ಯೂ. ಒಬ್ಬ ಶಿಕ್ಷಕ ತರಗತಿ ಯಾವ ಕಾನ್ಸೆಪ್ಟ್ ತಪ್ಪಿಸಿಕೊಂಡಿತು ಎಂದು ನೋಡುತ್ತಾರೆ; ಟ್ರಿವಿಯಾ ಹೋಸ್ಟ್‌ಗೆ ಲೈವ್ ಲೀಡರ್‌ಬೋರ್ಡ್ ಸಿಗುತ್ತದೆ; ಟ್ರೈನರ್‌ಗೆ ಪೂರ್ಣಗೊಳಿಸುವಿಕೆ ದಾಖಲೆಗಳು ಸಿಗುತ್ತವೆ.',
      ],
      features: [
        { title: 'ಪ್ರಶ್ನೆ ಎಡಿಟರ್', desc: 'ಬಹು ಆಯ್ಕೆ, ನಿಜ/ಸುಳ್ಳು, ಸಣ್ಣ ಉತ್ತರ — ಸರಿಯಾದ ಉತ್ತರಗಳು ಮತ್ತು ಐಚ್ಛಿಕ ವಿವರಣೆಗಳೊಂದಿಗೆ ಪ್ರಶ್ನೆಗಳನ್ನು ಬರೆಯಿರಿ ಮತ್ತು ಮರುಕ್ರಮಗೊಳಿಸಿ.' },
        { title: 'ಟೈಮ್ಡ್ ಅಥವಾ ಅನ್‌ಟೈಮ್ಡ್ ಆಟ', desc: 'ಟ್ರಿವಿಯಾ ಎನರ್ಜಿಗಾಗಿ ಪ್ರತಿ-ಪ್ರಶ್ನೆ ಕೌಂಟ್‌ಡೌನ್‌ಗಳು, ಅಥವಾ ಕಲಿಕಾ ಪರೀಕ್ಷೆಗಳಿಗೆ ರಿಲ್ಯಾಕ್ಸ್ಡ್ ಅನ್‌ಟೈಮ್ಡ್ ಮೋಡ್.' },
        { title: 'ತಕ್ಷಣ ಸ್ಕೋರಿಂಗ್', desc: 'ಸಲ್ಲಿಸಿದ ತಕ್ಷಣ ಫಲಿತಾಂಶಗಳು, ಪ್ರತಿ-ಪ್ರಶ್ನೆ ವಿಮರ್ಶೆ ಮತ್ತು ತಪ್ಪುಗಳಿಗೆ ನೀವು ಬರೆದ ವಿವರಣೆಗಳೊಂದಿಗೆ.' },
        { title: 'ಫಲಿತಾಂಶ ಡ್ಯಾಶ್‌ಬೋರ್ಡ್', desc: 'ಪ್ರತಿ ಪ್ರಯತ್ನ ಲಾಗ್ ಆಗುತ್ತದೆ — ಸ್ಕೋರ್‌ಗಳು, ಪೂರ್ಣಗೊಳಿಸುವಿಕೆ, ಮತ್ತು ಗುಂಪು ಯಾವ ಪ್ರಶ್ನೆಗಳನ್ನು ಹೆಚ್ಚು ತಪ್ಪು ಮಾಡಿತು.' },
      ],
      promptExample: 'ಕ್ವಿಜ್ ವೆಬ್ ಆ್ಯಪ್ ರಚಿಸಿ: ನಾನು ಬಹು-ಆಯ್ಕೆ ಮತ್ತು ನಿಜ/ಸುಳ್ಳು ಪ್ರಶ್ನೆಗಳೊಂದಿಗೆ ಕ್ವಿಜ್‌ಗಳನ್ನು ರಚಿಸುವ ಅಡ್ಮಿನ್ Editor ಪೇಜ್ (ಲಾಗಿನ್), ಪ್ರತಿಯೊಂದಕ್ಕೂ ಸರಿಯಾದ ಉತ್ತರ ಮತ್ತು ವಿವರಣೆ ಇರಲಿ; ಒಂದು ಬಾರಿಗೆ ಒಂದು ಪ್ರಶ್ನೆ, ಪ್ರತಿ ಪ್ರಶ್ನೆಗೆ 30-ಸೆಕೆಂಡ್ ಟೈಮರ್, ಮತ್ತು ಪ್ರತಿ-ಪ್ರಶ್ನೆ ವಿಮರ್ಶೆಯೊಂದಿಗೆ ಅಂತಿಮ ಸ್ಕೋರ್ ಸ್ಕ್ರೀನ್ ಇರುವ ಪಬ್ಲಿಕ್ ಕ್ವಿಜ್-ಟೇಕಿಂಗ್ ಪೇಜ್; ಮತ್ತು ಎಲ್ಲಾ ಪ್ರಯತ್ನಗಳನ್ನು ಸ್ಕೋರ್‌ಗಳು ಮತ್ತು ಹೆಚ್ಚು-ತಪ್ಪಾದ-ಪ್ರಶ್ನೆಗಳ ಚಾರ್ಟ್‌ನೊಂದಿಗೆ ತೋರಿಸುವ Results ಡ್ಯಾಶ್‌ಬೋರ್ಡ್.',
      faqs: [
        { q: 'ವಿದ್ಯಾರ್ಥಿಗಳು ಇದನ್ನು ತಮ್ಮ ಫೋನ್‌ಗಳಲ್ಲಿ ತೆಗೆದುಕೊಳ್ಳಬಹುದೇ?', a: 'ಹೌದು — ಪರೀಕ್ಷೆ ಬರೆಯುವ ಅನುಭವ ಮೊಬೈಲ್-ಮೊದಲ ವೆಬ್ ಪೇಜ್; ನೀವು ಲಿಂಕ್ ಹಂಚಿಕೊಳ್ಳುತ್ತೀರಿ ಮತ್ತು ಇದು ಬ್ರೌಸರ್ ಇರುವ ಯಾವುದೇ ಸಾಧನದಲ್ಲಿ ಕೆಲಸ ಮಾಡುತ್ತದೆ.' },
        { q: 'ಜನರು ಕ್ವಿಜ್ ಅನ್ನು ಮತ್ತೆ ತೆಗೆದುಕೊಳ್ಳುವುದನ್ನು ನಾನು ತಡೆಯಬಹುದೇ?', a: 'ನಿಮ್ಮ ಪ್ರಾಂಪ್ಟ್‌ನಲ್ಲಿ ಪ್ರಯತ್ನ ನಿಯಮಗಳನ್ನು ಸೆಟ್ ಮಾಡಿ — ಪ್ರತಿ ಇಮೇಲ್‌ಗೆ ಒಂದು ಪ್ರಯತ್ನ, ಅಥವಾ ಅನಿಯಮಿತ ಅಭ್ಯಾಸ ಮೋಡ್ — ಮತ್ತು ಆ್ಯಪ್ ಅವುಗಳನ್ನು ಜಾರಿಗೊಳಿಸುತ್ತದೆ.' },
        { q: 'ಇದು ಟ್ರಿವಿಯಾ ರಾತ್ರಿಗೆ ಲೈವ್ ಲೀಡರ್‌ಬೋರ್ಡ್ ತೋರಿಸಬಹುದೇ?', a: 'ಹೌದು — ಉತ್ತರಗಳು ಬರುತ್ತಿದ್ದಂತೆ ಅಪ್‌ಡೇಟ್ ಆಗುವ ಲೀಡರ್‌ಬೋರ್ಡ್ ಸ್ಕ್ರೀನ್ ಕೇಳಿ, ಮತ್ತು ಆಟಗಾರರು ತಮ್ಮ ಫೋನ್‌ಗಳಲ್ಲಿ ಉತ್ತರಿಸುತ್ತಿರುವಾಗ ಅದನ್ನು ಪ್ರೊಜೆಕ್ಟ್ ಮಾಡಿ.' },
        { q: 'ನಾನು ಎಷ್ಟು ಕ್ವಿಜ್‌ಗಳನ್ನು ರಚಿಸಬಹುದು?', a: 'ನಿಮಗೆ ಇಷ್ಟವಾದಷ್ಟು — ಕ್ವಿಜ್‌ಗಳು ನಿಮ್ಮ ಸ್ವಂತ ಡೇಟಾಬೇಸ್‌ನಲ್ಲಿ ಸಾಲುಗಳಾಗಿವೆ, ಪ್ಲಾಟ್‌ಫಾರ್ಮ್ ಪ್ಲಾನ್‌ನಲ್ಲಿ ಪ್ರತಿ-ಕ್ವಿಜ್ ಶುಲ್ಕವಲ್ಲ.' },
      ],
    },
    'flashcard-app': {
      h1: 'AI ಮೂಲಕ ಫ್ಲ್ಯಾಶ್‌ಕಾರ್ಡ್ ಆ್ಯಪ್ ರಚಿಸಿ',
      metaTitle: 'AI ಮೂಲಕ ಫ್ಲ್ಯಾಶ್‌ಕಾರ್ಡ್ ಸ್ಟಡಿ ಆ್ಯಪ್ ರಚಿಸಿ — ಸ್ಪೇಸ್ಡ್ ರೆಪಿಟಿಷನ್',
      metaDesc: 'ನಿಮ್ಮ ಸ್ವಂತ ಸ್ಪೇಸ್ಡ್-ರೆಪಿಟಿಷನ್ ಫ್ಲ್ಯಾಶ್‌ಕಾರ್ಡ್ ಆ್ಯಪ್ — ಡೆಕ್‌ಗಳು, ರಿವ್ಯೂ ಶೆಡ್ಯೂಲಿಂಗ್, ಮತ್ತು ಪ್ರಗತಿ ಅಂಕಿಅಂಶಗಳು — ನಿಮಿಷಗಳಲ್ಲಿ ಸರಳ ಇಂಗ್ಲಿಷ್ ವಿವರಣೆಯಿಂದ ಜನರೇಟ್ ಆಗಿದೆ.',
      tagline: 'ಡೆಕ್‌ಗಳು, ದೈನಂದಿನ ರಿವ್ಯೂಗಳು, ಮತ್ತು ನೀವು ಮರೆಯುವ ಮೊದಲೇ ಒಂದು ಕಾರ್ಡ್ ಅನ್ನು ಮತ್ತೆ ತೋರಿಸುವ ಸ್ಪೇಸ್ಡ್ ರೆಪಿಟಿಷನ್ — ನೀವು ಹೇಗೆ ಓದುತ್ತೀರಿ ಎಂಬುದರ ಸುತ್ತ ನಿರ್ಮಿಸಿದ ಆ್ಯಪ್‌ನಲ್ಲಿ.',
      body: [
        'ಫ್ಲ್ಯಾಶ್‌ಕಾರ್ಡ್ ಸಾಫ್ಟ್‌ವೇರ್ ಬಲವಾದ ನಿಷ್ಠೆ ಮತ್ತು ಇನ್ನೂ ಬಲವಾದ ದೂರುಗಳನ್ನು ಹುಟ್ಟಿಸುತ್ತದೆ: ಶಕ್ತಿಶಾಲಿಯಾದದ್ದು ಹೆಚ್ಚಿನ ಪರೀಕ್ಷೆಗಳಿಗಿಂತ ಕಡಿದಾದ ಕಲಿಕಾ ವಕ್ರರೇಖೆ ಹೊಂದಿದೆ, ಮತ್ತು ಸ್ನೇಹಪರವಾದವು ನಿಮ್ಮ ಡೆಕ್‌ಗಳು ಮತ್ತು ಕಾರ್ಡ್‌ಗಳನ್ನು ಸಬ್‌ಸ್ಕ್ರಿಪ್ಷನ್ ಮೂಲಕ ಅಳೆಯುತ್ತವೆ. ಎರಡರ ಕೆಳಗೂ ಒಂದು ಅಲ್ಗಾರಿದಮ್ ಇದೆ — ಸ್ಪೇಸ್ಡ್ ರೆಪಿಟಿಷನ್ — ಇದನ್ನು ಚೆನ್ನಾಗಿ ಅರ್ಥಮಾಡಿಕೊಳ್ಳಲಾಗಿದೆ ಮತ್ತು ಸುಲಭವಾಗಿ ಜನರೇಟ್ ಮಾಡಬಹುದು.',
        'ನೀವು ಏನನ್ನು ಓದುತ್ತಿದ್ದೀರಿ ಮತ್ತು ರಿವ್ಯೂಗಳು ಹೇಗೆ ಅನಿಸಬೇಕು ಎಂದು ವಿವರಿಸಿ, ಮತ್ತು WyberAi ನಿಮ್ಮ ವರ್ಷನ್ ನಿರ್ಮಿಸುತ್ತದೆ: ನಿಮ್ಮ ವಿಷಯಗಳಿಗೆ ಡೆಕ್‌ಗಳು, ಪ್ರತಿ ಕಾರ್ಡ್ ಅನ್ನು ನೀವು ಎಷ್ಟು ಚೆನ್ನಾಗಿ ತಿಳಿದಿದ್ದೀರಿ ಎಂಬುದರ ಆಧಾರದ ಮೇಲೆ ಶೆಡ್ಯೂಲ್ ಮಾಡುವ ಸ್ವೈಪ್-ಮೂಲಕ ರಿವ್ಯೂ ಸೆಷನ್, ಮತ್ತು ಪರೀಕ್ಷೆ ಸಮೀಪಿಸುತ್ತಿದ್ದಂತೆ ನಿಮ್ಮ ರಿಟೆನ್ಷನ್ ನಿಜವಾಗಿ ಏರುತ್ತಿರುವುದನ್ನು ತೋರಿಸುವ ಅಂಕಿಅಂಶಗಳು. ಚಿತ್ರಗಳಿರುವ ವೈದ್ಯಕೀಯ ಸ್ಮರಣಶಕ್ತಿ ಸಾಧನಗಳು, ಆಡಿಯೋ ಇರುವ ಭಾಷಾ ಕಾರ್ಡ್‌ಗಳು, ರೆಂಡರ್ ಮಾಡಿದ ಗಣಿತವಿರುವ ಫಾರ್ಮುಲಾ ಕಾರ್ಡ್‌ಗಳು — ಕಾರ್ಡ್ ಟೆಂಪ್ಲೇಟ್ ವ್ಯಾಖ್ಯಾನಿಸುವುದು ನೀವೇ.',
      ],
      features: [
        { title: 'ಡೆಕ್‌ಗಳು ಮತ್ತು ಸಬ್-ಡೆಕ್‌ಗಳು', desc: 'ವಿಷಯ, ಅಧ್ಯಾಯ, ಅಥವಾ ಪರೀಕ್ಷೆಯ ಪ್ರಕಾರ ಸಂಘಟಿಸಿ — ಒಂದು ಡೆಕ್ ಓದಿ ಅಥವಾ ಇವೆಲ್ಲದರಲ್ಲೂ ಇಂದು ಡ್ಯೂ ಆಗಿರುವ ಎಲ್ಲವನ್ನೂ ಓದಿ.' },
        { title: 'ಸ್ಪೇಸ್ಡ್-ರೆಪಿಟಿಷನ್ ಶೆಡ್ಯೂಲಿಂಗ್', desc: 'ಪ್ರತಿ ಕಾರ್ಡ್ ಅನ್ನು Again/Hard/Good/Easy ಎಂದು ರೇಟ್ ಮಾಡಿ ಮತ್ತು ಮುಂದಿನ ರಿವ್ಯೂ ರಿಟೆನ್ಷನ್ ಅನ್ನು ಗರಿಷ್ಠಗೊಳಿಸುವ ಅಂತರದಲ್ಲಿ ಬರುತ್ತದೆ.' },
        { title: 'ನಿಮ್ಮ ಕಾರ್ಡ್ ಫಾರ್ಮ್ಯಾಟ್', desc: 'ಮುಂಭಾಗ/ಹಿಂಭಾಗದ ಪಠ್ಯ, ಚಿತ್ರಗಳು, ಸುಳಿವುಗಳು, ಉದಾಹರಣೆ ವಾಕ್ಯಗಳು — ಕಾರ್ಡ್ ಟೆಂಪ್ಲೇಟ್ ನಿಮ್ಮ ವಿಷಯಕ್ಕೆ ಹೊಂದುತ್ತದೆ.' },
        { title: 'ರಿಟೆನ್ಷನ್ ಅಂಕಿಅಂಶಗಳು', desc: 'ಡ್ಯೂ ಕಾರ್ಡ್‌ಗಳು, ದೈನಂದಿನ ಸ್ಟ್ರೀಕ್, ಮತ್ತು ಪ್ರತಿ-ಡೆಕ್ ನಿಖರತೆ — ಓದುವಿಕೆ ಕೆಲಸ ಮಾಡುತ್ತಿದೆಯೇ ಎಂಬ ಚಿತ್ರ.' },
      ],
      promptExample: 'ಸ್ಪೇಸ್ಡ್ ರೆಪಿಟಿಷನ್‌ನೊಂದಿಗೆ ಫ್ಲ್ಯಾಶ್‌ಕಾರ್ಡ್ ಮೊಬೈಲ್ ಆ್ಯಪ್ ರಚಿಸಿ: ನಾನು ಡೆಕ್‌ಗಳನ್ನು ರಚಿಸುವ ಮತ್ತು ಮುಂಭಾಗ, ಹಿಂಭಾಗ, ಮತ್ತು ಐಚ್ಛಿಕ ಸುಳಿವಿನೊಂದಿಗೆ ಕಾರ್ಡ್‌ಗಳನ್ನು ಸೇರಿಸುವ Decks ಸ್ಕ್ರೀನ್; ಡ್ಯೂ ಕಾರ್ಡ್‌ಗಳನ್ನು ಒಂದೊಂದಾಗಿ ತೋರಿಸುವ Review ಸ್ಕ್ರೀನ್ — ತಿರುಗಿಸಲು ಟ್ಯಾಪ್ ಮಾಡಿ, ನಂತರ Again, Hard, Good, ಅಥವಾ Easy ಎಂದು ರೇಟ್ ಮಾಡಿ, ಪ್ರತಿ ರೇಟಿಂಗ್‌ಗೆ ಅಂತರಗಳು ಬೆಳೆಯುತ್ತವೆ; ಮತ್ತು ಇಂದು ಡ್ಯೂ ಕಾರ್ಡ್‌ಗಳು, ಪ್ರಸ್ತುತ ಸ್ಟ್ರೀಕ್, ಮತ್ತು ಪ್ರತಿ-ಡೆಕ್ ನಿಖರತೆಯಿರುವ Stats ಸ್ಕ್ರೀನ್. ವೇಗವಾದ ಮತ್ತು ಮಿನಿಮಲ್, ಒಂದು-ಕೈಯ ರಿವ್ಯೂಗೆ ಆಪ್ಟಿಮೈಸ್ ಮಾಡಲಾಗಿದೆ.',
      faqs: [
        { q: 'ಸ್ಪೇಸ್ಡ್ ರೆಪಿಟಿಷನ್ ನಿಜವಾಗಿ ಹೇಗೆ ಕೆಲಸ ಮಾಡುತ್ತದೆ?', a: 'ಪ್ರತಿ ರೇಟಿಂಗ್ ಕಾರ್ಡ್‌ನ ಮುಂದಿನ ಅಂತರವನ್ನು ಸರಿಹೊಂದಿಸುತ್ತದೆ — ತಪ್ಪುಗಳು ನಿಮಿಷಗಳಲ್ಲಿ ಹಿಂತಿರುಗುತ್ತವೆ, ಸುಲಭ ಕಾರ್ಡ್‌ಗಳು ದಿನಗಳಿಂದ ವಾರಗಳವರೆಗೆ ವಿಸ್ತರಿಸುತ್ತವೆ. ಶೆಡ್ಯೂಲಿಂಗ್ ನಿಮ್ಮ ಸ್ವಂತ ಡೇಟಾಬೇಸ್‌ನಲ್ಲಿ ನಿಮ್ಮ ರಿವ್ಯೂ ಇತಿಹಾಸದ ಮೇಲೆ ಚಲಿಸುತ್ತದೆ.' },
        { q: 'ನಾನು ನನ್ನ ಇರುವ Anki ಅಥವಾ CSV ಡೆಕ್‌ಗಳನ್ನು ಆಮದು ಮಾಡಬಹುದೇ?', a: 'ನಿಮ್ಮ ಪ್ರಾಂಪ್ಟ್‌ನಲ್ಲಿ CSV ಆಮದು ಕೇಳಿ — ನಿಮ್ಮ ಡೆಕ್‌ಗಳನ್ನು CSV ಗೆ ಎಕ್ಸ್‌ಪೋರ್ಟ್ ಮಾಡಿ, ಕಾಲಮ್‌ಗಳನ್ನು ಒಮ್ಮೆ ಮ್ಯಾಪ್ ಮಾಡಿ, ಮತ್ತು ನಿಮ್ಮ ಕಾರ್ಡ್‌ಗಳು ತಮ್ಮ ವಿಷಯವನ್ನು ಒಳಗೆ ತರುತ್ತವೆ.' },
        { q: 'ಎರಡು ಭಾಷೆಗಳು ಒಂದೇ ಕಾರ್ಡ್ ಹಂಚಿಕೊಳ್ಳಬಹುದೇ?', a: 'ಹೌದು — ಭಾಷಾ ಡೆಕ್‌ಗಳು ಸ್ವಾಭಾವಿಕವಾಗಿ ಮುಂಭಾಗ/ಹಿಂಭಾಗ ಜೋಡಿಗಳಾಗಿ ಕೆಲಸ ಮಾಡುತ್ತವೆ, ಮತ್ತು ನೀವು ಪ್ರತಿ ಕಾರ್ಡ್‌ಗೆ ಉಚ್ಚಾರಣೆ, ಆಡಿಯೋ, ಅಥವಾ ಉದಾಹರಣೆ ವಾಕ್ಯದಂತಹ ಫೀಲ್ಡ್‌ಗಳನ್ನು ಸೇರಿಸಬಹುದು.' },
        { q: 'ಇದು ನನ್ನ ಪ್ರಯಾಣದ ಸಮಯದಲ್ಲಿ ಕೆಲಸ ಮಾಡುತ್ತದೆಯೇ?', a: 'ಇದು React Native + Expo ಆ್ಯಪ್ ಆಗಿ ಜನರೇಟ್ ಆಗುತ್ತದೆ — ನಿಮ್ಮ ಪ್ರಾಂಪ್ಟ್‌ನಲ್ಲಿ ಆಫ್‌ಲೈನ್ ರಿವ್ಯೂ ಕೇಳಿ ಮತ್ತು ಆನ್‌ಲೈನ್‌ಗೆ ಬಂದಾಗ ಸೆಷನ್‌ಗಳು ಮತ್ತೆ ಸಿಂಕ್ ಆಗುತ್ತವೆ.' },
      ],
    },
    'online-course-platform': {
      h1: 'AI ಮೂಲಕ ಆನ್‌ಲೈನ್ ಕೋರ್ಸ್ ಪ್ಲಾಟ್‌ಫಾರ್ಮ್ ರಚಿಸಿ',
      metaTitle: 'AI ಮೂಲಕ ನಿಮ್ಮ ಸ್ವಂತ ಕೋರ್ಸ್ ಪ್ಲಾಟ್‌ಫಾರ್ಮ್ ರಚಿಸಿ — ಕೋಡ್ ಇಲ್ಲದೆ',
      metaDesc: 'ನಿಮ್ಮ ಕೋರ್ಸ್ ಅನ್ನು ನಿಮ್ಮ ಸ್ವಂತ ಪ್ಲಾಟ್‌ಫಾರ್ಮ್‌ನಲ್ಲಿ ಹೋಸ್ಟ್ ಮಾಡಿ: ಮಾಡ್ಯೂಲ್‌ಗಳು, ಪಾಠಗಳು, ವಿದ್ಯಾರ್ಥಿ ಪ್ರಗತಿ, ಮತ್ತು ಪೂರ್ಣಗೊಳಿಸುವಿಕೆ ಟ್ರ್ಯಾಕಿಂಗ್ — ಸರಳ ಇಂಗ್ಲಿಷ್‌ನಿಂದ ಜನರೇಟ್, ಆದಾಯ ಹಂಚಿಕೆ ಇಲ್ಲ.',
      tagline: 'ನಿಮ್ಮ ಸ್ವಂತ ಡೊಮೇನ್‌ನಲ್ಲಿ ನಿಮ್ಮ ಕೋರ್ಸ್ — ಮಾಡ್ಯೂಲ್‌ಗಳು, ಪ್ರಗತಿ ಟ್ರ್ಯಾಕಿಂಗ್, ನಿಮ್ಮ ಬ್ರಾಂಡ್ — ನಿಮ್ಮ ಕೆಲಸವನ್ನು $9.99ಗೆ ರಿಯಾಯಿತಿ ಮಾಡುವ ಯಾವುದೇ ಮಾರ್ಕೆಟ್‌ಪ್ಲೇಸ್ ಇಲ್ಲದೆ.',
      body: [
        'ಕೋರ್ಸ್ ರಚನೆಕಾರರು ಎರಡೂ ದಿಕ್ಕುಗಳಿಂದ ಒತ್ತಡಕ್ಕೊಳಗಾಗುತ್ತಾರೆ: ಮಾರ್ಕೆಟ್‌ಪ್ಲೇಸ್‌ಗಳು ಬೆಲೆ ಮಿತಿಯನ್ನು ಸೆಟ್ ಮಾಡಿ ವಿದ್ಯಾರ್ಥಿ ಸಂಬಂಧವನ್ನು ಸ್ವಂತಗೊಳಿಸುತ್ತವೆ, ಹೋಸ್ಟ್ ಮಾಡಿದ ಕೋರ್ಸ್ ಪ್ಲಾಟ್‌ಫಾರ್ಮ್‌ಗಳು ನಿಮ್ಮ ವ್ಯಾಪಾರವನ್ನು ಬೆಳೆಸುತ್ತದೆ ಎಂದು ಭರವಸೆ ನೀಡಿದ ಫೀಚರ್‌ಗಳೊಂದಿಗೆ ಏರುವ ಮಾಸಿಕ ಬಾಡಿಗೆ ತೆಗೆದುಕೊಳ್ಳುತ್ತವೆ. ಎರಡೂ ಸಂದರ್ಭದಲ್ಲಿ, ಪ್ಲಾಟ್‌ಫಾರ್ಮ್ ಬ್ರಾಂಡ್ ಆಗಿದೆ ಮತ್ತು ನೀವು ಕಂಟೆಂಟ್ ಆಗಿದ್ದೀರಿ.',
        'ಕೋರ್ಸ್ ಪ್ಲಾಟ್‌ಫಾರ್ಮ್ ಎಂದರೆ ಮಾಡ್ಯೂಲ್‌ಗಳು, ಪಾಠಗಳು, ಮತ್ತು ಯಾರು ಏನು ಮುಗಿಸಿದರು ಎಂಬ ದಾಖಲೆ — ಇದು ಒಂದು ವಿವರಣೆಯ ವ್ಯಾಪ್ತಿಯೊಳಗೆ ಚೆನ್ನಾಗಿ ಬರುತ್ತದೆ. ನಿಮ್ಮ ಕೋರ್ಸ್ ಹೇಗೆ ರಚನೆಯಾಗಿದೆ ಮತ್ತು ವಿದ್ಯಾರ್ಥಿಗಳು ಏನನ್ನು ಅನುಭವಿಸಬೇಕು ಎಂದು WyberAi ಗೆ ಹೇಳಿ, ಮತ್ತು ಅದು ನಿಮ್ಮ ಶಾಲೆಯನ್ನು ಜನರೇಟ್ ಮಾಡುತ್ತದೆ: ಕೋರ್ಸ್ ಮಾರಾಟ ಮಾಡುವ ಲ್ಯಾಂಡಿಂಗ್ ಪೇಜ್, ವೀಡಿಯೋ ಎಂಬೆಡ್‌ಗಳಿರುವ ಗೇಟೆಡ್ ಪಾಠ ಕಂಟೆಂಟ್, ವಿದ್ಯಾರ್ಥಿ ಎಲ್ಲಿ ನಿಲ್ಲಿಸಿದರೋ ಅಲ್ಲಿಂದ ಮುಂದುವರಿಯುವ ಪ್ರಗತಿ, ಮತ್ತು ಯಾರು ಮುಂದುವರಿಯುತ್ತಿದ್ದಾರೆ ಯಾರು ನಿಂತಿದ್ದಾರೆ ಎಂಬುದನ್ನು ತೋರಿಸುವ ಶಿಕ್ಷಕ ವ್ಯೂ. ನಿಮ್ಮ ಡೊಮೇನ್, ನಿಮ್ಮ ಬೆಲೆ, ನಿಮ್ಮ ವಿದ್ಯಾರ್ಥಿ ಇಮೇಲ್‌ಗಳು.',
      ],
      features: [
        { title: 'ಮಾಡ್ಯೂಲ್‌ಗಳು ಮತ್ತು ಪಾಠಗಳು', desc: 'ನಿಮ್ಮ ಪಠ್ಯಕ್ರಮ ರಚನಾತ್ಮಕ ಕಂಟೆಂಟ್ ಆಗಿ — ವೀಡಿಯೋ ಎಂಬೆಡ್‌ಗಳು, ರಿಚ್ ಟೆಕ್ಸ್ಟ್, ಡೌನ್‌ಲೋಡ್‌ಗಳು, ನೀವು ಕಲಿಸುವ ಕ್ರಮದಲ್ಲೇ ಜೋಡಿಸಲಾಗಿದೆ.' },
        { title: 'ವಿದ್ಯಾರ್ಥಿ ಪ್ರಗತಿ ಟ್ರ್ಯಾಕಿಂಗ್', desc: 'ಪಾಠಗಳು ಪೂರ್ಣಗೊಂಡಂತೆ ಚೆಕ್ ಆಗುತ್ತವೆ; ವಿದ್ಯಾರ್ಥಿಗಳು ನಿಲ್ಲಿಸಿದಲ್ಲಿಂದ ಮುಂದುವರಿಸುತ್ತಾರೆ, ಮತ್ತು ಪ್ರಗತಿ ಗೋಚರಿಸುತ್ತಲೇ ಇರುತ್ತದೆ.' },
        { title: 'ಗೇಟೆಡ್ ದಾಖಲಾತಿ', desc: 'ವಿದ್ಯಾರ್ಥಿ ಖಾತೆಗಳ ಹಿಂದೆ ಕಂಟೆಂಟ್ — ಹಸ್ತಚಾಲಿತವಾಗಿ, ಆಹ್ವಾನದ ಮೂಲಕ ದಾಖಲಿಸಿ, ಅಥವಾ ಮಾರಾಟ ಮಾಡಲು ಸಿದ್ಧವಾದಾಗ ಪಾವತಿಗಳನ್ನು ಜೋಡಿಸಿ.' },
        { title: 'ಶಿಕ್ಷಕ ಡ್ಯಾಶ್‌ಬೋರ್ಡ್', desc: 'ದಾಖಲಾತಿ ಎಣಿಕೆಗಳು, ಪ್ರತಿ-ವಿದ್ಯಾರ್ಥಿ ಪ್ರಗತಿ, ಮತ್ತು ಪ್ರತಿ-ಮಾಡ್ಯೂಲ್ ಪೂರ್ಣಗೊಳಿಸುವಿಕೆ ದರಗಳು — ವಿದ್ಯಾರ್ಥಿಗಳು ಎಲ್ಲಿ ನಿಲ್ಲುತ್ತಾರೋ ಅಲ್ಲಿ ಕೋರ್ಸ್‌ಗೆ ಕೆಲಸದ ಅಗತ್ಯವಿದೆ.' },
      ],
      promptExample: 'ಆನ್‌ಲೈನ್ ಕೋರ್ಸ್ ಪ್ಲಾಟ್‌ಫಾರ್ಮ್ ವೆಬ್ ಆ್ಯಪ್ ರಚಿಸಿ: ಪಠ್ಯಕ್ರಮ ಔಟ್‌ಲೈನ್ ಮತ್ತು ಒಂದು ದಾಖಲಾತಿ ಬಟನ್‌ನೊಂದಿಗೆ ನನ್ನ ಕೋರ್ಸ್ ಅನ್ನು ವಿವರಿಸುವ ಪಬ್ಲಿಕ್ ಲ್ಯಾಂಡಿಂಗ್ ಪೇಜ್; ಪಾಠಗಳಿರುವ (ವೀಡಿಯೋ ಎಂಬೆಡ್, ರಿಚ್ ಟೆಕ್ಸ್ಟ್ ಟಿಪ್ಪಣಿಗಳು, ಡೌನ್‌ಲೋಡ್ ಮಾಡಬಹುದಾದ ಸಂಪನ್ಮೂಲಗಳು) ಮಾಡ್ಯೂಲ್‌ಗಳು, ಪೂರ್ಣಗೊಳಿಸುವಿಕೆ ಚೆಕ್‌ಬಾಕ್ಸ್‌ಗಳು, ಮತ್ತು ಪ್ರಗತಿ ಬಾರ್ ಇರುವ ವಿದ್ಯಾರ್ಥಿ ಪ್ರದೇಶ (ಲಾಗಿನ್ ಅಗತ್ಯ); ಮತ್ತು ದಾಖಲಾದ ವಿದ್ಯಾರ್ಥಿಗಳು, ಅವರ ಪ್ರಗತಿ ಶೇಕಡಾವಾರುಗಳು, ಮತ್ತು ಪ್ರತಿ-ಮಾಡ್ಯೂಲ್ ಪೂರ್ಣಗೊಳಿಸುವಿಕೆ ದರವನ್ನು ತೋರಿಸುವ ಶಿಕ್ಷಕ Dashboard.',
      faqs: [
        { q: 'ವೀಡಿಯೋಗಳು ಎಲ್ಲಿ ಇರುತ್ತವೆ?', a: 'YouTube (ಅನ್‌ಲಿಸ್ಟೆಡ್), Vimeo, ಅಥವಾ ಯಾವುದೇ ಹೋಸ್ಟ್‌ನಿಂದ ಎಂಬೆಡ್ ಮಾಡಿ — ಪಾಠ ಪ್ಲೇಯರ್ ನಿಮ್ಮ ಲಿಂಕ್‌ಗಳನ್ನು ಎಂಬೆಡ್ ಮಾಡುತ್ತದೆ, ಆದ್ದರಿಂದ ನಿಮ್ಮ ಅಸ್ತಿತ್ವದಲ್ಲಿರುವ ವೀಡಿಯೋ ವರ್ಕ್‌ಫ್ಲೋ ಉಳಿಯುತ್ತದೆ.' },
        { q: 'ನಾನು ದಾಖಲಾತಿಗೆ ಶುಲ್ಕ ವಿಧಿಸಬಹುದೇ?', a: 'ಉಚಿತ ಅಥವಾ ಆಹ್ವಾನ-ಮಾತ್ರ ಪ್ರಾರಂಭಿಸಿ, ನಂತರ ಸಿದ್ಧವಾದಾಗ ಚಾಟ್‌ನಲ್ಲಿ ಪಾವತಿ ಹಂತವನ್ನು ಸೇರಿಸಿ — ಕೆಳಗಿನ ಕೋರ್ಸ್ ರಚನೆ ಬದಲಾಗುವುದಿಲ್ಲ.' },
        { q: 'ನಾನು ಒಂದಕ್ಕಿಂತ ಹೆಚ್ಚು ಕೋರ್ಸ್‌ಗಳನ್ನು ನಡೆಸಬಹುದೇ?', a: 'ಹೌದು — ರಚನೆ ಒಂದೇ ಶಾಲೆಯ ಅಡಿಯಲ್ಲಿ ಬಹು ಕೋರ್ಸ್‌ಗಳಿಗೆ ವಿಸ್ತರಿಸುತ್ತದೆ, ಪ್ರತಿಯೊಂದಕ್ಕೂ ತನ್ನದೇ ಲ್ಯಾಂಡಿಂಗ್ ಪೇಜ್ ಮತ್ತು ದಾಖಲಾತಿ.' },
        { q: 'ಪ್ರಮಾಣಪತ್ರಗಳ ಬಗ್ಗೆ ಏನು?', a: 'ನಿಮ್ಮ ಪ್ರಾಂಪ್ಟ್‌ನಲ್ಲಿ ಅಥವಾ ನಂತರ ಪೂರ್ಣಗೊಳಿಸುವಿಕೆ ಪ್ರಮಾಣಪತ್ರ ಪೇಜ್ ಕೇಳಿ — ಮುಗಿಸುವ ವಿದ್ಯಾರ್ಥಿಗಳಿಗೆ ನಿಮ್ಮ ಬ್ರ್ಯಾಂಡಿಂಗ್‌ನೊಂದಿಗೆ ಹಂಚಿಕೊಳ್ಳಬಹುದಾದ, ದಿನಾಂಕವಿರುವ ಪ್ರಮಾಣಪತ್ರ ಸಿಗುತ್ತದೆ.' },
      ],
    },
    'gradebook-app-for-teachers': {
      h1: 'AI ಮೂಲಕ ಶಿಕ್ಷಕರಿಗಾಗಿ ಗ್ರೇಡ್‌ಬುಕ್ ಆ್ಯಪ್ ರಚಿಸಿ',
      metaTitle: 'AI ಮೂಲಕ ಶಿಕ್ಷಕರಿಗಾಗಿ ಗ್ರೇಡ್‌ಬುಕ್ ಆ್ಯಪ್ ರಚಿಸಿ',
      metaDesc: 'ತರಗತಿ ಪಟ್ಟಿಗಳು, ಅಸೈನ್‌ಮೆಂಟ್ ಗ್ರೇಡ್‌ಗಳು, ಮತ್ತು ಸ್ವಯಂಚಾಲಿತ-ಲೆಕ್ಕಾಚಾರದ ಸರಾಸರಿಗಳು — ಸರಳ ಇಂಗ್ಲಿಷ್‌ನಿಂದ ಜನರೇಟ್ ಆದ ಗ್ರೇಡ್‌ಬುಕ್ ಆ್ಯಪ್, ನೀವು ನಿಜವಾಗಿ ಗ್ರೇಡ್ ಮಾಡುವ ವಿಧಾನಕ್ಕೆ ತಕ್ಕಂತೆ.',
      tagline: 'ಒಂದು ಗ್ರೇಡ್ ನಮೂದಿಸಿ, ಸರಾಸರಿ ಅಪ್‌ಡೇಟ್ ಆಗುವುದನ್ನು ನೋಡಿ — ನಿಮ್ಮ ವೇಟಿಂಗ್ ಮತ್ತು ನಿಮ್ಮ ತರಗತಿಗಳಿಗೆ ತಕ್ಕಂತೆ ಇರುವ ಗ್ರೇಡ್‌ಬುಕ್, ಜಿಲ್ಲಾ-ವ್ಯಾಪಿ ವ್ಯವಸ್ಥೆಯ ಕಠಿಣ ಟೆಂಪ್ಲೇಟ್ ಅಲ್ಲ.',
      body: [
        'ಶಾಲೆ-ನೀಡಿದ ಗ್ರೇಡ್‌ಬುಕ್ ವ್ಯವಸ್ಥೆಗಳು ಮೊದಲು ಆಡಳಿತಗಾರರಿಗಾಗಿ ಮತ್ತು ನಂತರ ಶಿಕ್ಷಕರಿಗಾಗಿ ನಿರ್ಮಿಸಲಾಗಿದೆ — ಕಠಿಣ ವರ್ಗಗಳು, ನೀವು ಸರಿಹೊಂದಿಸಲಾಗದ ವೇಟಿಂಗ್ ನಿಯಮಗಳು, ಮತ್ತು ಪೀರಿಯಡ್‌ಗಳ ನಡುವೆ ನಲವತ್ತು ಕ್ವಿಜ್ ಸ್ಕೋರ್‌ಗಳನ್ನು ನಮೂದಿಸುವ ದೈನಂದಿನ ವಾಸ್ತವಕ್ಕಿಂತ ಕಂಪ್ಲೈಯನ್ಸ್ ವರದಿಗಾಗಿ ವಿನ್ಯಾಸಗೊಳಿಸಿದ UI. ಶಿಕ್ಷಕರು ತಮ್ಮದೇ ತರಗತಿಯನ್ನು ನಿಜವಾಗಿ ಅರ್ಥಮಾಡಿಕೊಳ್ಳಲು ಒಂದು ವೈಯಕ್ತಿಕ ಸ್ಪ್ರೆಡ್‌ಶೀಟ್ ಇಟ್ಟುಕೊಳ್ಳುತ್ತಾರೆ.',
        'ನೀವು ಹೇಗೆ ಗ್ರೇಡ್ ಮಾಡುತ್ತೀರಿ ಎಂದು ವಿವರಿಸಿ — ವರ್ಗಗಳು, ವೇಟ್‌ಗಳು, ತರಗತಿ ವಿತರಣೆಯನ್ನು ನೀವು ಹೇಗೆ ನೋಡಲು ಬಯಸುತ್ತೀರಿ — ಮತ್ತು WyberAi ನಿಮ್ಮ ವಿಧಾನದ ಸುತ್ತ ಗ್ರೇಡ್‌ಬುಕ್ ನಿರ್ಮಿಸುತ್ತದೆ: ಪ್ರತಿ-ತರಗತಿಗೆ ಒಂದು ಪಟ್ಟಿ, ಅಸೈನ್‌ಮೆಂಟ್‌ಗಳು ಮತ್ತು ಸ್ಕೋರ್‌ಗಳಿಗಾಗಿ ಒಂದು ಎಂಟ್ರಿ ಗ್ರಿಡ್, ಮತ್ತು ಒಂದು ಗ್ರೇಡ್ ಬಂದ ತಕ್ಷಣ ಮರುಲೆಕ್ಕಾಚಾರ ಮಾಡುವ ಸರಾಸರಿಗಳು, ನಿಮ್ಮ ಪಠ್ಯಕ್ರಮ ಹೇಳುವಂತೆಯೇ ವೇಟ್ ಮಾಡಲಾಗಿದೆ.',
      ],
      features: [
        { title: 'ತರಗತಿ ಪಟ್ಟಿಗಳು', desc: 'ತರಗತಿ ಅಥವಾ ಪೀರಿಯಡ್ ಪ್ರಕಾರ ಗುಂಪುಗೊಳಿಸಿದ ವಿದ್ಯಾರ್ಥಿಗಳು, ಪ್ರತಿಯೊಬ್ಬರಿಗೂ ತಮ್ಮದೇ ಅಸೈನ್‌ಮೆಂಟ್ ಇತಿಹಾಸ ಮತ್ತು ಚಾಲನೆಯಲ್ಲಿರುವ ಸರಾಸರಿ.' },
        { title: 'ಅಸೈನ್‌ಮೆಂಟ್ ಗ್ರೇಡ್ ಗ್ರಿಡ್', desc: 'ವೇಗವಾದ ಸ್ಪ್ರೆಡ್‌ಶೀಟ್-ರೀತಿಯ ಗ್ರಿಡ್‌ನಲ್ಲಿ ಒಂದು ಅಸೈನ್‌ಮೆಂಟ್‌ಗೆ ಇಡೀ ತರಗತಿಯ ಸ್ಕೋರ್‌ಗಳನ್ನು ನಮೂದಿಸಿ.' },
        { title: 'ವೇಟೆಡ್ ಸರಾಸರಿಗಳು', desc: 'ಹೋಮ್‌ವರ್ಕ್, ಕ್ವಿಜ್‌ಗಳು, ಮತ್ತು ಪರೀಕ್ಷೆಗಳು ನಿಮ್ಮ ರೀತಿಯಲ್ಲಿ ವೇಟ್ ಆಗಿವೆ — ಒಟ್ಟಾರೆ ಗ್ರೇಡ್ ನಿಮ್ಮ ಪಠ್ಯಕ್ರಮವನ್ನು ಪ್ರತಿಬಿಂಬಿಸುತ್ತದೆ, ಸಾಮಾನ್ಯ ಡೀಫಾಲ್ಟ್ ಅಲ್ಲ.' },
        { title: 'ರಫ್ತು ಮಾಡಬಹುದಾದ ವರದಿಗಳು', desc: 'ಪೋಷಕರಿಗೆ ಅಥವಾ ಆಡಳಿತಕ್ಕೆ ಹಸ್ತಾಂತರಿಸಲು ಸಿದ್ಧವಾದ ಪ್ರತಿ-ವಿದ್ಯಾರ್ಥಿ ಅಥವಾ ಪ್ರತಿ-ತರಗತಿ ವರದಿ, ನಿಮ್ಮ ಸ್ವಂತ ಗ್ರೇಡ್‌ಬುಕ್‌ನಿಂದ ಜನರೇಟ್ ಆಗಿದೆ.' },
      ],
      promptExample: 'ಒಬ್ಬ ಶಿಕ್ಷಕರಿಗಾಗಿ ಗ್ರೇಡ್‌ಬುಕ್ ವೆಬ್ ಆ್ಯಪ್ ರಚಿಸಿ: ವಿದ್ಯಾರ್ಥಿ ಪಟ್ಟಿಗಳೊಂದಿಗೆ ನನ್ನ ತರಗತಿಗಳ ಪಟ್ಟಿಯಿರುವ Classes ಪೇಜ್; ಪ್ರತಿ-ತರಗತಿಗೆ ನಾನು ಅಸೈನ್‌ಮೆಂಟ್‌ಗಳನ್ನು ರಚಿಸುವ (ವರ್ಗ: ಹೋಮ್‌ವರ್ಕ್, ಕ್ವಿಜ್, ಪರೀಕ್ಷೆ, ಪ್ರತಿಯೊಂದಕ್ಕೂ ಒಂದು ವೇಟ್) ಮತ್ತು ಗ್ರಿಡ್‌ನಲ್ಲಿ ಪ್ರತಿ ವಿದ್ಯಾರ್ಥಿಗೆ ಸ್ಕೋರ್‌ಗಳನ್ನು ನಮೂದಿಸುವ Assignments ಪೇಜ್; ಎಲ್ಲಾ ಸ್ಕೋರ್‌ಗಳು ಮತ್ತು ವೇಟೆಡ್ ಪ್ರಸ್ತುತ ಸರಾಸರಿಯನ್ನು ತೋರಿಸುವ Student ವಿವರ ವ್ಯೂ; ಮತ್ತು ಪ್ರತಿ-ತರಗತಿ ಗ್ರೇಡ್‌ಗಳನ್ನು CSV ಗೆ ರಫ್ತು ಮಾಡುವ Reports ಪೇಜ್.',
      faqs: [
        { q: 'ನಾನು ನನ್ನ ಸ್ವಂತ ಗ್ರೇಡ್ ವೇಟಿಂಗ್ ಸೆಟ್ ಮಾಡಬಹುದೇ?', a: 'ಹೌದು — ನಿಮ್ಮ ಪ್ರಾಂಪ್ಟ್‌ನಲ್ಲಿ ನಿಮ್ಮ ವರ್ಗಗಳು ಮತ್ತು ಅವುಗಳ ಶೇಕಡಾವಾರು ವೇಟ್‌ಗಳನ್ನು ವ್ಯಾಖ್ಯಾನಿಸಿ, ಮತ್ತು ಪ್ರತಿ ಸರಾಸರಿ ನಿಮ್ಮ ನಿಖರವಾದ ಪಠ್ಯಕ್ರಮ ನಿಯಮವನ್ನು ಬಳಸಿ ಲೆಕ್ಕಹಾಕುತ್ತದೆ.' },
        { q: 'ಇದು ಬಹು ತರಗತಿಗಳು ಅಥವಾ ಪೀರಿಯಡ್‌ಗಳನ್ನು ನಿಭಾಯಿಸಬಹುದೇ?', a: 'ಹೌದು — ಪ್ರತಿ ತರಗತಿಗೆ ತನ್ನದೇ ಪಟ್ಟಿ, ಅಸೈನ್‌ಮೆಂಟ್‌ಗಳು, ಮತ್ತು ಗ್ರೇಡ್‌ಗಳಿವೆ, ಆದ್ದರಿಂದ ನಿಮ್ಮ ಎರಡು ತರಗತಿಗಳಲ್ಲಿ ಇರುವ ವಿದ್ಯಾರ್ಥಿಯನ್ನು ಪ್ರತಿಯೊಂದರಲ್ಲೂ ಪ್ರತ್ಯೇಕವಾಗಿ ಟ್ರ್ಯಾಕ್ ಮಾಡಲಾಗುತ್ತದೆ.' },
        { q: 'ವಿದ್ಯಾರ್ಥಿಗಳು ಅಥವಾ ಪೋಷಕರು ಗ್ರೇಡ್‌ಗಳನ್ನು ನೋಡಬಹುದೇ?', a: 'ನಿಮ್ಮ ಶಿಕ್ಷಕ ವ್ಯೂನಿಂದ ಪ್ರತ್ಯೇಕವಾದ, ಅವರ ಸ್ವಂತ ಗ್ರೇಡ್‌ಗಳ ಮಾತ್ರ ಓದಲು-ಮಾತ್ರ ವ್ಯೂಗಾಗಿ ನಿಮ್ಮ ಪ್ರಾಂಪ್ಟ್‌ನಲ್ಲಿ ವಿದ್ಯಾರ್ಥಿ ಅಥವಾ ಪೋಷಕ ಲಾಗಿನ್ ಸೇರಿಸಿ.' },
        { q: 'ಇದು ಲೆಟರ್ ಗ್ರೇಡ್‌ಗಳನ್ನೂ ಲೆಕ್ಕಹಾಕುತ್ತದೆಯೇ?', a: 'ನಿಮ್ಮ ಗ್ರೇಡಿಂಗ್ ಸ್ಕೇಲ್ ಅನ್ನು ವಿವರಿಸಿ (A ಎಂದರೆ 90+, ಇತ್ಯಾದಿ) ಮತ್ತು ಆ್ಯಪ್ ಸಂಖ್ಯಾತ್ಮಕ ಸರಾಸರಿಯ ಜೊತೆಗೆ ಲೆಟರ್ ಗ್ರೇಡ್ ತೋರಿಸಬಹುದು.' },
      ],
    },
  },
  te: {
    'quiz-maker-app': {
      h1: 'AIతో క్విజ్ యాప్ నిర్మించండి',
      metaTitle: 'AIతో క్విజ్ మేకర్ యాప్ నిర్మించండి — కోడ్ లేకుండా',
      metaDesc: 'టైమ్డ్ ప్రశ్నలు, తక్షణ స్కోరింగ్, మరియు ఫలితాల డాష్‌బోర్డ్‌తో క్విజ్ యాప్‌ను సృష్టించండి — తరగతి గదులు, శిక్షణ, లేదా ట్రివియా నైట్‌ల కోసం. సాదా ఇంగ్లీష్ నుండి నిర్మించబడింది.',
      tagline: 'ప్రశ్నలు రాయండి, లింక్‌ను షేర్ చేయండి, స్కోర్‌లు రావడం చూడండి — తరగతి గది, కంప్లయన్స్ శిక్షణ, లేదా శుక్రవారం ట్రివియా కోసం.',
      body: [
        'క్విజ్ టూల్స్ ప్రేక్షకుల ప్రకారం విభజించి తదనుగుణంగా ఛార్జ్ చేస్తాయి: తరగతి గది ప్లాట్‌ఫారమ్‌లు ప్రతి-విద్యార్థికి బిల్ చేస్తాయి, కార్పొరేట్ శిక్షణ టూల్స్ ప్రతి-సీటుకు బిల్ చేస్తాయి, మరియు ట్రివియా యాప్‌లు హోస్ట్‌కు బిల్ చేస్తాయి — నిర్మాణాత్మకంగా ఇది అదే ఉత్పత్తికి. ప్రశ్నలు లోపలికి, సమాధానాలు స్కోర్ చేయబడి, ఫలితాలు లెక్కించబడతాయి.',
        'మీ సొంతంగా నిర్మించడం ఈ మూడింటినీ మీ ఉపయోగానికి తగినట్టుగా ఒకే యాప్‌గా కుదిస్తుంది. మీకు కావలసిన క్విజ్ అనుభవాన్ని వివరించండి — ప్రశ్న రకాలు, టైమింగ్, తప్పు సమాధానాలకు వివరణలు చూపించాలా — మరియు WyberAi దీన్ని మొదటి నుండి చివరి వరకు జనరేట్ చేస్తుంది: మీరు ప్రశ్నలు రాసే ఎడిటర్, ఏ పరికరంలోనైనా క్లీన్ అయిన పరీక్ష రాసే అనుభవం, మరియు ప్రతి-ప్రశ్న విభజనలను చూపే ఫలితాల వ్యూ. ఒక ఉపాధ్యాయుడు తరగతి ఏ కాన్సెప్ట్‌ను మిస్ అయిందో చూస్తారు; ట్రివియా హోస్ట్‌కు లైవ్ లీడర్‌బోర్డ్ లభిస్తుంది; శిక్షకుడికి పూర్తి చేసిన రికార్డులు లభిస్తాయి.',
      ],
      features: [
        { title: 'ప్రశ్న ఎడిటర్', desc: 'బహుళ ఎంపిక, నిజం/అబద్ధం, చిన్న సమాధానం — సరైన సమాధానాలు మరియు ఐచ్ఛిక వివరణలతో ప్రశ్నలను రాయండి మరియు క్రమాన్ని మార్చండి.' },
        { title: 'టైమ్డ్ లేదా అన్‌టైమ్డ్ ప్లే', desc: 'ట్రివియా శక్తి కోసం ప్రతి-ప్రశ్న కౌంట్‌డౌన్‌లు, లేదా నేర్చుకునే తనిఖీల కోసం రిలాక్స్డ్ అన్‌టైమ్డ్ మోడ్.' },
        { title: 'తక్షణ స్కోరింగ్', desc: 'సమర్పించిన వెంటనే ఫలితాలు, ప్రతి-ప్రశ్న సమీక్ష మరియు తప్పులకు మీరు రాసిన వివరణలతో.' },
        { title: 'ఫలితాల డాష్‌బోర్డ్', desc: 'ప్రతి ప్రయత్నం లాగ్ చేయబడుతుంది — స్కోర్‌లు, పూర్తి చేయడం, మరియు గుంపు ఏ ప్రశ్నలను ఎక్కువగా తప్పు చేసిందో.' },
      ],
      promptExample: 'క్విజ్ వెబ్ యాప్‌ను నిర్మించండి: నేను బహుళ-ఎంపిక మరియు నిజం/అబద్ధం ప్రశ్నలతో క్విజ్‌లను సృష్టించే అడ్మిన్ Editor పేజీ (లాగిన్), ప్రతి ఒక్కటికీ సరైన సమాధానం మరియు వివరణ ఉంటుంది; ఒకేసారి ఒక ప్రశ్న, ప్రతి ప్రశ్నకు 30-సెకన్ల టైమర్, మరియు ప్రతి-ప్రశ్న సమీక్షతో తుది స్కోర్ స్క్రీన్ ఉన్న పబ్లిక్ క్విజ్-టేకింగ్ పేజీ; మరియు అన్ని ప్రయత్నాలను స్కోర్‌లు మరియు అత్యధికంగా-తప్పు-చేసిన-ప్రశ్నల చార్ట్‌తో చూపే Results డాష్‌బోర్డ్.',
      faqs: [
        { q: 'విద్యార్థులు దీన్ని తమ ఫోన్‌లలో తీసుకోవచ్చా?', a: 'అవును — పరీక్ష రాసే అనుభవం మొబైల్-ఫస్ట్ వెబ్ పేజీ; మీరు లింక్‌ను షేర్ చేస్తారు మరియు ఇది బ్రౌజర్ ఉన్న ఏ పరికరంలోనైనా పని చేస్తుంది.' },
        { q: 'నేను వ్యక్తులు క్విజ్‌ను మళ్ళీ తీసుకోకుండా ఆపగలనా?', a: 'మీ ప్రాంప్ట్‌లో ప్రయత్న నియమాలను సెట్ చేయండి — ఒక ఇమెయిల్‌కు ఒక ప్రయత్నం, లేదా అపరిమిత అభ్యాస మోడ్ — మరియు యాప్ వాటిని అమలు చేస్తుంది.' },
        { q: 'ఇది ట్రివియా నైట్ కోసం లైవ్ లీడర్‌బోర్డ్‌ను చూపగలదా?', a: 'అవును — సమాధానాలు వచ్చేకొద్దీ అప్‌డేట్ అయ్యే లీడర్‌బోర్డ్ స్క్రీన్‌ను అడగండి, మరియు ఆటగాళ్ళు తమ ఫోన్‌లలో సమాధానం ఇస్తున్నప్పుడు దాన్ని ప్రొజెక్ట్ చేయండి.' },
        { q: 'నేను ఎన్ని క్విజ్‌లను సృష్టించగలను?', a: 'మీకు నచ్చినన్ని — క్విజ్‌లు మీ స్వంత డేటాబేస్‌లో వరుసలు, ప్లాట్‌ఫారమ్ ప్లాన్‌పై ప్రతి-క్విజ్ ఛార్జీలు కాదు.' },
      ],
    },
    'flashcard-app': {
      h1: 'AIతో ఫ్లాష్‌కార్డ్ యాప్ నిర్మించండి',
      metaTitle: 'AIతో ఫ్లాష్‌కార్డ్ స్టడీ యాప్ నిర్మించండి — స్పేస్డ్ రిపీటిషన్',
      metaDesc: 'మీ స్వంత స్పేస్డ్-రిపీటిషన్ ఫ్లాష్‌కార్డ్ యాప్ — డెక్‌లు, రివ్యూ షెడ్యూలింగ్, మరియు పురోగతి గణాంకాలు — నిమిషాల్లో సాదా ఇంగ్లీష్ వివరణ నుండి జనరేట్ చేయబడింది.',
      tagline: 'డెక్‌లు, రోజువారీ రివ్యూలు, మరియు మీరు మర్చిపోయే ముందే ఒక కార్డును తిరిగి చూపే స్పేస్డ్ రిపీటిషన్ — మీరు ఎలా చదువుతారో దాని చుట్టూ నిర్మించిన యాప్‌లో.',
      body: [
        'ఫ్లాష్‌కార్డ్ సాఫ్ట్‌వేర్ బలమైన విధేయతను మరియు మరింత బలమైన ఫిర్యాదులను ప్రేరేపిస్తుంది: శక్తివంతమైనదానికి చాలా పరీక్షల కంటే నిటారుగా ఉన్న నేర్చుకునే వక్రత ఉంటుంది, మరియు స్నేహపూర్వకమైనవి మీ డెక్‌లను మరియు కార్డులను సబ్‌స్క్రిప్షన్ ద్వారా కొలుస్తాయి. రెండింటి కిందా ఒక అల్గారిథమ్ ఉంది — స్పేస్డ్ రిపీటిషన్ — ఇది బాగా అర్థం చేసుకోబడింది మరియు సులభంగా జనరేట్ చేయదగినది.',
        'మీరు ఏమి చదువుతున్నారో మరియు రివ్యూలు ఎలా అనిపించాలో వివరించండి, మరియు WyberAi మీ వెర్షన్‌ను నిర్మిస్తుంది: మీ సబ్జెక్టుల కోసం డెక్‌లు, మీకు ఎంత బాగా తెలుసో దాని ఆధారంగా ప్రతి కార్డును షెడ్యూల్ చేసే స్వైప్-త్రూ రివ్యూ సెషన్, మరియు పరీక్ష సమీపిస్తున్నప్పుడు మీ నిలుపుదల నిజంగా పెరుగుతున్నట్టు చూపే గణాంకాలు. చిత్రాలతో వైద్య జ్ఞాపక సాధనాలు, ఆడియోతో భాషా కార్డులు, రెండర్ చేసిన గణితంతో ఫార్ములా కార్డులు — కార్డు టెంప్లేట్‌ను నిర్వచించడం మీ ఇష్టం.',
      ],
      features: [
        { title: 'డెక్‌లు మరియు సబ్-డెక్‌లు', desc: 'సబ్జెక్ట్, అధ్యాయం, లేదా పరీక్ష ప్రకారం నిర్వహించండి — ఒక డెక్‌ను చదవండి లేదా వీటన్నింటిలో ఈరోజు డ్యూ అయిన అన్నింటినీ చదవండి.' },
        { title: 'స్పేస్డ్-రిపీటిషన్ షెడ్యూలింగ్', desc: 'ప్రతి కార్డును Again/Hard/Good/Easy గా రేట్ చేయండి మరియు తదుపరి రివ్యూ నిలుపుదలను గరిష్టం చేసే విరామంలో వస్తుంది.' },
        { title: 'మీ కార్డు ఫార్మాట్', desc: 'ముందు/వెనుక వచనం, చిత్రాలు, సూచనలు, ఉదాహరణ వాక్యాలు — కార్డు టెంప్లేట్ మీ మెటీరియల్‌కు సరిపోతుంది.' },
        { title: 'నిలుపుదల గణాంకాలు', desc: 'డ్యూ కార్డులు, రోజువారీ స్ట్రీక్, మరియు ప్రతి-డెక్ ఖచ్చితత్వం — చదువు పని చేస్తుందో లేదో అనే చిత్రం.' },
      ],
      promptExample: 'స్పేస్డ్ రిపీటిషన్‌తో ఫ్లాష్‌కార్డ్ మొబైల్ యాప్‌ను నిర్మించండి: నేను డెక్‌లను సృష్టించే మరియు ముందు, వెనుక, మరియు ఐచ్ఛిక సూచనతో కార్డులను జోడించే Decks స్క్రీన్; డ్యూ కార్డులను ఒక్కొక్కటిగా చూపే Review స్క్రీన్ — తిప్పడానికి ట్యాప్ చేయండి, తర్వాత Again, Hard, Good, లేదా Easy గా రేట్ చేయండి, ప్రతి రేటింగ్‌కు విరామాలు పెరుగుతాయి; మరియు ఈరోజు డ్యూ కార్డులు, ప్రస్తుత స్ట్రీక్, మరియు ప్రతి-డెక్ ఖచ్చితత్వం ఉన్న Stats స్క్రీన్. వేగవంతమైన మరియు మినిమల్, ఒక-చేతి రివ్యూ కోసం ఆప్టిమైజ్ చేయబడింది.',
      faqs: [
        { q: 'స్పేస్డ్ రిపీటిషన్ నిజంగా ఎలా పని చేస్తుంది?', a: 'ప్రతి రేటింగ్ కార్డు తదుపరి విరామాన్ని సర్దుబాటు చేస్తుంది — తప్పులు నిమిషాల్లో తిరిగి వస్తాయి, సులభమైన కార్డులు రోజుల నుండి వారాల వరకు విస్తరిస్తాయి. షెడ్యూలింగ్ మీ స్వంత డేటాబేస్‌లో మీ రివ్యూ చరిత్రపై నడుస్తుంది.' },
        { q: 'నేను నా ఇప్పటికే ఉన్న Anki లేదా CSV డెక్‌లను దిగుమతి చేయవచ్చా?', a: 'మీ ప్రాంప్ట్‌లో CSV దిగుమతిని అడగండి — మీ డెక్‌లను CSV కి ఎగుమతి చేయండి, కాలమ్‌లను ఒకసారి మ్యాప్ చేయండి, మీ కార్డులు వాటి కంటెంట్‌ను తీసుకువస్తాయి.' },
        { q: 'రెండు భాషలు ఒక కార్డును పంచుకోగలవా?', a: 'అవును — భాషా డెక్‌లు సహజంగా ముందు/వెనుక జతలుగా పని చేస్తాయి, మీరు ప్రతి కార్డుకు ఉచ్చారణ, ఆడియో, లేదా ఉదాహరణ వాక్యం వంటి ఫీల్డ్‌లను జోడించవచ్చు.' },
        { q: 'ఇది నా ప్రయాణ సమయంలో పని చేస్తుందా?', a: 'ఇది React Native + Expo యాప్‌గా జనరేట్ అవుతుంది — మీ ప్రాంప్ట్‌లో ఆఫ్‌లైన్ రివ్యూను అడగండి మరియు ఆన్‌లైన్‌లో ఉన్నప్పుడు సెషన్‌లు తిరిగి సింక్ అవుతాయి.' },
      ],
    },
    'online-course-platform': {
      h1: 'AIతో ఆన్‌లైన్ కోర్సు ప్లాట్‌ఫారమ్‌ను నిర్మించండి',
      metaTitle: 'AIతో మీ స్వంత కోర్సు ప్లాట్‌ఫారమ్‌ను నిర్మించండి — కోడ్ లేకుండా',
      metaDesc: 'మీ కోర్సును మీ స్వంత ప్లాట్‌ఫారమ్‌పై హోస్ట్ చేయండి: మాడ్యూల్స్, పాఠాలు, విద్యార్థి పురోగతి, మరియు పూర్తి చేసిన ట్రాకింగ్ — సాదా ఇంగ్లీష్ నుండి జనరేట్, ఆదాయ వాటా లేదు.',
      tagline: 'మీ స్వంత డొమైన్‌లో మీ కోర్సు — మాడ్యూల్స్, పురోగతి ట్రాకింగ్, మీ బ్రాండ్ — మీ పనిని $9.99కి తగ్గించే మార్కెట్‌ప్లేస్ లేకుండా.',
      body: [
        'కోర్సు సృష్టికర్తలు రెండు దిశల నుండి నొక్కబడతారు: మార్కెట్‌ప్లేస్‌లు ధర పరిమితిని సెట్ చేసి విద్యార్థి సంబంధాన్ని సొంతం చేసుకుంటాయి, హోస్ట్ చేసిన కోర్సు ప్లాట్‌ఫారమ్‌లు మీ వ్యాపారాన్ని పెంచుతాయని వాగ్దానం చేసిన ఫీచర్లతో పెరిగే నెలవారీ అద్దెను తీసుకుంటాయి. ఏ విధంగానైనా, ప్లాట్‌ఫారమ్ బ్రాండ్ మరియు మీరు కంటెంట్.',
        'కోర్సు ప్లాట్‌ఫారమ్ అంటే మాడ్యూల్స్, పాఠాలు, మరియు ఎవరు ఏమి పూర్తి చేశారో అనే రికార్డు — ఇది వివరణ యొక్క పరిధిలో బాగా ఉంటుంది. మీ కోర్సు ఎలా నిర్మించబడిందో మరియు విద్యార్థులు ఏమి అనుభవించాలో WyberAiకి చెప్పండి, మరియు అది మీ పాఠశాలను జనరేట్ చేస్తుంది: కోర్సును అమ్మే ల్యాండింగ్ పేజీ, వీడియో ఎంబెడ్‌లతో గేటెడ్ పాఠ కంటెంట్, విద్యార్థి ఆగిన చోటు నుండి తీసుకునే పురోగతి, మరియు ఎవరు ముందుకు సాగుతున్నారో ఎవరు ఆగిపోయారో చూపే ఉపాధ్యాయ వ్యూ. మీ డొమైన్, మీ ధర, మీ విద్యార్థి ఇమెయిల్‌లు.',
      ],
      features: [
        { title: 'మాడ్యూల్స్ మరియు పాఠాలు', desc: 'మీ పాఠ్యప్రణాళిక నిర్మాణాత్మక కంటెంట్‌గా — వీడియో ఎంబెడ్‌లు, రిచ్ టెక్స్ట్, డౌన్‌లోడ్‌లు, మీరు బోధించే క్రమంలోనే అమర్చబడ్డాయి.' },
        { title: 'విద్యార్థి పురోగతి ట్రాకింగ్', desc: 'పాఠాలు పూర్తయినట్టు చెక్ అవుతాయి; విద్యార్థులు ఆగిన చోటు నుండి తిరిగి ప్రారంభిస్తారు, మరియు పురోగతి కనిపిస్తూనే ఉంటుంది.' },
        { title: 'గేటెడ్ నమోదు', desc: 'విద్యార్థి ఖాతాల వెనుక కంటెంట్ — మాన్యువల్‌గా, ఆహ్వానం ద్వారా నమోదు చేయండి, లేదా అమ్మడానికి సిద్ధమైనప్పుడు చెల్లింపులను జోడించండి.' },
        { title: 'ఉపాధ్యాయ డాష్‌బోర్డ్', desc: 'నమోదు లెక్కలు, ప్రతి-విద్యార్థి పురోగతి, మరియు ప్రతి-మాడ్యూల్ పూర్తి రేట్లు — విద్యార్థులు ఎక్కడ ఆగిపోతారో అక్కడ కోర్సుకు పని అవసరం.' },
      ],
      promptExample: 'ఆన్‌లైన్ కోర్సు ప్లాట్‌ఫారమ్ వెబ్ యాప్‌ను నిర్మించండి: పాఠ్యప్రణాళిక అవుట్‌లైన్ మరియు నమోదు బటన్‌తో నా కోర్సును వివరించే పబ్లిక్ ల్యాండింగ్ పేజీ; పాఠాలు (వీడియో ఎంబెడ్, రిచ్ టెక్స్ట్ నోట్స్, డౌన్‌లోడ్ చేయదగిన వనరులు) కలిగిన మాడ్యూల్స్, పూర్తి చెక్‌బాక్స్‌లు, మరియు పురోగతి బార్‌తో విద్యార్థి ప్రాంతం (లాగిన్ అవసరం); మరియు నమోదైన విద్యార్థులు, వారి పురోగతి శాతాలు, మరియు ప్రతి-మాడ్యూల్ పూర్తి రేటును చూపే ఉపాధ్యాయ Dashboard.',
      faqs: [
        { q: 'వీడియోలు ఎక్కడ ఉంటాయి?', a: 'YouTube (అన్‌లిస్టెడ్), Vimeo, లేదా ఏదైనా హోస్ట్ నుండి ఎంబెడ్ చేయండి — పాఠ ప్లేయర్ మీ లింక్‌లను ఎంబెడ్ చేస్తుంది, కాబట్టి మీ ఇప్పటికే ఉన్న వీడియో వర్క్‌ఫ్లో అలాగే ఉంటుంది.' },
        { q: 'నేను నమోదుకు ఛార్జ్ చేయవచ్చా?', a: 'ఉచితంగా లేదా ఆహ్వానం-మాత్రమే ప్రారంభించండి, తర్వాత సిద్ధమైనప్పుడు చాట్‌లో చెల్లింపు దశను జోడించండి — కింద ఉన్న కోర్సు నిర్మాణం మారదు.' },
        { q: 'నేను ఒకటి కంటే ఎక్కువ కోర్సులను నడపవచ్చా?', a: 'అవును — నిర్మాణం ఒకే పాఠశాల కింద బహుళ కోర్సులకు విస్తరిస్తుంది, ప్రతి దానికీ దాని స్వంత ల్యాండింగ్ పేజీ మరియు నమోదు ఉంటుంది.' },
        { q: 'సర్టిఫికేట్ల గురించి ఏమిటి?', a: 'మీ ప్రాంప్ట్‌లో లేదా తర్వాత పూర్తి సర్టిఫికేట్ పేజీని అడగండి — పూర్తి చేసిన విద్యార్థులకు మీ బ్రాండింగ్‌తో షేర్ చేయదగిన, తేదీ ఉన్న సర్టిఫికేట్ లభిస్తుంది.' },
      ],
    },
    'gradebook-app-for-teachers': {
      h1: 'AIతో ఉపాధ్యాయుల కోసం గ్రేడ్‌బుక్ యాప్‌ను నిర్మించండి',
      metaTitle: 'AIతో ఉపాధ్యాయుల కోసం గ్రేడ్‌బుక్ యాప్‌ను నిర్మించండి',
      metaDesc: 'తరగతి రోస్టర్‌లు, అసైన్‌మెంట్ గ్రేడ్‌లు, మరియు ఆటో-లెక్కించిన సగటులు — మీరు నిజంగా గ్రేడ్ చేసే విధానానికి తగినట్టుగా సాదా ఇంగ్లీష్ నుండి జనరేట్ చేయబడిన గ్రేడ్‌బుక్ యాప్.',
      tagline: 'ఒక గ్రేడ్ నమోదు చేయండి, సగటు అప్‌డేట్ కావడం చూడండి — మీ వెయిటింగ్ మరియు మీ తరగతులకు తగినట్టుగా ఉన్న గ్రేడ్‌బుక్, జిల్లా-వ్యాప్త వ్యవస్థ యొక్క దృఢమైన టెంప్లేట్ కాదు.',
      body: [
        'పాఠశాల-జారీ చేసిన గ్రేడ్‌బుక్ వ్యవస్థలు మొదట నిర్వాహకుల కోసం మరియు తర్వాత ఉపాధ్యాయుల కోసం నిర్మించబడ్డాయి — దృఢమైన వర్గాలు, మీరు సర్దుబాటు చేయలేని వెయిటింగ్ నియమాలు, మరియు పీరియడ్‌ల మధ్య నలభై క్విజ్ స్కోర్‌లను నమోదు చేసే రోజువారీ వాస్తవికత కంటే కంప్లయన్స్ రిపోర్టింగ్ కోసం రూపొందించిన UI. ఉపాధ్యాయులు తమ సొంత తరగతిని నిజంగా అర్థం చేసుకోవడానికి వ్యక్తిగత స్ప్రెడ్‌షీట్‌ను ఉంచుకుంటారు.',
        'మీరు ఎలా గ్రేడ్ చేస్తారో వివరించండి — వర్గాలు, వెయిట్‌లు, తరగతి పంపిణీని మీరు ఎలా చూడాలనుకుంటున్నారు — మరియు WyberAi మీ పద్ధతి చుట్టూ గ్రేడ్‌బుక్‌ను నిర్మిస్తుంది: ప్రతి-తరగతికి రోస్టర్, అసైన్‌మెంట్‌లు మరియు స్కోర్‌ల కోసం ఎంట్రీ గ్రిడ్, మరియు ఒక గ్రేడ్ వచ్చిన వెంటనే మళ్ళీ లెక్కించే సగటులు, మీ సిలబస్ చెప్పే విధంగానే వెయిట్ చేయబడతాయి.',
      ],
      features: [
        { title: 'తరగతి రోస్టర్‌లు', desc: 'తరగతి లేదా పీరియడ్ ప్రకారం సమూహం చేయబడిన విద్యార్థులు, ప్రతి ఒక్కరికీ వారి స్వంత అసైన్‌మెంట్ చరిత్ర మరియు నడుస్తున్న సగటు.' },
        { title: 'అసైన్‌మెంట్ గ్రేడ్ గ్రిడ్', desc: 'వేగవంతమైన స్ప్రెడ్‌షీట్-వంటి గ్రిడ్‌లో ఒక అసైన్‌మెంట్ కోసం మొత్తం తరగతి స్కోర్‌లను నమోదు చేయండి.' },
        { title: 'వెయిటెడ్ సగటులు', desc: 'హోంవర్క్, క్విజ్‌లు, మరియు పరీక్షలు మీ విధంగా వెయిట్ చేయబడ్డాయి — మొత్తం గ్రేడ్ మీ సిలబస్‌ను ప్రతిబింబిస్తుంది, సాధారణ డిఫాల్ట్ కాదు.' },
        { title: 'ఎగుమతి చేయదగిన నివేదికలు', desc: 'తల్లిదండ్రులకు లేదా అడ్మినిస్ట్రేషన్‌కు అందించడానికి సిద్ధంగా ఉన్న ప్రతి-విద్యార్థి లేదా ప్రతి-తరగతి నివేదిక, మీ స్వంత గ్రేడ్‌బుక్ నుండి జనరేట్ చేయబడింది.' },
      ],
      promptExample: 'ఒక ఉపాధ్యాయుని కోసం గ్రేడ్‌బుక్ వెబ్ యాప్‌ను నిర్మించండి: విద్యార్థి రోస్టర్‌లతో నా తరగతుల జాబితా ఉన్న Classes పేజీ; ప్రతి-తరగతికి నేను అసైన్‌మెంట్‌లను సృష్టించే (వర్గం: హోంవర్క్, క్విజ్, పరీక్ష, ప్రతి ఒక్కటికీ ఒక వెయిట్) మరియు గ్రిడ్‌లో ప్రతి విద్యార్థికి స్కోర్‌లను నమోదు చేసే Assignments పేజీ; అన్ని స్కోర్‌లు మరియు వెయిటెడ్ ప్రస్తుత సగటును చూపే Student వివరాల వ్యూ; మరియు ప్రతి-తరగతి గ్రేడ్‌లను CSVకి ఎగుమతి చేసే Reports పేజీ.',
      faqs: [
        { q: 'నేను నా స్వంత గ్రేడ్ వెయిటింగ్‌ను సెట్ చేయవచ్చా?', a: 'అవును — మీ ప్రాంప్ట్‌లో మీ వర్గాలు మరియు వాటి శాతం వెయిట్‌లను నిర్వచించండి, ప్రతి సగటు మీ ఖచ్చితమైన సిలబస్ నియమాన్ని ఉపయోగించి లెక్కించబడుతుంది.' },
        { q: 'ఇది బహుళ తరగతులు లేదా పీరియడ్‌లను నిర్వహించగలదా?', a: 'అవును — ప్రతి తరగతికి దాని స్వంత రోస్టర్, అసైన్‌మెంట్‌లు, మరియు గ్రేడ్‌లు ఉంటాయి, కాబట్టి మీ రెండు తరగతులలో ఉన్న విద్యార్థిని ప్రతి దానిలో విడిగా ట్రాక్ చేయబడుతుంది.' },
        { q: 'విద్యార్థులు లేదా తల్లిదండ్రులు గ్రేడ్‌లను చూడగలరా?', a: 'మీ ఉపాధ్యాయ వ్యూ నుండి వేరుగా, వారి స్వంత గ్రేడ్‌ల మాత్రమే చదవడానికి-మాత్రమే వ్యూ కోసం మీ ప్రాంప్ట్‌లో విద్యార్థి లేదా తల్లిదండ్రుల లాగిన్‌ను జోడించండి.' },
        { q: 'ఇది లెటర్ గ్రేడ్‌లను కూడా లెక్కిస్తుందా?', a: 'మీ గ్రేడింగ్ స్కేల్‌ను వివరించండి (A అంటే 90+, మొదలైనవి) మరియు యాప్ సంఖ్యా సగటుతో పాటు లెటర్ గ్రేడ్‌ను చూపగలదు.' },
      ],
    },
  },
  ta: {
    'quiz-maker-app': {
      h1: 'AI மூலம் குயிஸ் ஆப்-ஐ உருவாக்குங்கள்',
      metaTitle: 'AI மூலம் குயிஸ் மேக்கர் ஆப்-ஐ உருவாக்குங்கள் — கோட் இல்லாமல்',
      metaDesc: 'நேரம் நிர்ணயிக்கப்பட்ட கேள்விகள், உடனடி மதிப்பீடு, மற்றும் முடிவுகள் டாஷ்போர்டுடன் குயிஸ் ஆப்-ஐ உருவாக்குங்கள் — வகுப்பறைகள், பயிற்சி, அல்லது ட்ரிவியா நைட்களுக்கு. சாதாரண ஆங்கிலத்திலிருந்து உருவாக்கப்பட்டது.',
      tagline: 'கேள்விகளை எழுதுங்கள், ஒரு லிங்கைப் பகிரவும், மதிப்பெண்கள் வருவதைப் பாருங்கள் — ஒரு வகுப்பறை, இணக்க பயிற்சி, அல்லது வெள்ளிக்கிழமை ட்ரிவியாவுக்கு.',
      body: [
        'குயிஸ் கருவிகள் பார்வையாளர்களால் பிரிக்கப்பட்டு அதற்கேற்ப கட்டணம் வசூலிக்கின்றன: வகுப்பறை தளங்கள் ஒவ்வொரு-மாணவருக்கும் பில் செய்கின்றன, கார்ப்பரேட் பயிற்சி கருவிகள் ஒவ்வொரு-சீட்டுக்கும் பில் செய்கின்றன, மற்றும் ட்ரிவியா ஆப்கள் ஹோஸ்டுக்கு பில் செய்கின்றன — கட்டமைப்பு ரீதியாக இது ஒரே தயாரிப்புக்கு. கேள்விகள் உள்ளே, பதில்கள் மதிப்பிடப்பட்டு, முடிவுகள் கணக்கிடப்படுகின்றன.',
        'உங்கள் சொந்தமாக உருவாக்குவது இந்த மூன்றையும் உங்கள் பயன்பாட்டிற்கு ஏற்ற ஒரே ஆப்பாக சுருக்குகிறது. நீங்கள் விரும்பும் குயிஸ் அனுபவத்தை விவரியுங்கள் — கேள்வி வகைகள், நேரம், தவறான பதில்களுக்கு விளக்கங்கள் காட்ட வேண்டுமா — WyberAi இதை ஆரம்பம் முதல் இறுதி வரை உருவாக்குகிறது: நீங்கள் கேள்விகளை எழுதும் எடிட்டர், எந்த சாதனத்திலும் தூய்மையான தேர்வு எழுதும் அனுபவம், மற்றும் ஒவ்வொரு-கேள்வி பிரிவையும் காட்டும் முடிவுகள் காட்சி. ஒரு ஆசிரியர் வகுப்பு எந்த கருத்தை தவறவிட்டது என்று பார்க்கிறார்; ட்ரிவியா ஹோஸ்ட் ஒரு லைவ் லீடர்போர்டு பெறுகிறார்; பயிற்சியாளர் நிறைவு பதிவுகளைப் பெறுகிறார்.',
      ],
      features: [
        { title: 'கேள்வி எடிட்டர்', desc: 'பல தேர்வு, சரி/தவறு, சிறு பதில் — சரியான பதில்கள் மற்றும் விருப்ப விளக்கங்களுடன் கேள்விகளை எழுதி வரிசைமாற்றவும்.' },
        { title: 'நேரம் நிர்ணயிக்கப்பட்ட அல்லது இல்லாத ஆட்டம்', desc: 'ட்ரிவியா ஆற்றலுக்கு ஒவ்வொரு-கேள்வி கவுன்ட்டவுன், அல்லது கற்றல் சரிபார்ப்புகளுக்கு நிதானமான நேரமற்ற பயன்முறை.' },
        { title: 'உடனடி மதிப்பீடு', desc: 'சமர்ப்பித்தவுடன் முடிவுகள், ஒவ்வொரு-கேள்வி மதிப்பாய்வு மற்றும் தவறுகளுக்கு நீங்கள் எழுதிய விளக்கங்களுடன்.' },
        { title: 'முடிவுகள் டாஷ்போர்டு', desc: 'ஒவ்வொரு முயற்சியும் பதிவு செய்யப்படுகிறது — மதிப்பெண்கள், நிறைவு, மற்றும் குழு எந்த கேள்விகளை அதிகம் தவறாகச் செய்தது.' },
      ],
      promptExample: 'ஒரு குயிஸ் வெப் ஆப்பை உருவாக்குங்கள்: நான் பல-தேர்வு மற்றும் சரி/தவறு கேள்விகளுடன் குயிஸ்களை உருவாக்கும் அட்மின் Editor பக்கம் (லாகின்), ஒவ்வொன்றிற்கும் சரியான பதில் மற்றும் விளக்கம் இருக்கும்; ஒரே நேரத்தில் ஒரு கேள்வி, ஒவ்வொரு கேள்விக்கும் 30-வினாடி டைமர், மற்றும் ஒவ்வொரு-கேள்வி மதிப்பாய்வுடன் இறுதி மதிப்பெண் திரை கொண்ட பப்ளிக் குயிஸ்-எடுக்கும் பக்கம்; மற்றும் அனைத்து முயற்சிகளையும் மதிப்பெண்கள் மற்றும் அதிகம்-தவறான-கேள்விகள் விளக்கப்படத்துடன் காட்டும் Results டாஷ்போர்டு.',
      faqs: [
        { q: 'மாணவர்கள் இதை தங்கள் ஃபோன்களில் எடுக்கலாமா?', a: 'ஆம் — தேர்வு எழுதும் அனுபவம் மொபைல்-முதல் வெப் பக்கம்; நீங்கள் ஒரு லிங்கைப் பகிர்கிறீர்கள், அது பிரவுசர் உள்ள எந்த சாதனத்திலும் வேலை செய்கிறது.' },
        { q: 'மக்கள் குயிஸை மீண்டும் எடுப்பதை நான் தடுக்கலாமா?', a: 'உங்கள் ப்ராம்ப்ட்டில் முயற்சி விதிகளை அமைக்கவும் — ஒரு மின்னஞ்சலுக்கு ஒரு முயற்சி, அல்லது வரம்பற்ற பயிற்சி முறை — ஆப் அவற்றை அமல்படுத்தும்.' },
        { q: 'இது ட்ரிவியா நைட்டுக்கு லைவ் லீடர்போர்டைக் காட்டுமா?', a: 'ஆம் — பதில்கள் வரும்போது புதுப்பிக்கப்படும் லீடர்போர்டு திரையைக் கேளுங்கள், வீரர்கள் தங்கள் ஃபோன்களில் பதிலளிக்கும்போது அதைத் திரையிடுங்கள்.' },
        { q: 'நான் எத்தனை குயிஸ்களை உருவாக்கலாம்?', a: 'நீங்கள் விரும்பியவை — குயிஸ்கள் உங்கள் சொந்த டேட்டாபேஸில் வரிசைகள், ஒரு தள திட்டத்தில் ஒவ்வொரு-குயிஸ் கட்டணங்கள் அல்ல.' },
      ],
    },
    'flashcard-app': {
      h1: 'AI மூலம் ஃப்ளாஷ்கார்டு ஆப்-ஐ உருவாக்குங்கள்',
      metaTitle: 'AI மூலம் ஃப்ளாஷ்கார்டு ஸ்டடி ஆப்-ஐ உருவாக்குங்கள் — ஸ்பேஸ்டு ரெப்டிஷன்',
      metaDesc: 'உங்கள் சொந்த ஸ்பேஸ்டு-ரெப்டிஷன் ஃப்ளாஷ்கார்டு ஆப் — டெக்குகள், மதிப்பாய்வு அட்டவணை, மற்றும் முன்னேற்ற புள்ளிவிவரங்கள் — நிமிடங்களில் சாதாரண ஆங்கில விவரிப்பிலிருந்து உருவாக்கப்பட்டது.',
      tagline: 'டெக்குகள், தினசரி மதிப்பாய்வுகள், மற்றும் நீங்கள் மறப்பதற்கு முன் ஒரு கார்டை மீண்டும் காட்டும் ஸ்பேஸ்டு ரெப்டிஷன் — நீங்கள் எப்படி படிக்கிறீர்கள் என்பதைச் சுற்றி உருவாக்கப்பட்ட ஆப்பில்.',
      body: [
        'ஃப்ளாஷ்கார்டு மென்பொருள் வலுவான விசுவாசத்தையும் இன்னும் வலுவான புகார்களையும் தூண்டுகிறது: சக்திவாய்ந்தது பெரும்பாலான தேர்வுகளை விட செங்குத்தான கற்றல் வளைவைக் கொண்டுள்ளது, நட்பான ஒன்று உங்கள் டெக்குகளையும் கார்டுகளையும் சப்ஸ்கிரிப்ஷன் மூலம் அளவிடுகிறது. இரண்டின் கீழும் ஒரு அல்காரிதம் உள்ளது — ஸ்பேஸ்டு ரெப்டிஷன் — இது நன்கு புரிந்துகொள்ளப்பட்டு எளிதாக உருவாக்கக்கூடியது.',
        'நீங்கள் என்ன படிக்கிறீர்கள், மதிப்பாய்வுகள் எப்படி உணர வேண்டும் என்று விவரியுங்கள், WyberAi உங்கள் பதிப்பை உருவாக்குகிறது: உங்கள் பாடங்களுக்கான டெக்குகள், ஒவ்வொரு கார்டையும் நீங்கள் எவ்வளவு நன்றாக அறிந்திருந்தீர்கள் என்பதன் அடிப்படையில் திட்டமிடும் ஸ்வைப்-த்ரூ மதிப்பாய்வு அமர்வு, மற்றும் தேர்வு நெருங்கும்போது உங்கள் நினைவாற்றல் உண்மையில் அதிகரிப்பதைக் காட்டும் புள்ளிவிவரங்கள். படங்களுடன் மருத்துவ நினைவாற்றல் உத்திகள், ஆடியோவுடன் மொழி கார்டுகள், வழங்கப்பட்ட கணிதத்துடன் ஃபார்முலா கார்டுகள் — கார்டு டெம்ப்ளேட்டை வரையறுப்பது உங்களுடையது.',
      ],
      features: [
        { title: 'டெக்குகள் மற்றும் சப்-டெக்குகள்', desc: 'பாடம், அத்தியாயம், அல்லது தேர்வு அடிப்படையில் ஒழுங்கமைக்கவும் — ஒரு டெக்கைப் படியுங்கள் அல்லது இவற்றில் இன்று டியூ ஆன அனைத்தையும் படியுங்கள்.' },
        { title: 'ஸ்பேஸ்டு-ரெப்டிஷன் அட்டவணை', desc: 'ஒவ்வொரு கார்டையும் Again/Hard/Good/Easy என மதிப்பிடுங்கள், அடுத்த மதிப்பாய்வு நினைவாற்றலை அதிகரிக்கும் இடைவெளியில் வரும்.' },
        { title: 'உங்கள் கார்டு வடிவம்', desc: 'முன்/பின் உரை, படங்கள், குறிப்புகள், எடுத்துக்காட்டு வாக்கியங்கள் — கார்டு டெம்ப்ளேட் உங்கள் பொருளுக்குப் பொருந்துகிறது.' },
        { title: 'நினைவாற்றல் புள்ளிவிவரங்கள்', desc: 'டியூ கார்டுகள், தினசரி ஸ்ட்ரீக், மற்றும் ஒவ்வொரு-டெக் துல்லியம் — படிப்பு வேலை செய்கிறதா என்பதன் படம்.' },
      ],
      promptExample: 'ஸ்பேஸ்டு ரெப்டிஷனுடன் ஃப்ளாஷ்கார்டு மொபைல் ஆப்பை உருவாக்குங்கள்: நான் டெக்குகளை உருவாக்கி முன், பின், மற்றும் விருப்ப குறிப்புடன் கார்டுகளைச் சேர்க்கும் Decks திரை; டியூ கார்டுகளை ஒவ்வொன்றாகக் காட்டும் Review திரை — புரட்ட தட்டவும், பின்னர் Again, Hard, Good, அல்லது Easy என மதிப்பிடவும், ஒவ்வொரு மதிப்பீட்டிற்கும் இடைவெளிகள் அதிகரிக்கும்; மற்றும் இன்று டியூ கார்டுகள், தற்போதைய ஸ்ட்ரீக், மற்றும் ஒவ்வொரு-டெக் துல்லியம் கொண்ட Stats திரை. வேகமான மற்றும் மினிமல், ஒரு-கை மதிப்பாய்வுக்கு உகந்தது.',
      faqs: [
        { q: 'ஸ்பேஸ்டு ரெப்டிஷன் உண்மையில் எப்படி வேலை செய்கிறது?', a: 'ஒவ்வொரு மதிப்பீடும் கார்டின் அடுத்த இடைவெளியை சரிசெய்கிறது — தவறுகள் நிமிடங்களில் திரும்பும், எளிதான கார்டுகள் நாட்களிலிருந்து வாரங்கள் வரை நீளும். அட்டவணை உங்கள் சொந்த டேட்டாபேஸில் உங்கள் மதிப்பாய்வு வரலாற்றில் இயங்குகிறது.' },
        { q: 'நான் எனது இருக்கும் Anki அல்லது CSV டெக்குகளை இறக்குமதி செய்யலாமா?', a: 'உங்கள் ப்ராம்ப்ட்டில் CSV இறக்குமதியைக் கேளுங்கள் — உங்கள் டெக்குகளை CSVக்கு ஏற்றுமதி செய்யுங்கள், நெடுவரிசைகளை ஒருமுறை மேப் செய்யுங்கள், உங்கள் கார்டுகள் அவற்றின் உள்ளடக்கத்தைக் கொண்டு வரும்.' },
        { q: 'இரண்டு மொழிகள் ஒரு கார்டைப் பகிரலாமா?', a: 'ஆம் — மொழி டெக்குகள் இயற்கையாகவே முன்/பின் ஜோடிகளாக வேலை செய்கின்றன, ஒவ்வொரு கார்டிற்கும் உச்சரிப்பு, ஆடியோ, அல்லது எடுத்துக்காட்டு வாக்கியம் போன்ற புலங்களைச் சேர்க்கலாம்.' },
        { q: 'இது எனது பயணத்தின் போது வேலை செய்யுமா?', a: 'இது React Native + Expo ஆப்பாக உருவாக்கப்படுகிறது — உங்கள் ப்ராம்ப்ட்டில் ஆஃப்லைன் மதிப்பாய்வைக் கேளுங்கள், ஆன்லைனில் இருக்கும்போது அமர்வுகள் மீண்டும் ஒத்திசைக்கப்படும்.' },
      ],
    },
    'online-course-platform': {
      h1: 'AI மூலம் ஆன்லைன் கோர்ஸ் தளத்தை உருவாக்குங்கள்',
      metaTitle: 'AI மூலம் உங்கள் சொந்த கோர்ஸ் தளத்தை உருவாக்குங்கள் — கோட் இல்லாமல்',
      metaDesc: 'உங்கள் கோர்ஸை உங்கள் சொந்த தளத்தில் ஹோஸ்ட் செய்யுங்கள்: மாட்யூல்கள், பாடங்கள், மாணவர் முன்னேற்றம், மற்றும் நிறைவு கண்காணிப்பு — சாதாரண ஆங்கிலத்திலிருந்து உருவாக்கப்பட்டது, வருவாய் பங்கு இல்லை.',
      tagline: 'உங்கள் சொந்த டொமைனில் உங்கள் கோர்ஸ் — மாட்யூல்கள், முன்னேற்ற கண்காணிப்பு, உங்கள் பிராண்ட் — உங்கள் வேலையை $9.99ஆக தள்ளுபடி செய்யும் எந்த மார்க்கெட்பிளேஸும் இல்லாமல்.',
      body: [
        'கோர்ஸ் உருவாக்குபவர்கள் இரு திசைகளிலிருந்தும் நெருக்கடிக்கு உள்ளாகிறார்கள்: மார்க்கெட்பிளேஸ்கள் விலை வரம்பை நிர்ணயித்து மாணவர் உறவை சொந்தமாக்கிக் கொள்கின்றன, ஹோஸ்ட் செய்யப்பட்ட கோர்ஸ் தளங்கள் உங்கள் வணிகத்தை வளர்க்கும் என்று உறுதியளிக்கப்பட்ட அம்சங்களுடன் அதிகரிக்கும் மாதாந்திர வாடகையை எடுக்கின்றன. எப்படியிருந்தாலும், தளம் பிராண்ட், நீங்கள் உள்ளடக்கம்.',
        'ஒரு கோர்ஸ் தளம் என்பது மாட்யூல்கள், பாடங்கள், மற்றும் யார் என்ன முடித்தார்கள் என்ற பதிவு — இது ஒரு விவரிப்பின் எல்லைக்குள் நன்கு பொருந்தும். உங்கள் கோர்ஸ் எப்படி கட்டமைக்கப்பட்டுள்ளது, மாணவர்கள் என்ன அனுபவிக்க வேண்டும் என்று WyberAi-க்குச் சொல்லுங்கள், அது உங்கள் பள்ளியை உருவாக்குகிறது: கோர்ஸை விற்கும் லேண்டிங் பக்கம், வீடியோ எம்பெட்களுடன் கேட்டு வைக்கப்பட்ட பாட உள்ளடக்கம், மாணவர் நிறுத்திய இடத்திலிருந்து தொடரும் முன்னேற்றம், மற்றும் யார் முன்னேறுகிறார்கள் யார் தேங்கியிருக்கிறார்கள் என்பதைக் காட்டும் ஆசிரியர் காட்சி. உங்கள் டொமைன், உங்கள் விலை நிர்ணயம், உங்கள் மாணவர் மின்னஞ்சல்கள்.',
      ],
      features: [
        { title: 'மாட்யூல்கள் மற்றும் பாடங்கள்', desc: 'உங்கள் பாடத்திட்டம் கட்டமைக்கப்பட்ட உள்ளடக்கமாக — வீடியோ எம்பெட்கள், rich text, பதிவிறக்கங்கள், நீங்கள் கற்பிக்கும் வரிசையிலேயே அமைக்கப்பட்டவை.' },
        { title: 'மாணவர் முன்னேற்ற கண்காணிப்பு', desc: 'பாடங்கள் முடிந்ததும் தேர்வு செய்யப்படும்; மாணவர்கள் நிறுத்திய இடத்திலிருந்து மீண்டும் தொடங்குகிறார்கள், வேகம் தெரியும்படி இருக்கும்.' },
        { title: 'கேட்டு வைக்கப்பட்ட பதிவு', desc: 'மாணவர் கணக்குகளுக்குப் பின்னால் உள்ள உள்ளடக்கம் — கைமுறையாக, அழைப்பு மூலம் பதிவு செய்யவும், அல்லது விற்க தயாராகும்போது கட்டணங்களை இணைக்கவும்.' },
        { title: 'ஆசிரியர் டாஷ்போர்டு', desc: 'பதிவு எண்ணிக்கைகள், ஒவ்வொரு-மாணவர் முன்னேற்றம், மற்றும் ஒவ்வொரு-மாட்யூல் நிறைவு விகிதங்கள் — மாணவர்கள் எங்கு தேங்குகிறார்களோ அங்கே கோர்ஸுக்கு வேலை தேவை.' },
      ],
      promptExample: 'ஆன்லைன் கோர்ஸ் தள வெப் ஆப்பை உருவாக்குங்கள்: பாடத்திட்ட வெளிப்புறம் மற்றும் பதிவு பொத்தானுடன் எனது கோர்ஸை விவரிக்கும் பப்ளிக் லேண்டிங் பக்கம்; பாடங்கள் (வீடியோ எம்பெட், rich text குறிப்புகள், பதிவிறக்கம் செய்யக்கூடிய வளங்கள்) கொண்ட மாட்யூல்கள், நிறைவு செக்பாக்ஸ்கள், மற்றும் முன்னேற்ற பட்டியுடன் ஒரு மாணவர் பகுதி (லாகின் தேவை); மற்றும் பதிவு செய்யப்பட்ட மாணவர்கள், அவர்களின் முன்னேற்ற சதவீதங்கள், மற்றும் ஒவ்வொரு-மாட்யூல் நிறைவு விகிதத்தைக் காட்டும் ஆசிரியர் Dashboard.',
      faqs: [
        { q: 'வீடியோக்கள் எங்கே இருக்கும்?', a: 'YouTube (பட்டியலிடப்படாதது), Vimeo, அல்லது எந்த ஹோஸ்டிலிருந்தும் உட்பொதிக்கவும் — பாடப் பிளேயர் உங்கள் லிங்குகளை உட்பொதிக்கிறது, எனவே உங்கள் தற்போதைய வீடியோ பணிப்பாய்வு தொடரும்.' },
        { q: 'நான் பதிவுக்கு கட்டணம் வசூலிக்கலாமா?', a: 'இலவசமாக அல்லது அழைப்பு-மட்டும் தொடங்குங்கள், பின்னர் தயாராகும்போது சாட்டில் ஒரு கட்டண படியைச் சேர்க்கவும் — அடிப்படையிலான கோர்ஸ் அமைப்பு மாறாது.' },
        { q: 'நான் ஒன்றுக்கு மேற்பட்ட கோர்ஸை இயக்கலாமா?', a: 'ஆம் — அமைப்பு ஒரே பள்ளியின் கீழ் பல கோர்ஸுகளுக்கு விரிவடைகிறது, ஒவ்வொன்றுக்கும் அதன் சொந்த லேண்டிங் பக்கமும் பதிவும் உள்ளது.' },
        { q: 'சான்றிதழ்கள் பற்றி என்ன?', a: 'உங்கள் ப்ராம்ப்ட்டில் அல்லது பின்னர் ஒரு நிறைவு சான்றிதழ் பக்கத்தைக் கேளுங்கள் — முடிக்கும் மாணவர்களுக்கு உங்கள் பிராண்டிங்குடன் பகிரக்கூடிய, தேதியிடப்பட்ட சான்றிதழ் கிடைக்கும்.' },
      ],
    },
    'gradebook-app-for-teachers': {
      h1: 'AI மூலம் ஆசிரியர்களுக்கான கிரேடுபுக் ஆப்-ஐ உருவாக்குங்கள்',
      metaTitle: 'AI மூலம் ஆசிரியர்களுக்கான கிரேடுபுக் ஆப்-ஐ உருவாக்குங்கள்',
      metaDesc: 'வகுப்பு பட்டியல்கள், பணி மதிப்பெண்கள், மற்றும் தானாக-கணக்கிடப்பட்ட சராசரிகள் — நீங்கள் உண்மையில் மதிப்பிடும் விதத்திற்கு ஏற்ப சாதாரண ஆங்கிலத்திலிருந்து உருவாக்கப்பட்ட கிரேடுபுக் ஆப்.',
      tagline: 'ஒரு மதிப்பெண்ணை உள்ளிடுங்கள், சராசரி புதுப்பிப்பதைப் பாருங்கள் — உங்கள் எடையீடு மற்றும் உங்கள் வகுப்புகளுக்கு ஏற்ற கிரேடுபுக், மாவட்டம் முழுவதற்குமான அமைப்பின் கடுமையான டெம்ப்ளேட் அல்ல.',
      body: [
        'பள்ளி-வழங்கிய கிரேடுபுக் அமைப்புகள் முதலில் நிர்வாகிகளுக்காகவும் இரண்டாவதாக ஆசிரியர்களுக்காகவும் கட்டமைக்கப்பட்டுள்ளன — கடுமையான வகைகள், நீங்கள் சரிசெய்ய முடியாத எடையீடு விதிகள், மற்றும் பீரியட்களுக்கு இடையில் நாற்பது குயிஸ் மதிப்பெண்களை உள்ளிடும் தினசரி யதார்த்தத்தை விட இணக்க அறிக்கையிடலுக்காக வடிவமைக்கப்பட்ட UI. ஆசிரியர்கள் தங்கள் சொந்த வகுப்பை உண்மையில் புரிந்துகொள்ள ஒரு தனிப்பட்ட ஸ்ப்ரெட்ஷீட்டை வைத்திருக்கிறார்கள்.',
        'நீங்கள் எப்படி மதிப்பிடுகிறீர்கள் என்று விவரியுங்கள் — வகைகள், எடைகள், வகுப்பு பரவலை நீங்கள் எப்படிப் பார்க்க விரும்புகிறீர்கள் — WyberAi உங்கள் முறையைச் சுற்றி ஒரு கிரேடுபுக்கை உருவாக்குகிறது: ஒவ்வொரு-வகுப்புக்கும் ஒரு பட்டியல், பணிகள் மற்றும் மதிப்பெண்களுக்கான ஒரு நுழைவு கட்டம், மற்றும் ஒரு மதிப்பெண் வந்தவுடன் மீண்டும் கணக்கிடும் சராசரிகள், உங்கள் பாடத்திட்டம் சொல்வது போலவே எடையிடப்பட்டவை.',
      ],
      features: [
        { title: 'வகுப்பு பட்டியல்கள்', desc: 'வகுப்பு அல்லது பீரியட் அடிப்படையில் தொகுக்கப்பட்ட மாணவர்கள், ஒவ்வொருவருக்கும் தங்கள் சொந்த பணி வரலாறு மற்றும் நடப்பு சராசரி.' },
        { title: 'பணி மதிப்பெண் கட்டம்', desc: 'ஒரு வேகமான ஸ்ப்ரெட்ஷீட் போன்ற கட்டத்தில் ஒரு பணிக்கு முழு வகுப்பின் மதிப்பெண்களையும் உள்ளிடுங்கள்.' },
        { title: 'எடையிடப்பட்ட சராசரிகள்', desc: 'வீட்டுப்பாடம், குயிஸ்கள், மற்றும் தேர்வுகள் உங்கள் விதத்தில் எடையிடப்பட்டவை — ஒட்டுமொத்த மதிப்பெண் உங்கள் பாடத்திட்டத்தைப் பிரதிபலிக்கிறது, பொதுவான இயல்புநிலை அல்ல.' },
        { title: 'ஏற்றுமதி செய்யக்கூடிய அறிக்கைகள்', desc: 'பெற்றோர் அல்லது நிர்வாகத்திடம் கொடுக்கத் தயாராக உள்ள ஒவ்வொரு-மாணவர் அல்லது ஒவ்வொரு-வகுப்பு அறிக்கை, உங்கள் சொந்த கிரேடுபுக்கிலிருந்து உருவாக்கப்பட்டது.' },
      ],
      promptExample: 'ஒரு ஆசிரியருக்கான கிரேடுபுக் வெப் ஆப்பை உருவாக்குங்கள்: மாணவர் பட்டியல்களுடன் எனது வகுப்புகளின் பட்டியலைக் கொண்ட Classes பக்கம்; ஒவ்வொரு-வகுப்புக்கும் நான் பணிகளை உருவாக்கும் (வகை: வீட்டுப்பாடம், குயிஸ், தேர்வு, ஒவ்வொன்றிற்கும் ஒரு எடை) மற்றும் ஒரு கட்டத்தில் ஒவ்வொரு மாணவருக்கும் மதிப்பெண்களை உள்ளிடும் Assignments பக்கம்; அனைத்து மதிப்பெண்களையும் எடையிடப்பட்ட நடப்பு சராசரியையும் காட்டும் Student விவரக் காட்சி; மற்றும் ஒவ்வொரு-வகுப்பு மதிப்பெண்களையும் CSVக்கு ஏற்றுமதி செய்யும் Reports பக்கம்.',
      faqs: [
        { q: 'நான் எனது சொந்த மதிப்பெண் எடையீட்டை அமைக்கலாமா?', a: 'ஆம் — உங்கள் ப்ராம்ப்ட்டில் உங்கள் வகைகளையும் அவற்றின் சதவீத எடைகளையும் வரையறுக்கவும், ஒவ்வொரு சராசரியும் உங்கள் சரியான பாடத்திட்ட விதியைப் பயன்படுத்தி கணக்கிடப்படும்.' },
        { q: 'இது பல வகுப்புகள் அல்லது பீரியட்களை கையாள முடியுமா?', a: 'ஆம் — ஒவ்வொரு வகுப்புக்கும் அதன் சொந்த பட்டியல், பணிகள், மற்றும் மதிப்பெண்கள் உள்ளன, எனவே உங்கள் இரண்டு வகுப்புகளில் உள்ள ஒரு மாணவர் ஒவ்வொன்றிலும் தனித்தனியாக கண்காணிக்கப்படுவார்.' },
        { q: 'மாணவர்கள் அல்லது பெற்றோர்கள் மதிப்பெண்களைப் பார்க்கலாமா?', a: 'உங்கள் ஆசிரியர் காட்சியிலிருந்து தனித்த, அவர்களின் சொந்த மதிப்பெண்கள் மட்டும் படிக்க-மட்டும் காட்சிக்காக உங்கள் ப்ராம்ப்ட்டில் ஒரு மாணவர் அல்லது பெற்றோர் லாகினைச் சேர்க்கவும்.' },
        { q: 'இது எழுத்து மதிப்பெண்களையும் கணக்கிடுமா?', a: 'உங்கள் மதிப்பீட்டு அளவை விவரியுங்கள் (A என்பது 90+, முதலியன) ஆப் எண் சராசரியுடன் ஒரு எழுத்து மதிப்பெண்ணையும் காட்டலாம்.' },
      ],
    },
  },
}
