'use client';

import { useState, useEffect, useCallback } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import {
    Users, Building2, BarChart3, Eye, RefreshCw, Sun, Moon,
    AlertTriangle, X
} from 'lucide-react';
import Link from 'next/link';
import FredChat from './FredChat';

export default function DashboardLayout({ children, loading, lastFetched, fetchData, theme, toggleTheme, autoRefresh, setAutoRefresh, devMode, setDevMode, viewConfig, data }) {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [fredOpen, setFredOpen] = useState(false);
    const pathname = usePathname();
    const currentView = pathname.split('/').pop() || 'individual';

    const navItems = [
        { id: 'individual', label: 'Individual', icon: Users, desc: 'Per-person execution', path: '/individual' },
        { id: 'squads', label: 'Squads', icon: Building2, desc: 'Squad rollups', path: '/squads' },
        { id: 'company', label: 'Company', icon: BarChart3, desc: 'Execution overview', path: '/company' },
        { id: 'executive', label: 'Executive', icon: Eye, desc: '10-min view', path: '/executive' },
    ];

    return (
        <div className="app-layout">
            <FredChat isOpen={fredOpen} onClose={() => setFredOpen(false)} data={data} />
            {/* Sidebar */}
            <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
                <div className="sidebar-header">
                    <div className="sidebar-logo" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '8px' }}>
                        <img src="/fireflies.webp" alt="Fireflies.ai" style={{ height: '28px', width: 'auto' }} />
                        <div className="sidebar-logo-subtitle" style={{ fontSize: '0.625rem', lineHeight: '1.2' }}>
                            Execution Intelligence
                            <br />
                            (Team Accountability Dashboard)
                        </div>
                    </div>
                </div>

                <nav className="sidebar-nav">
                    <div className="nav-section-label">Views</div>
                    {navItems.map(item => (
                        <Link
                            key={item.id}
                            href={item.path}
                            className={`nav-item ${currentView === item.id ? 'active' : ''}`}
                            onClick={() => setSidebarOpen(false)}
                            style={{ textDecoration: 'none' }}
                        >
                            <item.icon className="nav-item-icon" size={18} />
                            <div>
                                <div>{item.label}</div>
                                <div style={{ fontSize: '0.6875rem', opacity: 0.7, fontWeight: 400 }}>{item.desc}</div>
                            </div>
                        </Link>
                    ))}
                </nav>

                <div className="sidebar-footer" style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: '16px', borderTop: '1px solid var(--border-primary)' }}>
                    <div className="toggle-wrapper" onClick={() => setAutoRefresh(!autoRefresh)} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div className={`toggle ${autoRefresh ? 'active' : ''}`}>
                            <div className="toggle-knob" />
                        </div>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            Auto refresh
                            {autoRefresh && (
                                <img src="/fred-icon.svg" alt="" style={{ width: '14px', height: '14px' }} className="animate-spin-slow" />
                            )}
                        </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {lastFetched && (
                            <div className="live-dot" title={`Last synced: ${new Date(lastFetched).toLocaleTimeString()}`} />
                        )}
                        <div
                            className={`fred-toggle ${fredOpen ? 'active' : 'animate-float'}`}
                            style={{
                                width: '32px', height: '32px', borderRadius: '50%',
                                background: fredOpen ? 'var(--brand-primary)' : 'var(--bg-tertiary)',
                                color: fredOpen ? 'white' : 'var(--text-secondary)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                border: '1px solid var(--border-secondary)',
                                cursor: 'pointer',
                                transition: 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                                overflow: 'hidden',
                                boxShadow: fredOpen ? '0 0 0 2px var(--brand-primary)' : 'none'
                            }}
                            onClick={() => setFredOpen(true)}
                            title="Speak with Fred"
                        >
                            <img
                                src="/fred-icon.svg"
                                alt="Fred"
                                style={{
                                    width: '100%',
                                    height: '100%',
                                    objectFit: 'contain',
                                    transform: fredOpen ? 'scale(1.1)' : 'scale(1)'
                                }}
                            />
                        </div>
                    </div>
                </div>

                {/* Dev Mode Secret Toggle */}
                <div
                    onClick={() => setDevMode(!devMode)}
                    style={{
                        position: 'absolute',
                        bottom: '16px',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        width: '20px',
                        height: '20px',
                        opacity: 0.1,
                        cursor: 'pointer'
                    }}
                    title="Toggle Dev Mode"
                />
            </aside>

            {/* Main Content */}
            < main className="main-content" >
                <header className="page-header">
                    <div className="page-header-left">
                        <button className="btn btn-ghost btn-icon mobile-menu-btn" onClick={() => setSidebarOpen(!sidebarOpen)}>
                            ☰
                        </button>
                        <h1 className="page-title">{viewConfig[currentView]?.title || 'Dashboard'}</h1>
                        <p className="page-subtitle">{viewConfig[currentView]?.subtitle || 'Execution Intelligence'}</p>
                    </div>
                    <div className="page-header-actions" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>

                        {lastFetched && (
                            <div className="last-fetched" style={{ marginRight: '8px' }}>
                                <div className="live-dot" />
                                {new Date(lastFetched).toLocaleTimeString()}
                            </div>
                        )}
                        <button className="btn btn-sm" onClick={() => fetchData(true)} disabled={loading}>
                            <RefreshCw size={14} className={loading ? 'loading-pulse' : ''} />
                            {loading ? 'Syncing...' : 'Refresh'}
                        </button>
                        <button className="btn btn-icon" onClick={toggleTheme} title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}>
                            {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
                        </button>
                        <Link
                            href="/guide/future.html"
                            className="fred-vision-link"
                            title="Fred Pitch Hub & Future Vision"
                            style={{
                                width: '32px', height: '32px', borderRadius: '50%',
                                background: 'var(--brand-primary)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                transition: 'all 0.3s ease',
                                boxShadow: '0 0 15px rgba(124, 58, 237, 0.3)',
                                overflow: 'hidden',
                                border: '1px solid rgba(255,255,255,0.1)'
                            }}
                        >
                            <img src="/fred-3d-3.svg" alt="Fred Vision" style={{ width: '140%', height: '140%', objectFit: 'cover', objectPosition: 'center top', marginTop: '10%' }} />
                        </Link>
                    </div>
                </header>

                {children}

                {/* Dev Console Overlay */}
                {
                    devMode && (
                        <div style={{
                            position: 'fixed', bottom: '20px', right: '20px',
                            width: '300px', background: 'var(--bg-elevated)', border: '1px solid var(--border-primary)',
                            borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-lg)', zIndex: 2000,
                            padding: '16px', fontSize: '0.75rem', fontFamily: 'monospace'
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-secondary)', paddingBottom: '8px', marginBottom: '8px' }}>
                                <strong style={{ color: 'var(--brand-primary)' }}>DEV CONSOLE</strong>
                                <X size={14} style={{ cursor: 'pointer' }} onClick={() => setDevMode(false)} />
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                <div><strong>View:</strong> {currentView}</div>
                                <div><strong>Path:</strong> {pathname}</div>
                                <div><strong>Theme:</strong> {theme}</div>
                            </div>
                        </div>
                    )
                }
            </main >
        </div >
    );
}
