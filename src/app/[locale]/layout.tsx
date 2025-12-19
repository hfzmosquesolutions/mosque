import type { Metadata } from 'next';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
// Removed Toaster import; Toaster is handled in RootLayout
// Removed AuthProvider import; provider is in RootLayout
import Header from '@/components/layout/Header';
import '../globals.css';

export const metadata: Metadata = {
  title: 'khairatkita - Connect with Your Local Mosque',
  description:
    'Discover mosques in your area, stay updated with events, and strengthen your connection with the community.',
};

type Props = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

export default async function LocaleLayout({ children, params }: Props) {
  const { locale } = await params;
  // Providing all messages to the client side is the easiest way to get started
  const messages = await getMessages({ locale });

  return (
    <NextIntlClientProvider messages={messages}>
      <Header />
      {children}
    </NextIntlClientProvider>
  );
}
