'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useMarketStore } from '@/lib/store/useMarketStore'

const NAV = [
    { label: 'Markets', href: '/' },
    { label: 'Portfolio', href: '/portfolio' },
    { label: 'Signals', href: '/signals' },
    { label: 'AI Advisor', href: '/ai-advisor' },
    { label: 'News', href: '/news' },
    { label: 'Broker', href: '/broker' },
]

const SEARCH_RESULTS = [
    { symbol: 'BTC/USDT', name: 'Bitcoin', type: 'Crypto', color: '#f7931a', href: '/?asset=CRYPTO' },
    { symbol: 'ETH/USDT', name: 'Ethereum', type: 'Crypto', color: '#627eea', href: '/?asset=CRYPTO' },
    { symbol: 'SOL/USDT', name: 'Solana', type: 'Crypto', color: '#9945ff', href: '/?asset=CRYPTO' },
    { symbol: 'AAPL', name: 'Apple Inc.', type: 'Stock', color: '#4f8ef7', href: '/?asset=STOCKS' },
    { symbol: 'NVDA', name: 'Nvidia', type: 'Stock', color: '#76b900', href: '/?asset=STOCKS' },
    { symbol: 'TSLA', name: 'Tesla', type: 'Stock', color: '#e31937', href: '/?asset=STOCKS' },
    { symbol: 'MSFT', name: 'Microsoft', type: 'Stock', color: '#00a4ef', href: '/?asset=STOCKS' },
    { symbol: 'EUR/USD', name: 'Euro / Dollar', type: 'Forex', color: '#00d4a0', href: '/?asset=FOREX' },
    { symbol: 'GBP/USD', name: 'British Pound', type: 'Forex', color: '#00d4a0', href: '/?asset=FOREX' },
    { symbol: 'SPX', name: 'S&P 500', type: 'Index', color: '#f5a623', href: '/?asset=OPTIONS' },
    { symbol: 'NDX', name: 'Nasdaq 100', type: 'Index', color: '#f5a623', href: '/?asset=OPTIONS' },
    { symbol: 'Gold', name: 'Gold Futures', type: 'Futures', color: '#FFD700', href: '/' },
    { symbol: 'Oil', name: 'Crude Oil', type: 'Futures', color: '#8b4513', href: '/' },
]

const TYPE_COLORS: Record<string, string> = {
    Crypto: 'rgba(249,115,22,0.15)',
    Stock: 'rgba(79,142,247,0.15)',
    Forex: 'rgba(0,212,160,0.15)',
    Index: 'rgba(245,166,35,0.15)',
    Futures: 'rgba(255,215,0,0.15)',
}

const TYPE_TEXT: Record<string, string> = {
    Crypto: '#f97316',
    Stock: '#4f8ef7',
    Forex: '#00d4a0',
    Index: '#f5a623',
    Futures: '#FFD700',
}

export default function Navbar() {
    const pathname = usePathname()
    const router = useRouter()
    const isMarketOpen = useMarketStore((s) => s.isMarketOpen)

    const [search, setSearch] = useState('')
    const [searchOpen, setSearchOpen] = useState(false)
    const [profileOpen, setProfileOpen] = useState(false)
    const [searchFocus, setSearchFocus] = useState(false)

    const searchRef = useRef<HTMLDivElement>(null)
    const profileRef = useRef<HTMLDivElement>(null)
    const inputRef = useRef<HTMLInputElement>(null)

    const filtered = SEARCH_RESULTS.filter(r =>
        search.length === 0 ? true :
            r.symbol.toLowerCase().includes(search.toLowerCase()) ||
            r.name.toLowerCase().includes(search.toLowerCase()) ||
            r.type.toLowerCase().includes(search.toLowerCase())
    ).slice(0, 8)

    // Close dropdowns on outside click
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
                setSearchOpen(false)
                setSearchFocus(false)
            }
            if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
                setProfileOpen(false)
            }
        }
        document.addEventListener('mousedown', handler)
        return () => document.removeEventListener('mousedown', handler)
    }, [])

    const handleSearchSelect = (href: string) => {
        setSearch('')
        setSearchOpen(false)
        setSearchFocus(false)
        router.push(href)
    }

    const handleSearchKey = (e: React.KeyboardEvent) => {
        if (e.key === 'Escape') {
            setSearchOpen(false)
            setSearchFocus(false)
            setSearch('')
        }
        if (e.key === 'Enter' && filtered.length > 0) {
            handleSearchSelect(filtered[0].href)
        }
    }

    return (
        <>
            <header style={{
                background: '#0e1117',
                borderBottom: '1px solid #1e2333',
                height: '48px',
                display: 'flex',
                alignItems: 'center',
                padding: '0 20px',
                gap: '20px',
                position: 'sticky',
                top: 0,
                zIndex: 200,
            }}>

                {/* Logo */}
                <Link href="/" style={{ textDecoration: 'none', flexShrink: 0 }}>
                    <span style={{
                        fontFamily: 'DM Mono,monospace',
                        fontSize: '15px',
                        fontWeight: 600,
                        letterSpacing: '3px',
                        color: '#e2e8f7',
                    }}>
                        ASSET<span style={{ color: '#4f8ef7' }}>URA</span>
                    </span>
                </Link>

                {/* Nav links */}
                <nav style={{ display: 'flex', gap: '2px' }}>
                    {NAV.map(link => {
                        const active = pathname === link.href
                        return (
                            <Link key={link.href} href={link.href} style={{ textDecoration: 'none' }}>
                                <span style={{
                                    padding: '5px 12px',
                                    borderRadius: '5px',
                                    fontSize: '12px',
                                    fontWeight: 500,
                                    color: active ? '#e2e8f7' : '#7b88aa',
                                    background: active ? '#1a1e2a' : 'transparent',
                                    border: active ? '1px solid #252b3d' : '1px solid transparent',
                                    display: 'inline-block',
                                    cursor: 'pointer',
                                    transition: 'all 0.15s',
                                    whiteSpace: 'nowrap',
                                }}>
                                    {link.label}
                                </span>
                            </Link>
                        )
                    })}
                </nav>

                {/* Right side */}
                <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '12px' }}>

                    {/* Live indicator */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                        <span style={{
                            width: '7px',
                            height: '7px',
                            borderRadius: '50%',
                            background: isMarketOpen ? '#00d4a0' : '#ff4d6a',
                            display: 'inline-block',
                            animation: 'pulse 2s infinite',
                        }} />
                        <span style={{
                            fontFamily: 'DM Mono,monospace',
                            fontSize: '11px',
                            color: isMarketOpen ? '#00d4a0' : '#4a5470',
                            letterSpacing: '1px',
                        }}>
                            {isMarketOpen ? 'LIVE' : 'CLOSED'}
                        </span>
                    </div>

                    {/* Search */}
                    <div ref={searchRef} style={{ position: 'relative' }}>
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            background: searchFocus ? '#1a1e2a' : '#141720',
                            border: `1px solid ${searchFocus ? '#252b3d' : '#1e2333'}`,
                            borderRadius: '6px',
                            padding: '0 12px',
                            height: '30px',
                            width: searchFocus ? '220px' : '160px',
                            transition: 'all 0.2s',
                            cursor: 'text',
                        }}
                            onClick={() => {
                                setSearchOpen(true)
                                setSearchFocus(true)
                                inputRef.current?.focus()
                            }}
                        >
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#4a5470" strokeWidth="2.5" strokeLinecap="round">
                                <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
                            </svg>
                            <input
                                ref={inputRef}
                                value={search}
                                onChange={e => { setSearch(e.target.value); setSearchOpen(true) }}
                                onFocus={() => { setSearchOpen(true); setSearchFocus(true) }}
                                onKeyDown={handleSearchKey}
                                placeholder="Search assets..."
                                style={{
                                    background: 'transparent',
                                    border: 'none',
                                    outline: 'none',
                                    fontSize: '12px',
                                    color: '#e2e8f7',
                                    fontFamily: 'DM Sans,sans-serif',
                                    width: '100%',
                                    cursor: 'text',
                                }}
                            />
                            {search && (
                                <button
                                    onClick={e => { e.stopPropagation(); setSearch(''); inputRef.current?.focus() }}
                                    style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: '#4a5470', fontSize: '14px', lineHeight: 1 }}
                                >
                                    ×
                                </button>
                            )}
                        </div>

                        {/* Search dropdown */}
                        {searchOpen && (
                            <div style={{
                                position: 'absolute',
                                top: '38px',
                                right: 0,
                                width: '300px',
                                background: '#0e1117',
                                border: '1px solid #1e2333',
                                borderRadius: '8px',
                                boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
                                overflow: 'hidden',
                                zIndex: 300,
                            }}>
                                {/* Category pills */}
                                <div style={{ padding: '8px 12px', borderBottom: '1px solid #1e2333', display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                                    {['All', 'Crypto', 'Stock', 'Forex', 'Index'].map(cat => (
                                        <button
                                            key={cat}
                                            onClick={() => setSearch(cat === 'All' ? '' : cat)}
                                            style={{
                                                padding: '2px 10px',
                                                borderRadius: '20px',
                                                fontSize: '10px',
                                                fontWeight: 500,
                                                cursor: 'pointer',
                                                border: '1px solid #1e2333',
                                                background: 'transparent',
                                                color: '#7b88aa',
                                                fontFamily: 'DM Sans,sans-serif',
                                                transition: 'all 0.12s',
                                            }}
                                        >
                                            {cat}
                                        </button>
                                    ))}
                                </div>

                                {/* Results */}
                                <div style={{ maxHeight: '280px', overflowY: 'auto' }}>
                                    {filtered.length === 0 ? (
                                        <div style={{ padding: '20px', textAlign: 'center', fontSize: '12px', color: '#4a5470' }}>
                                            No results for &ldquo;{search}&rdquo;
                                        </div>
                                    ) : (
                                        filtered.map((r, i) => (
                                            <div
                                                key={i}
                                                onClick={() => handleSearchSelect(r.href)}
                                                style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    padding: '10px 12px',
                                                    gap: '10px',
                                                    cursor: 'pointer',
                                                    borderBottom: i < filtered.length - 1 ? '1px solid #1e2333' : 'none',
                                                    transition: 'background 0.12s',
                                                }}
                                                onMouseEnter={e => (e.currentTarget.style.background = '#141720')}
                                                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                                            >
                                                <div style={{
                                                    width: '32px',
                                                    height: '32px',
                                                    borderRadius: '50%',
                                                    background: r.color + '22',
                                                    border: `1px solid ${r.color}44`,
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    fontSize: '11px',
                                                    fontWeight: 700,
                                                    color: r.color,
                                                    flexShrink: 0,
                                                }}>
                                                    {r.symbol[0]}
                                                </div>
                                                <div style={{ flex: 1, minWidth: 0 }}>
                                                    <div style={{ fontSize: '13px', fontWeight: 500, color: '#e2e8f7' }}>{r.symbol}</div>
                                                    <div style={{ fontSize: '10px', color: '#4a5470' }}>{r.name}</div>
                                                </div>
                                                <span style={{
                                                    padding: '2px 8px',
                                                    borderRadius: '4px',
                                                    fontSize: '10px',
                                                    fontWeight: 500,
                                                    background: TYPE_COLORS[r.type] || '#1a1e2a',
                                                    color: TYPE_TEXT[r.type] || '#7b88aa',
                                                    flexShrink: 0,
                                                }}>
                                                    {r.type}
                                                </span>
                                            </div>
                                        ))
                                    )}
                                </div>

                                <div style={{ padding: '8px 12px', borderTop: '1px solid #1e2333', fontSize: '10px', color: '#4a5470', display: 'flex', justifyContent: 'space-between' }}>
                                    <span>↑↓ navigate</span>
                                    <span>↵ select</span>
                                    <span>esc close</span>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Profile */}
                    <div ref={profileRef} style={{ position: 'relative' }}>
                        <button
                            onClick={() => setProfileOpen(p => !p)}
                            style={{
                                width: '32px',
                                height: '32px',
                                borderRadius: '50%',
                                background: profileOpen ? '#4f8ef7' : '#1a1e2a',
                                border: `1px solid ${profileOpen ? '#4f8ef7' : '#252b3d'}`,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '12px',
                                fontWeight: 600,
                                color: '#fff',
                                cursor: 'pointer',
                                transition: 'all 0.15s',
                                flexShrink: 0,
                            }}
                        >
                            A
                        </button>

                        {/* Profile dropdown */}
                        {profileOpen && (
                            <div style={{
                                position: 'absolute',
                                top: '40px',
                                right: 0,
                                width: '220px',
                                background: '#0e1117',
                                border: '1px solid #1e2333',
                                borderRadius: '10px',
                                boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
                                overflow: 'hidden',
                                zIndex: 300,
                            }}>

                                {/* User info */}
                                <div style={{ padding: '14px 16px', borderBottom: '1px solid #1e2333' }}>
                                    <div style={{
                                        width: '38px', height: '38px', borderRadius: '50%',
                                        background: 'linear-gradient(135deg,#4f8ef7,#8b5cf6)',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        fontSize: '16px', fontWeight: 700, color: '#fff', marginBottom: '8px',
                                    }}>A</div>
                                    <div style={{ fontSize: '13px', fontWeight: 600, color: '#e2e8f7' }}>Anish</div>
                                    <div style={{ fontSize: '11px', color: '#4a5470', marginTop: '2px' }}>Pro Trader</div>
                                </div>

                                {/* Portfolio summary */}
                                <div style={{ padding: '10px 16px', borderBottom: '1px solid #1e2333', background: '#0a0c14' }}>
                                    <div style={{ fontSize: '10px', color: '#4a5470', marginBottom: '6px', letterSpacing: '0.5px', textTransform: 'uppercase' }}>Portfolio</div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                                        <span style={{ fontFamily: 'DM Mono,monospace', fontSize: '16px', fontWeight: 600, color: '#e2e8f7' }}>$47,469</span>
                                        <span style={{ fontFamily: 'DM Mono,monospace', fontSize: '11px', color: '#00d4a0' }}>+6.43%</span>
                                    </div>
                                    <div style={{ height: '3px', borderRadius: '2px', background: '#1e2333', marginTop: '6px', overflow: 'hidden' }}>
                                        <div style={{ height: '100%', width: '65%', background: 'linear-gradient(90deg,#4f8ef7,#00d4a0)', borderRadius: '2px' }} />
                                    </div>
                                </div>

                                {/* Menu items */}
                                {[
                                    { icon: '👤', label: 'Profile Settings', href: '/profile' },
                                    { icon: '📊', label: 'Trading History', href: '/portfolio' },
                                    { icon: '🔔', label: 'Notifications', href: '/' },
                                    { icon: '🔗', label: 'Connect Broker', href: '/broker' },
                                    { icon: '🤖', label: 'AI Advisor', href: '/ai-advisor' },
                                ].map((item, i) => (
                                    <Link key={i} href={item.href} style={{ textDecoration: 'none' }}>
                                        <div
                                            onClick={() => setProfileOpen(false)}
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '10px',
                                                padding: '10px 16px',
                                                fontSize: '12px',
                                                color: '#7b88aa',
                                                cursor: 'pointer',
                                                transition: 'all 0.12s',
                                                borderBottom: i < 4 ? '1px solid #1e2333' : 'none',
                                            }}
                                            onMouseEnter={e => {
                                                e.currentTarget.style.background = '#141720'
                                                e.currentTarget.style.color = '#e2e8f7'
                                            }}
                                            onMouseLeave={e => {
                                                e.currentTarget.style.background = 'transparent'
                                                e.currentTarget.style.color = '#7b88aa'
                                            }}
                                        >
                                            <span style={{ fontSize: '14px' }}>{item.icon}</span>
                                            {item.label}
                                        </div>
                                    </Link>
                                ))}

                                {/* Sign out */}
                                <div
                                    onClick={() => setProfileOpen(false)}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '10px',
                                        padding: '10px 16px',
                                        fontSize: '12px',
                                        color: '#ff4d6a',
                                        cursor: 'pointer',
                                        transition: 'all 0.12s',
                                        borderTop: '1px solid #1e2333',
                                    }}
                                    onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,77,106,0.08)')}
                                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                                >
                                    <span style={{ fontSize: '14px' }}>🚪</span>
                                    Sign Out
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </header>

            <style>{`
        @keyframes pulse {
          0%,100% { opacity:1; }
          50%      { opacity:0.4; }
        }
      `}</style>
        </>
    )
}