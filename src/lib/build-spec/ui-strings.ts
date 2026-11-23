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
  mr: {
    label: 'मराठी', skip: 'मजकुराकडे जा', name: 'तुमचे नाव', contact: 'फोन किंवा ईमेल', message: 'आम्ही तुम्हाला कशी मदत करू शकतो?',
    consent: 'आम्ही तुमची माहिती फक्त तुमच्या चौकशीला उत्तर देण्यासाठी वापरतो.', explore: 'पाहा', privacy: 'गोपनीयता', terms: 'अटी',
    privacyText: 'तुम्ही चौकशी पाठवता तेव्हा आम्ही तुमची माहिती फक्त तुम्हाला उत्तर देण्यासाठी वापरतो. आम्ही ती विकत नाही आणि जाहिरातींसाठी शेअर करत नाही.',
    termsText: 'या साइटवरील माहिती सर्वसाधारण आहे आणि बदलू शकते. कोणत्याही गोष्टीवर अवलंबून राहण्यापूर्वी कृपया आमच्याकडून खात्री करून घ्या.',
    area: 'परिसर', address: 'पत्ता', hours: 'वेळ', phone: 'फोन', email: 'ईमेल', maps: 'नकाशात उघडा',
    hello: 'नमस्कार, मला तुमची वेबसाइट सापडली.', subject: 'वेबसाइटवरून चौकशी', language: 'भाषा',
  },
  gu: {
    label: 'ગુજરાતી', skip: 'સામગ્રી પર જાઓ', name: 'તમારું નામ', contact: 'ફોન અથવા ઈમેલ', message: 'અમે તમને કેવી રીતે મદદ કરી શકીએ?',
    consent: 'અમે તમારી વિગતોનો ઉપયોગ ફક્ત તમારી પૂછપરછનો જવાબ આપવા માટે કરીએ છીએ.', explore: 'જુઓ', privacy: 'ગોપનીયતા', terms: 'શરતો',
    privacyText: 'જ્યારે તમે પૂછપરછ મોકલો છો, ત્યારે અમે તમારી વિગતોનો ઉપયોગ ફક્ત તમને જવાબ આપવા માટે કરીએ છીએ. અમે તેને વેચતા નથી અને જાહેરાત માટે શેર કરતા નથી.',
    termsText: 'આ સાઇટની માહિતી સામાન્ય છે અને બદલાઈ શકે છે. કોઈ પણ બાબત પર આધાર રાખતા પહેલાં કૃપા કરીને અમારી સાથે પુષ્ટિ કરો.',
    area: 'વિસ્તાર', address: 'સરનામું', hours: 'સમય', phone: 'ફોન', email: 'ઈમેલ', maps: 'નકશામાં ખોલો',
    hello: 'નમસ્તે, મને તમારી વેબસાઇટ મળી.', subject: 'વેબસાઇટ પરથી પૂછપરછ', language: 'ભાષા',
  },
  ta: {
    label: 'தமிழ்', skip: 'உள்ளடக்கத்திற்குச் செல்', name: 'உங்கள் பெயர்', contact: 'தொலைபேசி அல்லது மின்னஞ்சல்', message: 'நாங்கள் எப்படி உதவலாம்?',
    consent: 'உங்கள் விவரங்களை உங்கள் விசாரணைக்குப் பதிலளிக்க மட்டுமே பயன்படுத்துகிறோம்.', explore: 'பார்க்க', privacy: 'தனியுரிமை', terms: 'நிபந்தனைகள்',
    privacyText: 'நீங்கள் விசாரணை அனுப்பும்போது, உங்களுக்குப் பதிலளிக்க மட்டுமே உங்கள் விவரங்களைப் பயன்படுத்துகிறோம். அவற்றை விற்பதில்லை, விளம்பரத்திற்காகப் பகிர்வதில்லை.',
    termsText: 'இந்தத் தளத்தில் உள்ள தகவல்கள் பொதுவானவை; மாறக்கூடும். எதையும் நம்புவதற்கு முன் எங்களிடம் உறுதிசெய்து கொள்ளவும்.',
    area: 'பகுதி', address: 'முகவரி', hours: 'நேரம்', phone: 'தொலைபேசி', email: 'மின்னஞ்சல்', maps: 'வரைபடத்தில் திற',
    hello: 'வணக்கம், உங்கள் இணையதளத்தைப் பார்த்தேன்.', subject: 'இணையதளம் வழி விசாரணை', language: 'மொழி',
  },
  te: {
    label: 'తెలుగు', skip: 'కంటెంట్‌కు వెళ్లండి', name: 'మీ పేరు', contact: 'ఫోన్ లేదా ఇమెయిల్', message: 'మేము మీకు ఎలా సహాయం చేయగలం?',
    consent: 'మీ వివరాలను మీ విచారణకు సమాధానం ఇవ్వడానికి మాత్రమే ఉపయోగిస్తాము.', explore: 'చూడండి', privacy: 'గోప్యత', terms: 'నిబంధనలు',
    privacyText: 'మీరు విచారణ పంపినప్పుడు, మీకు సమాధానం ఇవ్వడానికి మాత్రమే మీ వివరాలను ఉపయోగిస్తాము. వాటిని అమ్మము, ప్రకటనల కోసం పంచుకోము.',
    termsText: 'ఈ సైట్‌లోని సమాచారం సాధారణమైనది, మారవచ్చు. దేనిపైనైనా ఆధారపడే ముందు దయచేసి మమ్మల్ని సంప్రదించి నిర్ధారించుకోండి.',
    area: 'ప్రాంతం', address: 'చిరునామా', hours: 'సమయం', phone: 'ఫోన్', email: 'ఇమెయిల్', maps: 'మ్యాప్‌లో తెరవండి',
    hello: 'నమస్కారం, మీ వెబ్‌సైట్ చూశాను.', subject: 'వెబ్‌సైట్ ద్వారా విచారణ', language: 'భాష',
  },
  kn: {
    label: 'ಕನ್ನಡ', skip: 'ವಿಷಯಕ್ಕೆ ಹೋಗಿ', name: 'ನಿಮ್ಮ ಹೆಸರು', contact: 'ಫೋನ್ ಅಥವಾ ಇಮೇಲ್', message: 'ನಾವು ನಿಮಗೆ ಹೇಗೆ ಸಹಾಯ ಮಾಡಬಹುದು?',
    consent: 'ನಿಮ್ಮ ವಿವರಗಳನ್ನು ನಿಮ್ಮ ವಿಚಾರಣೆಗೆ ಉತ್ತರಿಸಲು ಮಾತ್ರ ಬಳಸುತ್ತೇವೆ.', explore: 'ನೋಡಿ', privacy: 'ಗೌಪ್ಯತೆ', terms: 'ನಿಯಮಗಳು',
    privacyText: 'ನೀವು ವಿಚಾರಣೆ ಕಳುಹಿಸಿದಾಗ, ನಿಮಗೆ ಉತ್ತರಿಸಲು ಮಾತ್ರ ನಿಮ್ಮ ವಿವರಗಳನ್ನು ಬಳಸುತ್ತೇವೆ. ಅವುಗಳನ್ನು ಮಾರುವುದಿಲ್ಲ, ಜಾಹೀರಾತಿಗಾಗಿ ಹಂಚುವುದಿಲ್ಲ.',
    termsText: 'ಈ ಸೈಟ್‌ನಲ್ಲಿರುವ ಮಾಹಿತಿ ಸಾಮಾನ್ಯವಾದದ್ದು ಮತ್ತು ಬದಲಾಗಬಹುದು. ಯಾವುದನ್ನಾದರೂ ನಂಬುವ ಮೊದಲು ದಯವಿಟ್ಟು ನಮ್ಮನ್ನು ಸಂಪರ್ಕಿಸಿ ಖಚಿತಪಡಿಸಿಕೊಳ್ಳಿ.',
    area: 'ಪ್ರದೇಶ', address: 'ವಿಳಾಸ', hours: 'ಸಮಯ', phone: 'ಫೋನ್', email: 'ಇಮೇಲ್', maps: 'ನಕ್ಷೆಯಲ್ಲಿ ತೆರೆಯಿರಿ',
    hello: 'ನಮಸ್ಕಾರ, ನಿಮ್ಮ ವೆಬ್‌ಸೈಟ್ ನೋಡಿದೆ.', subject: 'ವೆಬ್‌ಸೈಟ್ ಮೂಲಕ ವಿಚಾರಣೆ', language: 'ಭಾಷೆ',
  },
  bn: {
    label: 'বাংলা', skip: 'বিষয়বস্তুতে যান', name: 'আপনার নাম', contact: 'ফোন বা ইমেল', message: 'আমরা কীভাবে সাহায্য করতে পারি?',
    consent: 'আমরা আপনার তথ্য শুধু আপনার জিজ্ঞাসার উত্তর দিতে ব্যবহার করি।', explore: 'দেখুন', privacy: 'গোপনীয়তা', terms: 'শর্তাবলী',
    privacyText: 'আপনি জিজ্ঞাসা পাঠালে আমরা আপনার তথ্য শুধু আপনাকে উত্তর দিতে ব্যবহার করি। আমরা তা বিক্রি করি না বা বিজ্ঞাপনের জন্য শেয়ার করি না।',
    termsText: 'এই সাইটের তথ্য সাধারণ এবং বদলাতে পারে। কোনো কিছুর ওপর নির্ভর করার আগে অনুগ্রহ করে আমাদের সঙ্গে নিশ্চিত হয়ে নিন।',
    area: 'এলাকা', address: 'ঠিকানা', hours: 'সময়', phone: 'ফোন', email: 'ইমেল', maps: 'মানচিত্রে খুলুন',
    hello: 'নমস্কার, আপনার ওয়েবসাইট দেখলাম।', subject: 'ওয়েবসাইট থেকে জিজ্ঞাসা', language: 'ভাষা',
  },
}
