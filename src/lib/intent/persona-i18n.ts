import { PERSONAS } from './persona'
import type { Door } from './types'

// The headline, lead, example and closing call to action for each persona, in Hindi and Gujarati.
// AI-drafted and NOT yet reviewed by a native speaker: the page already tells visitors that its
// translations are automatic. Same rules as the English: no prices, no promises, nothing about where
// the company is based or who runs it.

export type PersonaCopy = {
  heroLine1: string; heroLine2: string; heroLead: string; heroPlaceholder: string
  finalCtaLine1: string; finalCtaLine2: string; finalCtaLead: string
}

export const PERSONA_I18N: Record<'hi' | 'gu', Partial<Record<Door, PersonaCopy>>> = {
  hi: {
    business: {
      heroLine1: 'जो आपके व्यवसाय को', heroLine2: 'धीमा करे, उसे ठीक करें।',
      heroLead: 'अपनी समस्या अपने शब्दों में बताइए। हम उसे हल करने वाला सॉफ़्टवेयर बनाते हैं, और वह आपका अपना होता है।',
      heroPlaceholder: 'जैसे: हमारे डिलीवरी की साइन की हुई कॉपी देर से लौटती है और पता नहीं चलता कौन-सी बाकी है',
      finalCtaLine1: 'अपने व्यवसाय की', finalCtaLine2: 'रुकावट हटाइए।',
      finalCtaLead: 'एक बार बताइए और पहला चलता-फिरता वर्ज़न देखिए। शुरू करना मुफ़्त, कार्ड नहीं चाहिए।',
    },
    software: {
      heroLine1: 'अपना आइडिया', heroLine2: 'असली ऐप बनाइए।',
      heroLead: 'बताइए आप क्या बनाना चाहते हैं। पहला चलता-फिरता वर्ज़न देखिए, फिर उसे अपने हिसाब से ढालिए।',
      heroPlaceholder: 'जैसे: एक मार्केटप्लेस जहाँ स्थानीय ट्यूटर क्लास डालें और विद्यार्थी बुक करें',
      finalCtaLine1: 'आपका आइडिया बस', finalCtaLine2: 'एक विवरण दूर है।',
      finalCtaLead: 'ऐप बताइए और उसे चलता देखिए। शुरू करना मुफ़्त, कार्ड नहीं चाहिए।',
    },
  },
  gu: {
    business: {
      heroLine1: 'જે તમારા વ્યવસાયને', heroLine2: 'ધીમો કરે તે ઠીક કરો.',
      heroLead: 'તમારી સમસ્યા તમારા શબ્દોમાં કહો. અમે તેને ઉકેલે તેવું સૉફ્ટવેર બનાવીએ છીએ, અને તે તમારું પોતાનું હોય છે.',
      heroPlaceholder: 'દા.ત. અમારા ડિલિવરીની સહી કરેલી નકલ મોડી આવે છે અને ખબર નથી કઈ બાકી છે',
      finalCtaLine1: 'તમારા વ્યવસાયની', finalCtaLine2: 'અડચણ દૂર કરો.',
      finalCtaLead: 'એક વાર કહો અને પહેલું ચાલતું વર્ઝન જુઓ. શરૂ કરવું મફત, કાર્ડ નહીં.',
    },
    software: {
      heroLine1: 'તમારો વિચાર', heroLine2: 'સાચી એપ બનાવો.',
      heroLead: 'તમે શું બનાવવા માંગો છો તે કહો. પહેલું ચાલતું વર્ઝન જુઓ, પછી તેને તમારા હિસાબે ઢાળો.',
      heroPlaceholder: 'દા.ત. એક માર્કેટપ્લેસ જ્યાં સ્થાનિક ટ્યુટર ક્લાસ મૂકે અને વિદ્યાર્થી બુક કરે',
      finalCtaLine1: 'તમારો વિચાર ફક્ત', finalCtaLine2: 'એક વર્ણન દૂર છે.',
      finalCtaLead: 'એપ વર્ણવો અને તેને ચાલતી જુઓ. શરૂ કરવું મફત, કાર્ડ નહીં.',
    },
  },
}

/** The copy to overlay for a persona in a language, or null when the page keeps its own text ("Just scrolling", or a language we have no copy for). */
export function personaCopy(door: Door, lang: 'en' | 'hi' | 'gu'): PersonaCopy | null {
  if (lang === 'en') {
    const p = PERSONAS[door]
    return p.hero && p.finalCta ? { ...p.hero, ...p.finalCta } : null
  }
  return PERSONA_I18N[lang][door] ?? null
}
