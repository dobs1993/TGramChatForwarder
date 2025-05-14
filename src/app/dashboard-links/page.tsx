'use client';

import { useEffect, useState } from 'react';
import { ArrowRight, Trash2, RefreshCw } from 'lucide-react';

type LinkItem = {
  source_id: string;
  destination_id: string;
  source_name: string;
  destination_name: string;
};

export default function DashboardLinks() {
  const [links, setLinks] = useState<LinkItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchLinks = async () => {
    setLoading(true);
    setError('');
    try {
      const phone = localStorage.getItem('telegramPhone');
      if (!phone) throw new Error('Phone number not found. Please reconnect.');

      const res = await fetch('http://localhost:5001/get-links', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to fetch links');
      }

      const data = await res.json();
      setLinks(data);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchLinks();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchLinks();
  };

  const handleDelete = async (sourceId: string, destId: string) => {
    const linkId = `${sourceId}-${destId}`;
    setDeleteLoading(linkId);
    try {
      const res = await fetch('http://localhost:5001/delete-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          source_id: sourceId,
          destination_id: destId,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to delete link');
      }

      // Remove deleted link from state
      setLinks((current) =>
        current.filter(
          (link) =>
            !(link.source_id === sourceId && link.destination_id === destId)
        )
      );
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setDeleteLoading(null);
    }
  };

  return (
    <div className="p-2">
      <div className="tg-card p-5">
        <div className="flex justify-between items-center mb-5">
          <h1 className="text-xl font-bold text-[var(--telegram-primary)]">Active Links</h1>
          <button 
            className="bg-[var(--telegram-primary)]/10 p-2 rounded-full text-[var(--telegram-primary)]"
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <RefreshCw size={18} className={`${refreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
        
        {loading ? (
          <div className="text-center py-10">
            <div className="inline-block p-2 bg-[var(--telegram-primary)]/10 rounded-full animate-pulse">
              <RefreshCw size={24} className="text-[var(--telegram-primary)] animate-spin" />
            </div>
            <p className="mt-3 text-[var(--telegram-text-secondary)]">Loading forwarding links...</p>
          </div>
        ) : error ? (
          <div className="bg-red-50 text-red-600 p-4 rounded-lg">
            <p>{error}</p>
            <button 
              onClick={fetchLinks}
              className="text-sm font-medium text-[var(--telegram-primary)] mt-2"
            >
              Try Again
            </button>
          </div>
        ) : links.length === 0 ? (
          <div className="text-center py-8 bg-gray-50 rounded-lg border border-gray-100">
            <p className="text-[var(--telegram-text-secondary)]">No active forwarding links found</p>
            <button 
              onClick={() => window.location.href = '/dashboard-linker'}
              className="tg-button mt-3"
            >
              Create Link
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {links.map((link) => (
              <div 
                key={`${link.source_id}-${link.destination_id}`}
                className="p-4 border border-gray-100 rounded-lg hover:shadow-sm transition"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate" title={link.source_name}>
                      {link.source_name}
                    </p>
                    <p className="text-xs text-[var(--telegram-text-secondary)]">
                      ID: {link.source_id}
                    </p>
                  </div>
                  
                  <div className="px-3">
                    <ArrowRight className="h-5 w-5 text-[var(--telegram-primary)]" />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate" title={link.destination_name}>
                      {link.destination_name}
                    </p>
                    <p className="text-xs text-[var(--telegram-text-secondary)]">
                      ID: {link.destination_id}
                    </p>
                  </div>
                  
                  <button
                    onClick={() => handleDelete(link.source_id, link.destination_id)}
                    disabled={deleteLoading === `${link.source_id}-${link.destination_id}`}
                    className="ml-2 p-2 text-red-500 hover:bg-red-50 rounded-full transition-colors"
                    aria-label="Delete Link"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}