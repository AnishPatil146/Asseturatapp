'use client'

import { useState } from 'react'
import Navbar from '@/components/Navbar'
import { useTradingStore } from '@/lib/store/useTradingStore'

export default function ProfilePage() {
  const [activeTab, setActiveTab] = useState('general')
  
  // Local states for functional-looking toggles
  const [oneClick, setOneClick] = useState(false)
  const [soundNotify, setSoundNotify] = useState(true)
  const [twoFactor, setTwoFactor] = useState(true)
  const [name, setName] = useState('Anish')
  const [phone, setPhone] = useState('')

  return (
    <main style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', flexDirection: 'column' }}>
      <Navbar />

      <div style={{ flex: 1, padding: '40px 20px', maxWidth: '1200px', margin: '0 auto', width: '100%' }}>
        {/* Header */}
        <div style={{ marginBottom: '32px' }}>
          <h1 style={{ fontSize: '28px', fontWeight: 600, color: 'var(--text)', marginBottom: '8px', letterSpacing: '-0.5px' }}>
            Profile & Settings
          </h1>
          <p style={{ color: 'var(--text-2)', fontSize: '14px' }}>
            Manage your account preferences, security, and API connections.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: '32px', alignItems: 'start' }}>
          
          {/* LEFT COLUMN - Navigation & User Card */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            
            {/* User Card */}
            <div className="panel" style={{ padding: '24px', borderRadius: '12px', textAlign: 'center' }}>
              <div style={{
                width: '80px', height: '80px', borderRadius: '50%', margin: '0 auto 16px',
                background: 'linear-gradient(135deg, var(--blue), var(--purple))',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '32px', fontWeight: 700, color: '#fff',
                boxShadow: '0 8px 24px rgba(79, 142, 247, 0.25)',
              }}>
                {name ? name[0].toUpperCase() : 'A'}
              </div>
              <h2 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text)', marginBottom: '4px' }}>{name}</h2>
              <p style={{ fontSize: '13px', color: 'var(--text-3)', marginBottom: '16px' }}>anish@assetura.com</p>
              
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 12px', background: 'rgba(240,185,11,0.1)', borderRadius: '20px', border: '1px solid rgba(240,185,11,0.2)' }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--accent)' }} />
                <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Pro Trader</span>
              </div>
            </div>

            {/* Sidebar Menu */}
            <div className="panel" style={{ borderRadius: '12px', padding: '12px 0' }}>
              {[
                { id: 'general', label: 'General Info' },
                { id: 'security', label: 'Security & 2FA' },
                { id: 'preferences', label: 'Preferences' },
                { id: 'api', label: 'API Keys' },
                { id: 'billing', label: 'Billing & Plans' },
              ].map(item => (
                <div key={item.id} onClick={() => setActiveTab(item.id)} style={{
                  padding: '12px 24px', cursor: 'pointer', fontSize: '14px', fontWeight: 500,
                  color: activeTab === item.id ? 'var(--text)' : 'var(--text-2)',
                  background: activeTab === item.id ? 'var(--bg-surf)' : 'transparent',
                  borderLeft: activeTab === item.id ? '3px solid var(--accent)' : '3px solid transparent',
                  transition: 'all 0.15s ease'
                }}
                onMouseEnter={e => { if (activeTab !== item.id) e.currentTarget.style.color = 'var(--text)' }}
                onMouseLeave={e => { if (activeTab !== item.id) e.currentTarget.style.color = 'var(--text-2)' }}
                >
                  {item.label}
                </div>
              ))}
            </div>
          </div>

          {/* RIGHT COLUMN - Content */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            
            {activeTab === 'general' && (
              <div className="panel" style={{ borderRadius: '12px', padding: '28px', animation: 'fade-in 0.3s' }}>
                <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text)', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--blue)' }}><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                  Personal Information
                </h3>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <label style={{ fontSize: '11px', color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 600 }}>Full Name</label>
                    <input type="text" value={name} onChange={e => setName(e.target.value)} style={{
                      background: 'var(--bg-surf)', border: '1px solid var(--border)', borderRadius: '6px',
                      padding: '12px 14px', color: 'var(--text)', fontSize: '14px', outline: 'none',
                      transition: 'border-color 0.15s'
                    }} onFocus={e => e.currentTarget.style.borderColor = 'var(--accent)'} onBlur={e => e.currentTarget.style.borderColor = 'var(--border)'} />
                  </div>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <label style={{ fontSize: '11px', color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 600 }}>Email Address</label>
                    <input type="email" defaultValue="anish@assetura.com" readOnly style={{
                      background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)', borderRadius: '6px',
                      padding: '12px 14px', color: 'var(--text-2)', fontSize: '14px', outline: 'none', cursor: 'not-allowed'
                    }} />
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <label style={{ fontSize: '11px', color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 600 }}>Phone Number</label>
                    <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+1 (555) 000-0000" style={{
                      background: 'var(--bg-surf)', border: '1px solid var(--border)', borderRadius: '6px',
                      padding: '12px 14px', color: 'var(--text)', fontSize: '14px', outline: 'none',
                      transition: 'border-color 0.15s'
                    }} onFocus={e => e.currentTarget.style.borderColor = 'var(--accent)'} onBlur={e => e.currentTarget.style.borderColor = 'var(--border)'} />
                  </div>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <label style={{ fontSize: '11px', color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 600 }}>Timezone</label>
                    <select style={{
                      background: 'var(--bg-surf)', border: '1px solid var(--border)', borderRadius: '6px',
                      padding: '12px 14px', color: 'var(--text)', fontSize: '14px', outline: 'none',
                      appearance: 'none', cursor: 'pointer'
                    }}>
                      <option>UTC-05:00 Eastern Time (US & Canada)</option>
                      <option>UTC+00:00 Greenwich Mean Time</option>
                      <option>UTC+05:30 Indian Standard Time</option>
                    </select>
                  </div>
                </div>

                <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'flex-end' }}>
                  <button style={{
                    background: 'var(--accent)', color: '#000', border: 'none', borderRadius: '6px',
                    padding: '10px 24px', fontSize: '13px', fontWeight: 600, cursor: 'pointer',
                    transition: 'opacity 0.15s'
                  }} onMouseEnter={e => e.currentTarget.style.opacity = '0.9'} onMouseLeave={e => e.currentTarget.style.opacity = '1'}>
                    Save Changes
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'security' && (
              <div className="panel" style={{ borderRadius: '12px', padding: '28px', animation: 'fade-in 0.3s' }}>
                <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text)', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--neon-green)' }}><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                  Security & Authentication
                </h3>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '20px', borderBottom: '1px solid var(--border)' }}>
                    <div>
                      <div style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text)', marginBottom: '4px' }}>Two-Factor Authentication (2FA)</div>
                      <div style={{ fontSize: '12px', color: 'var(--text-3)' }}>Secure your account using an authenticator app</div>
                    </div>
                    <div onClick={() => setTwoFactor(!twoFactor)} style={{ width: '40px', height: '22px', borderRadius: '11px', background: twoFactor ? 'rgba(0, 230, 118, 0.2)' : 'var(--bg-surf)', border: `1px solid ${twoFactor ? 'var(--neon-green)' : 'var(--border)'}`, position: 'relative', cursor: 'pointer', transition: 'all 0.2s' }}>
                      <div style={{ width: '16px', height: '16px', borderRadius: '50%', background: twoFactor ? 'var(--neon-green)' : 'var(--text-2)', position: 'absolute', top: '2px', left: twoFactor ? '19px' : '3px', transition: 'all 0.2s' }} />
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '20px', borderBottom: '1px solid var(--border)' }}>
                    <div>
                      <div style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text)', marginBottom: '4px' }}>Change Password</div>
                      <div style={{ fontSize: '12px', color: 'var(--text-3)' }}>Update your account password securely</div>
                    </div>
                    <button style={{ background: 'transparent', border: '1px solid var(--border)', borderRadius: '6px', padding: '6px 14px', color: 'var(--text)', fontSize: '12px', cursor: 'pointer' }}>Update</button>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontSize: '14px', fontWeight: 500, color: '#e31937', marginBottom: '4px' }}>Deactivate Account</div>
                      <div style={{ fontSize: '12px', color: 'var(--text-3)' }}>Permanently close your Assetura account</div>
                    </div>
                    <button style={{ background: 'rgba(227, 25, 55, 0.1)', border: '1px solid #e31937', borderRadius: '6px', padding: '6px 14px', color: '#e31937', fontSize: '12px', cursor: 'pointer' }}>Deactivate</button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'preferences' && (
              <div className="panel" style={{ borderRadius: '12px', padding: '28px', animation: 'fade-in 0.3s' }}>
                <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text)', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--amber)' }}><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
                  Trading Preferences
                </h3>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '16px', borderBottom: '1px solid var(--border)' }}>
                    <div>
                      <div style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text)', marginBottom: '4px' }}>One-Click Trading</div>
                      <div style={{ fontSize: '12px', color: 'var(--text-3)' }}>Bypass order confirmation dialogs for faster execution</div>
                    </div>
                    <div onClick={() => setOneClick(!oneClick)} style={{ width: '40px', height: '22px', borderRadius: '11px', background: oneClick ? 'rgba(0, 230, 118, 0.2)' : 'var(--bg-surf)', border: `1px solid ${oneClick ? 'var(--neon-green)' : 'var(--border)'}`, position: 'relative', cursor: 'pointer', transition: 'all 0.2s' }}>
                      <div style={{ width: '16px', height: '16px', borderRadius: '50%', background: oneClick ? 'var(--neon-green)' : 'var(--text-2)', position: 'absolute', top: '2px', left: oneClick ? '19px' : '3px', transition: 'all 0.2s' }} />
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '16px', borderBottom: '1px solid var(--border)' }}>
                    <div>
                      <div style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text)', marginBottom: '4px' }}>Sound Notifications</div>
                      <div style={{ fontSize: '12px', color: 'var(--text-3)' }}>Play audio alerts for order fills and price triggers</div>
                    </div>
                    <div onClick={() => setSoundNotify(!soundNotify)} style={{ width: '40px', height: '22px', borderRadius: '11px', background: soundNotify ? 'rgba(0, 230, 118, 0.2)' : 'var(--bg-surf)', border: `1px solid ${soundNotify ? 'var(--neon-green)' : 'var(--border)'}`, position: 'relative', cursor: 'pointer', transition: 'all 0.2s' }}>
                      <div style={{ width: '16px', height: '16px', borderRadius: '50%', background: soundNotify ? 'var(--neon-green)' : 'var(--text-2)', position: 'absolute', top: '2px', left: soundNotify ? '19px' : '3px', transition: 'all 0.2s' }} />
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text)', marginBottom: '4px' }}>Default Order Type</div>
                      <div style={{ fontSize: '12px', color: 'var(--text-3)' }}>Initial selection when opening the trade panel</div>
                    </div>
                    <select style={{
                      background: 'var(--bg-surf)', border: '1px solid var(--border)', borderRadius: '6px',
                      padding: '8px 12px', color: 'var(--text)', fontSize: '12px', outline: 'none'
                    }}>
                      <option>Limit Order</option>
                      <option>Market Order</option>
                      <option>Stop Limit</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'api' && (
              <div className="panel" style={{ borderRadius: '12px', padding: '28px', animation: 'fade-in 0.3s' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                  <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--purple)' }}><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
                    Connected Exchanges
                  </h3>
                  <button style={{
                    background: 'var(--bg-surf)', border: '1px solid var(--border)', borderRadius: '6px',
                    padding: '6px 12px', fontSize: '12px', color: 'var(--text)', cursor: 'pointer',
                    transition: 'border 0.15s'
                  }} onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--text-3)'} onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}>
                    Add New Key
                  </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '16px', border: '1px solid var(--border)', borderRadius: '8px',
                    background: 'var(--bg-surf)'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ width: '32px', height: '32px', borderRadius: '6px', background: '#F3BA2F', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#000', fontWeight: 'bold' }}>B</div>
                      <div>
                        <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text)' }}>Binance Global API</div>
                        <div style={{ fontSize: '11px', color: 'var(--text-3)', fontFamily: 'var(--font-mono)' }}>Last synced: 2m ago</div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                      <span style={{ fontSize: '12px', color: 'var(--neon-green)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--neon-green)', display: 'inline-block' }} /> Active
                      </span>
                      <button style={{ background: 'none', border: 'none', color: 'var(--text-3)', cursor: 'pointer', fontSize: '12px' }}>Revoke</button>
                    </div>
                  </div>

                  <div style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '16px', border: '1px solid var(--border)', borderRadius: '8px',
                    background: 'rgba(0, 212, 160, 0.05)', borderColor: 'rgba(0, 212, 160, 0.2)'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ width: '32px', height: '32px', borderRadius: '6px', background: 'var(--neon-green)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 'bold' }}>P</div>
                      <div>
                        <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text)' }}>Paper Trading</div>
                        <div style={{ fontSize: '11px', color: 'var(--text-3)', fontFamily: 'var(--font-mono)' }}>Balance: $100,000.00</div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                      <span style={{ fontSize: '12px', color: 'var(--neon-green)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--neon-green)', display: 'inline-block' }} /> Active
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'billing' && (
              <div className="panel" style={{ borderRadius: '12px', padding: '28px', animation: 'fade-in 0.3s' }}>
                <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text)', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--amber)' }}><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>
                  Billing & Plans
                </h3>
                
                <div style={{ border: '1px solid var(--accent)', borderRadius: '8px', padding: '20px', background: 'rgba(240, 185, 11, 0.05)', marginBottom: '24px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--accent)' }}>Pro Trader Tier</div>
                    <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text)' }}>$29<span style={{ fontSize: '14px', color: 'var(--text-3)', fontWeight: 500 }}>/mo</span></div>
                  </div>
                  <div style={{ fontSize: '13px', color: 'var(--text-2)', marginBottom: '16px' }}>You are currently on the Pro plan with unlimited API usage, live websocket streams, and advanced indicators.</div>
                  <button style={{ background: 'var(--bg-surf)', border: '1px solid var(--accent)', borderRadius: '6px', padding: '8px 16px', color: 'var(--accent)', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>Manage Subscription</button>
                </div>

                <h4 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text)', marginBottom: '12px' }}>Payment Methods</h4>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', border: '1px solid var(--border)', borderRadius: '8px', background: 'var(--bg-surf)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: '40px', height: '24px', background: '#fff', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <span style={{ color: '#1a1f36', fontWeight: 800, fontSize: '12px', fontStyle: 'italic' }}>VISA</span>
                    </div>
                    <div>
                      <div style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text)' }}>Visa ending in 4242</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-3)' }}>Expires 12/28</div>
                    </div>
                  </div>
                  <button style={{ background: 'none', border: 'none', color: 'var(--text-3)', cursor: 'pointer', fontSize: '12px' }}>Remove</button>
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
      
      <style>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(4px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </main>
  )
}
