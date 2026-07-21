import type { Locale } from '../locales'

// AI-drafted, not yet native-reviewed (see AutoTranslateNotice). Content for
// the locale-prefixed /about page (English source: src/app/about/page.tsx).
// Proper nouns (WyberAi, SignalPulse Technologies, product names, founder
// name, city/company names) are intentionally left untranslated.
export interface AboutContent {
  metaTitle: string
  metaDescription: string
  eyebrowAbout: string
  heroLine1: string
  heroLine2: string
  heroBody: string
  eyebrowMission: string
  missionQuote: string
  missionAttribution: string
  founderRole: string
  founderBio: string
  eyebrowFamily: string
  productDescs: Record<string, string>
  getInTouchHeading: string
  getInTouchBody: string
}

export const ABOUT_CONTENT: Record<Locale, AboutContent> = {
  en: {
    metaTitle: 'About',
    metaDescription: 'WyberAi is built by SignalPulse Technologies. We build tools that help founders ship faster.',
    eyebrowAbout: 'About',
    heroLine1: 'We build tools that help',
    heroLine2: 'founders ship faster.',
    heroBody: 'WyberAi is a product of SignalPulse Technologies — a focused software company building AI-powered tools for founders, marketers, and developers.',
    eyebrowMission: 'Our mission',
    missionQuote: '"The best ideas never get built because technical barriers get in the way. We are removing those barriers — one product at a time."',
    missionAttribution: '— Sumeet Sutar, Founder · SignalPulse Technologies',
    founderRole: 'Founder & CEO, SignalPulse Technologies',
    founderBio: '9 years in B2B marketing across Cybersecurity, Cloud Infrastructure, and SaaS. Previously at Dell Technologies, Happiest Minds, and Netenrich. Building the SignalPulse product family from Bengaluru, India.',
    eyebrowFamily: 'SignalPulse product family',
    productDescs: {
      wyberai: 'AI-powered app builder. Turn ideas into live apps.',
      reconsignal: 'Executive intelligence platform for B2B leaders.',
      setuagents: 'AI agents for business automation.',
      continuumapi: 'Email validation and enrichment API.',
    },
    getInTouchHeading: 'Get in touch',
    getInTouchBody: 'Questions, feedback, partnerships — we read every email.',
  },
  hi: {
    metaTitle: 'हमारे बारे में',
    metaDescription: 'WyberAi को SignalPulse Technologies बनाती है। हम फ़ाउंडर्स को तेज़ी से शिप करने में मदद करने वाले टूल्स बनाते हैं।',
    eyebrowAbout: 'हमारे बारे में',
    heroLine1: 'हम ऐसे टूल्स बनाते हैं जो',
    heroLine2: 'फ़ाउंडर्स को तेज़ी से शिप करने में मदद करते हैं।',
    heroBody: 'WyberAi, SignalPulse Technologies का एक प्रोडक्ट है — एक फ़ोकस्ड सॉफ़्टवेयर कंपनी जो फ़ाउंडर्स, मार्केटर्स और डेवलपर्स के लिए AI-पावर्ड टूल्स बनाती है।',
    eyebrowMission: 'हमारा मिशन',
    missionQuote: '"सबसे अच्छे आइडिया कभी नहीं बन पाते क्योंकि तकनीकी बाधाएं रास्ते में आ जाती हैं। हम उन बाधाओं को एक-एक करके हटा रहे हैं।"',
    missionAttribution: '— सुमीत सुतार, फ़ाउंडर · SignalPulse Technologies',
    founderRole: 'फ़ाउंडर और CEO, SignalPulse Technologies',
    founderBio: 'साइबरसिक्योरिटी, क्लाउड इंफ्रास्ट्रक्चर और SaaS में 9 साल का B2B मार्केटिंग अनुभव। पहले Dell Technologies, Happiest Minds और Netenrich में काम किया। बेंगलुरु, भारत से SignalPulse प्रोडक्ट फ़ैमिली बना रहे हैं।',
    eyebrowFamily: 'SignalPulse प्रोडक्ट फ़ैमिली',
    productDescs: {
      wyberai: 'AI-पावर्ड ऐप बिल्डर। आइडिया को लाइव ऐप में बदलें।',
      reconsignal: 'B2B लीडर्स के लिए एग्ज़िक्यूटिव इंटेलिजेंस प्लेटफ़ॉर्म।',
      setuagents: 'बिज़नेस ऑटोमेशन के लिए AI एजेंट्स।',
      continuumapi: 'ईमेल वेरिफिकेशन और एनरिचमेंट API।',
    },
    getInTouchHeading: 'संपर्क करें',
    getInTouchBody: 'सवाल, फ़ीडबैक, पार्टनरशिप — हम हर ईमेल पढ़ते हैं।',
  },
  kn: {
    metaTitle: 'ನಮ್ಮ ಬಗ್ಗೆ',
    metaDescription: 'WyberAi ಅನ್ನು SignalPulse Technologies ನಿರ್ಮಿಸಿದೆ. ಫೌಂಡರ್‌ಗಳು ವೇಗವಾಗಿ ಶಿಪ್ ಮಾಡಲು ಸಹಾಯ ಮಾಡುವ ಟೂಲ್‌ಗಳನ್ನು ನಾವು ನಿರ್ಮಿಸುತ್ತೇವೆ.',
    eyebrowAbout: 'ನಮ್ಮ ಬಗ್ಗೆ',
    heroLine1: 'ನಾವು ಟೂಲ್‌ಗಳನ್ನು ನಿರ್ಮಿಸುತ್ತೇವೆ, ಅವು',
    heroLine2: 'ಫೌಂಡರ್‌ಗಳಿಗೆ ವೇಗವಾಗಿ ಶಿಪ್ ಮಾಡಲು ಸಹಾಯ ಮಾಡುತ್ತವೆ.',
    heroBody: 'WyberAi ಎಂಬುದು SignalPulse Technologies ನ ಒಂದು ಉತ್ಪನ್ನ — ಫೌಂಡರ್‌ಗಳು, ಮಾರ್ಕೆಟರ್‌ಗಳು ಮತ್ತು ಡೆವಲಪರ್‌ಗಳಿಗಾಗಿ AI-ಚಾಲಿತ ಟೂಲ್‌ಗಳನ್ನು ನಿರ್ಮಿಸುವ ಕೇಂದ್ರೀಕೃತ ಸಾಫ್ಟ್‌ವೇರ್ ಕಂಪನಿ.',
    eyebrowMission: 'ನಮ್ಮ ಗುರಿ',
    missionQuote: '"ಅತ್ಯುತ್ತಮ ಆಲೋಚನೆಗಳು ಎಂದಿಗೂ ನಿರ್ಮಾಣವಾಗುವುದಿಲ್ಲ ಏಕೆಂದರೆ ತಾಂತ್ರಿಕ ಅಡೆತಡೆಗಳು ಅಡ್ಡಿಯಾಗುತ್ತವೆ. ನಾವು ಆ ಅಡೆತಡೆಗಳನ್ನು ಒಂದೊಂದಾಗಿ ತೆಗೆದುಹಾಕುತ್ತಿದ್ದೇವೆ."',
    missionAttribution: '— ಸುಮೀತ್ ಸುತಾರ್, ಫೌಂಡರ್ · SignalPulse Technologies',
    founderRole: 'ಫೌಂಡರ್ ಮತ್ತು CEO, SignalPulse Technologies',
    founderBio: 'ಸೈಬರ್‌ಸೆಕ್ಯುರಿಟಿ, ಕ್ಲೌಡ್ ಇನ್‌ಫ್ರಾಸ್ಟ್ರಕ್ಚರ್ ಮತ್ತು SaaS ನಲ್ಲಿ 9 ವರ್ಷಗಳ B2B ಮಾರ್ಕೆಟಿಂಗ್ ಅನುಭವ. ಈ ಹಿಂದೆ Dell Technologies, Happiest Minds ಮತ್ತು Netenrich ನಲ್ಲಿ ಕೆಲಸ ಮಾಡಿದ್ದಾರೆ. ಬೆಂಗಳೂರು, ಭಾರತದಿಂದ SignalPulse ಉತ್ಪನ್ನ ಕುಟುಂಬವನ್ನು ನಿರ್ಮಿಸುತ್ತಿದ್ದಾರೆ.',
    eyebrowFamily: 'SignalPulse ಉತ್ಪನ್ನ ಕುಟುಂಬ',
    productDescs: {
      wyberai: 'AI-ಚಾಲಿತ ಆ್ಯಪ್ ಬಿಲ್ಡರ್. ಆಲೋಚನೆಗಳನ್ನು ಲೈವ್ ಆ್ಯಪ್‌ಗಳಾಗಿ ಪರಿವರ್ತಿಸಿ.',
      reconsignal: 'B2B ನಾಯಕರಿಗಾಗಿ ಎಕ್ಸಿಕ್ಯುಟಿವ್ ಇಂಟೆಲಿಜೆನ್ಸ್ ಪ್ಲಾಟ್‌ಫಾರ್ಮ್.',
      setuagents: 'ವ್ಯವಹಾರ ಆಟೊಮೇಷನ್‌ಗಾಗಿ AI ಏಜೆಂಟ್‌ಗಳು.',
      continuumapi: 'ಇಮೇಲ್ ಪರಿಶೀಲನೆ ಮತ್ತು ಪುಷ್ಟೀಕರಣ API.',
    },
    getInTouchHeading: 'ಸಂಪರ್ಕಿಸಿ',
    getInTouchBody: 'ಪ್ರಶ್ನೆಗಳು, ಪ್ರತಿಕ್ರಿಯೆ, ಪಾಲುದಾರಿಕೆಗಳು — ನಾವು ಪ್ರತಿ ಇಮೇಲ್ ಅನ್ನು ಓದುತ್ತೇವೆ.',
  },
  te: {
    metaTitle: 'మా గురించి',
    metaDescription: 'WyberAi ని SignalPulse Technologies నిర్మించింది. ఫౌండర్‌లు వేగంగా షిప్ చేయడంలో సహాయపడే టూల్స్‌ను మేము నిర్మిస్తాము.',
    eyebrowAbout: 'మా గురించి',
    heroLine1: 'మేము టూల్స్‌ను నిర్మిస్తాము, అవి',
    heroLine2: 'ఫౌండర్‌లు వేగంగా షిప్ చేయడంలో సహాయపడతాయి.',
    heroBody: 'WyberAi అనేది SignalPulse Technologies యొక్క ఉత్పత్తి — ఫౌండర్‌లు, మార్కెటర్‌లు మరియు డెవలపర్‌ల కోసం AI-ఆధారిత టూల్స్‌ను నిర్మించే కేంద్రీకృత సాఫ్ట్‌వేర్ కంపెనీ.',
    eyebrowMission: 'మా లక్ష్యం',
    missionQuote: '"ఉత్తమ ఆలోచనలు ఎప్పటికీ నిర్మించబడవు ఎందుకంటే సాంకేతిక అడ్డంకులు అడ్డుపడతాయి. మేము ఆ అడ్డంకులను ఒక్కొక్కటిగా తొలగిస్తున్నాము."',
    missionAttribution: '— సుమీత్ సుతార్, ఫౌండర్ · SignalPulse Technologies',
    founderRole: 'ఫౌండర్ మరియు CEO, SignalPulse Technologies',
    founderBio: 'సైబర్‌సెక్యూరిటీ, క్లౌడ్ ఇన్‌ఫ్రాస్ట్రక్చర్ మరియు SaaS లో 9 సంవత్సరాల B2B మార్కెటింగ్ అనుభవం. గతంలో Dell Technologies, Happiest Minds మరియు Netenrich లో పనిచేశారు. బెంగళూరు, భారతదేశం నుండి SignalPulse ఉత్పత్తి కుటుంబాన్ని నిర్మిస్తున్నారు.',
    eyebrowFamily: 'SignalPulse ఉత్పత్తి కుటుంబం',
    productDescs: {
      wyberai: 'AI-ఆధారిత యాప్ బిల్డర్. ఆలోచనలను లైవ్ యాప్‌లుగా మార్చండి.',
      reconsignal: 'B2B నాయకుల కోసం ఎగ్జిక్యూటివ్ ఇంటెలిజెన్స్ ప్లాట్‌ఫారమ్.',
      setuagents: 'వ్యాపార ఆటోమేషన్ కోసం AI ఏజెంట్లు.',
      continuumapi: 'ఇమెయిల్ వాలిడేషన్ మరియు ఎన్రిచ్‌మెంట్ API.',
    },
    getInTouchHeading: 'సంప్రదించండి',
    getInTouchBody: 'ప్రశ్నలు, అభిప్రాయం, భాగస్వామ్యాలు — మేము ప్రతి ఇమెయిల్‌ను చదువుతాము.',
  },
  ta: {
    metaTitle: 'எங்களைப் பற்றி',
    metaDescription: 'WyberAi ஐ SignalPulse Technologies உருவாக்குகிறது. நிறுவனர்கள் வேகமாக ஷிப் செய்ய உதவும் கருவிகளை நாங்கள் உருவாக்குகிறோம்.',
    eyebrowAbout: 'எங்களைப் பற்றி',
    heroLine1: 'நாங்கள் கருவிகளை உருவாக்குகிறோம், அவை',
    heroLine2: 'நிறுவனர்களுக்கு வேகமாக ஷிப் செய்ய உதவுகின்றன.',
    heroBody: 'WyberAi என்பது SignalPulse Technologies இன் ஒரு தயாரிப்பு — நிறுவனர்கள், மார்க்கெட்டர்கள் மற்றும் டெவலப்பர்களுக்காக AI-இயங்கும் கருவிகளை உருவாக்கும் கவனம் செலுத்தும் மென்பொருள் நிறுவனம்.',
    eyebrowMission: 'எங்கள் நோக்கம்',
    missionQuote: '"சிறந்த யோசனைகள் ஒருபோதும் உருவாக்கப்படுவதில்லை, ஏனெனில் தொழில்நுட்ப தடைகள் வழியில் வருகின்றன. நாங்கள் அந்த தடைகளை ஒவ்வொன்றாக நீக்குகிறோம்."',
    missionAttribution: '— சுமீத் சுதார், நிறுவனர் · SignalPulse Technologies',
    founderRole: 'நிறுவனர் மற்றும் CEO, SignalPulse Technologies',
    founderBio: 'சைபர்பாதுகாப்பு, கிளவுட் இன்ஃப்ராஸ்ட்ரக்சர் மற்றும் SaaS இல் 9 ஆண்டுகள் B2B மார்க்கெட்டிங் அனுபவம். முன்பு Dell Technologies, Happiest Minds மற்றும் Netenrich இல் பணியாற்றியவர். பெங்களூரு, இந்தியாவிலிருந்து SignalPulse தயாரிப்பு குடும்பத்தை உருவாக்குகிறார்.',
    eyebrowFamily: 'SignalPulse தயாரிப்பு குடும்பம்',
    productDescs: {
      wyberai: 'AI-இயங்கும் ஆப் பில்டர். யோசனைகளை நேரடி ஆப்களாக மாற்றுங்கள்.',
      reconsignal: 'B2B தலைவர்களுக்கான நிர்வாக நுண்ணறிவு தளம்.',
      setuagents: 'வணிக ஆட்டோமேஷனுக்கான AI ஏஜென்ட்கள்.',
      continuumapi: 'மின்னஞ்சல் சரிபார்ப்பு மற்றும் செறிவூட்டல் API.',
    },
    getInTouchHeading: 'தொடர்பு கொள்ளுங்கள்',
    getInTouchBody: 'கேள்விகள், கருத்துகள், கூட்டாண்மைகள் — நாங்கள் ஒவ்வொரு மின்னஞ்சலையும் படிக்கிறோம்.',
  },
}
