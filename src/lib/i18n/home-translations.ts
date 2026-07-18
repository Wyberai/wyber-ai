import type { Locale } from './locales';

// AI-drafted first-pass translations for the homepage hero + nav — the
// highest-traffic, above-the-fold content. NOT yet native-reviewed: treat
// hi/kn/te/ta strings here as a starting point for a native speaker to
// correct, not as launch-ready copy (see the localization plan — regional
// creators are the intended reviewers before this goes live).
//
// Scope is deliberately limited to the hero + nav for now, not the full
// homepage or the dashboard/editor — see conversation notes on why the
// editor's own chrome is a separate, larger, ongoing effort.
export interface HomeStrings {
  navWebApps: string;
  navMobileApps: string;
  navJourney: string;
  navPricing: string;
  signIn: string;
  startFree: string;
  eyebrowStrike: string;
  eyebrowMain: string;
  heroLine1: string;
  heroLine2: string;
  heroLead: string;
  heroPlaceholder: string;
  targetWeb: string;
  targetMobile: string;
  ctaBuild: string;
  watchDemo: string;
  creditsLine: (price: string) => string;
  trustLine: string;
  upiLine: string;
}

export const HOME_STRINGS: Record<Locale, HomeStrings> = {
  en: {
    navWebApps: 'Web Apps',
    navMobileApps: 'Mobile Apps',
    navJourney: 'Journey',
    navPricing: 'Pricing',
    signIn: 'Sign in',
    startFree: 'Start free →',
    eyebrowStrike: 'THE FASTEST',
    eyebrowMain: 'THE MOST SECURE APP BUILDER',
    heroLine1: 'Think of an app idea.',
    heroLine2: 'Bring it to life.',
    heroLead: 'Web or mobile — same prompt, you pick the target. Self-healing builds. Live database security scans. The right AI model chosen for every task — automatically. Other builders generate code and hope. WyberAi engineers it.',
    heroPlaceholder: 'Describe your app… e.g. an expense tracker for freelancers with invoices',
    targetWeb: 'Web app',
    targetMobile: 'Mobile app',
    ctaBuild: 'Build it — free →',
    watchDemo: 'Watch the demo',
    creditsLine: (price) => `50 FREE CREDITS · NO CARD · FROM ${price}/MO`,
    trustLine: 'A US-registered company · SignalPulse Technologies, Wyoming',
    upiLine: 'Pay with UPI',
  },
  hi: {
    navWebApps: 'वेब ऐप्स',
    navMobileApps: 'मोबाइल ऐप्स',
    navJourney: 'जर्नी',
    navPricing: 'प्राइसिंग',
    signIn: 'साइन इन',
    startFree: 'फ्री शुरू करें →',
    eyebrowStrike: 'सबसे तेज़',
    eyebrowMain: 'सबसे सुरक्षित ऐप बिल्डर',
    heroLine1: 'ऐप का आइडिया सोचें।',
    heroLine2: 'उसे हकीकत बनाएं।',
    heroLead: 'वेब हो या मोबाइल — एक ही प्रॉम्प्ट से, टारगेट आप चुनें। खुद-ब-खुद ठीक होने वाले बिल्ड। लाइव डेटाबेस सिक्योरिटी स्कैन। हर टास्क के लिए सही AI मॉडल — अपने आप चुना जाता है। बाकी बिल्डर कोड बनाकर उम्मीद करते हैं। WyberAi उसे इंजीनियर करता है।',
    heroPlaceholder: 'अपना ऐप बताएं… जैसे फ्रीलांसर्स के लिए इनवॉइस वाला एक्सपेंस ट्रैकर',
    targetWeb: 'वेब ऐप',
    targetMobile: 'मोबाइल ऐप',
    ctaBuild: 'बनाएं — फ्री में →',
    watchDemo: 'डेमो देखें',
    creditsLine: (price) => `50 फ्री क्रेडिट्स · कार्ड की ज़रूरत नहीं · ${price}/माह से शुरू`,
    trustLine: 'एक US-रजिस्टर्ड कंपनी · SignalPulse Technologies, Wyoming',
    upiLine: 'UPI से पेमेंट करें',
  },
  kn: {
    navWebApps: 'ವೆಬ್ ಆ್ಯಪ್‌ಗಳು',
    navMobileApps: 'ಮೊಬೈಲ್ ಆ್ಯಪ್‌ಗಳು',
    navJourney: 'ಜರ್ನಿ',
    navPricing: 'ಬೆಲೆ',
    signIn: 'ಸೈನ್ ಇನ್',
    startFree: 'ಫ್ರೀ ಆಗಿ ಪ್ರಾರಂಭಿಸಿ →',
    eyebrowStrike: 'ಅತಿ ವೇಗದ',
    eyebrowMain: 'ಅತ್ಯಂತ ಸುರಕ್ಷಿತ ಆ್ಯಪ್ ಬಿಲ್ಡರ್',
    heroLine1: 'ಆ್ಯಪ್ ಐಡಿಯಾ ಯೋಚಿಸಿ.',
    heroLine2: 'ಅದನ್ನು ನಿಜಗೊಳಿಸಿ.',
    heroLead: 'ವೆಬ್ ಆಗಿರಲಿ ಅಥವಾ ಮೊಬೈಲ್ — ಅದೇ ಪ್ರಾಂಪ್ಟ್‌ನಿಂದ, ಟಾರ್ಗೆಟ್ ನೀವೇ ಆಯ್ಕೆ ಮಾಡಿ. ತಾನಾಗಿಯೇ ಸರಿಪಡಿಸಿಕೊಳ್ಳುವ ಬಿಲ್ಡ್‌ಗಳು. ಲೈವ್ ಡೇಟಾಬೇಸ್ ಸೆಕ್ಯುರಿಟಿ ಸ್ಕ್ಯಾನ್‌ಗಳು. ಪ್ರತಿ ಕೆಲಸಕ್ಕೂ ಸರಿಯಾದ AI ಮಾಡೆಲ್ — ತಾನಾಗಿಯೇ ಆಯ್ಕೆಯಾಗುತ್ತದೆ. ಬೇರೆ ಬಿಲ್ಡರ್‌ಗಳು ಕೋಡ್ ಬರೆದು ನಿರೀಕ್ಷಿಸುತ್ತವೆ. WyberAi ಅದನ್ನು ಎಂಜಿನಿಯರ್ ಮಾಡುತ್ತದೆ.',
    heroPlaceholder: 'ನಿಮ್ಮ ಆ್ಯಪ್ ವಿವರಿಸಿ… ಉದಾ. ಫ್ರೀಲಾನ್ಸರ್‌ಗಳಿಗಾಗಿ ಇನ್‌ವಾಯ್ಸ್ ಇರುವ ಖರ್ಚು ಟ್ರ್ಯಾಕರ್',
    targetWeb: 'ವೆಬ್ ಆ್ಯಪ್',
    targetMobile: 'ಮೊಬೈಲ್ ಆ್ಯಪ್',
    ctaBuild: 'ಫ್ರೀ ಆಗಿ ಬಿಲ್ಡ್ ಮಾಡಿ →',
    watchDemo: 'ಡೆಮೊ ನೋಡಿ',
    creditsLine: (price) => `50 ಫ್ರೀ ಕ್ರೆಡಿಟ್‌ಗಳು · ಕಾರ್ಡ್ ಬೇಡ · ${price}/ತಿಂಗಳಿಂದ ಪ್ರಾರಂಭ`,
    trustLine: 'US-ನೋಂದಾಯಿತ ಕಂಪನಿ · SignalPulse Technologies, Wyoming',
    upiLine: 'UPI ಮೂಲಕ ಪಾವತಿಸಿ',
  },
  te: {
    navWebApps: 'వెబ్ యాప్‌లు',
    navMobileApps: 'మొబైల్ యాప్‌లు',
    navJourney: 'జర్నీ',
    navPricing: 'ధర',
    signIn: 'సైన్ ఇన్',
    startFree: 'ఫ్రీగా ప్రారంభించండి →',
    eyebrowStrike: 'అత్యంత వేగవంతమైన',
    eyebrowMain: 'అత్యంత సురక్షితమైన యాప్ బిల్డర్',
    heroLine1: 'యాప్ ఐడియా ఆలోచించండి.',
    heroLine2: 'దాన్ని నిజం చేయండి.',
    heroLead: 'వెబ్ అయినా మొబైల్ అయినా — అదే ప్రాంప్ట్‌తో, టార్గెట్ మీరే ఎంచుకోండి. స్వయంగా సరిదిద్దుకునే బిల్డ్‌లు. లైవ్ డేటాబేస్ సెక్యూరిటీ స్కాన్‌లు. ప్రతి పనికీ సరైన AI మోడల్ — ఆటోమేటిక్‌గా ఎంపిక అవుతుంది. మిగతా బిల్డర్‌లు కోడ్ రాసి ఆశిస్తాయి. WyberAi దాన్ని ఇంజనీర్ చేస్తుంది.',
    heroPlaceholder: 'మీ యాప్‌ని వివరించండి… ఉదా. ఫ్రీలాన్సర్‌ల కోసం ఇన్‌వాయిస్‌లతో కూడిన ఎక్స్‌పెన్స్ ట్రాకర్',
    targetWeb: 'వెబ్ యాప్',
    targetMobile: 'మొబైల్ యాప్',
    ctaBuild: 'ఫ్రీగా బిల్డ్ చేయండి →',
    watchDemo: 'డెమో చూడండి',
    creditsLine: (price) => `50 ఫ్రీ క్రెడిట్‌లు · కార్డ్ అవసరం లేదు · ${price}/నెల నుండి`,
    trustLine: 'US-రిజిస్టర్డ్ కంపెనీ · SignalPulse Technologies, Wyoming',
    upiLine: 'UPI తో పే చేయండి',
  },
  ta: {
    navWebApps: 'வெப் ஆப்ஸ்',
    navMobileApps: 'மொபைல் ஆப்ஸ்',
    navJourney: 'ஜர்னி',
    navPricing: 'விலை',
    signIn: 'சைன் இன்',
    startFree: 'இலவசமாக தொடங்குங்கள் →',
    eyebrowStrike: 'மிக வேகமான',
    eyebrowMain: 'மிகவும் பாதுகாப்பான ஆப் பில்டர்',
    heroLine1: 'ஒரு ஆப் ஐடியாவை நினைத்துப் பாருங்கள்.',
    heroLine2: 'அதை நிஜமாக்குங்கள்.',
    heroLead: 'வெப் ஆனாலும் மொபைல் ஆனாலும் — ஒரே ப்ராம்ப்ட்டில், டார்கெட்டை நீங்களே தேர்ந்தெடுங்கள். தானாக சரிசெய்யும் பில்டுகள். லைவ் டேட்டாபேஸ் செக்யூரிட்டி ஸ்கேன்கள். ஒவ்வொரு வேலைக்கும் சரியான AI மாடல் — தானாகவே தேர்ந்தெடுக்கப்படுகிறது. மற்ற பில்டர்கள் கோட் எழுதிவிட்டு எதிர்பார்க்கின்றன. WyberAi அதை இன்ஜினியர் செய்கிறது.',
    heroPlaceholder: 'உங்கள் ஆப்பை விவரிக்கவும்… எ.கா. ஃப்ரீலான்சர்களுக்கான இன்வாய்ஸ் உள்ள எக்ஸ்பென்ஸ் டிராக்கர்',
    targetWeb: 'வெப் ஆப்',
    targetMobile: 'மொபைல் ஆப்',
    ctaBuild: 'இலவசமாக பில்டு செய்யுங்கள் →',
    watchDemo: 'டெமோவைப் பாருங்கள்',
    creditsLine: (price) => `50 இலவச கிரெடிட்கள் · கார்டு தேவையில்லை · ${price}/மாதம் முதல்`,
    trustLine: 'US-பதிவு செய்யப்பட்ட நிறுவனம் · SignalPulse Technologies, Wyoming',
    upiLine: 'UPI மூலம் பணம் செலுத்துங்கள்',
  },
};
