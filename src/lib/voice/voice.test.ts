import { describe, expect, it } from 'vitest'
import { appendSegment, cleanTranscript, wordCount } from './transcript'
import { mapLocaleToVoiceLanguage, pickDefaultVoiceLanguage, VOICE_LANGUAGES } from './languages'
import {
  detectProjectType, fallbackBrief, findUnspokenFacts, initialVoiceFlow, isThinBrief, mergeAnswers,
  normalizeBrief, voiceFlowReducer, type VoiceBrief, type VoiceFlowState,
} from './brief'
import { canOpenLevelMeter, describeSpeechError, isFatalSpeechError, levelFromSamples, shouldStopForSilence } from './capture'
import { serverSttEnabled } from './stt'

describe('transcript cleaning', () => {
  it('tidies spacing, hesitations and stammered repeats without changing meaning', () => {
    expect(cleanTranscript('  um   I want I want a website for my   sweet shop ')).toBe('I want a website for my sweet shop')
  })
  it('keeps Indian-language text untouched', () => {
    expect(cleanTranscript('मुझे अपनी दुकान के लिए वेबसाइट चाहिए')).toBe('मुझे अपनी दुकान के लिए वेबसाइट चाहिए')
  })
  it('does not collapse legitimate repeats of different words', () => {
    expect(cleanTranscript('very very big')).toBe('Very very big')
    expect(cleanTranscript('a shop for shoes and bags')).toBe('A shop for shoes and bags')
  })
  it('drops a re-sent tail after an engine restart', () => {
    const a = appendSegment('I run a bakery in the old town', 'in the old town and I want orders')
    expect(a).toBe('I run a bakery in the old town and I want orders')
    expect(appendSegment('hello there friend', 'there friend')).toBe('hello there friend')
    expect(appendSegment('', ' first ')).toBe('first')
    expect(wordCount(' a  b c ')).toBe(3)
  })
})

describe('language mapping', () => {
  it('maps browser tags to supported spoken languages', () => {
    expect(mapLocaleToVoiceLanguage('hi-IN')?.code).toBe('hi-IN')
    expect(mapLocaleToVoiceLanguage('mr')?.code).toBe('mr-IN')
    expect(mapLocaleToVoiceLanguage('en-GB')?.code).toBe('en-IN')
    expect(mapLocaleToVoiceLanguage('fr-FR')).toBeNull()
    expect(VOICE_LANGUAGES.map(l => l.short)).toEqual(['en', 'hi', 'mr', 'gu', 'ta', 'te', 'kn', 'bn'])
  })
  it('defaults: saved choice, then site language, then browser, then English', () => {
    expect(pickDefaultVoiceLanguage({ saved: 'ta-IN', siteLocale: 'hi', browserLanguages: ['gu'] }).code).toBe('ta-IN')
    expect(pickDefaultVoiceLanguage({ siteLocale: 'kn', browserLanguages: ['gu'] }).code).toBe('kn-IN')
    expect(pickDefaultVoiceLanguage({ siteLocale: 'en', browserLanguages: ['fr', 'gu-IN'] }).code).toBe('gu-IN')
    expect(pickDefaultVoiceLanguage({ browserLanguages: ['fr-FR'] }).code).toBe('en-IN')
    expect(pickDefaultVoiceLanguage({ saved: 'xx-XX' }).code).toBe('en-IN')
  })
})

describe('project type detection', () => {
  it.each([
    ['I want a website for my sweet shop', 'website'],
    ['mujhe apni dukaan ke liye website banani hai', 'website'],
    ['मुझे अपनी दुकान की वेबसाइट बनानी है', 'website'],
    ['a landing page for my yoga class', 'website'],
    ['I need an android app for my delivery boys', 'mobile'],
    ['मुझे एक मोबाइल ऐप चाहिए', 'mobile'],
    ['a SaaS for clinics with plans and accounts', 'saas'],
    ['web app to track my stock', 'app'],
    ['billing tool for my shop', 'app'],
  ])('%s -> %s', (text, kind) => {
    expect(detectProjectType(text)).toBe(kind)
  })
  it('a web app is not mistaken for a website', () => {
    expect(detectProjectType('a web app, not a website')).toBe('app')
  })
})

describe('honest-content guard', () => {
  it('flags numbers and links the speaker never said', () => {
    expect(findUnspokenFacts('Shop open since 1998 with 50 items', 'I run a shop')).toEqual(['1998', '50'])
    expect(findUnspokenFacts('Contact info@shop.com', 'I run a shop')).toEqual(['info@shop.com'])
  })
  it('accepts numbers that were said, including Indian digits and commas', () => {
    expect(findUnspokenFacts('Prices from 500 rupees', 'prices start at 500 rupees')).toEqual([])
    expect(findUnspokenFacts('दाम 500 से शुरू', 'दाम ५०० से शुरू')).toEqual([])
    expect(findUnspokenFacts('Rs 1,200', 'rs 1200')).toEqual([])
  })
  it('falls back to the speaker\'s own words when the model invents a fact', () => {
    const b = normalizeBrief({ type: 'website', business: 'Sweet shop', brief: 'Build a website for a sweet shop founded in 1985.' }, 'I want a website for my sweet shop')
    expect(b.fellBack).toBe(true)
    expect(b.brief).toBe('I want a website for my sweet shop')
    expect(b.business).toBeNull()
  })
})

describe('brief normalisation', () => {
  it('accepts a good model answer and keeps Hinglish as spoken', () => {
    const said = 'mujhe apni mithai ki dukaan ke liye website chahiye jisme menu aur WhatsApp order ho'
    const b = normalizeBrief({
      type: 'website', business: 'mithai ki dukaan',
      brief: 'Mithai ki dukaan ke liye website banao jisme menu aur WhatsApp order ho.', missing: ['shehar'], questions: ['x'],
    }, said)
    expect(b.fellBack).toBe(false)
    expect(b.type).toBe('website')
    expect(b.business).toBe('mithai ki dukaan')
    expect(b.brief).toContain('WhatsApp')
  })
  it('rejects a bad type from the model and detects it from the words instead', () => {
    expect(normalizeBrief({ type: 'blockchain', brief: 'Build an android app for delivery staff to log drops every day.' }, 'android app for my delivery staff').type).toBe('mobile')
    expect(normalizeBrief(null, 'a website for my school').type).toBe('website')
  })
  it('asks at most two questions and only when thin', () => {
    const thin = normalizeBrief({ type: 'app', brief: 'A shop app.', questions: ['What do you sell?', 'Who buys from you?', 'A third question?'] }, 'a shop app')
    expect(thin.questions).toHaveLength(2)
    const rich = normalizeBrief({
      type: 'app', business: 'tailor shop',
      brief: 'Build a web app for my tailor shop where I record customer measurements, track orders by due date and mark them ready for pickup so customers can be told.',
      questions: ['Anything else?'],
    }, 'tailor shop web app record customer measurements track orders by due date mark them ready for pickup so customers can be told')
    expect(rich.questions).toEqual([])
    expect(isThinBrief(rich)).toBe(false)
  })
  it('offline fallback gives cleaned words, a detected type and no questions', () => {
    const b = fallbackBrief('um I want a portfolio website')
    expect(b.brief).toBe('I want a portfolio website')
    expect(b.type).toBe('website')
    expect(b.questions).toEqual([])
  })
  it('merges spoken follow-up answers into what the model sees', () => {
    expect(mergeAnswers('a shop app', [{ question: 'What do you sell?', answer: ' shoes ' }, { question: 'Who?', answer: '' }])).toBe('a shop app\n\nFollow-up:\nQ: What do you sell?\nA: shoes')
    expect(mergeAnswers(' hi ', [])).toBe('hi')
  })
})

describe('confirm step (flow)', () => {
  const brief = (over: Partial<VoiceBrief> = {}): VoiceBrief => ({ type: 'website', business: 'x', brief: 'Build a website for my shop.', missing: [], questions: [], fellBack: false, ...over })
  const run = (s: VoiceFlowState, ...a: Parameters<typeof voiceFlowReducer>[1][]) => a.reduce(voiceFlowReducer, s)

  it('goes capture -> working -> confirm when the brief is rich', () => {
    const s = run(initialVoiceFlow, { type: 'heard', transcript: 'a website for my shop' }, { type: 'brief', brief: brief() })
    expect(s.stage).toBe('confirm')
  })
  it('asks follow-ups one at a time and never more than two', () => {
    let s = run(initialVoiceFlow, { type: 'heard', transcript: 'a shop app' }, { type: 'brief', brief: brief({ questions: ['What do you sell?', 'Who buys?'] }) })
    expect(s.stage).toBe('followup')
    s = run(s, { type: 'answered', answer: 'shoes' })
    expect(s.stage).toBe('working')
    s = run(s, { type: 'brief', brief: brief({ questions: ['Who buys?', 'And more?'] }) })
    expect(s.stage).toBe('followup')
    s = run(s, { type: 'answered', answer: 'students' })
    s = run(s, { type: 'brief', brief: brief({ questions: ['Third?'] }) })
    expect(s.answers).toHaveLength(2)
    expect(s.stage).toBe('confirm')
  })
  it('skip goes straight to confirm', () => {
    const s = run(initialVoiceFlow, { type: 'heard', transcript: 'app' }, { type: 'brief', brief: brief({ questions: ['What?'] }) }, { type: 'skip' })
    expect(s.stage).toBe('confirm')
    expect(s.brief?.questions).toEqual([])
  })
  it('confirm hands the brief on exactly once, with the chosen type', () => {
    let s = run(initialVoiceFlow, { type: 'heard', transcript: 'x y' }, { type: 'brief', brief: brief() }, { type: 'retype', kind: 'mobile' }, { type: 'edit', brief: 'Build a phone app for my shop.' })
    s = run(s, { type: 'confirm' })
    expect(s.confirmed).toBe(true)
    expect(s.brief?.type).toBe('mobile')
    expect(s.brief?.brief).toBe('Build a phone app for my shop.')
    expect(run(s, { type: 'confirm' })).toBe(s)
  })
  it('cannot confirm before the brief exists or with an empty brief', () => {
    expect(run(initialVoiceFlow, { type: 'confirm' }).confirmed).toBe(false)
    const s = run(initialVoiceFlow, { type: 'heard', transcript: 'x y' }, { type: 'brief', brief: brief() }, { type: 'edit', brief: '   ' }, { type: 'confirm' })
    expect(s.confirmed).toBe(false)
  })
  it('ignores empty speech and reset starts over', () => {
    expect(run(initialVoiceFlow, { type: 'heard', transcript: '  ' })).toBe(initialVoiceFlow)
    expect(run(run(initialVoiceFlow, { type: 'heard', transcript: 'a b' }), { type: 'reset' })).toEqual(initialVoiceFlow)
  })
})

describe('capture helpers', () => {
  it('maps speech errors to problems', () => {
    expect(describeSpeechError('not-allowed')).toBe('denied')
    expect(describeSpeechError('audio-capture')).toBe('no-mic')
    expect(describeSpeechError('no-speech')).toBe('no-speech')
    expect(describeSpeechError('network')).toBe('network')
    expect(describeSpeechError('language-not-supported')).toBe('language')
    expect(describeSpeechError('weird')).toBe('generic')
    expect(isFatalSpeechError('network')).toBe(false)
    expect(isFatalSpeechError('not-allowed')).toBe(true)
  })
  it('stops on silence sooner after speech than before it', () => {
    expect(shouldStopForSilence({ heardSomething: true, msSinceActivity: 4000 })).toBe(true)
    expect(shouldStopForSilence({ heardSomething: false, msSinceActivity: 4000 })).toBe(false)
    expect(shouldStopForSilence({ heardSomething: false, msSinceActivity: 10000 })).toBe(true)
  })
  it('computes a level and skips the meter on Android', () => {
    expect(levelFromSamples(new Uint8Array(256).fill(128))).toBe(0)
    expect(levelFromSamples(new Uint8Array(256).map((_, i) => (i % 2 ? 255 : 0)))).toBe(1)
    expect(canOpenLevelMeter('Mozilla/5.0 (Linux; Android 14)')).toBe(false)
    expect(canOpenLevelMeter('Mozilla/5.0 (Windows NT 10.0)')).toBe(true)
  })
  it('server transcription stays off unless both the flag and a key are set', () => {
    expect(serverSttEnabled({})).toBe(false)
    expect(serverSttEnabled({ VOICE_SERVER_STT: 'on' })).toBe(false)
    expect(serverSttEnabled({ VOICE_STT_KEY: 'k' })).toBe(false)
    expect(serverSttEnabled({ VOICE_SERVER_STT: 'on', VOICE_STT_KEY: 'k' })).toBe(true)
  })
})
