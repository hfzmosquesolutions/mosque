import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { LanguageProvider } from '@/contexts/LanguageContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { AuthProvider } from '@/contexts/AuthContext.v2';
import { ProfileGuard } from '@/components/guards/ProfileGuard';
import { ClientOnly } from '@/components/layout/ClientOnly';
import { Toaster } from '@/components/ui/sonner';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Sistem Pengurusan Masjid Digital',
  description: 'Sistem pengurusan masjid digital yang komprehensif',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ms">
      <body className={inter.className}>
        <ThemeProvider>
          <LanguageProvider>
            <ClientOnly fallback={<div>Loading...</div>}>
              <AuthProvider>
                <ProfileGuard>
                  {children}
                  <Toaster />
                </ProfileGuard>
              </AuthProvider>
            </ClientOnly>
          </LanguageProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
