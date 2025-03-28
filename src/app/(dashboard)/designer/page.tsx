'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function DesignerIndexPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to designer dashboard
    router.push('/designer/dashboard');
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <h2 className="text-lg font-medium text-gray-900">Redirecting...</h2>
        <p className="text-gray-500">Redirecting to Designer Dashboard...</p>
      </div>
    </div>
  );
} 