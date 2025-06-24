'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AIHelperPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to recipes page since AI helper is disabled
    router.push('/recipes');
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="mb-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto loading-spinner"></div>
        </div>
        <div className="text-lg">Redirecting...</div>
      </div>
    </div>
  );
}