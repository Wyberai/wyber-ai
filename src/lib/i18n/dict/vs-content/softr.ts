import type { Locale } from '../../locales'
import type { CompRow, FaqItem } from '@/components/seo/VsPageTemplate'

export interface VsContent {
  tagline: string
  blurb: string
  pillarNote: string
  rows: CompRow[]
  faqs: FaqItem[]
}

// AI-drafted, not yet native-reviewed (see AutoTranslateNotice). Content for
// the /vs/softr page (English source: src/app/vs/softr/page.tsx). Row
// values that are pure symbols/numbers/proper nouns (✓, ✗, $29/mo, React
// Native + Expo, dollar figures) are left as-is across locales — only the
// human-readable phrase values (Roadmap, Growing, Rebuild from scratch,
// Full ownership, etc.) and the feature labels themselves are translated.
export const SOFTR_CONTENT: Record<Locale, VsContent> = {
  en: {
    tagline: 'Softr is a mature no-code platform for internal tools and client portals. WyberAi generates real React code you own — web + mobile from one prompt — with a live security scan on every publish.',
    blurb: 'Honest comparison of WyberAi vs Softr: ownership, pricing, mobile output, security model, and when each is the right choice. Verified July 2026.',
    pillarNote: 'Softr apps live on Softr\'s platform — there is no code to export.',
    rows: [
      { feature: 'Entry price', wyber: '$29/mo (Starter)', other: '$49/mo (Basic), $269/mo Business', winner: 'wyber' },
      { feature: 'What you get', wyber: 'Real React + Supabase code', other: 'Hosted app on Softr platform', winner: 'wyber' },
      { feature: 'Code export / GitHub', wyber: '✓ Full ownership', other: '✗ Stays on platform', winner: 'wyber' },
      { feature: 'Native mobile apps', wyber: '✓ React Native + Expo', other: '✗ (PWA wrapper only)', winner: 'wyber' },
      { feature: 'Live database security scan', wyber: '✓ Probes RLS with anon key', other: '✗ (platform-managed)', winner: 'wyber' },
      { feature: 'Leave anytime with your app', wyber: '✓ Standard React + Vite', other: '✗ Rebuild from scratch', winner: 'wyber' },
      { feature: 'Workflow automations', wyber: 'Roadmap', other: '✓ Built-in, mature', winner: 'other' },
      { feature: 'Granular user permissions', wyber: 'Via Supabase RLS', other: '✓ Visual permission builder', winner: 'other' },
      { feature: 'Team seats & collaboration', wyber: 'Roadmap', other: '✓ Multi-seat plans', winner: 'other' },
      { feature: 'Template ecosystem', wyber: 'Growing', other: '✓ Large, 6 years of templates', winner: 'other' },
      { feature: 'Airtable / Sheets frontends', wyber: '✗', other: '✓ Original core strength', winner: 'other' },
      { feature: 'Custom domain', wyber: '✓', other: '✓ (paid plans)', winner: 'tie' },
      { feature: 'AI generation credits', wyber: 'All plans, top-ups never expire', other: '100 AI credits on $269 plan', winner: 'wyber' },
    ],
    faqs: [
      { q: 'What is the main difference between WyberAi and Softr?', a: 'Softr generates a hosted app that lives on Softr\'s platform — you configure it, they run it, and if you leave you rebuild from scratch. WyberAi generates real React + Supabase code that you own: export it to GitHub, deploy it anywhere, hire a developer to extend it. One is renting; the other is owning.' },
      { q: 'When is Softr the better choice?', a: 'Honestly: if you need an internal tool or client portal on top of Airtable or Google Sheets, with visual permission rules and workflow automations, and you don\'t care about owning code — Softr is mature at exactly that. WyberAi is built for founders shipping a real product to real users, on web and mobile, with code they own.' },
      { q: 'How do the prices compare?', a: 'WyberAi starts at $29/month (India: ₹499/month with UPI). Softr\'s Basic plan is $49/month, and the Business plan most teams need is $269/month with 100 AI credits. For a solo founder, WyberAi is roughly a tenth of the cost of running Softr at the tier where its AI features live.' },
      { q: 'Can Softr build mobile apps?', a: 'Softr offers a PWA wrapper (your web app installed to a home screen), not native mobile apps. WyberAi generates real React Native + Expo apps from the same prompt as your web app — previewable on your phone and submittable to the App Store and Google Play.' },
      { q: 'Who checks the security of what I ship?', a: 'On Softr, the platform manages security — you trust their infrastructure and their permission system. On WyberAi, your app has its own database, and WyberAi runs a live RLS trust scan against it using the public anon key — the same view an attacker gets — and blocks publishing if it finds critical data leaks. In 2026, with researchers finding thousands of AI-built apps leaking data, "we actually probe your live database" is not a checkbox feature.' },
      { q: 'Can I migrate from Softr to WyberAi?', a: 'There\'s no code to export from Softr, so migration means describing your app to WyberAi and rebuilding — most apps generate in minutes, and your data can move via CSV export from Airtable/Sheets into Supabase. The upside: after migrating, you own the result.' },
    ],
  },
  hi: {
    tagline: 'Softr इंटरनल टूल्स और क्लाइंट पोर्टल्स के लिए एक परिपक्व नो-कोड प्लेटफ़ॉर्म है। WyberAi असली React कोड जनरेट करता है जिसका आप मालिक होते हैं — एक ही प्रॉम्प्ट से वेब + मोबाइल — हर पब्लिश पर एक लाइव सुरक्षा स्कैन के साथ।',
    blurb: 'WyberAi बनाम Softr की ईमानदार तुलना: मालिकाना हक, कीमत, मोबाइल आउटपुट, सुरक्षा मॉडल, और हर एक कब सही विकल्प है। जुलाई 2026 में सत्यापित।',
    pillarNote: 'Softr ऐप्स Softr के प्लेटफ़ॉर्म पर रहते हैं — एक्सपोर्ट करने के लिए कोई कोड नहीं है।',
    rows: [
      { feature: 'शुरुआती कीमत', wyber: '$29/माह (Starter)', other: '$49/माह (Basic), $269/माह Business', winner: 'wyber' },
      { feature: 'आपको क्या मिलता है', wyber: 'असली React + Supabase कोड', other: 'Softr प्लेटफ़ॉर्म पर होस्टेड ऐप', winner: 'wyber' },
      { feature: 'कोड एक्सपोर्ट / GitHub', wyber: '✓ पूरा मालिकाना हक', other: '✗ प्लेटफ़ॉर्म पर ही रहता है', winner: 'wyber' },
      { feature: 'नेटिव मोबाइल ऐप्स', wyber: '✓ React Native + Expo', other: '✗ (सिर्फ़ PWA रैपर)', winner: 'wyber' },
      { feature: 'लाइव डेटाबेस सुरक्षा स्कैन', wyber: '✓ anon key से RLS जांच', other: '✗ (प्लेटफ़ॉर्म-प्रबंधित)', winner: 'wyber' },
      { feature: 'अपने ऐप के साथ कभी भी छोड़ें', wyber: '✓ स्टैंडर्ड React + Vite', other: '✗ शुरू से फिर बनाना पड़ता है', winner: 'wyber' },
      { feature: 'वर्कफ़्लो ऑटोमेशन', wyber: 'रोडमैप में', other: '✓ बिल्ट-इन, परिपक्व', winner: 'other' },
      { feature: 'बारीक यूज़र परमिशन', wyber: 'Supabase RLS के ज़रिए', other: '✓ विज़ुअल परमिशन बिल्डर', winner: 'other' },
      { feature: 'टीम सीट्स और सहयोग', wyber: 'रोडमैप में', other: '✓ मल्टी-सीट प्लान', winner: 'other' },
      { feature: 'टेम्पलेट इकोसिस्टम', wyber: 'बढ़ रहा है', other: '✓ बड़ा, 6 साल के टेम्पलेट्स', winner: 'other' },
      { feature: 'Airtable / Sheets फ्रंटएंड', wyber: '✗', other: '✓ मूल मुख्य ताक़त', winner: 'other' },
      { feature: 'कस्टम डोमेन', wyber: '✓', other: '✓ (पेड प्लान)', winner: 'tie' },
      { feature: 'AI जनरेशन क्रेडिट्स', wyber: 'सभी प्लान, टॉप-अप कभी एक्सपायर नहीं', other: '$269 प्लान पर 100 AI क्रेडिट्स', winner: 'wyber' },
    ],
    faqs: [
      { q: 'WyberAi और Softr में मुख्य फ़र्क़ क्या है?', a: 'Softr एक होस्टेड ऐप बनाता है जो Softr के प्लेटफ़ॉर्म पर रहता है — आप इसे कॉन्फ़िगर करते हैं, वे इसे चलाते हैं, और अगर आप छोड़ते हैं तो आपको शुरू से बनाना पड़ता है। WyberAi असली React + Supabase कोड बनाता है जिसका आप मालिक होते हैं: इसे GitHub पर एक्सपोर्ट करें, कहीं भी डिप्लॉय करें, इसे बढ़ाने के लिए डेवलपर हायर करें। एक किराए पर है; दूसरा मालिकाना है।' },
      { q: 'Softr कब बेहतर विकल्प है?', a: 'ईमानदारी से कहें तो: अगर आपको Airtable या Google Sheets के ऊपर एक इंटरनल टूल या क्लाइंट पोर्टल चाहिए, विज़ुअल परमिशन नियमों और वर्कफ़्लो ऑटोमेशन के साथ, और आपको कोड के मालिकाना हक की परवाह नहीं है — तो Softr बिल्कुल इसी में परिपक्व है। WyberAi उन फ़ाउंडर्स के लिए बना है जो वेब और मोबाइल पर असली यूज़र्स को असली प्रोडक्ट शिप कर रहे हैं, अपने मालिकाना कोड के साथ।' },
      { q: 'कीमतों की तुलना कैसे होती है?', a: 'WyberAi $29/माह से शुरू होता है (भारत: UPI के साथ ₹499/माह)। Softr का Basic प्लान $49/माह है, और ज़्यादातर टीमों को चाहिए होने वाला Business प्लान $269/माह है, जिसमें 100 AI क्रेडिट्स मिलते हैं। एक सोलो फ़ाउंडर के लिए, WyberAi की कीमत Softr को उस टियर पर चलाने की लागत का लगभग दसवां हिस्सा है जहां उसके AI फ़ीचर्स मिलते हैं।' },
      { q: 'क्या Softr मोबाइल ऐप बना सकता है?', a: 'Softr एक PWA रैपर देता है (आपका वेब ऐप होम स्क्रीन पर इंस्टॉल किया गया), नेटिव मोबाइल ऐप्स नहीं। WyberAi आपके वेब ऐप जैसे ही प्रॉम्प्ट से असली React Native + Expo ऐप्स बनाता है — जिसे आप अपने फ़ोन पर प्रीव्यू कर सकते हैं और App Store व Google Play पर सबमिट कर सकते हैं।' },
      { q: 'मैं जो शिप करता हूं उसकी सुरक्षा कौन जांचता है?', a: 'Softr पर, प्लेटफ़ॉर्म सुरक्षा का प्रबंधन करता है — आप उनके इन्फ्रास्ट्रक्चर और उनके परमिशन सिस्टम पर भरोसा करते हैं। WyberAi पर, आपके ऐप का अपना डेटाबेस होता है, और WyberAi पब्लिक anon key का उपयोग करके इसके खिलाफ़ एक लाइव RLS ट्रस्ट स्कैन चलाता है — वही व्यू जो एक हमलावर को मिलता है — और अगर इसे गंभीर डेटा लीक मिलते हैं तो पब्लिशिंग को ब्लॉक कर देता है। 2026 में, जब शोधकर्ता हज़ारों AI-निर्मित ऐप्स को डेटा लीक करते पा रहे हैं, "हम वाकई आपके लाइव डेटाबेस की जांच करते हैं" कोई चेकबॉक्स फ़ीचर नहीं है।' },
      { q: 'क्या मैं Softr से WyberAi पर माइग्रेट कर सकता हूं?', a: 'Softr से एक्सपोर्ट करने के लिए कोई कोड नहीं है, इसलिए माइग्रेशन का मतलब है अपने ऐप का वर्णन WyberAi को बताना और उसे फिर से बनाना — ज़्यादातर ऐप्स मिनटों में जनरेट हो जाते हैं, और आपका डेटा Airtable/Sheets से CSV एक्सपोर्ट के ज़रिए Supabase में जा सकता है। फ़ायदा यह है: माइग्रेट करने के बाद, आप नतीजे के मालिक होते हैं।' },
    ],
  },
  kn: {
    tagline: 'Softr ಆಂತರಿಕ ಪರಿಕರಗಳು ಮತ್ತು ಕ್ಲೈಂಟ್ ಪೋರ್ಟಲ್‌ಗಳಿಗಾಗಿ ಪ್ರೌಢ ನೋ-ಕೋಡ್ ಪ್ಲಾಟ್‌ಫಾರ್ಮ್ ಆಗಿದೆ. WyberAi ನೀವು ಸ್ವಂತವಾಗಿಸಿಕೊಳ್ಳುವ ನಿಜವಾದ React ಕೋಡ್ ಅನ್ನು ರಚಿಸುತ್ತದೆ — ಒಂದೇ ಪ್ರಾಂಪ್ಟ್‌ನಿಂದ ವೆಬ್ + ಮೊಬೈಲ್ — ಪ್ರತಿ ಪ್ರಕಟಣೆಯಲ್ಲಿ ಲೈವ್ ಭದ್ರತಾ ಸ್ಕ್ಯಾನ್‌ನೊಂದಿಗೆ.',
    blurb: 'WyberAi vs Softr ನ ಪ್ರಾಮಾಣಿಕ ಹೋಲಿಕೆ: ಮಾಲೀಕತ್ವ, ಬೆಲೆ, ಮೊಬೈಲ್ ಔಟ್‌ಪುಟ್, ಭದ್ರತಾ ಮಾದರಿ, ಮತ್ತು ಪ್ರತಿಯೊಂದೂ ಯಾವಾಗ ಸರಿಯಾದ ಆಯ್ಕೆ. ಜುಲೈ 2026 ರಲ್ಲಿ ಪರಿಶೀಲಿಸಲಾಗಿದೆ.',
    pillarNote: 'Softr ಆ್ಯಪ್‌ಗಳು Softr ನ ಪ್ಲಾಟ್‌ಫಾರ್ಮ್‌ನಲ್ಲಿ ಇರುತ್ತವೆ — ಎಕ್ಸ್‌ಪೋರ್ಟ್ ಮಾಡಲು ಯಾವುದೇ ಕೋಡ್ ಇಲ್ಲ.',
    rows: [
      { feature: 'ಆರಂಭಿಕ ಬೆಲೆ', wyber: '$29/ತಿಂಗಳು (Starter)', other: '$49/ತಿಂಗಳು (Basic), $269/ತಿಂಗಳು Business', winner: 'wyber' },
      { feature: 'ನಿಮಗೆ ಏನು ಸಿಗುತ್ತದೆ', wyber: 'ನಿಜವಾದ React + Supabase ಕೋಡ್', other: 'Softr ಪ್ಲಾಟ್‌ಫಾರ್ಮ್‌ನಲ್ಲಿ ಹೋಸ್ಟ್ ಮಾಡಿದ ಆ್ಯಪ್', winner: 'wyber' },
      { feature: 'ಕೋಡ್ ಎಕ್ಸ್‌ಪೋರ್ಟ್ / GitHub', wyber: '✓ ಪೂರ್ಣ ಮಾಲೀಕತ್ವ', other: '✗ ಪ್ಲಾಟ್‌ಫಾರ್ಮ್‌ನಲ್ಲೇ ಉಳಿಯುತ್ತದೆ', winner: 'wyber' },
      { feature: 'ನೇಟಿವ್ ಮೊಬೈಲ್ ಆ್ಯಪ್‌ಗಳು', wyber: '✓ React Native + Expo', other: '✗ (PWA ರ‍್ಯಾಪರ್ ಮಾತ್ರ)', winner: 'wyber' },
      { feature: 'ಲೈವ್ ಡೇಟಾಬೇಸ್ ಭದ್ರತಾ ಸ್ಕ್ಯಾನ್', wyber: '✓ anon key ಮೂಲಕ RLS ಪರಿಶೀಲನೆ', other: '✗ (ಪ್ಲಾಟ್‌ಫಾರ್ಮ್-ನಿರ್ವಹಿತ)', winner: 'wyber' },
      { feature: 'ನಿಮ್ಮ ಆ್ಯಪ್‌ನೊಂದಿಗೆ ಯಾವಾಗ ಬೇಕಾದರೂ ಬಿಟ್ಟುಹೋಗಿ', wyber: '✓ ಸ್ಟ್ಯಾಂಡರ್ಡ್ React + Vite', other: '✗ ಮತ್ತೆ ಮೊದಲಿನಿಂದ ನಿರ್ಮಿಸಬೇಕು', winner: 'wyber' },
      { feature: 'ವರ್ಕ್‌ಫ್ಲೋ ಆಟೊಮೇಷನ್‌ಗಳು', wyber: 'ರೋಡ್‌ಮ್ಯಾಪ್‌ನಲ್ಲಿ', other: '✓ ಬಿಲ್ಟ್-ಇನ್, ಪ್ರೌಢ', winner: 'other' },
      { feature: 'ಸೂಕ್ಷ್ಮ ಬಳಕೆದಾರ ಅನುಮತಿಗಳು', wyber: 'Supabase RLS ಮೂಲಕ', other: '✓ ವಿಷುಯಲ್ ಪರ್ಮಿಷನ್ ಬಿಲ್ಡರ್', winner: 'other' },
      { feature: 'ತಂಡದ ಸೀಟುಗಳು ಮತ್ತು ಸಹಯೋಗ', wyber: 'ರೋಡ್‌ಮ್ಯಾಪ್‌ನಲ್ಲಿ', other: '✓ ಮಲ್ಟಿ-ಸೀಟ್ ಪ್ಲಾನ್‌ಗಳು', winner: 'other' },
      { feature: 'ಟೆಂಪ್ಲೇಟ್ ಪರಿಸರ ವ್ಯವಸ್ಥೆ', wyber: 'ಬೆಳೆಯುತ್ತಿದೆ', other: '✓ ದೊಡ್ಡದು, 6 ವರ್ಷಗಳ ಟೆಂಪ್ಲೇಟ್‌ಗಳು', winner: 'other' },
      { feature: 'Airtable / Sheets ಫ್ರಂಟ್‌ಎಂಡ್‌ಗಳು', wyber: '✗', other: '✓ ಮೂಲ ಪ್ರಮುಖ ಶಕ್ತಿ', winner: 'other' },
      { feature: 'ಕಸ್ಟಮ್ ಡೊಮೈನ್', wyber: '✓', other: '✓ (ಪೇಯ್ಡ್ ಪ್ಲಾನ್‌ಗಳು)', winner: 'tie' },
      { feature: 'AI ರಚನೆ ಕ್ರೆಡಿಟ್‌ಗಳು', wyber: 'ಎಲ್ಲಾ ಪ್ಲಾನ್‌ಗಳು, ಟಾಪ್-ಅಪ್‌ಗಳು ಎಂದಿಗೂ ಅವಧಿ ಮುಗಿಯುವುದಿಲ್ಲ', other: '$269 ಪ್ಲಾನ್‌ನಲ್ಲಿ 100 AI ಕ್ರೆಡಿಟ್‌ಗಳು', winner: 'wyber' },
    ],
    faqs: [
      { q: 'WyberAi ಮತ್ತು Softr ನಡುವಿನ ಮುಖ್ಯ ವ್ಯತ್ಯಾಸವೇನು?', a: 'Softr Softr ನ ಪ್ಲಾಟ್‌ಫಾರ್ಮ್‌ನಲ್ಲಿ ಇರುವ ಹೋಸ್ಟ್ ಮಾಡಿದ ಆ್ಯಪ್ ಅನ್ನು ರಚಿಸುತ್ತದೆ — ನೀವು ಅದನ್ನು ಕಾನ್ಫಿಗರ್ ಮಾಡುತ್ತೀರಿ, ಅವರು ಅದನ್ನು ರನ್ ಮಾಡುತ್ತಾರೆ, ಮತ್ತು ನೀವು ಬಿಟ್ಟುಹೋದರೆ ಮತ್ತೆ ಮೊದಲಿನಿಂದ ನಿರ್ಮಿಸಬೇಕು. WyberAi ನೀವು ಸ್ವಂತವಾಗಿಸಿಕೊಳ್ಳುವ ನಿಜವಾದ React + Supabase ಕೋಡ್ ಅನ್ನು ರಚಿಸುತ್ತದೆ: ಅದನ್ನು GitHub ಗೆ ಎಕ್ಸ್‌ಪೋರ್ಟ್ ಮಾಡಿ, ಎಲ್ಲಿ ಬೇಕಾದರೂ ಡಿಪ್ಲಾಯ್ ಮಾಡಿ, ಅದನ್ನು ವಿಸ್ತರಿಸಲು ಡೆವಲಪರ್ ಅನ್ನು ನೇಮಿಸಿ. ಒಂದು ಬಾಡಿಗೆ; ಇನ್ನೊಂದು ಮಾಲೀಕತ್ವ.' },
      { q: 'Softr ಯಾವಾಗ ಉತ್ತಮ ಆಯ್ಕೆ?', a: 'ಪ್ರಾಮಾಣಿಕವಾಗಿ ಹೇಳುವುದಾದರೆ: ನಿಮಗೆ Airtable ಅಥವಾ Google Sheets ಮೇಲೆ ಆಂತರಿಕ ಪರಿಕರ ಅಥವಾ ಕ್ಲೈಂಟ್ ಪೋರ್ಟಲ್ ಬೇಕಿದ್ದರೆ, ವಿಷುಯಲ್ ಪರ್ಮಿಷನ್ ನಿಯಮಗಳು ಮತ್ತು ವರ್ಕ್‌ಫ್ಲೋ ಆಟೊಮೇಷನ್‌ಗಳೊಂದಿಗೆ, ಮತ್ತು ನಿಮಗೆ ಕೋಡ್ ಮಾಲೀಕತ್ವದ ಬಗ್ಗೆ ಚಿಂತೆ ಇಲ್ಲದಿದ್ದರೆ — Softr ಅದರಲ್ಲಿ ನಿಖರವಾಗಿ ಪ್ರೌಢವಾಗಿದೆ. WyberAi ವೆಬ್ ಮತ್ತು ಮೊಬೈಲ್‌ನಲ್ಲಿ ನಿಜವಾದ ಬಳಕೆದಾರರಿಗೆ ನಿಜವಾದ ಉತ್ಪನ್ನವನ್ನು ಸ್ವಂತ ಕೋಡ್‌ನೊಂದಿಗೆ ಶಿಪ್ ಮಾಡುವ ಫೌಂಡರ್‌ಗಳಿಗಾಗಿ ನಿರ್ಮಿಸಲಾಗಿದೆ.' },
      { q: 'ಬೆಲೆಗಳು ಹೇಗೆ ಹೋಲಿಕೆಯಾಗುತ್ತವೆ?', a: 'WyberAi $29/ತಿಂಗಳಿನಿಂದ ಪ್ರಾರಂಭವಾಗುತ್ತದೆ (ಭಾರತ: UPI ಯೊಂದಿಗೆ ₹499/ತಿಂಗಳು). Softr ನ Basic ಪ್ಲಾನ್ $49/ತಿಂಗಳು, ಮತ್ತು ಹೆಚ್ಚಿನ ತಂಡಗಳಿಗೆ ಬೇಕಾದ Business ಪ್ಲಾನ್ $269/ತಿಂಗಳು, 100 AI ಕ್ರೆಡಿಟ್‌ಗಳೊಂದಿಗೆ. ಒಬ್ಬಂಟಿ ಫೌಂಡರ್‌ಗೆ, WyberAi ಯ ವೆಚ್ಚವು Softr ಅನ್ನು ಅದರ AI ವೈಶಿಷ್ಟ್ಯಗಳಿರುವ ಟಿಯರ್‌ನಲ್ಲಿ ಚಲಾಯಿಸುವ ವೆಚ್ಚದ ಸುಮಾರು ಹತ್ತನೇ ಒಂದು ಭಾಗ.' },
      { q: 'Softr ಮೊಬೈಲ್ ಆ್ಯಪ್‌ಗಳನ್ನು ನಿರ್ಮಿಸಬಹುದೇ?', a: 'Softr PWA ರ‍್ಯಾಪರ್ ಅನ್ನು ನೀಡುತ್ತದೆ (ನಿಮ್ಮ ವೆಬ್ ಆ್ಯಪ್ ಅನ್ನು ಹೋಮ್ ಸ್ಕ್ರೀನ್‌ಗೆ ಇನ್‌ಸ್ಟಾಲ್ ಮಾಡಲಾಗಿದೆ), ನೇಟಿವ್ ಮೊಬೈಲ್ ಆ್ಯಪ್‌ಗಳಲ್ಲ. WyberAi ನಿಮ್ಮ ವೆಬ್ ಆ್ಯಪ್‌ನಂತೆಯೇ ಅದೇ ಪ್ರಾಂಪ್ಟ್‌ನಿಂದ ನಿಜವಾದ React Native + Expo ಆ್ಯಪ್‌ಗಳನ್ನು ರಚಿಸುತ್ತದೆ — ನಿಮ್ಮ ಫೋನ್‌ನಲ್ಲಿ ಪ್ರಿವ್ಯೂ ಮಾಡಬಹುದು ಮತ್ತು App Store ಮತ್ತು Google Play ಗೆ ಸಲ್ಲಿಸಬಹುದು.' },
      { q: 'ನಾನು ಶಿಪ್ ಮಾಡುವುದರ ಭದ್ರತೆಯನ್ನು ಯಾರು ಪರಿಶೀಲಿಸುತ್ತಾರೆ?', a: 'Softr ನಲ್ಲಿ, ಪ್ಲಾಟ್‌ಫಾರ್ಮ್ ಭದ್ರತೆಯನ್ನು ನಿರ್ವಹಿಸುತ್ತದೆ — ನೀವು ಅವರ ಮೂಲಸೌಕರ್ಯ ಮತ್ತು ಅವರ ಅನುಮತಿ ವ್ಯವಸ್ಥೆಯನ್ನು ನಂಬುತ್ತೀರಿ. WyberAi ನಲ್ಲಿ, ನಿಮ್ಮ ಆ್ಯಪ್‌ಗೆ ಅದರದೇ ಆದ ಡೇಟಾಬೇಸ್ ಇದೆ, ಮತ್ತು WyberAi ಸಾರ್ವಜನಿಕ anon key ಬಳಸಿ ಅದರ ವಿರುದ್ಧ ಲೈವ್ RLS ಟ್ರಸ್ಟ್ ಸ್ಕ್ಯಾನ್ ಅನ್ನು ಚಲಾಯಿಸುತ್ತದೆ — ದಾಳಿಕೋರರಿಗೆ ಸಿಗುವ ಅದೇ ವೀಕ್ಷಣೆ — ಮತ್ತು ಇದು ಗಂಭೀರ ಡೇಟಾ ಸೋರಿಕೆಗಳನ್ನು ಕಂಡುಕೊಂಡರೆ ಪ್ರಕಟಣೆಯನ್ನು ನಿರ್ಬಂಧಿಸುತ್ತದೆ. 2026 ರಲ್ಲಿ, ಸಂಶೋಧಕರು ಸಾವಿರಾರು AI-ನಿರ್ಮಿತ ಆ್ಯಪ್‌ಗಳು ಡೇಟಾ ಸೋರಿಕೆ ಮಾಡುತ್ತಿರುವುದನ್ನು ಕಂಡುಕೊಳ್ಳುತ್ತಿರುವಾಗ, "ನಾವು ನಿಜವಾಗಿಯೂ ನಿಮ್ಮ ಲೈವ್ ಡೇಟಾಬೇಸ್ ಅನ್ನು ಪರಿಶೀಲಿಸುತ್ತೇವೆ" ಎಂಬುದು ಒಂದು ಚೆಕ್‌ಬಾಕ್ಸ್ ವೈಶಿಷ್ಟ್ಯವಲ್ಲ.' },
      { q: 'ನಾನು Softr ನಿಂದ WyberAi ಗೆ ವಲಸೆ ಹೋಗಬಹುದೇ?', a: 'Softr ನಿಂದ ಎಕ್ಸ್‌ಪೋರ್ಟ್ ಮಾಡಲು ಯಾವುದೇ ಕೋಡ್ ಇಲ್ಲ, ಆದ್ದರಿಂದ ವಲಸೆ ಎಂದರೆ ನಿಮ್ಮ ಆ್ಯಪ್ ಅನ್ನು WyberAi ಗೆ ವಿವರಿಸುವುದು ಮತ್ತು ಮತ್ತೆ ನಿರ್ಮಿಸುವುದು — ಹೆಚ್ಚಿನ ಆ್ಯಪ್‌ಗಳು ನಿಮಿಷಗಳಲ್ಲಿ ರಚನೆಯಾಗುತ್ತವೆ, ಮತ್ತು ನಿಮ್ಮ ಡೇಟಾ Airtable/Sheets ನಿಂದ CSV ಎಕ್ಸ್‌ಪೋರ್ಟ್ ಮೂಲಕ Supabase ಗೆ ಚಲಿಸಬಹುದು. ಪ್ರಯೋಜನ: ವಲಸೆ ಹೋದ ನಂತರ, ನೀವು ಫಲಿತಾಂಶದ ಮಾಲೀಕರಾಗಿರುತ್ತೀರಿ.' },
    ],
  },
  te: {
    tagline: 'Softr అంతర్గత సాధనాలు మరియు క్లయింట్ పోర్టల్స్ కోసం ఒక పరిణతి చెందిన నో-కోడ్ ప్లాట్‌ఫారమ్. WyberAi మీరు సొంతం చేసుకునే నిజమైన React కోడ్‌ను రూపొందిస్తుంది — ఒకే ప్రాంప్ట్ నుండి వెబ్ + మొబైల్ — ప్రతి పబ్లిష్‌లో లైవ్ భద్రతా స్కాన్‌తో.',
    blurb: 'WyberAi vs Softr యొక్క నిజాయితీ పోలిక: యాజమాన్యం, ధర, మొబైల్ అవుట్‌పుట్, భద్రతా మోడల్, మరియు ప్రతి ఒక్కటి ఎప్పుడు సరైన ఎంపిక. జూలై 2026లో ధృవీకరించబడింది.',
    pillarNote: 'Softr యాప్‌లు Softr ప్లాట్‌ఫారమ్‌పై ఉంటాయి — ఎగుమతి చేయడానికి కోడ్ లేదు.',
    rows: [
      { feature: 'ప్రారంభ ధర', wyber: '$29/నెల (Starter)', other: '$49/నెల (Basic), $269/నెల Business', winner: 'wyber' },
      { feature: 'మీకు ఏమి లభిస్తుంది', wyber: 'నిజమైన React + Supabase కోడ్', other: 'Softr ప్లాట్‌ఫారమ్‌పై హోస్ట్ చేసిన యాప్', winner: 'wyber' },
      { feature: 'కోడ్ ఎగుమతి / GitHub', wyber: '✓ పూర్తి యాజమాన్యం', other: '✗ ప్లాట్‌ఫారమ్‌పైనే ఉంటుంది', winner: 'wyber' },
      { feature: 'నేటివ్ మొబైల్ యాప్‌లు', wyber: '✓ React Native + Expo', other: '✗ (PWA ర్యాపర్ మాత్రమే)', winner: 'wyber' },
      { feature: 'లైవ్ డేటాబేస్ భద్రతా స్కాన్', wyber: '✓ anon key తో RLS తనిఖీ', other: '✗ (ప్లాట్‌ఫారమ్-నిర్వహిత)', winner: 'wyber' },
      { feature: 'మీ యాప్‌తో ఎప్పుడైనా వదిలివేయండి', wyber: '✓ స్టాండర్డ్ React + Vite', other: '✗ మొదటి నుండి తిరిగి నిర్మించాలి', winner: 'wyber' },
      { feature: 'వర్క్‌ఫ్లో ఆటోమేషన్‌లు', wyber: 'రోడ్‌మ్యాప్‌లో', other: '✓ బిల్ట్-ఇన్, పరిణతి చెందినది', winner: 'other' },
      { feature: 'సూక్ష్మ వినియోగదారు అనుమతులు', wyber: 'Supabase RLS ద్వారా', other: '✓ విజువల్ పర్మిషన్ బిల్డర్', winner: 'other' },
      { feature: 'టీమ్ సీట్లు & సహకారం', wyber: 'రోడ్‌మ్యాప్‌లో', other: '✓ మల్టీ-సీట్ ప్లాన్‌లు', winner: 'other' },
      { feature: 'టెంప్లేట్ పర్యావరణ వ్యవస్థ', wyber: 'పెరుగుతోంది', other: '✓ పెద్దది, 6 సంవత్సరాల టెంప్లేట్‌లు', winner: 'other' },
      { feature: 'Airtable / Sheets ఫ్రంట్‌ఎండ్‌లు', wyber: '✗', other: '✓ అసలైన ప్రధాన బలం', winner: 'other' },
      { feature: 'కస్టమ్ డొమైన్', wyber: '✓', other: '✓ (పెయిడ్ ప్లాన్‌లు)', winner: 'tie' },
      { feature: 'AI జనరేషన్ క్రెడిట్లు', wyber: 'అన్ని ప్లాన్‌లు, టాప్-అప్‌లు ఎప్పటికీ గడువు ముగియవు', other: '$269 ప్లాన్‌పై 100 AI క్రెడిట్లు', winner: 'wyber' },
    ],
    faqs: [
      { q: 'WyberAi మరియు Softr మధ్య ప్రధాన తేడా ఏమిటి?', a: 'Softr Softr ప్లాట్‌ఫారమ్‌పై ఉండే హోస్ట్ చేసిన యాప్‌ను రూపొందిస్తుంది — మీరు దాన్ని కాన్ఫిగర్ చేస్తారు, వారు దాన్ని రన్ చేస్తారు, మీరు వదిలివేస్తే మొదటి నుండి తిరిగి నిర్మించాలి. WyberAi మీరు సొంతం చేసుకునే నిజమైన React + Supabase కోడ్‌ను రూపొందిస్తుంది: దాన్ని GitHubకి ఎగుమతి చేయండి, ఎక్కడైనా డిప్లాయ్ చేయండి, దాన్ని విస్తరించడానికి డెవలపర్‌ను నియమించుకోండి. ఒకటి అద్దెకు తీసుకోవడం; మరొకటి సొంతం చేసుకోవడం.' },
      { q: 'Softr ఎప్పుడు మెరుగైన ఎంపిక?', a: 'నిజాయితీగా చెప్పాలంటే: మీకు Airtable లేదా Google Sheets పైన అంతర్గత సాధనం లేదా క్లయింట్ పోర్టల్ కావాలంటే, విజువల్ పర్మిషన్ నియమాలు మరియు వర్క్‌ఫ్లో ఆటోమేషన్‌లతో, మరియు కోడ్ యాజమాన్యం గురించి మీకు పట్టింపు లేకపోతే — Softr సరిగ్గా అందులో పరిణతి చెందింది. WyberAi వెబ్ మరియు మొబైల్‌లో నిజమైన వినియోగదారులకు నిజమైన ఉత్పత్తిని, వారి సొంత కోడ్‌తో షిప్ చేసే ఫౌండర్ల కోసం నిర్మించబడింది.' },
      { q: 'ధరలు ఎలా పోలుస్తాయి?', a: 'WyberAi నెలకు $29 నుండి ప్రారంభమవుతుంది (భారత్: UPIతో నెలకు ₹499). Softr యొక్క Basic ప్లాన్ నెలకు $49, మరియు చాలా బృందాలకు అవసరమైన Business ప్లాన్ నెలకు $269, 100 AI క్రెడిట్లతో. ఒక సోలో ఫౌండర్‌కు, WyberAi ధర Softr యొక్క AI ఫీచర్లు ఉన్న టైర్‌ను నడపడానికి అయ్యే ఖర్చులో దాదాపు పదో వంతు.' },
      { q: 'Softr మొబైల్ యాప్‌లను నిర్మించగలదా?', a: 'Softr ఒక PWA ర్యాపర్‌ను అందిస్తుంది (మీ వెబ్ యాప్ హోమ్ స్క్రీన్‌కు ఇన్‌స్టాల్ చేయబడింది), నేటివ్ మొబైల్ యాప్‌లు కాదు. WyberAi మీ వెబ్ యాప్ లాంటి అదే ప్రాంప్ట్ నుండి నిజమైన React Native + Expo యాప్‌లను రూపొందిస్తుంది — మీ ఫోన్‌లో ప్రివ్యూ చేసుకోవచ్చు మరియు App Store మరియు Google Playకి సమర్పించవచ్చు.' },
      { q: 'నేను షిప్ చేసేదాని భద్రతను ఎవరు తనిఖీ చేస్తారు?', a: 'Softrలో, ప్లాట్‌ఫారమ్ భద్రతను నిర్వహిస్తుంది — మీరు వారి ఇన్‌ఫ్రాస్ట్రక్చర్ మరియు వారి అనుమతి వ్యవస్థను నమ్ముతారు. WyberAiలో, మీ యాప్‌కు దాని స్వంత డేటాబేస్ ఉంది, మరియు WyberAi పబ్లిక్ anon keyని ఉపయోగించి దానికి వ్యతిరేకంగా లైవ్ RLS ట్రస్ట్ స్కాన్‌ను నడుపుతుంది — దాడి చేసేవారికి లభించే అదే వీక్షణ — మరియు క్లిష్టమైన డేటా లీక్‌లను కనుగొంటే పబ్లిషింగ్‌ను నిరోధిస్తుంది. 2026లో, పరిశోధకులు వేలాది AI-నిర్మిత యాప్‌లు డేటాను లీక్ చేస్తున్నట్లు కనుగొంటున్నప్పుడు, "మేము నిజంగా మీ లైవ్ డేటాబేస్‌ను పరిశీలిస్తాము" అనేది చెక్‌బాక్స్ ఫీచర్ కాదు.' },
      { q: 'నేను Softr నుండి WyberAiకి మైగ్రేట్ చేయవచ్చా?', a: 'Softr నుండి ఎగుమతి చేయడానికి కోడ్ లేదు, కాబట్టి మైగ్రేషన్ అంటే మీ యాప్‌ను WyberAiకి వివరించడం మరియు తిరిగి నిర్మించడం — చాలా యాప్‌లు నిమిషాల్లో రూపొందుతాయి, మరియు మీ డేటా Airtable/Sheets నుండి CSV ఎగుమతి ద్వారా Supabaseకి తరలించవచ్చు. లాభం: మైగ్రేట్ చేసిన తర్వాత, మీరు ఫలితానికి యజమాని అవుతారు.' },
    ],
  },
  ta: {
    tagline: 'Softr உள்நாட்டு கருவிகள் மற்றும் கிளையன்ட் போர்ட்டல்களுக்கான முதிர்ந்த நோ-கோட் தளம். WyberAi நீங்கள் சொந்தமாக்கிக்கொள்ளும் உண்மையான React கோடை உருவாக்குகிறது — ஒரே ப்ராம்ப்ட்டிலிருந்து வெப் + மொபைல் — ஒவ்வொரு வெளியீட்டிலும் நேரடி பாதுகாப்பு ஸ்கேனுடன்.',
    blurb: 'WyberAi vs Softr இன் நேர்மையான ஒப்பீடு: உரிமை, விலை, மொபைல் வெளியீடு, பாதுகாப்பு மாதிரி, மற்றும் ஒவ்வொன்றும் எப்போது சரியான தேர்வு. ஜூலை 2026 இல் சரிபார்க்கப்பட்டது.',
    pillarNote: 'Softr ஆப்கள் Softr இன் தளத்தில் வாழ்கின்றன — ஏற்றுமதி செய்ய கோடு இல்லை.',
    rows: [
      { feature: 'நுழைவு விலை', wyber: '$29/மாதம் (Starter)', other: '$49/மாதம் (Basic), $269/மாதம் Business', winner: 'wyber' },
      { feature: 'உங்களுக்கு என்ன கிடைக்கும்', wyber: 'உண்மையான React + Supabase கோடு', other: 'Softr தளத்தில் ஹோஸ்ட் செய்யப்பட்ட ஆப்', winner: 'wyber' },
      { feature: 'கோடு ஏற்றுமதி / GitHub', wyber: '✓ முழு உரிமை', other: '✗ தளத்திலேயே இருக்கும்', winner: 'wyber' },
      { feature: 'நேட்டிவ் மொபைல் ஆப்கள்', wyber: '✓ React Native + Expo', other: '✗ (PWA ரேப்பர் மட்டும்)', winner: 'wyber' },
      { feature: 'நேரடி தரவுத்தள பாதுகாப்பு ஸ்கேன்', wyber: '✓ anon key மூலம் RLS சோதனை', other: '✗ (தளம்-நிர்வகிக்கப்படுவது)', winner: 'wyber' },
      { feature: 'உங்கள் ஆப்புடன் எப்போது வேண்டுமானாலும் விட்டுச் செல்லுங்கள்', wyber: '✓ நிலையான React + Vite', other: '✗ முதலிலிருந்து மீண்டும் கட்ட வேண்டும்', winner: 'wyber' },
      { feature: 'ஒர்க்ஃப்ளோ ஆட்டோமேஷன்கள்', wyber: 'திட்டமிடலில்', other: '✓ உள்ளமைந்தது, முதிர்ந்தது', winner: 'other' },
      { feature: 'நுணுக்கமான பயனர் அனுமதிகள்', wyber: 'Supabase RLS மூலம்', other: '✓ விஷுவல் பர்மிஷன் பில்டர்', winner: 'other' },
      { feature: 'குழு இடங்கள் & ஒத்துழைப்பு', wyber: 'திட்டமிடலில்', other: '✓ மல்டி-சீட் திட்டங்கள்', winner: 'other' },
      { feature: 'டெம்ப்ளேட் சுற்றுச்சூழல் அமைப்பு', wyber: 'வளர்ந்து வருகிறது', other: '✓ பெரியது, 6 ஆண்டுகால டெம்ப்ளேட்கள்', winner: 'other' },
      { feature: 'Airtable / Sheets ஃப்ரண்ட்எண்டுகள்', wyber: '✗', other: '✓ அசல் முக்கிய பலம்', winner: 'other' },
      { feature: 'தனிப்பயன் டொமைன்', wyber: '✓', other: '✓ (பணம் செலுத்தும் திட்டங்கள்)', winner: 'tie' },
      { feature: 'AI உருவாக்க கிரெடிட்கள்', wyber: 'அனைத்து திட்டங்களும், டாப்-அப்கள் ஒருபோதும் காலாவதியாகாது', other: '$269 திட்டத்தில் 100 AI கிரெடிட்கள்', winner: 'wyber' },
    ],
    faqs: [
      { q: 'WyberAi மற்றும் Softr இடையே உள்ள முக்கிய வேறுபாடு என்ன?', a: 'Softr, Softr இன் தளத்தில் வாழும் ஹோஸ்ட் செய்யப்பட்ட ஆப்பை உருவாக்குகிறது — நீங்கள் அதை உள்ளமைக்கிறீர்கள், அவர்கள் அதை இயக்குகிறார்கள், நீங்கள் விட்டுச் சென்றால் முதலிலிருந்து மீண்டும் கட்ட வேண்டும். WyberAi நீங்கள் சொந்தமாக்கிக்கொள்ளும் உண்மையான React + Supabase கோடை உருவாக்குகிறது: அதை GitHub க்கு ஏற்றுமதி செய்யுங்கள், எங்கு வேண்டுமானாலும் டெப்ளாய் செய்யுங்கள், அதை விரிவாக்க ஒரு டெவலப்பரை பணியமர்த்துங்கள். ஒன்று வாடகைக்கு; மற்றொன்று சொந்தமாக்கிக்கொள்வது.' },
      { q: 'Softr எப்போது சிறந்த தேர்வு?', a: 'நேர்மையாகச் சொல்வதென்றால்: உங்களுக்கு Airtable அல்லது Google Sheets மேல் ஒரு உள்நாட்டு கருவி அல்லது கிளையன்ட் போர்ட்டல் தேவைப்பட்டால், விஷுவல் பர்மிஷன் விதிகள் மற்றும் ஒர்க்ஃப்ளோ ஆட்டோமேஷன்களுடன், மற்றும் கோடு உரிமை பற்றி உங்களுக்குக் கவலை இல்லையென்றால் — Softr சரியாக அதில் முதிர்ந்துள்ளது. WyberAi வெப் மற்றும் மொபைலில் உண்மையான பயனர்களுக்கு உண்மையான தயாரிப்பை, அவர்களின் சொந்த கோடுடன் அனுப்பும் நிறுவனர்களுக்காக கட்டப்பட்டுள்ளது.' },
      { q: 'விலைகள் எப்படி ஒப்பிடுகின்றன?', a: 'WyberAi மாதம் $29 முதல் தொடங்குகிறது (இந்தியா: UPI உடன் மாதம் ₹499). Softr இன் Basic திட்டம் மாதம் $49, மற்றும் பெரும்பாலான குழுக்களுக்குத் தேவையான Business திட்டம் மாதம் $269, 100 AI கிரெடிட்களுடன். ஒரு தனி நிறுவனருக்கு, WyberAi இன் விலை Softr ஐ அதன் AI அம்சங்கள் இருக்கும் நிலையில் இயக்குவதற்கான செலவில் தோராயமாக பத்தில் ஒரு பங்கு.' },
      { q: 'Softr மொபைல் ஆப்களை உருவாக்க முடியுமா?', a: 'Softr ஒரு PWA ரேப்பரை வழங்குகிறது (உங்கள் வெப் ஆப் ஹோம் ஸ்கிரீனில் நிறுவப்பட்டது), நேட்டிவ் மொபைல் ஆப்கள் அல்ல. WyberAi உங்கள் வெப் ஆப் போலவே அதே ப்ராம்ப்ட்டிலிருந்து உண்மையான React Native + Expo ஆப்களை உருவாக்குகிறது — உங்கள் மொபைலில் முன்னோட்டமிடலாம் மற்றும் App Store மற்றும் Google Play க்கு சமர்ப்பிக்கலாம்.' },
      { q: 'நான் அனுப்புவதன் பாதுகாப்பை யார் சரிபார்க்கிறார்கள்?', a: 'Softr இல், தளம் பாதுகாப்பை நிர்வகிக்கிறது — நீங்கள் அவர்களின் உள்கட்டமைப்பு மற்றும் அவர்களின் அனுமதி அமைப்பை நம்புகிறீர்கள். WyberAi இல், உங்கள் ஆப்பிற்கு அதன் சொந்த தரவுத்தளம் உள்ளது, மேலும் WyberAi பொது anon key ஐப் பயன்படுத்தி அதற்கு எதிராக நேரடி RLS நம்பிக்கை ஸ்கேனை இயக்குகிறது — ஒரு தாக்குபவருக்குக் கிடைக்கும் அதே காட்சி — மேலும் இது கடுமையான தரவு கசிவுகளைக் கண்டறிந்தால் வெளியீட்டைத் தடுக்கிறது. 2026 இல், ஆராய்ச்சியாளர்கள் ஆயிரக்கணக்கான AI-கட்டப்பட்ட ஆப்கள் தரவை கசியவிடுவதைக் கண்டறிந்து வரும் நிலையில், "நாங்கள் உண்மையில் உங்கள் நேரடி தரவுத்தளத்தை சோதிக்கிறோம்" என்பது ஒரு செக்பாக்ஸ் அம்சம் அல்ல.' },
      { q: 'நான் Softr இலிருந்து WyberAi க்கு இடம்பெயரலாமா?', a: 'Softr இலிருந்து ஏற்றுமதி செய்ய கோடு இல்லை, எனவே இடம்பெயர்வு என்பது உங்கள் ஆப்பை WyberAi க்கு விவரித்து மீண்டும் கட்டுவதாகும் — பெரும்பாலான ஆப்கள் நிமிடங்களில் உருவாகும், மேலும் உங்கள் தரவு Airtable/Sheets இலிருந்து CSV ஏற்றுமதி வழியாக Supabase க்கு நகரலாம். நன்மை: இடம்பெயர்ந்த பிறகு, நீங்கள் முடிவின் உரிமையாளராக இருப்பீர்கள்.' },
    ],
  },
}
