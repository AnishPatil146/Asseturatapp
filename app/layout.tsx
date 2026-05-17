import type { Metadata } from 'next'
import './globals.css'
import GlobalModals from '@/components/GlobalModals'

export const metadata: Metadata = {
  title: 'Assetura — Multi-Asset Trading Platform',
  description: 'AI-powered trading dashboard for stocks, crypto, forex and options',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning style={{
        background: 'var(--bg)',
        color: 'var(--text)',
        minHeight: '100vh',
      }}>
        {children}
        <GlobalModals />
      </body>
    </html>
  )
}