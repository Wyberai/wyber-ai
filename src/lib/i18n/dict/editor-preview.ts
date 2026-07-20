import type { Locale } from '../locales';

// AI-drafted, not yet native-reviewed (see AutoTranslateNotice) — covers
// src/components/editor/PreviewPanel.tsx (build status, self-heal/hang-watchdog
// banners, visual-edit inspector, refresh/device controls). Proper nouns
// (WyberAi, Supabase, CORS) are intentionally left untranslated — only UI
// chrome and authored copy are keyed here. Several long banners are split
// into pre/word/post pieces so a single word (e.g. "paused", "frozen") can
// stay wrapped in a <strong> tag around the translated fragment.
export const EDITOR_PREVIEW_STRINGS: Record<Locale, Record<string, string>> = {
  en: {
    // Build status "cooking" messages, cycled while a build is in flight
    buildMsg1: 'Cooking up your components...',
    buildMsg2: 'Wiring the buttons...',
    buildMsg3: 'Teaching pixels where to sit...',
    buildMsg4: 'Mixing the color palette...',
    buildMsg5: 'Bundling it all together...',
    buildMsg6: 'Polishing the corners...',
    buildMsg7: 'Almost plated and ready...',

    // Toolbar status strip
    writingLabel: 'Writing your app...',
    readyLabel: 'Ready',
    describeToBuildLabel: 'Describe what you want to build',
    buildFailedFallback: 'Build failed',
    couldNotReachBuilderPrefix: 'Could not reach preview builder: ',
    builtInPrefix: 'Built in ',

    // Toolbar buttons
    selectElementTitle: 'Click an element to edit it',
    selectingLabel: 'Selecting',
    selectLabel: 'Select',
    rebuildTitle: 'Rebuild preview',
    openNewTabTitle: 'Open preview in a new tab',
    buildPreviewBtn: 'Build preview',

    // Paused-database banner
    dbPausedPre: '⏸ Your Supabase database is ',
    dbPausedWord: 'paused',
    dbPausedPost: " (free projects pause after a week of inactivity) — nothing will load or save until it's restored.",
    restoreNowBtn: 'Restore now',
    restoringDbMsg: 'Restoring your database — usually takes under a minute…',

    // Hang watchdog banner
    hungPre: '⚠ The preview seems to have ',
    hungWord: 'frozen',
    hungPost: ' (unresponsive for 10s+) — this usually means something in the app is stuck in a loop.',
    reloadPreviewBtn: 'Reload preview',

    // CORS notice
    corsPre: '⚠ This app tried to call ',
    corsExternalApiFallback: 'an external API',
    corsPost: " directly from the browser, and that API's server doesn't allow requests from this origin (CORS). This usually needs a server-side proxy for that call, not a builder fix.",

    // Platform storage banner
    storageWarning: '⚠ Data is stored in browser memory only — resets on page refresh. Connect a database to save permanently.',
    connectSupabaseBtn: 'Connect Supabase →',

    // Visual-edit inspector card
    deselectTitle: 'Deselect',
    savedFreeLabel: '✓ saved · free',
    cantMatchSourceLabel: "can't match source — use AI edit below",
    editTextPlaceholder: 'Edit the text…',
    setTextBtn: 'Set text',
    textColorLabel: 'Text',
    bgColorLabel: 'Bg',
    sizeLabel: 'Size',
    padLabel: 'Pad',
    radiusLabel: 'Radius',
    biggerChangePlaceholder: 'Bigger change? Describe it (e.g. turn this into a 3-column grid)',
    aiEditRateTitle: 'Runs a normal AI edit — charged at the standard edit rate',
    aiEditPrefix: 'AI edit · from ',
    clickToEditHint: 'Click any element in the preview to edit it',

    // Empty state
    emptyPreviewTitle: 'Your preview will appear here',
    emptyPreviewDesc: 'Describe what you want to build in the chat, and your app appears here automatically',

    // Full-screen / pill overlays
    buildingYourAppLabel: 'Building your app…',
    updatingPreviewLabel: 'Updating preview…',

    // Reverted-to-good-build strip
    revertedMsg: "⚠ The latest update didn't build — showing your last working preview.",
    tryToFixBtn: 'Try to fix',
    fixingBtn: 'Fixing…',

    // Full-screen error state
    buildHitErrorTitle: 'This build hit an error',
    sendingToAiBtn: 'Sending to AI...',
    tryToFixSparkleBtn: '✦ Try to fix',
    retryBuildBtn: 'Retry build',
  },
  hi: {
    buildMsg1: 'आपके कॉम्पोनेंट्स बन रहे हैं...',
    buildMsg2: 'बटन्स को वायर किया जा रहा है...',
    buildMsg3: 'पिक्सल्स को उनकी जगह सिखाई जा रही है...',
    buildMsg4: 'कलर पैलेट मिक्स की जा रही है...',
    buildMsg5: 'सबको साथ में बंडल किया जा रहा है...',
    buildMsg6: 'कोनों को पॉलिश किया जा रहा है...',
    buildMsg7: 'लगभग तैयार होकर परोसने वाला है...',

    writingLabel: 'आपका ऐप लिखा जा रहा है...',
    readyLabel: 'रेडी',
    describeToBuildLabel: 'आप क्या बनाना चाहते हैं, बताएं',
    buildFailedFallback: 'बिल्ड फेल हो गया',
    couldNotReachBuilderPrefix: 'प्रीव्यू बिल्डर तक पहुंच नहीं पाए: ',
    builtInPrefix: 'बिल्ड हुआ: ',

    selectElementTitle: 'एडिट करने के लिए किसी एलिमेंट पर क्लिक करें',
    selectingLabel: 'सिलेक्ट हो रहा है',
    selectLabel: 'सिलेक्ट करें',
    rebuildTitle: 'प्रीव्यू रीबिल्ड करें',
    openNewTabTitle: 'प्रीव्यू को नए टैब में खोलें',
    buildPreviewBtn: 'प्रीव्यू बनाएं',

    dbPausedPre: '⏸ आपका Supabase डेटाबेस ',
    dbPausedWord: 'पॉज़ हो गया है',
    dbPausedPost: ' (फ्री प्रोजेक्ट्स एक हफ्ते तक इस्तेमाल न होने पर पॉज़ हो जाते हैं) — जब तक इसे रिस्टोर नहीं किया जाता, तब तक कुछ भी लोड या सेव नहीं होगा।',
    restoreNowBtn: 'अभी रिस्टोर करें',
    restoringDbMsg: 'आपका डेटाबेस रिस्टोर हो रहा है — आमतौर पर एक मिनट से कम लगता है…',

    hungPre: '⚠ प्रीव्यू ',
    hungWord: 'फ्रीज़ हो गया लगता है',
    hungPost: ' (10+ सेकंड से रिस्पॉन्स नहीं दे रहा) — इसका मतलब आमतौर पर यह है कि ऐप में कुछ लूप में फंस गया है।',
    reloadPreviewBtn: 'प्रीव्यू रीलोड करें',

    corsPre: '⚠ इस ऐप ने कॉल करने की कोशिश की ',
    corsExternalApiFallback: 'एक एक्सटर्नल API को',
    corsPost: ' सीधे ब्राउज़र से, और उस API के सर्वर ने इस ओरिजिन से रिक्वेस्ट्स को अनुमति नहीं दी (CORS)। इसके लिए आमतौर पर उस कॉल के लिए एक सर्वर-साइड प्रॉक्सी चाहिए, बिल्डर फिक्स नहीं।',

    storageWarning: '⚠ डेटा केवल ब्राउज़र मेमोरी में स्टोर है — पेज रिफ्रेश पर रीसेट हो जाता है। परमानेंटली सेव करने के लिए डेटाबेस कनेक्ट करें।',
    connectSupabaseBtn: 'Supabase कनेक्ट करें →',

    deselectTitle: 'डिसेलेक्ट करें',
    savedFreeLabel: '✓ सेव हो गया · फ्री',
    cantMatchSourceLabel: 'सोर्स मैच नहीं हो पाया — नीचे AI एडिट का इस्तेमाल करें',
    editTextPlaceholder: 'टेक्स्ट एडिट करें…',
    setTextBtn: 'टेक्स्ट सेट करें',
    textColorLabel: 'टेक्स्ट',
    bgColorLabel: 'बैकग्राउंड',
    sizeLabel: 'साइज़',
    padLabel: 'पैडिंग',
    radiusLabel: 'रेडियस',
    biggerChangePlaceholder: 'बड़ा बदलाव चाहिए? इसे बताएं (जैसे: इसे 3-कॉलम ग्रिड बना दें)',
    aiEditRateTitle: 'यह एक सामान्य AI एडिट चलाता है — स्टैंडर्ड एडिट रेट पर चार्ज होगा',
    aiEditPrefix: 'AI एडिट · ',
    clickToEditHint: 'एडिट करने के लिए प्रीव्यू में किसी भी एलिमेंट पर क्लिक करें',

    emptyPreviewTitle: 'आपका प्रीव्यू यहां दिखेगा',
    emptyPreviewDesc: 'चैट में बताएं कि आप क्या बनाना चाहते हैं, आपका ऐप यहां अपने आप दिखेगा',

    buildingYourAppLabel: 'आपका ऐप बन रहा है…',
    updatingPreviewLabel: 'प्रीव्यू अपडेट हो रहा है…',

    revertedMsg: 'नया अपडेट बिल्ड नहीं हो पाया — आपका आखिरी वर्किंग प्रीव्यू दिखाया जा रहा है।',
    tryToFixBtn: 'फिक्स करने की कोशिश करें',
    fixingBtn: 'फिक्स हो रहा है…',

    buildHitErrorTitle: 'इस बिल्ड में एक एरर आई',
    sendingToAiBtn: 'AI को भेजा जा रहा है...',
    tryToFixSparkleBtn: '✦ फिक्स करने की कोशिश करें',
    retryBuildBtn: 'बिल्ड फिर से करें',
  },
  kn: {
    buildMsg1: 'ನಿಮ್ಮ ಕಾಂಪೊನೆಂಟ್‌ಗಳನ್ನು ತಯಾರಿಸಲಾಗುತ್ತಿದೆ...',
    buildMsg2: 'ಬಟನ್‌ಗಳನ್ನು ವೈರ್ ಮಾಡಲಾಗುತ್ತಿದೆ...',
    buildMsg3: 'ಪಿಕ್ಸೆಲ್‌ಗಳಿಗೆ ಎಲ್ಲಿ ಕೂರಬೇಕೆಂದು ಕಲಿಸಲಾಗುತ್ತಿದೆ...',
    buildMsg4: 'ಕಲರ್ ಪ್ಯಾಲೆಟ್ ಮಿಕ್ಸ್ ಮಾಡಲಾಗುತ್ತಿದೆ...',
    buildMsg5: 'ಎಲ್ಲವನ್ನೂ ಒಟ್ಟಿಗೆ ಬಂಡಲ್ ಮಾಡಲಾಗುತ್ತಿದೆ...',
    buildMsg6: 'ಮೂಲೆಗಳನ್ನು ಪಾಲಿಶ್ ಮಾಡಲಾಗುತ್ತಿದೆ...',
    buildMsg7: 'ಬಹುತೇಕ ರೆಡಿಯಾಗಿ ಬಡಿಸಲು ಸಿದ್ಧವಾಗಿದೆ...',

    writingLabel: 'ನಿಮ್ಮ ಆ್ಯಪ್ ಬರೆಯಲಾಗುತ್ತಿದೆ...',
    readyLabel: 'ರೆಡಿ',
    describeToBuildLabel: 'ನೀವು ಏನನ್ನು ಬಿಲ್ಡ್ ಮಾಡಲು ಬಯಸುತ್ತೀರೋ ಅದನ್ನು ವಿವರಿಸಿ',
    buildFailedFallback: 'ಬಿಲ್ಡ್ ಫೇಲ್ ಆಗಿದೆ',
    couldNotReachBuilderPrefix: 'ಪ್ರಿವ್ಯೂ ಬಿಲ್ಡರ್ ತಲುಪಲು ಸಾಧ್ಯವಾಗಲಿಲ್ಲ: ',
    builtInPrefix: 'ಬಿಲ್ಡ್ ಆಗಿದೆ: ',

    selectElementTitle: 'ಎಡಿಟ್ ಮಾಡಲು ಒಂದು ಎಲಿಮೆಂಟ್ ಮೇಲೆ ಕ್ಲಿಕ್ ಮಾಡಿ',
    selectingLabel: 'ಸೆಲೆಕ್ಟ್ ಆಗುತ್ತಿದೆ',
    selectLabel: 'ಸೆಲೆಕ್ಟ್ ಮಾಡಿ',
    rebuildTitle: 'ಪ್ರಿವ್ಯೂ ರೀಬಿಲ್ಡ್ ಮಾಡಿ',
    openNewTabTitle: 'ಪ್ರಿವ್ಯೂ ಅನ್ನು ಹೊಸ ಟ್ಯಾಬ್‌ನಲ್ಲಿ ತೆರೆಯಿರಿ',
    buildPreviewBtn: 'ಪ್ರಿವ್ಯೂ ಬಿಲ್ಡ್ ಮಾಡಿ',

    dbPausedPre: '⏸ ನಿಮ್ಮ Supabase ಡೇಟಾಬೇಸ್ ',
    dbPausedWord: 'ಪಾಸ್ ಆಗಿದೆ',
    dbPausedPost: ' (ಫ್ರೀ ಪ್ರಾಜೆಕ್ಟ್‌ಗಳು ಒಂದು ವಾರ ಬಳಕೆಯಾಗದಿದ್ದರೆ ಪಾಸ್ ಆಗುತ್ತವೆ) — ಇದನ್ನು ರಿಸ್ಟೋರ್ ಮಾಡುವವರೆಗೆ ಏನೂ ಲೋಡ್ ಅಥವಾ ಸೇವ್ ಆಗುವುದಿಲ್ಲ.',
    restoreNowBtn: 'ಈಗ ರಿಸ್ಟೋರ್ ಮಾಡಿ',
    restoringDbMsg: 'ನಿಮ್ಮ ಡೇಟಾಬೇಸ್ ರಿಸ್ಟೋರ್ ಆಗುತ್ತಿದೆ — ಸಾಮಾನ್ಯವಾಗಿ ಒಂದು ನಿಮಿಷಕ್ಕಿಂತ ಕಡಿಮೆ ಸಮಯ ತೆಗೆದುಕೊಳ್ಳುತ್ತದೆ…',

    hungPre: '⚠ ಪ್ರಿವ್ಯೂ ',
    hungWord: 'ಫ್ರೀಜ್ ಆಗಿದೆ ಎಂದು ತೋರುತ್ತಿದೆ',
    hungPost: ' (10+ ಸೆಕೆಂಡ್‌ಗಳಿಂದ ಪ್ರತಿಕ್ರಿಯಿಸುತ್ತಿಲ್ಲ) — ಇದರರ್ಥ ಸಾಮಾನ್ಯವಾಗಿ ಆ್ಯಪ್‌ನಲ್ಲಿ ಏನೋ ಒಂದು ಲೂಪ್‌ನಲ್ಲಿ ಸಿಲುಕಿದೆ.',
    reloadPreviewBtn: 'ಪ್ರಿವ್ಯೂ ರಿಲೋಡ್ ಮಾಡಿ',

    corsPre: '⚠ ಈ ಆ್ಯಪ್ ಕರೆ ಮಾಡಲು ಪ್ರಯತ್ನಿಸಿತು ',
    corsExternalApiFallback: 'ಒಂದು ಎಕ್ಸ್‌ಟರ್ನಲ್ APIಗೆ',
    corsPost: ' ನೇರವಾಗಿ ಬ್ರೌಸರ್‌ನಿಂದ, ಮತ್ತು ಆ APIಯ ಸರ್ವರ್ ಈ ಒರಿಜಿನ್‌ನಿಂದ ರಿಕ್ವೆಸ್ಟ್‌ಗಳನ್ನು ಅನುಮತಿಸುವುದಿಲ್ಲ (CORS). ಇದಕ್ಕೆ ಸಾಮಾನ್ಯವಾಗಿ ಆ ಕರೆಗೆ ಸರ್ವರ್-ಸೈಡ್ ಪ್ರಾಕ್ಸಿ ಬೇಕು, ಬಿಲ್ಡರ್ ಫಿಕ್ಸ್ ಅಲ್ಲ.',

    storageWarning: '⚠ ಡೇಟಾ ಬ್ರೌಸರ್ ಮೆಮೊರಿಯಲ್ಲಿ ಮಾತ್ರ ಸಂಗ್ರಹವಾಗಿದೆ — ಪೇಜ್ ರಿಫ್ರೆಶ್‌ನಲ್ಲಿ ರೀಸೆಟ್ ಆಗುತ್ತದೆ. ಶಾಶ್ವತವಾಗಿ ಸೇವ್ ಮಾಡಲು ಡೇಟಾಬೇಸ್ ಕನೆಕ್ಟ್ ಮಾಡಿ.',
    connectSupabaseBtn: 'Supabase ಕನೆಕ್ಟ್ ಮಾಡಿ →',

    deselectTitle: 'ಡಿಸೆಲೆಕ್ಟ್ ಮಾಡಿ',
    savedFreeLabel: '✓ ಸೇವ್ ಆಗಿದೆ · ಫ್ರೀ',
    cantMatchSourceLabel: 'ಸೋರ್ಸ್ ಮ್ಯಾಚ್ ಆಗುತ್ತಿಲ್ಲ — ಕೆಳಗಿನ AI ಎಡಿಟ್ ಬಳಸಿ',
    editTextPlaceholder: 'ಟೆಕ್ಸ್ಟ್ ಎಡಿಟ್ ಮಾಡಿ…',
    setTextBtn: 'ಟೆಕ್ಸ್ಟ್ ಸೆಟ್ ಮಾಡಿ',
    textColorLabel: 'ಟೆಕ್ಸ್ಟ್',
    bgColorLabel: 'ಬ್ಯಾಕ್‌ಗ್ರೌಂಡ್',
    sizeLabel: 'ಸೈಜ್',
    padLabel: 'ಪ್ಯಾಡಿಂಗ್',
    radiusLabel: 'ರೇಡಿಯಸ್',
    biggerChangePlaceholder: 'ದೊಡ್ಡ ಬದಲಾವಣೆ ಬೇಕೇ? ಅದನ್ನು ವಿವರಿಸಿ (ಉದಾ. ಇದನ್ನು 3-ಕಾಲಮ್ ಗ್ರಿಡ್ ಮಾಡಿ)',
    aiEditRateTitle: 'ಇದು ಸಾಮಾನ್ಯ AI ಎಡಿಟ್ ಅನ್ನು ರನ್ ಮಾಡುತ್ತದೆ — ಸ್ಟ್ಯಾಂಡರ್ಡ್ ಎಡಿಟ್ ದರದಲ್ಲಿ ಚಾರ್ಜ್ ಆಗುತ್ತದೆ',
    aiEditPrefix: 'AI ಎಡಿಟ್ · ',
    clickToEditHint: 'ಎಡಿಟ್ ಮಾಡಲು ಪ್ರಿವ್ಯೂನಲ್ಲಿ ಯಾವುದೇ ಎಲಿಮೆಂಟ್ ಮೇಲೆ ಕ್ಲಿಕ್ ಮಾಡಿ',

    emptyPreviewTitle: 'ನಿಮ್ಮ ಪ್ರಿವ್ಯೂ ಇಲ್ಲಿ ಕಾಣಿಸುತ್ತದೆ',
    emptyPreviewDesc: 'ಚಾಟ್‌ನಲ್ಲಿ ನೀವು ಏನನ್ನು ಬಿಲ್ಡ್ ಮಾಡಲು ಬಯಸುತ್ತೀರೋ ಅದನ್ನು ವಿವರಿಸಿ, ನಿಮ್ಮ ಆ್ಯಪ್ ಇಲ್ಲಿ ತಾನಾಗಿಯೇ ಕಾಣಿಸುತ್ತದೆ',

    buildingYourAppLabel: 'ನಿಮ್ಮ ಆ್ಯಪ್ ಬಿಲ್ಡ್ ಆಗುತ್ತಿದೆ…',
    updatingPreviewLabel: 'ಪ್ರಿವ್ಯೂ ಅಪ್‌ಡೇಟ್ ಆಗುತ್ತಿದೆ…',

    revertedMsg: 'ಇತ್ತೀಚಿನ ಅಪ್‌ಡೇಟ್ ಬಿಲ್ಡ್ ಆಗಲಿಲ್ಲ — ನಿಮ್ಮ ಕೊನೆಯ ವರ್ಕಿಂಗ್ ಪ್ರಿವ್ಯೂ ತೋರಿಸಲಾಗುತ್ತಿದೆ.',
    tryToFixBtn: 'ಫಿಕ್ಸ್ ಮಾಡಲು ಪ್ರಯತ್ನಿಸಿ',
    fixingBtn: 'ಫಿಕ್ಸ್ ಆಗುತ್ತಿದೆ…',

    buildHitErrorTitle: 'ಈ ಬಿಲ್ಡ್‌ನಲ್ಲಿ ಒಂದು ಎರರ್ ಬಂದಿದೆ',
    sendingToAiBtn: 'AI ಗೆ ಕಳುಹಿಸಲಾಗುತ್ತಿದೆ...',
    tryToFixSparkleBtn: '✦ ಫಿಕ್ಸ್ ಮಾಡಲು ಪ್ರಯತ್ನಿಸಿ',
    retryBuildBtn: 'ಬಿಲ್ಡ್ ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ',
  },
  te: {
    buildMsg1: 'మీ కాంపొనెంట్‌లు తయారవుతున్నాయి...',
    buildMsg2: 'బటన్‌లను వైర్ చేస్తున్నాం...',
    buildMsg3: 'పిక్సెల్స్‌కు ఎక్కడ కూర్చోవాలో నేర్పిస్తున్నాం...',
    buildMsg4: 'కలర్ పాలెట్‌ను మిక్స్ చేస్తున్నాం...',
    buildMsg5: 'అన్నింటినీ కలిపి బండిల్ చేస్తున్నాం...',
    buildMsg6: 'మూలలను పాలిష్ చేస్తున్నాం...',
    buildMsg7: 'దాదాపు రెడీ అయి వడ్డించడానికి సిద్ధంగా ఉంది...',

    writingLabel: 'మీ యాప్ రాయబడుతోంది...',
    readyLabel: 'రెడీ',
    describeToBuildLabel: 'మీరు ఏమి బిల్డ్ చేయాలనుకుంటున్నారో వివరించండి',
    buildFailedFallback: 'బిల్డ్ ఫెయిల్ అయ్యింది',
    couldNotReachBuilderPrefix: 'ప్రివ్యూ బిల్డర్‌ను చేరుకోలేకపోయాం: ',
    builtInPrefix: 'బిల్డ్ అయ్యింది: ',

    selectElementTitle: 'ఎడిట్ చేయడానికి ఒక ఎలిమెంట్‌పై క్లిక్ చేయండి',
    selectingLabel: 'సెలెక్ట్ అవుతోంది',
    selectLabel: 'సెలెక్ట్ చేయండి',
    rebuildTitle: 'ప్రివ్యూ రీబిల్డ్ చేయండి',
    openNewTabTitle: 'ప్రివ్యూను కొత్త ట్యాబ్‌లో తెరవండి',
    buildPreviewBtn: 'ప్రివ్యూ బిల్డ్ చేయండి',

    dbPausedPre: '⏸ మీ Supabase డేటాబేస్ ',
    dbPausedWord: 'పాజ్ అయ్యింది',
    dbPausedPost: ' (ఫ్రీ ప్రాజెక్ట్‌లు ఒక వారం పాటు వాడకుండా ఉంటే పాజ్ అవుతాయి) — దీన్ని రీస్టోర్ చేసేవరకు ఏమీ లోడ్ లేదా సేవ్ కాదు.',
    restoreNowBtn: 'ఇప్పుడు రీస్టోర్ చేయండి',
    restoringDbMsg: 'మీ డేటాబేస్ రీస్టోర్ అవుతోంది — సాధారణంగా ఒక నిమిషం కంటే తక్కువ సమయం పడుతుంది…',

    hungPre: '⚠ ప్రివ్యూ ',
    hungWord: 'ఫ్రీజ్ అయిపోయినట్లు కనిపిస్తోంది',
    hungPost: ' (10+ సెకన్లుగా రెస్పాన్స్ ఇవ్వడం లేదు) — దీని అర్థం సాధారణంగా యాప్‌లో ఏదో లూప్‌లో చిక్కుకుపోయింది.',
    reloadPreviewBtn: 'ప్రివ్యూ రీలోడ్ చేయండి',

    corsPre: '⚠ ఈ యాప్ కాల్ చేయడానికి ప్రయత్నించింది ',
    corsExternalApiFallback: 'ఒక ఎక్స్‌టర్నల్ APIకి',
    corsPost: ' నేరుగా బ్రౌజర్ నుండి, మరియు ఆ API సర్వర్ ఈ ఆరిజిన్ నుండి రిక్వెస్ట్‌లను అనుమతించదు (CORS). దీనికి సాధారణంగా ఆ కాల్ కోసం సర్వర్-సైడ్ ప్రాక్సీ కావాలి, బిల్డర్ ఫిక్స్ కాదు.',

    storageWarning: '⚠ డేటా బ్రౌజర్ మెమరీలో మాత్రమే స్టోర్ అవుతుంది — పేజ్ రిఫ్రెష్‌లో రీసెట్ అవుతుంది. శాశ్వతంగా సేవ్ చేయడానికి డేటాబేస్‌ను కనెక్ట్ చేయండి.',
    connectSupabaseBtn: 'Supabase కనెక్ట్ చేయండి →',

    deselectTitle: 'డిసెలెక్ట్ చేయండి',
    savedFreeLabel: '✓ సేవ్ అయ్యింది · ఫ్రీ',
    cantMatchSourceLabel: 'సోర్స్ మ్యాచ్ కాలేదు — కింద ఉన్న AI ఎడిట్ ఉపయోగించండి',
    editTextPlaceholder: 'టెక్స్ట్ ఎడిట్ చేయండి…',
    setTextBtn: 'టెక్స్ట్ సెట్ చేయండి',
    textColorLabel: 'టెక్స్ట్',
    bgColorLabel: 'బ్యాక్‌గ్రౌండ్',
    sizeLabel: 'సైజ్',
    padLabel: 'ప్యాడింగ్',
    radiusLabel: 'రేడియస్',
    biggerChangePlaceholder: 'పెద్ద మార్పు కావాలా? దాన్ని వివరించండి (ఉదా. దీన్ని 3-కాలమ్ గ్రిడ్‌గా మార్చండి)',
    aiEditRateTitle: 'ఇది సాధారణ AI ఎడిట్‌ను రన్ చేస్తుంది — స్టాండర్డ్ ఎడిట్ రేటుకు చార్జ్ అవుతుంది',
    aiEditPrefix: 'AI ఎడిట్ · ',
    clickToEditHint: 'ఎడిట్ చేయడానికి ప్రివ్యూలో ఏదైనా ఎలిమెంట్‌పై క్లిక్ చేయండి',

    emptyPreviewTitle: 'మీ ప్రివ్యూ ఇక్కడ కనిపిస్తుంది',
    emptyPreviewDesc: 'చాట్‌లో మీరు ఏమి బిల్డ్ చేయాలనుకుంటున్నారో వివరించండి, మీ యాప్ ఇక్కడ ఆటోమేటిగ్గా కనిపిస్తుంది',

    buildingYourAppLabel: 'మీ యాప్ బిల్డ్ అవుతోంది…',
    updatingPreviewLabel: 'ప్రివ్యూ అప్‌డేట్ అవుతోంది…',

    revertedMsg: 'తాజా అప్‌డేట్ బిల్డ్ కాలేదు — మీ చివరి పనిచేసిన ప్రివ్యూ చూపిస్తున్నాం.',
    tryToFixBtn: 'ఫిక్స్ చేయడానికి ప్రయత్నించండి',
    fixingBtn: 'ఫిక్స్ అవుతోంది…',

    buildHitErrorTitle: 'ఈ బిల్డ్‌లో ఒక ఎర్రర్ వచ్చింది',
    sendingToAiBtn: 'AIకి పంపిస్తున్నాం...',
    tryToFixSparkleBtn: '✦ ఫిక్స్ చేయడానికి ప్రయత్నించండి',
    retryBuildBtn: 'బిల్డ్ మళ్ళీ ప్రయత్నించండి',
  },
  ta: {
    buildMsg1: 'உங்கள் காம்போனென்ட்கள் தயாராகின்றன...',
    buildMsg2: 'பட்டன்களை வயரிங் செய்கிறோம்...',
    buildMsg3: 'பிக்சல்களுக்கு எங்கே உட்காரணும்னு சொல்லிக்கொடுக்கிறோம்...',
    buildMsg4: 'கலர் பேலட்டை மிக்ஸ் செய்கிறோம்...',
    buildMsg5: 'எல்லாத்தையும் சேர்த்து பண்டில் செய்கிறோம்...',
    buildMsg6: 'மூலைகளை பாலிஷ் செய்கிறோம்...',
    buildMsg7: 'கிட்டத்தட்ட ரெடியாகி பரிமாறத் தயார்...',

    writingLabel: 'உங்கள் ஆப் எழுதப்படுகிறது...',
    readyLabel: 'ரெடி',
    describeToBuildLabel: 'நீங்கள் என்ன பில்ட் செய்ய விரும்புகிறீர்கள் என்பதை விவரிக்கவும்',
    buildFailedFallback: 'பில்ட் ஃபெயில் ஆனது',
    couldNotReachBuilderPrefix: 'ப்ரிவியூ பில்டரை அடைய முடியவில்லை: ',
    builtInPrefix: 'பில்ட் ஆனது: ',

    selectElementTitle: 'எடிட் செய்ய ஒரு எலிமெண்ட்டை கிளிக் செய்யவும்',
    selectingLabel: 'செலெக்ட் ஆகிறது',
    selectLabel: 'செலெக்ட் செய்யவும்',
    rebuildTitle: 'ப்ரிவியூவை ரீபில்ட் செய்யவும்',
    openNewTabTitle: 'ப்ரிவியூவை புதிய டேபில் திறக்கவும்',
    buildPreviewBtn: 'ப்ரிவியூவை பில்ட் செய்யவும்',

    dbPausedPre: '⏸ உங்கள் Supabase டேட்டாபேஸ் ',
    dbPausedWord: 'பாஸ் ஆகியுள்ளது',
    dbPausedPost: ' (ஃப்ரீ ப்ராஜெக்ட்கள் ஒரு வாரம் பயன்படுத்தாமல் இருந்தால் பாஸ் ஆகிவிடும்) — இதை ரீஸ்டோர் செய்யும் வரை எதுவும் லோட் அல்லது சேவ் ஆகாது.',
    restoreNowBtn: 'இப்போது ரீஸ்டோர் செய்யவும்',
    restoringDbMsg: 'உங்கள் டேட்டாபேஸ் ரீஸ்டோர் ஆகிறது — பொதுவாக ஒரு நிமிடத்திற்கும் குறைவான நேரம் ஆகும்…',

    hungPre: '⚠ ப்ரிவியூ ',
    hungWord: 'ஃப்ரீஸ் ஆகிவிட்டது போல் தெரிகிறது',
    hungPost: ' (10+ வினாடிகளாக பதிலளிக்கவில்லை) — இதன் அர்த்தம் பொதுவாக ஆப்பில் ஏதோ ஒன்று லூப்பில் சிக்கியிருக்கிறது.',
    reloadPreviewBtn: 'ப்ரிவியூவை ரீலோட் செய்யவும்',

    corsPre: '⚠ இந்த ஆப் அழைக்க முயற்சித்தது ',
    corsExternalApiFallback: 'ஒரு எக்ஸ்டர்னல் APIக்கு',
    corsPost: ' நேரடியாக பிரவுசரிலிருந்து, மேலும் அந்த APIயின் சர்வர் இந்த ஆரிஜினிலிருந்து ரிக்குவெஸ்ட்களை அனுமதிக்கவில்லை (CORS). இதற்கு பொதுவாக அந்த கால் க்கு சர்வர்-சைட் ப்ராக்ஸி தேவை, பில்டர் ஃபிக்ஸ் அல்ல.',

    storageWarning: '⚠ டேட்டா பிரவுசர் மெமரியில் மட்டுமே சேமிக்கப்படுகிறது — பேஜ் ரிஃப்ரெஷ் செய்யும் போது ரீசெட் ஆகிவிடும். நிரந்தரமாக சேவ் செய்ய டேட்டாபேஸை இணைக்கவும்.',
    connectSupabaseBtn: 'Supabase இணைக்கவும் →',

    deselectTitle: 'டிசெலெக்ட் செய்யவும்',
    savedFreeLabel: '✓ சேவ் ஆனது · ஃப்ரீ',
    cantMatchSourceLabel: 'சோர்ஸ் மேட்ச் ஆகவில்லை — கீழே உள்ள AI எடிட்டை பயன்படுத்தவும்',
    editTextPlaceholder: 'டெக்ஸ்டை எடிட் செய்யவும்…',
    setTextBtn: 'டெக்ஸ்டை செட் செய்யவும்',
    textColorLabel: 'டெக்ஸ்ட்',
    bgColorLabel: 'பேக்கிரவுண்ட்',
    sizeLabel: 'சைஸ்',
    padLabel: 'பேடிங்',
    radiusLabel: 'ரேடியஸ்',
    biggerChangePlaceholder: 'பெரிய மாற்றம் வேணுமா? அதை விவரிக்கவும் (எ.கா. இதை 3-கால கிரிட் ஆக மாற்றவும்)',
    aiEditRateTitle: 'இது ஒரு சாதாரண AI எடிட்டை இயக்கும் — ஸ்டாண்டர்ட் எடிட் ரேட்டில் சார்ஜ் ஆகும்',
    aiEditPrefix: 'AI எடிட் · ',
    clickToEditHint: 'எடிட் செய்ய ப்ரிவியூவில் எந்த எலிமெண்டையும் கிளிக் செய்யவும்',

    emptyPreviewTitle: 'உங்கள் ப்ரிவியூ இங்கே தோன்றும்',
    emptyPreviewDesc: 'சாட்டில் நீங்கள் என்ன பில்ட் செய்ய விரும்புகிறீர்கள் என்பதை விவரிக்கவும், உங்கள் ஆப் இங்கே தானாகவே தோன்றும்',

    buildingYourAppLabel: 'உங்கள் ஆப் பில்ட் ஆகிறது…',
    updatingPreviewLabel: 'ப்ரிவியூ அப்டேட் ஆகிறது…',

    revertedMsg: 'சமீபத்திய அப்டேட் பில்ட் ஆகவில்லை — உங்கள் கடைசி வொர்க்கிங் ப்ரிவியூ காட்டப்படுகிறது.',
    tryToFixBtn: 'ஃபிக்ஸ் செய்ய முயற்சிக்கவும்',
    fixingBtn: 'ஃபிக்ஸ் ஆகிறது…',

    buildHitErrorTitle: 'இந்த பில்டில் ஒரு எர்ரர் ஏற்பட்டது',
    sendingToAiBtn: 'AIக்கு அனுப்பப்படுகிறது...',
    tryToFixSparkleBtn: '✦ ஃபிக்ஸ் செய்ய முயற்சிக்கவும்',
    retryBuildBtn: 'பில்டை மீண்டும் முயற்சிக்கவும்',
  },
};
