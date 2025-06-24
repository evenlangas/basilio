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
    <div className="min-h-screen flex items-center justify-center" style={{backgroundColor: 'var(--color-bg-primary)'}}>
      <div className="text-center">
        <div className="skeleton w-16 h-16 rounded-full mb-4 mx-auto" />
        <div className="skeleton h-6 w-32 mx-auto" />
      </div>
    </div>
  );
}