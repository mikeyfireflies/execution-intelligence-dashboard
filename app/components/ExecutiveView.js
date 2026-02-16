'use client';

import { Eye, Flame, AlertTriangle, Shield, TrendingDown, BarChart3 } from 'lucide-react';
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

export default function ExecutiveView({ data, company }) {
    if (!data) return null;

    return (
        <div className="executive-mode animate-in">
            <div style={{ textAlign: 'center', marginBottom: 'var(--space-2xl)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', marginBottom: '8px' }}>
                    <Eye size={24} style={{ color: 'var(--brand-primary)' }} />
                    <h1>Executive 10-Minute View</h1>
                    <InfoTooltip content="Critical metrics for a 10-minute daily scan. Highlights top risks and blockers." size={16} />
                </div>
                <p className="text-muted">Critical signals only. No task clutter.</p>
                {company && (
                    <div style={{ marginTop: 'var(--space-lg)' }}>
                        <HealthScoreGauge score={company.healthScore} status={company.healthStatus} />
                    </div>
                )}
            </div>

            {data.topRisks && data.topRisks.length > 0 && (
                <div className="executive-section">
                    <div className="executive-section-title">
                        <Flame size={14} /> Top Risks <InfoTooltip content="Goals with highest composite risk score (Priority + Status)." size={12} />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {data.topRisks.map((risk, i) => (
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
        </div>
    );
}
