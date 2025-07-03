import { translations } from '@/lib/translations';

/**
 * Development utility to check for missing translations
 * Only runs in development mode
 */
export function checkMissingTranslations() {
  if (process.env.NODE_ENV !== 'development') return;

  const msKeys = getAllKeys(translations.ms);
  const enKeys = getAllKeys(translations.en);

  const missingInMs = enKeys.filter((key) => !msKeys.includes(key));
  const missingInEn = msKeys.filter((key) => !enKeys.includes(key));

  if (missingInMs.length > 0) {
    console.warn('Missing Malay translations:', missingInMs);
  }

  if (missingInEn.length > 0) {
    console.warn('Missing English translations:', missingInEn);
  }

  if (missingInMs.length === 0 && missingInEn.length === 0) {
    console.log('✅ All translations are complete!');
  }
}

function getAllKeys(obj: any, prefix = ''): string[] {
  let keys: string[] = [];

  for (const key in obj) {
    const fullKey = prefix ? `${prefix}.${key}` : key;

    if (typeof obj[key] === 'object' && obj[key] !== null) {
      keys = keys.concat(getAllKeys(obj[key], fullKey));
    } else {
      keys.push(fullKey);
    }
  }

  return keys;
}

/**
 * Get translation statistics
 */
export function getTranslationStats() {
  const msKeys = getAllKeys(translations.ms);
  const enKeys = getAllKeys(translations.en);

  return {
    total: Math.max(msKeys.length, enKeys.length),
    malay: msKeys.length,
    english: enKeys.length,
    completeness:
      (Math.min(msKeys.length, enKeys.length) /
        Math.max(msKeys.length, enKeys.length)) *
      100,
  };
}

// Auto-check in development
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  setTimeout(() => {
    checkMissingTranslations();
    const stats = getTranslationStats();
    console.log('Translation stats:', stats);
  }, 1000);
}
