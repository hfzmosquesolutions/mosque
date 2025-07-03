import { useLanguage } from '@/contexts/LanguageContext';

/**
 * Convenient hook for using translations throughout the app
 * Usage: const t = useTranslation();
 */
export function useTranslation() {
  const { t } = useLanguage();
  return t;
}

/**
 * Utility function to format currency based on current language
 */
export function useCurrency() {
  const { language } = useLanguage();

  return (amount: number) => {
    if (language === 'ms') {
      return new Intl.NumberFormat('ms-MY', {
        style: 'currency',
        currency: 'MYR',
      }).format(amount);
    } else {
      return new Intl.NumberFormat('en-MY', {
        style: 'currency',
        currency: 'MYR',
      }).format(amount);
    }
  };
}

/**
 * Utility function to format dates based on current language
 */
export function useDate() {
  const { language } = useLanguage();

  return (date: Date | string) => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;

    if (language === 'ms') {
      return dateObj.toLocaleDateString('ms-MY', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } else {
      return dateObj.toLocaleDateString('en-MY', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    }
  };
}

/**
 * Utility function to get greeting based on time and language
 */
export function useGreeting() {
  const { t, language } = useLanguage();

  return (name?: string) => {
    const hour = new Date().getHours();
    let greetingKey: string;

    if (hour < 12) {
      greetingKey = language === 'ms' ? 'Selamat Pagi' : 'Good Morning';
    } else if (hour < 18) {
      greetingKey = language === 'ms' ? 'Selamat Tengahari' : 'Good Afternoon';
    } else {
      greetingKey = language === 'ms' ? 'Selamat Petang' : 'Good Evening';
    }

    return name ? `${greetingKey}, ${name}!` : greetingKey;
  };
}
