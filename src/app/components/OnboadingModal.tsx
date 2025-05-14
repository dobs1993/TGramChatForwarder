'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Shield, Check } from 'lucide-react';

export default function OnboardingModal() {
  const [show, setShow] = useState(false);
  const [dontShowAgain, setDontShowAgain] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const hideModal = localStorage.getItem('hideOnboardingModal');
    if (!hideModal) setShow(true);
  }, []);

  const handleContinue = () => {
    if (dontShowAgain) {
      localStorage.setItem('hideOnboardingModal', 'true');
    }
    setShow(false);
    router.push('/connect');
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="tg-card p-6 max-w-sm w-full shadow-lg animated fadeInUp">
        <div className="text-center mb-6">
          <div className="bg-[var(--telegram-primary)]/10 p-3 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
            <Shield className="h-8 w-8 text-[var(--telegram-primary)]" />
          </div>
          
          <h2 className="text-xl font-bold mb-2 text-[var(--telegram-primary)]">
            Welcome to Telegram Forwarder
          </h2>
          
          <p className="text-sm text-[var(--telegram-text-secondary)]">
            Securely connect your Telegram account to manage message forwarding
          </p>
        </div>
        
        <div className="bg-[var(--telegram-primary)]/5 p-4 rounded-lg mb-5">
          <h3 className="font-medium text-sm mb-2">Our Privacy Commitments:</h3>
          <ul className="text-sm space-y-2">
            <li className="flex items-start">
              <Check size={16} className="text-[var(--telegram-primary)] mt-0.5 mr-2 flex-shrink-0" />
              <span>We never store or read your message content</span>
            </li>
            <li className="flex items-start">
              <Check size={16} className="text-[var(--telegram-primary)] mt-0.5 mr-2 flex-shrink-0" />
              <span>Your authentication data is securely stored</span>
            </li>
            <li className="flex items-start">
              <Check size={16} className="text-[var(--telegram-primary)] mt-0.5 mr-2 flex-shrink-0" />
              <span>You can revoke access at any time</span>
            </li>
          </ul>
        </div>
        
        <div className="flex items-center mb-5">
          <input
            type="checkbox"
            id="dontShowAgain"
            checked={dontShowAgain}
            onChange={() => setDontShowAgain(!dontShowAgain)}
            className="mr-2 h-4 w-4 accent-[var(--telegram-primary)]"
          />
          <label htmlFor="dontShowAgain" className="text-sm text-[var(--telegram-text-secondary)]">
            Don't show this message again
          </label>
        </div>
        
        <button
          onClick={handleContinue}
          className="tg-button w-full"
        >
          Get Started
        </button>
      </div>
    </div>
  );
}