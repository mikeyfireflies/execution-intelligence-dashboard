'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import {
    Users, Building2, BarChart3, Eye, RefreshCw, Sun, Moon,
    AlertTriangle, X, PanelLeftClose, PanelLeftOpen, Home, Bell, Search,
    Clock, ExternalLink, ChevronDown, ChevronRight, ChevronUp, Maximize2, Minimize2,
    LogOut, Settings, HelpCircle, User, Filter, ArrowUpDown, List,
    Sparkles, MessageSquare, CheckCircle, MoreHorizontal
} from 'lucide-react';
import Link from 'next/link';
import FredChat from './FredChat';
import DashboardSettings from './DashboardSettings';
import { RiskBadge } from './DashboardMetrics';

let isInitialLoad = true;
let clientSidebarCollapsed = false;
let clientSidebarWidth = 260;
if (typeof window !== 'undefined') {
    clientSidebarCollapsed = localStorage.getItem('sidebar-collapsed') === 'true';
    const savedW = localStorage.getItem('sidebar-width');
    if (savedW) clientSidebarWidth = parseInt(savedW, 10);
}

export default function DashboardLayout({ children, loading, lastFetched, fetchData, theme, toggleTheme, autoRefresh, setAutoRefresh, devMode, setDevMode, viewConfig, data }) {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
        if (typeof window !== 'undefined') {
            return clientSidebarCollapsed;
        }
        return false;
    });
    const [sidebarWidth, setSidebarWidth] = useState(() => {
        if (typeof window !== 'undefined') {
            return clientSidebarWidth;
        }
        return 260;
    });
    const [isDragging, setIsDragging] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        if (isInitialLoad) {
            isInitialLoad = false;
            const savedC = localStorage.getItem('sidebar-collapsed') === 'true';
            if (savedC !== sidebarCollapsed) {
                setSidebarCollapsed(savedC);
                clientSidebarCollapsed = savedC;
            }
            const savedW = localStorage.getItem('sidebar-width');
            if (savedW) {
                const w = parseInt(savedW, 10);
                setSidebarWidth(w);
                clientSidebarWidth = w;
            }
        }
    }, [sidebarCollapsed]);

    const handleMouseDown = useCallback((e) => {
        e.preventDefault();
        setIsDragging(true);
        document.body.style.cursor = 'col-resize';
        document.body.style.userSelect = 'none';
    }, []);

    useEffect(() => {
        if (!isDragging) return;
        const handleMouseMove = (e) => {
            let newWidth = e.clientX;
            if (newWidth < 180) {
                if (!sidebarCollapsed) {
                    setSidebarCollapsed(true);
                    clientSidebarCollapsed = true;
                    localStorage.setItem('sidebar-collapsed', 'true');
                }
            } else {
                if (sidebarCollapsed) {
                    setSidebarCollapsed(false);
                    clientSidebarCollapsed = false;
                    localStorage.setItem('sidebar-collapsed', 'false');
                }
                newWidth = Math.max(220, Math.min(600, newWidth));
                setSidebarWidth(newWidth);
            }
        };
        const handleMouseUp = () => {
            setIsDragging(false);
            document.body.style.cursor = '';
            document.body.style.userSelect = '';
            localStorage.setItem('sidebar-width', sidebarWidth);
        };
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isDragging, sidebarCollapsed, sidebarWidth]);

    const toggleSidebarCollapse = () => {
        const next = !sidebarCollapsed;
        setSidebarCollapsed(next);
        clientSidebarCollapsed = next;
        localStorage.setItem('sidebar-collapsed', String(next));
    };

    const [fredOpen, setFredOpen] = useState(false);
    const [profileOpen, setProfileOpen] = useState(false);
    const [settingsOpen, setSettingsOpen] = useState(false);
    const [settingsTab, setSettingsTab] = useState('appearance');

    const [inboxOpen, setInboxOpen] = useState(false);
    const [recentsOpen, setRecentsOpen] = useState(true);
    const pathname = usePathname();
    const currentView = pathname.split('/').pop() || 'individual';

    const [inboxTab, setInboxTab] = useState('activity');
    const [inboxDensity, setInboxDensity] = useState('detailed');
    const [inboxSort, setInboxSort] = useState('newest');
    const [inboxFilter, setInboxFilter] = useState('all');

    // Summary State
    const [summaryState, setSummaryState] = useState('idle');
    const [summaryText, setSummaryText] = useState('');
    const [summaryExpanded, setSummaryExpanded] = useState(true);
    const [summaryTimeframe, setSummaryTimeframe] = useState('Past week');
    const [summaryMenuOpen, setSummaryMenuOpen] = useState(false);
    const [toolbarMenuOpen, setToolbarMenuOpen] = useState(false);
    const [archivedIds, setArchivedIds] = useState([]);
    const [readIds, setReadIds] = useState([]);

    // Persist inbox state
    useEffect(() => {
        const savedA = localStorage.getItem('inbox-archived');
        if (savedA) setArchivedIds(JSON.parse(savedA));
        const savedR = localStorage.getItem('inbox-read');
        if (savedR) setReadIds(JSON.parse(savedR));
    }, []);

    const toggleArchive = (e, id) => {
        e.preventDefault();
        e.stopPropagation();
        setArchivedIds(prev => {
            const next = prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id];
            localStorage.setItem('inbox-archived', JSON.stringify(next));
            return next;
        });
    };

    const markRead = (id) => {
        if (!readIds.includes(id)) {
            setReadIds(prev => {
                const next = [...prev, id];
                localStorage.setItem('inbox-read', JSON.stringify(next));
                return next;
            });
        }
    };

    const archiveAllObj = (items) => {
        const ids = [];
        items.overdue.forEach(g => ids.push(g.id || g.goalTitle));
        items.blocked.forEach(g => ids.push(g.id || g.goalTitle));
        items.recentlyCompleted.forEach(g => ids.push(g.id || g.goalTitle));

        setArchivedIds(prev => {
            const next = Array.from(new Set([...prev, ...ids]));
            localStorage.setItem('inbox-archived', JSON.stringify(next));
            return next;
        });
    };

    // Derive inbox notifications from data
    const rawInboxItems = useMemo(() => {
        if (!data) return { overdue: [], blocked: [], recentlyCompleted: [], riskAlerts: [], initiativeAlerts: [] };
        const goals = data.goals || [];
        const initiatives = data.initiatives || [];
        const now = new Date();
        const sevenDaysAgo = new Date(now - 7 * 24 * 60 * 60 * 1000);

        const overdue = goals.filter(g => {
            if (!g.dueDate) return false;
            const due = new Date(g.dueDate);
            const isComp = ['Done', 'Complete', 'Completed', 'Shipped'].some(s => g.status?.toLowerCase() === s.toLowerCase());
            return due < now && !isComp;
        }).slice(0, 10);

        const blocked = goals.filter(g =>
            ['Blocked', 'On Hold', 'Waiting'].some(s => g.status?.toLowerCase() === s.toLowerCase())
        ).slice(0, 10);

        const recentlyCompleted = goals.filter(g => {
            const isComp = ['Done', 'Complete', 'Completed', 'Shipped'].some(s => g.status?.toLowerCase() === s.toLowerCase());
            if (!isComp || !g.lastUpdated) return false;
            return new Date(g.lastUpdated) >= sevenDaysAgo;
        }).slice(0, 6);

        const riskAlerts = [];
        if (data.individual) {
            Object.entries(data.individual).forEach(([name, d]) => {
                if (d.riskLevel === 'red') riskAlerts.push({ type: 'risk', name, id: `risk-${name}`, ...d });
            });
        }

        const initiativeAlerts = [];
        initiatives.forEach(init => {
            if (init.isSlipped) {
                initiativeAlerts.push({ ...init, alertType: 'slipped', title: `Slippage: ${init.name} (${init.slippageDays}d late)` });
            } else if (init.dataCompleteness === 'Missing') {
                initiativeAlerts.push({ ...init, alertType: 'gap', title: `Data Gap: ${init.name} (Missing Owner/Date)` });
            } else if (init.isStale) {
                initiativeAlerts.push({ ...init, alertType: 'stale', title: `Stale: ${init.name} (>7d untouched)` });
            }
        });

        return { overdue, blocked, recentlyCompleted, riskAlerts: riskAlerts.slice(0, 5), initiativeAlerts };
    }, [data]);

    const inboxItems = useMemo(() => {
        const filterFn = (item) => {
            const id = item.id || item.goalTitle || item.name;
            const isArchived = archivedIds.includes(id);

            if (inboxTab === 'archive') return isArchived;
            if (inboxTab === 'bookmarks') return false; // Bookmarks not fully implemented yet

            // Activity tab logic
            if (isArchived) return false;

            const isRead = readIds.includes(id);
            if (inboxFilter === 'unread') return !isRead;

            return true;
        };

        return {
            riskAlerts: rawInboxItems.riskAlerts.filter(filterFn),
            overdue: rawInboxItems.overdue.filter(filterFn),
            blocked: rawInboxItems.blocked.filter(filterFn),
            recentlyCompleted: rawInboxItems.recentlyCompleted.filter(filterFn),
            initiativeAlerts: rawInboxItems.initiativeAlerts.filter(filterFn),
        };
    }, [rawInboxItems, inboxTab, inboxFilter, archivedIds, readIds]);

    const totalInboxCount = inboxItems.overdue.filter(i => !readIds.includes(i.id || i.goalTitle)).length +
        inboxItems.blocked.filter(i => !readIds.includes(i.id || i.goalTitle)).length +
        inboxItems.riskAlerts.filter(i => !readIds.includes(i.id || i.name)).length +
        inboxItems.initiativeAlerts.filter(i => !readIds.includes(i.id)).length;

    // Recent updates
    const recentGoals = useMemo(() => {
        if (!data?.goals) return [];
        return [...data.goals]
            .filter(g => g.lastUpdated)
            .sort((a, b) => new Date(b.lastUpdated) - new Date(a.lastUpdated))
            .slice(0, 5);
    }, [data]);

    const fetchFredSummary = async () => {
        setSummaryState('loading');
        setSummaryExpanded(true);
        try {
            const dataToSummarize = {
                riskAlerts: inboxItems.riskAlerts || [],
                overdue: inboxItems.overdue || [],
                blocked: inboxItems.blocked || [],
                initiativeAlerts: inboxItems.initiativeAlerts || []
            };
            const prompt = `You are Fred, generating an 'Inbox Summary'. Summarize the current execution bottlenecks from the ${summaryTimeframe}. Focus on critical Risk Alerts, Blocked Items, and Overdue items. Data: ${JSON.stringify(dataToSummarize).substring(0, 1500)}`;

            const response = await fetch('/api/fred/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ messages: [{ role: 'user', content: prompt }] })
            });
            const chatData = await response.json();
            setSummaryText(chatData.content || "Empty response from Fred.");
            setSummaryState('success');
        } catch (error) {
            console.error(error);
            setSummaryState('error');
            setSummaryText("Failed to generate summary. Please try again.");
        }
    };

    const navItems = [
        { id: 'individual', label: 'Individual', icon: Users, desc: 'Per-person execution', path: '/individual' },
        { id: 'squads', label: 'Squads', icon: Building2, desc: 'Squad rollups', path: '/squads' },
        { id: 'company', label: 'Company', icon: BarChart3, desc: 'Execution overview', path: '/company' },
        { id: 'executive', label: 'Executive', icon: Eye, desc: '10-min view', path: '/executive' },
    ];

    return (
        <div suppressHydrationWarning className="app-layout" style={{ '--sidebar-width': `${sidebarCollapsed ? 64 : sidebarWidth}px` }}>
            <FredChat isOpen={fredOpen} onClose={() => setFredOpen(false)} data={data} />

            {/* Inbox Slide-out Panel */}
            {inboxOpen && (
                <div className="detail-panel-overlay" onClick={() => setInboxOpen(false)} style={{ zIndex: 1100 }}>
                    <div className="detail-panel animate-in-right inbox-panel" onClick={e => e.stopPropagation()}>

                        {/* Header & Tabs */}
                        <div className="inbox-header-area">
                            <div className="inbox-header-top">
                                <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 600 }}>Inbox</h2>
                                <div style={{ display: 'flex', gap: '8px' }}>
                                    <button className="btn btn-secondary" onClick={() => { setSettingsTab('inbox'); setSettingsOpen(true); }} style={{ fontSize: '0.75rem', padding: '6px 12px' }}>Manage notifications</button>
                                    <button className="btn btn-ghost" onClick={() => setInboxOpen(false)} style={{ padding: '4px' }}><X size={20} /></button>
                                </div>
                            </div>
                            <div className="inbox-tabs">
                                <button className={`inbox-tab ${inboxTab === 'activity' ? 'active' : ''}`} onClick={() => setInboxTab('activity')}>Activity</button>
                                <button className={`inbox-tab ${inboxTab === 'bookmarks' ? 'active' : ''}`} onClick={() => setInboxTab('bookmarks')}>Bookmarks</button>
                                <button className={`inbox-tab ${inboxTab === 'archive' ? 'active' : ''}`} onClick={() => setInboxTab('archive')}>Archive</button>
                            </div>
                        </div>

                        {/* Toolbar */}
                        <div className="inbox-toolbar">
                            <div className="inbox-toolbar-left">
                                <button className="inbox-toolbar-btn" onClick={() => setInboxFilter(inboxFilter === 'all' ? 'unread' : 'all')}>
                                    <Filter size={14} /> Filter {inboxFilter === 'unread' ? '(Unread only)' : ''}
                                </button>
                                <button className="inbox-toolbar-btn" onClick={() => setInboxSort(inboxSort === 'newest' ? 'relevance' : 'newest')}>
                                    <ArrowUpDown size={14} /> Sort: {inboxSort === 'newest' ? 'Newest' : 'Relevance'}
                                </button>
                                <button className="inbox-toolbar-btn" onClick={() => setInboxDensity(inboxDensity === 'detailed' ? 'compact' : 'detailed')}>
                                    <List size={14} /> Density: {inboxDensity === 'detailed' ? 'Detailed' : 'Compact'}
                                </button>
                            </div>
                            <div className="inbox-toolbar-right" style={{ position: 'relative' }}>
                                <button className="btn btn-ghost" onClick={() => setToolbarMenuOpen(!toolbarMenuOpen)} style={{ padding: '4px' }}>
                                    <MoreHorizontal size={16} />
                                </button>
                                {toolbarMenuOpen && (
                                    <>
                                        <div className="dropdown-overlay" onClick={() => setToolbarMenuOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 100 }} />
                                        <div className="dropdown-menu animate-in" style={{ position: 'absolute', top: '100%', right: 0, marginTop: '4px', zIndex: 101, width: '200px', background: 'var(--bg-elevated)', border: '1px solid var(--border-primary)', borderRadius: 'var(--radius-md)', padding: '4px', boxShadow: 'var(--shadow-md)' }}>
                                            <button className="dropdown-item" onClick={() => { setToolbarMenuOpen(false); fetchFredSummary(); }} style={{ fontSize: '0.8125rem', width: '100%', textAlign: 'left', padding: '6px 8px', background: 'var(--brand-primary-light)', color: 'var(--brand-primary)', borderRadius: 'var(--radius-sm)', border: 'none', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <span>Inbox AI summary</span><span style={{ fontSize: '0.65rem', padding: '2px 6px', background: 'var(--brand-primary)', color: 'white', borderRadius: '4px' }}>New</span>
                                            </button>
                                            <button className="dropdown-item" onClick={() => { setToolbarMenuOpen(false); setInboxDensity('detailed'); }} style={{ fontSize: '0.8125rem', width: '100%', textAlign: 'left', padding: '6px 8px', background: 'transparent', color: 'var(--text-primary)', border: 'none', cursor: 'pointer', marginTop: '4px' }}>Expand notifications</button>
                                            <button className="dropdown-item" onClick={() => { setToolbarMenuOpen(false); archiveAllObj(inboxItems); }} style={{ fontSize: '0.8125rem', width: '100%', textAlign: 'left', padding: '6px 8px', background: 'transparent', color: 'var(--text-primary)', border: 'none', cursor: 'pointer' }}>Archive all</button>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>

                        <div className="detail-content" style={{ padding: '0', background: 'var(--bg-tertiary)' }}>

                            <div style={{ padding: '24px' }}>
                                {/* Fred AI Summary Card - Only on Activity tab */}
                                {inboxTab === 'activity' && (
                                    <div className="inbox-summary-card" style={{ marginBottom: '24px', position: 'relative', overflow: 'hidden', padding: '20px' }}>
                                        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: 'linear-gradient(90deg, #7C3AED, #00CEC9)' }}></div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                            <div style={{ width: '100%' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                                                    <Sparkles size={16} style={{ color: 'var(--signal-purple)' }} />
                                                    <span style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.95rem' }}>Inbox Summary - {summaryTimeframe}</span>
                                                    {summaryState === 'success' && <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginLeft: '8px' }}>Last updated just now</span>}
                                                </div>

                                                {summaryExpanded && (
                                                    <div className="inbox-summary-content" style={{ marginBottom: '16px' }}>
                                                        {summaryState === 'idle' && <p>Summarize your most important and actionable notifications with Fred AI.</p>}
                                                        {summaryState === 'loading' && (
                                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                                                <div className="loading-pulse" style={{ height: '14px', width: '90%', background: 'var(--bg-secondary)', borderRadius: '4px' }}></div>
                                                                <div className="loading-pulse" style={{ height: '14px', width: '80%', background: 'var(--bg-secondary)', borderRadius: '4px' }}></div>
                                                                <div className="loading-pulse" style={{ height: '14px', width: '85%', background: 'var(--bg-secondary)', borderRadius: '4px' }}></div>
                                                            </div>
                                                        )}
                                                        {summaryState === 'success' && (
                                                            <div dangerouslySetInnerHTML={{
                                                                __html: summaryText
                                                                    // Parse links [text](url)
                                                                    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>')
                                                                    // Parse bold **text**
                                                                    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
                                                                    // Parse newlines as paragraphs/breaks
                                                                    .split('\n\n').map(p => `<p>${p.replace(/\n/g, '<br/>')}</p>`).join('')
                                                            }} />
                                                        )}
                                                        {summaryState === 'error' && <span style={{ color: 'var(--signal-red)' }}>{summaryText}</span>}
                                                    </div>
                                                )}

                                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: summaryExpanded ? '16px' : '0' }}>
                                                    <select value={summaryTimeframe} onChange={e => { setSummaryTimeframe(e.target.value); if (summaryState === 'success') fetchFredSummary(); }} style={{ padding: '6px 12px', borderRadius: 'var(--radius-sm)', fontSize: '0.75rem', background: summaryExpanded ? 'transparent' : 'var(--bg-secondary)', border: '1px solid var(--border-secondary)', color: summaryExpanded ? 'var(--text-tertiary)' : 'var(--text-primary)', outline: 'none', cursor: 'pointer', transition: 'all 0.2s ease' }}>
                                                        <option value="Past 24 hours">Past 24 hours</option>
                                                        <option value="Past 3 days">Past 3 days</option>
                                                        <option value="Past week">Past week</option>
                                                        <option value="Past 2 weeks">Past 2 weeks</option>
                                                    </select>
                                                    {summaryState === 'idle' && (
                                                        <button className="btn btn-secondary" onClick={fetchFredSummary} style={{ fontSize: '0.75rem', padding: '6px 12px' }}>Generate summary</button>
                                                    )}
                                                    {summaryState === 'success' && summaryExpanded && (
                                                        <button className="btn btn-ghost" onClick={fetchFredSummary} style={{ fontSize: '0.75rem', padding: '4px 8px' }}><RefreshCw size={12} style={{ marginRight: '4px' }} /> Regenerate</button>
                                                    )}
                                                </div>
                                            </div>
                                            <div style={{ display: 'flex', gap: '4px', position: 'relative' }}>
                                                <button className="btn btn-ghost" onClick={() => setSummaryExpanded(!summaryExpanded)} style={{ padding: '4px', color: 'var(--text-tertiary)' }} title={summaryExpanded ? "Collapse" : "Expand"}>
                                                    {summaryExpanded ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
                                                </button>
                                                <button className="btn btn-ghost" onClick={() => setSummaryMenuOpen(!summaryMenuOpen)} style={{ padding: '4px', color: 'var(--text-tertiary)' }} title="Close or Options"><X size={16} /></button>
                                                {summaryMenuOpen && (
                                                    <>
                                                        <div className="dropdown-overlay" onClick={() => setSummaryMenuOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 100 }} />
                                                        <div className="dropdown-menu animate-in" style={{ position: 'absolute', top: '100%', right: 0, zIndex: 101, background: 'var(--bg-elevated)', border: '1px solid var(--border-primary)', borderRadius: 'var(--radius-md)', padding: '4px', boxShadow: 'var(--shadow-md)', width: '160px' }}>
                                                            <button className="dropdown-item" onClick={() => { setSummaryMenuOpen(false); setSummaryState('idle'); setSummaryText(''); setSummaryExpanded(true); }} style={{ fontSize: '0.8125rem', width: '100%', textAlign: 'left', padding: '6px 8px', background: 'transparent', color: 'var(--text-primary)', border: 'none', cursor: 'pointer' }}>Dismiss Summary</button>
                                                        </div>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '16px' }}>Today</div>

                                {/* Notifications List */}
                                <div style={{ display: 'flex', flexDirection: 'column', borderRadius: 'var(--radius-md)', overflow: 'hidden', border: '1px solid var(--border-secondary)' }}>

                                    {/* Risk Alerts */}
                                    {inboxItems.riskAlerts.map((a, i) => (
                                        <div key={`risk-${i}`} className={`asana-inbox-item ${readIds.includes(a.id) ? 'read' : ''}`} onClick={() => markRead(a.id)}>
                                            {!readIds.includes(a.id) && <div className="asana-item-dot unread" style={{ position: 'absolute', top: '50%', transform: 'translateY(-50%)', left: '6px' }} />}
                                            <div className="asana-item-icon" style={{ background: 'var(--signal-red-bg)', color: 'var(--signal-red)' }}>🔴</div>
                                            <div className="asana-item-content">
                                                <div className="asana-item-header">
                                                    <div className="asana-item-title">Risk Alert: {a.name}</div>
                                                    <div className="asana-item-time">2 hours ago</div>
                                                </div>
                                                {inboxDensity === 'detailed' && <div className="asana-item-desc">Critical issues affecting execution momentum. {a.overdue} overdue, {a.blocked} blocked out of {a.totalGoals} goals.</div>}
                                                <div className="asana-item-meta">
                                                    <span>Workspace Alert</span>
                                                </div>
                                            </div>
                                            <div className="asana-item-actions">
                                                <button className="asana-action-btn" title="Mark as read"><CheckCircle size={14} /></button>
                                                <button className="asana-action-btn" onClick={(e) => toggleArchive(e, a.id)} title={inboxTab === 'archive' ? "Unarchive" : "Archive"}><X size={14} /></button>
                                            </div>
                                        </div>
                                    ))}

                                    {/* Initiative Alerts */}
                                    {inboxItems.initiativeAlerts.map((init, i) => {
                                        let icon = '🟡';
                                        let bg = 'var(--signal-amber-bg)';
                                        if (init.alertType === 'slipped') { icon = '🔴'; bg = 'var(--signal-red-bg)'; }
                                        else if (init.alertType === 'stale') { icon = '⏰'; bg = 'var(--bg-tertiary)'; }

                                        return (
                                            <a href={init.notionUrl} target="_blank" rel="noopener noreferrer" key={`init-${i}`} className={`asana-inbox-item ${readIds.includes(init.id) ? 'read' : ''}`} onClick={() => markRead(init.id)}>
                                                {!readIds.includes(init.id) && <div className="asana-item-dot unread" style={{ position: 'absolute', top: '50%', transform: 'translateY(-50%)', left: '6px' }} />}
                                                <div className="asana-item-icon" style={{ background: bg }}>{icon}</div>
                                                <div className="asana-item-content">
                                                    <div className="asana-item-header">
                                                        <div className="asana-item-title">{init.name} <ExternalLink size={12} style={{ color: 'var(--text-tertiary)' }} /></div>
                                                        <div className="asana-item-time">4 hours ago</div>
                                                    </div>
                                                    {inboxDensity === 'detailed' && <div className="asana-item-desc">{init.title}</div>}
                                                    <div className="asana-item-meta">
                                                        <span>{init.owner || 'Unassigned'}</span>
                                                    </div>
                                                </div>
                                                <div className="asana-item-actions">
                                                    <button className="asana-action-btn" onClick={(e) => { e.preventDefault(); toggleArchive(e, init.id); }} title={inboxTab === 'archive' ? "Unarchive" : "Archive"}><X size={14} /></button>
                                                </div>
                                            </a>
                                        );
                                    })}

                                    {/* Blocked Items */}
                                    {inboxItems.blocked.map((g, i) => (
                                        <a href={g.sourceUrl || g.notionUrl} target="_blank" rel="noopener noreferrer" key={`block-${i}`} className={`asana-inbox-item ${readIds.includes(g.id || g.goalTitle) ? 'read' : ''}`} onClick={() => markRead(g.id || g.goalTitle)}>
                                            {!readIds.includes(g.id || g.goalTitle) && <div className="asana-item-dot unread" style={{ position: 'absolute', top: '50%', transform: 'translateY(-50%)', left: '6px' }} />}
                                            <div className="asana-item-icon" style={{ background: 'var(--signal-amber-bg)', color: 'var(--signal-amber)' }}>🚧</div>
                                            <div className="asana-item-content">
                                                <div className="asana-item-header">
                                                    <div className="asana-item-title">{g.goalTitle} <ExternalLink size={12} style={{ color: 'var(--text-tertiary)' }} /></div>
                                                    <div className="asana-item-time">5 hours ago</div>
                                                </div>
                                                {inboxDensity === 'detailed' && <div className="asana-item-desc">Status changed to Blocked. Requires immediate attention.</div>}
                                                <div className="asana-item-meta">
                                                    <span>{g.owner}</span>
                                                </div>
                                            </div>
                                            <div className="asana-item-actions">
                                                <button className="asana-action-btn" onClick={(e) => { e.preventDefault(); toggleArchive(e, g.id || g.goalTitle); }} title={inboxTab === 'archive' ? "Unarchive" : "Archive"}><X size={14} /></button>
                                            </div>
                                        </a>
                                    ))}

                                    {/* Overdue Items */}
                                    {inboxItems.overdue.map((g, i) => (
                                        <a href={g.sourceUrl || g.notionUrl} target="_blank" rel="noopener noreferrer" key={`overdue-${i}`} className={`asana-inbox-item ${readIds.includes(g.id || g.goalTitle) ? 'read' : ''}`} onClick={() => markRead(g.id || g.goalTitle)}>
                                            {!readIds.includes(g.id || g.goalTitle) && <div className="asana-item-dot unread" style={{ position: 'absolute', top: '50%', transform: 'translateY(-50%)', left: '6px' }} />}
                                            <div className="asana-item-icon" style={{ background: 'var(--signal-red-bg)', color: 'var(--signal-red)' }}>⏰</div>
                                            <div className="asana-item-content">
                                                <div className="asana-item-header">
                                                    <div className="asana-item-title">{g.goalTitle} <ExternalLink size={12} style={{ color: 'var(--text-tertiary)' }} /></div>
                                                    <div className="asana-item-time">1 day ago</div>
                                                </div>
                                                {inboxDensity === 'detailed' && <div className="asana-item-desc">Deadline missed. Target was {g.dueDate}.</div>}
                                                <div className="asana-item-meta">
                                                    <span>{g.owner}</span>
                                                </div>
                                            </div>
                                            <div className="asana-item-actions">
                                                <button className="asana-action-btn" onClick={(e) => { e.preventDefault(); toggleArchive(e, g.id || g.goalTitle); }} title={inboxTab === 'archive' ? "Unarchive" : "Archive"}><X size={14} /></button>
                                            </div>
                                        </a>
                                    ))}

                                    {/* Empty State if Everything Empty */}
                                    {inboxItems.riskAlerts.length === 0 && inboxItems.initiativeAlerts.length === 0 && inboxItems.overdue.length === 0 && inboxItems.blocked.length === 0 && (
                                        <div className="asana-inbox-item" style={{ padding: '32px 24px', cursor: 'default' }}>
                                            <div className="asana-item-icon" style={{ background: 'transparent', overflow: 'hidden' }}>
                                                <img src="/fred-icon.svg" alt="" style={{ width: '28px', height: '28px' }} />
                                            </div>
                                            <div className="asana-item-content">
                                                <div className="asana-item-title" style={{ marginBottom: '8px' }}><MessageSquare size={14} /> Teamwork makes work happen!</div>
                                                <div className="asana-item-desc" style={{ color: 'var(--text-primary)' }}>
                                                    Inbox is where you get updates, notifications, and messages from your teammates. Send an invite to start collaborating.
                                                </div>
                                                <div style={{ marginTop: '16px' }}>
                                                    <button className="btn btn-secondary" style={{ fontSize: '0.75rem', padding: '6px 12px' }}>Copy invite link</button>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                </div>

                                {inboxTab !== 'archive' && (
                                    <button className="btn btn-ghost" onClick={() => archiveAllObj(inboxItems)} style={{ fontSize: '0.75rem', padding: '8px 0', color: 'var(--brand-primary)', marginTop: '24px', fontWeight: 500 }}>
                                        Archive all notifications
                                    </button>
                                )}
                            </div>

                        </div>
                    </div>
                </div>
            )}

            {/* Sidebar */}
            <aside suppressHydrationWarning className={`sidebar ${sidebarOpen ? 'open' : ''} ${sidebarCollapsed ? 'collapsed' : ''}`} style={!mounted ? { transition: 'none' } : undefined}>
                <div className="sidebar-header" style={{ overflow: 'hidden' }}>
                    <div className="sidebar-logo" suppressHydrationWarning style={{ display: 'flex', flexDirection: sidebarCollapsed ? 'column' : 'row', alignItems: 'center', gap: sidebarCollapsed ? '12px' : '10px', minWidth: 0, overflow: 'hidden' }}>
                        <img
                            src={sidebarCollapsed ? '/ff-favicon.webp' : '/fireflies.webp'}
                            alt="Fireflies.ai"
                            style={{
                                height: '28px',
                                width: sidebarCollapsed ? '28px' : 'auto',
                                objectFit: 'contain',
                                flexShrink: 0
                            }}
                        />
                        {!sidebarCollapsed && (
                            <div className="sidebar-logo-subtitle" style={{ fontSize: '0.625rem', lineHeight: '1.2', textAlign: 'left', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
                                Execution Intelligence
                            </div>
                        )}
                    </div>
                    <button
                        className="btn btn-ghost btn-icon sidebar-collapse-btn"
                        onClick={toggleSidebarCollapse}
                        title={sidebarCollapsed ? 'Expand Sidebar' : 'Close Sidebar (Cmd+\\)'}
                        style={{ padding: '6px', borderRadius: 'var(--radius-sm)', flexShrink: 0 }}
                    >
                        {sidebarCollapsed ? <PanelLeftOpen size={16} /> : <PanelLeftClose size={16} />}
                    </button>
                </div>

                {!sidebarCollapsed && (
                    <div
                        className="sidebar-resizer"
                        onMouseDown={handleMouseDown}
                        style={{
                            position: 'absolute',
                            top: 0,
                            right: -4,
                            width: '8px',
                            height: '100%',
                            cursor: 'col-resize',
                            zIndex: 100,
                            backgroundColor: isDragging ? 'var(--brand-primary)' : 'transparent',
                            opacity: isDragging ? 1 : 0,
                            transition: isDragging ? 'none' : 'opacity 0.2s, background-color 0.2s'
                        }}
                        onMouseEnter={e => { e.currentTarget.style.opacity = 1; e.currentTarget.style.backgroundColor = 'var(--border-secondary)'; }}
                        onMouseLeave={e => { if (!isDragging) { e.currentTarget.style.opacity = 0; e.currentTarget.style.backgroundColor = 'transparent'; } }}
                    />
                )}

                {/* Icon Row: Home · Inbox · Search */}
                <div className="sidebar-icon-row">
                    <Link
                        href="/individual"
                        className={`sidebar-icon-btn ${currentView === 'individual' ? 'active' : ''}`}
                        title="Home"
                        onClick={() => setSidebarOpen(false)}
                    >
                        <Home size={16} />
                        {!sidebarCollapsed && <span>Home</span>}
                    </Link>
                    <button
                        className={`sidebar-icon-btn ${inboxOpen ? 'active' : ''}`}
                        title="Inbox"
                        onClick={() => setInboxOpen(!inboxOpen)}
                        style={{ position: 'relative' }}
                    >
                        <Bell size={16} />
                        {totalInboxCount > 0 && (
                            <span className="inbox-badge">{totalInboxCount > 9 ? '9+' : totalInboxCount}</span>
                        )}
                        {!sidebarCollapsed && <span>Inbox</span>}
                    </button>
                    <button
                        className="sidebar-icon-btn"
                        title="Search"
                        onClick={() => {
                            // Focus the search input in the FilterBar
                            const searchInput = document.querySelector('.search-input');
                            if (searchInput) { searchInput.focus(); searchInput.scrollIntoView({ behavior: 'smooth', block: 'center' }); }
                        }}
                    >
                        <Search size={16} />
                        {!sidebarCollapsed && <span>Search</span>}
                    </button>
                </div>

                <nav className="sidebar-nav">
                    {!sidebarCollapsed && <div className="nav-section-label">Views</div>}
                    {navItems.map(item => (
                        <Link
                            key={item.id}
                            href={item.path}
                            className={`nav-item ${currentView === item.id ? 'active' : ''}`}
                            onClick={() => setSidebarOpen(false)}
                            style={{ textDecoration: 'none' }}
                            title={sidebarCollapsed ? item.label : undefined}
                        >
                            <item.icon className="nav-item-icon" size={18} />
                            {!sidebarCollapsed && (
                                <div>
                                    <div>{item.label}</div>
                                    <div style={{ fontSize: '0.6875rem', opacity: 0.7, fontWeight: 400 }}>{item.desc}</div>
                                </div>
                            )}
                        </Link>
                    ))}

                    {/* Recents Section */}
                    {!sidebarCollapsed && recentGoals.length > 0 && (
                        <>
                            <div
                                className="nav-section-label"
                                style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', userSelect: 'none', marginTop: '8px' }}
                                onClick={() => setRecentsOpen(!recentsOpen)}
                            >
                                {recentsOpen ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                                Recents
                            </div>
                            {recentsOpen && recentGoals.map((g, i) => (
                                <a
                                    key={i}
                                    href={g.sourceUrl || g.notionUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="nav-item nav-item-recent"
                                    style={{ textDecoration: 'none', padding: '6px 12px', fontSize: '0.75rem', gap: '8px' }}
                                    title={g.goalTitle}
                                >
                                    <div style={{
                                        width: '20px', height: '20px', borderRadius: '50%',
                                        background: 'var(--bg-tertiary)', color: 'var(--brand-primary)',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        fontSize: '0.625rem', fontWeight: 700, flexShrink: 0
                                    }}>
                                        {String(g.owner || '?').charAt(0)}
                                    </div>
                                    <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--text-secondary)' }}>
                                        {g.goalTitle}
                                    </div>
                                </a>
                            ))}
                        </>
                    )}
                </nav>

                <div className="sidebar-footer" style={{ display: 'flex', flexDirection: sidebarCollapsed ? 'column' : 'row', alignItems: 'center', justifyContent: sidebarCollapsed ? 'center' : 'space-between', padding: sidebarCollapsed ? '12px 8px' : '16px', borderTop: '1px solid var(--border-primary)', gap: '8px' }}>
                    {!sidebarCollapsed && (
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
                    )}

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {lastFetched && !sidebarCollapsed && (
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
                        bottom: '0',
                        left: '0',
                        width: '20px',
                        height: '20px',
                        opacity: 0,
                        cursor: 'default',
                        zIndex: 10
                    }}
                    title="Toggle Dev Mode (Secret)"
                />
            </aside>

            {/* Main Content */}
            <main suppressHydrationWarning className="main-content" style={!mounted ? { transition: 'none' } : undefined}>
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
                        <div style={{ position: 'relative' }}>
                            <button
                                className="profile-btn"
                                onClick={() => setProfileOpen(!profileOpen)}
                                title="Profile & Settings"
                                style={{
                                    width: '32px', height: '32px', borderRadius: '50%',
                                    background: 'var(--bg-tertiary)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    border: '1px solid var(--border-secondary)',
                                    cursor: 'pointer',
                                    padding: 0,
                                    overflow: 'hidden'
                                }}
                            >
                                <img src="https://ca.slack-edge.com/T04KDQAB7-U0AE8QW3R89-fc012b06434b-512" alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={(e) => { e.target.onerror = null; e.target.src = 'https://ui-avatars.com/api/?name=Mikey+Glenn&background=random'; }} />
                            </button>

                            {profileOpen && (
                                <>
                                    <div className="dropdown-overlay" onClick={() => setProfileOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 1000 }} />
                                    <div className="profile-dropdown animate-in" style={{
                                        position: 'absolute', top: 'calc(100% + 8px)', right: 0,
                                        background: 'var(--bg-elevated)', borderRadius: 'var(--radius-md)',
                                        border: '1px solid var(--border-primary)',
                                        boxShadow: 'var(--shadow-lg)',
                                        width: '240px', zIndex: 1001,
                                        overflow: 'hidden'
                                    }}>
                                        <div style={{ padding: '16px', borderBottom: '1px solid var(--border-secondary)' }}>
                                            <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.875rem' }}>Mikey Glenn</div>
                                            <div style={{ color: 'var(--text-tertiary)', fontSize: '0.75rem', marginTop: '2px' }}>mikey@fireflies.ai</div>
                                        </div>
                                        <div style={{ padding: '8px' }}>
                                            <button className="dropdown-item" onClick={() => { setProfileOpen(false); setSettingsOpen(true); }} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 12px', background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-primary)', fontSize: '0.8125rem', borderRadius: 'var(--radius-sm)', textAlign: 'left' }}>
                                                <Settings size={16} style={{ color: 'var(--text-secondary)' }} />
                                                Settings
                                            </button>
                                            <Link href="/guide/future.html" className="dropdown-item" onClick={() => setProfileOpen(false)} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 12px', background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-primary)', fontSize: '0.8125rem', borderRadius: 'var(--radius-sm)', textDecoration: 'none' }}>
                                                <HelpCircle size={16} style={{ color: 'var(--text-secondary)' }} />
                                                Help Center (Fred Hub)
                                            </Link>
                                            <button className="dropdown-item" onClick={() => { setProfileOpen(false); alert('Signed out'); }} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 12px', background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--signal-red)', fontSize: '0.8125rem', borderRadius: 'var(--radius-sm)', textAlign: 'left', marginTop: '4px' }}>
                                                <LogOut size={16} />
                                                Sign out
                                            </button>
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
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
            </main>

            <DashboardSettings
                isOpen={settingsOpen}
                onClose={() => setSettingsOpen(false)}
                theme={theme}
                toggleTheme={toggleTheme}
                autoRefresh={autoRefresh}
                setAutoRefresh={setAutoRefresh}
                activeTab={settingsTab}
                setActiveTab={setSettingsTab}
            />
        </div>
    );
}
