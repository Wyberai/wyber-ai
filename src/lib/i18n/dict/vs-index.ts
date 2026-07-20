import type { Locale } from '../locales'

// AI-drafted, not yet native-reviewed (see AutoTranslateNotice). Content for
// the locale-prefixed /vs index page (English source: src/app/vs/page.tsx).
// Proper nouns (WyberAi, competitor names, product names) are intentionally
// left untranslated; competitor slugs/urls/tags stay identical across locales
// (only `summary` and `wyberWins` are per-competitor translated content).
export interface VsIndexContent {
  metaTitle: string
  metaDescription: string
  eyebrow: string
  heroTitle: string
  heroBody: string
  productLabels: { label: string; sub: string }[]
  comparisons: Record<string, { summary: string; wyberWins: string[] }>
  seeComparison: string
  ctaHeading: string
  ctaBody: string
  ctaButton: string
}

export const VS_INDEX_CONTENT: Record<Locale, VsIndexContent> = {
  en: {
    metaTitle: 'WyberAi vs Competitors (2026) — Honest Comparisons',
    metaDescription: 'Compare WyberAi to Lovable, Bolt.new, v0, Replit, and Cursor. See how pricing, credits, and the six-product difference (web + mobile + agents + workflows + AI employees) stack up.',
    eyebrow: 'VERIFIED JUNE 2026',
    heroTitle: 'WyberAi vs Every Alternative',
    heroBody: 'Honest, up-to-date comparisons. WyberAi ships full-stack web apps and native mobile apps from one workspace — with deploy, integrations, and GitHub code ownership built in.',
    productLabels: [
      { label: 'Web Apps', sub: 'Full-stack React app' },
      { label: 'Mobile Apps', sub: 'React Native + Expo' },
      { label: '27 Integrations', sub: 'Supabase, Stripe, OpenAI...' },
      { label: 'One-click Deploy', sub: 'Live URL in seconds' },
      { label: 'GitHub Sync', sub: 'Own your code' },
      { label: 'Weekly Challenge', sub: '$500 in prizes' },
    ],
    comparisons: {
      lovable: { summary: 'WyberAi offers ~56% more credits at a lower price, plus mobile apps, agents, and workflows Lovable doesn\'t have.', wyberWins: ['300 credits/month on Builder ($99)', 'Top-ups never expire', 'Mobile + agents + workflows + AI employees + GTM', '6 products vs Lovable\'s 1'] },
      bolt: { summary: 'WyberAi uses fixed-credit pricing (no token surprises) and adds mobile apps, agents, and workflows Bolt doesn\'t offer.', wyberWins: ['Predictable fixed credits', 'Daily bonus credits', 'Guided for non-technical users', 'Mobile + agents + workflows'] },
      v0: { summary: 'v0 generates UI components. WyberAi generates complete full-stack apps — plus mobile, agents, and workflows.', wyberWins: ['Complete app in one generation', 'Database + auth included', 'No assembly required', 'Mobile + agents + workflows'] },
      replit: { summary: 'Replit is an IDE for developers. WyberAi is a no-code builder for founders — faster, cheaper, and more predictable.', wyberWins: ['No coding knowledge needed', 'Predictable fixed credits', '< 60 second app generation', 'Mobile + agents + workflows'] },
      cursor: { summary: 'Cursor makes developers faster. WyberAi builds complete apps from plain English — no developer needed.', wyberWins: ['Zero coding required', 'App in a few minutes', 'Live preview + one-click deploy', 'Mobile + agents + workflows'] },
      softr: { summary: 'Softr hosts your app on their platform from $269/mo for Business. WyberAi generates real React code you own — web + mobile — from $29/mo.', wyberWins: ['Real code, GitHub export, zero lock-in', 'Native mobile apps (React Native)', 'Live database security scan', 'A tenth of the price for solo founders'] },
    },
    seeComparison: 'See comparison →',
    ctaHeading: 'Try WyberAi free — 50 credits/month',
    ctaBody: 'Web app, mobile app, AI agent, or workflow. No credit card required.',
    ctaButton: 'Start building free →',
  },
  hi: {
    metaTitle: 'WyberAi बनाम प्रतिस्पर्धी (2026) — ईमानदार तुलना',
    metaDescription: 'WyberAi की तुलना Lovable, Bolt.new, v0, Replit, और Cursor से करें। देखें कीमत, क्रेडिट्स, और छह-प्रोडक्ट का अंतर (वेब + मोबाइल + एजेंट्स + वर्कफ़्लो + AI एम्प्लॉई) कैसे तुलना करता है।',
    eyebrow: 'जून 2026 में सत्यापित',
    heroTitle: 'WyberAi बनाम हर विकल्प',
    heroBody: 'ईमानदार, अप-टू-डेट तुलनाएं। WyberAi एक ही वर्कस्पेस से फुल-स्टैक वेब ऐप्स और नेटिव मोबाइल ऐप्स बनाता है — डिप्लॉय, इंटीग्रेशन, और GitHub कोड ओनरशिप सब शामिल।',
    productLabels: [
      { label: 'वेब ऐप्स', sub: 'फुल-स्टैक React ऐप' },
      { label: 'मोबाइल ऐप्स', sub: 'React Native + Expo' },
      { label: '27 इंटीग्रेशन', sub: 'Supabase, Stripe, OpenAI...' },
      { label: 'वन-क्लिक डिप्लॉय', sub: 'सेकंडों में लाइव URL' },
      { label: 'GitHub सिंक', sub: 'अपना कोड खुद रखें' },
      { label: 'साप्ताहिक चैलेंज', sub: '$500 के इनाम' },
    ],
    comparisons: {
      lovable: { summary: 'WyberAi कम कीमत में ~56% ज़्यादा क्रेडिट्स देता है, साथ ही मोबाइल ऐप्स, एजेंट्स, और वर्कफ़्लो जो Lovable के पास नहीं हैं।', wyberWins: ['Builder पर 300 क्रेडिट्स/माह ($99)', 'टॉप-अप कभी एक्सपायर नहीं होते', 'मोबाइल + एजेंट्स + वर्कफ़्लो + AI एम्प्लॉई + GTM', 'Lovable के 1 के मुक़ाबले 6 प्रोडक्ट'] },
      bolt: { summary: 'WyberAi फ़िक्स्ड-क्रेडिट प्राइसिंग इस्तेमाल करता है (कोई टोकन सरप्राइज़ नहीं) और मोबाइल ऐप्स, एजेंट्स, और वर्कफ़्लो जोड़ता है जो Bolt नहीं देता।', wyberWins: ['अनुमानित फ़िक्स्ड क्रेडिट्स', 'डेली बोनस क्रेडिट्स', 'गैर-तकनीकी यूज़र्स के लिए गाइडेड', 'मोबाइल + एजेंट्स + वर्कफ़्लो'] },
      v0: { summary: 'v0 UI कंपोनेंट्स बनाता है। WyberAi पूरे फुल-स्टैक ऐप्स बनाता है — साथ ही मोबाइल, एजेंट्स, और वर्कफ़्लो।', wyberWins: ['एक ही जनरेशन में पूरा ऐप', 'डेटाबेस + ऑथ शामिल', 'कोई असेंबली ज़रूरी नहीं', 'मोबाइल + एजेंट्स + वर्कफ़्लो'] },
      replit: { summary: 'Replit डेवलपर्स के लिए एक IDE है। WyberAi फ़ाउंडर्स के लिए एक नो-कोड बिल्डर है — तेज़, सस्ता, और ज़्यादा अनुमानित।', wyberWins: ['कोडिंग ज्ञान की ज़रूरत नहीं', 'अनुमानित फ़िक्स्ड क्रेडिट्स', '< 60 सेकंड में ऐप जनरेशन', 'मोबाइल + एजेंट्स + वर्कफ़्लो'] },
      cursor: { summary: 'Cursor डेवलपर्स को तेज़ बनाता है। WyberAi सादे अंग्रेज़ी (या हिंदी!) से पूरे ऐप्स बनाता है — किसी डेवलपर की ज़रूरत नहीं।', wyberWins: ['ज़ीरो कोडिंग ज़रूरी', 'कुछ ही मिनटों में ऐप', 'लाइव प्रीव्यू + वन-क्लिक डिप्लॉय', 'मोबाइल + एजेंट्स + वर्कफ़्लो'] },
      softr: { summary: 'Softr आपके ऐप को अपने प्लेटफ़ॉर्म पर $269/माह Business से होस्ट करता है। WyberAi असली React कोड बनाता है जो आपका है — वेब + मोबाइल — $29/माह से।', wyberWins: ['असली कोड, GitHub एक्सपोर्ट, कोई लॉक-इन नहीं', 'नेटिव मोबाइल ऐप्स (React Native)', 'लाइव डेटाबेस सुरक्षा स्कैन', 'सोलो फ़ाउंडर्स के लिए दसवां हिस्सा कीमत'] },
    },
    seeComparison: 'तुलना देखें →',
    ctaHeading: 'WyberAi मुफ़्त में आज़माएं — 50 क्रेडिट्स/माह',
    ctaBody: 'वेब ऐप, मोबाइल ऐप, AI एजेंट, या वर्कफ़्लो। किसी क्रेडिट कार्ड की ज़रूरत नहीं।',
    ctaButton: 'मुफ़्त में बनाना शुरू करें →',
  },
  kn: {
    metaTitle: 'WyberAi vs ಸ್ಪರ್ಧಿಗಳು (2026) — ಪ್ರಾಮಾಣಿಕ ಹೋಲಿಕೆಗಳು',
    metaDescription: 'WyberAi ಅನ್ನು Lovable, Bolt.new, v0, Replit, ಮತ್ತು Cursor ಜೊತೆ ಹೋಲಿಸಿ. ಬೆಲೆ, ಕ್ರೆಡಿಟ್‌ಗಳು, ಮತ್ತು ಆರು-ಉತ್ಪನ್ನ ವ್ಯತ್ಯಾಸ (ವೆಬ್ + ಮೊಬೈಲ್ + ಏಜೆಂಟ್‌ಗಳು + ವರ್ಕ್‌ಫ್ಲೋಗಳು + AI ಉದ್ಯೋಗಿಗಳು) ಹೇಗೆ ಹೋಲಿಸುತ್ತದೆ ಎಂದು ನೋಡಿ.',
    eyebrow: 'ಜೂನ್ 2026 ರಲ್ಲಿ ಪರಿಶೀಲಿಸಲಾಗಿದೆ',
    heroTitle: 'WyberAi ಪ್ರತಿಯೊಂದು ಪರ್ಯಾಯದ ವಿರುದ್ಧ',
    heroBody: 'ಪ್ರಾಮಾಣಿಕ, ಅಪ್-ಟು-ಡೇಟ್ ಹೋಲಿಕೆಗಳು. WyberAi ಒಂದೇ ವರ್ಕ್‌ಸ್ಪೇಸ್‌ನಿಂದ ಫುಲ್-ಸ್ಟ್ಯಾಕ್ ವೆಬ್ ಆ್ಯಪ್‌ಗಳು ಮತ್ತು ನೇಟಿವ್ ಮೊಬೈಲ್ ಆ್ಯಪ್‌ಗಳನ್ನು ರವಾನಿಸುತ್ತದೆ — ಡಿಪ್ಲಾಯ್, ಇಂಟಿಗ್ರೇಶನ್‌ಗಳು, ಮತ್ತು GitHub ಕೋಡ್ ಮಾಲೀಕತ್ವ ಎಲ್ಲವೂ ಸೇರಿ.',
    productLabels: [
      { label: 'ವೆಬ್ ಆ್ಯಪ್‌ಗಳು', sub: 'ಫುಲ್-ಸ್ಟ್ಯಾಕ್ React ಆ್ಯಪ್' },
      { label: 'ಮೊಬೈಲ್ ಆ್ಯಪ್‌ಗಳು', sub: 'React Native + Expo' },
      { label: '27 ಇಂಟಿಗ್ರೇಶನ್‌ಗಳು', sub: 'Supabase, Stripe, OpenAI...' },
      { label: 'ಒಂದು-ಕ್ಲಿಕ್ ಡಿಪ್ಲಾಯ್', sub: 'ಸೆಕೆಂಡುಗಳಲ್ಲಿ ಲೈವ್ URL' },
      { label: 'GitHub ಸಿಂಕ್', sub: 'ನಿಮ್ಮ ಕೋಡ್ ನಿಮ್ಮದೇ' },
      { label: 'ವಾರದ ಚಾಲೆಂಜ್', sub: '$500 ಬಹುಮಾನಗಳು' },
    ],
    comparisons: {
      lovable: { summary: 'WyberAi ಕಡಿಮೆ ಬೆಲೆಯಲ್ಲಿ ~56% ಹೆಚ್ಚು ಕ್ರೆಡಿಟ್‌ಗಳನ್ನು ನೀಡುತ್ತದೆ, ಜೊತೆಗೆ Lovable ಬಳಿ ಇಲ್ಲದ ಮೊಬೈಲ್ ಆ್ಯಪ್‌ಗಳು, ಏಜೆಂಟ್‌ಗಳು, ಮತ್ತು ವರ್ಕ್‌ಫ್ಲೋಗಳು.', wyberWins: ['Builder ನಲ್ಲಿ 300 ಕ್ರೆಡಿಟ್‌ಗಳು/ತಿಂಗಳು ($99)', 'ಟಾಪ್-ಅಪ್‌ಗಳು ಎಂದಿಗೂ ಅವಧಿ ಮುಗಿಯುವುದಿಲ್ಲ', 'ಮೊಬೈಲ್ + ಏಜೆಂಟ್‌ಗಳು + ವರ್ಕ್‌ಫ್ಲೋಗಳು + AI ಉದ್ಯೋಗಿಗಳು + GTM', 'Lovable ನ 1 ಕ್ಕೆ ಹೋಲಿಸಿದರೆ 6 ಉತ್ಪನ್ನಗಳು'] },
      bolt: { summary: 'WyberAi ಫಿಕ್ಸ್ಡ್-ಕ್ರೆಡಿಟ್ ಬೆಲೆಯನ್ನು ಬಳಸುತ್ತದೆ (ಟೋಕನ್ ಆಶ್ಚರ್ಯಗಳಿಲ್ಲ) ಮತ್ತು Bolt ನೀಡದ ಮೊಬೈಲ್ ಆ್ಯಪ್‌ಗಳು, ಏಜೆಂಟ್‌ಗಳು ಮತ್ತು ವರ್ಕ್‌ಫ್ಲೋಗಳನ್ನು ಸೇರಿಸುತ್ತದೆ.', wyberWins: ['ಊಹಿಸಬಹುದಾದ ಫಿಕ್ಸ್ಡ್ ಕ್ರೆಡಿಟ್‌ಗಳು', 'ದೈನಂದಿನ ಬೋನಸ್ ಕ್ರೆಡಿಟ್‌ಗಳು', 'ಟೆಕ್ನಿಕಲ್ ಅಲ್ಲದ ಬಳಕೆದಾರರಿಗೆ ಮಾರ್ಗದರ್ಶಿತ', 'ಮೊಬೈಲ್ + ಏಜೆಂಟ್‌ಗಳು + ವರ್ಕ್‌ಫ್ಲೋಗಳು'] },
      v0: { summary: 'v0 UI ಕಾಂಪೊನೆಂಟ್‌ಗಳನ್ನು ರಚಿಸುತ್ತದೆ. WyberAi ಸಂಪೂರ್ಣ ಫುಲ್-ಸ್ಟ್ಯಾಕ್ ಆ್ಯಪ್‌ಗಳನ್ನು ರಚಿಸುತ್ತದೆ — ಜೊತೆಗೆ ಮೊಬೈಲ್, ಏಜೆಂಟ್‌ಗಳು, ಮತ್ತು ವರ್ಕ್‌ಫ್ಲೋಗಳು.', wyberWins: ['ಒಂದೇ ಜನರೇಶನ್‌ನಲ್ಲಿ ಸಂಪೂರ್ಣ ಆ್ಯಪ್', 'ಡೇಟಾಬೇಸ್ + ಆಥ್ ಸೇರಿಸಲಾಗಿದೆ', 'ಯಾವುದೇ ಜೋಡಣೆ ಅಗತ್ಯವಿಲ್ಲ', 'ಮೊಬೈಲ್ + ಏಜೆಂಟ್‌ಗಳು + ವರ್ಕ್‌ಫ್ಲೋಗಳು'] },
      replit: { summary: 'Replit ಎಂಬುದು ಡೆವಲಪರ್‌ಗಳಿಗಾಗಿ ಒಂದು IDE. WyberAi ಫೌಂಡರ್‌ಗಳಿಗಾಗಿ ಒಂದು ನೋ-ಕೋಡ್ ಬಿಲ್ಡರ್ — ವೇಗವಾದ, ಅಗ್ಗದ, ಮತ್ತು ಹೆಚ್ಚು ಊಹಿಸಬಹುದಾದ.', wyberWins: ['ಕೋಡಿಂಗ್ ಜ್ಞಾನ ಅಗತ್ಯವಿಲ್ಲ', 'ಊಹಿಸಬಹುದಾದ ಫಿಕ್ಸ್ಡ್ ಕ್ರೆಡಿಟ್‌ಗಳು', '< 60 ಸೆಕೆಂಡುಗಳಲ್ಲಿ ಆ್ಯಪ್ ಜನರೇಶನ್', 'ಮೊಬೈಲ್ + ಏಜೆಂಟ್‌ಗಳು + ವರ್ಕ್‌ಫ್ಲೋಗಳು'] },
      cursor: { summary: 'Cursor ಡೆವಲಪರ್‌ಗಳನ್ನು ವೇಗಗೊಳಿಸುತ್ತದೆ. WyberAi ಸರಳ ಇಂಗ್ಲಿಷ್‌ನಿಂದ ಸಂಪೂರ್ಣ ಆ್ಯಪ್‌ಗಳನ್ನು ನಿರ್ಮಿಸುತ್ತದೆ — ಯಾವುದೇ ಡೆವಲಪರ್ ಅಗತ್ಯವಿಲ್ಲ.', wyberWins: ['ಶೂನ್ಯ ಕೋಡಿಂಗ್ ಅಗತ್ಯವಿದೆ', 'ಕೆಲವೇ ನಿಮಿಷಗಳಲ್ಲಿ ಆ್ಯಪ್', 'ಲೈವ್ ಪ್ರಿವ್ಯೂ + ಒಂದು-ಕ್ಲಿಕ್ ಡಿಪ್ಲಾಯ್', 'ಮೊಬೈಲ್ + ಏಜೆಂಟ್‌ಗಳು + ವರ್ಕ್‌ಫ್ಲೋಗಳು'] },
      softr: { summary: 'Softr ನಿಮ್ಮ ಆ್ಯಪ್ ಅನ್ನು Business ಗೆ $269/ತಿಂಗಳಿನಿಂದ ಅವರ ಪ್ಲಾಟ್‌ಫಾರ್ಮ್‌ನಲ್ಲಿ ಹೋಸ್ಟ್ ಮಾಡುತ್ತದೆ. WyberAi ನಿಜವಾದ React ಕೋಡ್ ಅನ್ನು ರಚಿಸುತ್ತದೆ, ಅದು ನಿಮ್ಮದೇ — ವೆಬ್ + ಮೊಬೈಲ್ — $29/ತಿಂಗಳಿನಿಂದ.', wyberWins: ['ನಿಜವಾದ ಕೋಡ್, GitHub ಎಕ್ಸ್‌ಪೋರ್ಟ್, ಯಾವುದೇ ಲಾಕ್-ಇನ್ ಇಲ್ಲ', 'ನೇಟಿವ್ ಮೊಬೈಲ್ ಆ್ಯಪ್‌ಗಳು (React Native)', 'ಲೈವ್ ಡೇಟಾಬೇಸ್ ಭದ್ರತಾ ಸ್ಕ್ಯಾನ್', 'ಸೋಲೋ ಫೌಂಡರ್‌ಗಳಿಗೆ ಬೆಲೆಯ ಹತ್ತನೇ ಒಂದು ಭಾಗ'] },
    },
    seeComparison: 'ಹೋಲಿಕೆ ನೋಡಿ →',
    ctaHeading: 'WyberAi ಅನ್ನು ಉಚಿತವಾಗಿ ಪ್ರಯತ್ನಿಸಿ — 50 ಕ್ರೆಡಿಟ್‌ಗಳು/ತಿಂಗಳು',
    ctaBody: 'ವೆಬ್ ಆ್ಯಪ್, ಮೊಬೈಲ್ ಆ್ಯಪ್, AI ಏಜೆಂಟ್, ಅಥವಾ ವರ್ಕ್‌ಫ್ಲೋ. ಕ್ರೆಡಿಟ್ ಕಾರ್ಡ್ ಅಗತ್ಯವಿಲ್ಲ.',
    ctaButton: 'ಉಚಿತವಾಗಿ ನಿರ್ಮಿಸಲು ಪ್ರಾರಂಭಿಸಿ →',
  },
  te: {
    metaTitle: 'WyberAi vs పోటీదారులు (2026) — నిజాయితీ పోలికలు',
    metaDescription: 'WyberAi ని Lovable, Bolt.new, v0, Replit, మరియు Cursor తో పోల్చండి. ధర, క్రెడిట్లు, మరియు ఆరు-ఉత్పత్తి తేడా (వెబ్ + మొబైల్ + ఏజెంట్లు + వర్క్‌ఫ్లోలు + AI ఉద్యోగులు) ఎలా పోలుస్తుందో చూడండి.',
    eyebrow: 'జూన్ 2026లో ధృవీకరించబడింది',
    heroTitle: 'WyberAi ప్రతి ప్రత్యామ్నాయానికి వ్యతిరేకంగా',
    heroBody: 'నిజాయితీ, తాజా పోలికలు. WyberAi ఒకే వర్క్‌స్పేస్ నుండి పూర్తి-స్టాక్ వెబ్ యాప్‌లు మరియు నేటివ్ మొబైల్ యాప్‌లను రూపొందిస్తుంది — డిప్లాయ్, ఇంటిగ్రేషన్‌లు, మరియు GitHub కోడ్ యాజమాన్యంతో సహా.',
    productLabels: [
      { label: 'వెబ్ యాప్స్', sub: 'ఫుల్-స్టాక్ React యాప్' },
      { label: 'మొబైల్ యాప్స్', sub: 'React Native + Expo' },
      { label: '27 ఇంటిగ్రేషన్‌లు', sub: 'Supabase, Stripe, OpenAI...' },
      { label: 'వన్-క్లిక్ డిప్లాయ్', sub: 'సెకన్లలో లైవ్ URL' },
      { label: 'GitHub సింక్', sub: 'మీ కోడ్ మీదే' },
      { label: 'వారపు ఛాలెంజ్', sub: '$500 బహుమతులు' },
    ],
    comparisons: {
      lovable: { summary: 'WyberAi తక్కువ ధరలో ~56% ఎక్కువ క్రెడిట్లను అందిస్తుంది, అలాగే Lovable వద్ద లేని మొబైల్ యాప్‌లు, ఏజెంట్లు, మరియు వర్క్‌ఫ్లోలు.', wyberWins: ['Builder లో నెలకు 300 క్రెడిట్లు ($99)', 'టాప్-అప్‌లు ఎప్పటికీ గడువు ముగియవు', 'మొబైల్ + ఏజెంట్లు + వర్క్‌ఫ్లోలు + AI ఉద్యోగులు + GTM', 'Lovable యొక్క 1 తో పోలిస్తే 6 ఉత్పత్తులు'] },
      bolt: { summary: 'WyberAi ఫిక్స్డ్-క్రెడిట్ ధరను ఉపయోగిస్తుంది (టోకెన్ ఆశ్చర్యాలు లేవు) మరియు Bolt అందించని మొబైల్ యాప్‌లు, ఏజెంట్లు మరియు వర్క్‌ఫ్లోలను జోడిస్తుంది.', wyberWins: ['అంచనా వేయదగిన ఫిక్స్డ్ క్రెడిట్లు', 'రోజువారీ బోనస్ క్రెడిట్లు', 'టెక్నికల్ కాని వినియోగదారుల కోసం గైడెడ్', 'మొబైల్ + ఏజెంట్లు + వర్క్‌ఫ్లోలు'] },
      v0: { summary: 'v0 UI కాంపోనెంట్‌లను రూపొందిస్తుంది. WyberAi పూర్తి ఫుల్-స్టాక్ యాప్‌లను రూపొందిస్తుంది — అలాగే మొబైల్, ఏజెంట్లు, మరియు వర్క్‌ఫ్లోలు.', wyberWins: ['ఒకే జనరేషన్‌లో పూర్తి యాప్', 'డేటాబేస్ + ఆథ్ చేర్చబడింది', 'అసెంబ్లీ అవసరం లేదు', 'మొబైల్ + ఏజెంట్లు + వర్క్‌ఫ్లోలు'] },
      replit: { summary: 'Replit అనేది డెవలపర్ల కోసం ఒక IDE. WyberAi ఫౌండర్ల కోసం ఒక నో-కోడ్ బిల్డర్ — వేగవంతమైన, చౌకైన, మరియు మరింత అంచనా వేయదగినది.', wyberWins: ['కోడింగ్ జ్ఞానం అవసరం లేదు', 'అంచనా వేయదగిన ఫిక్స్డ్ క్రెడిట్లు', '< 60 సెకన్లలో యాప్ జనరేషన్', 'మొబైల్ + ఏజెంట్లు + వర్క్‌ఫ్లోలు'] },
      cursor: { summary: 'Cursor డెవలపర్లను వేగవంతం చేస్తుంది. WyberAi సాదా ఇంగ్లీష్ నుండి పూర్తి యాప్‌లను నిర్మిస్తుంది — డెవలపర్ అవసరం లేదు.', wyberWins: ['జీరో కోడింగ్ అవసరం', 'కొన్ని నిమిషాల్లో యాప్', 'లైవ్ ప్రివ్యూ + వన్-క్లిక్ డిప్లాయ్', 'మొబైల్ + ఏజెంట్లు + వర్క్‌ఫ్లోలు'] },
      softr: { summary: 'Softr మీ యాప్‌ను Business కోసం నెలకు $269 నుండి వారి ప్లాట్‌ఫారమ్‌పై హోస్ట్ చేస్తుంది. WyberAi మీరు సొంతం చేసుకునే నిజమైన React కోడ్‌ను రూపొందిస్తుంది — వెబ్ + మొబైల్ — నెలకు $29 నుండి.', wyberWins: ['నిజమైన కోడ్, GitHub ఎగుమతి, లాక్-ఇన్ లేదు', 'నేటివ్ మొబైల్ యాప్‌లు (React Native)', 'లైవ్ డేటాబేస్ భద్రతా స్కాన్', 'సోలో ఫౌండర్ల కోసం పదో వంతు ధర'] },
    },
    seeComparison: 'పోలిక చూడండి →',
    ctaHeading: 'WyberAi ఉచితంగా ప్రయత్నించండి — నెలకు 50 క్రెడిట్లు',
    ctaBody: 'వెబ్ యాప్, మొబైల్ యాప్, AI ఏజెంట్, లేదా వర్క్‌ఫ్లో. క్రెడిట్ కార్డ్ అవసరం లేదు.',
    ctaButton: 'ఉచితంగా నిర్మించడం ప్రారంభించండి →',
  },
  ta: {
    metaTitle: 'WyberAi vs போட்டியாளர்கள் (2026) — நேர்மையான ஒப்பீடுகள்',
    metaDescription: 'WyberAi ஐ Lovable, Bolt.new, v0, Replit, மற்றும் Cursor உடன் ஒப்பிடுங்கள். விலை, கிரெடிட்கள், மற்றும் ஆறு-தயாரிப்பு வேறுபாடு (வெப் + மொபைல் + ஏஜென்ட்கள் + பணிப்பாய்வுகள் + AI பணியாளர்கள்) எப்படி ஒப்பிடுகிறது என்பதைப் பாருங்கள்.',
    eyebrow: 'ஜூன் 2026 இல் சரிபார்க்கப்பட்டது',
    heroTitle: 'WyberAi vs ஒவ்வொரு மாற்றுக்கும்',
    heroBody: 'நேர்மையான, புதுப்பிக்கப்பட்ட ஒப்பீடுகள். WyberAi ஒரே பணியிடத்திலிருந்து முழு-அடுக்கு வெப் ஆப்களையும் நேட்டிவ் மொபைல் ஆப்களையும் அனுப்புகிறது — டெப்ளாய், இன்டகிரேஷன்கள், மற்றும் GitHub கோட் உரிமையுடன்.',
    productLabels: [
      { label: 'வெப் ஆப்ஸ்', sub: 'முழு-அடுக்கு React ஆப்' },
      { label: 'மொபைல் ஆப்ஸ்', sub: 'React Native + Expo' },
      { label: '27 இன்டகிரேஷன்கள்', sub: 'Supabase, Stripe, OpenAI...' },
      { label: 'ஒரு-கிளிக் டெப்ளாய்', sub: 'நொடிகளில் நேரடி URL' },
      { label: 'GitHub சிங்க்', sub: 'உங்கள் கோட் உங்களுடையது' },
      { label: 'வாராந்திர சவால்', sub: '$500 பரிசுகள்' },
    ],
    comparisons: {
      lovable: { summary: 'WyberAi குறைந்த விலையில் ~56% அதிக கிரெடிட்களை வழங்குகிறது, மேலும் Lovable இடம் இல்லாத மொபைல் ஆப்கள், ஏஜென்ட்கள், மற்றும் பணிப்பாய்வுகள்.', wyberWins: ['Builder இல் மாதம் 300 கிரெடிட்கள் ($99)', 'டாப்-அப்கள் ஒருபோதும் காலாவதியாகாது', 'மொபைல் + ஏஜென்ட்கள் + பணிப்பாய்வுகள் + AI பணியாளர்கள் + GTM', 'Lovable இன் 1 உடன் ஒப்பிடும்போது 6 தயாரிப்புகள்'] },
      bolt: { summary: 'WyberAi நிலையான-கிரெடிட் விலையைப் பயன்படுத்துகிறது (டோக்கன் ஆச்சரியங்கள் இல்லை) மற்றும் Bolt வழங்காத மொபைல் ஆப்கள், ஏஜென்ட்கள் மற்றும் பணிப்பாய்வுகளைச் சேர்க்கிறது.', wyberWins: ['கணிக்கக்கூடிய நிலையான கிரெடிட்கள்', 'தினசரி போனஸ் கிரெடிட்கள்', 'தொழில்நுட்பம் அறியாதவர்களுக்கு வழிகாட்டப்பட்டது', 'மொபைல் + ஏஜென்ட்கள் + பணிப்பாய்வுகள்'] },
      v0: { summary: 'v0 UI கூறுகளை உருவாக்குகிறது. WyberAi முழுமையான முழு-அடுக்கு ஆப்களை உருவாக்குகிறது — மேலும் மொபைல், ஏஜென்ட்கள், மற்றும் பணிப்பாய்வுகள்.', wyberWins: ['ஒரே உருவாக்கத்தில் முழுமையான ஆப்', 'தரவுத்தளம் + அங்கீகாரம் சேர்க்கப்பட்டுள்ளது', 'கூட்டமைப்பு தேவையில்லை', 'மொபைல் + ஏஜென்ட்கள் + பணிப்பாய்வுகள்'] },
      replit: { summary: 'Replit என்பது டெவலப்பர்களுக்கான ஒரு IDE. WyberAi நிறுவனர்களுக்கான ஒரு நோ-கோட் பில்டர் — வேகமான, மலிவான, மற்றும் மிகவும் கணிக்கக்கூடியது.', wyberWins: ['குறியீட்டு அறிவு தேவையில்லை', 'கணிக்கக்கூடிய நிலையான கிரெடிட்கள்', '< 60 விநாடிகளில் ஆப் உருவாக்கம்', 'மொபைல் + ஏஜென்ட்கள் + பணிப்பாய்வுகள்'] },
      cursor: { summary: 'Cursor டெவலப்பர்களை வேகப்படுத்துகிறது. WyberAi எளிய ஆங்கிலத்திலிருந்து முழுமையான ஆப்களை உருவாக்குகிறது — டெவலப்பர் தேவையில்லை.', wyberWins: ['பூஜ்ஜிய குறியீடு தேவை', 'சில நிமிடங்களில் ஆப்', 'நேரடி முன்னோட்டம் + ஒரு-கிளிக் டெப்ளாய்', 'மொபைல் + ஏஜென்ட்கள் + பணிப்பாய்வுகள்'] },
      softr: { summary: 'Softr உங்கள் ஆப்பை Business க்கு மாதம் $269 முதல் அவர்களின் தளத்தில் ஹோஸ்ட் செய்கிறது. WyberAi நீங்கள் சொந்தமாக்கும் உண்மையான React கோடை உருவாக்குகிறது — வெப் + மொபைல் — மாதம் $29 முதல்.', wyberWins: ['உண்மையான கோட், GitHub ஏற்றுமதி, லாக்-இன் இல்லை', 'நேட்டிவ் மொபைல் ஆப்கள் (React Native)', 'நேரடி தரவுத்தள பாதுகாப்பு ஸ்கேன்', 'தனி நிறுவனர்களுக்கு விலையில் பத்தில் ஒரு பங்கு'] },
    },
    seeComparison: 'ஒப்பீட்டைப் பார்க்கவும் →',
    ctaHeading: 'WyberAi ஐ இலவசமாக முயற்சிக்கவும் — மாதம் 50 கிரெடிட்கள்',
    ctaBody: 'வெப் ஆப், மொபைல் ஆப், AI ஏஜென்ட், அல்லது பணிப்பாய்வு. கிரெடிட் கார்டு தேவையில்லை.',
    ctaButton: 'இலவசமாக உருவாக்கத் தொடங்குங்கள் →',
  },
}
