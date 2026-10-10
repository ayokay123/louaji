import { getLocales } from "expo-localization";
import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import { ar } from "./locales/ar";
import { en } from "./locales/en";
import { fr } from "./locales/fr";

// Louaji is Arabic-first (RTL) with French and English. `ar` is both the
// default and the source-of-truth catalog; `fr`/`en` are typed against its
// shape so a missing key is a compile error. Direction handling (document
// `dir` on web, logical styling on native) lives in the root layout.

export const SUPPORTED_LOCALES = ["ar", "fr", "en"] as const;
export type AppLocale = (typeof SUPPORTED_LOCALES)[number];

export const DEFAULT_LOCALE: AppLocale = "ar";
const RTL_LOCALES: readonly AppLocale[] = ["ar"];

export function isRTL(locale: string): boolean {
  return (RTL_LOCALES as readonly string[]).includes(locale);
}

function isSupported(code: string | null | undefined): code is AppLocale {
  return !!code && (SUPPORTED_LOCALES as readonly string[]).includes(code);
}

function detectLocale(): AppLocale {
  const device = getLocales()[0]?.languageCode;
  return isSupported(device) ? device : DEFAULT_LOCALE;
}

// eslint-disable-next-line import/no-named-as-default-member -- i18n.use is i18next's chainable instance method, not the package's named `use` export
void i18n.use(initReactI18next).init({
  resources: {
    ar: { translation: ar },
    fr: { translation: fr },
    en: { translation: en },
  },
  lng: detectLocale(),
  fallbackLng: DEFAULT_LOCALE,
  interpolation: { escapeValue: false },
  returnNull: false,
});

export default i18n;
