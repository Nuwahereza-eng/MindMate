// This hook is kept for compatibility if deep components need it,
// but prefer using `const { t } = useLocalization()` for translations.
"use client";

import { useLocalization } from '@/context/LocalizationContext';

/**
 * @deprecated Prefer using `const { t } = useLocalization()`
 */
export const useTranslations = () => {
  const { translations, t } = useLocalization();
  // The main `t` function is now part of useLocalization, 
  // so this hook can just re-export it or be removed.
  // For simplicity, we'll keep it as a wrapper.
  return { translations, t };
};
