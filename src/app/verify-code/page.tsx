// App --> verify-code --> page.tsx

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ShieldCheck, ArrowRight } from 'lucide-react';

export default function VerifyCodePage() {
  const router = useRouter();
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const storedPhone = localStorage.getItem('telegramPhone');
    if (!storedPhone) {
      router.push('/connect');
    } else {
      setPhone(storedPhone);
    }
  }, [router]);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('http://localhost:5001/verify-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ phone, code }),
      });

      const data = await res.json();

      if (res.ok) {
        // Set cookie instead of localStorage so middleware can access it
        document.cookie = "telegramVerified=true; path=/";
        router.push('/dashboard-links');
      } else {
        setError(data.error || 'An unexpected error occurred.');
      }
    } catch (err) {
      console.error('Verification error:', err);
      setError('Network error - Please check if the backend server is running');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-2">
      <div className="tg-card p-6 space-y-6">
        <div className="text-center mb-2">
          <div className="bg-[var(--telegram-primary)]/10 p-3 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
            <ShieldCheck className="h-8 w-8 text-[var(--telegram-primary)]" />
          </div>
          
          <h1 className="text-xl font-bold mb-3 text-[var(--telegram-primary)]">
            Verification Code
          </h1>
          
          <p className="text-sm text-[var(--telegram-text-secondary)]">
            Enter the code sent to your Telegram account
          </p>
        </div>

        <form onSubmit={handleVerify} className="space-y-5">
          <div>
            <label className="block text-sm font-medium mb-1 text-[var(--telegram-text-secondary)]">
              Phone Number
            </label>
            <input
              type="text"
              value={phone}
              disabled
              className="tg-input bg-gray-100/50 text-[var(--telegram-text-secondary)]"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1 text-[var(--telegram-text-secondary)]">
              Verification Code
            </label>
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Enter code"
              className="tg-input"
              required
            />
            <p className="text-xs text-[var(--telegram-text-secondary)] mt-1">
              Check Telegram for your verification code
            </p>
          </div>
          
          <button
            type="submit"
            className={`tg-button w-full flex items-center justify-center ${
              loading ? 'opacity-70 cursor-not-allowed' : ''
            }`}
            disabled={loading}
          >
            <span>{loading ? 'Verifying...' : 'Verify & Continue'}</span>
            {!loading && <ArrowRight size={16} className="ml-2" />}
          </button>
        </form>

        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">
            {error}
          </div>
        )}
      </div>
    </div>
  );
}