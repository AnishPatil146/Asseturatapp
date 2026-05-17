'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { THEME } from '@/lib/engine/theme'

// ═══════════════════════════════════════════════════════════════
// ASSETURA PRO — Toast Notification System
// Slide-in notifications for order fills, alerts, and system events
// ═══════════════════════════════════════════════════════════════

export type ToastType = 'success' | 'error' | 'warning' | 'info' | 'buy' | 'sell'

export interface ToastMessage {
  id: string
  type: ToastType
  title: string
  message: string
  duration?: number  // ms, default 4000
  timestamp: number
}

// ── Singleton event system (subscribe from anywhere, no prop drilling) ──
type ToastListener = (toast: ToastMessage) => void
const listeners: Set<ToastListener> = new Set()

export function showToast(type: ToastType, title: string, message: string, duration = 4000) {
  const toast: ToastMessage = {
    id: `toast-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    type,
    title,
    message,
    duration,
    timestamp: Date.now(),
  }
  listeners.forEach(fn => fn(toast))
}

// ── Convenience helpers ──
export const toast = {
  success: (title: string, msg: string) => showToast('success', title, msg),
  error: (title: string, msg: string) => showToast('error', title, msg),
  warning: (title: string, msg: string) => showToast('warning', title, msg),
  info: (title: string, msg: string) => showToast('info', title, msg),
  buy: (title: string, msg: string) => showToast('buy', title, msg),
  sell: (title: string, msg: string) => showToast('sell', title, msg),
}

// ── Color mapping ──
const TOAST_COLORS: Record<ToastType, { border: string; bg: string; icon: string; accent: string }> = {
  success: { border: THEME.bull, bg: 'rgba(0,230,118,0.06)', icon: THEME.bull, accent: THEME.bullDim },
  error:   { border: THEME.bear, bg: 'rgba(255,59,105,0.06)', icon: THEME.bear, accent: THEME.bearDim },
  warning: { border: THEME.amber, bg: 'rgba(255,176,32,0.06)', icon: THEME.amber, accent: 'rgba(255,176,32,0.12)' },
  info:    { border: THEME.blue, bg: 'rgba(79,142,247,0.06)', icon: THEME.blue, accent: 'rgba(79,142,247,0.12)' },
  buy:     { border: THEME.bull, bg: 'rgba(0,230,118,0.06)', icon: THEME.bull, accent: THEME.bullDim },
  sell:    { border: THEME.bear, bg: 'rgba(255,59,105,0.06)', icon: THEME.bear, accent: THEME.bearDim },
}

// ── SVG Icons ──
function ToastIcon({ type }: { type: ToastType }) {
  const color = TOAST_COLORS[type].icon
  const size = 16

  switch (type) {
    case 'success':
    case 'buy':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="20 6 9 17 4 12" />
        </svg>
      )
    case 'error':
    case 'sell':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" />
        </svg>
      )
    case 'warning':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
          <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
      )
    case 'info':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" />
        </svg>
      )
  }
}

// ── Individual Toast Component ──
function ToastItem({ toast: t, onDismiss }: { toast: ToastMessage; onDismiss: (id: string) => void }) {
  const [isExiting, setIsExiting] = useState(false)
  const [progress, setProgress] = useState(100)
  const colors = TOAST_COLORS[t.type]
  const duration = t.duration || 4000

  useEffect(() => {
    const start = Date.now()
    const tick = () => {
      const elapsed = Date.now() - start
      const remaining = Math.max(0, 100 - (elapsed / duration) * 100)
      setProgress(remaining)
      if (remaining > 0) requestAnimationFrame(tick)
    }
    const raf = requestAnimationFrame(tick)

    const timer = setTimeout(() => {
      setIsExiting(true)
      setTimeout(() => onDismiss(t.id), 300)
    }, duration)

    return () => {
      cancelAnimationFrame(raf)
      clearTimeout(timer)
    }
  }, [t.id, duration, onDismiss])

  const handleClose = () => {
    setIsExiting(true)
    setTimeout(() => onDismiss(t.id), 300)
  }

  return (
    <div style={{
      background: THEME.bgPanel,
      border: `1px solid ${colors.border}30`,
      borderLeft: `3px solid ${colors.border}`,
      borderRadius: '8px',
      padding: '12px 14px',
      width: '320px',
      boxShadow: `0 8px 32px rgba(0,0,0,0.5), 0 0 20px ${colors.border}10`,
      animation: isExiting ? 'toastExit 0.3s ease forwards' : 'toastEnter 0.3s cubic-bezier(0.16,1,0.3,1) forwards',
      display: 'flex',
      gap: '10px',
      alignItems: 'flex-start',
      position: 'relative',
      overflow: 'hidden',
      backdropFilter: 'blur(16px)',
    }}>
      {/* Progress bar */}
      <div style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        height: '2px',
        width: `${progress}%`,
        background: `linear-gradient(90deg, ${colors.border}, ${colors.border}80)`,
        transition: 'width 0.1s linear',
        borderRadius: '0 2px 0 0',
      }} />

      {/* Icon */}
      <div style={{
        width: '28px',
        height: '28px',
        borderRadius: '6px',
        background: colors.accent,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        marginTop: '1px',
      }}>
        <ToastIcon type={t.type} />
      </div>

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: '12px',
          fontWeight: 600,
          color: THEME.text,
          marginBottom: '2px',
          fontFamily: THEME.fontSans,
        }}>
          {t.title}
        </div>
        <div style={{
          fontSize: '11px',
          color: THEME.textSecondary,
          lineHeight: 1.4,
          fontFamily: THEME.fontMono,
        }}>
          {t.message}
        </div>
      </div>

      {/* Close button */}
      <button
        onClick={handleClose}
        style={{
          background: 'none',
          border: 'none',
          color: THEME.textMuted,
          cursor: 'pointer',
          fontSize: '14px',
          lineHeight: 1,
          padding: '0',
          flexShrink: 0,
          transition: 'color 0.15s',
        }}
        onMouseEnter={e => (e.currentTarget.style.color = THEME.text)}
        onMouseLeave={e => (e.currentTarget.style.color = THEME.textMuted)}
      >
        ×
      </button>
    </div>
  )
}

// ── Toast Container (mount once in layout) ──
export default function ToastContainer() {
  const [toasts, setToasts] = useState<ToastMessage[]>([])

  useEffect(() => {
    const handler: ToastListener = (toast) => {
      setToasts(prev => [...prev.slice(-4), toast]) // Max 5 visible
    }
    listeners.add(handler)
    return () => { listeners.delete(handler) }
  }, [])

  const dismiss = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  if (toasts.length === 0) return null

  return (
    <>
      <div style={{
        position: 'fixed',
        bottom: '20px',
        right: '20px',
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column-reverse',
        gap: '8px',
        pointerEvents: 'none',
      }}>
        {toasts.map(t => (
          <div key={t.id} style={{ pointerEvents: 'auto' }}>
            <ToastItem toast={t} onDismiss={dismiss} />
          </div>
        ))}
      </div>
      <style>{`
        @keyframes toastEnter {
          from { opacity: 0; transform: translateX(100%) scale(0.95); }
          to   { opacity: 1; transform: translateX(0) scale(1); }
        }
        @keyframes toastExit {
          from { opacity: 1; transform: translateX(0) scale(1); }
          to   { opacity: 0; transform: translateX(100%) scale(0.95); }
        }
      `}</style>
    </>
  )
}
