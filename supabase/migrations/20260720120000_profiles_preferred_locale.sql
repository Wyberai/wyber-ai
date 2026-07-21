-- Persist the user's chosen in-app language so it follows them across
-- devices, not just the browser that set it. Nullable; a null preference
-- falls back to English in code, so this is safe to deploy before or after
-- the app code that reads/writes it. Values are the same locale codes used
-- client-side: en | hi | kn | te | ta (see src/lib/i18n/locales.ts).
alter table public.profiles add column if not exists preferred_locale text;
