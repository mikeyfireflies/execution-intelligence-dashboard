'use client';

import { useState, useMemo } from 'react';
import { Users, Activity, CheckCircle2, Clock, Shield, Flame, AlertTriangle, AlertCircle } from 'lucide-react';
import { MetricCard } from './DashboardMetrics';
import { SquadSection, OwnerDetailPanel } from './DashboardGrids';

export default function IndividualView({ data, unfilteredData, watchlistOnly, onToggleWatchlist, onFilterChange }) {
    if (!data) return null;
    const [selectedOwner, setSelectedOwner] = useState(null);
    const owners = Object.entries(data);

    // Memoize global metrics
    const metrics = useMemo(() => {
        const allOwnersData = Object.entries(unfilteredData || data);
        return {
            totalActive: allOwnersData.reduce((s, [, o]) => s + (o.active || 0), 0),
            totalCompleted: allOwnersData.reduce((s, [, o]) => s + (o.completed || 0), 0),
            totalOverdue: allOwnersData.reduce((s, [, o]) => s + (o.overdue || 0), 0),
            totalBlocked: allOwnersData.reduce((s, [, o]) => s + (o.blocked || 0), 0),
            totalHighP: allOwnersData.reduce((s, [, o]) => s + (o.highPriority || 0), 0),
            atRisk: allOwnersData.filter(([, o]) => o.riskLevel !== 'green').length
        };
    }, [unfilteredData, data]);

    // Memoize and sort squads
    const renderedSquads = useMemo(() => {
        const squadsMap = owners.reduce((acc, [key, o]) => {
            const s = o.squad || 'Independent Contributors';
            if (!acc[s]) acc[s] = [];
            acc[s].push([key, o]);
            return acc;
        }, {});

        return Object.entries(squadsMap)
            .sort((a, b) => {
                const bHasRisk = b[1].some(o => o[1].riskLevel !== 'green');
                const aHasRisk = a[1].some(o => o[1].riskLevel !== 'green');
                if (aHasRisk && !bHasRisk) return -1;
                if (!aHasRisk && bHasRisk) return 1;
                return 0;
            })
            .map(([squadName, squadOwners]) => {
                // Split into core owners and contributors
                const primary = squadOwners.filter(([, o]) => (o.totalGoals || 0) > 0);
                const contributors = squadOwners.filter(([, o]) => (o.totalGoals || 0) === 0 && (o.contributedGoals?.length || 0) > 0);
                return [squadName, { primary, contributors }];
            });
    }, [owners]);

    // Calculate top collaboration pairs
    const topPairs = useMemo(() => {
        const pairs = [];
        const seen = new Set();

        Object.values(unfilteredData || data).forEach(person => {
            Object.entries(person.collaborators || {}).forEach(([collabName, count]) => {
                const pairKey = [person.name, collabName].sort().join(' ↔ ');
                if (!seen.has(pairKey)) {
                    pairs.push({
                        names: [person.name, collabName].sort(),
                        count,
                        key: pairKey
                    });
                    seen.add(pairKey);
                }
            });
        });

        return pairs.sort((a, b) => b.count - a.count).slice(0, 12);
    }, [unfilteredData, data]);

    return (
        <>
            <div className="metrics-grid metrics-grid-4" style={{ marginBottom: 'var(--space-sm)' }}>
                <MetricCard label="Team Members" value={owners.length} icon={Users} color="var(--brand-primary)" onClick={() => onToggleWatchlist()} tooltip="Total number of individuals tracking goals." />
                <MetricCard label="Active Goals" value={metrics.totalActive} icon={Activity} color="var(--status-active)" onClick={() => onFilterChange('status', 'active')} tooltip="Goals currently in progress." />
                <MetricCard label="Completed" value={metrics.totalCompleted} icon={CheckCircle2} color="var(--signal-green)" onClick={() => onFilterChange('status', 'completed')} tooltip="Goals marked as Done or Shipped." />
                <MetricCard label="Overdue" value={metrics.totalOverdue} icon={Clock} color="var(--signal-red)" onClick={() => onFilterChange('status', 'overdue')} tooltip="Goals past their due date." />
                <MetricCard label="Blocked" value={metrics.totalBlocked} icon={Shield} color="var(--signal-amber)" onClick={() => onFilterChange('status', 'blocked')} tooltip="Goals flagged as blocked by dependencies." />
                <MetricCard label="High Priority" value={metrics.totalHighP} icon={Flame} color="var(--status-overdue)" onClick={() => onFilterChange('status', 'high_priority')} tooltip="Goals marked as High Priority or Critical." />
                <MetricCard label="At Risk" value={metrics.atRisk} icon={AlertTriangle} color={metrics.atRisk > 0 ? 'var(--signal-red)' : 'var(--signal-green)'} onClick={() => onFilterChange('status', 'critical')} tooltip="Individuals with multiple overdue or blocked items." />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '12px' }}>
                <button
                    className={`btn btn-sm ${watchlistOnly ? 'active' : ''}`}
                    onClick={onToggleWatchlist}
                    style={{ gap: '6px' }}
                >
                    <AlertCircle size={14} />
                    {watchlistOnly ? 'Show All Members' : 'Watchlist Only'}
                </button>
            </div>

            {renderedSquads.map(([squadName, { primary, contributors }]) => (
                <div key={squadName} style={{ marginBottom: 'var(--space-xl)' }}>
                    {primary.length > 0 && (
                        <SquadSection
                            name={squadName}
                            owners={primary}
                            onOwnerClick={(owner, data) => setSelectedOwner({ owner, data })}
                        />
                    )}
                    {contributors.length > 0 && (
                        <div style={{ marginTop: 'var(--space-md)', opacity: primary.length > 0 ? 0.85 : 1 }}>
                            {primary.length > 0 && (
                                <div style={{
                                    fontSize: '0.6875rem', fontWeight: 700,
                                    color: 'var(--text-tertiary)', textTransform: 'uppercase',
                                    padding: '12px 16px 8px', letterSpacing: '0.05em'
                                }}>
                                    Supporting Contributors
                                </div>
                            )}
                            <SquadSection
                                name={primary.length > 0 ? "" : squadName}
                                owners={contributors}
                                onOwnerClick={(owner, data) => setSelectedOwner({ owner, data })}
                            />
                        </div>
                    )}
                </div>
            ))}

            {/* Collaboration Map Section */}
            {topPairs.length > 0 && (
                <div className="animate-in fade-in slide-in-from-bottom-4" style={{ marginTop: 'var(--space-2xl)', animationDuration: '600ms' }}>
                    <div style={{
                        display: 'flex', alignItems: 'center', gap: '10px',
                        marginBottom: 'var(--space-lg)', borderTop: '1px solid var(--border-primary)',
                        paddingTop: 'var(--space-xl)'
                    }}>
                        <Users size={20} style={{ color: 'var(--brand-primary)' }} />
                        <h2 style={{ fontSize: '1.25rem', margin: 0 }}>Collaboration Map</h2>
                        <span className="badge badge-neutral" style={{ fontSize: '0.7rem' }}>Top Relationships</span>
                    </div>

                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                        gap: '12px'
                    }}>
                        {topPairs.map((pair) => (
                            <div key={pair.key} className="card" style={{
                                padding: '12px 16px', display: 'flex',
                                alignItems: 'center', justifyContent: 'space-between',
                                background: 'var(--bg-secondary)', border: '1px solid var(--border-primary)',
                                transition: 'transform 0.2s ease',
                                cursor: 'default'
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', position: 'relative' }}>
                                        {pair.names.map((name, i) => (
                                            <div key={name} style={{
                                                width: '28px', height: '28px', borderRadius: '50%',
                                                background: i === 0 ? 'var(--bg-tertiary)' : 'var(--bg-primary)',
                                                color: 'var(--brand-primary)',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                fontSize: '0.75rem', fontWeight: 700,
                                                border: '2px solid var(--bg-secondary)',
                                                marginLeft: i > 0 ? '-10px' : 0,
                                                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                                                zIndex: 2 - i
                                            }}>
                                                {String(name || '?').charAt(0)}
                                            </div>
                                        ))}
                                    </div>
                                    <div style={{ fontSize: '0.8125rem', fontWeight: 500, color: 'var(--text-primary)' }}>
                                        {pair.names[0]} & {pair.names[1]}
                                    </div>
                                </div>
                                <div style={{
                                    fontSize: '0.7rem', fontWeight: 600,
                                    color: 'var(--brand-primary)', background: 'rgba(124, 58, 237, 0.1)',
                                    padding: '2px 8px', borderRadius: '12px', whiteSpace: 'nowrap'
                                }}>
                                    {pair.count} goals
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {selectedOwner && (
                <OwnerDetailPanel
                    owner={selectedOwner.owner}
                    data={selectedOwner.data}
                    onClose={() => setSelectedOwner(null)}
                />
            )}
        </>
    );
}
