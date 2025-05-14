'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Select from 'react-select';
import { MessageSquare, Link, ArrowRight, PlusCircle } from 'lucide-react';

// Define types
type Chat = {
  id: number;
  name: string;
  type: string;
};

type Option = {
  value: string;
  label: string;
  type?: string;
};

export default function DashboardLinkerPage() {
  const [chats, setChats] = useState<Chat[]>([]);
  const [source, setSource] = useState<Option | null>(null);
  const [dest, setDest] = useState<Option | null>(null);
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('telegramUser') || '{}');
    if (!user?.is_subscribed) {
      router.push('/subscribe');
      return;
    }

    const fetchChats = async () => {
      setLoading(true);
      const phone = localStorage.getItem('telegramPhone');
      if (!phone) {
        setError('No phone number found. Please connect first.');
        setLoading(false);
        return;
      }

      try {
        const res = await fetch('http://localhost:5001/get-chats', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ phone }),
        });

        const data = await res.json();

        if (Array.isArray(data)) {
          const cleaned = data
            .filter((chat) => chat.name && chat.name.trim() !== '')
            .sort((a, b) => a.name.localeCompare(b.name));

          setChats(cleaned);
          setError('');

          const chatMap = Object.fromEntries(
            cleaned.map((chat) => [chat.id, chat.name])
          );
          localStorage.setItem('chatNameMap', JSON.stringify(chatMap));
        } else {
          setError(data.error || 'Unexpected error');
        }
      } catch (e) {
        console.error('Error fetching chats:', e);
        setError('Failed to load chats. Is the backend server running?');
      } finally {
        setLoading(false);
      }
    };

    fetchChats();
  }, [router]);

  const chatOptions: Option[] = chats.map((chat) => ({
    value: chat.id.toString(),
    label: chat.name,
    type: chat.type
  }));

  const handleLink = async () => {
    if (!source || !dest) {
      setError('Please select both source and destination chats');
      return;
    }
    
    if (source.value === dest.value) {
      setError('Source and destination cannot be the same');
      return;
    }
    
    setSubmitting(true);
    setError('');
    
    try {
      const phone = localStorage.getItem('telegramPhone');
      const res = await fetch('http://localhost:5001/set-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          phone,
          source_id: source.value,
          destination_id: dest.value,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setStatus(`Link created successfully`);
        setSource(null);
        setDest(null);
        setTimeout(() => setStatus(''), 5000);
      } else {
        setError(data.error || 'Failed to create link');
      }
    } catch (e) {
      console.error('Error creating link:', e);
      setError('Network error - Please check if the backend server is running');
    } finally {
      setSubmitting(false);
    }
  };

  const customStyles = {
    control: (base: any) => ({
      ...base,
      borderColor: '#d9d9d9',
      boxShadow: 'none',
      '&:hover': {
        borderColor: '#d9d9d9',
      },
      '&:focus': {
        borderColor: '#38B0E3',
        boxShadow: '0 0 0 1px #38B0E3',
      },
    }),
    option: (base: any, state: any) => ({
      ...base,
      backgroundColor: state.isSelected ? '#0088CC' : state.isFocused ? '#E1F5FE' : 'white',
      color: state.isSelected ? 'white' : '#000000',
    }),
  };

  return (
    <div className="p-2">
      <div className="tg-card p-5 space-y-5">
        <div className="flex items-center justify-between mb-1">
          <h1 className="text-xl font-bold text-[var(--telegram-primary)]">Create Forwarding Rule</h1>
          <Link className="text-[var(--telegram-primary)]" size={20} />
        </div>
        
        <p className="text-sm text-[var(--telegram-text-secondary)]">
          Select source and destination chats to create a forwarding rule
        </p>

        {loading ? (
          <div className="text-center py-10">
            <div className="inline-block p-3 bg-[var(--telegram-primary)]/10 rounded-full animate-pulse">
              <MessageSquare size={24} className="text-[var(--telegram-primary)]" />
            </div>
            <p className="mt-3 text-[var(--telegram-text-secondary)]">Loading your chats...</p>
          </div>
        ) : (
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-medium mb-2 flex items-center">
                <MessageSquare size={16} className="mr-2 text-[var(--telegram-primary)]" />
                Source Chat
              </label>
              <Select
                options={chatOptions}
                value={source}
                onChange={(selected) => setSource(selected)}
                placeholder="Select source chat..."
                isSearchable
                styles={customStyles}
                className="tg-select"
                formatOptionLabel={(option: Option) => (
                  <div className="flex justify-between items-center">
                    <span>{option.label}</span>
                    {option.type && (
                      <span className="text-xs bg-gray-100 px-2 py-0.5 rounded-full text-gray-600">
                        {option.type}
                      </span>
                    )}
                  </div>
                )}
              />
              <p className="text-xs text-[var(--telegram-text-secondary)] mt-1">
                Messages from this chat will be forwarded
              </p>
            </div>
            
            <div className="flex justify-center my-1">
              <div className="bg-[var(--telegram-primary)]/10 p-2 rounded-full">
                <ArrowRight className="h-5 w-5 text-[var(--telegram-primary)]" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 flex items-center">
                <MessageSquare size={16} className="mr-2 text-[var(--telegram-primary)]" />
                Destination Chat
              </label>
              <Select
                options={chatOptions}
                value={dest}
                onChange={(selected) => setDest(selected)}
                placeholder="Select destination chat..."
                isSearchable
                styles={customStyles}
                className="tg-select"
                formatOptionLabel={(option: Option) => (
                  <div className="flex justify-between items-center">
                    <span>{option.label}</span>
                    {option.type && (
                      <span className="text-xs bg-gray-100 px-2 py-0.5 rounded-full text-gray-600">
                        {option.type}
                      </span>
                    )}
                  </div>
                )}
              />
              <p className="text-xs text-[var(--telegram-text-secondary)] mt-1">
                Messages will be forwarded to this chat
              </p>
            </div>

            <button
              className={`tg-button w-full flex items-center justify-center ${
                submitting ? 'opacity-70 cursor-not-allowed' : ''
              }`}
              onClick={handleLink}
              disabled={submitting || !source || !dest}
            >
              <PlusCircle size={18} className="mr-2" />
              <span>{submitting ? 'Creating Link...' : 'Create Link'}</span>
            </button>

            {error && (
              <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">
                {error}
              </div>
            )}
            
            {status && (
              <div className="bg-green-50 text-green-600 p-3 rounded-lg text-sm flex items-center">
                <div className="bg-green-100 rounded-full p-1 mr-2">
                  <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    className="h-4 w-4"
                    fill="none" 
                    viewBox="0 0 24 24" 
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                {status}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}