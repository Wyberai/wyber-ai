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
// content for the "events" category /build/[slug] pages (English source:
// src/app/build/data/events.ts). Proper nouns, brand names, and tech terms
// (WyberAi, WhatsApp, CSV) are left untranslated across every locale — only
// the surrounding prose is translated. slug/target/category/related live on
// BuildPage itself and aren't duplicated here.
export const EVENTS_BUILD_CONTENT: Record<Locale, Record<string, TranslatedBuildPage>> = {
  en: {
    'wedding-rsvp-website': {
      h1: 'Build a Wedding RSVP Website with AI',
      metaTitle: 'Build a Wedding Website with RSVP — AI, No Code',
      metaDesc: 'Your story, schedule, and a real RSVP system with meal choices and plus-ones — a wedding website generated from plain English, no template rent.',
      tagline: 'Your story, your schedule, and an RSVP list that fills itself — instead of a spreadsheet and 40 "who\'s coming?" texts.',
      body: [
        'Wedding website builders have perfected a pricing trick: the pretty page is free, but the thing you actually need — RSVPs with meal choices, plus-ones, and a guest list you can hand the caterer — sits behind the premium tier. And the template is still recognizably the same one from your cousin\'s wedding.',
        'Describe your wedding — the venues, the day\'s timeline, what guests need to choose — and WyberAi generates a site that\'s actually yours: your story told your way, and an RSVP form that writes straight into a guest database. The dashboard answers the questions that matter at T-minus-two-weeks: who\'s confirmed, how many chicken versus paneer, which out-of-town guests need the hotel block link.',
      ],
      features: [
        { title: 'RSVP with the real questions', desc: 'Attending, meal choice, dietary notes, plus-one name, song request — whatever your planning needs, captured per guest.' },
        { title: 'Caterer-ready guest dashboard', desc: 'Confirmed count, meal totals, and dietary flags in one view — exportable when the venue asks.' },
        { title: 'Your day, laid out', desc: 'Ceremony, reception, mehndi, after-party — each with time, venue, map link, and dress code.' },
        { title: 'Private by invitation', desc: 'Keep the site open, or gate RSVP behind a code from your invitation cards.' },
      ],
      promptExample: 'Build a wedding website: a beautiful Home page with our names, date, and story; a Schedule page with ceremony and reception times, venues with map links, and dress code; an RSVP page where guests enter their invite name, mark attending or not, choose a meal (veg/non-veg), add dietary notes and a plus-one; and a private Dashboard (login) showing confirmed counts, meal totals, and the full guest list.',
      faqs: [
        { q: 'Can guests RSVP for their whole family at once?', a: 'Yes — model invites as households in your prompt and one submission can confirm every name on the invitation.' },
        { q: 'Can we match the site to our invitation suite?', a: 'Describe your palette and mood ("dusty rose and cream, serif, candlelit") and the design is generated to match — then refine in chat.' },
        { q: 'What about a custom domain like ournames.com?', a: 'Publish the site and connect a custom domain from the editor — guests never see a builder URL.' },
        { q: 'Is there a per-guest or premium-feature fee?', a: 'No — RSVP, dashboard, and guest list are just parts of your app. Building uses free monthly credits; the site is yours.' },
      ],
    },
    'event-registration-app': {
      h1: 'Build an Event Registration App with AI',
      metaTitle: 'Build an Event Registration App with AI — No Code',
      metaDesc: 'Registration pages, capacity limits, waitlists, and a check-in view — event signup software generated from a description, without per-ticket fees.',
      tagline: 'Registration, capacity, waitlist, check-in — the whole signup pipeline for your workshop or meetup, minus the per-ticket platform fee.',
      body: [
        'For free events and paid workshops alike, ticketing platforms charge like exchanges: a cut per ticket, service fees your attendees grumble about, and your attendee list living in their CRM, not yours. A community meetup shouldn\'t hand over a percentage to collect names.',
        'Registration is a form, a capacity counter, and a list — which is why it generates so well. Describe your event and what you need to know per attendee, and WyberAi builds the pipeline: a signup page that closes itself at capacity and starts a waitlist, automatic promotion when someone drops, and a check-in view for the door that works from a phone. Run one event or a monthly series; the attendee data stays yours either way.',
      ],
      features: [
        { title: 'Registration with your questions', desc: 'Name and email plus whatever your event needs — t-shirt size, experience level, dietary needs, company.' },
        { title: 'Capacity + auto-waitlist', desc: 'Signups close at your cap; later registrants join a waitlist and promote automatically when spots free up.' },
        { title: 'Door check-in mode', desc: 'A fast search-and-tap attendee list for event day — see who\'s arrived and who\'s a no-show, live.' },
        { title: 'Series-ready structure', desc: 'Run recurring events under one roof — each with its own page, capacity, and attendee list.' },
      ],
      promptExample: 'Build an event registration web app for a monthly tech meetup: a public Events page listing upcoming events; each event page with description, venue, date, and a registration form (name, email, role, dietary preference) that enforces a capacity of 80 and starts a waitlist when full, auto-promoting from the waitlist on cancellations; and an organizer Dashboard with attendee lists, waitlist, and a check-in mode with search for event day.',
      faqs: [
        { q: 'Can it handle paid tickets?', a: 'Start with free registration and add a payment step in chat when you need it — the registration flow and attendee list stay the same underneath.' },
        { q: 'How does the waitlist promotion work?', a: 'When a confirmed attendee cancels, the first waitlisted person is promoted automatically and appears in the confirmed list — no manual shuffling.' },
        { q: 'Can attendees cancel their own spot?', a: 'Yes — ask for a manage-registration link in your prompt and cancellations free the spot (and trigger the waitlist) without emailing you.' },
        { q: 'Who owns the attendee data?', a: 'You do — it lives in your app\'s own database, secured with row-level security and scanned before publish. No platform is mining your attendee list.' },
      ],
    },
    'sports-league-manager': {
      h1: 'Build a Sports League Management App with AI',
      metaTitle: 'Build a Sports League Manager with AI — Fixtures & Standings',
      metaDesc: 'Fixtures, live standings, and team rosters for your local league — generated from a plain-English description. No spreadsheet, no league-software fees.',
      tagline: 'Fixtures published, results in, table updates itself — and the WhatsApp group argues about form, not about whose spreadsheet is right.',
      body: [
        'Every local league — five-a-side football, box cricket, office badminton — runs on the same fragile stack: one volunteer, one spreadsheet, and a WhatsApp group where the fixture list gets buried forty messages deep. The moment the volunteer travels, the standings stop being trustworthy.',
        'A league app is standings math plus a schedule, and that\'s a clean thing to generate. Tell WyberAi your format — teams, rounds, points rules, tie-breakers — and it builds the public league site: fixtures by round, a table that recalculates the instant a result is entered, and team pages with rosters and form. The admin types in one score; everything downstream updates itself.',
      ],
      features: [
        { title: 'Fixture rounds', desc: 'The season\'s schedule laid out by round or week — each match with teams, time, and venue.' },
        { title: 'Self-updating standings', desc: 'Points, goal difference, and your tie-breaker rules applied automatically the moment results land.' },
        { title: 'Team pages and rosters', desc: 'Each team with its squad, results, and recent form — the page players actually check.' },
        { title: 'One-admin results entry', desc: 'A protected results form for the organizer; everyone else gets a read-only league that\'s always current.' },
      ],
      promptExample: 'Build a sports league web app for an 8-team five-a-side football league: a public Standings page (3 points for a win, 1 for a draw, ranked by points then goal difference); a Fixtures page grouped by round showing date, time, and venue with results filled in as played; team pages with roster and last-5 form; and an admin-only Results page where I enter scores and the table updates automatically.',
      faqs: [
        { q: 'Can it generate the fixture list for me?', a: 'Yes — say "generate a double round-robin schedule" in your prompt and every team plays every team home and away, spread across your season dates.' },
        { q: 'What about knockout stages or playoffs?', a: 'Describe the format — top four to semifinals, a cup bracket — and ask chat to add the knockout structure when the group stage ends.' },
        { q: 'Can players check scores without logging in?', a: 'Yes — the league site is public and read-only by default; only results entry sits behind the admin login.' },
        { q: 'Does it work for cricket, basketball, or badminton?', a: 'The structure — teams, fixtures, results, points rules — is sport-agnostic. Describe your sport\'s scoring and the standings math follows it.' },
      ],
    },
    'volunteer-management-app': {
      h1: 'Build a Volunteer Management App with AI',
      metaTitle: 'Build a Volunteer Management App with AI',
      metaDesc: 'Shift sign-ups, volunteer hours, and role assignments for your nonprofit — a volunteer app generated from plain English, free to start.',
      tagline: 'Volunteers pick a shift, you see who\'s covered and who\'s not — instead of a sign-up sheet emailed around and never quite reconciled.',
      body: [
        'Nonprofits and community organizations run volunteer scheduling on whatever\'s free: a shared spreadsheet, a paper sign-up sheet at the front desk, a group text that loses track of who actually confirmed. It works until an event needs twelve people and only seven show up, because nobody had a clear view of the gaps.',
        'Describe your organization\'s shifts and roles, and WyberAi builds the coordination layer: a public shift board volunteers can claim themselves, a roster that tracks hours logged per volunteer for recognition or grant reporting, and an admin view showing exactly which shifts are still short-staffed before the event, not after.',
      ],
      features: [
        { title: 'Public shift board', desc: 'Volunteers browse open shifts by date and role, and claim one directly — no email back-and-forth to confirm.' },
        { title: 'Volunteer roster', desc: 'Every volunteer with contact info, roles they\'re trained for, and total hours logged over time.' },
        { title: 'Coverage view for organizers', desc: 'See which shifts are fully staffed and which need more hands, at a glance, before the day arrives.' },
        { title: 'Hours logged for reporting', desc: 'Completed shifts add to a volunteer\'s hour total — useful for recognition, school credit, or grant applications.' },
      ],
      promptExample: 'Build a volunteer management web app: a public Shifts page listing open shifts by date and role with a claim button (volunteer enters name and email); a Volunteers page (admin) listing everyone with total hours logged and roles they\'ve done; and a Coverage Dashboard showing each upcoming shift\'s filled versus needed volunteer count, highlighting anything understaffed.',
      faqs: [
        { q: 'Can volunteers cancel a shift they claimed?', a: 'Yes — ask for a cancel-my-shift link in your prompt, which reopens the slot on the public board immediately.' },
        { q: 'Can it track different roles, like setup versus check-in?', a: 'Yes — define roles in your prompt and each shift can require a specific role, so the coverage view splits by what\'s actually needed.' },
        { q: 'Can I export hours for a grant report?', a: 'Ask for a CSV export on the volunteers page — total hours per person for any date range, ready to paste into a report.' },
        { q: 'Does it send reminders before a shift?', a: 'Add reminder emails or notifications in your prompt, and volunteers get pinged before their claimed shift starts.' },
      ],
    },
  },
  hi: {
    'wedding-rsvp-website': {
      h1: 'AI से वेडिंग RSVP वेबसाइट बनाएं',
      metaTitle: 'AI से RSVP वाली वेडिंग वेबसाइट बनाएं — बिना कोड',
      metaDesc: 'आपकी कहानी, शेड्यूल, और मील चॉइस व प्लस-वन वाला असली RSVP सिस्टम — सादी अंग्रेज़ी से जनरेट की गई वेडिंग वेबसाइट, कोई टेम्पलेट किराया नहीं।',
      tagline: 'आपकी कहानी, आपका शेड्यूल, और एक RSVP लिस्ट जो ख़ुद भरती है — किसी स्प्रेडशीट और 40 "कौन आ रहा है?" मैसेजों की बजाय।',
      body: [
        'वेडिंग वेबसाइट बिल्डर्स ने एक प्राइसिंग ट्रिक परफ़ेक्ट कर ली है: सुंदर पेज मुफ़्त है, लेकिन जो चीज़ आपको असल में चाहिए — मील चॉइस, प्लस-वन वाले RSVP, और एक गेस्ट लिस्ट जो आप कैटरर को दे सकें — वह प्रीमियम टियर के पीछे रखी है। और टेम्पलेट अभी भी वही पहचाना जा सकता है जो आपके कज़िन की शादी में था।',
        'अपनी शादी बताएं — वेन्यू, दिन की टाइमलाइन, गेस्ट्स को क्या चुनना है — और WyberAi एक ऐसी साइट जनरेट करता है जो असल में आपकी है: आपकी कहानी आपके तरीके से कही गई, और एक RSVP फ़ॉर्म जो सीधे एक गेस्ट डेटाबेस में लिखता है। डैशबोर्ड टी-माइनस-दो-हफ़्ते पर काम की बातों का जवाब देता है: किसने कन्फ़र्म किया, कितने चिकन बनाम पनीर, कौन से बाहरी गेस्ट्स को होटल ब्लॉक लिंक चाहिए।',
      ],
      features: [
        { title: 'असली सवालों वाला RSVP', desc: 'अटेंडिंग, मील चॉइस, डायटरी नोट्स, प्लस-वन नाम, सॉन्ग रिक्वेस्ट — आपकी प्लानिंग को जो भी चाहिए, प्रति-गेस्ट कैप्चर किया गया।' },
        { title: 'कैटरर-रेडी गेस्ट डैशबोर्ड', desc: 'कन्फ़र्म काउंट, मील टोटल्स, और डायटरी फ़्लैग्स एक व्यू में — वेन्यू के पूछने पर एक्सपोर्ट करने योग्य।' },
        { title: 'आपका दिन, बिछाया हुआ', desc: 'सेरेमनी, रिसेप्शन, मेहंदी, आफ़्टर-पार्टी — हर एक का टाइम, वेन्यू, मैप लिंक, और ड्रेस कोड।' },
        { title: 'इनविटेशन से प्राइवेट', desc: 'साइट को खुला रखें, या अपने इनविटेशन कार्ड्स के कोड के पीछे RSVP को गेट करें।' },
      ],
      promptExample: 'एक वेडिंग वेबसाइट बनाएं: हमारे नाम, तारीख़, और कहानी के साथ एक सुंदर Home पेज; सेरेमनी और रिसेप्शन के समय, मैप लिंक्स वाले वेन्यू, और ड्रेस कोड के साथ एक Schedule पेज; एक RSVP पेज जहां गेस्ट अपना इनवाइट नाम डालें, अटेंडिंग या नहीं मार्क करें, एक मील चुनें (वेज/नॉन-वेज), डायटरी नोट्स और एक प्लस-वन जोड़ें; और कन्फ़र्म काउंट्स, मील टोटल्स, और पूरी गेस्ट लिस्ट दिखाने वाला एक प्राइवेट Dashboard (लॉगिन)।',
      faqs: [
        { q: 'क्या गेस्ट एक साथ अपने पूरे परिवार के लिए RSVP कर सकते हैं?', a: 'हां — अपने प्रॉम्प्ट में इनवाइट्स को हाउसहोल्ड्स के रूप में मॉडल करें और एक सबमिशन इनविटेशन पर हर नाम को कन्फ़र्म कर सकता है।' },
        { q: 'क्या हम साइट को अपने इनविटेशन सूट से मैच कर सकते हैं?', a: 'अपना पैलेट और मूड बताएं ("डस्टी रोज़ और क्रीम, सेरिफ़, कैंडललिट") और डिज़ाइन उसी हिसाब से जनरेट होता है — फिर चैट में उसे परिष्कृत करें।' },
        { q: 'ourNames.com जैसे कस्टम डोमेन का क्या?', a: 'साइट प्रकाशित करें और एडिटर से कस्टम डोमेन जोड़ें — गेस्ट कभी भी बिल्डर URL नहीं देखते।' },
        { q: 'क्या प्रति-गेस्ट या प्रीमियम-फ़ीचर फ़ीस है?', a: 'नहीं — RSVP, डैशबोर्ड, और गेस्ट लिस्ट आपके ऐप के बस हिस्से हैं। बनाने में मुफ़्त मासिक क्रेडिट्स लगते हैं; साइट आपकी है।' },
      ],
    },
    'event-registration-app': {
      h1: 'AI से इवेंट रजिस्ट्रेशन ऐप बनाएं',
      metaTitle: 'AI से इवेंट रजिस्ट्रेशन ऐप बनाएं — बिना कोड',
      metaDesc: 'रजिस्ट्रेशन पेज, कैपेसिटी लिमिट्स, वेटलिस्ट, और एक चेक-इन व्यू — विवरण से जनरेट किया गया इवेंट साइनअप सॉफ़्टवेयर, बिना प्रति-टिकट फ़ीस के।',
      tagline: 'रजिस्ट्रेशन, कैपेसिटी, वेटलिस्ट, चेक-इन — आपके वर्कशॉप या मीटअप के लिए पूरी साइनअप पाइपलाइन, प्रति-टिकट प्लेटफ़ॉर्म फ़ीस के बिना।',
      body: [
        'मुफ़्त इवेंट्स और पेड वर्कशॉप्स दोनों के लिए, टिकटिंग प्लेटफ़ॉर्म एक्सचेंज की तरह चार्ज करते हैं: प्रति-टिकट कमीशन, सर्विस फ़ीस जिनके बारे में आपके अटेंडीज़ शिकायत करते हैं, और आपकी अटेंडी लिस्ट उनके CRM में रहती है, आपके नहीं। एक कम्युनिटी मीटअप को नाम इकट्ठा करने के लिए एक प्रतिशत नहीं देना चाहिए।',
        'रजिस्ट्रेशन एक फ़ॉर्म, एक कैपेसिटी काउंटर, और एक लिस्ट है — यही वजह है कि यह इतनी अच्छी तरह जनरेट होता है। अपना इवेंट बताएं और प्रति-अटेंडी आपको क्या जानना है, और WyberAi पाइपलाइन बनाता है: एक साइनअप पेज जो कैपेसिटी पर ख़ुद बंद हो जाता है और एक वेटलिस्ट शुरू करता है, किसी के हटने पर ऑटोमैटिक प्रमोशन, और दरवाज़े के लिए एक चेक-इन व्यू जो फ़ोन से काम करता है। एक इवेंट चलाएं या एक मासिक सीरीज़; अटेंडी डेटा दोनों ही स्थिति में आपका रहता है।',
      ],
      features: [
        { title: 'आपके सवालों वाला रजिस्ट्रेशन', desc: 'नाम और ईमेल के साथ आपके इवेंट को जो भी चाहिए — टी-शर्ट साइज़, एक्सपीरियंस लेवल, डायटरी ज़रूरतें, कंपनी।' },
        { title: 'कैपेसिटी + ऑटो-वेटलिस्ट', desc: 'साइनअप आपकी सीमा पर बंद हो जाते हैं; बाद के रजिस्ट्रेंट्स एक वेटलिस्ट में शामिल होते हैं और जगह ख़ाली होने पर ऑटोमैटिक प्रमोट होते हैं।' },
        { title: 'दरवाज़े का चेक-इन मोड', desc: 'इवेंट के दिन के लिए एक तेज़ सर्च-एंड-टैप अटेंडी लिस्ट — लाइव देखें कौन आया है और कौन नहीं आया।' },
        { title: 'सीरीज़-रेडी स्ट्रक्चर', desc: 'एक ही छत के नीचे बार-बार होने वाले इवेंट्स चलाएं — हर एक का अपना पेज, कैपेसिटी, और अटेंडी लिस्ट।' },
      ],
      promptExample: 'एक मासिक टेक मीटअप के लिए इवेंट रजिस्ट्रेशन वेब ऐप बनाएं: आने वाले इवेंट्स की लिस्ट वाला एक पब्लिक Events पेज; विवरण, वेन्यू, तारीख़, और एक रजिस्ट्रेशन फ़ॉर्म (नाम, ईमेल, रोल, डायटरी प्रेफ़रेंस) वाला हर इवेंट पेज जो 80 की कैपेसिटी लागू करे और भर जाने पर वेटलिस्ट शुरू करे, कैंसिलेशन पर वेटलिस्ट से ऑटो-प्रमोट करे; और अटेंडी लिस्ट्स, वेटलिस्ट, और इवेंट के दिन के लिए सर्च वाले चेक-इन मोड के साथ एक ऑर्गेनाइज़र Dashboard।',
      faqs: [
        { q: 'क्या यह पेड टिकट्स हैंडल कर सकता है?', a: 'मुफ़्त रजिस्ट्रेशन से शुरू करें और ज़रूरत पड़ने पर चैट में एक पेमेंट स्टेप जोड़ें — रजिस्ट्रेशन फ़्लो और अटेंडी लिस्ट नीचे वही रहते हैं।' },
        { q: 'वेटलिस्ट प्रमोशन कैसे काम करता है?', a: 'जब एक कन्फ़र्म्ड अटेंडी कैंसिल करता है, पहला वेटलिस्टेड व्यक्ति ऑटोमैटिक प्रमोट होता है और कन्फ़र्म्ड लिस्ट में दिखता है — कोई मैन्युअल फेरबदल नहीं।' },
        { q: 'क्या अटेंडी अपनी ख़ुद की जगह कैंसिल कर सकते हैं?', a: 'हां — अपने प्रॉम्प्ट में मैनेज-रजिस्ट्रेशन लिंक मांगें और कैंसिलेशन बिना आपको ईमेल किए जगह ख़ाली कर देते हैं (और वेटलिस्ट ट्रिगर करते हैं)।' },
        { q: 'अटेंडी डेटा का मालिक कौन है?', a: 'आप — यह आपके ऐप के अपने डेटाबेस में रहता है, रो-लेवल सिक्योरिटी से सुरक्षित और प्रकाशन से पहले स्कैन किया गया। कोई प्लेटफ़ॉर्म आपकी अटेंडी लिस्ट माइन नहीं कर रहा।' },
      ],
    },
    'sports-league-manager': {
      h1: 'AI से स्पोर्ट्स लीग मैनेजमेंट ऐप बनाएं',
      metaTitle: 'AI से स्पोर्ट्स लीग मैनेजर बनाएं — फ़िक्सचर्स और स्टैंडिंग्स',
      metaDesc: 'आपकी लोकल लीग के लिए फ़िक्सचर्स, लाइव स्टैंडिंग्स, और टीम रोस्टर्स — सादी अंग्रेज़ी विवरण से जनरेट। कोई स्प्रेडशीट नहीं, कोई लीग-सॉफ़्टवेयर फ़ीस नहीं।',
      tagline: 'फ़िक्सचर्स प्रकाशित, नतीजे आए, टेबल ख़ुद अपडेट होती है — और WhatsApp ग्रुप फ़ॉर्म पर बहस करता है, किसकी स्प्रेडशीट सही है इस पर नहीं।',
      body: [
        'हर लोकल लीग — फ़ाइव-अ-साइड फ़ुटबॉल, बॉक्स क्रिकेट, ऑफ़िस बैडमिंटन — एक ही नाज़ुक स्टैक पर चलती है: एक वॉलंटियर, एक स्प्रेडशीट, और एक WhatsApp ग्रुप जहां फ़िक्सचर लिस्ट चालीस मैसेजों में दब जाती है। जिस पल वॉलंटियर ट्रैवल करता है, स्टैंडिंग्स भरोसेमंद रहना बंद कर देती हैं।',
        'एक लीग ऐप स्टैंडिंग्स मैथ प्लस एक शेड्यूल है, और यह जनरेट करने के लिए एक साफ़ चीज़ है। WyberAi को अपना फ़ॉर्मैट बताएं — टीमें, राउंड्स, पॉइंट्स नियम, टाई-ब्रेकर्स — और यह पब्लिक लीग साइट बनाता है: राउंड के हिसाब से फ़िक्सचर्स, एक टेबल जो नतीजा आते ही दोबारा कैलकुलेट होती है, और रोस्टर्स व फ़ॉर्म वाले टीम पेजेस। एडमिन एक स्कोर टाइप करता है; उससे आगे सब कुछ ख़ुद अपडेट हो जाता है।',
      ],
      features: [
        { title: 'फ़िक्सचर राउंड्स', desc: 'सीज़न का शेड्यूल राउंड या हफ़्ते के हिसाब से बिछाया गया — हर मैच में टीमें, समय, और वेन्यू।' },
        { title: 'ख़ुद-अपडेट होने वाली स्टैंडिंग्स', desc: 'नतीजे आते ही पॉइंट्स, गोल डिफ़रेंस, और आपके टाई-ब्रेकर नियम ऑटोमैटिक लागू होते हैं।' },
        { title: 'टीम पेजेस और रोस्टर्स', desc: 'हर टीम अपने स्क्वाड, नतीजों, और हाल के फ़ॉर्म के साथ — वह पेज जिसे प्लेयर्स असल में चेक करते हैं।' },
        { title: 'एक-एडमिन नतीजा एंट्री', desc: 'ऑर्गेनाइज़र के लिए एक प्रोटेक्टेड नतीजा फ़ॉर्म; बाक़ी सबको एक रीड-ओनली लीग मिलती है जो हमेशा करंट रहती है।' },
      ],
      promptExample: '8-टीम फ़ाइव-अ-साइड फ़ुटबॉल लीग के लिए एक स्पोर्ट्स लीग वेब ऐप बनाएं: एक पब्लिक Standings पेज (जीत के 3 पॉइंट्स, ड्रॉ के 1, पहले पॉइंट्स फिर गोल डिफ़रेंस से रैंक्ड); राउंड के हिसाब से ग्रुप किया गया एक Fixtures पेज जो तारीख़, समय, और वेन्यू दिखाए, खेले जाने पर नतीजे भरे जाएं; रोस्टर और आख़िरी-5 फ़ॉर्म वाले टीम पेजेस; और एक एडमिन-ओनली Results पेज जहां मैं स्कोर डालूं और टेबल ऑटोमैटिक अपडेट हो।',
      faqs: [
        { q: 'क्या यह मेरे लिए फ़िक्सचर लिस्ट जनरेट कर सकता है?', a: 'हां — अपने प्रॉम्प्ट में "डबल राउंड-रॉबिन शेड्यूल जनरेट करें" कहें और हर टीम हर टीम से होम और अवे खेलती है, आपकी सीज़न तारीख़ों में फैली हुई।' },
        { q: 'नॉकआउट स्टेजेज़ या प्लेऑफ़्स का क्या?', a: 'फ़ॉर्मैट बताएं — टॉप फ़ोर से सेमीफ़ाइनल्स, एक कप ब्रैकेट — और ग्रुप स्टेज ख़त्म होने पर चैट से नॉकआउट स्ट्रक्चर जोड़ने को कहें।' },
        { q: 'क्या प्लेयर्स बिना लॉगिन किए स्कोर चेक कर सकते हैं?', a: 'हां — लीग साइट डिफ़ॉल्ट रूप से पब्लिक और रीड-ओनली है; सिर्फ़ नतीजा एंट्री एडमिन लॉगिन के पीछे रहती है।' },
        { q: 'क्या यह क्रिकेट, बास्केटबॉल, या बैडमिंटन के लिए काम करता है?', a: 'ढांचा — टीमें, फ़िक्सचर्स, नतीजे, पॉइंट्स नियम — स्पोर्ट-एग्नॉस्टिक है। अपने स्पोर्ट की स्कोरिंग बताएं और स्टैंडिंग्स मैथ उसे फ़ॉलो करता है।' },
      ],
    },
    'volunteer-management-app': {
      h1: 'AI से वॉलंटियर मैनेजमेंट ऐप बनाएं',
      metaTitle: 'AI से वॉलंटियर मैनेजमेंट ऐप बनाएं',
      metaDesc: 'आपके नॉनप्रॉफ़िट के लिए शिफ़्ट साइनअप्स, वॉलंटियर आवर्स, और रोल असाइनमेंट्स — सादी अंग्रेज़ी से जनरेट किया गया वॉलंटियर ऐप, शुरू करना मुफ़्त।',
      tagline: 'वॉलंटियर एक शिफ़्ट चुनते हैं, आप देखते हैं कौन कवर्ड है कौन नहीं — इधर-उधर ईमेल की गई साइन-अप शीट की बजाय जो कभी ठीक से रीकॉन्साइल नहीं होती।',
      body: [
        'नॉनप्रॉफ़िट्स और कम्युनिटी ऑर्गेनाइज़ेशन्स जो भी मुफ़्त है उस पर वॉलंटियर शेड्यूलिंग चलाते हैं: एक शेयर्ड स्प्रेडशीट, फ़्रंट डेस्क पर एक पेपर साइन-अप शीट, एक ग्रुप टेक्स्ट जो ट्रैक खो देता है कि असल में किसने कन्फ़र्म किया। यह तब तक काम करता है जब तक एक इवेंट को बारह लोग चाहिए और सिर्फ़ सात आते हैं, क्योंकि किसी के पास गैप्स का साफ़ व्यू नहीं था।',
        'अपने ऑर्गेनाइज़ेशन की शिफ़्ट्स और रोल्स बताएं, और WyberAi कोऑर्डिनेशन लेयर बनाता है: एक पब्लिक शिफ़्ट बोर्ड जिसे वॉलंटियर ख़ुद क्लेम कर सकें, एक रोस्टर जो रिकग्निशन या ग्रांट रिपोर्टिंग के लिए प्रति-वॉलंटियर लॉग किए घंटों को ट्रैक करे, और एक एडमिन व्यू जो इवेंट से पहले, बाद में नहीं, बिल्कुल दिखाए कि कौन सी शिफ़्ट्स अभी भी कम-स्टाफ़्ड हैं।',
      ],
      features: [
        { title: 'पब्लिक शिफ़्ट बोर्ड', desc: 'वॉलंटियर तारीख़ और रोल के हिसाब से खुली शिफ़्ट्स ब्राउज़ करते हैं, और सीधे एक क्लेम करते हैं — कन्फ़र्म करने के लिए कोई ईमेल आगे-पीछे नहीं।' },
        { title: 'वॉलंटियर रोस्टर', desc: 'हर वॉलंटियर, कॉन्टैक्ट जानकारी, जिन रोल्स के लिए वे ट्रेंड हैं, और समय के साथ कुल लॉग किए घंटों के साथ।' },
        { title: 'ऑर्गेनाइज़र्स के लिए कवरेज व्यू', desc: 'दिन आने से पहले, एक नज़र में देखें कौन सी शिफ़्ट्स पूरी तरह स्टाफ़्ड हैं और किन्हें और हाथों की ज़रूरत है।' },
        { title: 'रिपोर्टिंग के लिए लॉग किए घंटे', desc: 'पूरी हुई शिफ़्ट्स वॉलंटियर के घंटों के टोटल में जुड़ती हैं — रिकग्निशन, स्कूल क्रेडिट, या ग्रांट एप्लीकेशन्स के लिए उपयोगी।' },
      ],
      promptExample: 'एक वॉलंटियर मैनेजमेंट वेब ऐप बनाएं: एक क्लेम बटन (वॉलंटियर नाम और ईमेल डालता है) के साथ तारीख़ और रोल के हिसाब से खुली शिफ़्ट्स की लिस्ट वाला एक पब्लिक Shifts पेज; कुल लॉग किए घंटों और उनके किए हुए रोल्स के साथ हर किसी की लिस्ट वाला एक Volunteers पेज (एडमिन); और हर आने वाली शिफ़्ट का भरा बनाम ज़रूरी वॉलंटियर काउंट दिखाने वाला, कम-स्टाफ़्ड किसी भी चीज़ को हाइलाइट करने वाला एक Coverage Dashboard।',
      faqs: [
        { q: 'क्या वॉलंटियर अपनी क्लेम की हुई शिफ़्ट कैंसिल कर सकते हैं?', a: 'हां — अपने प्रॉम्प्ट में cancel-my-shift लिंक मांगें, जो तुरंत पब्लिक बोर्ड पर स्लॉट फिर से खोल देता है।' },
        { q: 'क्या यह अलग-अलग रोल्स ट्रैक कर सकता है, जैसे सेटअप बनाम चेक-इन?', a: 'हां — अपने प्रॉम्प्ट में रोल्स डिफ़ाइन करें और हर शिफ़्ट को एक ख़ास रोल की ज़रूरत हो सकती है, तो कवरेज व्यू उसी हिसाब से बंटता है जो असल में चाहिए।' },
        { q: 'क्या मैं ग्रांट रिपोर्ट के लिए घंटे एक्सपोर्ट कर सकता हूं?', a: 'वॉलंटियर्स पेज पर एक CSV एक्सपोर्ट मांगें — किसी भी तारीख़ रेंज के लिए प्रति-व्यक्ति कुल घंटे, रिपोर्ट में पेस्ट करने के लिए तैयार।' },
        { q: 'क्या यह शिफ़्ट से पहले रिमाइंडर भेजता है?', a: 'अपने प्रॉम्प्ट में रिमाइंडर ईमेल या नोटिफ़िकेशन जोड़ें, और वॉलंटियर्स को उनकी क्लेम की हुई शिफ़्ट शुरू होने से पहले पिंग किया जाता है।' },
      ],
    },
  },
  kn: {
    'wedding-rsvp-website': {
      h1: 'AI ಮೂಲಕ ಮದುವೆ RSVP ವೆಬ್‌ಸೈಟ್ ರಚಿಸಿ',
      metaTitle: 'AI ಮೂಲಕ RSVP ಜೊತೆ ಮದುವೆ ವೆಬ್‌ಸೈಟ್ ರಚಿಸಿ — ಕೋಡ್ ಇಲ್ಲದೆ',
      metaDesc: 'ನಿಮ್ಮ ಕಥೆ, ವೇಳಾಪಟ್ಟಿ, ಮತ್ತು ಊಟದ ಆಯ್ಕೆಗಳು ಹಾಗೂ ಪ್ಲಸ್-ಒನ್‌ಗಳಿರುವ ನಿಜವಾದ RSVP ವ್ಯವಸ್ಥೆ — ಸರಳ ಇಂಗ್ಲಿಷ್‌ನಿಂದ ಜನರೇಟ್ ಆದ ಮದುವೆ ವೆಬ್‌ಸೈಟ್, ಟೆಂಪ್ಲೇಟ್ ಬಾಡಿಗೆ ಇಲ್ಲ.',
      tagline: 'ನಿಮ್ಮ ಕಥೆ, ನಿಮ್ಮ ವೇಳಾಪಟ್ಟಿ, ಮತ್ತು ತಾನಾಗಿಯೇ ತುಂಬುವ RSVP ಪಟ್ಟಿ — ಸ್ಪ್ರೆಡ್‌ಶೀಟ್ ಮತ್ತು 40 "ಯಾರು ಬರುತ್ತಿದ್ದಾರೆ?" ಸಂದೇಶಗಳ ಬದಲು.',
      body: [
        'ಮದುವೆ ವೆಬ್‌ಸೈಟ್ ಬಿಲ್ಡರ್‌ಗಳು ಒಂದು ಬೆಲೆ ತಂತ್ರವನ್ನು ಪರಿಪೂರ್ಣಗೊಳಿಸಿವೆ: ಸುಂದರ ಪೇಜ್ ಉಚಿತ, ಆದರೆ ನಿಮಗೆ ನಿಜವಾಗಿ ಬೇಕಾದದ್ದು — ಊಟದ ಆಯ್ಕೆಗಳು, ಪ್ಲಸ್-ಒನ್‌ಗಳಿರುವ RSVP ಗಳು, ಮತ್ತು ನೀವು ಕೇಟರರ್‌ಗೆ ಕೊಡಬಹುದಾದ ಅತಿಥಿ ಪಟ್ಟಿ — ಪ್ರೀಮಿಯಂ ಟಿಯರ್ ಹಿಂದೆ ಇರುತ್ತದೆ. ಮತ್ತು ಟೆಂಪ್ಲೇಟ್ ಇನ್ನೂ ನಿಮ್ಮ ಕಸಿನ್‌ನ ಮದುವೆಯಿಂದ ಗುರುತಿಸಬಹುದಾದ ಅದೇ ಒಂದಾಗಿದೆ.',
        'ನಿಮ್ಮ ಮದುವೆಯನ್ನು ವಿವರಿಸಿ — ಸ್ಥಳಗಳು, ದಿನದ ಟೈಮ್‌ಲೈನ್, ಅತಿಥಿಗಳು ಏನು ಆಯ್ಕೆ ಮಾಡಬೇಕು — ಮತ್ತು WyberAi ನಿಜವಾಗಿ ನಿಮ್ಮದೇ ಆದ ಸೈಟ್ ಅನ್ನು ಜನರೇಟ್ ಮಾಡುತ್ತದೆ: ನಿಮ್ಮ ಕಥೆ ನಿಮ್ಮ ರೀತಿಯಲ್ಲಿ ಹೇಳಲ್ಪಟ್ಟಿದೆ, ಮತ್ತು ಅತಿಥಿ ಡೇಟಾಬೇಸ್‌ಗೆ ನೇರವಾಗಿ ಬರೆಯುವ RSVP ಫಾರ್ಮ್. ಡ್ಯಾಶ್‌ಬೋರ್ಡ್ T-ಮೈನಸ್-ಎರಡು-ವಾರಗಳಲ್ಲಿ ಮುಖ್ಯವಾದ ಪ್ರಶ್ನೆಗಳಿಗೆ ಉತ್ತರಿಸುತ್ತದೆ: ಯಾರು ದೃಢಪಡಿಸಿದ್ದಾರೆ, ಎಷ್ಟು ಚಿಕನ್ ವರ್ಸಸ್ ಪನೀರ್, ಯಾವ ಹೊರ-ಊರಿನ ಅತಿಥಿಗಳಿಗೆ ಹೋಟೆಲ್ ಬ್ಲಾಕ್ ಲಿಂಕ್ ಬೇಕು.',
      ],
      features: [
        { title: 'ನಿಜವಾದ ಪ್ರಶ್ನೆಗಳೊಂದಿಗೆ RSVP', desc: 'ಹಾಜರಾಗುವಿಕೆ, ಊಟದ ಆಯ್ಕೆ, ಡಯಟರಿ ಟಿಪ್ಪಣಿಗಳು, ಪ್ಲಸ್-ಒನ್ ಹೆಸರು, ಹಾಡಿನ ವಿನಂತಿ — ನಿಮ್ಮ ಯೋಜನೆಗೆ ಏನು ಬೇಕಾದರೂ, ಪ್ರತಿ-ಅತಿಥಿಗೆ ಸೆರೆಹಿಡಿಯಲಾಗಿದೆ.' },
        { title: 'ಕೇಟರರ್-ಸಿದ್ಧ ಅತಿಥಿ ಡ್ಯಾಶ್‌ಬೋರ್ಡ್', desc: 'ದೃಢಪಡಿಸಿದ ಎಣಿಕೆ, ಊಟದ ಒಟ್ಟು, ಮತ್ತು ಡಯಟರಿ ಫ್ಲ್ಯಾಗ್‌ಗಳು ಒಂದೇ ವ್ಯೂನಲ್ಲಿ — ವೆನ್ಯೂ ಕೇಳಿದಾಗ ರಫ್ತು ಮಾಡಬಹುದು.' },
        { title: 'ನಿಮ್ಮ ದಿನ, ಜೋಡಿಸಲಾಗಿದೆ', desc: 'ಸಮಾರಂಭ, ಸ್ವಾಗತ, ಮೆಹಂದಿ, ಆಫ್ಟರ್-ಪಾರ್ಟಿ — ಪ್ರತಿಯೊಂದೂ ಸಮಯ, ಸ್ಥಳ, ಮ್ಯಾಪ್ ಲಿಂಕ್, ಮತ್ತು ಡ್ರೆಸ್ ಕೋಡ್‌ನೊಂದಿಗೆ.' },
        { title: 'ಆಹ್ವಾನದಿಂದ ಖಾಸಗಿ', desc: 'ಸೈಟ್ ಅನ್ನು ತೆರೆದಿಡಿ, ಅಥವಾ ನಿಮ್ಮ ಆಹ್ವಾನ ಪತ್ರಗಳ ಕೋಡ್ ಹಿಂದೆ RSVP ಯನ್ನು ಗೇಟ್ ಮಾಡಿ.' },
      ],
      promptExample: 'ಮದುವೆ ವೆಬ್‌ಸೈಟ್ ರಚಿಸಿ: ನಮ್ಮ ಹೆಸರುಗಳು, ದಿನಾಂಕ, ಮತ್ತು ಕಥೆಯಿರುವ ಸುಂದರ Home ಪೇಜ್; ಸಮಾರಂಭ ಮತ್ತು ಸ್ವಾಗತ ಸಮಯಗಳು, ಮ್ಯಾಪ್ ಲಿಂಕ್‌ಗಳಿರುವ ಸ್ಥಳಗಳು, ಮತ್ತು ಡ್ರೆಸ್ ಕೋಡ್ ಇರುವ Schedule ಪೇಜ್; ಅತಿಥಿಗಳು ತಮ್ಮ ಆಹ್ವಾನ ಹೆಸರು ನಮೂದಿಸುವ, ಹಾಜರಾಗುವಿಕೆ ಗುರುತಿಸುವ, ಒಂದು ಊಟ ಆಯ್ಕೆ ಮಾಡುವ (ಸಸ್ಯಾಹಾರಿ/ಮಾಂಸಾಹಾರಿ), ಡಯಟರಿ ಟಿಪ್ಪಣಿಗಳು ಮತ್ತು ಪ್ಲಸ್-ಒನ್ ಸೇರಿಸುವ RSVP ಪೇಜ್; ಮತ್ತು ದೃಢಪಡಿಸಿದ ಎಣಿಕೆಗಳು, ಊಟದ ಒಟ್ಟು, ಮತ್ತು ಪೂರ್ಣ ಅತಿಥಿ ಪಟ್ಟಿ ತೋರಿಸುವ ಖಾಸಗಿ Dashboard (ಲಾಗಿನ್).',
      faqs: [
        { q: 'ಅತಿಥಿಗಳು ಒಂದೇ ಬಾರಿಗೆ ತಮ್ಮ ಇಡೀ ಕುಟುಂಬಕ್ಕೆ RSVP ಮಾಡಬಹುದೇ?', a: 'ಹೌದು — ನಿಮ್ಮ ಪ್ರಾಂಪ್ಟ್‌ನಲ್ಲಿ ಆಹ್ವಾನಗಳನ್ನು ಕುಟುಂಬಗಳಾಗಿ ಮಾಡೆಲ್ ಮಾಡಿ ಮತ್ತು ಒಂದು ಸಲ್ಲಿಕೆ ಆಹ್ವಾನದಲ್ಲಿರುವ ಪ್ರತಿ ಹೆಸರನ್ನೂ ದೃಢಪಡಿಸಬಹುದು.' },
        { q: 'ನಾವು ಸೈಟ್ ಅನ್ನು ನಮ್ಮ ಆಹ್ವಾನ ಸೂಟ್‌ಗೆ ಹೊಂದಿಸಬಹುದೇ?', a: 'ನಿಮ್ಮ ಪ್ಯಾಲೆಟ್ ಮತ್ತು ಮೂಡ್ ವಿವರಿಸಿ ("ಡಸ್ಟಿ ರೋಸ್ ಮತ್ತು ಕ್ರೀಮ್, ಸೆರಿಫ್, ಕ್ಯಾಂಡಲ್‌ಲಿಟ್") ಮತ್ತು ಡಿಸೈನ್ ಅದಕ್ಕೆ ಹೊಂದುವಂತೆ ಜನರೇಟ್ ಆಗುತ್ತದೆ — ನಂತರ ಚಾಟ್‌ನಲ್ಲಿ ಪರಿಷ್ಕರಿಸಿ.' },
        { q: 'ourNames.com ನಂತಹ ಕಸ್ಟಮ್ ಡೊಮೇನ್ ಬಗ್ಗೆ ಏನು?', a: 'ಸೈಟ್ ಪ್ರಕಟಿಸಿ ಮತ್ತು ಎಡಿಟರ್‌ನಿಂದ ಕಸ್ಟಮ್ ಡೊಮೇನ್ ಸಂಪರ್ಕಿಸಿ — ಅತಿಥಿಗಳು ಎಂದಿಗೂ ಬಿಲ್ಡರ್ URL ನೋಡುವುದಿಲ್ಲ.' },
        { q: 'ಪ್ರತಿ-ಅತಿಥಿ ಅಥವಾ ಪ್ರೀಮಿಯಂ-ಫೀಚರ್ ಶುಲ್ಕ ಇದೆಯೇ?', a: 'ಇಲ್ಲ — RSVP, ಡ್ಯಾಶ್‌ಬೋರ್ಡ್, ಮತ್ತು ಅತಿಥಿ ಪಟ್ಟಿ ನಿಮ್ಮ ಆ್ಯಪ್‌ನ ಭಾಗಗಳಷ್ಟೇ. ರಚಿಸಲು ಉಚಿತ ಮಾಸಿಕ ಕ್ರೆಡಿಟ್‌ಗಳು ಬಳಕೆಯಾಗುತ್ತವೆ; ಸೈಟ್ ನಿಮ್ಮದಾಗಿದೆ.' },
      ],
    },
    'event-registration-app': {
      h1: 'AI ಮೂಲಕ ಈವೆಂಟ್ ನೋಂದಣಿ ಆ್ಯಪ್ ರಚಿಸಿ',
      metaTitle: 'AI ಮೂಲಕ ಈವೆಂಟ್ ನೋಂದಣಿ ಆ್ಯಪ್ ರಚಿಸಿ — ಕೋಡ್ ಇಲ್ಲದೆ',
      metaDesc: 'ನೋಂದಣಿ ಪೇಜ್‌ಗಳು, ಸಾಮರ್ಥ್ಯ ಮಿತಿಗಳು, ವೇಟ್‌ಲಿಸ್ಟ್‌ಗಳು, ಮತ್ತು ಚೆಕ್-ಇನ್ ವ್ಯೂ — ವಿವರಣೆಯಿಂದ ಜನರೇಟ್ ಆದ ಈವೆಂಟ್ ಸೈನ್‌ಅಪ್ ಸಾಫ್ಟ್‌ವೇರ್, ಪ್ರತಿ-ಟಿಕೆಟ್ ಶುಲ್ಕವಿಲ್ಲದೆ.',
      tagline: 'ನೋಂದಣಿ, ಸಾಮರ್ಥ್ಯ, ವೇಟ್‌ಲಿಸ್ಟ್, ಚೆಕ್-ಇನ್ — ನಿಮ್ಮ ವರ್ಕ್‌ಶಾಪ್ ಅಥವಾ ಮೀಟ್‌ಅಪ್‌ಗೆ ಸಂಪೂರ್ಣ ಸೈನ್‌ಅಪ್ ಪೈಪ್‌ಲೈನ್, ಪ್ರತಿ-ಟಿಕೆಟ್ ಪ್ಲಾಟ್‌ಫಾರ್ಮ್ ಶುಲ್ಕವಿಲ್ಲದೆ.',
      body: [
        'ಉಚಿತ ಈವೆಂಟ್‌ಗಳು ಮತ್ತು ಪೇಡ್ ವರ್ಕ್‌ಶಾಪ್‌ಗಳಿಗೆ ಸಮಾನವಾಗಿ, ಟಿಕೆಟಿಂಗ್ ಪ್ಲಾಟ್‌ಫಾರ್ಮ್‌ಗಳು ಎಕ್ಸ್‌ಚೇಂಜ್‌ಗಳಂತೆ ಶುಲ್ಕ ವಿಧಿಸುತ್ತವೆ: ಪ್ರತಿ-ಟಿಕೆಟ್ ಕಮಿಷನ್, ನಿಮ್ಮ ಅಟೆಂಡೀಗಳು ದೂರುವ ಸೇವಾ ಶುಲ್ಕಗಳು, ಮತ್ತು ನಿಮ್ಮ ಅಟೆಂಡೀ ಪಟ್ಟಿ ಅವರ CRM ನಲ್ಲಿ ಇರುತ್ತದೆ, ನಿಮ್ಮದಲ್ಲ. ಒಂದು ಕಮ್ಯುನಿಟಿ ಮೀಟ್‌ಅಪ್ ಹೆಸರುಗಳನ್ನು ಸಂಗ್ರಹಿಸಲು ಶೇಕಡಾವಾರು ನೀಡಬಾರದು.',
        'ನೋಂದಣಿ ಎಂದರೆ ಒಂದು ಫಾರ್ಮ್, ಒಂದು ಸಾಮರ್ಥ್ಯ ಕೌಂಟರ್, ಮತ್ತು ಒಂದು ಪಟ್ಟಿ — ಅದಕ್ಕಾಗಿಯೇ ಇದು ಇಷ್ಟು ಚೆನ್ನಾಗಿ ಜನರೇಟ್ ಆಗುತ್ತದೆ. ನಿಮ್ಮ ಈವೆಂಟ್ ಮತ್ತು ಪ್ರತಿ-ಅಟೆಂಡೀಗೆ ನೀವು ಏನು ತಿಳಿಯಬೇಕು ಎಂದು ವಿವರಿಸಿ, ಮತ್ತು WyberAi ಪೈಪ್‌ಲೈನ್ ನಿರ್ಮಿಸುತ್ತದೆ: ಸಾಮರ್ಥ್ಯದಲ್ಲಿ ತಾನಾಗಿಯೇ ಮುಚ್ಚುವ ಮತ್ತು ವೇಟ್‌ಲಿಸ್ಟ್ ಪ್ರಾರಂಭಿಸುವ ಸೈನ್‌ಅಪ್ ಪೇಜ್, ಯಾರಾದರೂ ಬಿಟ್ಟಾಗ ಸ್ವಯಂಚಾಲಿತ ಪ್ರಮೋಷನ್, ಮತ್ತು ಫೋನ್‌ನಿಂದ ಕೆಲಸ ಮಾಡುವ ಬಾಗಿಲಿಗೆ ಚೆಕ್-ಇನ್ ವ್ಯೂ. ಒಂದು ಈವೆಂಟ್ ಅಥವಾ ಮಾಸಿಕ ಸರಣಿ ನಡೆಸಿ; ಅಟೆಂಡೀ ಡೇಟಾ ಎರಡೂ ಸಂದರ್ಭದಲ್ಲಿ ನಿಮ್ಮದಾಗಿಯೇ ಉಳಿಯುತ್ತದೆ.',
      ],
      features: [
        { title: 'ನಿಮ್ಮ ಪ್ರಶ್ನೆಗಳೊಂದಿಗೆ ನೋಂದಣಿ', desc: 'ಹೆಸರು ಮತ್ತು ಇಮೇಲ್ ಜೊತೆಗೆ ನಿಮ್ಮ ಈವೆಂಟ್‌ಗೆ ಬೇಕಾದ ಯಾವುದಾದರೂ — ಟಿ-ಶರ್ಟ್ ಗಾತ್ರ, ಅನುಭವ ಮಟ್ಟ, ಡಯಟರಿ ಅಗತ್ಯಗಳು, ಕಂಪನಿ.' },
        { title: 'ಸಾಮರ್ಥ್ಯ + ಆಟೋ-ವೇಟ್‌ಲಿಸ್ಟ್', desc: 'ಸೈನ್‌ಅಪ್‌ಗಳು ನಿಮ್ಮ ಮಿತಿಯಲ್ಲಿ ಮುಚ್ಚುತ್ತವೆ; ನಂತರದ ನೋಂದಣಿದಾರರು ವೇಟ್‌ಲಿಸ್ಟ್‌ಗೆ ಸೇರುತ್ತಾರೆ ಮತ್ತು ಸ್ಥಳಗಳು ಖಾಲಿಯಾದಾಗ ಸ್ವಯಂಚಾಲಿತವಾಗಿ ಪ್ರಮೋಟ್ ಆಗುತ್ತಾರೆ.' },
        { title: 'ಬಾಗಿಲ ಚೆಕ್-ಇನ್ ಮೋಡ್', desc: 'ಈವೆಂಟ್ ದಿನಕ್ಕೆ ವೇಗದ ಸರ್ಚ್-ಅಂಡ್-ಟ್ಯಾಪ್ ಅಟೆಂಡೀ ಪಟ್ಟಿ — ಯಾರು ಬಂದಿದ್ದಾರೆ ಮತ್ತು ಯಾರು ಬಂದಿಲ್ಲ ಎಂದು ಲೈವ್ ನೋಡಿ.' },
        { title: 'ಸರಣಿ-ಸಿದ್ಧ ರಚನೆ', desc: 'ಒಂದೇ ಸೂರಿನ ಕೆಳಗೆ ಪುನರಾವರ್ತಿತ ಈವೆಂಟ್‌ಗಳನ್ನು ನಡೆಸಿ — ಪ್ರತಿಯೊಂದಕ್ಕೂ ತನ್ನದೇ ಪೇಜ್, ಸಾಮರ್ಥ್ಯ, ಮತ್ತು ಅಟೆಂಡೀ ಪಟ್ಟಿ.' },
      ],
      promptExample: 'ಮಾಸಿಕ ಟೆಕ್ ಮೀಟ್‌ಅಪ್‌ಗಾಗಿ ಈವೆಂಟ್ ನೋಂದಣಿ ವೆಬ್ ಆ್ಯಪ್ ರಚಿಸಿ: ಮುಂಬರುವ ಈವೆಂಟ್‌ಗಳ ಪಟ್ಟಿಯಿರುವ ಪಬ್ಲಿಕ್ Events ಪೇಜ್; ವಿವರಣೆ, ಸ್ಥಳ, ದಿನಾಂಕ, ಮತ್ತು 80 ಸಾಮರ್ಥ್ಯ ಜಾರಿಗೊಳಿಸುವ, ತುಂಬಿದಾಗ ವೇಟ್‌ಲಿಸ್ಟ್ ಪ್ರಾರಂಭಿಸುವ, ರದ್ದತಿಗಳಲ್ಲಿ ವೇಟ್‌ಲಿಸ್ಟ್‌ನಿಂದ ಆಟೋ-ಪ್ರಮೋಟ್ ಮಾಡುವ ನೋಂದಣಿ ಫಾರ್ಮ್ (ಹೆಸರು, ಇಮೇಲ್, ಪಾತ್ರ, ಡಯಟರಿ ಆದ್ಯತೆ) ಇರುವ ಪ್ರತಿ ಈವೆಂಟ್ ಪೇಜ್; ಮತ್ತು ಅಟೆಂಡೀ ಪಟ್ಟಿಗಳು, ವೇಟ್‌ಲಿಸ್ಟ್, ಮತ್ತು ಈವೆಂಟ್ ದಿನಕ್ಕೆ ಸರ್ಚ್‌ನೊಂದಿಗೆ ಚೆಕ್-ಇನ್ ಮೋಡ್ ಇರುವ ಆಯೋಜಕ Dashboard.',
      faqs: [
        { q: 'ಇದು ಪೇಡ್ ಟಿಕೆಟ್‌ಗಳನ್ನು ನಿಭಾಯಿಸಬಹುದೇ?', a: 'ಉಚಿತ ನೋಂದಣಿಯಿಂದ ಪ್ರಾರಂಭಿಸಿ ಮತ್ತು ಅಗತ್ಯವಿದ್ದಾಗ ಚಾಟ್‌ನಲ್ಲಿ ಪಾವತಿ ಹಂತ ಸೇರಿಸಿ — ನೋಂದಣಿ ಫ್ಲೋ ಮತ್ತು ಅಟೆಂಡೀ ಪಟ್ಟಿ ಕೆಳಗೆ ಒಂದೇ ಆಗಿ ಉಳಿಯುತ್ತವೆ.' },
        { q: 'ವೇಟ್‌ಲಿಸ್ಟ್ ಪ್ರಮೋಷನ್ ಹೇಗೆ ಕೆಲಸ ಮಾಡುತ್ತದೆ?', a: 'ದೃಢಪಡಿಸಿದ ಅಟೆಂಡೀ ರದ್ದುಗೊಳಿಸಿದಾಗ, ಮೊದಲ ವೇಟ್‌ಲಿಸ್ಟೆಡ್ ವ್ಯಕ್ತಿ ಸ್ವಯಂಚಾಲಿತವಾಗಿ ಪ್ರಮೋಟ್ ಆಗುತ್ತಾರೆ ಮತ್ತು ದೃಢಪಡಿಸಿದ ಪಟ್ಟಿಯಲ್ಲಿ ಕಾಣಿಸುತ್ತಾರೆ — ಯಾವುದೇ ಹಸ್ತಚಾಲಿತ ಬದಲಾವಣೆ ಇಲ್ಲ.' },
        { q: 'ಅಟೆಂಡೀಗಳು ತಮ್ಮ ಸ್ವಂತ ಸ್ಥಳವನ್ನು ರದ್ದುಗೊಳಿಸಬಹುದೇ?', a: 'ಹೌದು — ನಿಮ್ಮ ಪ್ರಾಂಪ್ಟ್‌ನಲ್ಲಿ manage-registration ಲಿಂಕ್ ಕೇಳಿ, ಮತ್ತು ರದ್ದತಿಗಳು ನಿಮಗೆ ಇಮೇಲ್ ಮಾಡದೆ ಸ್ಥಳವನ್ನು ಖಾಲಿ ಮಾಡುತ್ತವೆ (ಮತ್ತು ವೇಟ್‌ಲಿಸ್ಟ್ ಟ್ರಿಗರ್ ಮಾಡುತ್ತವೆ).' },
        { q: 'ಅಟೆಂಡೀ ಡೇಟಾದ ಮಾಲೀಕರು ಯಾರು?', a: 'ನೀವು — ಇದು ನಿಮ್ಮ ಆ್ಯಪ್‌ನ ಸ್ವಂತ ಡೇಟಾಬೇಸ್‌ನಲ್ಲಿ ಇರುತ್ತದೆ, ರೋ-ಲೆವೆಲ್ ಸೆಕ್ಯುರಿಟಿಯಿಂದ ಸುರಕ್ಷಿತವಾಗಿದೆ ಮತ್ತು ಪ್ರಕಟಣೆಗೆ ಮೊದಲು ಸ್ಕ್ಯಾನ್ ಮಾಡಲಾಗಿದೆ. ಯಾವುದೇ ಪ್ಲಾಟ್‌ಫಾರ್ಮ್ ನಿಮ್ಮ ಅಟೆಂಡೀ ಪಟ್ಟಿಯನ್ನು ಮೈನ್ ಮಾಡುತ್ತಿಲ್ಲ.' },
      ],
    },
    'sports-league-manager': {
      h1: 'AI ಮೂಲಕ ಸ್ಪೋರ್ಟ್ಸ್ ಲೀಗ್ ಮ್ಯಾನೇಜ್‌ಮೆಂಟ್ ಆ್ಯಪ್ ರಚಿಸಿ',
      metaTitle: 'AI ಮೂಲಕ ಸ್ಪೋರ್ಟ್ಸ್ ಲೀಗ್ ಮ್ಯಾನೇಜರ್ ರಚಿಸಿ — ಫಿಕ್ಸ್ಚರ್‌ಗಳು ಮತ್ತು ಸ್ಟ್ಯಾಂಡಿಂಗ್‌ಗಳು',
      metaDesc: 'ನಿಮ್ಮ ಸ್ಥಳೀಯ ಲೀಗ್‌ಗಾಗಿ ಫಿಕ್ಸ್ಚರ್‌ಗಳು, ಲೈವ್ ಸ್ಟ್ಯಾಂಡಿಂಗ್‌ಗಳು, ಮತ್ತು ತಂಡದ ಪಟ್ಟಿಗಳು — ಸರಳ ಇಂಗ್ಲಿಷ್ ವಿವರಣೆಯಿಂದ ಜನರೇಟ್. ಸ್ಪ್ರೆಡ್‌ಶೀಟ್ ಇಲ್ಲ, ಲೀಗ್-ಸಾಫ್ಟ್‌ವೇರ್ ಶುಲ್ಕ ಇಲ್ಲ.',
      tagline: 'ಫಿಕ್ಸ್ಚರ್‌ಗಳು ಪ್ರಕಟಿಸಲಾಗಿದೆ, ಫಲಿತಾಂಶಗಳು ಬಂದಿವೆ, ಟೇಬಲ್ ತಾನಾಗಿಯೇ ಅಪ್‌ಡೇಟ್ ಆಗುತ್ತದೆ — ಮತ್ತು WhatsApp ಗುಂಪು ಯಾರ ಸ್ಪ್ರೆಡ್‌ಶೀಟ್ ಸರಿ ಎಂಬುದರ ಬಗ್ಗೆ ಅಲ್ಲ, ಫಾರ್ಮ್ ಬಗ್ಗೆ ವಾದಿಸುತ್ತದೆ.',
      body: [
        'ಪ್ರತಿ ಸ್ಥಳೀಯ ಲೀಗ್ — ಫೈವ್-ಎ-ಸೈಡ್ ಫುಟ್‌ಬಾಲ್, ಬಾಕ್ಸ್ ಕ್ರಿಕೆಟ್, ಆಫೀಸ್ ಬ್ಯಾಡ್ಮಿಂಟನ್ — ಒಂದೇ ದುರ್ಬಲ ಸ್ಟ್ಯಾಕ್‌ನಲ್ಲಿ ಚಲಿಸುತ್ತದೆ: ಒಬ್ಬ ಸ್ವಯಂಸೇವಕ, ಒಂದು ಸ್ಪ್ರೆಡ್‌ಶೀಟ್, ಮತ್ತು ಫಿಕ್ಸ್ಚರ್ ಪಟ್ಟಿ ನಲವತ್ತು ಸಂದೇಶಗಳಲ್ಲಿ ಹೂತುಹೋಗುವ WhatsApp ಗುಂಪು. ಸ್ವಯಂಸೇವಕ ಪ್ರಯಾಣಿಸಿದ ಕ್ಷಣ, ಸ್ಟ್ಯಾಂಡಿಂಗ್‌ಗಳು ವಿಶ್ವಾಸಾರ್ಹವಾಗಿ ಉಳಿಯುವುದಿಲ್ಲ.',
        'ಲೀಗ್ ಆ್ಯಪ್ ಎಂದರೆ ಸ್ಟ್ಯಾಂಡಿಂಗ್ಸ್ ಗಣಿತ ಮತ್ತು ಒಂದು ವೇಳಾಪಟ್ಟಿ, ಮತ್ತು ಜನರೇಟ್ ಮಾಡಲು ಇದೊಂದು ಸ್ವಚ್ಛ ವಿಷಯ. WyberAi ಗೆ ನಿಮ್ಮ ಫಾರ್ಮ್ಯಾಟ್ ಹೇಳಿ — ತಂಡಗಳು, ಸುತ್ತುಗಳು, ಪಾಯಿಂಟ್ ನಿಯಮಗಳು, ಟೈ-ಬ್ರೇಕರ್‌ಗಳು — ಮತ್ತು ಅದು ಪಬ್ಲಿಕ್ ಲೀಗ್ ಸೈಟ್ ನಿರ್ಮಿಸುತ್ತದೆ: ಸುತ್ತಿನ ಪ್ರಕಾರ ಫಿಕ್ಸ್ಚರ್‌ಗಳು, ಫಲಿತಾಂಶ ಬಂದ ತಕ್ಷಣ ಮರುಲೆಕ್ಕಾಚಾರ ಮಾಡುವ ಟೇಬಲ್, ಮತ್ತು ಪಟ್ಟಿಗಳು ಹಾಗೂ ಫಾರ್ಮ್ ಇರುವ ತಂಡ ಪೇಜ್‌ಗಳು. ಅಡ್ಮಿನ್ ಒಂದು ಸ್ಕೋರ್ ಟೈಪ್ ಮಾಡುತ್ತಾರೆ; ಅದರಾಚೆಗಿನ ಎಲ್ಲವೂ ತಾನಾಗಿಯೇ ಅಪ್‌ಡೇಟ್ ಆಗುತ್ತದೆ.',
      ],
      features: [
        { title: 'ಫಿಕ್ಸ್ಚರ್ ಸುತ್ತುಗಳು', desc: 'ಸೀಸನ್‌ನ ವೇಳಾಪಟ್ಟಿ ಸುತ್ತು ಅಥವಾ ವಾರದ ಪ್ರಕಾರ ಜೋಡಿಸಲಾಗಿದೆ — ಪ್ರತಿ ಮ್ಯಾಚ್‌ಗೆ ತಂಡಗಳು, ಸಮಯ, ಮತ್ತು ಸ್ಥಳ.' },
        { title: 'ತಾನಾಗಿಯೇ-ಅಪ್‌ಡೇಟ್ ಆಗುವ ಸ್ಟ್ಯಾಂಡಿಂಗ್‌ಗಳು', desc: 'ಫಲಿತಾಂಶಗಳು ಬಂದ ಕ್ಷಣ ಪಾಯಿಂಟ್‌ಗಳು, ಗೋಲ್ ವ್ಯತ್ಯಾಸ, ಮತ್ತು ನಿಮ್ಮ ಟೈ-ಬ್ರೇಕರ್ ನಿಯಮಗಳು ಸ್ವಯಂಚಾಲಿತವಾಗಿ ಅನ್ವಯಿಸುತ್ತವೆ.' },
        { title: 'ತಂಡ ಪೇಜ್‌ಗಳು ಮತ್ತು ಪಟ್ಟಿಗಳು', desc: 'ಪ್ರತಿ ತಂಡ ತನ್ನ ಸ್ಕ್ವಾಡ್, ಫಲಿತಾಂಶಗಳು, ಮತ್ತು ಇತ್ತೀಚಿನ ಫಾರ್ಮ್‌ನೊಂದಿಗೆ — ಆಟಗಾರರು ನಿಜವಾಗಿ ಪರಿಶೀಲಿಸುವ ಪೇಜ್.' },
        { title: 'ಒಂದು-ಅಡ್ಮಿನ್ ಫಲಿತಾಂಶ ಎಂಟ್ರಿ', desc: 'ಆಯೋಜಕರಿಗೆ ಸಂರಕ್ಷಿತ ಫಲಿತಾಂಶ ಫಾರ್ಮ್; ಉಳಿದೆಲ್ಲರಿಗೂ ಯಾವಾಗಲೂ ಪ್ರಸ್ತುತವಾಗಿರುವ ರೀಡ್-ಓನ್ಲಿ ಲೀಗ್ ಸಿಗುತ್ತದೆ.' },
      ],
      promptExample: '8-ತಂಡಗಳ ಫೈವ್-ಎ-ಸೈಡ್ ಫುಟ್‌ಬಾಲ್ ಲೀಗ್‌ಗಾಗಿ ಸ್ಪೋರ್ಟ್ಸ್ ಲೀಗ್ ವೆಬ್ ಆ್ಯಪ್ ರಚಿಸಿ: ಪಬ್ಲಿಕ್ Standings ಪೇಜ್ (ಗೆಲುವಿಗೆ 3 ಪಾಯಿಂಟ್‌ಗಳು, ಡ್ರಾಗೆ 1, ಮೊದಲು ಪಾಯಿಂಟ್‌ಗಳು ನಂತರ ಗೋಲ್ ವ್ಯತ್ಯಾಸದಿಂದ ಶ್ರೇಣಿ); ಸುತ್ತಿನ ಪ್ರಕಾರ ಗುಂಪುಗೊಳಿಸಿದ, ಆಡಿದಂತೆ ಫಲಿತಾಂಶಗಳು ತುಂಬಿದ ದಿನಾಂಕ, ಸಮಯ, ಮತ್ತು ಸ್ಥಳ ತೋರಿಸುವ Fixtures ಪೇಜ್; ಪಟ್ಟಿ ಮತ್ತು ಕೊನೆಯ-5 ಫಾರ್ಮ್ ಇರುವ ತಂಡ ಪೇಜ್‌ಗಳು; ಮತ್ತು ನಾನು ಸ್ಕೋರ್‌ಗಳನ್ನು ನಮೂದಿಸುವ ಮತ್ತು ಟೇಬಲ್ ಸ್ವಯಂಚಾಲಿತವಾಗಿ ಅಪ್‌ಡೇಟ್ ಆಗುವ ಅಡ್ಮಿನ್-ಮಾತ್ರ Results ಪೇಜ್.',
      faqs: [
        { q: 'ಇದು ನನಗಾಗಿ ಫಿಕ್ಸ್ಚರ್ ಪಟ್ಟಿಯನ್ನು ಜನರೇಟ್ ಮಾಡಬಹುದೇ?', a: 'ಹೌದು — ನಿಮ್ಮ ಪ್ರಾಂಪ್ಟ್‌ನಲ್ಲಿ "ಡಬಲ್ ರೌಂಡ್-ರಾಬಿನ್ ವೇಳಾಪಟ್ಟಿ ಜನರೇಟ್ ಮಾಡಿ" ಎಂದು ಹೇಳಿ ಮತ್ತು ಪ್ರತಿ ತಂಡ ಪ್ರತಿ ತಂಡವನ್ನು ಹೋಮ್ ಮತ್ತು ಎವೇ ಆಡುತ್ತದೆ, ನಿಮ್ಮ ಸೀಸನ್ ದಿನಾಂಕಗಳಲ್ಲಿ ಹರಡಿಕೊಂಡಿದೆ.' },
        { q: 'ನಾಕೌಟ್ ಹಂತಗಳು ಅಥವಾ ಪ್ಲೇಆಫ್‌ಗಳ ಬಗ್ಗೆ ಏನು?', a: 'ಫಾರ್ಮ್ಯಾಟ್ ವಿವರಿಸಿ — ಟಾಪ್ ಫೋರ್ ಟು ಸೆಮಿಫೈನಲ್ಸ್, ಒಂದು ಕಪ್ ಬ್ರಾಕೆಟ್ — ಮತ್ತು ಗುಂಪು ಹಂತ ಮುಗಿದಾಗ ನಾಕೌಟ್ ರಚನೆ ಸೇರಿಸಲು ಚಾಟ್‌ಗೆ ಕೇಳಿ.' },
        { q: 'ಆಟಗಾರರು ಲಾಗಿನ್ ಮಾಡದೆ ಸ್ಕೋರ್‌ಗಳನ್ನು ಪರಿಶೀಲಿಸಬಹುದೇ?', a: 'ಹೌದು — ಲೀಗ್ ಸೈಟ್ ಡೀಫಾಲ್ಟ್ ಆಗಿ ಪಬ್ಲಿಕ್ ಮತ್ತು ರೀಡ್-ಓನ್ಲಿ ಆಗಿದೆ; ಕೇವಲ ಫಲಿತಾಂಶ ಎಂಟ್ರಿ ಅಡ್ಮಿನ್ ಲಾಗಿನ್ ಹಿಂದೆ ಇರುತ್ತದೆ.' },
        { q: 'ಇದು ಕ್ರಿಕೆಟ್, ಬ್ಯಾಸ್ಕೆಟ್‌ಬಾಲ್, ಅಥವಾ ಬ್ಯಾಡ್ಮಿಂಟನ್‌ಗೆ ಕೆಲಸ ಮಾಡುತ್ತದೆಯೇ?', a: 'ರಚನೆ — ತಂಡಗಳು, ಫಿಕ್ಸ್ಚರ್‌ಗಳು, ಫಲಿತಾಂಶಗಳು, ಪಾಯಿಂಟ್ ನಿಯಮಗಳು — ಕ್ರೀಡೆ-ಅಜ್ಞೇಯವಾದಿಯಾಗಿದೆ. ನಿಮ್ಮ ಕ್ರೀಡೆಯ ಸ್ಕೋರಿಂಗ್ ವಿವರಿಸಿ ಮತ್ತು ಸ್ಟ್ಯಾಂಡಿಂಗ್ಸ್ ಗಣಿತ ಅದನ್ನು ಅನುಸರಿಸುತ್ತದೆ.' },
      ],
    },
    'volunteer-management-app': {
      h1: 'AI ಮೂಲಕ ಸ್ವಯಂಸೇವಕ ನಿರ್ವಹಣಾ ಆ್ಯಪ್ ರಚಿಸಿ',
      metaTitle: 'AI ಮೂಲಕ ಸ್ವಯಂಸೇವಕ ನಿರ್ವಹಣಾ ಆ್ಯಪ್ ರಚಿಸಿ',
      metaDesc: 'ನಿಮ್ಮ ಎನ್‌ಜಿಒಗಾಗಿ ಶಿಫ್ಟ್ ಸೈನ್-ಅಪ್‌ಗಳು, ಸ್ವಯಂಸೇವಕ ಗಂಟೆಗಳು, ಮತ್ತು ಪಾತ್ರ ನಿಯೋಜನೆಗಳು — ಸರಳ ಇಂಗ್ಲಿಷ್‌ನಿಂದ ಜನರೇಟ್ ಆದ ಸ್ವಯಂಸೇವಕ ಆ್ಯಪ್, ಪ್ರಾರಂಭಿಸಲು ಉಚಿತ.',
      tagline: 'ಸ್ವಯಂಸೇವಕರು ಒಂದು ಶಿಫ್ಟ್ ಆಯ್ಕೆ ಮಾಡುತ್ತಾರೆ, ಯಾರು ಕವರ್ ಆಗಿದ್ದಾರೆ ಯಾರು ಇಲ್ಲ ಎಂದು ನೀವು ನೋಡುತ್ತೀರಿ — ಇಮೇಲ್ ಮಾಡಿದ ಸೈನ್-ಅಪ್ ಶೀಟ್ ಬದಲು ಎಂದಿಗೂ ಸರಿಯಾಗಿ ಸಮನ್ವಯಗೊಳ್ಳದೆ.',
      body: [
        'ಎನ್‌ಜಿಒಗಳು ಮತ್ತು ಕಮ್ಯುನಿಟಿ ಸಂಸ್ಥೆಗಳು ಏನಿದೆಯೋ ಅದರ ಮೇಲೆ ಸ್ವಯಂಸೇವಕ ಶೆಡ್ಯೂಲಿಂಗ್ ನಡೆಸುತ್ತವೆ: ಹಂಚಿದ ಸ್ಪ್ರೆಡ್‌ಶೀಟ್, ಫ್ರಂಟ್ ಡೆಸ್ಕ್‌ನಲ್ಲಿ ಪೇಪರ್ ಸೈನ್-ಅಪ್ ಶೀಟ್, ಯಾರು ನಿಜವಾಗಿ ದೃಢಪಡಿಸಿದ್ದಾರೆ ಎಂಬುದನ್ನು ಟ್ರ್ಯಾಕ್ ಕಳೆದುಕೊಳ್ಳುವ ಗುಂಪು ಟೆಕ್ಸ್ಟ್. ಒಂದು ಈವೆಂಟ್‌ಗೆ ಹನ್ನೆರಡು ಜನ ಬೇಕಾಗಿ ಕೇವಲ ಏಳು ಮಂದಿ ಬರುವವರೆಗೆ ಇದು ಕೆಲಸ ಮಾಡುತ್ತದೆ, ಏಕೆಂದರೆ ಅಂತರಗಳ ಸ್ಪಷ್ಟ ವ್ಯೂ ಯಾರಿಗೂ ಇರಲಿಲ್ಲ.',
        'ನಿಮ್ಮ ಸಂಸ್ಥೆಯ ಶಿಫ್ಟ್‌ಗಳು ಮತ್ತು ಪಾತ್ರಗಳನ್ನು ವಿವರಿಸಿ, ಮತ್ತು WyberAi ಸಮನ್ವಯ ಪದರವನ್ನು ನಿರ್ಮಿಸುತ್ತದೆ: ಸ್ವಯಂಸೇವಕರು ಸ್ವತಃ ಕ್ಲೈಮ್ ಮಾಡಬಹುದಾದ ಪಬ್ಲಿಕ್ ಶಿಫ್ಟ್ ಬೋರ್ಡ್, ಗುರುತಿಸುವಿಕೆ ಅಥವಾ ಗ್ರಾಂಟ್ ವರದಿಗಾಗಿ ಪ್ರತಿ-ಸ್ವಯಂಸೇವಕ ಲಾಗ್ ಆದ ಗಂಟೆಗಳನ್ನು ಟ್ರ್ಯಾಕ್ ಮಾಡುವ ಪಟ್ಟಿ, ಮತ್ತು ಈವೆಂಟ್‌ಗೆ ಮೊದಲು, ನಂತರ ಅಲ್ಲ, ಯಾವ ಶಿಫ್ಟ್‌ಗಳಿಗೆ ಇನ್ನೂ ಸಿಬ್ಬಂದಿ ಕೊರತೆ ಇದೆ ಎಂದು ನಿಖರವಾಗಿ ತೋರಿಸುವ ಅಡ್ಮಿನ್ ವ್ಯೂ.',
      ],
      features: [
        { title: 'ಪಬ್ಲಿಕ್ ಶಿಫ್ಟ್ ಬೋರ್ಡ್', desc: 'ಸ್ವಯಂಸೇವಕರು ದಿನಾಂಕ ಮತ್ತು ಪಾತ್ರದ ಪ್ರಕಾರ ತೆರೆದ ಶಿಫ್ಟ್‌ಗಳನ್ನು ಬ್ರೌಸ್ ಮಾಡುತ್ತಾರೆ, ಮತ್ತು ನೇರವಾಗಿ ಒಂದನ್ನು ಕ್ಲೈಮ್ ಮಾಡುತ್ತಾರೆ — ದೃಢೀಕರಿಸಲು ಯಾವುದೇ ಇಮೇಲ್ ಹಿಂದೆ-ಮುಂದೆ ಇಲ್ಲ.' },
        { title: 'ಸ್ವಯಂಸೇವಕ ಪಟ್ಟಿ', desc: 'ಪ್ರತಿ ಸ್ವಯಂಸೇವಕ, ಕಾಂಟ್ಯಾಕ್ಟ್ ಮಾಹಿತಿ, ಅವರು ತರಬೇತಿ ಪಡೆದ ಪಾತ್ರಗಳು, ಮತ್ತು ಕಾಲಾನಂತರ ಒಟ್ಟು ಲಾಗ್ ಆದ ಗಂಟೆಗಳೊಂದಿಗೆ.' },
        { title: 'ಆಯೋಜಕರಿಗೆ ಕವರೇಜ್ ವ್ಯೂ', desc: 'ದಿನ ಬರುವ ಮೊದಲು, ಯಾವ ಶಿಫ್ಟ್‌ಗಳಿಗೆ ಪೂರ್ಣ ಸಿಬ್ಬಂದಿ ಇದೆ ಮತ್ತು ಯಾವುದಕ್ಕೆ ಇನ್ನೂ ಕೈಗಳು ಬೇಕು ಎಂದು ಒಂದೇ ನೋಟದಲ್ಲಿ ನೋಡಿ.' },
        { title: 'ವರದಿಗಾಗಿ ಲಾಗ್ ಆದ ಗಂಟೆಗಳು', desc: 'ಪೂರ್ಣಗೊಂಡ ಶಿಫ್ಟ್‌ಗಳು ಸ್ವಯಂಸೇವಕನ ಗಂಟೆಗಳ ಒಟ್ಟಿಗೆ ಸೇರುತ್ತವೆ — ಗುರುತಿಸುವಿಕೆ, ಶಾಲಾ ಕ್ರೆಡಿಟ್, ಅಥವಾ ಗ್ರಾಂಟ್ ಅರ್ಜಿಗಳಿಗೆ ಉಪಯುಕ್ತ.' },
      ],
      promptExample: 'ಸ್ವಯಂಸೇವಕ ನಿರ್ವಹಣಾ ವೆಬ್ ಆ್ಯಪ್ ರಚಿಸಿ: ಕ್ಲೈಮ್ ಬಟನ್ (ಸ್ವಯಂಸೇವಕ ಹೆಸರು ಮತ್ತು ಇಮೇಲ್ ನಮೂದಿಸುತ್ತಾರೆ) ಜೊತೆಗೆ ದಿನಾಂಕ ಮತ್ತು ಪಾತ್ರದ ಪ್ರಕಾರ ತೆರೆದ ಶಿಫ್ಟ್‌ಗಳ ಪಟ್ಟಿಯಿರುವ ಪಬ್ಲಿಕ್ Shifts ಪೇಜ್; ಒಟ್ಟು ಲಾಗ್ ಆದ ಗಂಟೆಗಳು ಮತ್ತು ಅವರು ಮಾಡಿದ ಪಾತ್ರಗಳೊಂದಿಗೆ ಎಲ್ಲರ ಪಟ್ಟಿಯಿರುವ Volunteers ಪೇಜ್ (ಅಡ್ಮಿನ್); ಮತ್ತು ಪ್ರತಿ ಮುಂಬರುವ ಶಿಫ್ಟ್‌ನ ತುಂಬಿದ ವರ್ಸಸ್ ಅಗತ್ಯವಿರುವ ಸ್ವಯಂಸೇವಕ ಎಣಿಕೆಯನ್ನು ತೋರಿಸುವ, ಸಿಬ್ಬಂದಿ ಕೊರತೆಯಿರುವ ಯಾವುದನ್ನಾದರೂ ಹೈಲೈಟ್ ಮಾಡುವ Coverage Dashboard.',
      faqs: [
        { q: 'ಸ್ವಯಂಸೇವಕರು ತಾವು ಕ್ಲೈಮ್ ಮಾಡಿದ ಶಿಫ್ಟ್ ಅನ್ನು ರದ್ದುಗೊಳಿಸಬಹುದೇ?', a: 'ಹೌದು — ನಿಮ್ಮ ಪ್ರಾಂಪ್ಟ್‌ನಲ್ಲಿ cancel-my-shift ಲಿಂಕ್ ಕೇಳಿ, ಇದು ಪಬ್ಲಿಕ್ ಬೋರ್ಡ್‌ನಲ್ಲಿ ಸ್ಲಾಟ್ ಅನ್ನು ತಕ್ಷಣ ಮತ್ತೆ ತೆರೆಯುತ್ತದೆ.' },
        { q: 'ಇದು ಸೆಟಪ್ ವರ್ಸಸ್ ಚೆಕ್-ಇನ್‌ನಂತಹ ವಿಭಿನ್ನ ಪಾತ್ರಗಳನ್ನು ಟ್ರ್ಯಾಕ್ ಮಾಡಬಹುದೇ?', a: 'ಹೌದು — ನಿಮ್ಮ ಪ್ರಾಂಪ್ಟ್‌ನಲ್ಲಿ ಪಾತ್ರಗಳನ್ನು ವ್ಯಾಖ್ಯಾನಿಸಿ ಮತ್ತು ಪ್ರತಿ ಶಿಫ್ಟ್‌ಗೆ ಒಂದು ನಿರ್ದಿಷ್ಟ ಪಾತ್ರ ಬೇಕಾಗಬಹುದು, ಆದ್ದರಿಂದ ಕವರೇಜ್ ವ್ಯೂ ನಿಜವಾಗಿ ಅಗತ್ಯವಿರುವ ಪ್ರಕಾರ ವಿಭಜಿಸುತ್ತದೆ.' },
        { q: 'ನಾನು ಗ್ರಾಂಟ್ ವರದಿಗಾಗಿ ಗಂಟೆಗಳನ್ನು ರಫ್ತು ಮಾಡಬಹುದೇ?', a: 'ಸ್ವಯಂಸೇವಕರ ಪೇಜ್‌ನಲ್ಲಿ CSV ರಫ್ತು ಕೇಳಿ — ಯಾವುದೇ ದಿನಾಂಕ ವ್ಯಾಪ್ತಿಗೆ ಪ್ರತಿ-ವ್ಯಕ್ತಿ ಒಟ್ಟು ಗಂಟೆಗಳು, ವರದಿಗೆ ಪೇಸ್ಟ್ ಮಾಡಲು ಸಿದ್ಧ.' },
        { q: 'ಇದು ಶಿಫ್ಟ್‌ಗೆ ಮೊದಲು ಜ್ಞಾಪನೆಗಳನ್ನು ಕಳುಹಿಸುತ್ತದೆಯೇ?', a: 'ನಿಮ್ಮ ಪ್ರಾಂಪ್ಟ್‌ನಲ್ಲಿ ಜ್ಞಾಪನೆ ಇಮೇಲ್‌ಗಳು ಅಥವಾ ಅಧಿಸೂಚನೆಗಳನ್ನು ಸೇರಿಸಿ, ಮತ್ತು ಸ್ವಯಂಸೇವಕರಿಗೆ ಅವರ ಕ್ಲೈಮ್ ಮಾಡಿದ ಶಿಫ್ಟ್ ಪ್ರಾರಂಭವಾಗುವ ಮೊದಲು ಪಿಂಗ್ ಮಾಡಲಾಗುತ್ತದೆ.' },
      ],
    },
  },
  te: {
    'wedding-rsvp-website': {
      h1: 'AIతో వెడ్డింగ్ RSVP వెబ్‌సైట్ నిర్మించండి',
      metaTitle: 'AIతో RSVPతో వెడ్డింగ్ వెబ్‌సైట్ నిర్మించండి — కోడ్ లేకుండా',
      metaDesc: 'మీ కథ, షెడ్యూల్, మరియు భోజన ఎంపికలు మరియు ప్లస్-వన్‌లతో నిజమైన RSVP వ్యవస్థ — సాదా ఇంగ్లీష్ నుండి జనరేట్ చేయబడిన వెడ్డింగ్ వెబ్‌సైట్, టెంప్లేట్ అద్దె లేదు.',
      tagline: 'మీ కథ, మీ షెడ్యూల్, మరియు స్వయంగా నింపుకునే RSVP జాబితా — స్ప్రెడ్‌షీట్ మరియు 40 "ఎవరు వస్తున్నారు?" మెసేజీలకు బదులుగా.',
      body: [
        'వెడ్డింగ్ వెబ్‌సైట్ బిల్డర్లు ఒక ధర ఉపాయాన్ని పరిపూర్ణం చేశారు: అందమైన పేజీ ఉచితం, కానీ మీకు నిజంగా కావలసినది — భోజన ఎంపికలు, ప్లస్-వన్‌లతో RSVPలు, మరియు మీరు క్యాటరర్‌కు ఇవ్వగల అతిథి జాబితా — ప్రీమియం టైర్ వెనుక ఉంటుంది. మరియు టెంప్లేట్ ఇప్పటికీ మీ కజిన్ పెళ్ళి నుండి గుర్తించదగినదిగానే ఉంటుంది.',
        'మీ పెళ్ళిని వివరించండి — వేదికలు, రోజు యొక్క టైమ్‌లైన్, అతిథులు ఏమి ఎంచుకోవాలి — మరియు WyberAi నిజంగా మీదైన సైట్‌ను జనరేట్ చేస్తుంది: మీ కథ మీ విధంగా చెప్పబడింది, మరియు నేరుగా అతిథి డేటాబేస్‌లోకి రాసే RSVP ఫారమ్. టి-మైనస్-రెండు-వారాలలో ముఖ్యమైన ప్రశ్నలకు డాష్‌బోర్డ్ సమాధానం ఇస్తుంది: ఎవరు నిర్ధారించారు, ఎన్ని చికెన్ వర్సెస్ పనీర్, ఏ ఊరి-బయటి అతిథులకు హోటల్ బ్లాక్ లింక్ కావాలి.',
      ],
      features: [
        { title: 'నిజమైన ప్రశ్నలతో RSVP', desc: 'హాజరు, భోజన ఎంపిక, డైటరీ గమనికలు, ప్లస్-వన్ పేరు, పాట అభ్యర్థన — మీ ప్రణాళికకు కావలసినది ఏదైనా, ప్రతి-అతిథికి సంగ్రహించబడింది.' },
        { title: 'క్యాటరర్-సిద్ధమైన అతిథి డాష్‌బోర్డ్', desc: 'నిర్ధారించిన సంఖ్య, భోజన మొత్తాలు, మరియు డైటరీ ఫ్లాగ్‌లు ఒకే వ్యూలో — వేదిక అడిగినప్పుడు ఎగుమతి చేయదగినది.' },
        { title: 'మీ రోజు, అమర్చబడింది', desc: 'వేడుక, స్వాగత సత్కారం, మెహందీ, ఆఫ్టర్-పార్టీ — ప్రతి ఒక్కటి సమయం, వేదిక, మ్యాప్ లింక్, మరియు డ్రెస్ కోడ్‌తో.' },
        { title: 'ఆహ్వానం ద్వారా ప్రైవేట్', desc: 'సైట్‌ను తెరిచి ఉంచండి, లేదా మీ ఆహ్వాన కార్డుల నుండి కోడ్ వెనుక RSVPని గేట్ చేయండి.' },
      ],
      promptExample: 'వెడ్డింగ్ వెబ్‌సైట్‌ను నిర్మించండి: మా పేర్లు, తేదీ, మరియు కథతో ఒక అందమైన Home పేజీ; వేడుక మరియు స్వాగత సత్కార సమయాలు, మ్యాప్ లింక్‌లతో వేదికలు, మరియు డ్రెస్ కోడ్‌తో Schedule పేజీ; అతిథులు తమ ఆహ్వాన పేరును నమోదు చేసే, హాజరు కాదా అని గుర్తించే, ఒక భోజనం ఎంచుకునే (వెజ్/నాన్-వెజ్), డైటరీ గమనికలు మరియు ప్లస్-వన్ జోడించే RSVP పేజీ; మరియు నిర్ధారిత సంఖ్యలు, భోజన మొత్తాలు, మరియు పూర్తి అతిథి జాబితాను చూపే ప్రైవేట్ Dashboard (లాగిన్).',
      faqs: [
        { q: 'అతిథులు తమ మొత్తం కుటుంబం కోసం ఒకేసారి RSVP చేయవచ్చా?', a: 'అవును — మీ ప్రాంప్ట్‌లో ఆహ్వానాలను కుటుంబాలుగా మోడల్ చేయండి మరియు ఒక సమర్పణ ఆహ్వానంలోని ప్రతి పేరును నిర్ధారించగలదు.' },
        { q: 'మేము సైట్‌ను మా ఆహ్వాన సూట్‌కు సరిపోల్చవచ్చా?', a: 'మీ పాలెట్ మరియు మూడ్‌ను వివరించండి ("డస్టీ రోజ్ మరియు క్రీమ్, సెరిఫ్, కొవ్వొత్తి వెలుగు") మరియు డిజైన్ దానికి సరిపోయేలా జనరేట్ అవుతుంది — తర్వాత చాట్‌లో మెరుగుపరచండి.' },
        { q: 'ourNames.com వంటి కస్టమ్ డొమైన్ గురించి ఏమిటి?', a: 'సైట్‌ను ప్రచురించండి మరియు ఎడిటర్ నుండి కస్టమ్ డొమైన్‌ను కనెక్ట్ చేయండి — అతిథులు ఎప్పుడూ బిల్డర్ URLని చూడరు.' },
        { q: 'ప్రతి-అతిథి లేదా ప్రీమియం-ఫీచర్ రుసుము ఉందా?', a: 'లేదు — RSVP, డాష్‌బోర్డ్, మరియు అతిథి జాబితా మీ యాప్‌లో భాగాలు మాత్రమే. నిర్మించడానికి ఉచిత నెలవారీ క్రెడిట్‌లు ఉపయోగించబడతాయి; సైట్ మీదే.' },
      ],
    },
    'event-registration-app': {
      h1: 'AIతో ఈవెంట్ రిజిస్ట్రేషన్ యాప్‌ను నిర్మించండి',
      metaTitle: 'AIతో ఈవెంట్ రిజిస్ట్రేషన్ యాప్‌ను నిర్మించండి — కోడ్ లేకుండా',
      metaDesc: 'రిజిస్ట్రేషన్ పేజీలు, కెపాసిటీ పరిమితులు, వెయిట్‌లిస్ట్‌లు, మరియు చెక్-ఇన్ వ్యూ — వివరణ నుండి జనరేట్ చేయబడిన ఈవెంట్ సైన్అప్ సాఫ్ట్‌వేర్, ప్రతి-టికెట్ రుసుములు లేకుండా.',
      tagline: 'రిజిస్ట్రేషన్, కెపాసిటీ, వెయిట్‌లిస్ట్, చెక్-ఇన్ — మీ వర్క్‌షాప్ లేదా మీట్అప్ కోసం మొత్తం సైన్అప్ పైప్‌లైన్, ప్రతి-టికెట్ ప్లాట్‌ఫారమ్ రుసుము లేకుండా.',
      body: [
        'ఉచిత ఈవెంట్‌లకు మరియు చెల్లింపు వర్క్‌షాప్‌లకు సమానంగా, టికెటింగ్ ప్లాట్‌ఫారమ్‌లు మారకాల్లా ఛార్జ్ చేస్తాయి: ప్రతి-టికెట్ కమీషన్, మీ హాజరైనవారు గొణుక్కునే సర్వీస్ ఫీజులు, మరియు మీ హాజరైనవారి జాబితా వారి CRMలో ఉంటుంది, మీది కాదు. ఒక కమ్యూనిటీ మీట్అప్ పేర్లను సేకరించడానికి శాతం ఇవ్వకూడదు.',
        'రిజిస్ట్రేషన్ అంటే ఒక ఫారమ్, ఒక కెపాసిటీ కౌంటర్, మరియు ఒక జాబితా — అందుకే ఇది చాలా బాగా జనరేట్ అవుతుంది. మీ ఈవెంట్‌ను మరియు ప్రతి-హాజరైనవారి గురించి మీరు ఏమి తెలుసుకోవాలో వివరించండి, మరియు WyberAi పైప్‌లైన్‌ను నిర్మిస్తుంది: కెపాసిటీ వద్ద స్వయంగా మూసుకుని వెయిట్‌లిస్ట్‌ను ప్రారంభించే సైన్అప్ పేజీ, ఎవరైనా వైదొలిగినప్పుడు స్వయంచాలక ప్రమోషన్, మరియు ఫోన్ నుండి పనిచేసే తలుపు కోసం చెక్-ఇన్ వ్యూ. ఒక ఈవెంట్ లేదా నెలవారీ సిరీస్‌ను నడపండి; హాజరైనవారి డేటా రెండు సందర్భాల్లోనూ మీదిగానే ఉంటుంది.',
      ],
      features: [
        { title: 'మీ ప్రశ్నలతో రిజిస్ట్రేషన్', desc: 'పేరు మరియు ఇమెయిల్‌తో పాటు మీ ఈవెంట్‌కు కావలసినది ఏదైనా — టీ-షర్ట్ సైజు, అనుభవ స్థాయి, డైటరీ అవసరాలు, కంపెనీ.' },
        { title: 'కెపాసిటీ + ఆటో-వెయిట్‌లిస్ట్', desc: 'సైన్అప్‌లు మీ పరిమితి వద్ద మూసుకుపోతాయి; తర్వాతి నమోదు చేసినవారు వెయిట్‌లిస్ట్‌లో చేరతారు మరియు స్థానాలు ఖాళీ అయినప్పుడు స్వయంచాలకంగా ప్రమోట్ అవుతారు.' },
        { title: 'డోర్ చెక్-ఇన్ మోడ్', desc: 'ఈవెంట్ రోజు కోసం వేగవంతమైన సెర్చ్-అండ్-ట్యాప్ హాజరైనవారి జాబితా — ఎవరు వచ్చారో ఎవరు రాలేదో లైవ్‌గా చూడండి.' },
        { title: 'సిరీస్-సిద్ధ నిర్మాణం', desc: 'ఒకే గొడుగు కింద పునరావృత ఈవెంట్‌లను నడపండి — ప్రతి దానికీ దాని స్వంత పేజీ, కెపాసిటీ, మరియు హాజరైనవారి జాబితా ఉంటుంది.' },
      ],
      promptExample: 'నెలవారీ టెక్ మీట్అప్ కోసం ఈవెంట్ రిజిస్ట్రేషన్ వెబ్ యాప్‌ను నిర్మించండి: రాబోయే ఈవెంట్‌లను జాబితా చేసే పబ్లిక్ Events పేజీ; వివరణ, వేదిక, తేదీ, మరియు 80 కెపాసిటీని అమలు చేసే, నిండినప్పుడు వెయిట్‌లిస్ట్‌ను ప్రారంభించే, రద్దుల వద్ద వెయిట్‌లిస్ట్ నుండి ఆటో-ప్రమోట్ చేసే రిజిస్ట్రేషన్ ఫారమ్ (పేరు, ఇమెయిల్, పాత్ర, డైటరీ ప్రాధాన్యత) ఉన్న ప్రతి ఈవెంట్ పేజీ; మరియు హాజరైనవారి జాబితాలు, వెయిట్‌లిస్ట్, మరియు ఈవెంట్ రోజు కోసం సెర్చ్‌తో చెక్-ఇన్ మోడ్ ఉన్న నిర్వాహక Dashboard.',
      faqs: [
        { q: 'ఇది చెల్లింపు టికెట్లను నిర్వహించగలదా?', a: 'ఉచిత రిజిస్ట్రేషన్‌తో ప్రారంభించండి మరియు అవసరమైనప్పుడు చాట్‌లో చెల్లింపు దశను జోడించండి — రిజిస్ట్రేషన్ ఫ్లో మరియు హాజరైనవారి జాబితా కింద అలాగే ఉంటాయి.' },
        { q: 'వెయిట్‌లిస్ట్ ప్రమోషన్ ఎలా పని చేస్తుంది?', a: 'నిర్ధారించిన హాజరైనవారు రద్దు చేసినప్పుడు, మొదటి వెయిట్‌లిస్టెడ్ వ్యక్తి స్వయంచాలకంగా ప్రమోట్ చేయబడతారు మరియు నిర్ధారించిన జాబితాలో కనిపిస్తారు — మాన్యువల్ మార్పు లేదు.' },
        { q: 'హాజరైనవారు తమ స్వంత స్థానాన్ని రద్దు చేయవచ్చా?', a: 'అవును — మీ ప్రాంప్ట్‌లో manage-registration లింక్‌ను అడగండి మరియు రద్దులు మీకు ఇమెయిల్ చేయకుండానే స్థానాన్ని ఖాళీ చేస్తాయి (మరియు వెయిట్‌లిస్ట్‌ను ప్రేరేపిస్తాయి).' },
        { q: 'హాజరైనవారి డేటా యజమాని ఎవరు?', a: 'మీరే — ఇది మీ యాప్ యొక్క స్వంత డేటాబేస్‌లో ఉంటుంది, రో-లెవెల్ సెక్యూరిటీతో భద్రపరచబడింది మరియు ప్రచురణకు ముందు స్కాన్ చేయబడింది. ఏ ప్లాట్‌ఫారమ్ మీ హాజరైనవారి జాబితాను మైనింగ్ చేయడం లేదు.' },
      ],
    },
    'sports-league-manager': {
      h1: 'AIతో స్పోర్ట్స్ లీగ్ మేనేజ్‌మెంట్ యాప్‌ను నిర్మించండి',
      metaTitle: 'AIతో స్పోర్ట్స్ లీగ్ మేనేజర్‌ను నిర్మించండి — ఫిక్స్చర్‌లు & స్టాండింగ్‌లు',
      metaDesc: 'మీ స్థానిక లీగ్ కోసం ఫిక్స్చర్‌లు, లైవ్ స్టాండింగ్‌లు, మరియు జట్టు రోస్టర్‌లు — సాదా ఇంగ్లీష్ వివరణ నుండి జనరేట్. స్ప్రెడ్‌షీట్ లేదు, లీగ్-సాఫ్ట్‌వేర్ రుసుములు లేవు.',
      tagline: 'ఫిక్స్చర్‌లు ప్రచురించబడ్డాయి, ఫలితాలు వచ్చాయి, టేబుల్ స్వయంగా అప్‌డేట్ అవుతుంది — మరియు WhatsApp గ్రూప్ ఎవరి స్ప్రెడ్‌షీట్ సరైనదో అనే దాని గురించి కాదు, ఫారమ్ గురించి వాదిస్తుంది.',
      body: [
        'ప్రతి స్థానిక లీగ్ — ఫైవ్-ఎ-సైడ్ ఫుట్‌బాల్, బాక్స్ క్రికెట్, ఆఫీస్ బ్యాడ్మింటన్ — అదే బలహీనమైన స్టాక్‌పై నడుస్తుంది: ఒక వాలంటీర్, ఒక స్ప్రెడ్‌షీట్, మరియు ఫిక్స్చర్ జాబితా నలభై మెసేజీలలో పూడ్చుకుపోయే WhatsApp గ్రూప్. వాలంటీర్ ప్రయాణించిన క్షణం, స్టాండింగ్‌లు నమ్మదగినవిగా ఉండడం మానేస్తాయి.',
        'లీగ్ యాప్ అంటే స్టాండింగ్స్ గణితం మరియు ఒక షెడ్యూల్, మరియు జనరేట్ చేయడానికి ఇది ఒక క్లీన్ విషయం. WyberAiకి మీ ఫార్మాట్ చెప్పండి — జట్లు, రౌండ్‌లు, పాయింట్ నియమాలు, టై-బ్రేకర్‌లు — మరియు అది పబ్లిక్ లీగ్ సైట్‌ను నిర్మిస్తుంది: రౌండ్ వారీగా ఫిక్స్చర్‌లు, ఫలితం వచ్చిన వెంటనే మళ్ళీ లెక్కించే టేబుల్, మరియు రోస్టర్‌లు మరియు ఫారమ్‌తో జట్టు పేజీలు. అడ్మిన్ ఒక స్కోర్‌ను టైప్ చేస్తారు; దాని తర్వాత ప్రతిదీ స్వయంగా అప్‌డేట్ అవుతుంది.',
      ],
      features: [
        { title: 'ఫిక్స్చర్ రౌండ్‌లు', desc: 'సీజన్ షెడ్యూల్ రౌండ్ లేదా వారం వారీగా అమర్చబడింది — ప్రతి మ్యాచ్‌కు జట్లు, సమయం, మరియు వేదిక.' },
        { title: 'స్వయం-అప్‌డేట్ అయ్యే స్టాండింగ్‌లు', desc: 'ఫలితాలు వచ్చిన క్షణం పాయింట్లు, గోల్ తేడా, మరియు మీ టై-బ్రేకర్ నియమాలు స్వయంచాలకంగా వర్తింపజేయబడతాయి.' },
        { title: 'జట్టు పేజీలు మరియు రోస్టర్‌లు', desc: 'ప్రతి జట్టు దాని స్క్వాడ్, ఫలితాలు, మరియు ఇటీవలి ఫారమ్‌తో — ఆటగాళ్ళు నిజంగా చెక్ చేసే పేజీ.' },
        { title: 'ఒక-అడ్మిన్ ఫలితాల నమోదు', desc: 'నిర్వాహకుడి కోసం రక్షిత ఫలితాల ఫారమ్; మిగతా అందరికీ ఎల్లప్పుడూ ప్రస్తుతమైన రీడ్-ఓన్లీ లీగ్ లభిస్తుంది.' },
      ],
      promptExample: '8-జట్ల ఫైవ్-ఎ-సైడ్ ఫుట్‌బాల్ లీగ్ కోసం స్పోర్ట్స్ లీగ్ వెబ్ యాప్‌ను నిర్మించండి: పబ్లిక్ Standings పేజీ (గెలుపుకు 3 పాయింట్లు, డ్రాకు 1, మొదట పాయింట్ల ద్వారా తర్వాత గోల్ తేడా ద్వారా ర్యాంక్); రౌండ్ వారీగా సమూహం చేయబడిన, ఆడినట్లుగా ఫలితాలు నింపబడిన తేదీ, సమయం, మరియు వేదికను చూపే Fixtures పేజీ; రోస్టర్ మరియు చివరి-5 ఫారమ్‌తో జట్టు పేజీలు; మరియు నేను స్కోర్‌లను నమోదు చేసే మరియు టేబుల్ స్వయంచాలకంగా అప్‌డేట్ అయ్యే అడ్మిన్-మాత్రమే Results పేజీ.',
      faqs: [
        { q: 'ఇది నా కోసం ఫిక్స్చర్ జాబితాను జనరేట్ చేయగలదా?', a: 'అవును — మీ ప్రాంప్ట్‌లో "డబుల్ రౌండ్-రాబిన్ షెడ్యూల్‌ను జనరేట్ చేయండి" అని చెప్పండి మరియు ప్రతి జట్టు ప్రతి జట్టును హోమ్ మరియు అవే ఆడుతుంది, మీ సీజన్ తేదీలలో వ్యాపించి ఉంటుంది.' },
        { q: 'నాకౌట్ దశలు లేదా ప్లేఆఫ్‌ల గురించి ఏమిటి?', a: 'ఫార్మాట్‌ను వివరించండి — టాప్ ఫోర్ టు సెమీఫైనల్స్, ఒక కప్ బ్రాకెట్ — మరియు గ్రూప్ దశ ముగిసినప్పుడు నాకౌట్ నిర్మాణాన్ని జోడించమని చాట్‌ను అడగండి.' },
        { q: 'ఆటగాళ్ళు లాగిన్ చేయకుండా స్కోర్‌లను తనిఖీ చేయవచ్చా?', a: 'అవును — లీగ్ సైట్ డిఫాల్ట్‌గా పబ్లిక్ మరియు రీడ్-ఓన్లీగా ఉంటుంది; ఫలితాల నమోదు మాత్రమే అడ్మిన్ లాగిన్ వెనుక ఉంటుంది.' },
        { q: 'ఇది క్రికెట్, బాస్కెట్‌బాల్, లేదా బ్యాడ్మింటన్‌కు పని చేస్తుందా?', a: 'నిర్మాణం — జట్లు, ఫిక్స్చర్‌లు, ఫలితాలు, పాయింట్ నియమాలు — క్రీడ-అజ్ఞేయవాదం. మీ క్రీడ యొక్క స్కోరింగ్‌ను వివరించండి మరియు స్టాండింగ్స్ గణితం దానిని అనుసరిస్తుంది.' },
      ],
    },
    'volunteer-management-app': {
      h1: 'AIతో వాలంటీర్ మేనేజ్‌మెంట్ యాప్‌ను నిర్మించండి',
      metaTitle: 'AIతో వాలంటీర్ మేనేజ్‌మెంట్ యాప్‌ను నిర్మించండి',
      metaDesc: 'మీ నాన్‌ప్రాఫిట్ కోసం షిఫ్ట్ సైన్-అప్‌లు, వాలంటీర్ గంటలు, మరియు పాత్ర కేటాయింపులు — సాదా ఇంగ్లీష్ నుండి జనరేట్ చేయబడిన వాలంటీర్ యాప్, ప్రారంభించడం ఉచితం.',
      tagline: 'వాలంటీర్లు ఒక షిఫ్ట్‌ను ఎంచుకుంటారు, ఎవరు కవర్ అయ్యారో ఎవరు లేదో మీరు చూస్తారు — చుట్టూ ఇమెయిల్ చేయబడిన మరియు ఎప్పుడూ సరిగ్గా సరిపోల్చని సైన్-అప్ షీట్‌కు బదులుగా.',
      body: [
        'నాన్‌ప్రాఫిట్‌లు మరియు కమ్యూనిటీ సంస్థలు ఉచితంగా ఉన్నదానిపై వాలంటీర్ షెడ్యూలింగ్‌ను నడుపుతాయి: పంచుకున్న స్ప్రెడ్‌షీట్, ఫ్రంట్ డెస్క్‌లో పేపర్ సైన్-అప్ షీట్, నిజంగా ఎవరు నిర్ధారించారో ట్రాక్ కోల్పోయే గ్రూప్ టెక్స్ట్. ఒక ఈవెంట్‌కు పన్నెండు మంది అవసరమై కేవలం ఏడుగురు మాత్రమే వచ్చే వరకు ఇది పని చేస్తుంది, ఎందుకంటే అంతరాల గురించి ఎవరికీ స్పష్టమైన వ్యూ లేదు.',
        'మీ సంస్థ యొక్క షిఫ్ట్‌లు మరియు పాత్రలను వివరించండి, మరియు WyberAi సమన్వయ పొరను నిర్మిస్తుంది: వాలంటీర్లు స్వయంగా క్లెయిమ్ చేసుకోగల పబ్లిక్ షిఫ్ట్ బోర్డ్, గుర్తింపు లేదా గ్రాంట్ నివేదిక కోసం ప్రతి-వాలంటీర్ లాగ్ చేసిన గంటలను ట్రాక్ చేసే రోస్టర్, మరియు ఈవెంట్‌కు ముందు, తర్వాత కాదు, ఏ షిఫ్ట్‌లకు ఇంకా సిబ్బంది కొరత ఉందో ఖచ్చితంగా చూపే అడ్మిన్ వ్యూ.',
      ],
      features: [
        { title: 'పబ్లిక్ షిఫ్ట్ బోర్డ్', desc: 'వాలంటీర్లు తేదీ మరియు పాత్ర ద్వారా తెరిచిన షిఫ్ట్‌లను బ్రౌజ్ చేస్తారు, మరియు నేరుగా ఒకదాన్ని క్లెయిమ్ చేసుకుంటారు — నిర్ధారించడానికి ఇమెయిల్ ముందుకు-వెనుకకు అవసరం లేదు.' },
        { title: 'వాలంటీర్ రోస్టర్', desc: 'ప్రతి వాలంటీర్, సంప్రదింపు సమాచారం, వారు శిక్షణ పొందిన పాత్రలు, మరియు కాలక్రమేణా లాగ్ చేయబడిన మొత్తం గంటలతో.' },
        { title: 'నిర్వాహకుల కోసం కవరేజ్ వ్యూ', desc: 'రోజు రాకముందే, ఏ షిఫ్ట్‌లు పూర్తిగా సిబ్బందితో ఉన్నాయో మరియు ఏవి మరిన్ని చేతులు అవసరమో ఒక్క చూపులో చూడండి.' },
        { title: 'నివేదిక కోసం లాగ్ చేసిన గంటలు', desc: 'పూర్తయిన షిఫ్ట్‌లు వాలంటీర్ గంటల మొత్తానికి జోడించబడతాయి — గుర్తింపు, పాఠశాల క్రెడిట్, లేదా గ్రాంట్ దరఖాస్తులకు ఉపయోగకరం.' },
      ],
      promptExample: 'వాలంటీర్ మేనేజ్‌మెంట్ వెబ్ యాప్‌ను నిర్మించండి: క్లెయిమ్ బటన్ (వాలంటీర్ పేరు మరియు ఇమెయిల్‌ను నమోదు చేస్తారు)తో తేదీ మరియు పాత్ర ద్వారా తెరిచిన షిఫ్ట్‌లను జాబితా చేసే పబ్లిక్ Shifts పేజీ; మొత్తం లాగ్ చేసిన గంటలు మరియు వారు చేసిన పాత్రలతో అందరినీ జాబితా చేసే Volunteers పేజీ (అడ్మిన్); మరియు ప్రతి రాబోయే షిఫ్ట్ యొక్క నిండిన వర్సెస్ అవసరమైన వాలంటీర్ కౌంట్‌ను చూపే, సిబ్బంది కొరత ఉన్న దేనినైనా హైలైట్ చేసే Coverage Dashboard.',
      faqs: [
        { q: 'వాలంటీర్లు తాము క్లెయిమ్ చేసిన షిఫ్ట్‌ను రద్దు చేయవచ్చా?', a: 'అవును — మీ ప్రాంప్ట్‌లో cancel-my-shift లింక్‌ను అడగండి, ఇది వెంటనే పబ్లిక్ బోర్డ్‌లో స్లాట్‌ను తిరిగి తెరుస్తుంది.' },
        { q: 'ఇది సెటప్ వర్సెస్ చెక్-ఇన్ వంటి వేర్వేరు పాత్రలను ట్రాక్ చేయగలదా?', a: 'అవును — మీ ప్రాంప్ట్‌లో పాత్రలను నిర్వచించండి మరియు ప్రతి షిఫ్ట్‌కు నిర్దిష్ట పాత్ర అవసరం కావచ్చు, కాబట్టి కవరేజ్ వ్యూ నిజంగా అవసరమైన దాని ప్రకారం విభజిస్తుంది.' },
        { q: 'నేను గ్రాంట్ నివేదిక కోసం గంటలను ఎగుమతి చేయవచ్చా?', a: 'వాలంటీర్ల పేజీలో CSV ఎగుమతిని అడగండి — ఏదైనా తేదీ పరిధి కోసం ప్రతి-వ్యక్తికి మొత్తం గంటలు, నివేదికలో పేస్ట్ చేయడానికి సిద్ధంగా ఉంటాయి.' },
        { q: 'ఇది షిఫ్ట్‌కు ముందు రిమైండర్‌లను పంపుతుందా?', a: 'మీ ప్రాంప్ట్‌లో రిమైండర్ ఇమెయిల్‌లు లేదా నోటిఫికేషన్‌లను జోడించండి, మరియు వాలంటీర్లకు వారి క్లెయిమ్ చేసిన షిఫ్ట్ ప్రారంభమయ్యే ముందు పింగ్ చేయబడుతుంది.' },
      ],
    },
  },
  ta: {
    'wedding-rsvp-website': {
      h1: 'AI மூலம் திருமண RSVP வலைத்தளத்தை உருவாக்குங்கள்',
      metaTitle: 'AI மூலம் RSVPயுடன் திருமண வலைத்தளத்தை உருவாக்குங்கள் — கோட் இல்லாமல்',
      metaDesc: 'உங்கள் கதை, அட்டவணை, மற்றும் உணவு தேர்வுகள் மற்றும் பிளஸ்-ஒன்களுடன் ஒரு உண்மையான RSVP அமைப்பு — சாதாரண ஆங்கிலத்திலிருந்து உருவாக்கப்பட்ட திருமண வலைத்தளம், டெம்ப்ளேட் வாடகை இல்லை.',
      tagline: 'உங்கள் கதை, உங்கள் அட்டவணை, தானாகவே நிரம்பும் RSVP பட்டியல் — ஸ்ப்ரெட்ஷீட் மற்றும் 40 "யார் வருகிறார்கள்?" மெசேஜ்களுக்குப் பதிலாக.',
      body: [
        'திருமண வலைத்தள பில்டர்கள் ஒரு விலை தந்திரத்தை சரியாக்கியுள்ளனர்: அழகான பக்கம் இலவசம், ஆனால் உங்களுக்கு உண்மையில் தேவையான விஷயம் — உணவு தேர்வுகள், பிளஸ்-ஒன்களுடன் RSVPகள், நீங்கள் கேட்டரருக்குக் கொடுக்கக்கூடிய விருந்தினர் பட்டியல் — பிரீமியம் அடுக்கின் பின்னால் உள்ளது. மேலும் டெம்ப்ளேட் இன்னும் உங்கள் உறவினரின் திருமணத்திலிருந்து அடையாளம் காணக்கூடிய அதே ஒன்றாகவே இருக்கிறது.',
        'உங்கள் திருமணத்தை விவரியுங்கள் — இடங்கள், நாளின் கால அட்டவணை, விருந்தினர்கள் என்ன தேர்வு செய்ய வேண்டும் — WyberAi உண்மையில் உங்களுடையதான ஒரு தளத்தை உருவாக்குகிறது: உங்கள் கதை உங்கள் வழியில் சொல்லப்பட்டது, நேரடியாக ஒரு விருந்தினர் தரவுத்தளத்தில் எழுதும் RSVP படிவம். டி-மைனஸ்-இரண்டு-வாரங்களில் முக்கியமான கேள்விகளுக்கு டாஷ்போர்டு பதிலளிக்கிறது: யார் உறுதிப்படுத்தினார்கள், எத்தனை சிக்கன் வெர்சஸ் பன்னீர், எந்த ஊருக்கு வெளியே உள்ள விருந்தினர்களுக்கு ஹோட்டல் பிளாக் லிங்க் தேவை.',
      ],
      features: [
        { title: 'உண்மையான கேள்விகளுடன் RSVP', desc: 'கலந்துகொள்வது, உணவு தேர்வு, டயட்டரி குறிப்புகள், பிளஸ்-ஒன் பெயர், பாடல் கோரிக்கை — உங்கள் திட்டமிடலுக்கு தேவையானது எதுவாக இருந்தாலும், ஒவ்வொரு-விருந்தினருக்கும் பதிவு செய்யப்படுகிறது.' },
        { title: 'கேட்டரர்-தயார் விருந்தினர் டாஷ்போர்டு', desc: 'உறுதிப்படுத்தப்பட்ட எண்ணிக்கை, உணவு மொத்தங்கள், மற்றும் டயட்டரி கொடிகள் ஒரே காட்சியில் — இடம் கேட்கும்போது ஏற்றுமதி செய்யக்கூடியது.' },
        { title: 'உங்கள் நாள், வடிவமைக்கப்பட்டது', desc: 'சடங்கு, வரவேற்பு, மெஹந்தி, ஆஃப்டர்-பார்ட்டி — ஒவ்வொன்றும் நேரம், இடம், மேப் லிங்க், மற்றும் உடை குறியீட்டுடன்.' },
        { title: 'அழைப்பால் தனிப்பட்டது', desc: 'தளத்தை திறந்தே வைக்கவும், அல்லது உங்கள் அழைப்பிதழ் அட்டைகளிலிருந்து ஒரு குறியீட்டுக்குப் பின்னால் RSVPஐ கேட் செய்யவும்.' },
      ],
      promptExample: 'ஒரு திருமண வலைத்தளத்தை உருவாக்குங்கள்: எங்கள் பெயர்கள், தேதி, மற்றும் கதையுடன் ஒரு அழகான Home பக்கம்; சடங்கு மற்றும் வரவேற்பு நேரங்கள், மேப் லிங்குகளுடன் இடங்கள், மற்றும் உடை குறியீட்டுடன் Schedule பக்கம்; விருந்தினர்கள் தங்கள் அழைப்பு பெயரை உள்ளிடும், கலந்துகொள்வதா இல்லையா என்று குறிக்கும், ஒரு உணவை தேர்ந்தெடுக்கும் (சைவம்/அசைவம்), டயட்டரி குறிப்புகள் மற்றும் பிளஸ்-ஒன்னைச் சேர்க்கும் RSVP பக்கம்; மற்றும் உறுதிப்படுத்தப்பட்ட எண்ணிக்கைகள், உணவு மொத்தங்கள், மற்றும் முழு விருந்தினர் பட்டியலைக் காட்டும் தனிப்பட்ட Dashboard (லாகின்).',
      faqs: [
        { q: 'விருந்தினர்கள் ஒரே நேரத்தில் தங்கள் முழு குடும்பத்திற்கும் RSVP செய்யலாமா?', a: 'ஆம் — உங்கள் ப்ராம்ப்ட்டில் அழைப்புகளை குடும்பங்களாக மாடல் செய்யுங்கள், ஒரு சமர்ப்பிப்பு அழைப்பிதழில் உள்ள ஒவ்வொரு பெயரையும் உறுதிப்படுத்த முடியும்.' },
        { q: 'நாங்கள் தளத்தை எங்கள் அழைப்பிதழ் தொகுப்புடன் பொருத்தலாமா?', a: 'உங்கள் வண்ணத் தட்டு மற்றும் மனநிலையை விவரியுங்கள் ("டஸ்டி ரோஸ் மற்றும் கிரீம், செரிஃப், மெழுகுவர்த்தி வெளிச்சம்") டிசைன் அதற்கு பொருந்துமாறு உருவாக்கப்படுகிறது — பின்னர் சாட்டில் மேம்படுத்தவும்.' },
        { q: 'ourNames.com போன்ற கஸ்டம் டொமைன் பற்றி என்ன?', a: 'தளத்தை வெளியிட்டு எடிட்டரிலிருந்து ஒரு கஸ்டம் டொமைனை இணைக்கவும் — விருந்தினர்கள் ஒருபோதும் பில்டர் URLஐ பார்க்க மாட்டார்கள்.' },
        { q: 'ஒவ்வொரு-விருந்தினர் அல்லது பிரீமியம்-ஃபீச்சர் கட்டணம் உள்ளதா?', a: 'இல்லை — RSVP, டாஷ்போர்டு, மற்றும் விருந்தினர் பட்டியல் உங்கள் ஆப்பின் பகுதிகள் மட்டுமே. உருவாக்குவதற்கு இலவச மாதாந்திர கிரெடிட்கள் பயன்படுத்தப்படுகின்றன; தளம் உங்களுடையது.' },
      ],
    },
    'event-registration-app': {
      h1: 'AI மூலம் நிகழ்வு பதிவு ஆப்-ஐ உருவாக்குங்கள்',
      metaTitle: 'AI மூலம் நிகழ்வு பதிவு ஆப்-ஐ உருவாக்குங்கள் — கோட் இல்லாமல்',
      metaDesc: 'பதிவு பக்கங்கள், கொள்ளளவு வரம்புகள், காத்திருப்பு பட்டியல்கள், மற்றும் செக்-இன் காட்சி — ஒரு விவரிப்பிலிருந்து உருவாக்கப்பட்ட நிகழ்வு பதிவு மென்பொருள், ஒவ்வொரு-டிக்கெட் கட்டணங்கள் இல்லாமல்.',
      tagline: 'பதிவு, கொள்ளளவு, காத்திருப்பு பட்டியல், செக்-இன் — உங்கள் பட்டறை அல்லது சந்திப்புக்கான முழு பதிவு பணிப்பாய்வு, ஒவ்வொரு-டிக்கெட் தள கட்டணம் இல்லாமல்.',
      body: [
        'இலவச நிகழ்வுகள் மற்றும் கட்டண பட்டறைகள் இரண்டிற்கும், டிக்கெட்டிங் தளங்கள் பரிமாற்றங்களைப் போல கட்டணம் வசூலிக்கின்றன: ஒவ்வொரு-டிக்கெட் கமிஷன், உங்கள் பங்கேற்பாளர்கள் முணுமுணுக்கும் சேவைக் கட்டணங்கள், மற்றும் உங்கள் பங்கேற்பாளர் பட்டியல் அவர்களின் CRMல் வாழ்கிறது, உங்களுடையதில் அல்ல. ஒரு சமூக சந்திப்பு பெயர்களை சேகரிக்க ஒரு சதவீதத்தை கொடுக்கக்கூடாது.',
        'பதிவு என்பது ஒரு படிவம், ஒரு கொள்ளளவு எண்ணி, மற்றும் ஒரு பட்டியல் — அதனால்தான் இது மிக நன்றாக உருவாக்கப்படுகிறது. உங்கள் நிகழ்வையும் ஒவ்வொரு-பங்கேற்பாளரைப் பற்றி நீங்கள் அறிய வேண்டியதையும் விவரியுங்கள், WyberAi பணிப்பாய்வை உருவாக்குகிறது: கொள்ளளவில் தானாகவே மூடிக்கொள்ளும் மற்றும் காத்திருப்பு பட்டியலைத் தொடங்கும் பதிவு பக்கம், யாராவது வெளியேறும்போது தானியங்கி பதவி உயர்வு, மற்றும் ஃபோனிலிருந்து வேலை செய்யும் கதவுக்கான செக்-இன் காட்சி. ஒரு நிகழ்வை அல்லது மாதாந்திர தொடரை இயக்குங்கள்; பங்கேற்பாளர் தரவு இரு சூழ்நிலைகளிலும் உங்களுடையதாகவே இருக்கும்.',
      ],
      features: [
        { title: 'உங்கள் கேள்விகளுடன் பதிவு', desc: 'பெயர் மற்றும் மின்னஞ்சலுடன் உங்கள் நிகழ்வுக்குத் தேவையான எதுவும் — டி-ஷர்ட் அளவு, அனுபவ நிலை, டயட்டரி தேவைகள், நிறுவனம்.' },
        { title: 'கொள்ளளவு + ஆட்டோ-காத்திருப்பு பட்டியல்', desc: 'பதிவுகள் உங்கள் வரம்பில் மூடிக்கொள்கின்றன; பிந்தைய பதிவாளர்கள் காத்திருப்பு பட்டியலில் சேர்ந்து இடங்கள் காலியாகும்போது தானாகவே பதவி உயர்வு பெறுகிறார்கள்.' },
        { title: 'கதவு செக்-இன் பயன்முறை', desc: 'நிகழ்வு நாளுக்கான வேகமான தேடல்-மற்றும்-தட்டு பங்கேற்பாளர் பட்டியல் — யார் வந்தார்கள் யார் வரவில்லை என்பதை நேரலையில் பாருங்கள்.' },
        { title: 'தொடர்-தயார் அமைப்பு', desc: 'ஒரே கூரையின் கீழ் தொடர்ச்சியான நிகழ்வுகளை இயக்குங்கள் — ஒவ்வொன்றும் அதன் சொந்த பக்கம், கொள்ளளவு, மற்றும் பங்கேற்பாளர் பட்டியலுடன்.' },
      ],
      promptExample: 'ஒரு மாதாந்திர டெக் சந்திப்புக்கான நிகழ்வு பதிவு வெப் ஆப்பை உருவாக்குங்கள்: வரவிருக்கும் நிகழ்வுகளை பட்டியலிடும் பப்ளிக் Events பக்கம்; விளக்கம், இடம், தேதி, மற்றும் 80 கொள்ளளவை அமல்படுத்தும், நிரம்பியதும் காத்திருப்பு பட்டியலைத் தொடங்கும், ரத்துசெய்தல்களில் காத்திருப்பு பட்டியலிலிருந்து ஆட்டோ-ப்ரமோட் செய்யும் பதிவு படிவம் (பெயர், மின்னஞ்சல், பங்கு, டயட்டரி விருப்பம்) கொண்ட ஒவ்வொரு நிகழ்வு பக்கம்; மற்றும் பங்கேற்பாளர் பட்டியல்கள், காத்திருப்பு பட்டியல், மற்றும் நிகழ்வு நாளுக்கான தேடலுடன் செக்-இன் பயன்முறை கொண்ட ஏற்பாட்டாளர் Dashboard.',
      faqs: [
        { q: 'இது கட்டண டிக்கெட்டுகளை கையாள முடியுமா?', a: 'இலவச பதிவுடன் தொடங்கி தேவைப்படும்போது சாட்டில் ஒரு கட்டணப் படியைச் சேர்க்கவும் — பதிவு ஓட்டமும் பங்கேற்பாளர் பட்டியலும் அடிப்படையில் அப்படியே இருக்கும்.' },
        { q: 'காத்திருப்பு பட்டியல் பதவி உயர்வு எப்படி வேலை செய்கிறது?', a: 'உறுதிப்படுத்தப்பட்ட பங்கேற்பாளர் ரத்து செய்யும்போது, முதல் காத்திருப்பு பட்டியல் நபர் தானாகவே பதவி உயர்வு பெற்று உறுதிப்படுத்தப்பட்ட பட்டியலில் தோன்றுவார் — கைமுறை மாற்றம் இல்லை.' },
        { q: 'பங்கேற்பாளர்கள் தங்கள் சொந்த இடத்தை ரத்து செய்யலாமா?', a: 'ஆம் — உங்கள் ப்ராம்ப்ட்டில் manage-registration லிங்கைக் கேளுங்கள், ரத்துசெய்தல்கள் உங்களுக்கு மின்னஞ்சல் அனுப்பாமலேயே இடத்தை காலி செய்யும் (மற்றும் காத்திருப்பு பட்டியலைத் தூண்டும்).' },
        { q: 'பங்கேற்பாளர் தரவின் உரிமையாளர் யார்?', a: 'நீங்கள்தான் — இது உங்கள் ஆப்பின் சொந்த டேட்டாபேஸில் உள்ளது, row-level செக்யூரிட்டியுடன் பாதுகாக்கப்பட்டு, வெளியீட்டுக்கு முன் ஸ்கேன் செய்யப்பட்டது. எந்த தளமும் உங்கள் பங்கேற்பாளர் பட்டியலை மைனிங் செய்யவில்லை.' },
      ],
    },
    'sports-league-manager': {
      h1: 'AI மூலம் விளையாட்டு லீக் மேலாண்மை ஆப்-ஐ உருவாக்குங்கள்',
      metaTitle: 'AI மூலம் விளையாட்டு லீக் மேலாளரை உருவாக்குங்கள் — ஃபிக்ஸ்சர்கள் & நிலைப்பாடுகள்',
      metaDesc: 'உங்கள் உள்ளூர் லீக்கிற்கான ஃபிக்ஸ்சர்கள், நேரலை நிலைப்பாடுகள், மற்றும் அணி பட்டியல்கள் — சாதாரண ஆங்கில விவரிப்பிலிருந்து உருவாக்கப்பட்டது. ஸ்ப்ரெட்ஷீட் இல்லை, லீக்-மென்பொருள் கட்டணங்கள் இல்லை.',
      tagline: 'ஃபிக்ஸ்சர்கள் வெளியிடப்பட்டன, முடிவுகள் வந்தன, அட்டவணை தானாகவே புதுப்பிக்கிறது — WhatsApp குழு யாருடைய ஸ்ப்ரெட்ஷீட் சரியானது என்பதைப் பற்றி அல்ல, ஃபார்ம் பற்றி வாதிடுகிறது.',
      body: [
        'ஒவ்வொரு உள்ளூர் லீக்கும் — ஃபைவ்-அ-சைட் ஃபுட்பால், பாக்ஸ் கிரிக்கெட், அலுவலக பேட்மிண்டன் — அதே பலவீனமான அடுக்கில் இயங்குகிறது: ஒரு தொண்டர், ஒரு ஸ்ப்ரெட்ஷீட், மற்றும் ஃபிக்ஸ்சர் பட்டியல் நாற்பது மெசேஜ்களில் புதைந்துபோகும் WhatsApp குழு. தொண்டர் பயணிக்கும் தருணம், நிலைப்பாடுகள் நம்பகமானதாக இருப்பதை நிறுத்திவிடும்.',
        'ஒரு லீக் ஆப் என்பது நிலைப்பாடு கணிதம் மற்றும் ஒரு அட்டவணை, இது உருவாக்குவதற்கு ஒரு சுத்தமான விஷயம். உங்கள் வடிவமைப்பை WyberAiக்குச் சொல்லுங்கள் — அணிகள், சுற்றுகள், புள்ளி விதிகள், டை-பிரேக்கர்கள் — அது பப்ளிக் லீக் தளத்தை உருவாக்குகிறது: சுற்று வாரியாக ஃபிக்ஸ்சர்கள், முடிவு உள்ளிடப்பட்டவுடன் மீண்டும் கணக்கிடும் அட்டவணை, மற்றும் பட்டியல்கள் மற்றும் ஃபார்முடன் அணி பக்கங்கள். நிர்வாகி ஒரு மதிப்பெண்ணை தட்டச்சு செய்கிறார்; அதற்குப் பிறகு எல்லாமே தானாகவே புதுப்பிக்கும்.',
      ],
      features: [
        { title: 'ஃபிக்ஸ்சர் சுற்றுகள்', desc: 'சீசனின் அட்டவணை சுற்று அல்லது வாரம் வாரியாக அமைக்கப்பட்டுள்ளது — ஒவ்வொரு போட்டியும் அணிகள், நேரம், மற்றும் இடத்துடன்.' },
        { title: 'சுய-புதுப்பிப்பு நிலைப்பாடுகள்', desc: 'முடிவுகள் வந்த உடனேயே புள்ளிகள், கோல் வித்தியாசம், மற்றும் உங்கள் டை-பிரேக்கர் விதிகள் தானாகவே பயன்படுத்தப்படும்.' },
        { title: 'அணி பக்கங்கள் மற்றும் பட்டியல்கள்', desc: 'ஒவ்வொரு அணியும் அதன் ஸ்குவாட், முடிவுகள், மற்றும் சமீபத்திய ஃபார்முடன் — வீரர்கள் உண்மையில் சரிபார்க்கும் பக்கம்.' },
        { title: 'ஒரே-நிர்வாகி முடிவு உள்ளீடு', desc: 'ஏற்பாட்டாளருக்கு பாதுகாக்கப்பட்ட முடிவு படிவம்; மற்ற அனைவருக்கும் எப்போதும் தற்போதைய படிக்க-மட்டும் லீக் கிடைக்கும்.' },
      ],
      promptExample: '8-அணி ஃபைவ்-அ-சைட் ஃபுட்பால் லீக்கிற்கான விளையாட்டு லீக் வெப் ஆப்பை உருவாக்குங்கள்: பப்ளிக் Standings பக்கம் (வெற்றிக்கு 3 புள்ளிகள், டிராவிற்கு 1, முதலில் புள்ளிகளாலும் பின்னர் கோல் வித்தியாசத்தாலும் தரவரிசைப்படுத்தப்பட்டது); சுற்று வாரியாக தொகுக்கப்பட்ட, விளையாடியபடி முடிவுகள் நிரப்பப்பட்ட தேதி, நேரம், மற்றும் இடத்தைக் காட்டும் Fixtures பக்கம்; பட்டியல் மற்றும் கடைசி-5 ஃபார்முடன் அணி பக்கங்கள்; நான் மதிப்பெண்களை உள்ளிடும் மற்றும் அட்டவணை தானாகவே புதுப்பிக்கும் நிர்வாகி-மட்டும் Results பக்கம்.',
      faqs: [
        { q: 'இது எனக்காக ஃபிக்ஸ்சர் பட்டியலை உருவாக்க முடியுமா?', a: 'ஆம் — உங்கள் ப்ராம்ப்ட்டில் "இரட்டை ரவுண்ட்-ராபின் அட்டவணையை உருவாக்குங்கள்" என்று சொல்லுங்கள், ஒவ்வொரு அணியும் ஒவ்வொரு அணியையும் வீடு மற்றும் வெளியே விளையாடும், உங்கள் சீசன் தேதிகளில் பரவியிருக்கும்.' },
        { q: 'நாக்அவுட் நிலைகள் அல்லது ப்ளேஆஃப்கள் பற்றி என்ன?', a: 'வடிவமைப்பை விவரியுங்கள் — முதல் நான்கு அரையிறுதிக்கு, ஒரு கோப்பை அடைப்பு — குழு நிலை முடிந்ததும் நாக்அவுட் அமைப்பைச் சேர்க்க சாட்டிடம் கேளுங்கள்.' },
        { q: 'வீரர்கள் லாகின் செய்யாமல் மதிப்பெண்களைச் சரிபார்க்கலாமா?', a: 'ஆம் — லீக் தளம் இயல்பாகவே பப்ளிக் மற்றும் படிக்க-மட்டும் — முடிவு உள்ளீடு மட்டுமே நிர்வாகி லாகினுக்குப் பின்னால் உள்ளது.' },
        { q: 'இது கிரிக்கெட், கூடைப்பந்து, அல்லது பேட்மிண்டனுக்கு வேலை செய்யுமா?', a: 'அமைப்பு — அணிகள், ஃபிக்ஸ்சர்கள், முடிவுகள், புள்ளி விதிகள் — விளையாட்டு-நடுநிலையானது. உங்கள் விளையாட்டின் மதிப்பெண் முறையை விவரியுங்கள், நிலைப்பாடு கணிதம் அதைப் பின்பற்றும்.' },
      ],
    },
    'volunteer-management-app': {
      h1: 'AI மூலம் தொண்டர் மேலாண்மை ஆப்-ஐ உருவாக்குங்கள்',
      metaTitle: 'AI மூலம் தொண்டர் மேலாண்மை ஆப்-ஐ உருவாக்குங்கள்',
      metaDesc: 'உங்கள் தன்னார்வ தொண்டு நிறுவனத்திற்கான ஷிப்ட் பதிவுகள், தொண்டர் மணிநேரங்கள், மற்றும் பங்கு ஒதுக்கீடுகள் — சாதாரண ஆங்கிலத்திலிருந்து உருவாக்கப்பட்ட தொண்டர் ஆப், தொடங்குவது இலவசம்.',
      tagline: 'தொண்டர்கள் ஒரு ஷிப்டைத் தேர்ந்தெடுக்கிறார்கள், யார் கவர் செய்யப்பட்டுள்ளார்கள் யார் இல்லை என்பதை நீங்கள் பார்க்கிறீர்கள் — சுற்றி மின்னஞ்சல் அனுப்பப்பட்டு ஒருபோதும் சரியாக சரிசெய்யப்படாத பதிவு தாளுக்குப் பதிலாக.',
      body: [
        'தன்னார்வ தொண்டு நிறுவனங்களும் சமூக அமைப்புகளும் இலவசமாக இருப்பதில் தொண்டர் அட்டவணையை இயக்குகின்றன: பகிரப்பட்ட ஸ்ப்ரெட்ஷீட், முன் மேசையில் ஒரு காகித பதிவு தாள், யார் உண்மையில் உறுதிப்படுத்தினார்கள் என்பதன் கண்காணிப்பை இழக்கும் குழு உரை. ஒரு நிகழ்விற்கு பன்னிரண்டு பேர் தேவைப்பட்டு ஏழு பேர் மட்டுமே வரும் வரை இது வேலை செய்கிறது, ஏனெனில் இடைவெளிகளைப் பற்றி யாருக்கும் தெளிவான காட்சி இல்லை.',
        'உங்கள் அமைப்பின் ஷிப்ட்கள் மற்றும் பங்குகளை விவரியுங்கள், WyberAi ஒருங்கிணைப்பு அடுக்கை உருவாக்குகிறது: தொண்டர்கள் தாங்களாகவே கோரக்கூடிய பப்ளிக் ஷிப்ட் போர்டு, அங்கீகாரம் அல்லது மானிய அறிக்கைக்காக ஒவ்வொரு-தொண்டருக்கும் பதிவு செய்யப்பட்ட மணிநேரங்களைக் கண்காணிக்கும் பட்டியல், நிகழ்வுக்கு முன், பின் அல்ல, எந்த ஷிப்ட்களுக்கு இன்னும் பணியாளர் பற்றாக்குறை உள்ளது என்பதை சரியாகக் காட்டும் நிர்வாகி காட்சி.',
      ],
      features: [
        { title: 'பப்ளிக் ஷிப்ட் போர்டு', desc: 'தொண்டர்கள் தேதி மற்றும் பங்கின் அடிப்படையில் திறந்த ஷிப்ட்களை உலாவி, நேரடியாக ஒன்றைக் கோருகிறார்கள் — உறுதிப்படுத்த மின்னஞ்சல் முன்னும்-பின்னும் தேவையில்லை.' },
        { title: 'தொண்டர் பட்டியல்', desc: 'ஒவ்வொரு தொண்டரும், தொடர்பு தகவல், அவர்கள் பயிற்சி பெற்ற பங்குகள், மற்றும் காலப்போக்கில் பதிவு செய்யப்பட்ட மொத்த மணிநேரங்களுடன்.' },
        { title: 'ஏற்பாட்டாளர்களுக்கான கவரேஜ் காட்சி', desc: 'நாள் வருவதற்கு முன், எந்த ஷிப்ட்கள் முழுமையாக பணியாளர்களைக் கொண்டுள்ளன, எதற்கு மேலும் கைகள் தேவை என்பதை ஒரே பார்வையில் பாருங்கள்.' },
        { title: 'அறிக்கைக்கான பதிவு செய்யப்பட்ட மணிநேரங்கள்', desc: 'முடிக்கப்பட்ட ஷிப்ட்கள் தொண்டரின் மணிநேர மொத்தத்தில் சேர்க்கப்படும் — அங்கீகாரம், பள்ளி கிரெடிட், அல்லது மானிய விண்ணப்பங்களுக்கு பயனுள்ளது.' },
      ],
      promptExample: 'தொண்டர் மேலாண்மை வெப் ஆப்பை உருவாக்குங்கள்: ஒரு கோரிக்கை பொத்தானுடன் (தொண்டர் பெயர் மற்றும் மின்னஞ்சலை உள்ளிடுகிறார்) தேதி மற்றும் பங்கின் அடிப்படையில் திறந்த ஷிப்ட்களை பட்டியலிடும் பப்ளிக் Shifts பக்கம்; மொத்த பதிவு செய்யப்பட்ட மணிநேரங்கள் மற்றும் அவர்கள் செய்த பங்குகளுடன் அனைவரையும் பட்டியலிடும் Volunteers பக்கம் (நிர்வாகி); மற்றும் ஒவ்வொரு வரவிருக்கும் ஷிப்டின் நிரப்பப்பட்ட வெர்சஸ் தேவையான தொண்டர் எண்ணிக்கையைக் காட்டும், பணியாளர் பற்றாக்குறை உள்ள எதையும் சிறப்பிக்கும் Coverage Dashboard.',
      faqs: [
        { q: 'தொண்டர்கள் தாங்கள் கோரிய ஷிப்டை ரத்து செய்யலாமா?', a: 'ஆம் — உங்கள் ப்ராம்ப்ட்டில் cancel-my-shift லிங்கைக் கேளுங்கள், இது உடனடியாக பப்ளிக் போர்டில் ஸ்லாட்டை மீண்டும் திறக்கும்.' },
        { q: 'இது செட்அப் வெர்சஸ் செக்-இன் போன்ற வெவ்வேறு பங்குகளைக் கண்காணிக்க முடியுமா?', a: 'ஆம் — உங்கள் ப்ராம்ப்ட்டில் பங்குகளை வரையறுக்கவும், ஒவ்வொரு ஷிப்டுக்கும் ஒரு குறிப்பிட்ட பங்கு தேவைப்படலாம், எனவே கவரேஜ் காட்சி உண்மையில் தேவையானதின் அடிப்படையில் பிரிக்கப்படும்.' },
        { q: 'நான் மானிய அறிக்கைக்காக மணிநேரங்களை ஏற்றுமதி செய்யலாமா?', a: 'தொண்டர்கள் பக்கத்தில் CSV ஏற்றுமதியைக் கேளுங்கள் — எந்த தேதி வரம்பிற்கும் ஒவ்வொரு நபருக்கும் மொத்த மணிநேரங்கள், அறிக்கையில் ஒட்ட தயாராக உள்ளது.' },
        { q: 'இது ஷிப்டுக்கு முன் நினைவூட்டல்களை அனுப்புமா?', a: 'உங்கள் ப்ராம்ப்ட்டில் நினைவூட்டல் மின்னஞ்சல்கள் அல்லது அறிவிப்புகளைச் சேர்க்கவும், தொண்டர்கள் தாங்கள் கோரிய ஷிப்ட் தொடங்குவதற்கு முன் பிங் செய்யப்படுவார்கள்.' },
      ],
    },
  },
}
