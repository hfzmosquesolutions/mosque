'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function MosquePage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/public/mosques');
  }, [router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Redirecting to mosque directory...</p>
      </div>
    </div>
  );
}
