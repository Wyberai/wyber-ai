import type { Locale } from '../locales';

// AI-drafted, not yet native-reviewed (see AutoTranslateNotice). Shared
// namespace for the small editor "core UI" primitives batch: FileTree
// (src/components/editor/FileTree.tsx), CodeEditor
// (src/components/editor/CodeEditor.tsx), and DeviceFrame
// (src/components/editor/DeviceFrame.tsx). Keys are prefixed per-component
// (fileTree*, codeEditor*, deviceFrame*) since they share this one file.
// Most files in this batch (ui/EmptyState, ui/GlowButton, ui/MicroLabel,
// ui/NoiseOverlay, ui/PanelHeader, ui/Skeleton, ResizableDivider, TabBar) are
// pure layout/logic components with no hardcoded copy of their own — their
// text is passed in as props by callers — so they have no entries here.
// Generic atoms (Save/Cancel/Delete/etc.) live in dict/common.ts. Proper
// nouns (WyberAi, Wi-Fi) and the mock status-bar clock digits are left as-is.
export const EDITOR_CORE_UI_STRINGS: Record<Locale, Record<string, string>> = {
  en: {
    fileTreeDefaultProjectName: 'Project',
    fileTreeEmptyTitle: 'No files yet.',
    fileTreeEmptyHint: 'Start a conversation to generate your app.',
    codeEditorNoFileOpenTitle: 'No file open',
    codeEditorNoFileOpenHint: 'Select a file from the tree or generate code from chat',
    deviceFramePreviewUnavailableTitle: 'Preview unavailable',
    deviceFramePreviewUnavailableHint: "This screen uses something we can't render in the in-app preview yet. It still works in a full build.",
    deviceFrameLoadingPreview: 'Loading preview…',
    deviceFramePreviewTitleSuffix: 'preview',
  },
  hi: {
    fileTreeDefaultProjectName: 'प्रोजेक्ट',
    fileTreeEmptyTitle: 'अभी तक कोई फाइल नहीं है।',
    fileTreeEmptyHint: 'अपना ऐप जनरेट करने के लिए बातचीत शुरू करें।',
    codeEditorNoFileOpenTitle: 'कोई फाइल खुली नहीं है',
    codeEditorNoFileOpenHint: 'ट्री से कोई फाइल चुनें या चैट से कोड जनरेट करें',
    deviceFramePreviewUnavailableTitle: 'प्रीव्यू उपलब्ध नहीं है',
    deviceFramePreviewUnavailableHint: 'यह स्क्रीन कुछ ऐसा इस्तेमाल करती है जिसे हम अभी इन-ऐप प्रीव्यू में नहीं दिखा सकते। यह पूरे बिल्ड में फिर भी काम करेगी।',
    deviceFrameLoadingPreview: 'प्रीव्यू लोड हो रहा है…',
    deviceFramePreviewTitleSuffix: 'प्रीव्यू',
  },
  kn: {
    fileTreeDefaultProjectName: 'ಪ್ರಾಜೆಕ್ಟ್',
    fileTreeEmptyTitle: 'ಇನ್ನೂ ಯಾವುದೇ ಫೈಲ್‌ಗಳಿಲ್ಲ.',
    fileTreeEmptyHint: 'ನಿಮ್ಮ ಆ್ಯಪ್ ಜನರೇಟ್ ಮಾಡಲು ಸಂಭಾಷಣೆ ಶುರು ಮಾಡಿ.',
    codeEditorNoFileOpenTitle: 'ಯಾವುದೇ ಫೈಲ್ ತೆರೆದಿಲ್ಲ',
    codeEditorNoFileOpenHint: 'ಟ್ರೀಯಿಂದ ಒಂದು ಫೈಲ್ ಆಯ್ಕೆ ಮಾಡಿ ಅಥವಾ ಚಾಟ್‌ನಿಂದ ಕೋಡ್ ಜನರೇಟ್ ಮಾಡಿ',
    deviceFramePreviewUnavailableTitle: 'ಪ್ರಿವ್ಯೂ ಲಭ್ಯವಿಲ್ಲ',
    deviceFramePreviewUnavailableHint: 'ಈ ಸ್ಕ್ರೀನ್ ನಾವು ಇನ್-ಆ್ಯಪ್ ಪ್ರಿವ್ಯೂನಲ್ಲಿ ಇನ್ನೂ ರೆಂಡರ್ ಮಾಡಲಾಗದ ಏನನ್ನೋ ಬಳಸುತ್ತದೆ. ಇದು ಪೂರ್ಣ ಬಿಲ್ಡ್‌ನಲ್ಲಿ ಇನ್ನೂ ಕೆಲಸ ಮಾಡುತ್ತದೆ.',
    deviceFrameLoadingPreview: 'ಪ್ರಿವ್ಯೂ ಲೋಡ್ ಆಗುತ್ತಿದೆ…',
    deviceFramePreviewTitleSuffix: 'ಪ್ರಿವ್ಯೂ',
  },
  te: {
    fileTreeDefaultProjectName: 'ప్రాజెక్ట్',
    fileTreeEmptyTitle: 'ఇంకా ఫైల్‌లు లేవు.',
    fileTreeEmptyHint: 'మీ యాప్‌ని జనరేట్ చేయడానికి సంభాషణ మొదలుపెట్టండి.',
    codeEditorNoFileOpenTitle: 'ఏ ఫైల్ తెరవలేదు',
    codeEditorNoFileOpenHint: 'ట్రీ నుండి ఒక ఫైల్‌ను ఎంచుకోండి లేదా చాట్ నుండి కోడ్‌ని జనరేట్ చేయండి',
    deviceFramePreviewUnavailableTitle: 'ప్రివ్యూ అందుబాటులో లేదు',
    deviceFramePreviewUnavailableHint: 'ఈ స్క్రీన్ మేము ఇన్-యాప్ ప్రివ్యూలో ఇంకా రెండర్ చేయలేని దాన్ని ఉపయోగిస్తుంది. ఇది పూర్తి బిల్డ్‌లో ఇంకా పని చేస్తుంది.',
    deviceFrameLoadingPreview: 'ప్రివ్యూ లోడ్ అవుతోంది…',
    deviceFramePreviewTitleSuffix: 'ప్రివ్యూ',
  },
  ta: {
    fileTreeDefaultProjectName: 'ப்ராஜெக்ட்',
    fileTreeEmptyTitle: 'இதுவரை கோப்புகள் இல்லை.',
    fileTreeEmptyHint: 'உங்கள் ஆப்பை உருவாக்க உரையாடலைத் தொடங்குங்கள்.',
    codeEditorNoFileOpenTitle: 'எந்த கோப்பும் திறக்கவில்லை',
    codeEditorNoFileOpenHint: 'ட்ரீயில் இருந்து ஒரு கோப்பைத் தேர்ந்தெடுங்கள் அல்லது சாட்டில் இருந்து கோட் உருவாக்குங்கள்',
    deviceFramePreviewUnavailableTitle: 'ப்ரிவியூ கிடைக்கவில்லை',
    deviceFramePreviewUnavailableHint: 'இந்த திரை நாங்கள் இன்-ஆப் ப்ரிவியூவில் இன்னும் காட்ட முடியாத ஒன்றைப் பயன்படுத்துகிறது. இது முழு பில்டில் இன்னும் வேலை செய்யும்.',
    deviceFrameLoadingPreview: 'ப்ரிவியூ லோட் ஆகிறது…',
    deviceFramePreviewTitleSuffix: 'ப்ரிவியூ',
  },
};
