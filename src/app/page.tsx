'use client';

import Link from 'next/link';
import OnboardingModal from './components/OnboadingModal';
import { MessageSquare, Link as LinkIcon, Shield, Settings } from 'lucide-react';

export default function HomePage() {
  return (
    <>
      <OnboardingModal />
      <main className="py-6 space-y-6">
        <div className="text-center space-y-3 mb-6">
          <h1 className="text-2xl font-bold text-[var(--telegram-primary)]">Telegram Forwarder</h1>
          <p className="text-sm text-[var(--telegram-text-secondary)]">
            Securely forward messages between your chats
          </p>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <Link
            href="/connect"
            className="tg-card p-5 flex flex-col items-center text-center"
          >
            <div className="bg-[var(--telegram-primary)]/10 p-3 rounded-full mb-3">
              <Settings className="h-6 w-6 text-[var(--telegram-primary)]" />
            </div>
            <h3 className="font-medium mb-1">Connect Account</h3>
            <p className="text-sm text-[var(--telegram-text-secondary)]">Link your Telegram account</p>
          </Link>
          
          <Link
            href="/dashboard-linker"
            className="tg-card p-5 flex flex-col items-center text-center"
          >
            <div className="bg-[var(--telegram-primary)]/10 p-3 rounded-full mb-3">
              <MessageSquare className="h-6 w-6 text-[var(--telegram-primary)]" />
            </div>
            <h3 className="font-medium mb-1">Chat Forwarder</h3>
            <p className="text-sm text-[var(--telegram-text-secondary)]">Set up message forwarding</p>
          </Link>
          
          <Link
            href="/dashboard-links"
            className="tg-card p-5 flex flex-col items-center text-center"
          >
            <div className="bg-[var(--telegram-primary)]/10 p-3 rounded-full mb-3">
              <LinkIcon className="h-6 w-6 text-[var(--telegram-primary)]" />
            </div>
            <h3 className="font-medium mb-1">Active Links</h3>
            <p className="text-sm text-[var(--telegram-text-secondary)]">Manage forwarding rules</p>
          </Link>
          
          <Link
            href="/filters"
            className="tg-card p-5 flex flex-col items-center text-center"
          >
            <div className="bg-[var(--telegram-primary)]/10 p-3 rounded-full mb-3">
              <Shield className="h-6 w-6 text-[var(--telegram-primary)]" />
            </div>
            <h3 className="font-medium mb-1">Message Filters</h3>
            <p className="text-sm text-[var(--telegram-text-secondary)]">Configure filtering rules</p>
          </Link>
        </div>
        
        <div className="mt-8 text-center">
          <Link href="/subscribe" className="tg-button inline-block">
            Upgrade to Premium
          </Link>
          <p className="mt-2 text-xs text-[var(--telegram-text-secondary)]">
            Get access to advanced features
          </p>
        </div>
      </main>
    </>
  );
}