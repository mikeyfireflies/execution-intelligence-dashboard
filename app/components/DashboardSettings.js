'use client';

import { X, Moon, Sun, Bell, RefreshCw, LayoutDashboard } from 'lucide-react';
import { useState } from 'react';

export default function DashboardSettings({ isOpen, onClose, theme, toggleTheme, autoRefresh, setAutoRefresh }) {
    const [activeTab, setActiveTab] = useState('appearance');

    if (!isOpen) return null;

    return (
        <div className="modal-overlay" onClick={onClose} style={{
            position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999
        }}>
            <div className="modal-content animate-in zoom-in" onClick={e => e.stopPropagation()} style={{
                width: '600px', maxWidth: '90vw', height: '500px', maxHeight: '90vh',
                background: 'var(--bg-elevated)', border: '1px solid var(--border-primary)',
                borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-lg)',
                display: 'flex', overflow: 'hidden'
            }}>
                {/* Sidebar */}
                <div style={{ width: '200px', borderRight: '1px solid var(--border-secondary)', padding: '16px', display: 'flex', flexDirection: 'column', gap: '8px', background: 'var(--bg-secondary)' }}>
                    <h3 style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px', paddingLeft: '8px' }}>Settings</h3>

                    <button className={`settings-tab ${activeTab === 'appearance' ? 'active' : ''}`} onClick={() => setActiveTab('appearance')} style={getTabStyle(activeTab === 'appearance')}>
                        <Sun size={16} /> Appearance
                    </button>
                    <button className={`settings-tab ${activeTab === 'inbox' ? 'active' : ''}`} onClick={() => setActiveTab('inbox')} style={getTabStyle(activeTab === 'inbox')}>
                        <Bell size={16} /> Inbox & Alerts
                    </button>
                    <button className={`settings-tab ${activeTab === 'sync' ? 'active' : ''}`} onClick={() => setActiveTab('sync')} style={getTabStyle(activeTab === 'sync')}>
                        <RefreshCw size={16} /> Data & Sync
                    </button>
                    <button className={`settings-tab ${activeTab === 'preferences' ? 'active' : ''}`} onClick={() => setActiveTab('preferences')} style={getTabStyle(activeTab === 'preferences')}>
                        <LayoutDashboard size={16} /> Preferences
                    </button>
                </div>

                {/* Content */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: 'var(--bg-primary)' }}>
                    <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--border-secondary)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <h2 style={{ margin: 0, fontSize: '1.125rem', fontWeight: 600 }}>
                            {activeTab === 'appearance' && 'Appearance Settings'}
                            {activeTab === 'inbox' && 'Inbox & Alerts'}
                            {activeTab === 'sync' && 'Data Syncing'}
                            {activeTab === 'preferences' && 'Dashboard Preferences'}
                        </h2>
                        <button className="btn btn-ghost btn-icon" onClick={onClose}><X size={18} /></button>
                    </div>

                    <div style={{ padding: '24px', overflowY: 'auto', flex: 1 }}>
                        {activeTab === 'appearance' && (
                            <div className="settings-section">
                                <div className="setting-row">
                                    <div>
                                        <div style={{ fontWeight: 500, color: 'var(--text-primary)' }}>Theme Preference</div>
                                        <div style={{ fontSize: '0.8125rem', color: 'var(--text-tertiary)', marginTop: '4px' }}>Choose between light and dark mode for the dashboard.</div>
                                    </div>
                                    <div style={{ display: 'flex', gap: '8px', background: 'var(--bg-tertiary)', padding: '4px', borderRadius: 'var(--radius-md)' }}>
                                        <button className={`btn ${theme === 'light' ? 'btn-secondary' : 'btn-ghost'}`} onClick={() => theme === 'dark' && toggleTheme()} style={{ fontSize: '0.8125rem', padding: '6px 12px', background: theme === 'light' ? 'var(--bg-elevated)' : 'transparent', boxShadow: theme === 'light' ? 'var(--shadow-sm)' : 'none' }}>Light</button>
                                        <button className={`btn ${theme === 'dark' ? 'btn-secondary' : 'btn-ghost'}`} onClick={() => theme === 'light' && toggleTheme()} style={{ fontSize: '0.8125rem', padding: '6px 12px', background: theme === 'dark' ? 'var(--bg-elevated)' : 'transparent', boxShadow: theme === 'dark' ? 'var(--shadow-sm)' : 'none' }}>Dark</button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'inbox' && (
                            <div className="settings-section" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                <div className="setting-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div>
                                        <div style={{ fontWeight: 500, color: 'var(--text-primary)' }}>Red Risk Alerts</div>
                                        <div style={{ fontSize: '0.8125rem', color: 'var(--text-tertiary)', marginTop: '4px' }}>Show immediate alerts when an individual drops to red status.</div>
                                    </div>
                                    <ToggleSwitch defaultChecked={true} />
                                </div>
                                <div className="setting-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div>
                                        <div style={{ fontWeight: 500, color: 'var(--text-primary)' }}>Overdue Goals</div>
                                        <div style={{ fontSize: '0.8125rem', color: 'var(--text-tertiary)', marginTop: '4px' }}>Notify me about goals passing their due date.</div>
                                    </div>
                                    <ToggleSwitch defaultChecked={true} />
                                </div>
                                <div className="setting-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div>
                                        <div style={{ fontWeight: 500, color: 'var(--text-primary)' }}>Recently Completed</div>
                                        <div style={{ fontSize: '0.8125rem', color: 'var(--text-tertiary)', marginTop: '4px' }}>Show goals completed in the last 7 days.</div>
                                    </div>
                                    <ToggleSwitch defaultChecked={true} />
                                </div>
                            </div>
                        )}

                        {activeTab === 'sync' && (
                            <div className="settings-section" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                <div className="setting-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div>
                                        <div style={{ fontWeight: 500, color: 'var(--text-primary)' }}>Auto Refresh Live Data</div>
                                        <div style={{ fontSize: '0.8125rem', color: 'var(--text-tertiary)', marginTop: '4px' }}>Automatically poll for updates without manual refresh.</div>
                                    </div>
                                    <ToggleSwitch checked={autoRefresh} onChange={() => setAutoRefresh(!autoRefresh)} />
                                </div>
                                <div className="setting-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div>
                                        <div style={{ fontWeight: 500, color: 'var(--text-primary)' }}>Sync Interval</div>
                                        <div style={{ fontSize: '0.8125rem', color: 'var(--text-tertiary)', marginTop: '4px' }}>How often should the dashboard check for Notion updates?</div>
                                    </div>
                                    <select style={{ padding: '8px 12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-secondary)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', outline: 'none' }}>
                                        <option value="5">Every 5 minutes</option>
                                        <option value="15">Every 15 minutes</option>
                                        <option value="30">Every 30 minutes</option>
                                        <option value="60">Every 1 hour</option>
                                    </select>
                                </div>
                            </div>
                        )}

                        {activeTab === 'preferences' && (
                            <div className="settings-section" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                <div className="setting-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div>
                                        <div style={{ fontWeight: 500, color: 'var(--text-primary)' }}>Default Start View</div>
                                        <div style={{ fontSize: '0.8125rem', color: 'var(--text-tertiary)', marginTop: '4px' }}>The view that loads automatically when you open the app.</div>
                                    </div>
                                    <select style={{ padding: '8px 12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-secondary)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', outline: 'none' }}>
                                        <option value="individual">Individual Execution</option>
                                        <option value="squads">Squad Rollups</option>
                                        <option value="company">Company Overview</option>
                                        <option value="executive">Executive View</option>
                                    </select>
                                </div>
                                <div className="setting-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div>
                                        <div style={{ fontWeight: 500, color: 'var(--text-primary)' }}>Show Goal Progress Bars</div>
                                        <div style={{ fontSize: '0.8125rem', color: 'var(--text-tertiary)', marginTop: '4px' }}>Display visual progress indicators on Individual cards.</div>
                                    </div>
                                    <ToggleSwitch defaultChecked={true} />
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Footer buttons */}
                    <div style={{ padding: '16px 24px', borderTop: '1px solid var(--border-secondary)', display: 'flex', justifyContent: 'flex-end' }}>
                        <button className="btn btn-primary" onClick={onClose}>Done</button>
                    </div>
                </div>
            </div>
        </div>
    );
}

function getTabStyle(isActive) {
    return {
        display: 'flex', alignItems: 'center', gap: '10px',
        padding: '10px 12px', borderRadius: 'var(--radius-sm)',
        background: isActive ? 'var(--brand-primary)' : 'transparent',
        color: isActive ? 'white' : 'var(--text-secondary)',
        border: 'none', cursor: 'pointer', fontSize: '0.875rem',
        textAlign: 'left', outline: 'none',
        transition: 'all 0.2s ease',
        fontWeight: isActive ? 500 : 400
    };
}

function ToggleSwitch({ checked, defaultChecked, onChange }) {
    const [internalChecked, setInternalChecked] = useState(defaultChecked || false);
    const isChecked = checked !== undefined ? checked : internalChecked;

    const handleChange = () => {
        if (onChange) onChange(!isChecked);
        else setInternalChecked(!isChecked);
    };

    return (
        <div style={{
            width: '40px', height: '22px', borderRadius: '11px',
            background: isChecked ? 'var(--brand-primary)' : 'var(--bg-tertiary)',
            cursor: 'pointer', position: 'relative', transition: 'background 0.2s',
            border: `1px solid ${isChecked ? 'var(--brand-primary)' : 'var(--border-secondary)'}`
        }} onClick={handleChange}>
            <div style={{
                position: 'absolute', top: '2px', left: isChecked ? 'calc(100% - 18px)' : '2px',
                width: '16px', height: '16px', borderRadius: '50%',
                background: 'white', transition: 'left 0.2s',
                boxShadow: 'var(--shadow-sm)'
            }} />
        </div>
    );
}
