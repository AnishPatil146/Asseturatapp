'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/hooks/useAuth'

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/login')
    }
  }, [user, loading, router])

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'var(--bg)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        gap: '20px',
      }}>
        {/* Animated logo */}
        <div style={{
          fontFamily: 'var(--font-mono)',
          fontSize: '28px',
          fontWeight: 600,
          letterSpacing: '5px',
          animation: 'glow 2s ease-in-out infinite',
        }}>
          ASSET<span style={{ color: 'var(--blue)' }}>URA</span>
        </div>

        {/* Shimmer loading bar */}
        <div style={{
          width: '200px',
          height: '3px',
          borderRadius: '2px',
          background: 'var(--bg3)',
          overflow: 'hidden',
          position: 'relative',
        }}>
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '40%',
            height: '100%',
            background: 'linear-gradient(90deg, transparent, var(--blue), transparent)',
            borderRadius: '2px',
            animation: 'shimmer 1.5s infinite',
          }} />
        </div>

        <span style={{
          fontSize: '12px',
          color: 'var(--text3)',
          fontFamily: 'var(--font-mono)',
          letterSpacing: '2px',
        }}>
          LOADING
        </span>
      </div>
    )
  }

  if (!user) return null

  return <>{children}</>
}
