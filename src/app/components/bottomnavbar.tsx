'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Home, Link as LinkIcon, MessageSquare, Shield, Settings } from 'lucide-react';

export default function BottomNavbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [isSubscribed, setIsSubscribed] = useState(true); // Set default to true for now

  useEffect(() => {
    // Get subscription status from local storage
    const user = JSON.parse(localStorage.getItem('telegramUser') || '{}');
    setIsSubscribed(user?.is_subscribed ?? false);
  }, []);

  const navItems = [
    {
      label: 'Home',
      href: '/',
      icon: <Home size={20} strokeWidth={2} />,
    },
    {
      label: 'Connect',
      href: '/connect',
      icon: <Settings size={20} strokeWidth={2} />,
    },
    {
      label: 'Forwarder',
      href: '/dashboard-linker',
      icon: <MessageSquare size={20} strokeWidth={2} />,
      requiresSub: true,
    },
    {
      label: 'Links',
      href: '/dashboard-links',
      icon: <LinkIcon size={20} strokeWidth={2} />,
    },
    {
      label: 'Filters',
      href: '/filters',
      icon: <Shield size={20} strokeWidth={2} />,
      requiresSub: true,
    },
  ];

  return (
    <nav className="tg-nav">
      {navItems.map((item) => {
        if (item.requiresSub && !isSubscribed) return null;

        const isActive = pathname === item.href;

        return (
          <button
            key={item.href}
            onClick={() => router.push(item.href)}
            className={`tg-nav-item ${
              isActive ? 'tg-nav-item-active' : 'tg-nav-item-inactive'
            }`}
            aria-label={item.label}
          >
            {item.icon}
            <span className="mt-1">{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
}