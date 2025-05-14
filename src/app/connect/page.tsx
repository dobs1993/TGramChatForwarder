// App --> Connect --> page.tsx

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Phone, ArrowRight } from 'lucide-react';

export default function ConnectPage() {
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [serverStatus, setServerStatus] = useState('unknown');
  const router = useRouter();

  // Check if server is running when component loads
  useEffect(() => {
    const checkServer = async () => {
      try {
        const res = await fetch('http://localhost:5001/ping');
        if (res.ok) {
          console.log('Server is running');
          setServerStatus('online');
        } else {
          console.log('Server is not responding properly');
          setServerStatus('error');
        }
      } catch (err) {
        console.error('Server check failed:', err);
        setServerStatus('offline');
      }
    };

    checkServer();
  }, []);

  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Ensure phone number has + prefix
    const formattedPhone = phone.startsWith('+') ? phone : `+${phone}`;
    console.log(`Sending request with phone: ${formattedPhone}`);

    try {
      // First try a simple CORS preflight check
      const pingResponse = await fetch('http://localhost:5001/ping', {
        method: 'GET',
        mode: 'cors',
      });
      
      console.log('Ping response:', pingResponse.ok ? 'success' : 'failed');
      
      const res = await fetch('http://localhost:5001/send-code', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        // Don't use credentials for now to rule out CORS issues
        // credentials: 'include',
        mode: 'cors',
        body: JSON.stringify({ phone: formattedPhone }),
      });

      console.log('Response status:', res.status);
      console.log('Response headers:', [...res.headers.entries()]);
      
      const data = await res.json();
      console.log('Response data:', data);

      if (res.ok) {
        localStorage.setItem('telegramPhone', formattedPhone);
        router.push('/verify-code');
      } else {
        setError(data.error || 'An unexpected error occurred.');
      }
    } catch (err) {
      console.error('Connection error details:', err);
      setError(`Network error - Please check if the backend server is running. Details: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-2">
      <div className="tg-card p-6 space-y-6">
        <div className="text-center mb-2">
          <div className="bg-[var(--telegram-primary)]/10 p-3 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
            <Phone className="h-8 w-8 text-[var(--telegram-primary)]" />
          </div>
          
          <h1 className="text-xl font-bold mb-3 text-[var(--telegram-primary)]">
            Connect Telegram
          </h1>
          
          <p className="text-sm text-[var(--telegram-text-secondary)]">
            Enter your phone number including country code
          </p>
          
          {serverStatus === 'offline' && (
            <div className="mt-2 text-red-500 text-xs bg-red-50 p-2 rounded">
              Backend server appears to be offline. Make sure it's running at http://localhost:5001
            </div>
          )}
        </div>

        <form onSubmit={handleConnect} className="space-y-5">
          <div>
            <label className="block text-sm font-medium mb-1 text-[var(--telegram-text-secondary)]">
              Phone Number
            </label>
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+1 555 123 4567"
              className="tg-input"
              required
            />
            <p className="text-xs text-[var(--telegram-text-secondary)] mt-1">
              Enter with country code (e.g., +1, +44)
            </p>
          </div>
          
          <button
            type="submit"
            className={`tg-button w-full flex items-center justify-center ${
              loading ? 'opacity-70 cursor-not-allowed' : ''
            }`}
            disabled={loading || serverStatus === 'offline'}
          >
            <span>{loading ? 'Sending Code...' : 'Continue'}</span>
            {!loading && <ArrowRight size={16} className="ml-2" />}
          </button>
        </form>

        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">
            {error}
          </div>
        )}
        
        <p className="text-xs text-[var(--telegram-text-secondary)] text-center">
          We'll send a verification code to this number
        </p>
        
        <div className="text-xs text-center mt-2">
          <p className="text-gray-500">Debugging info:</p>
          <p>Server status: {serverStatus}</p>
          <button 
            onClick={() => window.open('http://localhost:5001/ping', '_blank')}
            className="text-[var(--telegram-primary)] underline"
          >
            Test server connection
          </button>
        </div>
      </div>
    </div>
  );
}