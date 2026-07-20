import type { Locale } from '../locales';

// AI-drafted, not yet native-reviewed (see AutoTranslateNotice). Covers a
// batch of editor tool panels/widgets (src/components/editor/):
// SEOAuditPanel, SkillsPanel, KnowledgePanel, BrowserTestPanel, ClonePanel,
// CrossProjectPanel, AutoFix, ErrorFixPanel, FileMentionDropdown, VoiceButton.
// Generic atoms (Save/Cancel/Delete/etc.) live in dict/common.ts and are
// pulled in via useT(COMMON_STRINGS) instead of being duplicated here.
//
// Left intentionally untranslated: proper nouns / brand & tech names
// (WyberAi, SEO, AI, ChatGPT, Perplexity, Claude, Firecrawl, React, Vue,
// JS, Next.js, URL), example placeholder text ("stripe.com/pricing"), the
// literal code/stack-trace sample inside ErrorFixPanel's textarea
// placeholder, and the LLM instruction prompts built inside KnowledgePanel/
// ErrorFixPanel (those are model directives, not rendered UI copy).
//
// A few keys carry a `{token}` that callers substitute via .replace() (same
// convention as EDITOR_TOPBAR_STRINGS' securityCheckMessage) — the {plural}
// token is always resolved to the same English '' / 's' suffix regardless
// of locale, matching that existing precedent.
export const EDITOR_TOOLS_STRINGS: Record<Locale, Record<string, string>> = {
  en: {
    // SEOAuditPanel
    seoAuditTitle: 'SEO & AI Search',
    seoAuditAuditing: 'Auditing...',
    seoAuditRunButton: '🔍 Run SEO & AI Search audit',
    seoAuditPassedLabel: 'Passed',
    seoAuditWarningsLabel: 'Warnings',
    seoAuditFailedLabel: 'Failed',
    seoAuditOptimizedMsg: 'Optimized for AI search (ChatGPT, Perplexity, Claude)',
    seoAuditNotOptimizedMsg: 'Not optimized for AI search engines',
    seoAuditFixPrefix: 'Fix:',
    seoAuditDetectedKeywords: 'Detected keywords',

    // SkillsPanel
    skillsTitle: 'Workspace Skills',
    skillsNewButton: '+ New skill',
    skillsSubtitle: 'Reusable playbooks — click Apply to run on the current project',
    skillsNamePlaceholder: 'Skill name...',
    skillsDescPlaceholder: 'What does this skill do?',
    skillsInstructionsPlaceholder: 'Instructions for the AI...',
    skillsSaveButton: 'Save skill',
    skillsApplied: '✓ Applied',
    skillsApplyButton: 'Apply',

    // KnowledgePanel
    knowledgeExplainerPart1: "Knowledge is your project's brain. It's sent with",
    knowledgeExplainerEveryPrompt: 'every prompt',
    knowledgeExplainerPart2: 'so the AI always understands your vision, features, design system, and rules.',
    knowledgeAnalyzing: 'Analyzing your app...',
    knowledgeAutoGenerate: '✦ Auto-generate from current app',
    knowledgeLabel: 'Knowledge',
    knowledgeSavedDone: '✓ Saved',
    knowledgePlaceholder: '# Product Vision\nWhat are you building and for whom?\n\n# Core Features\n- Feature one\n- Feature two\n\n# Design System\nColors, fonts, style direction\n\n# User Roles\nAdmin, User, etc. and what each can do\n\n# Rules\nThings the AI should never change',

    // BrowserTestPanel
    browserTestTitle: 'Browser Tests',
    browserTestPassedWord: 'passed',
    browserTestFailedWord: 'failed',
    browserTestPublishFirstError: 'Publish your project first to run browser tests',
    browserTestRunFailedError: 'Test run failed',
    browserTestPublishFirstInfo: 'Publish your project first to run automated browser tests.',
    browserTestRunButton: '▶ Run browser tests',
    browserTestRunning: 'Running tests...',

    // ClonePanel
    cloneTitle: 'Clone a Website',
    cloneDescription: 'Paste any URL — WyberAi scrapes it and builds a React clone in seconds.',
    cloneButton: '⚡ Clone it',
    cloneCloning: '🔍 Cloning...',
    cloneFooterNote: 'Works with any public website. Requires Firecrawl API key.',
    cloneChatUserPrefix: 'Clone website:',
    cloneScrapingMessage: '🔍 Scraping {url}...',
    cloneClonedMessage: '✓ Cloned {url} — {count} files generated. Customize it freely.',
    cloneFailedPrefix: 'Failed to clone:',
    cloneErrorFallback: 'Clone failed',

    // CrossProjectPanel
    crossProjectTitle: 'Cross-Project',
    crossProjectSubtitle: 'Reuse components and files from your other projects.',
    crossProjectEmptyState: 'No other projects yet. Create another project to use cross-project referencing.',
    crossProjectHide: '▲ Hide',
    crossProjectBrowse: '▼ Browse',
    crossProjectFilesFromLabel: 'Files from "{name}" — select to copy',
    crossProjectCopyingButton: 'Copying...',
    crossProjectCopyButton: 'Copy {count} file{plural} into this project',
    crossProjectCopiedMsg: '✓ Copied {count} file{plural} into this project',
    crossProjectNothingCopied: 'Nothing was copied',

    // AutoFix
    autoFixMessagePrefix: 'Fixing error:',

    // ErrorFixPanel
    errorFixInfoBox: '✕ Paste an error message or console output. WyberAi fixes it — no credit charge for errors we caused.',
    errorFixPlaceholderIntro: 'Paste error here...',
    errorFixFixing: '⟳ Fixing...',
    errorFixButton: '⚡ Fix this error',

    // FileMentionDropdown
    fileMentionHeader: 'Reference a file',

    // VoiceButton
    voiceStopRecording: 'Stop recording',
    voiceSpeakIdea: 'Speak your idea',
  },
  hi: {
    seoAuditTitle: 'SEO और AI सर्च',
    seoAuditAuditing: 'ऑडिट हो रहा है...',
    seoAuditRunButton: '🔍 SEO और AI सर्च ऑडिट चलाएं',
    seoAuditPassedLabel: 'पास',
    seoAuditWarningsLabel: 'चेतावनियां',
    seoAuditFailedLabel: 'फेल',
    seoAuditOptimizedMsg: 'AI सर्च के लिए ऑप्टिमाइज़्ड (ChatGPT, Perplexity, Claude)',
    seoAuditNotOptimizedMsg: 'AI सर्च इंजनों के लिए ऑप्टिमाइज़्ड नहीं',
    seoAuditFixPrefix: 'फिक्स:',
    seoAuditDetectedKeywords: 'पहचाने गए कीवर्ड',

    skillsTitle: 'वर्कस्पेस स्किल्स',
    skillsNewButton: '+ नई स्किल',
    skillsSubtitle: 'दोबारा इस्तेमाल होने वाले प्लेबुक्स — मौजूदा प्रोजेक्ट पर चलाने के लिए Apply पर क्लिक करें',
    skillsNamePlaceholder: 'स्किल का नाम...',
    skillsDescPlaceholder: 'यह स्किल क्या करती है?',
    skillsInstructionsPlaceholder: 'AI के लिए निर्देश...',
    skillsSaveButton: 'स्किल सेव करें',
    skillsApplied: '✓ लागू हो गया',
    skillsApplyButton: 'लागू करें',

    knowledgeExplainerPart1: 'नॉलेज आपके प्रोजेक्ट का दिमाग है — यह',
    knowledgeExplainerEveryPrompt: 'हर प्रॉम्प्ट',
    knowledgeExplainerPart2: 'के साथ भेजा जाता है, ताकि AI हमेशा आपके विज़न, फीचर्स, डिज़ाइन सिस्टम और नियमों को समझे।',
    knowledgeAnalyzing: 'आपके ऐप का विश्लेषण हो रहा है...',
    knowledgeAutoGenerate: '✦ मौजूदा ऐप से ऑटो-जेनरेट करें',
    knowledgeLabel: 'नॉलेज',
    knowledgeSavedDone: '✓ सेव हो गया',
    knowledgePlaceholder: '# प्रोडक्ट विज़न\nआप क्या बना रहे हैं और किसके लिए?\n\n# कोर फीचर्स\n- फीचर एक\n- फीचर दो\n\n# डिज़ाइन सिस्टम\nरंग, फॉन्ट्स, स्टाइल दिशा\n\n# यूज़र रोल्स\nएडमिन, यूज़र, आदि और हर कोई क्या कर सकता है\n\n# नियम\nजो चीज़ें AI को कभी नहीं बदलनी चाहिए',

    browserTestTitle: 'ब्राउज़र टेस्ट्स',
    browserTestPassedWord: 'पास हुए',
    browserTestFailedWord: 'फेल हुए',
    browserTestPublishFirstError: 'ब्राउज़र टेस्ट चलाने के लिए पहले अपना प्रोजेक्ट पब्लिश करें',
    browserTestRunFailedError: 'टेस्ट रन फेल हुआ',
    browserTestPublishFirstInfo: 'ऑटोमेटेड ब्राउज़र टेस्ट चलाने के लिए पहले अपना प्रोजेक्ट पब्लिश करें।',
    browserTestRunButton: '▶ ब्राउज़र टेस्ट चलाएं',
    browserTestRunning: 'टेस्ट चल रहे हैं...',

    cloneTitle: 'वेबसाइट क्लोन करें',
    cloneDescription: 'कोई भी URL पेस्ट करें — WyberAi उसे स्क्रैप करके सेकंडों में एक React क्लोन बना देता है।',
    cloneButton: '⚡ क्लोन करें',
    cloneCloning: '🔍 क्लोन हो रहा है...',
    cloneFooterNote: 'यह किसी भी पब्लिक वेबसाइट के साथ काम करता है। इसके लिए Firecrawl API की चाहिए।',
    cloneChatUserPrefix: 'वेबसाइट क्लोन करें:',
    cloneScrapingMessage: '🔍 {url} को स्क्रैप किया जा रहा है...',
    cloneClonedMessage: '✓ {url} क्लोन हो गया — {count} फाइलें बनीं। इसे अपनी मर्जी से कस्टमाइज़ करें।',
    cloneFailedPrefix: 'क्लोन करने में विफल:',
    cloneErrorFallback: 'क्लोन विफल हुआ',

    crossProjectTitle: 'क्रॉस-प्रोजेक्ट',
    crossProjectSubtitle: 'अपने दूसरे प्रोजेक्ट्स के कॉम्पोनेंट्स और फाइलों को दोबारा इस्तेमाल करें।',
    crossProjectEmptyState: 'अभी तक कोई दूसरा प्रोजेक्ट नहीं है। क्रॉस-प्रोजेक्ट रेफरेंसिंग इस्तेमाल करने के लिए एक और प्रोजेक्ट बनाएं।',
    crossProjectHide: '▲ छुपाएं',
    crossProjectBrowse: '▼ ब्राउज़ करें',
    crossProjectFilesFromLabel: '"{name}" की फाइलें — कॉपी करने के लिए चुनें',
    crossProjectCopyingButton: 'कॉपी हो रहा है...',
    crossProjectCopyButton: 'इस प्रोजेक्ट में {count} फाइल{plural} कॉपी करें',
    crossProjectCopiedMsg: '✓ इस प्रोजेक्ट में {count} फाइल{plural} कॉपी हुईं',
    crossProjectNothingCopied: 'कुछ भी कॉपी नहीं हुआ',

    autoFixMessagePrefix: 'एरर ठीक किया जा रहा है:',

    errorFixInfoBox: '✕ कोई एरर मैसेज या कंसोल आउटपुट पेस्ट करें। WyberAi उसे ठीक करता है — हमारी वजह से हुई गलतियों के लिए कोई क्रेडिट नहीं कटेगा।',
    errorFixPlaceholderIntro: 'यहां एरर पेस्ट करें...',
    errorFixFixing: '⟳ ठीक हो रहा है...',
    errorFixButton: '⚡ यह एरर ठीक करें',

    fileMentionHeader: 'एक फाइल रेफर करें',

    voiceStopRecording: 'रिकॉर्डिंग रोकें',
    voiceSpeakIdea: 'अपना आइडिया बोलें',
  },
  kn: {
    seoAuditTitle: 'SEO ಮತ್ತು AI ಸರ್ಚ್',
    seoAuditAuditing: 'ಆಡಿಟ್ ಆಗುತ್ತಿದೆ...',
    seoAuditRunButton: '🔍 SEO ಮತ್ತು AI ಸರ್ಚ್ ಆಡಿಟ್ ರನ್ ಮಾಡಿ',
    seoAuditPassedLabel: 'ಪಾಸ್',
    seoAuditWarningsLabel: 'ಎಚ್ಚರಿಕೆಗಳು',
    seoAuditFailedLabel: 'ಫೇಲ್',
    seoAuditOptimizedMsg: 'AI ಸರ್ಚ್‌ಗಾಗಿ ಆಪ್ಟಿಮೈಸ್ ಆಗಿದೆ (ChatGPT, Perplexity, Claude)',
    seoAuditNotOptimizedMsg: 'AI ಸರ್ಚ್ ಎಂಜಿನ್‌ಗಳಿಗೆ ಆಪ್ಟಿಮೈಸ್ ಆಗಿಲ್ಲ',
    seoAuditFixPrefix: 'ಫಿಕ್ಸ್:',
    seoAuditDetectedKeywords: 'ಪತ್ತೆಯಾದ ಕೀವರ್ಡ್‌ಗಳು',

    skillsTitle: 'ವರ್ಕ್‌ಸ್ಪೇಸ್ ಸ್ಕಿಲ್ಸ್',
    skillsNewButton: '+ ಹೊಸ ಸ್ಕಿಲ್',
    skillsSubtitle: 'ಮರುಬಳಕೆ ಮಾಡಬಹುದಾದ ಪ್ಲೇಬುಕ್‌ಗಳು — ಪ್ರಸ್ತುತ ಪ್ರಾಜೆಕ್ಟ್‌ನಲ್ಲಿ ರನ್ ಮಾಡಲು Apply ಕ್ಲಿಕ್ ಮಾಡಿ',
    skillsNamePlaceholder: 'ಸ್ಕಿಲ್ ಹೆಸರು...',
    skillsDescPlaceholder: 'ಈ ಸ್ಕಿಲ್ ಏನು ಮಾಡುತ್ತದೆ?',
    skillsInstructionsPlaceholder: 'AI ಗಾಗಿ ಸೂಚನೆಗಳು...',
    skillsSaveButton: 'ಸ್ಕಿಲ್ ಸೇವ್ ಮಾಡಿ',
    skillsApplied: '✓ ಅನ್ವಯಿಸಲಾಗಿದೆ',
    skillsApplyButton: 'ಅನ್ವಯಿಸಿ',

    knowledgeExplainerPart1: 'ನಾಲೆಡ್ಜ್ ನಿಮ್ಮ ಪ್ರಾಜೆಕ್ಟ್‌ನ ಮೆದುಳು — ಇದನ್ನು',
    knowledgeExplainerEveryPrompt: 'ಪ್ರತಿ ಪ್ರಾಂಪ್ಟ್‌ನೊಂದಿಗೆ',
    knowledgeExplainerPart2: 'ಕಳುಹಿಸಲಾಗುತ್ತದೆ, ಇದರಿಂದ AI ಯಾವಾಗಲೂ ನಿಮ್ಮ ವಿಷನ್, ಫೀಚರ್‌ಗಳು, ಡಿಸೈನ್ ಸಿಸ್ಟಮ್ ಮತ್ತು ನಿಯಮಗಳನ್ನು ಅರ್ಥಮಾಡಿಕೊಳ್ಳುತ್ತದೆ.',
    knowledgeAnalyzing: 'ನಿಮ್ಮ ಆ್ಯಪ್ ಅನ್ನು ವಿಶ್ಲೇಷಿಸಲಾಗುತ್ತಿದೆ...',
    knowledgeAutoGenerate: '✦ ಪ್ರಸ್ತುತ ಆ್ಯಪ್‌ನಿಂದ ಆಟೋ-ಜನರೇಟ್ ಮಾಡಿ',
    knowledgeLabel: 'ನಾಲೆಡ್ಜ್',
    knowledgeSavedDone: '✓ ಸೇವ್ ಆಗಿದೆ',
    knowledgePlaceholder: '# ಪ್ರೊಡಕ್ಟ್ ವಿಷನ್\nನೀವು ಏನನ್ನು ಮತ್ತು ಯಾರಿಗಾಗಿ ನಿರ್ಮಿಸುತ್ತಿದ್ದೀರಿ?\n\n# ಕೋರ್ ಫೀಚರ್‌ಗಳು\n- ಫೀಚರ್ ಒಂದು\n- ಫೀಚರ್ ಎರಡು\n\n# ಡಿಸೈನ್ ಸಿಸ್ಟಮ್\nಬಣ್ಣಗಳು, ಫಾಂಟ್‌ಗಳು, ಸ್ಟೈಲ್ ದಿಕ್ಕು\n\n# ಯೂಸರ್ ರೋಲ್‌ಗಳು\nಅಡ್ಮಿನ್, ಯೂಸರ್, ಇತ್ಯಾದಿ ಮತ್ತು ಪ್ರತಿಯೊಬ್ಬರೂ ಏನು ಮಾಡಬಹುದು\n\n# ನಿಯಮಗಳು\nAI ಎಂದಿಗೂ ಬದಲಾಯಿಸಬಾರದ ವಿಷಯಗಳು',

    browserTestTitle: 'ಬ್ರೌಸರ್ ಟೆಸ್ಟ್‌ಗಳು',
    browserTestPassedWord: 'ಪಾಸ್ ಆಗಿವೆ',
    browserTestFailedWord: 'ಫೇಲ್ ಆಗಿವೆ',
    browserTestPublishFirstError: 'ಬ್ರೌಸರ್ ಟೆಸ್ಟ್ ರನ್ ಮಾಡಲು ಮೊದಲು ನಿಮ್ಮ ಪ್ರಾಜೆಕ್ಟ್ ಪಬ್ಲಿಷ್ ಮಾಡಿ',
    browserTestRunFailedError: 'ಟೆಸ್ಟ್ ರನ್ ವಿಫಲವಾಗಿದೆ',
    browserTestPublishFirstInfo: 'ಸ್ವಯಂಚಾಲಿತ ಬ್ರೌಸರ್ ಟೆಸ್ಟ್‌ಗಳನ್ನು ರನ್ ಮಾಡಲು ಮೊದಲು ನಿಮ್ಮ ಪ್ರಾಜೆಕ್ಟ್ ಪಬ್ಲಿಷ್ ಮಾಡಿ.',
    browserTestRunButton: '▶ ಬ್ರೌಸರ್ ಟೆಸ್ಟ್ ರನ್ ಮಾಡಿ',
    browserTestRunning: 'ಟೆಸ್ಟ್‌ಗಳು ರನ್ ಆಗುತ್ತಿವೆ...',

    cloneTitle: 'ವೆಬ್‌ಸೈಟ್ ಕ್ಲೋನ್ ಮಾಡಿ',
    cloneDescription: 'ಯಾವುದೇ URL ಪೇಸ್ಟ್ ಮಾಡಿ — WyberAi ಅದನ್ನು ಸ್ಕ್ರ್ಯಾಪ್ ಮಾಡಿ ಸೆಕೆಂಡುಗಳಲ್ಲಿ React ಕ್ಲೋನ್ ಕಟ್ಟುತ್ತದೆ.',
    cloneButton: '⚡ ಕ್ಲೋನ್ ಮಾಡಿ',
    cloneCloning: '🔍 ಕ್ಲೋನ್ ಆಗುತ್ತಿದೆ...',
    cloneFooterNote: 'ಇದು ಯಾವುದೇ ಸಾರ್ವಜನಿಕ ವೆಬ್‌ಸೈಟ್‌ನೊಂದಿಗೆ ಕೆಲಸ ಮಾಡುತ್ತದೆ. Firecrawl API ಕೀ ಅಗತ್ಯವಿದೆ.',
    cloneChatUserPrefix: 'ವೆಬ್‌ಸೈಟ್ ಕ್ಲೋನ್ ಮಾಡಿ:',
    cloneScrapingMessage: '🔍 {url} ಅನ್ನು ಸ್ಕ್ರ್ಯಾಪ್ ಮಾಡಲಾಗುತ್ತಿದೆ...',
    cloneClonedMessage: '✓ {url} ಕ್ಲೋನ್ ಆಗಿದೆ — {count} ಫೈಲ್‌ಗಳು ರಚಿಸಲಾಗಿದೆ. ಇದನ್ನು ನಿಮ್ಮ ಇಚ್ಛೆಯಂತೆ ಕಸ್ಟಮೈಸ್ ಮಾಡಿ.',
    cloneFailedPrefix: 'ಕ್ಲೋನ್ ಮಾಡಲು ವಿಫಲವಾಗಿದೆ:',
    cloneErrorFallback: 'ಕ್ಲೋನ್ ವಿಫಲವಾಗಿದೆ',

    crossProjectTitle: 'ಕ್ರಾಸ್-ಪ್ರಾಜೆಕ್ಟ್',
    crossProjectSubtitle: 'ನಿಮ್ಮ ಇತರ ಪ್ರಾಜೆಕ್ಟ್‌ಗಳಿಂದ ಕಾಂಪೊನೆಂಟ್‌ಗಳು ಮತ್ತು ಫೈಲ್‌ಗಳನ್ನು ಮರುಬಳಕೆ ಮಾಡಿ.',
    crossProjectEmptyState: 'ಇನ್ನೂ ಬೇರೆ ಯಾವುದೇ ಪ್ರಾಜೆಕ್ಟ್ ಇಲ್ಲ. ಕ್ರಾಸ್-ಪ್ರಾಜೆಕ್ಟ್ ರೆಫರೆನ್ಸಿಂಗ್ ಬಳಸಲು ಇನ್ನೊಂದು ಪ್ರಾಜೆಕ್ಟ್ ರಚಿಸಿ.',
    crossProjectHide: '▲ ಮರೆಮಾಡಿ',
    crossProjectBrowse: '▼ ಬ್ರೌಸ್ ಮಾಡಿ',
    crossProjectFilesFromLabel: '"{name}" ನಿಂದ ಫೈಲ್‌ಗಳು — ಕಾಪಿ ಮಾಡಲು ಆಯ್ಕೆಮಾಡಿ',
    crossProjectCopyingButton: 'ಕಾಪಿ ಆಗುತ್ತಿದೆ...',
    crossProjectCopyButton: 'ಈ ಪ್ರಾಜೆಕ್ಟ್‌ಗೆ {count} ಫೈಲ್{plural} ಕಾಪಿ ಮಾಡಿ',
    crossProjectCopiedMsg: '✓ ಈ ಪ್ರಾಜೆಕ್ಟ್‌ಗೆ {count} ಫೈಲ್{plural} ಕಾಪಿ ಆಗಿದೆ',
    crossProjectNothingCopied: 'ಏನೂ ಕಾಪಿ ಆಗಿಲ್ಲ',

    autoFixMessagePrefix: 'ಎರರ್ ಸರಿಪಡಿಸಲಾಗುತ್ತಿದೆ:',

    errorFixInfoBox: '✕ ಒಂದು ಎರರ್ ಮೆಸೇಜ್ ಅಥವಾ ಕನ್ಸೋಲ್ ಔಟ್‌ಪುಟ್ ಪೇಸ್ಟ್ ಮಾಡಿ. WyberAi ಅದನ್ನು ಸರಿಪಡಿಸುತ್ತದೆ — ನಮ್ಮಿಂದ ಆದ ದೋಷಗಳಿಗೆ ಯಾವುದೇ ಕ್ರೆಡಿಟ್ ಚಾರ್ಜ್ ಇಲ್ಲ.',
    errorFixPlaceholderIntro: 'ಇಲ್ಲಿ ಎರರ್ ಪೇಸ್ಟ್ ಮಾಡಿ...',
    errorFixFixing: '⟳ ಸರಿಪಡಿಸಲಾಗುತ್ತಿದೆ...',
    errorFixButton: '⚡ ಈ ಎರರ್ ಸರಿಪಡಿಸಿ',

    fileMentionHeader: 'ಒಂದು ಫೈಲ್ ರೆಫರ್ ಮಾಡಿ',

    voiceStopRecording: 'ರೆಕಾರ್ಡಿಂಗ್ ನಿಲ್ಲಿಸಿ',
    voiceSpeakIdea: 'ನಿಮ್ಮ ಐಡಿಯಾ ಹೇಳಿ',
  },
  te: {
    seoAuditTitle: 'SEO & AI సెర్చ్',
    seoAuditAuditing: 'ఆడిట్ అవుతోంది...',
    seoAuditRunButton: '🔍 SEO & AI సెర్చ్ ఆడిట్ రన్ చేయండి',
    seoAuditPassedLabel: 'పాస్',
    seoAuditWarningsLabel: 'హెచ్చరికలు',
    seoAuditFailedLabel: 'ఫెయిల్',
    seoAuditOptimizedMsg: 'AI సెర్చ్ కోసం ఆప్టిమైజ్ చేయబడింది (ChatGPT, Perplexity, Claude)',
    seoAuditNotOptimizedMsg: 'AI సెర్చ్ ఇంజిన్‌ల కోసం ఆప్టిమైజ్ కాలేదు',
    seoAuditFixPrefix: 'ఫిక్స్:',
    seoAuditDetectedKeywords: 'గుర్తించిన కీవర్డ్‌లు',

    skillsTitle: 'వర్క్‌స్పేస్ స్కిల్స్',
    skillsNewButton: '+ కొత్త స్కిల్',
    skillsSubtitle: 'మళ్ళీ ఉపయోగించగల ప్లేబుక్‌లు — ప్రస్తుత ప్రాజెక్ట్‌పై రన్ చేయడానికి Apply నొక్కండి',
    skillsNamePlaceholder: 'స్కిల్ పేరు...',
    skillsDescPlaceholder: 'ఈ స్కిల్ ఏమి చేస్తుంది?',
    skillsInstructionsPlaceholder: 'AI కోసం సూచనలు...',
    skillsSaveButton: 'స్కిల్ సేవ్ చేయండి',
    skillsApplied: '✓ వర్తింపజేయబడింది',
    skillsApplyButton: 'వర్తింపజేయండి',

    knowledgeExplainerPart1: 'నాలెడ్జ్ మీ ప్రాజెక్ట్ యొక్క మెదడు — ఇది',
    knowledgeExplainerEveryPrompt: 'ప్రతి ప్రాంప్ట్‌తో',
    knowledgeExplainerPart2: 'పంపబడుతుంది, తద్వారా AI ఎల్లప్పుడూ మీ విజన్, ఫీచర్లు, డిజైన్ సిస్టమ్ మరియు నియమాలను అర్థం చేసుకుంటుంది.',
    knowledgeAnalyzing: 'మీ యాప్‌ను విశ్లేషిస్తోంది...',
    knowledgeAutoGenerate: '✦ ప్రస్తుత యాప్ నుండి ఆటో-జనరేట్ చేయండి',
    knowledgeLabel: 'నాలెడ్జ్',
    knowledgeSavedDone: '✓ సేవ్ అయ్యింది',
    knowledgePlaceholder: '# ప్రొడక్ట్ విజన్\nమీరు ఏమి నిర్మిస్తున్నారు మరియు ఎవరి కోసం?\n\n# కోర్ ఫీచర్లు\n- ఫీచర్ ఒకటి\n- ఫీచర్ రెండు\n\n# డిజైన్ సిస్టమ్\nరంగులు, ఫాంట్‌లు, స్టైల్ దిశ\n\n# యూజర్ రోల్స్\nఅడ్మిన్, యూజర్, మొదలైనవి మరియు ప్రతి ఒక్కరూ ఏమి చేయగలరు\n\n# నియమాలు\nAI ఎప్పుడూ మార్చకూడని విషయాలు',

    browserTestTitle: 'బ్రౌజర్ టెస్ట్‌లు',
    browserTestPassedWord: 'పాస్ అయ్యాయి',
    browserTestFailedWord: 'ఫెయిల్ అయ్యాయి',
    browserTestPublishFirstError: 'బ్రౌజర్ టెస్ట్‌లు రన్ చేయడానికి ముందు మీ ప్రాజెక్ట్‌ను పబ్లిష్ చేయండి',
    browserTestRunFailedError: 'టెస్ట్ రన్ విఫలమైంది',
    browserTestPublishFirstInfo: 'ఆటోమేటెడ్ బ్రౌజర్ టెస్ట్‌లు రన్ చేయడానికి ముందు మీ ప్రాజెక్ట్‌ను పబ్లిష్ చేయండి.',
    browserTestRunButton: '▶ బ్రౌజర్ టెస్ట్‌లు రన్ చేయండి',
    browserTestRunning: 'టెస్ట్‌లు రన్ అవుతున్నాయి...',

    cloneTitle: 'వెబ్‌సైట్‌ను క్లోన్ చేయండి',
    cloneDescription: 'ఏదైనా URLని పేస్ట్ చేయండి — WyberAi దాన్ని స్క్రాప్ చేసి సెకన్లలో ఒక React క్లోన్‌ను నిర్మిస్తుంది.',
    cloneButton: '⚡ క్లోన్ చేయండి',
    cloneCloning: '🔍 క్లోన్ అవుతోంది...',
    cloneFooterNote: 'ఇది ఏదైనా పబ్లిక్ వెబ్‌సైట్‌తో పని చేస్తుంది. దీనికి Firecrawl API కీ అవసరం.',
    cloneChatUserPrefix: 'వెబ్‌సైట్‌ను క్లోన్ చేయండి:',
    cloneScrapingMessage: '🔍 {url}ని స్క్రాప్ చేస్తోంది...',
    cloneClonedMessage: '✓ {url} క్లోన్ అయ్యింది — {count} ఫైల్‌లు జనరేట్ అయ్యాయి. దీన్ని మీకు నచ్చినట్లు కస్టమైజ్ చేసుకోండి.',
    cloneFailedPrefix: 'క్లోన్ చేయడంలో విఫలమైంది:',
    cloneErrorFallback: 'క్లోన్ విఫలమైంది',

    crossProjectTitle: 'క్రాస్-ప్రాజెక్ట్',
    crossProjectSubtitle: 'మీ ఇతర ప్రాజెక్ట్‌ల నుండి కాంపోనెంట్‌లు మరియు ఫైల్‌లను తిరిగి ఉపయోగించండి.',
    crossProjectEmptyState: 'ఇంకా వేరే ప్రాజెక్ట్ లేదు. క్రాస్-ప్రాజెక్ట్ రిఫరెన్సింగ్ ఉపయోగించడానికి మరో ప్రాజెక్ట్‌ను క్రియేట్ చేయండి.',
    crossProjectHide: '▲ దాచండి',
    crossProjectBrowse: '▼ బ్రౌజ్ చేయండి',
    crossProjectFilesFromLabel: '"{name}" నుండి ఫైల్‌లు — కాపీ చేయడానికి ఎంచుకోండి',
    crossProjectCopyingButton: 'కాపీ అవుతోంది...',
    crossProjectCopyButton: 'ఈ ప్రాజెక్ట్‌లోకి {count} ఫైల్{plural} కాపీ చేయండి',
    crossProjectCopiedMsg: '✓ ఈ ప్రాజెక్ట్‌లోకి {count} ఫైల్{plural} కాపీ అయ్యాయి',
    crossProjectNothingCopied: 'ఏమీ కాపీ కాలేదు',

    autoFixMessagePrefix: 'ఎర్రర్‌ను ఫిక్స్ చేస్తోంది:',

    errorFixInfoBox: '✕ ఒక ఎర్రర్ మెసేజ్ లేదా కన్సోల్ అవుట్‌పుట్‌ను పేస్ట్ చేయండి. WyberAi దాన్ని ఫిక్స్ చేస్తుంది — మా వల్ల జరిగిన ఎర్రర్‌లకు క్రెడిట్ ఛార్జ్ ఉండదు.',
    errorFixPlaceholderIntro: 'ఇక్కడ ఎర్రర్‌ను పేస్ట్ చేయండి...',
    errorFixFixing: '⟳ ఫిక్స్ అవుతోంది...',
    errorFixButton: '⚡ ఈ ఎర్రర్‌ను ఫిక్స్ చేయండి',

    fileMentionHeader: 'ఒక ఫైల్‌ను రిఫర్ చేయండి',

    voiceStopRecording: 'రికార్డింగ్‌ను ఆపండి',
    voiceSpeakIdea: 'మీ ఐడియాను మాట్లాడండి',
  },
  ta: {
    seoAuditTitle: 'SEO & AI தேடல்',
    seoAuditAuditing: 'ஆடிட் ஆகிறது...',
    seoAuditRunButton: '🔍 SEO & AI தேடல் ஆடிட்டை இயக்குங்கள்',
    seoAuditPassedLabel: 'பாஸ்',
    seoAuditWarningsLabel: 'எச்சரிக்கைகள்',
    seoAuditFailedLabel: 'தோல்வி',
    seoAuditOptimizedMsg: 'AI தேடலுக்கு ஆப்டிமைஸ் செய்யப்பட்டது (ChatGPT, Perplexity, Claude)',
    seoAuditNotOptimizedMsg: 'AI தேடல் இயந்திரங்களுக்கு ஆப்டிமைஸ் செய்யப்படவில்லை',
    seoAuditFixPrefix: 'சரிசெய்ய:',
    seoAuditDetectedKeywords: 'கண்டறியப்பட்ட கீவேர்டுகள்',

    skillsTitle: 'பணிமனை திறன்கள்',
    skillsNewButton: '+ புதிய திறன்',
    skillsSubtitle: 'மீண்டும் பயன்படுத்தக்கூடிய ப்ளேபுக்குகள் — தற்போதைய ப்ராஜெக்டில் இயக்க Apply-ஐ கிளிக் செய்யுங்கள்',
    skillsNamePlaceholder: 'திறன் பெயர்...',
    skillsDescPlaceholder: 'இந்த திறன் என்ன செய்கிறது?',
    skillsInstructionsPlaceholder: 'AI-க்கான வழிமுறைகள்...',
    skillsSaveButton: 'திறனை சேவ் செய்யுங்கள்',
    skillsApplied: '✓ செயல்படுத்தப்பட்டது',
    skillsApplyButton: 'செயல்படுத்து',

    knowledgeExplainerPart1: 'நாலெட்ஜ் என்பது உங்கள் ப்ராஜெக்டின் மூளை — இது',
    knowledgeExplainerEveryPrompt: 'ஒவ்வொரு ப்ராம்ப்ட்டுடனும்',
    knowledgeExplainerPart2: 'அனுப்பப்படுகிறது, இதனால் AI எப்போதும் உங்கள் விஷன், ஃபீச்சர்கள், டிசைன் சிஸ்டம் மற்றும் விதிகளை புரிந்துகொள்கிறது.',
    knowledgeAnalyzing: 'உங்கள் ஆப் பகுப்பாய்வு செய்யப்படுகிறது...',
    knowledgeAutoGenerate: '✦ தற்போதைய ஆப்பிலிருந்து ஆட்டோ-ஜெனரேட் செய்யுங்கள்',
    knowledgeLabel: 'நாலெட்ஜ்',
    knowledgeSavedDone: '✓ சேவ் ஆனது',
    knowledgePlaceholder: '# புராடக்ட் விஷன்\nநீங்கள் என்ன கட்டமைக்கிறீர்கள் மற்றும் யாருக்காக?\n\n# கோர் ஃபீச்சர்கள்\n- ஃபீச்சர் ஒன்று\n- ஃபீச்சர் இரண்டு\n\n# டிசைன் சிஸ்டம்\nநிறங்கள், ஃபான்ட்கள், ஸ்டைல் திசை\n\n# யூசர் ரோல்கள்\nஅட்மின், யூசர், மற்றும் ஒவ்வொருவரும் என்ன செய்ய முடியும்\n\n# விதிகள்\nAI ஒருபோதும் மாற்றக்கூடாத விஷயங்கள்',

    browserTestTitle: 'உலாவி சோதனைகள்',
    browserTestPassedWord: 'பாஸ் ஆனது',
    browserTestFailedWord: 'தோல்வியடைந்தது',
    browserTestPublishFirstError: 'உலாவி சோதனைகளை இயக்க முதலில் உங்கள் ப்ராஜெக்டை பப்ளிஷ் செய்யுங்கள்',
    browserTestRunFailedError: 'சோதனை இயக்கம் தோல்வியடைந்தது',
    browserTestPublishFirstInfo: 'தானியங்கி உலாவி சோதனைகளை இயக்க முதலில் உங்கள் ப்ராஜெக்டை பப்ளிஷ் செய்யுங்கள்.',
    browserTestRunButton: '▶ உலாவி சோதனைகளை இயக்குங்கள்',
    browserTestRunning: 'சோதனைகள் இயங்குகின்றன...',

    cloneTitle: 'ஒரு வலைத்தளத்தை க்ளோன் செய்யுங்கள்',
    cloneDescription: 'எந்த URL-ஐயும் ஒட்டவும் — WyberAi அதை ஸ்க்ரேப் செய்து சில வினாடிகளில் ஒரு React க்ளோனை உருவாக்கும்.',
    cloneButton: '⚡ க்ளோன் செய்யுங்கள்',
    cloneCloning: '🔍 க்ளோன் ஆகிறது...',
    cloneFooterNote: 'இது எந்த பொது வலைத்தளத்துடனும் வேலை செய்யும். Firecrawl API கீ தேவை.',
    cloneChatUserPrefix: 'வலைத்தளத்தை க்ளோன் செய்யுங்கள்:',
    cloneScrapingMessage: '🔍 {url}-ஐ ஸ்க்ரேப் செய்கிறது...',
    cloneClonedMessage: '✓ {url} க்ளோன் ஆனது — {count} ஃபைல்கள் உருவாக்கப்பட்டன. இதை உங்கள் விருப்பப்படி கஸ்டமைஸ் செய்யுங்கள்.',
    cloneFailedPrefix: 'க்ளோன் செய்வதில் தோல்வி:',
    cloneErrorFallback: 'க்ளோன் தோல்வியடைந்தது',

    crossProjectTitle: 'கிராஸ்-ப்ராஜெக்ட்',
    crossProjectSubtitle: 'உங்கள் மற்ற ப்ராஜெக்ட்களிலிருந்து காம்போனென்ட்கள் மற்றும் ஃபைல்களை மீண்டும் பயன்படுத்துங்கள்.',
    crossProjectEmptyState: 'இதுவரை வேறு ப்ராஜெக்ட் இல்லை. கிராஸ்-ப்ராஜெக்ட் குறிப்பீட்டைப் பயன்படுத்த மற்றொரு ப்ராஜெக்டை உருவாக்குங்கள்.',
    crossProjectHide: '▲ மறை',
    crossProjectBrowse: '▼ உலாவு',
    crossProjectFilesFromLabel: '"{name}" இலிருந்து ஃபைல்கள் — காபி செய்ய தேர்ந்தெடுக்கவும்',
    crossProjectCopyingButton: 'காபி ஆகிறது...',
    crossProjectCopyButton: 'இந்த ப்ராஜெக்டில் {count} ஃபைல்{plural} காபி செய்யுங்கள்',
    crossProjectCopiedMsg: '✓ இந்த ப்ராஜெக்டில் {count} ஃபைல்{plural} காபி ஆனது',
    crossProjectNothingCopied: 'எதுவும் காபி ஆகவில்லை',

    autoFixMessagePrefix: 'பிழையை சரிசெய்கிறது:',

    errorFixInfoBox: '✕ ஒரு பிழை செய்தி அல்லது கன்சோல் அவுட்புட்டை ஒட்டவும். WyberAi அதை சரிசெய்யும் — நாங்கள் ஏற்படுத்திய பிழைகளுக்கு கிரெடிட் கட்டணம் இல்லை.',
    errorFixPlaceholderIntro: 'இங்கே பிழையை ஒட்டவும்...',
    errorFixFixing: '⟳ சரிசெய்கிறது...',
    errorFixButton: '⚡ இந்த பிழையை சரிசெய்யுங்கள்',

    fileMentionHeader: 'ஒரு ஃபைலைக் குறிப்பிடவும்',

    voiceStopRecording: 'பதிவை நிறுத்துங்கள்',
    voiceSpeakIdea: 'உங்கள் யோசனையை பேசுங்கள்',
  },
};
