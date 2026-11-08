import type { Audience, Door, IntentLang } from './types'

// Copy for the visitor-intent box (India-only experiment).
//
// REVIEW STATUS: the Hindi (hi) and Gujarati (gu) strings below are AI-drafted
// and have NOT been reviewed by a native speaker. The experiment is behind
// NEXT_PUBLIC_INTENT_EXPERIMENT and must not be switched on for real traffic
// in hi/gu until a native speaker has read them. Same caveat as
// lib/i18n/home-translations.ts.
//
// The sample prompts are the expo portal's finalized use cases (see
// app/gujaratexpo/data.ts), so a visitor sees the same examples online and at
// the booth. Chip ids are shared across languages so analytics stay comparable.
//
// Rules: no mention of where the company is based, and nothing that says it is
// a one-person company. Brand/GST terms (GSTR-2B, GSTIN, LR, USD, RSVP) stay in
// Latin script, as Indian business users write them.

export interface Chip { id: string; label: string; prompt: string }

export interface IntentCopy {
  langName: string
  label: string
  doors: Record<Door, string>
  /** One line under each door, saying what that choice gets you. */
  doorHints: Record<Door, string>
  /** One line under the question, promising what choosing does. */
  askSub: string
  chips: Record<Door, Chip[]>
  readoutPrefix: string
  readoutFix: string
  audienceName: Record<Audience, string>
  thinking: string
  unsure: string
  disclosure: string
  planTitle: string
  planScreens: string
  planData: string
  planFirstWin: string
  planLoading: string
  planNote: string
  planKinds: Record<'web_app' | 'mobile_app' | 'website' | 'saas', string>
}

export const INTENT_COPY: Record<IntentLang, IntentCopy> = {
  en: {
    langName: 'English',
    label: 'What brings you here?',
    doors: { business: 'Fix a problem in my business', software: 'Build a new app or product', student: 'I\'m just learning or exploring' },
    doorHints: { business: 'Orders, stock, follow-ups, paperwork. Tell us what is slowing you down.', software: 'Got an idea? Describe it and see a working first version.', student: 'Projects, practice or curiosity. Start free.' },
    askSub: 'Tell us in one tap and we will show you only what matters to you.',
    chips: {
      business: [
        { id: 'job-work', label: 'Job-work challan tracker', prompt: 'Build a job-work tracker. I log a challan for goods sent to a job worker, record what comes back, and get a warning before the one-year return limit.' },
        { id: 'gstr2b', label: 'GSTR-2B matching', prompt: 'Build a tool where I upload my purchase register and my GSTR-2B file. Match them by supplier GSTIN and invoice number, then show the mismatches and a list of suppliers to chase.' },
        { id: 'delivery-proof', label: 'Delivery proof on a phone', prompt: 'Build a mobile app for my drivers. They pick a delivery, photograph the signed LR copy, and the office sees delivered or pending in one list.' },
      ],
      software: [
        { id: 'saas-plans', label: 'A subscription product', prompt: 'Build a subscription web app. A public pricing page with three monthly plans, a sign-up and login page, an account page where a customer sees their plan and billing status and can change plan, and an admin page listing every customer, their plan and when they joined.' },
        { id: 'marketplace', label: 'A marketplace', prompt: 'Build a two-sided marketplace. Sellers sign up and list a service with photos, a description and a price. Buyers browse listings, search and filter by category, and send a booking request. An admin page shows all sellers, listings and requests.' },
        { id: 'mobile-idea', label: 'A mobile app idea', prompt: 'Build a mobile app. A welcome screen, a sign-in screen, a home feed of items users have added, a screen to add a new item with a photo and a note, and a profile screen. Keep the design clean and simple.' },
      ],
      student: [
        { id: 'placement-tracker', label: 'Placement tracker', prompt: 'Build a mobile app to track campus placements: companies, rounds, dates, results and prep notes.' },
        { id: 'tuition-manager', label: 'Tuition class manager', prompt: 'Build a tuition class manager with batches, attendance, monthly fee dues and a parent contact list.' },
        { id: 'wedding-rsvp', label: 'Wedding website with RSVP', prompt: 'Build a wedding website with an invitation page for each event, a venue map link, an RSVP form and a guest list with headcount.' },
      ],
    },
    readoutPrefix: 'We understood:',
    readoutFix: 'Not right? Change',
    audienceName: { business: 'Business owner', software: 'Builder', student: 'Student', other: 'Your work' },
    thinking: 'Understanding…',
    unsure: 'Tell us a little more?',
    disclosure: 'An AI reads what you type here so this page can adapt to you. Please do not write names, phone numbers or emails.',
    planTitle: "What we'd build first",
    planScreens: 'Screens',
    planData: 'Keeps track of',
    planFirstWin: 'First version',
    planLoading: 'Sketching your app…',
    planNote: 'A quick sketch from what you wrote. The real plan is made when you start building.',
    planKinds: { web_app: 'Web app', mobile_app: 'Mobile app', website: 'Website', saas: 'SaaS' },
  },

  hi: {
    langName: 'हिंदी',
    label: 'आप यहाँ किसलिए आए हैं?',
    doors: { business: 'अपने व्यवसाय की समस्या सुलझानी है', software: 'नया ऐप या प्रोडक्ट बनाना है', student: 'बस सीखना या देखना है' },
    doorHints: { business: 'ऑर्डर, स्टॉक, फ़ॉलो-अप, काग़ज़ी काम। बताइए क्या आपको धीमा कर रहा है।', software: 'कोई आइडिया है? बताइए और पहला चलता-फिरता वर्ज़न देखिए।', student: 'प्रोजेक्ट, अभ्यास या जिज्ञासा। मुफ़्त शुरू करें।' },
    askSub: 'एक टैप में बताइए, हम आपको सिर्फ़ वही दिखाएँगे जो आपके काम का है।',
    chips: {
      business: [
        { id: 'job-work', label: 'जॉब-वर्क चालान ट्रैकर', prompt: 'एक जॉब-वर्क ट्रैकर बनाओ। मैं जॉब वर्कर को भेजे माल का चालान दर्ज करूँ, जो वापस आया उसे लिखूँ, और एक साल की वापसी सीमा से पहले चेतावनी मिले।' },
        { id: 'gstr2b', label: 'GSTR-2B मिलान', prompt: 'एक टूल बनाओ जिसमें मैं अपना परचेज़ रजिस्टर और GSTR-2B फ़ाइल अपलोड करूँ। सप्लायर GSTIN और इनवॉइस नंबर से दोनों को मिलाए, फिर जो नहीं मिले उनकी और जिन सप्लायरों से पूछना है उनकी सूची दिखाए।' },
        { id: 'delivery-proof', label: 'डिलीवरी का प्रमाण (फ़ोन पर)', prompt: 'मेरे ड्राइवरों के लिए एक मोबाइल ऐप बनाओ। वे डिलीवरी चुनें, साइन की हुई LR कॉपी की फ़ोटो लें, और ऑफ़िस एक सूची में देखे कि क्या डिलीवर हुआ और क्या बाकी है।' },
      ],
      software: [
        { id: 'saas-plans', label: 'सब्सक्रिप्शन वाला प्रोडक्ट', prompt: 'एक सब्सक्रिप्शन वेब ऐप बनाओ। तीन मासिक प्लान वाला पब्लिक प्राइसिंग पेज, साइन-अप और लॉगिन पेज, एक अकाउंट पेज जहाँ ग्राहक अपना प्लान और बिलिंग की स्थिति देखे और प्लान बदल सके, और एक एडमिन पेज जिसमें हर ग्राहक, उसका प्लान और जुड़ने की तारीख दिखे।' },
        { id: 'marketplace', label: 'मार्केटप्लेस', prompt: 'एक दो-तरफ़ा मार्केटप्लेस बनाओ। विक्रेता साइन-अप करके फ़ोटो, विवरण और कीमत के साथ अपनी सेवा लिस्ट करें। खरीदार लिस्टिंग देखें, श्रेणी से खोजें और फ़िल्टर करें, और बुकिंग अनुरोध भेजें। एडमिन पेज पर सभी विक्रेता, लिस्टिंग और अनुरोध दिखें।' },
        { id: 'mobile-idea', label: 'मोबाइल ऐप का आइडिया', prompt: 'एक मोबाइल ऐप बनाओ। एक वेलकम स्क्रीन, साइन-इन स्क्रीन, होम स्क्रीन जिसमें यूज़र्स की जोड़ी हुई चीज़ें दिखें, फ़ोटो और नोट के साथ नई चीज़ जोड़ने की स्क्रीन, और प्रोफ़ाइल स्क्रीन। डिज़ाइन साफ़ और सरल रखो।' },
      ],
      student: [
        { id: 'placement-tracker', label: 'प्लेसमेंट ट्रैकर', prompt: 'कैंपस प्लेसमेंट ट्रैक करने के लिए एक मोबाइल ऐप बनाओ: कंपनियाँ, राउंड, तारीख़ें, नतीजे और तैयारी के नोट्स।' },
        { id: 'tuition-manager', label: 'ट्यूशन क्लास मैनेजर', prompt: 'बैच, उपस्थिति, मासिक फ़ीस बकाया और अभिभावकों की संपर्क सूची वाला ट्यूशन क्लास मैनेजर बनाओ।' },
        { id: 'wedding-rsvp', label: 'शादी की वेबसाइट (RSVP)', prompt: 'शादी की वेबसाइट बनाओ जिसमें हर कार्यक्रम का निमंत्रण पेज, वेन्यू का मैप लिंक, RSVP फ़ॉर्म और मेहमानों की सूची गिनती सहित हो।' },
      ],
    },
    readoutPrefix: 'हमने समझा:',
    readoutFix: 'ठीक नहीं? बदलें',
    audienceName: { business: 'व्यवसाय के मालिक', software: 'निर्माता', student: 'विद्यार्थी', other: 'आपका काम' },
    thinking: 'समझ रहे हैं…',
    unsure: 'थोड़ा और बताएँगे?',
    disclosure: 'आप यहाँ जो लिखते हैं उसे एक AI पढ़ता है ताकि यह पेज आपके हिसाब से बदले। कृपया नाम, फ़ोन नंबर या ईमेल न लिखें।',
    planTitle: 'हम सबसे पहले यह बनाएँगे',
    planScreens: 'स्क्रीन',
    planData: 'इनका हिसाब रखेगा',
    planFirstWin: 'पहला वर्ज़न',
    planLoading: 'आपके ऐप का खाका बना रहे हैं…',
    planNote: 'आपके लिखे के आधार पर एक छोटा खाका। असली प्लान तब बनता है जब आप बनाना शुरू करते हैं।',
    planKinds: { web_app: 'वेब ऐप', mobile_app: 'मोबाइल ऐप', website: 'वेबसाइट', saas: 'SaaS' },
  },

  gu: {
    langName: 'ગુજરાતી',
    label: 'તમે અહીં શા માટે આવ્યા છો?',
    doors: { business: 'મારા વ્યવસાયની સમસ્યા ઉકેલવી છે', software: 'નવી એપ કે પ્રોડક્ટ બનાવવી છે', student: 'ફક્ત શીખવું કે જોવું છે' },
    doorHints: { business: 'ઓર્ડર, સ્ટોક, ફૉલો-અપ, કાગળકામ. કહો કે તમને શું ધીમા પાડે છે.', software: 'કોઈ વિચાર છે? વર્ણવો અને પહેલું ચાલતું વર્ઝન જુઓ.', student: 'પ્રોજેક્ટ, પ્રેક્ટિસ કે જિજ્ઞાસા. મફત શરૂ કરો.' },
    askSub: 'એક ટૅપમાં કહો, અમે તમને ફક્ત તે જ બતાવીશું જે તમારા કામનું છે.',
    chips: {
      business: [
        { id: 'job-work', label: 'જોબ-વર્ક ચલણ ટ્રેકર', prompt: 'જોબ-વર્ક ટ્રેકર બનાવો. હું જોબ વર્કરને મોકલેલા માલનું ચલણ નોંધી શકું, જે પાછું આવ્યું તે લખી શકું, અને એક વર્ષની પરત-મર્યાદા પહેલાં ચેતવણી મળે.' },
        { id: 'gstr2b', label: 'GSTR-2B મેળવણી', prompt: 'એવું ટૂલ બનાવો જેમાં હું મારું પરચેઝ રજિસ્ટર અને GSTR-2B ફાઇલ અપલોડ કરું. સપ્લાયર GSTIN અને ઇન્વૉઇસ નંબરથી બંનેને મેળવે, પછી જે ન મળ્યા તેની અને જેમની પાસે પૂછપરછ કરવી છે તે સપ્લાયરોની યાદી બતાવે.' },
        { id: 'delivery-proof', label: 'ડિલિવરીનો પુરાવો (ફોન પર)', prompt: 'મારા ડ્રાઇવરો માટે મોબાઇલ ઍપ બનાવો. તેઓ ડિલિવરી પસંદ કરે, સહી કરેલી LR કૉપીનો ફોટો લે, અને ઑફિસ એક યાદીમાં જુએ કે શું ડિલિવર થયું અને શું બાકી છે.' },
      ],
      software: [
        { id: 'saas-plans', label: 'સબ્સ્ક્રિપ્શન પ્રોડક્ટ', prompt: 'એક સબ્સ્ક્રિપ્શન વેબ એપ બનાવો. ત્રણ માસિક પ્લાન સાથેનું પબ્લિક પ્રાઇસિંગ પેજ, સાઇન-અપ અને લૉગિન પેજ, એક એકાઉન્ટ પેજ જ્યાં ગ્રાહક પોતાનો પ્લાન અને બિલિંગની સ્થિતિ જુએ અને પ્લાન બદલી શકે, અને એક એડમિન પેજ જેમાં દરેક ગ્રાહક, તેનો પ્લાન અને જોડાવાની તારીખ દેખાય.' },
        { id: 'marketplace', label: 'માર્કેટપ્લેસ', prompt: 'એક બે-બાજુનું માર્કેટપ્લેસ બનાવો. વેચનાર સાઇન-અપ કરીને ફોટા, વર્ણન અને કિંમત સાથે પોતાની સેવા લિસ્ટ કરે. ખરીદનાર લિસ્ટિંગ જુએ, શ્રેણી પ્રમાણે શોધે અને ફિલ્ટર કરે, અને બુકિંગ વિનંતી મોકલે. એડમિન પેજ પર બધા વેચનાર, લિસ્ટિંગ અને વિનંતીઓ દેખાય.' },
        { id: 'mobile-idea', label: 'મોબાઇલ એપનો વિચાર', prompt: 'એક મોબાઇલ એપ બનાવો. એક વેલકમ સ્ક્રીન, સાઇન-ઇન સ્ક્રીન, હોમ સ્ક્રીન જેમાં યુઝર્સે ઉમેરેલી વસ્તુઓ દેખાય, ફોટો અને નોંધ સાથે નવી વસ્તુ ઉમેરવાની સ્ક્રીન, અને પ્રોફાઇલ સ્ક્રીન. ડિઝાઇન સાફ અને સરળ રાખો.' },
      ],
      student: [
        { id: 'placement-tracker', label: 'પ્લેસમેન્ટ ટ્રેકર', prompt: 'કૅમ્પસ પ્લેસમેન્ટ ટ્રૅક કરવા માટે મોબાઇલ ઍપ બનાવો: કંપનીઓ, રાઉન્ડ, તારીખો, પરિણામ અને તૈયારીની નોંધો.' },
        { id: 'tuition-manager', label: 'ટ્યુશન ક્લાસ મેનેજર', prompt: 'બૅચ, હાજરી, માસિક ફી બાકી અને વાલીઓની સંપર્ક યાદી સાથે ટ્યુશન ક્લાસ મેનેજર બનાવો.' },
        { id: 'wedding-rsvp', label: 'લગ્નની વેબસાઇટ (RSVP)', prompt: 'લગ્નની વેબસાઇટ બનાવો જેમાં દરેક પ્રસંગનું આમંત્રણ પેજ, સ્થળનો નકશો લિંક, RSVP ફોર્મ અને મહેમાનોની યાદી ગણતરી સાથે હોય.' },
      ],
    },
    readoutPrefix: 'અમે સમજ્યા:',
    readoutFix: 'ખોટું? બદલો',
    audienceName: { business: 'વ્યવસાયના માલિક', software: 'નિર્માતા', student: 'વિદ્યાર્થી', other: 'તમારું કામ' },
    thinking: 'સમજી રહ્યા છીએ…',
    unsure: 'થોડું વધુ જણાવશો?',
    disclosure: 'તમે અહીં જે લખો છો તે એક AI વાંચે છે જેથી આ પેજ તમારા માટે બદલાય. કૃપા કરીને નામ, ફોન નંબર કે ઇમેઇલ ન લખો.',
    planTitle: 'અમે સૌથી પહેલાં આ બનાવીશું',
    planScreens: 'સ્ક્રીન',
    planData: 'આનો હિસાબ રાખશે',
    planFirstWin: 'પહેલું વર્ઝન',
    planLoading: 'તમારી ઍપની રૂપરેખા બનાવી રહ્યા છીએ…',
    planNote: 'તમે લખ્યા મુજબ એક ટૂંકી રૂપરેખા. વાસ્તવિક પ્લાન તમે બનાવવાનું શરૂ કરો ત્યારે બને છે.',
    planKinds: { web_app: 'વેબ ઍપ', mobile_app: 'મોબાઇલ ઍપ', website: 'વેબસાઇટ', saas: 'SaaS' },
  },
}

/** Per-key fallback to English, like the rest of the i18n layer. */
export function copyFor(lang: IntentLang): IntentCopy {
  return INTENT_COPY[lang] ?? INTENT_COPY.en
}
