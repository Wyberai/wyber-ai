'use client';
import { Navbar } from './Navbar';
import type { Locale } from '@/lib/i18n/locales';
export function NavbarClient({ user, locale }: { user?: { email?: string } | null; locale?: Locale }) {
  return <Navbar user={user} locale={locale} />;
}
