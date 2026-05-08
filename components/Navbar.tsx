'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useMarketStore } from '@/lib/store/useMarketStore'

const NAV = [
    { label: 'Markets', href: '/' },
    { label: 'Portfolio', href: '/portfolio' },
    { label: 'Signals', href: '/signals' },
    { label: 'AI Advisor', href: '/ai-advisor' },
    { label: 'News', href: '/news' },
]

export default function Navbar() {
    const pathname = usePathname()
    const isMarketOpen = useMarketStore((s) => s.isMarketOpen)

    return (
        <header style={{
            background: 'var(--bg2)',
            borderBottom: '1px solid var(--border)',
            height: '48px',
            display: 'flex',
            alignItems: 'center',
            padding: '0 20px',
            gap: '20px',
            position: 'sticky',
            top: 0,
            zIndex: 100,
        }}>

            <Link href="/" style={{ textDecoration: 'none' }}>
                <span style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '15px',
                    fontWeight: 600,
                    letterSpacing: '3px',
                    color: 'var(--text)',
                }}>
                    ASSET<span style={{ color: 'var(--blue)' }}>URA</span>
                </span>
            </Link>

            <nav style={{ display: 'flex', gap: '2px' }}>
                {NAV.map((link) => {
                    const active = pathname === link.href
                    return (
                        <Link key={link.href} href={link.href} style={{ textDecoration: 'none' }}>
                            <span style={{
                                padding: '5px 14px',
                                borderRadius: '5px',
                                fontSize: '12px',
                                fontWeight: 500,
                                color: active ? 'var(--text)' : 'var(--text2)',
                                background: active ? 'var(--bg4)' : 'transparent',
                                border: active ? '1px solid var(--border2)' : '1px solid transparent',
                                display: 'inline-block',
                                cursor: 'pointer',
                                transition: 'all 0.15s',
                            }}>
                                {link.label}
                            </span>
                        </Link>
                    )
                })}
            </nav>

            <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '14px' }}>

                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{
                        width: '7px',
                        height: '7px',
                        borderRadius: '50%',
                        background: isMarketOpen ? 'var(--green)' : 'var(--red)',
                        display: 'inline-block',
                        animation: 'pulse 2s infinite',
                    }} />
                    <span style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: '11px',
                        color: isMarketOpen ? 'var(--green)' : 'var(--text3)',
                    }}>
                        {isMarketOpen ? 'LIVE' : 'CLOSED'}
                    </span>
                </div>

                <input
                    placeholder="Search assets…"
                    style={{
                        background: 'var(--bg3)',
                        border: '1px solid var(--border)',
                        borderRadius: '5px',
                        padding: '5px 12px',
                        fontSize: '12px',
                        color: 'var(--text)',
                        width: '150px',
                        outline: 'none',
                        fontFamily: 'var(--font-sans)',
                    }}
                />

                <div style={{
                    width: '30px',
                    height: '30px',
                    borderRadius: '50%',
                    background: 'var(--bg4)',
                    border: '1px solid var(--border2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '12px',
                    fontWeight: 600,
                    color: 'var(--blue)',
                    cursor: 'pointer',
                }}>
                    A
                </div>
            </div>
        </header>
    )
}