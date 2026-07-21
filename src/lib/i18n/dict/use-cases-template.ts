import type { Locale } from '../locales'

// AI-drafted, not yet native-reviewed (see AutoTranslateNotice). Chrome
// unique to the /use-cases/[slug] detail page — shared nav bits (Use Cases,
// Pricing, Try free, Home, See pricing, Learn more) are reused from
// dict/build-template.ts (BUILD_TEMPLATE_STRINGS) since both pages share
// the same nav/breadcrumb pattern.
export const USE_CASES_TEMPLATE_STRINGS: Record<Locale, Record<string, string>> = {
  en: {
    breadcrumbUseCases: 'Use Cases',
    everythingYouNeed: "Everything you need, nothing you don't",
    starterPromptEyebrow: 'Ready-to-use starter prompt',
    starterPromptHeading: 'Copy this prompt and paste it into WyberAi',
    tryThisPromptFree: 'Try this prompt free →',
    faqHeading: 'Frequently asked questions',
    ctaFooterHeading: 'Start building for free — 50 credits/month',
    ctaFooterBody: 'No credit card required. Your first app in minutes.',
    compareWyberAi: 'Compare WyberAi',
    vsPrefix: 'vs',
  },
  hi: {
    breadcrumbUseCases: 'यूज़ केस',
    everythingYouNeed: 'जो चाहिए वो सब, बाक़ी कुछ नहीं',
    starterPromptEyebrow: 'तैयार स्टार्टर प्रॉम्प्ट',
    starterPromptHeading: 'यह प्रॉम्प्ट कॉपी करें और WyberAi में पेस्ट करें',
    tryThisPromptFree: 'यह प्रॉम्प्ट मुफ़्त में आज़माएं →',
    faqHeading: 'अक्सर पूछे जाने वाले सवाल',
    ctaFooterHeading: 'मुफ़्त में बनाना शुरू करें — हर महीने 50 क्रेडिट्स',
    ctaFooterBody: 'किसी क्रेडिट कार्ड की ज़रूरत नहीं। आपका पहला ऐप मिनटों में।',
    compareWyberAi: 'WyberAi की तुलना करें',
    vsPrefix: 'बनाम',
  },
  kn: {
    breadcrumbUseCases: 'ಬಳಕೆಯ ಸಂದರ್ಭಗಳು',
    everythingYouNeed: 'ನಿಮಗೆ ಬೇಕಾದ ಎಲ್ಲವೂ, ಬೇಡದ್ದು ಏನೂ ಇಲ್ಲ',
    starterPromptEyebrow: 'ಬಳಸಲು ಸಿದ್ಧವಾದ ಸ್ಟಾರ್ಟರ್ ಪ್ರಾಂಪ್ಟ್',
    starterPromptHeading: 'ಈ ಪ್ರಾಂಪ್ಟ್ ಅನ್ನು ನಕಲಿಸಿ ಮತ್ತು WyberAi ನಲ್ಲಿ ಪೇಸ್ಟ್ ಮಾಡಿ',
    tryThisPromptFree: 'ಈ ಪ್ರಾಂಪ್ಟ್ ಅನ್ನು ಉಚಿತವಾಗಿ ಪ್ರಯತ್ನಿಸಿ →',
    faqHeading: 'ಪದೇ ಪದೇ ಕೇಳಲಾಗುವ ಪ್ರಶ್ನೆಗಳು',
    ctaFooterHeading: 'ಉಚಿತವಾಗಿ ನಿರ್ಮಿಸಲು ಪ್ರಾರಂಭಿಸಿ — ತಿಂಗಳಿಗೆ 50 ಕ್ರೆಡಿಟ್‌ಗಳು',
    ctaFooterBody: 'ಕ್ರೆಡಿಟ್ ಕಾರ್ಡ್ ಅಗತ್ಯವಿಲ್ಲ. ನಿಮ್ಮ ಮೊದಲ ಆ್ಯಪ್ ನಿಮಿಷಗಳಲ್ಲಿ.',
    compareWyberAi: 'WyberAi ಅನ್ನು ಹೋಲಿಸಿ',
    vsPrefix: 'vs',
  },
  te: {
    breadcrumbUseCases: 'వినియోగ కేసులు',
    everythingYouNeed: 'మీకు కావలసినదంతా, అనవసరమైనది ఏమీ లేదు',
    starterPromptEyebrow: 'ఉపయోగించడానికి సిద్ధమైన స్టార్టర్ ప్రాంప్ట్',
    starterPromptHeading: 'ఈ ప్రాంప్ట్‌ను కాపీ చేసి WyberAiలో పేస్ట్ చేయండి',
    tryThisPromptFree: 'ఈ ప్రాంప్ట్‌ను ఉచితంగా ప్రయత్నించండి →',
    faqHeading: 'తరచుగా అడిగే ప్రశ్నలు',
    ctaFooterHeading: 'ఉచితంగా నిర్మించడం ప్రారంభించండి — నెలకు 50 క్రెడిట్‌లు',
    ctaFooterBody: 'క్రెడిట్ కార్డ్ అవసరం లేదు. మీ మొదటి యాప్ నిమిషాల్లో.',
    compareWyberAi: 'WyberAiని పోల్చండి',
    vsPrefix: 'vs',
  },
  ta: {
    breadcrumbUseCases: 'பயன்பாட்டு நிகழ்வுகள்',
    everythingYouNeed: 'உங்களுக்குத் தேவையான அனைத்தும், தேவையற்றது ஒன்றும் இல்லை',
    starterPromptEyebrow: 'பயன்படுத்தத் தயாரான ஸ்டார்ட்டர் ப்ராம்ப்ட்',
    starterPromptHeading: 'இந்த ப்ராம்ப்ட்டை நகலெடுத்து WyberAi இல் ஒட்டவும்',
    tryThisPromptFree: 'இந்த ப்ராம்ப்ட்டை இலவசமாக முயற்சிக்கவும் →',
    faqHeading: 'அடிக்கடி கேட்கப்படும் கேள்விகள்',
    ctaFooterHeading: 'இலவசமாக உருவாக்கத் தொடங்குங்கள் — மாதம் 50 கிரெடிட்கள்',
    ctaFooterBody: 'கிரெடிட் கார்டு தேவையில்லை. உங்கள் முதல் ஆப் நிமிடங்களில்.',
    compareWyberAi: 'WyberAi ஐ ஒப்பிடுங்கள்',
    vsPrefix: 'vs',
  },
}
