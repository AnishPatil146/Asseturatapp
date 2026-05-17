'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useMarketStore } from '@/lib/store/useMarketStore'
import { useTradingStore } from '@/lib/store/useTradingStore'

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
    { symbol: 'BNB/USDT', name: 'BNB', type: 'Crypto', color: '#f3ba2f', href: '/?asset=CRYPTO' },
    { symbol: 'DOGE/USDT', name: 'Dogecoin', type: 'Crypto', color: '#c2a633', href: '/?asset=CRYPTO' },
    { symbol: 'AAPL', name: 'Apple Inc.', type: 'Stock', color: '#4f8ef7', href: '/?asset=STOCKS' },
    { symbol: 'NVDA', name: 'Nvidia', type: 'Stock', color: '#76b900', href: '/?asset=STOCKS' },
    { symbol: 'TSLA', name: 'Tesla', type: 'Stock', color: '#e31937', href: '/?asset=STOCKS' },
    { symbol: 'MSFT', name: 'Microsoft', type: 'Stock', color: '#00a4ef', href: '/?asset=STOCKS' },
    { symbol: 'GOOGL', name: 'Alphabet', type: 'Stock', color: '#4285f4', href: '/?asset=STOCKS' },
    { symbol: 'AMZN', name: 'Amazon', type: 'Stock', color: '#ff9900', href: '/?asset=STOCKS' },
    { symbol: 'META', name: 'Meta', type: 'Stock', color: '#1877f2', href: '/?asset=STOCKS' },
    { symbol: 'EUR/USD', name: 'Euro / Dollar', type: 'Forex', color: '#00d4a0', href: '/?asset=FOREX' },
    { symbol: 'GBP/USD', name: 'Pound/Dollar', type: 'Forex', color: '#00d4a0', href: '/?asset=FOREX' },
    { symbol: 'USD/JPY', name: 'Dollar/Yen', type: 'Forex', color: '#00d4a0', href: '/?asset=FOREX' },
    { symbol: 'SPX', name: 'S&P 500', type: 'Index', color: '#f5a623', href: '/?asset=OPTIONS' },
    { symbol: 'NDX', name: 'Nasdaq 100', type: 'Index', color: '#f5a623', href: '/?asset=OPTIONS' },
    { symbol: 'Gold', name: 'Gold Futures', type: 'Futures', color: '#FFD700', href: '/?asset=OPTIONS' },
    { symbol: 'Oil', name: 'Crude Oil', type: 'Futures', color: '#f5a623', href: '/?asset=OPTIONS' },
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

const CATEGORIES = ['All', 'Crypto', 'Stock', 'Forex', 'Index', 'Futures']

export default function Navbar() {
    const pathname = usePathname()
    const router = useRouter()
    const isMarketOpen = useMarketStore(s => s.isMarketOpen)
    const setSelectedStock = useTradingStore(s => s.setSelectedStock)

    const [search, setSearch] = useState('')
    const [searchOpen, setSearchOpen] = useState(false)
    const [profileOpen, setProfileOpen] = useState(false)
    const [searchFocus, setSearchFocus] = useState(false)
    const [activeCategory, setActiveCategory] = useState('All')

    const searchRef = useRef<HTMLDivElement>(null)
    const profileRef = useRef<HTMLDivElement>(null)
    const inputRef = useRef<HTMLInputElement>(null)

    const filtered = SEARCH_RESULTS.filter(r => {
        const matchCat = activeCategory === 'All' || r.type === activeCategory
        const matchText = search.length === 0
            ? true
            : r.symbol.toLowerCase().includes(search.toLowerCase()) ||
            r.name.toLowerCase().includes(search.toLowerCase()) ||
            r.type.toLowerCase().includes(search.toLowerCase())
        return matchCat && matchText
    }).slice(0, 8)

    // Close on outside click
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

    // Ctrl+K shortcut
    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault()
                setSearchOpen(true)
                setSearchFocus(true)
                setTimeout(() => inputRef.current?.focus(), 50)
            }
        }
        document.addEventListener('keydown', handler)
        return () => document.removeEventListener('keydown', handler)
    }, [])

    const handleSearchSelect = (item: typeof SEARCH_RESULTS[0]) => {
        setSearch('')
        setSearchOpen(false)
        setSearchFocus(false)
        setActiveCategory('All')
        inputRef.current?.blur()
        
        // Mock current price based on type for the demo modal
        const mockPrice = item.type === 'Crypto' ? (item.symbol.includes('BTC') ? 67420 : 3120) :
                         item.type === 'Stock' ? (item.symbol === 'AAPL' ? 189 : 450) :
                         item.type === 'Forex' ? 1.08 : 5100
        const mockChange = (Math.random() * 4) - 1.5

        setSelectedStock({
            symbol: item.symbol,
            name: item.name,
            price: mockPrice,
            change: mockChange,
            color: item.color,
            type: item.type
        })
    }

    const handleSearchKey = (e: React.KeyboardEvent) => {
        if (e.key === 'Escape') {
            setSearchOpen(false)
            setSearchFocus(false)
            setSearch('')
            setActiveCategory('All')
        }
        if (e.key === 'Enter' && filtered.length > 0) {
            handleSearchSelect(filtered[0])
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
                gap: '16px',
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

                    {/* Live dot */}
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
                        <div
                            onClick={() => {
                                setSearchOpen(true)
                                setSearchFocus(true)
                                inputRef.current?.focus()
                            }}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                background: searchFocus ? '#1a1e2a' : '#141720',
                                border: `1px solid ${searchFocus ? '#4f8ef7' : '#1e2333'}`,
                                borderRadius: '6px',
                                padding: '0 12px',
                                height: '30px',
                                width: searchFocus ? '220px' : '160px',
                                transition: 'all 0.2s',
                                cursor: 'text',
                            }}
                        >
                            <svg
                                width="12" height="12" viewBox="0 0 24 24"
                                fill="none" stroke={searchFocus ? '#4f8ef7' : '#4a5470'}
                                strokeWidth="2.5" strokeLinecap="round"
                            >
                                <circle cx="11" cy="11" r="8" />
                                <path d="m21 21-4.35-4.35" />
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

                            <span style={{
                                fontSize: '9px',
                                color: '#4a5470',
                                whiteSpace: 'nowrap',
                                letterSpacing: '0.5px',
                                flexShrink: 0,
                            }}>
                                ⌘K
                            </span>

                            {search && (
                                <button
                                    onClick={e => {
                                        e.stopPropagation()
                                        setSearch('')
                                        inputRef.current?.focus()
                                    }}
                                    style={{
                                        background: 'none',
                                        border: 'none',
                                        cursor: 'pointer',
                                        padding: 0,
                                        color: '#4a5470',
                                        fontSize: '16px',
                                        lineHeight: 1,
                                        marginLeft: '2px',
                                        flexShrink: 0,
                                    }}
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
                                width: '320px',
                                background: '#0e1117',
                                border: '1px solid #1e2333',
                                borderRadius: '10px',
                                boxShadow: '0 12px 40px rgba(0,0,0,0.7)',
                                overflow: 'hidden',
                                zIndex: 300,
                            }}>

                                {/* Category pills */}
                                <div style={{
                                    padding: '10px 12px',
                                    borderBottom: '1px solid #1e2333',
                                    display: 'flex',
                                    gap: '6px',
                                    flexWrap: 'wrap',
                                }}>
                                    {CATEGORIES.map(cat => (
                                        <button
                                            key={cat}
                                            onClick={() => setActiveCategory(cat)}
                                            style={{
                                                padding: '3px 12px',
                                                borderRadius: '20px',
                                                fontSize: '10px',
                                                fontWeight: 500,
                                                cursor: 'pointer',
                                                border: `1px solid ${activeCategory === cat ? '#4f8ef7' : '#1e2333'}`,
                                                background: activeCategory === cat ? 'rgba(79,142,247,0.15)' : 'transparent',
                                                color: activeCategory === cat ? '#4f8ef7' : '#7b88aa',
                                                fontFamily: 'DM Sans,sans-serif',
                                                transition: 'all 0.12s',
                                            }}
                                        >
                                            {cat}
                                        </button>
                                    ))}
                                </div>

                                {/* Results */}
                                <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                                    {filtered.length === 0 ? (
                                        <div style={{
                                            padding: '24px',
                                            textAlign: 'center',
                                            fontSize: '12px',
                                            color: '#4a5470',
                                        }}>
                                            {search
                                                ? `No results for "${search}"`
                                                : `No ${activeCategory} assets`}
                                        </div>
                                    ) : (
                                        filtered.map((r, i) => (
                                            <div
                                                key={i}
                                                onClick={() => handleSearchSelect(r)}
                                                onMouseEnter={e => (e.currentTarget.style.background = '#141720')}
                                                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                                                style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    padding: '10px 14px',
                                                    gap: '12px',
                                                    cursor: 'pointer',
                                                    borderBottom: i < filtered.length - 1 ? '1px solid #1a1e2a' : 'none',
                                                    transition: 'background 0.12s',
                                                }}
                                            >
                                                {/* Icon */}
                                                <div style={{
                                                    width: '34px',
                                                    height: '34px',
                                                    borderRadius: '50%',
                                                    background: r.color + '18',
                                                    border: `1px solid ${r.color}40`,
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    fontSize: '12px',
                                                    fontWeight: 700,
                                                    color: r.color,
                                                    flexShrink: 0,
                                                    fontFamily: 'DM Mono,monospace',
                                                }}>
                                                    {r.symbol[0]}
                                                </div>

                                                {/* Info */}
                                                <div style={{ flex: 1, minWidth: 0 }}>
                                                    <div style={{ fontSize: '13px', fontWeight: 600, color: '#e2e8f7' }}>
                                                        {r.symbol}
                                                    </div>
                                                    <div style={{ fontSize: '11px', color: '#4a5470', marginTop: '1px' }}>
                                                        {r.name}
                                                    </div>
                                                </div>

                                                {/* Type badge */}
                                                <span style={{
                                                    padding: '2px 8px',
                                                    borderRadius: '4px',
                                                    fontSize: '10px',
                                                    fontWeight: 500,
                                                    background: TYPE_COLORS[r.type] || '#1a1e2a',
                                                    color: TYPE_TEXT[r.type] || '#7b88aa',
                                                    flexShrink: 0,
                                                    letterSpacing: '0.3px',
                                                }}>
                                                    {r.type}
                                                </span>
                                            </div>
                                        ))
                                    )}
                                </div>

                                {/* Footer hints */}
                                <div style={{
                                    padding: '8px 14px',
                                    borderTop: '1px solid #1e2333',
                                    fontSize: '10px',
                                    color: '#3a3f52',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    background: '#0a0c14',
                                }}>
                                    <span>↑↓ navigate</span>
                                    <span>↵ open</span>
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
                                background: profileOpen
                                    ? 'linear-gradient(135deg,#4f8ef7,#8b5cf6)'
                                    : 'linear-gradient(135deg,#1a1e2a,#252b3d)',
                                border: `1px solid ${profileOpen ? '#4f8ef7' : '#252b3d'}`,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '12px',
                                fontWeight: 700,
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
                                top: '42px',
                                right: 0,
                                width: '240px',
                                background: '#0e1117',
                                border: '1px solid #1e2333',
                                borderRadius: '12px',
                                boxShadow: '0 12px 40px rgba(0,0,0,0.7)',
                                overflow: 'hidden',
                                zIndex: 300,
                            }}>

                                {/* User info */}
                                <div style={{ padding: '16px', borderBottom: '1px solid #1e2333' }}>
                                    <div style={{
                                        width: '42px',
                                        height: '42px',
                                        borderRadius: '50%',
                                        background: 'linear-gradient(135deg,#4f8ef7,#8b5cf6)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontSize: '18px',
                                        fontWeight: 700,
                                        color: '#fff',
                                        marginBottom: '10px',
                                    }}>
                                        A
                                    </div>
                                    <div style={{ fontSize: '14px', fontWeight: 600, color: '#e2e8f7' }}>Anish</div>
                                    <div style={{ fontSize: '11px', color: '#4a5470', marginTop: '2px' }}>Pro Trader · Assetura</div>
                                </div>

                                {/* Portfolio card */}
                                <div style={{
                                    padding: '12px 16px',
                                    borderBottom: '1px solid #1e2333',
                                    background: '#0a0c14',
                                }}>
                                    <div style={{
                                        fontSize: '10px',
                                        color: '#4a5470',
                                        marginBottom: '6px',
                                        letterSpacing: '0.5px',
                                        textTransform: 'uppercase',
                                    }}>
                                        Portfolio Value
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '8px' }}>
                                        <span style={{ fontFamily: 'DM Mono,monospace', fontSize: '18px', fontWeight: 600, color: '#e2e8f7' }}>
                                            $47,469
                                        </span>
                                        <span style={{ fontFamily: 'DM Mono,monospace', fontSize: '11px', color: '#00d4a0' }}>
                                            +$2,869 · +6.43%
                                        </span>
                                    </div>
                                    <div style={{
                                        height: '4px',
                                        borderRadius: '2px',
                                        background: '#1e2333',
                                        overflow: 'hidden',
                                        display: 'flex',
                                        gap: '2px',
                                    }}>
                                        <div style={{ width: '59%', background: '#f7931a', borderRadius: '2px' }} />
                                        <div style={{ width: '23%', background: '#627eea', borderRadius: '2px' }} />
                                        <div style={{ width: '9%', background: '#76b900', borderRadius: '2px' }} />
                                        <div style={{ flex: 1, background: '#4f8ef7', borderRadius: '2px' }} />
                                    </div>
                                    <div style={{ display: 'flex', gap: '10px', marginTop: '5px' }}>
                                        {[
                                            { label: 'BTC', color: '#f7931a' },
                                            { label: 'ETH', color: '#627eea' },
                                            { label: 'NVDA', color: '#76b900' },
                                        ].map(a => (
                                            <div key={a.label} style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                                                <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: a.color, display: 'inline-block' }} />
                                                <span style={{ fontSize: '9px', color: '#4a5470' }}>{a.label}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Menu items */}
                                {[
                                    { icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>, label: 'Profile Settings', href: '/profile' },
                                    { icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v18h18"/><path d="M18 17V9"/><path d="M13 17V5"/><path d="M8 17v-3"/></svg>, label: 'Trading History', href: '/portfolio' },
                                    { icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>, label: 'Notifications', href: '/' },
                                    { icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>, label: 'Connect Broker', href: '/broker' },
                                    { icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><path d="M9 10v4"/><path d="M15 10v4"/></svg>, label: 'AI Advisor', href: '/ai-advisor' },
                                    { icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-2 2Zm0 0a2 2 0 0 1-2-2v-9c0-1.1.9-2 2-2h2"/><path d="M18 14h-8"/><path d="M15 18h-5"/><path d="M10 6h8v4h-8V6Z"/></svg>, label: 'Market News', href: '/news' },
                                ].map((item, i, arr) => (
                                    <Link key={i} href={item.href} style={{ textDecoration: 'none' }}>
                                        <div
                                            onClick={() => setProfileOpen(false)}
                                            onMouseEnter={e => {
                                                e.currentTarget.style.background = '#141720'
                                                const label = e.currentTarget.querySelector('.menu-label') as HTMLElement
                                                if (label) label.style.color = '#e2e8f7'
                                            }}
                                            onMouseLeave={e => {
                                                e.currentTarget.style.background = 'transparent'
                                                const label = e.currentTarget.querySelector('.menu-label') as HTMLElement
                                                if (label) label.style.color = '#7b88aa'
                                            }}
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '10px',
                                                padding: '10px 16px',
                                                cursor: 'pointer',
                                                transition: 'all 0.12s',
                                                borderBottom: i < arr.length - 1 ? '1px solid #1a1e2a' : 'none',
                                            }}
                                        >
                                            <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '20px', color: '#7b88aa' }}>
                                                {item.icon}
                                            </span>
                                            <span className="menu-label" style={{ fontSize: '12px', color: '#7b88aa', transition: 'color 0.12s' }}>
                                                {item.label}
                                            </span>
                                            <span style={{ marginLeft: 'auto', fontSize: '10px', color: '#3a3f52' }}>›</span>
                                        </div>
                                    </Link>
                                ))}

                                {/* Sign out */}
                                <div
                                    onClick={() => setProfileOpen(false)}
                                    onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,77,106,0.08)')}
                                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
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
                                >
                                    <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '20px' }}>
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" x2="9" y1="12" y2="12"/></svg>
                                    </span>
                                    Sign Out
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </header>

            <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.35; }
        }
      `}</style>
        </>
    )
}