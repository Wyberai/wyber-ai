import type { HomeStrings } from '@/lib/i18n/home-translations'

// Gujarati hero for the visitor-intent experiment. Applied as an override on
// top of the English strings (like the adaptive-hero segments), ONLY when the
// visitor picks Gujarati in the intent strip, so it never touches the shared
// Locale type or its dictionary-parity tests. Everything below the hero stays
// English for now; a full Gujarati homepage is a later phase.
//
// REVIEW STATUS: AI-drafted, NOT yet reviewed by a native Gujarati speaker.
// The experiment flag must stay off for real traffic until that happens.
// Mirrors the finalized spine: "Build any digital product. Ship it in minutes."
export const HERO_GU: Partial<HomeStrings> = {
  signIn: 'સાઇન ઇન',
  startFree: 'મફત શરૂ કરો →',
  eyebrowStrike: 'નો-કોડ',
  eyebrowMain: 'સૌથી સંપૂર્ણ AI બિલ્ડર',
  heroLine1: 'કોઈપણ ડિજિટલ પ્રોડક્ટ બનાવો.',
  heroLine2: 'મિનિટોમાં લાઇવ કરો.',
  heroLead: 'વેબ ઍપ, મોબાઇલ ઍપ, વેબસાઇટ કે પૂરું SaaS — એક વાર વર્ણવો. WyberAi તેને શરૂઆતથી બનાવે છે. જાતે સુધરતા બિલ્ડ, લાઇવ સિક્યોરિટી સ્કૅન અને દરેક કામ માટે યોગ્ય AI — આપમેળે.',
  heroPlaceholder: 'તમે શું બનાવવા માંગો છો તે લખો… જેમ કે મારા ડ્રાઇવરોની ડિલિવરીનો હિસાબ રાખતી ઍપ',
  targetWeb: 'વેબ ઍપ',
  targetMobile: 'મોબાઇલ',
  targetWebsite: 'વેબસાઇટ',
  targetSaas: 'SaaS',
  ctaBuild: 'બનાવો — મફતમાં →',
  watchDemo: 'ડેમો જુઓ',
  creditsLine: (price) => `30 મફત ક્રેડિટ · કાર્ડ જરૂરી નથી · ${price}/મહિનાથી શરૂ`,
  trustLine: 'US-રજિસ્ટર્ડ કંપની · SignalPulse Technologies, Wyoming',
  upiLine: 'UPI થી ચુકવણી કરો',
}
