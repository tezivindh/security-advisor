'use client';

import { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuthStore } from '@/store/auth.store';

function CallbackContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { setToken, fetchMe } = useAuthStore();

  useEffect(() => {
    const token = searchParams.get('token');
    if (token) {
      setToken(token);
      fetchMe().then(() => {
        router.replace('/dashboard');
      });
    } else {
      router.replace('/?error=auth_failed');
    }
  }, [searchParams, setToken, fetchMe, router]);

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
      <div className="text-center">
        <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin mx-auto mb-4" />
        <p className="text-white/60 text-sm">Authenticating with GitHub...</p>
      </div>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin" />
      </div>
    }>
      <CallbackContent />
    </Suspense>
  );
}
