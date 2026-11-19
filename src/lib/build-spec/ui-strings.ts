import type { LangId } from './types'

// The fixed words every generated site shows outside the owner's copy: form labels, footer headings, privacy and terms text.
// Hindi and Gujarati are written plainly, in everyday words. They have NOT been reviewed by a native speaker: have one read them
// before the site is described as translated.

export interface UiStrings {
  label: string
  skip: string; name: string; contact: string; message: string; consent: string
  explore: string; privacy: string; terms: string; privacyText: string; termsText: string
  area: string; address: string; hours: string; phone: string; email: string; maps: string
  hello: string; subject: string; language: string
}

export const UI: Record<LangId, UiStrings> = {
  en: {
    label: 'EN', skip: 'Skip to content', name: 'Your name', contact: 'Phone or email', message: 'How can we help?',
    consent: 'We use your details only to reply to your enquiry.', explore: 'Explore', privacy: 'Privacy', terms: 'Terms',
    privacyText: 'When you send an enquiry we use your details only to reply to you. We do not sell them or share them for advertising.',
    termsText: 'Information on this site is general and may change. Please contact us to confirm anything before you rely on it.',
    area: 'Area', address: 'Address', hours: 'Hours', phone: 'Phone', email: 'Email', maps: 'Open in maps',
    hello: 'Hello, I found your website.', subject: 'Website enquiry', language: 'Language',
  },
  hi: {
    label: 'हिन्दी', skip: 'सामग्री पर जाएँ', name: 'आपका नाम', contact: 'फ़ोन या ईमेल', message: 'हम आपकी कैसे मदद कर सकते हैं?',
    consent: 'हम आपकी जानकारी का उपयोग केवल आपकी पूछताछ का उत्तर देने के लिए करते हैं।', explore: 'देखें', privacy: 'गोपनीयता', terms: 'शर्तें',
    privacyText: 'जब आप पूछताछ भेजते हैं, तो हम आपकी जानकारी का उपयोग केवल आपको उत्तर देने के लिए करते हैं। हम इसे बेचते नहीं हैं और विज्ञापन के लिए साझा नहीं करते।',
    termsText: 'इस साइट की जानकारी सामान्य है और बदल सकती है। किसी भी बात पर भरोसा करने से पहले कृपया हमसे पुष्टि कर लें।',
    area: 'क्षेत्र', address: 'पता', hours: 'समय', phone: 'फ़ोन', email: 'ईमेल', maps: 'नक्शे में खोलें',
    hello: 'नमस्ते, मुझे आपकी वेबसाइट मिली।', subject: 'वेबसाइट से पूछताछ', language: 'भाषा',
  },
  gu: {
    label: 'ગુજરાતી', skip: 'સામગ્રી પર જાઓ', name: 'તમારું નામ', contact: 'ફોન અથવા ઈમેલ', message: 'અમે તમને કેવી રીતે મદદ કરી શકીએ?',
    consent: 'અમે તમારી વિગતોનો ઉપયોગ ફક્ત તમારી પૂછપરછનો જવાબ આપવા માટે કરીએ છીએ.', explore: 'જુઓ', privacy: 'ગોપનીયતા', terms: 'શરતો',
    privacyText: 'જ્યારે તમે પૂછપરછ મોકલો છો, ત્યારે અમે તમારી વિગતોનો ઉપયોગ ફક્ત તમને જવાબ આપવા માટે કરીએ છીએ. અમે તેને વેચતા નથી અને જાહેરાત માટે શેર કરતા નથી.',
    termsText: 'આ સાઇટની માહિતી સામાન્ય છે અને બદલાઈ શકે છે. કોઈ પણ બાબત પર આધાર રાખતા પહેલાં કૃપા કરીને અમારી સાથે પુષ્ટિ કરો.',
    area: 'વિસ્તાર', address: 'સરનામું', hours: 'સમય', phone: 'ફોન', email: 'ઈમેલ', maps: 'નકશામાં ખોલો',
    hello: 'નમસ્તે, મને તમારી વેબસાઇટ મળી.', subject: 'વેબસાઇટ પરથી પૂછપરછ', language: 'ભાષા',
  },
}
