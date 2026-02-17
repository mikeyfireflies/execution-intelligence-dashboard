'use client';

import { useState, useMemo } from 'react';
import {
    Building2, ArrowUpRight, X, ExternalLink, Clock, Shield, AlertTriangle, ChevronRight
} from 'lucide-react';
import Link from 'next/link';
import { slugify } from '@/lib/utils';
import {
    isCompleted, isOverdue, isHighPriority, isActive, isBlocked
} from '@/lib/computations';
import { RiskBadge, SparkLine, getStatusColor } from './DashboardMetrics';
import InfoTooltip from './InfoTooltip';

// ─── Owner Grid Component ──────────────────────────
export function OwnerGrid({ owners, onRowClick }) {
    return (
        <div className="owner-grid animate-in">
            <div className="grid-header">
                <div style={{ textAlign: 'left' }}>Team Member</div>
                <div style={{ textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>Active <InfoTooltip content="Goals currently in progress." size={12} /></div>
                <div style={{ textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>Done <InfoTooltip content="Completed goals." size={12} /></div>
                <div style={{ textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>Overdue <InfoTooltip content="Active goals past due date." size={12} /></div>
                <div style={{ textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>Blocked <InfoTooltip content="Goals flagged as blocked." size={12} /></div>
                <div style={{ textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>Risk <InfoTooltip content="Automated risk assessment." size={12} /></div>
                <div style={{ textAlign: 'right', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '4px' }}>Velocity <InfoTooltip content="Recent completion trend." size={12} /></div>
            </div>
            {owners.map(([owner, data]) => (
                <div
                    key={owner}
                    className="grid-row clickable-row"
                    onClick={() => onRowClick && onRowClick(owner, data)}
                    style={{ cursor: 'pointer' }}
                >
                    <div className="grid-cell" data-label="Team Member" style={{ gap: '12px', justifyContent: 'flex-start' }}>
                        <div style={{
                            width: '32px', height: '32px', borderRadius: '50%',
                            background: 'var(--bg-tertiary)', color: 'var(--brand-primary)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: '0.875rem', fontWeight: 600, overflow: 'hidden',
                            flexShrink: 0, border: '2px solid #7c3aed', padding: '1px'
                        }}>
                            {data.profileImage ? (
                                <img src={data.profileImage} alt={owner} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
                            ) : (
                                owner.charAt(0)
                            )}
                        </div>
                        <div style={{ minWidth: 0, textAlign: 'left' }}>
                            <div style={{ fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{owner}</div>
                            <div style={{ fontSize: '0.6875rem', color: 'var(--text-tertiary)' }}>{data.totalGoals} goals</div>
                        </div>
                    </div>
                    <div className="grid-cell" data-label="Active" style={{ justifyContent: 'center' }}>
                        <span className="grid-cell-value" style={{ color: 'var(--status-active)' }}>{data.active}</span>
                    </div>
                    <div className="grid-cell" data-label="Done" style={{ justifyContent: 'center' }}>
                        <span className="grid-cell-value" style={{ color: 'var(--signal-green)' }}>{data.completed}</span>
                    </div>
                    <div className="grid-cell" data-label="Overdue" style={{ justifyContent: 'center' }}>
                        <span className="grid-cell-value" style={{ color: data.overdue > 0 ? 'var(--signal-red)' : 'inherit' }}>{data.overdue}</span>
                    </div>
                    <div className="grid-cell" data-label="Blocked" style={{ justifyContent: 'center' }}>
                        <span className="grid-cell-value" style={{ color: data.blocked > 0 ? 'var(--signal-amber)' : 'inherit' }}>{data.blocked}</span>
                    </div>
                    <div className="grid-cell" data-label="Risk" style={{ justifyContent: 'center' }}>
                        <RiskBadge level={data.riskLevel} compact />
                    </div>
                    <div className="grid-cell" data-label="Velocity" style={{ justifyContent: 'flex-end' }}>
                        <SparkLine
                            data={[
                                { value: Math.max(2, data.completed * 0.5) },
                                { value: Math.max(3, data.completed * 0.8) },
                                { value: data.completed }
                            ]}
                            color="var(--brand-primary)"
                        />
                    </div>
                </div>
            ))}
        </div>
    );
}

// ─── Squad Grid Component ──────────────────────────
export function SquadGrid({ squads, onDrillDown }) {
    return (
        <div className="squad-grid animate-in">
            <div className="grid-header">
                <div style={{ textAlign: 'left' }}>Squad Name</div>
                <div style={{ textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>Active <InfoTooltip content="Goals currently in progress." size={12} /></div>
                <div style={{ textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>Done <InfoTooltip content="Completed goals." size={12} /></div>
                <div style={{ textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>Overdue <InfoTooltip content="Active goals past due date." size={12} /></div>
                <div style={{ textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>Blocked <InfoTooltip content="Goals flagged as blocked." size={12} /></div>
                <div style={{ textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>Risk <InfoTooltip content="Automated risk assessment." size={12} /></div>
                <div style={{ textAlign: 'right', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '4px' }}>Velocity <InfoTooltip content="Recent completion trend." size={12} /></div>
            </div>
            {squads.map(([name, data]) => (
                <div
                    key={name}
                    className="grid-row clickable-row"
                    style={{ cursor: 'pointer' }}
                    onClick={() => {
                        if (onDrillDown) onDrillDown('squad', name);
                    }}
                >
                    <div className="grid-cell" data-label="Squad Name" style={{ gap: '12px', justifyContent: 'flex-start' }}>
                        <div
                            style={{
                                width: '32px', height: '32px', borderRadius: '50%',
                                background: 'var(--bg-tertiary)', color: 'var(--brand-primary)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                flexShrink: 0
                            }}
                        >
                            <Building2 size={16} />
                        </div>
                        <div style={{ minWidth: 0 }}>
                            <div style={{ fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{name}</div>
                            <div style={{ fontSize: '0.6875rem', color: 'var(--text-tertiary)' }}>{data.owners?.length || 0} members</div>
                        </div>
                    </div>
                    <div className="grid-cell" data-label="Active" style={{ justifyContent: 'center' }}>
                        <span className="grid-cell-value" style={{ color: 'var(--status-active)' }}>{data.active}</span>
                    </div>
                    <div className="grid-cell" data-label="Done" style={{ justifyContent: 'center' }}>
                        <span className="grid-cell-value" style={{ color: 'var(--signal-green)' }}>{data.completed}</span>
                    </div>
                    <div className="grid-cell" data-label="Overdue" style={{ justifyContent: 'center' }}>
                        <span className="grid-cell-value" style={{ color: data.overdue > 0 ? 'var(--signal-red)' : 'inherit' }}>{data.overdue}</span>
                    </div>
                    <div className="grid-cell" data-label="Blocked" style={{ justifyContent: 'center' }}>
                        <span className="grid-cell-value" style={{ color: data.blocked > 0 ? 'var(--signal-amber)' : 'inherit' }}>{data.blocked}</span>
                    </div>
                    <div className="grid-cell" data-label="Risk" style={{ justifyContent: 'center' }}>
                        <RiskBadge level={data.riskLevel} compact />
                    </div>
                    <div className="grid-cell" data-label="Velocity" style={{ justifyContent: 'flex-end' }}>
                        <SparkLine
                            data={[
                                { value: Math.max(3, data.completed * 0.4) },
                                { value: Math.max(5, data.completed * 0.7) },
                                { value: Math.max(2, data.completed * 0.9) },
                                { value: data.completed }
                            ]}
                            color="var(--brand-primary)"
                        />
                    </div>
                </div>
            ))}
        </div>
    );
}

// ─── Squad Section Component ───────────────────────
export function SquadSection({ name, owners, onOwnerClick }) {
    const [isOpen, setIsOpen] = useState(true);
    const totalOverdue = owners.reduce((s, [, o]) => s + o.overdue, 0);
    const totalBlocked = owners.reduce((s, [, o]) => s + o.blocked, 0);
    const atRisk = owners.filter(([, o]) => o.riskLevel !== 'green').length;

    return (
        <div style={{ marginBottom: 'var(--space-md)' }}>
            <div
                className="card"
                style={{
                    padding: '12px 16px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    background: 'var(--bg-secondary)',
                    borderBottom: isOpen ? 'none' : '1px solid var(--border-primary)',
                    borderBottomLeftRadius: isOpen ? 0 : 'var(--radius-lg)',
                    borderBottomRightRadius: isOpen ? 0 : 'var(--radius-lg)',
                    transition: 'all 0.2s ease'
                }}
                onClick={() => setIsOpen(!isOpen)}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <ChevronRight
                        size={18}
                        style={{
                            transform: isOpen ? 'rotate(90deg)' : 'none',
                            transition: 'transform 0.2s ease',
                            color: 'var(--text-tertiary)'
                        }}
                    />
                    <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 600 }}>{name}</h3>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>{owners.length} members</span>
                </div>
                <div style={{ display: 'flex', gap: '16px', fontSize: '0.75rem' }}>
                    {totalOverdue > 0 && <span style={{ color: 'var(--signal-red)', fontWeight: 600 }}>{totalOverdue} Overdue</span>}
                    {totalBlocked > 0 && <span style={{ color: 'var(--signal-amber)', fontWeight: 600 }}>{totalBlocked} Blocked</span>}
                    {atRisk > 0 && <span className="badge badge-red" style={{ scale: '0.9', margin: 0 }}>{atRisk} at risk</span>}
                </div>
            </div>
            {isOpen && (
                <div style={{ borderTop: 'none' }}>
                    <OwnerGrid owners={owners} onRowClick={onOwnerClick} />
                </div>
            )}
        </div>
    );
}

// ─── Owner Detail Panel (Drill-Down) ────────────────
export function OwnerDetailPanel({ owner, data, onClose }) {
    if (!owner || !data) return null;
    const [activeFilter, setActiveFilter] = useState('all');

    const groupedGoals = useMemo(() => {
        const goals = data.goals || [];
        return {
            'Critical & Overdue': goals.filter(g => !isCompleted(g.status) && (isOverdue(g) || isHighPriority(g))),
            'Blocked': goals.filter(g => !isCompleted(g.status) && isBlocked(g.status)),
            'Active In Progress': goals.filter(g => !isCompleted(g.status) && isActive(g.status) && !isOverdue(g) && !isHighPriority(g)),
            'Completed': goals.filter(g => isCompleted(g.status)).map(g => ({
                ...g,
                wasOverdue: g.dueDate && new Date(g.dueDate) < new Date(),
                wasCritical: isHighPriority(g)
            })),
        };
    }, [data.goals]);

    const filteredGroups = activeFilter === 'all'
        ? groupedGoals
        : Object.fromEntries(
            Object.entries(groupedGoals).map(([name, goals]) => {
                if (activeFilter === 'overdue' && name === 'Critical & Overdue') return [name, goals.filter(g => isOverdue(g))];
                if (activeFilter === 'high_priority' && name === 'Critical & Overdue') return [name, goals.filter(g => isHighPriority(g))];
                if (activeFilter === 'blocked' && name === 'Blocked') return [name, goals];
                if (activeFilter === 'active' && name === 'Active In Progress') return [name, goals];
                if (activeFilter === 'completed' && name === 'Completed') return [name, goals];
                return [name, []];
            })
        );

    const toggleFilter = (f) => setActiveFilter(activeFilter === f ? 'all' : f);

    return (
        <div className="detail-panel-overlay" onClick={onClose}>
            <div className="detail-panel animate-in-right" onClick={e => e.stopPropagation()}>
                <div className="detail-header">
                    <div>
                        <h2 style={{ margin: 0, fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div style={{
                                width: '32px', height: '32px', borderRadius: '50%',
                                background: 'var(--brand-primary)', color: 'white',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem',
                                overflow: 'hidden', border: '1.5px solid #7c3aed', padding: '1px'
                            }}>
                                {data.profileImage ? (
                                    <img src={data.profileImage} alt={owner} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
                                ) : (
                                    owner.charAt(0)
                                )}
                            </div>
                            {owner}
                        </h2>
                        <div style={{ fontSize: '0.875rem', color: 'var(--text-tertiary)', marginTop: '4px' }}>
                            {data.squad || 'Independent Contributors'} · {data.totalGoals} goals
                        </div>
                        <Link
                            href={`/people/${slugify(owner)}`}
                            className="btn btn-ghost btn-sm"
                            style={{ marginTop: '8px', paddingLeft: 0, color: 'var(--brand-primary)', gap: '4px', fontSize: '0.75rem' }}
                        >
                            View Full Profile <ArrowUpRight size={14} />
                        </Link>
                    </div>
                    <button className="btn btn-ghost" onClick={onClose}><X size={20} /></button>
                </div>

                <div className="detail-content">
                    <div className="metrics-grid metrics-grid-3" style={{ gap: '8px' }}>
                        <div
                            className={`stat-box clickable ${activeFilter === 'active' ? 'active' : ''}`}
                            onClick={() => toggleFilter('active')}
                            style={{ cursor: 'pointer', transition: 'all 0.2s', padding: '12px', border: activeFilter === 'active' ? '1px solid var(--status-active)' : '1px solid var(--border-secondary)' }}
                        >
                            <div className="stat-label">Active</div>
                            <div className="stat-value" style={{ color: 'var(--status-active)' }}>{data.active}</div>
                        </div>
                        <div
                            className={`stat-box clickable ${activeFilter === 'high_priority' ? 'active' : ''}`}
                            onClick={() => toggleFilter('high_priority')}
                            style={{ cursor: 'pointer', transition: 'all 0.2s', padding: '12px', border: activeFilter === 'high_priority' ? '1px solid var(--status-overdue)' : '1px solid var(--border-secondary)' }}
                        >
                            <div className="stat-label">High P</div>
                            <div className="stat-value" style={{ color: 'var(--status-overdue)' }}>{data.highPriority}</div>
                        </div>
                        <div
                            className={`stat-box clickable ${activeFilter === 'overdue' ? 'active' : ''}`}
                            onClick={() => toggleFilter('overdue')}
                            style={{ cursor: 'pointer', transition: 'all 0.2s', padding: '12px', border: activeFilter === 'overdue' ? '1px solid var(--signal-red)' : '1px solid var(--border-secondary)' }}
                        >
                            <div className="stat-label">Overdue</div>
                            <div className="stat-value" style={{ color: 'var(--signal-red)' }}>{data.overdue}</div>
                        </div>
                        <div
                            className={`stat-box clickable ${activeFilter === 'blocked' ? 'active' : ''}`}
                            onClick={() => toggleFilter('blocked')}
                            style={{ cursor: 'pointer', transition: 'all 0.2s', padding: '12px', border: activeFilter === 'blocked' ? '1px solid var(--signal-amber)' : '1px solid var(--border-secondary)' }}
                        >
                            <div className="stat-label">Blocked</div>
                            <div className="stat-value" style={{ color: 'var(--signal-amber)' }}>{data.blocked}</div>
                        </div>
                        <div
                            className={`stat-box clickable ${activeFilter === 'completed' ? 'active' : ''}`}
                            onClick={() => toggleFilter('completed')}
                            style={{ cursor: 'pointer', transition: 'all 0.2s', padding: '12px', border: activeFilter === 'completed' ? '1px solid var(--signal-green)' : '1px solid var(--border-secondary)' }}
                        >
                            <div className="stat-label">Done</div>
                            <div className="stat-value" style={{ color: 'var(--signal-green)' }}>{data.completed}</div>
                        </div>
                        <div
                            className="stat-box"
                            style={{ padding: '12px', border: '1px solid var(--border-secondary)' }}
                        >
                            <div className="stat-label">Health</div>
                            <RiskBadge level={data.riskLevel} />
                        </div>
                    </div>

                    <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
                            {activeFilter !== 'all' ? `Filtering by ${activeFilter}` : 'Showing all tasks'}
                        </div>
                        {activeFilter !== 'all' && (
                            <button className="btn btn-ghost btn-sm" onClick={() => setActiveFilter('all')} style={{ fontSize: '0.7rem' }}>Clear Filter</button>
                        )}
                    </div>

                    {Object.entries(filteredGroups).map(([group, goals]) => (
                        goals.length > 0 && (
                            <div key={group} style={{ marginTop: '24px' }}>
                                <h3 style={{
                                    fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-secondary)',
                                    borderBottom: '1px solid var(--border-secondary)', paddingBottom: '8px', marginBottom: '12px'
                                }}>
                                    {group} <span style={{ opacity: 0.5 }}>({goals.length})</span>
                                </h3>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    {goals.map((goal, i) => (
                                        <div key={i} className="card task-card" style={{ padding: '12px', borderLeft: `3px solid ${getStatusColor(goal.status)}` }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '4px' }}>
                                                <a
                                                    href={goal.sourceUrl || goal.notionUrl}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="hover-underline"
                                                    style={{ fontWeight: 500, color: 'var(--text-primary)', textDecoration: 'none', lineHeight: '1.4' }}
                                                >
                                                    {goal.goalTitle} <ExternalLink size={10} style={{ display: 'inline', opacity: 0.5 }} />
                                                </a>
                                                <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                                                    {isHighPriority(goal) && !isCompleted(goal.status) && (
                                                        <span className="badge badge-red" style={{ fontSize: '0.6rem', padding: '1px 4px' }}>Critical</span>
                                                    )}
                                                    {isOverdue(goal) && !isCompleted(goal.status) && (
                                                        <span className="badge badge-amber" style={{ fontSize: '0.6rem', padding: '1px 4px' }}>Overdue</span>
                                                    )}
                                                    <span className="badge badge-neutral" style={{ fontSize: '0.65rem' }}>{goal.status}</span>
                                                </div>
                                            </div>
                                            <div style={{ display: 'flex', gap: '8px', fontSize: '0.75rem', color: 'var(--text-tertiary)', flexWrap: 'wrap' }}>
                                                {goal.dueDate && (
                                                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: (isOverdue(goal) && !isCompleted(goal.status)) ? 'var(--signal-red)' : 'inherit' }}>
                                                        <Clock size={10} /> {goal.dueDate}
                                                    </span>
                                                )}
                                                {group === 'Completed' && (
                                                    <>
                                                        {goal.wasCritical && (
                                                            <span className="badge badge-red" style={{ scale: '0.8', margin: 0, padding: '2px 6px' }}>Was Critical</span>
                                                        )}
                                                        {goal.wasOverdue && (
                                                            <span className="badge badge-amber" style={{ scale: '0.8', margin: 0, padding: '2px 6px' }}>Was Overdue</span>
                                                        )}
                                                        <span className="badge badge-green" style={{ scale: '0.8', margin: 0, padding: '2px 6px' }}>Completed</span>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )
                    ))}
                </div>
            </div>
        </div>
    );
}
