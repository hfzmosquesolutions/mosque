# Language Support System

## Overview

This mosque management system now supports both **Bahasa Melayu (BM)** and **English (EN)** with Malay as the default language.

## Features

- 🇲🇾 **Default Language**: Bahasa Melayu
- 🌐 **Language Switcher**: Easy toggle between BM and EN
- 💾 **Persistent Settings**: Language preference saved in localStorage
- 🔄 **Dynamic Content**: All UI text updates instantly when switching languages
- 📱 **Mobile Friendly**: Language switcher works on all screen sizes

## How to Use

### For Users

1. **Language Switcher**: Click the language dropdown in the top-right corner
2. **Options Available**:
   - 🇲🇾 BM (Bahasa Melayu) - Default
   - 🇺🇸 EN (English)
3. **Automatic Save**: Your language preference is remembered for future visits

### For Developers

#### Using Translations in Components

```tsx
import { useTranslation } from '@/hooks/useTranslation';

function MyComponent() {
  const t = useTranslation();

  return (
    <div>
      <h1>{t('dashboard.title')}</h1>
      <p>{t('common.loading')}</p>
    </div>
  );
}
```

#### Using Utility Hooks

```tsx
import { useCurrency, useDate, useGreeting } from '@/hooks/useTranslation';

function MyComponent({ user, amount, date }) {
  const formatCurrency = useCurrency();
  const formatDate = useDate();
  const getGreeting = useGreeting();

  return (
    <div>
      <h1>{getGreeting(user.name)}</h1>
      <p>Amount: {formatCurrency(amount)}</p>
      <p>Date: {formatDate(date)}</p>
    </div>
  );
}
```

#### Adding New Translations

1. **Update Translation Files**: Add new keys to `/src/lib/translations.ts`

```typescript
export const ms = {
  newSection: {
    newKey: 'Teks Bahasa Melayu',
    anotherKey: 'Teks lain',
  },
};

export const en = {
  newSection: {
    newKey: 'English Text',
    anotherKey: 'Another text',
  },
};
```

2. **Use in Components**:

```tsx
const text = t('newSection.newKey');
```

## Translation Structure

### Available Translation Keys

#### Navigation

- `navigation.dashboard` - Dashboard
- `navigation.members` - Members/Ahli Kariah
- `navigation.finance` - Finance/Kewangan
- `navigation.khairat` - Khairat
- `navigation.zakat` - Zakat
- `navigation.reports` - Reports/Laporan
- `navigation.logout` - Logout/Log Keluar

#### Common Terms

- `common.loading` - Loading.../Memuat...
- `common.save` - Save/Simpan
- `common.cancel` - Cancel/Batal
- `common.edit` - Edit
- `common.delete` - Delete/Padam
- `common.add` - Add/Tambah

#### Authentication

- `auth.login` - Login/Log Masuk
- `auth.email` - Email/E-mel
- `auth.password` - Password/Kata Laluan
- `auth.welcome` - Welcome/Selamat Datang

#### Dashboard

- `dashboard.title` - Dashboard/Papan Pemuka
- `dashboard.totalMembers` - Total Members/Jumlah Ahli
- `dashboard.monthlyIncome` - Monthly Income/Pendapatan Bulanan

#### User Roles

- `roles.super_admin` - Super Admin
- `roles.mosque_admin` - Mosque Admin/Admin Masjid
- `roles.ajk` - Committee Member/Ahli Jawatankuasa
- `roles.member` - Member/Ahli Kariah

## File Structure

```
src/
├── lib/
│   └── translations.ts          # Translation definitions
├── contexts/
│   └── LanguageContext.tsx      # Language context provider
├── hooks/
│   └── useTranslation.ts        # Translation utility hooks
└── components/
    └── ui/
        └── LanguageSwitcher.tsx  # Language switcher component
```

## Implementation Details

### Language Context

- Manages current language state
- Provides translation function `t()`
- Handles localStorage persistence
- Supports nested translation keys (e.g., `navigation.dashboard`)

### Utility Hooks

- **useTranslation()**: Simple access to `t()` function
- **useCurrency()**: Format currency based on current language
- **useDate()**: Format dates based on current language
- **useGreeting()**: Get time-appropriate greeting

### Fallback System

- If a translation key is not found in the current language, it falls back to English
- If not found in English either, returns the key itself
- Console warnings for missing translation keys in development

## Best Practices

1. **Consistent Keys**: Use descriptive, hierarchical keys (e.g., `section.subsection.item`)
2. **Complete Coverage**: Always provide both BM and EN translations
3. **Context**: Group related translations under logical sections
4. **Utility Hooks**: Use provided hooks for currency, dates, and greetings
5. **Testing**: Test UI in both languages to ensure proper layout

## Future Enhancements

- 🌍 Additional language support (Arabic, Chinese, etc.)
- 📊 Usage analytics for language preferences
- 🎯 Context-aware translations
- 🔄 Auto-detection based on browser locale
- 📝 Translation management interface for admins
