// App --> layout.tsx

import './globals.css'
import BottomNavbar from './components/bottomnavbar'
import Image from 'next/image'

export const metadata = {
  title: 'Telegram Forwarder',
  description: 'Securely manage your Telegram message forwarding',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full">
      <body className="flex flex-col h-full overflow-hidden bg-[var(--background)] text-[var(--foreground)] font-sans relative">
        {/* Header with Telegram styling */}
        <header className="bg-[var(--telegram-primary)] text-white py-3 px-4 flex items-center">
          <div className="flex items-center space-x-2">
            <div className="h-8 w-8 relative flex-shrink-0">
              <Image 
                src="/next.svg" 
                alt="Telegram Forwarder" 
                fill
                className="object-contain brightness-0 invert"
                priority
              />
            </div>
            <h1 className="text-lg font-medium">Telegram Forwarder</h1>
          </div>
        </header>

        {/* Main content wrapper */}
        <main className="flex-grow w-full overflow-y-auto flex justify-center items-center px-4 py-6">
          <div className="w-full max-w-[440px]">
            {children}
          </div>
        </main>

        {/* Bottom nav */}
        <BottomNavbar />
      </body>
    </html>
  )
}