// App --> Forwarder --> ChatSelector.tsx

'use client';

import { MessageSquare, ArrowRight } from 'lucide-react';

type Props = {
  source: string;
  destination: string;
  setSource: (value: string) => void;
  setDestination: (value: string) => void;
};

export default function ChatSelector({ source, destination, setSource, setDestination }: Props) {
  return (
    <div className="space-y-5 p-4 tg-card">
      <h3 className="font-medium text-[var(--telegram-primary)] mb-4">Configure Chat Forwarding</h3>
      
      <div>
        <label className="block font-medium text-sm mb-2 flex items-center">
          <MessageSquare size={16} className="mr-2 text-[var(--telegram-primary)]" />
          Source Chat
        </label>
        <input
          type="text"
          className="tg-input"
          placeholder="Enter Source Chat ID"
          value={source}
          onChange={(e) => setSource(e.target.value)}
        />
        <p className="text-xs text-[var(--telegram-text-secondary)] mt-1">
          Messages from this chat will be forwarded
        </p>
      </div>
      
      <div className="flex justify-center my-2">
        <div className="bg-[var(--telegram-primary)]/10 p-2 rounded-full">
          <ArrowRight className="h-5 w-5 text-[var(--telegram-primary)]" />
        </div>
      </div>
      
      <div>
        <label className="block font-medium text-sm mb-2 flex items-center">
          <MessageSquare size={16} className="mr-2 text-[var(--telegram-primary)]" />
          Destination Chat
        </label>
        <input
          type="text"
          className="tg-input"
          placeholder="Enter Destination Chat ID"
          value={destination}
          onChange={(e) => setDestination(e.target.value)}
        />
        <p className="text-xs text-[var(--telegram-text-secondary)] mt-1">
          Messages will be forwarded to this chat
        </p>
      </div>
    </div>
  );
}