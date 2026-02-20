'use client';

import { useState } from 'react';
import { Eye, Flame, AlertTriangle, Shield, TrendingDown, BarChart3, Download, Clock } from 'lucide-react';
import { RiskBadge } from './DashboardMetrics';
import InfoTooltip from './InfoTooltip';

// ─── Health Score Gauge ─────────────────────────────
function HealthScoreGauge({ score, status }) {
    const radius = 68;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (score / 100) * circumference;
    const colorMap = { green: 'var(--signal-green)', amber: 'var(--signal-amber)', red: 'var(--signal-red)' };
    const color = colorMap[status] || colorMap.green;

    return (
        <div className="health-gauge">
            <div className="health-score-ring">
                <svg width="160" height="160" viewBox="0 0 160 160">
                    <circle cx="80" cy="80" r={radius} fill="none" stroke="var(--border-secondary)" strokeWidth="8" />
                    <circle
                        cx="80" cy="80" r={radius} fill="none"
                        stroke={color} strokeWidth="8"
                        strokeDasharray={circumference}
                        strokeDashoffset={offset}
                        strokeLinecap="round"
                        transform="rotate(-90 80 80)"
                        style={{ transition: 'stroke-dashoffset 1s ease-out' }}
                    />
                </svg>
                <div className="health-score-value">
                    <div className={`health-score-number ${status}`}>{score}</div>
                    <div className="health-score-label">Health</div>
                </div>
            </div>
            <span className={`badge badge-${status === 'green' ? 'green' : status === 'amber' ? 'amber' : 'red'}`} style={{ fontSize: '0.8125rem', padding: '6px 16px' }}>
                {status === 'green' ? '✓ Healthy Execution' : status === 'amber' ? '⚠ Needs Attention' : '🚨 Critical'}
            </span>
        </div>
    );
}

export default function ExecutiveView({ data, company, goals }) {
    const [activeTab, setActiveTab] = useState('risks'); // 'risks' or 'slippage'

    if (!data) return null;

    // --- SLIPPAGE LOGIC ---
    // Only include items with real Department/Initiative Type data
    const taggedGoals = (goals || []).filter(i => i.department !== 'Unassigned' && i.initiativeType !== 'Unclassified');
    const initiatives = taggedGoals;
    const slippedItems = initiatives.filter(i => i.isSlipped).sort((a, b) => b.slippageDays - a.slippageDays);

    const totalSlipped = slippedItems.length;
    const avgDaysSlipped = totalSlipped > 0 ? Math.round(slippedItems.reduce((acc, curr) => acc + curr.slippageDays, 0) / totalSlipped) : 0;

    const missingDataItems = initiatives.filter(i => i.dataCompleteness === 'Missing');
    const dataGapCount = missingDataItems.length;

    const deptCounts = slippedItems.reduce((acc, curr) => {
        const dept = curr.department || 'Unknown';
        acc[dept] = (acc[dept] || 0) + 1;
        return acc;
    }, {});
    const mostSlippedDept = Object.keys(deptCounts).length > 0
        ? Object.keys(deptCounts).reduce((a, b) => deptCounts[a] > deptCounts[b] ? a : b)
        : 'None';

    const exportCSV = () => {
        if (slippedItems.length === 0) return;
        const headers = ['Initiative Name', 'Type', 'Department', 'Squad', 'Owner', 'Target Launch Date', 'Days Slipped', 'Status'];
        const csvContent = "data:text/csv;charset=utf-8,"
            + headers.join(",") + "\n"
            + slippedItems.map(row => {
                return `"${row.goalTitle || ''}","${row.initiativeType || ''}","${row.department || ''}","${row.squad || ''}","${row.owner || ''}","${row.dueDate || ''}","${row.slippageDays || 0}","${row.status || ''}"`;
            }).join("\n");
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `slippage_report_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // Include Slipped Rocks & Data Gaps in Top Risks dynamically
    const enrichedTopRisks = [...(data.topRisks || [])];
    const slippedRocks = slippedItems.filter(i => i.initiativeType?.toLowerCase() === 'rock');
    slippedRocks.slice(0, 3).forEach(rock => {
        enrichedTopRisks.unshift({
            type: 'critical',
            goalTitle: `[SLIPPED ROCK] ${rock.goalTitle}`,
            message: `${rock.slippageDays}d late`,
            owner: rock.owner || 'Unassigned',
            daysSinceUpdate: Math.floor((new Date() - new Date(rock.lastUpdated || new Date())) / 86400000),
            sourceUrl: rock.notionUrl
        });
    });
    missingDataItems.slice(0, 2).forEach(gap => {
        enrichedTopRisks.push({
            type: 'warning',
            goalTitle: `[INVISIBLE] ${gap.goalTitle}`,
            message: 'Missing tracking data',
            owner: gap.owner || 'Unassigned',
            daysSinceUpdate: 0,
            sourceUrl: gap.notionUrl
        });
    });

    const formatDate = (dateString) => {
        if (!dateString) return '—';
        try {
            return new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        } catch (e) {
            return dateString;
        }
    };

    return (
        <div className="executive-mode animate-in">
            <div style={{ textAlign: 'center', marginBottom: 'var(--space-xl)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', marginBottom: '8px' }}>
                    <Eye size={24} style={{ color: 'var(--brand-primary)' }} />
                    <h1>Executive View</h1>
                </div>
                {company && activeTab === 'risks' && (
                    <div style={{ marginTop: 'var(--space-md)' }}>
                        <HealthScoreGauge score={company.healthScore} status={company.healthStatus} />
                    </div>
                )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginBottom: 'var(--space-2xl)' }}>
                <button
                    className={`btn ${activeTab === 'risks' ? 'btn-primary' : 'btn-ghost'}`}
                    onClick={() => setActiveTab('risks')}
                >
                    <Flame size={16} style={{ marginRight: '6px' }} /> Top Risks
                </button>
                <button
                    className={`btn ${activeTab === 'slippage' ? 'btn-primary' : 'btn-ghost'}`}
                    onClick={() => setActiveTab('slippage')}
                >
                    <TrendingDown size={16} style={{ marginRight: '6px' }} /> Slippage Report
                </button>
            </div>

            {activeTab === 'risks' && (
                <>
                    {enrichedTopRisks && enrichedTopRisks.length > 0 && (
                        <div className="executive-section">
                            <div className="executive-section-title">
                                <Flame size={14} /> Top Priority Interventions <InfoTooltip content="Goals with highest composite risk score, plus slipped Rocks and missing data alerts." size={12} />
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                {enrichedTopRisks.map((risk, i) => (
                                    <div key={i} className={`risk-item ${risk.type}`}>
                                        <div className="risk-item-content">
                                            <div className="risk-item-title">
                                                <a href={risk.sourceUrl || risk.notionUrl} target="_blank" rel="noopener noreferrer" className="hover-underline" style={{ color: 'inherit', textDecoration: 'none' }}>
                                                    {risk.goalTitle}
                                                </a>
                                            </div>
                                            <div className="risk-item-meta">
                                                {risk.message} · {risk.owner} · {risk.daysSinceUpdate}d since update
                                            </div>
                                        </div>
                                        <RiskBadge level={risk.type === 'critical' ? 'red' : risk.type === 'warning' ? 'amber' : 'green'} compact />
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {data.highPriorityOverdue && data.highPriorityOverdue.length > 0 && (
                        <div className="executive-section">
                            <div className="executive-section-title">
                                <AlertTriangle size={14} /> High Priority Overdue
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                {data.highPriorityOverdue.map((item, i) => (
                                    <div key={i} className="card" style={{ padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div>
                                            <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>
                                                <a href={item.notionUrl} target="_blank" rel="noopener noreferrer" className="hover-underline" style={{ color: 'inherit', textDecoration: 'none' }}>
                                                    {item.goalTitle}
                                                </a>
                                            </div>
                                            <div className="text-xs text-muted">{item.owner} · Due: {item.dueDate || 'No date'}</div>
                                        </div>
                                        <span className="badge badge-red">{item.daysSinceUpdate}d stale</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {data.needsUnblock && data.needsUnblock.length > 0 && (
                        <div className="executive-section">
                            <div className="executive-section-title">
                                <Shield size={14} /> Needs Unblock
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                {data.needsUnblock.map((item, i) => (
                                    <div key={i} className="card" style={{ padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div>
                                            <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>
                                                <a href={item.notionUrl} target="_blank" rel="noopener noreferrer" className="hover-underline" style={{ color: 'inherit', textDecoration: 'none' }}>
                                                    {item.goalTitle}
                                                </a>
                                            </div>
                                            <div className="text-xs text-muted">{item.owner} · {item.status}</div>
                                        </div>
                                        <span className="badge badge-amber">{item.daysSinceUpdate}d waiting</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {data.squadSummary && data.squadSummary.length > 0 && (
                        <div className="executive-section">
                            <div className="executive-section-title">
                                <BarChart3 size={14} /> Squad Velocity
                            </div>
                            <div className="card">
                                <div className="metrics-grid metrics-grid-3">
                                    {data.squadSummary.map((squad, i) => (
                                        <div key={i} style={{ padding: '12px', borderRadius: 'var(--radius-md)', background: 'var(--bg-tertiary)' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                                <span style={{ fontWeight: 600, fontSize: '0.8125rem' }}>{squad.name}</span>
                                                <RiskBadge level={squad.riskLevel} compact />
                                            </div>
                                            <div style={{ display: 'flex', gap: '12px', fontSize: '0.75rem' }}>
                                                <span>Active: <strong>{squad.active}</strong></span>
                                                <span>Done: <strong>{squad.completed}</strong></span>
                                                <span style={{ color: squad.overdue > 0 ? 'var(--signal-red)' : 'inherit' }}>Late: <strong>{squad.overdue}</strong></span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </>
            )}

            {activeTab === 'slippage' && (
                <div className="animate-in fade-in zoom-in" style={{ animationDuration: '300ms' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 'var(--space-md)' }}>
                        <div>
                            <h2 style={{ fontSize: '1.25rem', margin: 0 }}>Initiative Slippage Report</h2>
                            <p className="text-muted" style={{ margin: '4px 0 0', fontSize: '0.875rem' }}>Comparing Target Launch vs. Actual Delivery</p>
                        </div>
                        <button className="btn btn-secondary" onClick={exportCSV} disabled={slippedItems.length === 0}>
                            <Download size={16} style={{ marginRight: '6px' }} /> Download CSV
                        </button>
                    </div>

                    <div className="metrics-grid metrics-grid-4" style={{ marginBottom: 'var(--space-xl)' }}>
                        <div className="card metric-card">
                            <div className="metric-header">Total Slipped <TrendingDown size={14} className="text-muted" /></div>
                            <div className="metric-value text-red">{totalSlipped}</div>
                        </div>
                        <div className="card metric-card">
                            <div className="metric-header">Avg Days Slipped <Clock size={14} className="text-muted" /></div>
                            <div className="metric-value">{avgDaysSlipped} d</div>
                        </div>
                        <div className="card metric-card">
                            <div className="metric-header">Most Slipped Dept <AlertTriangle size={14} className="text-muted" /></div>
                            <div className="metric-value">{mostSlippedDept}</div>
                        </div>
                        <div className="card metric-card">
                            <div className="metric-header">Data Gaps <InfoTooltip content="Initiatives missing an Owner or Target Date" /></div>
                            <div className="metric-value text-amber">{dataGapCount}</div>
                        </div>
                    </div>

                    {slippedItems.length > 0 ? (
                        <div className="card" style={{ overflow: 'hidden' }}>
                            <div style={{ overflowX: 'auto' }}>
                                <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.8125rem' }}>
                                    <thead style={{ background: 'var(--bg-secondary)' }}>
                                        <tr>
                                            <th style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--text-secondary)' }}>Initiative</th>
                                            <th style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--text-secondary)' }}>Type</th>
                                            <th style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--text-secondary)' }}>Dept / Squad</th>
                                            <th style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--text-secondary)' }}>Target Date</th>
                                            <th style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--text-secondary)' }}>Days Slipped</th>
                                            <th style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--text-secondary)' }}>Status</th>
                                            <th style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--text-secondary)' }}>Owner</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {slippedItems.map((item, i) => (
                                            <tr key={i} style={{ borderTop: '1px solid var(--border-secondary)' }}>
                                                <td style={{ padding: '12px 16px', fontWeight: 500 }}>
                                                    <a href={item.notionUrl} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--text-primary)', textDecoration: 'none' }}>
                                                        {item.goalTitle}
                                                    </a>
                                                </td>
                                                <td style={{ padding: '12px 16px' }}>
                                                    <span className={`badge`} style={{
                                                        background: item.initiativeType?.toLowerCase() === 'rock' ? 'var(--signal-purple)' : 'transparent',
                                                        color: item.initiativeType?.toLowerCase() === 'rock' ? 'white' : 'var(--text-primary)',
                                                        border: item.initiativeType?.toLowerCase() === 'pebble' ? '1px solid currentColor' : 'none',
                                                        padding: '2px 8px', fontSize: '0.65rem'
                                                    }}>
                                                        {item.initiativeType}
                                                    </span>
                                                </td>
                                                <td style={{ padding: '12px 16px' }}>
                                                    <div style={{ color: 'var(--text-primary)' }}>{item.department || '—'}</div>
                                                    <div style={{ color: 'var(--text-tertiary)', fontSize: '0.7rem' }}>{item.squad || '—'}</div>
                                                </td>
                                                <td style={{ padding: '12px 16px', color: 'var(--text-secondary)' }}>{formatDate(item.dueDate)}</td>
                                                <td style={{ padding: '12px 16px', color: 'var(--signal-red)', fontWeight: 600 }}>{item.slippageDays}d</td>
                                                <td style={{ padding: '12px 16px', color: 'var(--text-secondary)', fontSize: '0.75rem' }}>{item.status || '—'}</td>
                                                <td style={{ padding: '12px 16px' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                        <div style={{
                                                            width: '24px', height: '24px', borderRadius: '50%',
                                                            background: 'var(--bg-tertiary)', color: 'var(--text-secondary)',
                                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                            fontSize: '0.65rem', fontWeight: 600
                                                        }}>
                                                            {String(item.owner || '?').charAt(0).toUpperCase()}
                                                        </div>
                                                        <span style={{ color: 'var(--text-secondary)' }}>{item.owner || '—'}</span>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    ) : (
                        <div className="card" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-tertiary)' }}>
                            <Shield size={32} style={{ color: 'var(--signal-green)', marginBottom: '16px' }} />
                            <h3>No Slipped Initiatives</h3>
                            <p>Everything is currently tracking on time.</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
