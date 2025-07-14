import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Masjid Digital',
  description: 'Services and community information',
};

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="public-layout">{children}</div>;
}
