'use client'
import { useLocale } from '@/lib/i18n/LocaleProvider'

/**
 * English visitors get the Signal homepage. Visitors who chose another language keep the existing homepage,
 * because its Hindi, Gujarati, Kannada, Telugu and Tamil strings have not been carried over yet.
 * The server always renders English first, so there is no layout shift for the common case.
 */
export function HomeSwitch({ signal, legacy }: { signal: React.ReactNode; legacy: React.ReactNode }) {
  const { locale } = useLocale()
  return <>{locale === 'en' ? signal : legacy}</>
}
