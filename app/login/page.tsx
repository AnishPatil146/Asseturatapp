'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/hooks/useAuth'

/* ═══════════════════════════════════════════════
   PARTICLE FIELD — Canvas background animation
   ═══════════════════════════════════════════════ */
function ParticleField() {
    const canvasRef = useRef<HTMLCanvasElement>(null)

    useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas) return
        const ctx = canvas.getContext('2d')
        if (!ctx) return

        let animId: number
        let particles: { x: number; y: number; vx: number; vy: number; r: number; o: number }[] = []
        const dpr = Math.min(window.devicePixelRatio || 1, 4)

        const resize = () => {
            canvas.width = Math.round(window.innerWidth * dpr)
            canvas.height = Math.round(window.innerHeight * dpr)
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
        }
        resize()
        window.addEventListener('resize', resize)

        // Create particles
        const count = Math.min(80, Math.floor(window.innerWidth / 18))
        for (let i = 0; i < count; i++) {
            particles.push({
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height,
                vx: (Math.random() - 0.5) * 0.3,
                vy: (Math.random() - 0.5) * 0.3,
                r: Math.random() * 1.5 + 0.5,
                o: Math.random() * 0.5 + 0.1,
            })
        }

        const draw = () => {
            const cw = window.innerWidth
            const ch = window.innerHeight
            ctx.clearRect(0, 0, cw, ch)

            // Draw connections
            for (let i = 0; i < particles.length; i++) {
                for (let j = i + 1; j < particles.length; j++) {
                    const dx = particles[i].x - particles[j].x
                    const dy = particles[i].y - particles[j].y
                    const dist = Math.sqrt(dx * dx + dy * dy)
                    if (dist < 150) {
                        ctx.beginPath()
                        ctx.moveTo(particles[i].x, particles[i].y)
                        ctx.lineTo(particles[j].x, particles[j].y)
                        ctx.strokeStyle = `rgba(79, 142, 247, ${0.06 * (1 - dist / 150)})`
                        ctx.lineWidth = 0.5
                        ctx.stroke()
                    }
                }
            }

            // Draw particles
            particles.forEach((p) => {
                ctx.beginPath()
                ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2)
                ctx.fillStyle = `rgba(79, 142, 247, ${p.o})`
                ctx.fill()

                // Move
                p.x += p.vx
                p.y += p.vy

                // Wrap
                if (p.x < 0) p.x = cw
                if (p.x > cw) p.x = 0
                if (p.y < 0) p.y = ch
                if (p.y > ch) p.y = 0
            })

            animId = requestAnimationFrame(draw)
        }
        draw()

        return () => {
            cancelAnimationFrame(animId)
            window.removeEventListener('resize', resize)
        }
    }, [])

    return (
        <canvas
            ref={canvasRef}
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                pointerEvents: 'none',
                zIndex: 0,
            }}
        />
    )
}

/* ═══════════════════════════════════════════════
   ANIMATED ORB — Floating gradient orb
   ═══════════════════════════════════════════════ */
function FloatingOrb({ color, size, top, left, delay }: {
    color: string; size: number; top: string; left: string; delay: number
}) {
    return (
        <div style={{
            position: 'absolute',
            top,
            left,
            width: `${size}px`,
            height: `${size}px`,
            borderRadius: '50%',
            background: `radial-gradient(circle, ${color} 0%, transparent 70%)`,
            filter: 'blur(60px)',
            opacity: 0.3,
            animation: `float 6s ease-in-out ${delay}s infinite`,
            pointerEvents: 'none',
        }} />
    )
}

/* ═══════════════════════════════════════════════
   MINI SPARKLINE — Decorative price chart
   ═══════════════════════════════════════════════ */
function MiniSparkline({ color, positive }: { color: string; positive: boolean }) {
    const canvasRef = useRef<HTMLCanvasElement>(null)

    useEffect(() => {
        const c = canvasRef.current
        if (!c) return
        const ctx = c.getContext('2d')
        if (!ctx) return

        const w = 60, h = 24
        // 4K HiDPI: use actual devicePixelRatio for razor-sharp sparklines
        const dpr = Math.min(window.devicePixelRatio || 1, 4)
        c.width = Math.round(w * dpr)
        c.height = Math.round(h * dpr)
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

        const pts: number[] = []
        let v = 12
        for (let i = 0; i < 20; i++) {
            v += (Math.random() - (positive ? 0.4 : 0.6)) * 2
            v = Math.max(3, Math.min(21, v))
            pts.push(v)
        }

        ctx.beginPath()
        ctx.moveTo(0, pts[0])
        pts.forEach((p, i) => {
            if (i > 0) ctx.lineTo((i / (pts.length - 1)) * w, p)
        })
        ctx.strokeStyle = color
        ctx.lineWidth = 1.5
        ctx.lineJoin = 'round'
        ctx.lineCap = 'round'
        ctx.stroke()
    }, [color, positive])

    return <canvas ref={canvasRef} style={{ width: '60px', height: '24px' }} />
}

/* ═══════════════════════════════════════════════
   MARKET TICKER ITEM — Bottom bar item
   ═══════════════════════════════════════════════ */
function TickerItem({ symbol, price, change, positive }: {
    symbol: string; price: string; change: string; positive: boolean
}) {
    return (
        <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '0 20px',
            flexShrink: 0,
        }}>
            <MiniSparkline color={positive ? '#00d4a0' : '#ff4d6a'} positive={positive} />
            <div>
                <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text)', letterSpacing: '0.5px' }}>
                    {symbol}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--text2)' }}>
                        {price}
                    </span>
                    <span style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: '10px',
                        color: positive ? 'var(--green)' : 'var(--red)',
                    }}>
                        {change}
                    </span>
                </div>
            </div>
        </div>
    )
}

/* ═══════════════════════════════════════════════
   LOADING SPINNER
   ═══════════════════════════════════════════════ */
function Spinner() {
    return (
        <div style={{
            width: '18px',
            height: '18px',
            border: '2px solid rgba(255,255,255,0.2)',
            borderTopColor: '#fff',
            borderRadius: '50%',
            animation: 'spin 0.8s linear infinite',
        }} />
    )
}

/* ═══════════════════════════════════════════════
   SVG ICONS
   ═══════════════════════════════════════════════ */
const IconLock = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#4f8ef7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0110 0v4" />
    </svg>
)
const IconShield = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#8b5cf6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
)
const IconChart = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#00d4a0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" />
    </svg>
)
const IconWarning = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
        <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
)
const IconCheck = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 11.08V12a10 10 0 11-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
    </svg>
)
const IconGoogle = () => (
    <svg width="18" height="18" viewBox="0 0 24 24">
        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18A11.96 11.96 0 001 12c0 1.94.46 3.77 1.18 5.07l3.66-2.84v-.14z" fill="#FBBC05" />
        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
)

/* ═══════════════════════════════════════════════
   LOGIN PAGE
   ═══════════════════════════════════════════════ */
export default function LoginPage() {
    const [mode, setMode] = useState<'signin' | 'signup'>('signin')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [error, setError] = useState('')
    const [success, setSuccess] = useState('')
    const [loading, setLoading] = useState(false)
    const [mounted, setMounted] = useState(false)
    const [focusedField, setFocusedField] = useState<string | null>(null)

    const { signIn, signUp, signInWithGoogle, user } = useAuth()
    const router = useRouter()

    // Redirect if already logged in
    useEffect(() => {
        if (user) router.replace('/')
    }, [user, router])

    // Mount animation
    useEffect(() => {
        const t = setTimeout(() => setMounted(true), 100)
        return () => clearTimeout(t)
    }, [])

    const handleSubmit = useCallback(async () => {
        setError('')
        setSuccess('')

        if (!email || !password) {
            setError('Please fill in all fields')
            return
        }

        if (mode === 'signup') {
            if (password.length < 6) {
                setError('Password must be at least 6 characters')
                return
            }
            if (password !== confirmPassword) {
                setError('Passwords do not match')
                return
            }
        }

        setLoading(true)
        try {
            if (mode === 'signin') {
                await signIn(email, password)
                router.push('/')
            } else {
                await signUp(email, password)
                setSuccess('Account created! Redirecting...')
                setTimeout(() => router.push('/'), 1200)
            }
        } catch (err: any) {
            const code = err?.code || ''
            if (code === 'auth/user-not-found' || code === 'auth/invalid-credential') {
                setError('Invalid email or password')
            } else if (code === 'auth/email-already-in-use') {
                setError('This email is already registered')
            } else if (code === 'auth/weak-password') {
                setError('Password must be at least 6 characters')
            } else if (code === 'auth/invalid-email') {
                setError('Please enter a valid email address')
            } else {
                setError(err?.message || 'Authentication failed')
            }
        }
        setLoading(false)
    }, [email, password, confirmPassword, mode, signIn, signUp, router])

    const inputStyle = (field: string): React.CSSProperties => ({
        width: '100%',
        background: 'rgba(20, 23, 32, 0.8)',
        border: `1px solid ${focusedField === field ? 'var(--blue)' : 'var(--border2)'}`,
        borderRadius: '10px',
        padding: '14px 16px',
        fontSize: '14px',
        color: 'var(--text)',
        outline: 'none',
        fontFamily: 'var(--font-sans)',
        transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        boxShadow: focusedField === field ? '0 0 0 3px rgba(79, 142, 247, 0.15), 0 0 20px rgba(79, 142, 247, 0.1)' : 'none',
    })

    const labelStyle: React.CSSProperties = {
        fontSize: '11px',
        color: 'var(--text3)',
        letterSpacing: '1.5px',
        textTransform: 'uppercase',
        marginBottom: '8px',
        fontWeight: 500,
        display: 'block',
    }

    return (
        <div style={{
            minHeight: '100vh',
            background: 'linear-gradient(135deg, #08090d 0%, #0a0d14 30%, #0d1018 60%, #08090d 100%)',
            display: 'flex',
            flexDirection: 'column',
            position: 'relative',
            overflow: 'hidden',
        }}>
            {/* Background effects */}
            <ParticleField />
            <FloatingOrb color="#4f8ef7" size={400} top="-10%" left="-5%" delay={0} />
            <FloatingOrb color="#8b5cf6" size={300} top="60%" left="80%" delay={2} />
            <FloatingOrb color="#00d4a0" size={250} top="30%" left="60%" delay={4} />

            {/* Grid overlay */}
            <div style={{
                position: 'fixed',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                backgroundImage: `
                    linear-gradient(rgba(79, 142, 247, 0.03) 1px, transparent 1px),
                    linear-gradient(90deg, rgba(79, 142, 247, 0.03) 1px, transparent 1px)
                `,
                backgroundSize: '60px 60px',
                pointerEvents: 'none',
                zIndex: 0,
            }} />

            {/* Main content */}
            <div style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '40px 20px',
                position: 'relative',
                zIndex: 10,
            }}>
                <div style={{
                    width: '100%',
                    maxWidth: '960px',
                    display: 'flex',
                    gap: '48px',
                    alignItems: 'center',
                    opacity: mounted ? 1 : 0,
                    transform: mounted ? 'translateY(0) scale(1)' : 'translateY(30px) scale(0.95)',
                    transition: 'all 0.8s cubic-bezier(0.16, 1, 0.3, 1)',
                    flexWrap: 'wrap' as const,
                    justifyContent: 'center',
                }}>

                    {/* ─── LEFT PANEL: Fintech Context ─── */}
                    <div style={{
                        flex: '1 1 400px',
                        maxWidth: '460px',
                        opacity: mounted ? 1 : 0,
                        transform: mounted ? 'translateX(0)' : 'translateX(-30px)',
                        transition: 'all 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.15s',
                    }}>
                        {/* Logo */}
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            marginBottom: '28px',
                        }}>
                            <div style={{
                                width: '44px', height: '44px', borderRadius: '12px',
                                background: 'linear-gradient(135deg, rgba(79,142,247,0.2), rgba(139,92,246,0.2))',
                                border: '1px solid rgba(79,142,247,0.3)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                animation: 'float 4s ease-in-out infinite',
                            }}>
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                                    <path d="M3 17L9 11L13 15L21 7" stroke="#4f8ef7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                    <path d="M17 7H21V11" stroke="#4f8ef7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                            </div>
                            <div>
                                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '20px', fontWeight: 600, letterSpacing: '4px' }}>
                                    ASSET<span style={{ color: 'var(--blue)' }}>URA</span>
                                </div>
                                <div style={{ fontSize: '10px', color: 'var(--text3)', letterSpacing: '2px', fontWeight: 300 }}>
                                    INSTITUTIONAL TRADING PLATFORM
                                </div>
                            </div>
                        </div>

                        {/* Headline */}
                        <h1 style={{
                            fontSize: '32px',
                            fontWeight: 700,
                            lineHeight: 1.2,
                            marginBottom: '16px',
                            background: 'linear-gradient(135deg, var(--text) 0%, var(--text2) 100%)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                        }}>
                            Institutional-Grade Trading Intelligence
                        </h1>

                        <p style={{
                            fontSize: '14px',
                            color: 'var(--text2)',
                            lineHeight: 1.7,
                            marginBottom: '32px',
                            maxWidth: '400px',
                        }}>
                            Access real-time market data, AI-powered analysis, and multi-asset portfolio management trusted by traders worldwide.
                        </p>

                        {/* Stats row */}
                        <div style={{
                            display: 'flex',
                            gap: '24px',
                            marginBottom: '32px',
                            flexWrap: 'wrap' as const,
                        }}>
                            {[
                                { value: '$2.4B+', label: 'Daily Volume' },
                                { value: '50ms', label: 'Avg. Latency' },
                                { value: '99.99%', label: 'Uptime SLA' },
                            ].map((stat) => (
                                <div key={stat.label}>
                                    <div style={{
                                        fontFamily: 'var(--font-mono)', fontSize: '22px',
                                        fontWeight: 700, color: 'var(--text)',
                                        lineHeight: 1,
                                    }}>{stat.value}</div>
                                    <div style={{
                                        fontSize: '11px', color: 'var(--text3)',
                                        marginTop: '4px', letterSpacing: '0.5px',
                                    }}>{stat.label}</div>
                                </div>
                            ))}
                        </div>

                        {/* Feature list */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '32px' }}>
                            {[
                                { icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#4f8ef7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12" /></svg>, text: 'Real-time streaming across 10,000+ instruments' },
                                { icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#8b5cf6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a10 10 0 0110 10 10 10 0 01-10 10A10 10 0 012 12 10 10 0 0112 2z" /><path d="M12 6v6l4 2" /></svg>, text: 'AI-driven signals with 78% historical accuracy' },
                                { icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#00d4a0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0110 0v4" /></svg>, text: 'Bank-grade encryption & SOC 2 Type II certified' },
                                { icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#f5a623" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="2" y1="12" x2="22" y2="12" /><path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" /></svg>, text: 'Multi-asset: Crypto, Equities, Forex, Options' },
                            ].map((f, i) => (
                                <div key={i} style={{
                                    display: 'flex', alignItems: 'center', gap: '12px',
                                    opacity: mounted ? 1 : 0,
                                    transform: mounted ? 'translateX(0)' : 'translateX(-16px)',
                                    transition: `all 0.5s cubic-bezier(0.16, 1, 0.3, 1) ${0.3 + i * 0.1}s`,
                                }}>
                                    <div style={{
                                        width: '32px', height: '32px', borderRadius: '8px',
                                        background: 'rgba(20, 23, 32, 0.8)',
                                        border: '1px solid var(--border)',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        flexShrink: 0,
                                    }}>{f.icon}</div>
                                    <span style={{ fontSize: '13px', color: 'var(--text2)', lineHeight: 1.4 }}>{f.text}</span>
                                </div>
                            ))}
                        </div>

                        {/* Trusted by */}
                        <div style={{
                            opacity: mounted ? 1 : 0,
                            transition: 'all 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.7s',
                        }}>
                            <div style={{
                                fontSize: '10px', color: 'var(--text3)', letterSpacing: '1.5px',
                                textTransform: 'uppercase', marginBottom: '12px', fontWeight: 500,
                            }}>
                                Powering traders across
                            </div>
                            <div style={{ display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' as const }}>
                                {['NYSE', 'NASDAQ', 'LSE', 'Binance', 'CME'].map((ex) => (
                                    <span key={ex} style={{
                                        fontFamily: 'var(--font-mono)', fontSize: '12px',
                                        color: 'var(--text3)', fontWeight: 500,
                                        padding: '4px 10px', borderRadius: '6px',
                                        background: 'rgba(20, 23, 32, 0.6)',
                                        border: '1px solid var(--border)',
                                        letterSpacing: '1px',
                                    }}>{ex}</span>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* ─── RIGHT PANEL: Login Form ─── */}
                    <div style={{
                        flex: '1 1 380px',
                        maxWidth: '440px',
                    }}>
                        {/* Logo section */}
                        <div style={{
                            textAlign: 'center',
                            marginBottom: '36px',
                            opacity: mounted ? 1 : 0,
                            transform: mounted ? 'translateY(0)' : 'translateY(20px)',
                            transition: 'all 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.1s',
                        }}>
                            {/* Logo icon */}
                            <div style={{
                                width: '56px',
                                height: '56px',
                                borderRadius: '16px',
                                background: 'linear-gradient(135deg, rgba(79, 142, 247, 0.2), rgba(139, 92, 246, 0.2))',
                                border: '1px solid rgba(79, 142, 247, 0.3)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                margin: '0 auto 16px',
                                animation: 'float 4s ease-in-out infinite',
                            }}>
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                                    <path d="M3 17L9 11L13 15L21 7" stroke="#4f8ef7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                    <path d="M17 7H21V11" stroke="#4f8ef7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                            </div>

                            <div style={{
                                fontFamily: 'var(--font-mono)',
                                fontSize: '26px',
                                fontWeight: 600,
                                letterSpacing: '5px',
                                color: 'var(--text)',
                                animation: 'glow 3s ease-in-out infinite',
                            }}>
                                ASSET<span style={{ color: 'var(--blue)' }}>URA</span>
                            </div>
                            <div style={{
                                fontSize: '13px',
                                color: 'var(--text3)',
                                marginTop: '6px',
                                letterSpacing: '2px',
                                fontWeight: 300,
                            }}>
                                INSTITUTIONAL TRADING PLATFORM
                            </div>
                        </div>

                        {/* Card */}
                        <div style={{
                            background: 'rgba(14, 17, 23, 0.65)',
                            backdropFilter: 'blur(24px)',
                            WebkitBackdropFilter: 'blur(24px)',
                            border: '1px solid rgba(30, 35, 51, 0.5)',
                            borderRadius: '20px',
                            padding: '36px',
                            boxShadow: '0 25px 60px rgba(0, 0, 0, 0.5), 0 0 80px rgba(79, 142, 247, 0.05)',
                            opacity: mounted ? 1 : 0,
                            transform: mounted ? 'translateY(0)' : 'translateY(20px)',
                            transition: 'all 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.2s',
                        }}>
                            {/* Mode toggle */}
                            <div style={{
                                display: 'flex',
                                background: 'var(--bg)',
                                borderRadius: '12px',
                                padding: '4px',
                                marginBottom: '28px',
                                border: '1px solid var(--border)',
                            }}>
                                {(['signin', 'signup'] as const).map((m) => (
                                    <button
                                        key={m}
                                        onClick={() => { setMode(m); setError(''); setSuccess('') }}
                                        style={{
                                            flex: 1,
                                            padding: '10px',
                                            borderRadius: '9px',
                                            fontSize: '13px',
                                            fontWeight: 600,
                                            cursor: 'pointer',
                                            border: 'none',
                                            background: mode === m
                                                ? 'linear-gradient(135deg, rgba(79, 142, 247, 0.15), rgba(139, 92, 246, 0.1))'
                                                : 'transparent',
                                            color: mode === m ? 'var(--text)' : 'var(--text3)',
                                            fontFamily: 'var(--font-sans)',
                                            transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                                            boxShadow: mode === m ? '0 0 20px rgba(79, 142, 247, 0.1)' : 'none',
                                            letterSpacing: '0.5px',
                                        }}
                                    >
                                        {m === 'signin' ? 'Sign In' : 'Create Account'}
                                    </button>
                                ))}
                            </div>

                            {/* Form */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                {/* Email */}
                                <div style={{
                                    opacity: mounted ? 1 : 0,
                                    transform: mounted ? 'translateY(0)' : 'translateY(10px)',
                                    transition: 'all 0.5s cubic-bezier(0.16, 1, 0.3, 1) 0.3s',
                                }}>
                                    <label style={labelStyle}>Email Address</label>
                                    <input
                                        id="login-email"
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        onFocus={() => setFocusedField('email')}
                                        onBlur={() => setFocusedField(null)}
                                        placeholder="you@example.com"
                                        style={inputStyle('email')}
                                        autoComplete="email"
                                    />
                                </div>

                                {/* Password */}
                                <div style={{
                                    opacity: mounted ? 1 : 0,
                                    transform: mounted ? 'translateY(0)' : 'translateY(10px)',
                                    transition: 'all 0.5s cubic-bezier(0.16, 1, 0.3, 1) 0.4s',
                                }}>
                                    <label style={labelStyle}>Password</label>
                                    <input
                                        id="login-password"
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        onFocus={() => setFocusedField('password')}
                                        onBlur={() => setFocusedField(null)}
                                        onKeyDown={(e) => e.key === 'Enter' && mode === 'signin' && handleSubmit()}
                                        placeholder="••••••••"
                                        style={inputStyle('password')}
                                        autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
                                    />
                                </div>

                                {/* Confirm Password (signup only) */}
                                <div style={{
                                    maxHeight: mode === 'signup' ? '100px' : '0',
                                    opacity: mode === 'signup' ? 1 : 0,
                                    overflow: 'hidden',
                                    transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
                                }}>
                                    <label style={labelStyle}>Confirm Password</label>
                                    <input
                                        id="login-confirm-password"
                                        type="password"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        onFocus={() => setFocusedField('confirm')}
                                        onBlur={() => setFocusedField(null)}
                                        onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                                        placeholder="••••••••"
                                        style={inputStyle('confirm')}
                                        autoComplete="new-password"
                                    />
                                </div>

                                {/* Error */}
                                {error && (
                                    <div style={{
                                        background: 'rgba(255, 77, 106, 0.08)',
                                        border: '1px solid rgba(255, 77, 106, 0.2)',
                                        borderRadius: '10px',
                                        padding: '12px 16px',
                                        fontSize: '12px',
                                        color: 'var(--red)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '8px',
                                        animation: 'slideUp 0.3s ease forwards',
                                    }}>
                                        <IconWarning />
                                        {error}
                                    </div>
                                )}

                                {/* Success */}
                                {success && (
                                    <div style={{
                                        background: 'rgba(0, 212, 160, 0.08)',
                                        border: '1px solid rgba(0, 212, 160, 0.2)',
                                        borderRadius: '10px',
                                        padding: '12px 16px',
                                        fontSize: '12px',
                                        color: 'var(--green)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '8px',
                                        animation: 'slideUp 0.3s ease forwards',
                                    }}>
                                        <IconCheck />
                                        {success}
                                    </div>
                                )}

                                {/* Submit */}
                                <button
                                    id="login-submit"
                                    onClick={handleSubmit}
                                    disabled={loading}
                                    style={{
                                        width: '100%',
                                        padding: '15px',
                                        borderRadius: '12px',
                                        fontSize: '14px',
                                        fontWeight: 600,
                                        cursor: loading ? 'not-allowed' : 'pointer',
                                        border: 'none',
                                        backgroundColor: loading ? 'var(--bg4)' : undefined,
                                        backgroundImage: loading
                                            ? 'none'
                                            : 'linear-gradient(135deg, #4f8ef7 0%, #6366f1 50%, #8b5cf6 100%)',
                                        backgroundSize: '200% 200%',
                                        animation: loading ? 'none' : 'gradientShift 3s ease infinite',
                                        color: '#fff',
                                        fontFamily: 'var(--font-sans)',
                                        letterSpacing: '0.5px',
                                        opacity: loading ? 0.7 : 1,
                                        transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                                        boxShadow: loading ? 'none' : '0 4px 20px rgba(79, 142, 247, 0.3)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '8px',
                                    }}
                                >
                                    {loading ? (
                                        <>
                                            <Spinner />
                                            {mode === 'signin' ? 'Signing in...' : 'Creating account...'}
                                        </>
                                    ) : (
                                        mode === 'signin' ? 'Sign In to Platform' : 'Create Account'
                                    )}
                                </button>

                                {/* Divider */}
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '12px',
                                    margin: '4px 0',
                                }}>
                                    <div style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
                                    <span style={{ fontSize: '10px', color: 'var(--text3)', letterSpacing: '1px', textTransform: 'uppercase' }}>
                                        or continue with
                                    </span>
                                    <div style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
                                </div>

                                {/* Google Sign-In */}
                                <button
                                    id="login-google"
                                    onClick={async () => {
                                        setError(''); setLoading(true)
                                        try {
                                            await signInWithGoogle()
                                            router.push('/')
                                        } catch (err: any) {
                                            if (err?.code !== 'auth/popup-closed-by-user') {
                                                setError(err?.message || 'Google sign-in failed')
                                            }
                                        }
                                        setLoading(false)
                                    }}
                                    disabled={loading}
                                    style={{
                                        width: '100%',
                                        padding: '13px',
                                        borderRadius: '12px',
                                        fontSize: '13px',
                                        fontWeight: 500,
                                        cursor: loading ? 'not-allowed' : 'pointer',
                                        border: '1px solid var(--border2)',
                                        backgroundColor: 'rgba(20, 23, 32, 0.8)',
                                        backgroundImage: 'none',
                                        color: 'var(--text)',
                                        fontFamily: 'var(--font-sans)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '10px',
                                        transition: 'all 0.2s',
                                        opacity: loading ? 0.6 : 1,
                                    }}
                                >
                                    <IconGoogle />
                                    Sign in with Google
                                </button>
                            </div>
                        </div>

                        {/* Security badges */}
                        <div style={{
                            display: 'flex',
                            justifyContent: 'center',
                            gap: '20px',
                            marginTop: '24px',
                            opacity: mounted ? 1 : 0,
                            transition: 'all 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.6s',
                        }}>
                            {[
                                { icon: <IconLock />, label: 'SSL Encrypted' },
                                { icon: <IconShield />, label: '2FA Ready' },
                                { icon: <IconChart />, label: 'Real-time Data' },
                            ].map((b) => (
                                <div key={b.label} style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    fontSize: '11px',
                                    color: 'var(--text3)',
                                }}>
                                    {b.icon}
                                    {b.label}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Bottom ticker bar */}
                <div style={{
                    borderTop: '1px solid var(--border)',
                    background: 'rgba(14, 17, 23, 0.6)',
                    backdropFilter: 'blur(10px)',
                    height: '48px',
                    display: 'flex',
                    alignItems: 'center',
                    overflow: 'hidden',
                    position: 'relative',
                    zIndex: 10,
                }}>
                    <div style={{
                        display: 'flex',
                        animation: 'ticker 30s linear infinite',
                        whiteSpace: 'nowrap',
                    }}>
                        {/* Duplicate items for seamless loop */}
                        {[1, 2].map((set) => (
                            <div key={set} style={{ display: 'flex', alignItems: 'center' }}>
                                <TickerItem symbol="BTC/USD" price="$97,421.50" change="+2.34%" positive={true} />
                                <TickerItem symbol="ETH/USD" price="$3,120.80" change="-0.80%" positive={false} />
                                <TickerItem symbol="S&P 500" price="5,612.30" change="+0.29%" positive={true} />
                                <TickerItem symbol="NASDAQ" price="17,710.36" change="+0.94%" positive={true} />
                                <TickerItem symbol="EUR/USD" price="1.0842" change="+0.12%" positive={true} />
                                <TickerItem symbol="GOLD" price="$2,644.50" change="+0.12%" positive={true} />
                                <TickerItem symbol="SOL/USD" price="$164.20" change="+1.24%" positive={true} />
                                <TickerItem symbol="AAPL" price="$189.45" change="-0.87%" positive={false} />
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
