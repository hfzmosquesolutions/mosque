import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Maintenance',
  robots: { index: false, follow: false }
};

type PageProps = {
  params: { locale: string }
};

export default function MaintenancePage({ params }: PageProps) {
  const { locale } = params;
  const isMs = locale === 'ms';

  const title = isMs ? 'Penyelenggaraan Sementara' : 'Temporary Maintenance';
  const description = isMs
    ? 'Maaf, laman ini sedang dalam penyelenggaraan. Sila kembali kemudian.'
    : 'Sorry, the site is currently under maintenance. Please check back later.';

  return (
    <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
      <div style={{ maxWidth: 640, textAlign: 'center' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '0.75rem' }}>{title}</h1>
        <p style={{ color: '#6b7280', marginBottom: '1.5rem' }}>{description}</p>
      </div>
    </div>
  );
}


