'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';

export default function LegacyProfileRedirectPage() {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const match = pathname.match(/^\/(en|ms)\//);
    const locale = match ? match[1] : 'ms';
    router.replace(`/${locale}/account`);
  }, [router, pathname]);

  return null;
}

