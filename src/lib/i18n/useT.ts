'use client';
import { useLocale } from './LocaleProvider';

type Dict = Record<string, Record<string, string>>;

// Generic translation hook — pass any namespace dictionary shaped like
// Record<Locale, Record<string,string>> (see dict/common.ts for the shape).
// Falls back per-key: current locale -> English -> the raw key itself, so a
// missing/partial translation never renders blank.
export function useT<D extends Dict>(dict: D) {
  const { locale } = useLocale();
  return (key: keyof D['en'] & string): string => dict[locale]?.[key] ?? dict.en[key] ?? key;
}
