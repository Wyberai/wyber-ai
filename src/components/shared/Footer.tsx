'use client';
import { SignalFooter } from '@/components/signal/SignalFooter';
import { DEFAULT_LOCALE, type Locale } from '@/lib/i18n/locales';

// The site footer is the Signal footer. `locale` only matters on the locale-routed pages (about/build/use-cases/vs);
// every other caller gets the default, which localePath leaves unchanged. The wrapper scopes the Signal tokens to
// the footer alone, so the page above it keeps its own styling.
export function Footer({ locale = DEFAULT_LOCALE }: { locale?: Locale } = {}) {
  return (
    <div className="sg sg-inline" data-sg-theme="dark">
      <SignalFooter locale={locale} />
    </div>
  );
}
