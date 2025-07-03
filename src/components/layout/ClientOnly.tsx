'use client';

import { useEffect, useState, ReactNode } from 'react';

interface ClientOnlyProps {
  children: ReactNode;
  fallback?: ReactNode;
}

/**
 * ClientOnly component ensures children are only rendered on the client side
 * This prevents hydration mismatches when using localStorage or other browser APIs
 */
export function ClientOnly({ children, fallback = null }: ClientOnlyProps) {
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  // Show fallback during SSR and initial hydration
  if (!hasMounted) {
    return <>{fallback}</>;
  }

  // Once mounted, render children
  return <>{children}</>;
}
