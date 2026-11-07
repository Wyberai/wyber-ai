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
  chips: Record<Door, Chip[]>
  readoutPrefix: string
  readoutFix: string
  audienceName: Record<Audience, string>
  thinking: string
  unsure: string
  disclosure: string
}

export const INTENT_COPY: Record<IntentLang, IntentCopy> = {
  en: {
    langName: 'English',
    label: "What's slowing your work down?",
    doors: { business: 'I run a business', software: 'I run a software company', student: "I'm a student" },
    chips: {
      business: [
        { id: 'job-work', label: 'Job-work challan tracker', prompt: 'Build a job-work tracker. I log a challan for goods sent to a job worker, record what comes back, and get a warning before the one-year return limit.' },
        { id: 'gstr2b', label: 'GSTR-2B matching', prompt: 'Build a tool where I upload my purchase register and my GSTR-2B file. Match them by supplier GSTIN and invoice number, then show the mismatches and a list of suppliers to chase.' },
        { id: 'delivery-proof', label: 'Delivery proof on a phone', prompt: 'Build a mobile app for my drivers. They pick a delivery, photograph the signed LR copy, and the office sees delivered or pending in one list.' },
      ],
      software: [
        { id: 'timesheet-invoice', label: 'Timesheet to invoice', prompt: 'Build a timesheet app where developers log hours per client project. Create a monthly invoice in USD with the rupee value, and show paid or unpaid status.' },
        { id: 'change-requests', label: 'Change-request log', prompt: 'Build a change-request tracker. I log each client request with estimated hours and price, the client approves it, and I mark it as billed.' },
        { id: 'client-prototype', label: 'Prototype for a client', prompt: 'Build a prototype for a pharma stockist to take retailer orders and track medicine expiry dates, with a login and an order status screen.' },
      ],
      student: [
        { id: 'placement-tracker', label: 'Placement tracker', prompt: 'Build a mobile app to track campus placements: companies, rounds, dates, results and prep notes.' },
        { id: 'tuition-manager', label: 'Tuition class manager', prompt: 'Build a tuition class manager with batches, attendance, monthly fee dues and a parent contact list.' },
        { id: 'wedding-rsvp', label: 'Wedding website with RSVP', prompt: 'Build a wedding website with an invitation page for each event, a venue map link, an RSVP form and a guest list with headcount.' },
      ],
    },
    readoutPrefix: 'We understood:',
    readoutFix: 'Not right? Change',
    audienceName: { business: 'Business owner', software: 'Software company', student: 'Student', other: 'Your work' },
    thinking: 'Understanding…',
    unsure: 'Tell us a little more?',
    disclosure: 'An AI reads what you type here so this page can adapt to you. Please do not write names, phone numbers or emails.',
  },

  hi: {
    langName: 'हिंदी',
    label: 'आप क्या ठीक करना चाहते हैं?',
    doors: { business: 'मेरा व्यवसाय है', software: 'मेरी सॉफ़्टवेयर कंपनी है', student: 'मैं विद्यार्थी हूँ' },
    chips: {
      business: [
        { id: 'job-work', label: 'जॉब-वर्क चालान ट्रैकर', prompt: 'एक जॉब-वर्क ट्रैकर बनाओ। मैं जॉब वर्कर को भेजे माल का चालान दर्ज करूँ, जो वापस आया उसे लिखूँ, और एक साल की वापसी सीमा से पहले चेतावनी मिले।' },
        { id: 'gstr2b', label: 'GSTR-2B मिलान', prompt: 'एक टूल बनाओ जिसमें मैं अपना परचेज़ रजिस्टर और GSTR-2B फ़ाइल अपलोड करूँ। सप्लायर GSTIN और इनवॉइस नंबर से दोनों को मिलाए, फिर जो नहीं मिले उनकी और जिन सप्लायरों से पूछना है उनकी सूची दिखाए।' },
        { id: 'delivery-proof', label: 'डिलीवरी का प्रमाण (फ़ोन पर)', prompt: 'मेरे ड्राइवरों के लिए एक मोबाइल ऐप बनाओ। वे डिलीवरी चुनें, साइन की हुई LR कॉपी की फ़ोटो लें, और ऑफ़िस एक सूची में देखे कि क्या डिलीवर हुआ और क्या बाकी है।' },
      ],
      software: [
        { id: 'timesheet-invoice', label: 'टाइमशीट से इनवॉइस', prompt: 'एक टाइमशीट ऐप बनाओ जहाँ डेवलपर हर क्लाइंट प्रोजेक्ट पर घंटे दर्ज करें। हर महीने USD में इनवॉइस बने, रुपये की कीमत के साथ, और भुगतान हुआ या बाकी दिखे।' },
        { id: 'change-requests', label: 'बदलाव-अनुरोध लॉग', prompt: 'एक चेंज-रिक्वेस्ट ट्रैकर बनाओ। मैं क्लाइंट का हर अनुरोध अनुमानित घंटे और कीमत के साथ दर्ज करूँ, क्लाइंट मंज़ूरी दे, और मैं उसे बिल हुआ चिह्नित करूँ।' },
        { id: 'client-prototype', label: 'क्लाइंट के लिए प्रोटोटाइप', prompt: 'एक फ़ार्मा स्टॉकिस्ट के लिए प्रोटोटाइप बनाओ जिसमें रिटेलर ऑर्डर दें और दवाओं की एक्सपायरी ट्रैक हो, लॉगिन और ऑर्डर स्टेटस स्क्रीन के साथ।' },
      ],
      student: [
        { id: 'placement-tracker', label: 'प्लेसमेंट ट्रैकर', prompt: 'कैंपस प्लेसमेंट ट्रैक करने के लिए एक मोबाइल ऐप बनाओ: कंपनियाँ, राउंड, तारीख़ें, नतीजे और तैयारी के नोट्स।' },
        { id: 'tuition-manager', label: 'ट्यूशन क्लास मैनेजर', prompt: 'बैच, उपस्थिति, मासिक फ़ीस बकाया और अभिभावकों की संपर्क सूची वाला ट्यूशन क्लास मैनेजर बनाओ।' },
        { id: 'wedding-rsvp', label: 'शादी की वेबसाइट (RSVP)', prompt: 'शादी की वेबसाइट बनाओ जिसमें हर कार्यक्रम का निमंत्रण पेज, वेन्यू का मैप लिंक, RSVP फ़ॉर्म और मेहमानों की सूची गिनती सहित हो।' },
      ],
    },
    readoutPrefix: 'हमने समझा:',
    readoutFix: 'ठीक नहीं? बदलें',
    audienceName: { business: 'व्यवसाय के मालिक', software: 'सॉफ़्टवेयर कंपनी', student: 'विद्यार्थी', other: 'आपका काम' },
    thinking: 'समझ रहे हैं…',
    unsure: 'थोड़ा और बताएँगे?',
    disclosure: 'आप यहाँ जो लिखते हैं उसे एक AI पढ़ता है ताकि यह पेज आपके हिसाब से बदले। कृपया नाम, फ़ोन नंबर या ईमेल न लिखें।',
  },

  gu: {
    langName: 'ગુજરાતી',
    label: 'તમે શું સુધારવા માંગો છો?',
    doors: { business: 'મારો વ્યવસાય છે', software: 'મારી સૉફ્ટવેર કંપની છે', student: 'હું વિદ્યાર્થી છું' },
    chips: {
      business: [
        { id: 'job-work', label: 'જોબ-વર્ક ચલણ ટ્રેકર', prompt: 'જોબ-વર્ક ટ્રેકર બનાવો. હું જોબ વર્કરને મોકલેલા માલનું ચલણ નોંધી શકું, જે પાછું આવ્યું તે લખી શકું, અને એક વર્ષની પરત-મર્યાદા પહેલાં ચેતવણી મળે.' },
        { id: 'gstr2b', label: 'GSTR-2B મેળવણી', prompt: 'એવું ટૂલ બનાવો જેમાં હું મારું પરચેઝ રજિસ્ટર અને GSTR-2B ફાઇલ અપલોડ કરું. સપ્લાયર GSTIN અને ઇન્વૉઇસ નંબરથી બંનેને મેળવે, પછી જે ન મળ્યા તેની અને જેમની પાસે પૂછપરછ કરવી છે તે સપ્લાયરોની યાદી બતાવે.' },
        { id: 'delivery-proof', label: 'ડિલિવરીનો પુરાવો (ફોન પર)', prompt: 'મારા ડ્રાઇવરો માટે મોબાઇલ ઍપ બનાવો. તેઓ ડિલિવરી પસંદ કરે, સહી કરેલી LR કૉપીનો ફોટો લે, અને ઑફિસ એક યાદીમાં જુએ કે શું ડિલિવર થયું અને શું બાકી છે.' },
      ],
      software: [
        { id: 'timesheet-invoice', label: 'ટાઇમશીટથી ઇન્વૉઇસ', prompt: 'ટાઇમશીટ ઍપ બનાવો જ્યાં ડેવલપર્સ દરેક ક્લાયન્ટ પ્રોજેક્ટ પર કલાકો નોંધે. દર મહિને USD માં ઇન્વૉઇસ બને, રૂપિયાની કિંમત સાથે, અને ચુકવણી થઈ કે બાકી તે દેખાય.' },
        { id: 'change-requests', label: 'ફેરફાર-વિનંતી લૉગ', prompt: 'ચેન્જ-રિક્વેસ્ટ ટ્રેકર બનાવો. હું ક્લાયન્ટની દરેક વિનંતી અંદાજિત કલાકો અને કિંમત સાથે નોંધું, ક્લાયન્ટ મંજૂરી આપે, અને હું તેને બિલ થયેલું ચિહ્નિત કરું.' },
        { id: 'client-prototype', label: 'ક્લાયન્ટ માટે પ્રોટોટાઇપ', prompt: 'ફાર્મા સ્ટૉકિસ્ટ માટે પ્રોટોટાઇપ બનાવો જેમાં રિટેલર્સ ઑર્ડર આપે અને દવાઓની એક્સપાયરી ટ્રૅક થાય, લૉગિન અને ઑર્ડર સ્ટેટસ સ્ક્રીન સાથે.' },
      ],
      student: [
        { id: 'placement-tracker', label: 'પ્લેસમેન્ટ ટ્રેકર', prompt: 'કૅમ્પસ પ્લેસમેન્ટ ટ્રૅક કરવા માટે મોબાઇલ ઍપ બનાવો: કંપનીઓ, રાઉન્ડ, તારીખો, પરિણામ અને તૈયારીની નોંધો.' },
        { id: 'tuition-manager', label: 'ટ્યુશન ક્લાસ મેનેજર', prompt: 'બૅચ, હાજરી, માસિક ફી બાકી અને વાલીઓની સંપર્ક યાદી સાથે ટ્યુશન ક્લાસ મેનેજર બનાવો.' },
        { id: 'wedding-rsvp', label: 'લગ્નની વેબસાઇટ (RSVP)', prompt: 'લગ્નની વેબસાઇટ બનાવો જેમાં દરેક પ્રસંગનું આમંત્રણ પેજ, સ્થળનો નકશો લિંક, RSVP ફોર્મ અને મહેમાનોની યાદી ગણતરી સાથે હોય.' },
      ],
    },
    readoutPrefix: 'અમે સમજ્યા:',
    readoutFix: 'ખોટું? બદલો',
    audienceName: { business: 'વ્યવસાયના માલિક', software: 'સૉફ્ટવેર કંપની', student: 'વિદ્યાર્થી', other: 'તમારું કામ' },
    thinking: 'સમજી રહ્યા છીએ…',
    unsure: 'થોડું વધુ જણાવશો?',
    disclosure: 'તમે અહીં જે લખો છો તે એક AI વાંચે છે જેથી આ પેજ તમારા માટે બદલાય. કૃપા કરીને નામ, ફોન નંબર કે ઇમેઇલ ન લખો.',
  },
}

/** Per-key fallback to English, like the rest of the i18n layer. */
export function copyFor(lang: IntentLang): IntentCopy {
  return INTENT_COPY[lang] ?? INTENT_COPY.en
}
