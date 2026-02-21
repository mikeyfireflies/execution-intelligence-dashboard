'use client';

import { useState, useMemo } from 'react';
import { Users, Activity, CheckCircle2, Clock, Shield, Flame, AlertTriangle, AlertCircle, Filter, ArrowUpDown, ChevronDown, HelpCircle } from 'lucide-react';
import { MetricCard } from './DashboardMetrics';
import { SquadSection, OwnerDetailPanel, CollabDetailPanel } from './DashboardGrids';

export default function IndividualView({ data, unfilteredData, watchlistOnly, onToggleWatchlist, onFilterChange }) {
    if (!data) return null;
    const [selectedOwner, setSelectedOwner] = useState(null);
    const [selectedCollab, setSelectedCollab] = useState(null);
    const [sortConfig, setSortConfig] = useState({ key: 'risk', direction: 'desc' });
    const [filterConfig, setFilterConfig] = useState({ risk: 'all', workload: 'all', velocity: 'all' });
    const [filterMenuOpen, setFilterMenuOpen] = useState(false);

    const owners = Object.entries(data);

    const handleSort = (key) => {
        setSortConfig(prev => ({
            key,
            direction: prev.key === key && prev.direction === 'desc' ? 'asc' : 'desc'
        }));
    };

    // Memoize global metrics
    const metrics = useMemo(() => {
        const allOwnersData = Object.entries(unfilteredData || data);
        return {
            totalActive: allOwnersData.reduce((s, [, o]) => s + (o.active || 0), 0),
            totalCompleted: allOwnersData.reduce((s, [, o]) => s + (o.completed || 0), 0),
            totalOverdue: allOwnersData.reduce((s, [, o]) => s + (o.overdue || 0), 0),
            totalBlocked: allOwnersData.reduce((s, [, o]) => s + (o.blocked || 0), 0),
            totalHighP: allOwnersData.reduce((s, [, o]) => s + (o.highPriority || 0), 0),
            totalUnknown: allOwnersData.reduce((s, [, o]) => s + (o.unknown || 0), 0),
            atRisk: allOwnersData.filter(([, o]) => o.riskLevel !== 'green').length
        };
    }, [unfilteredData, data]);

    // Memoize and sort squads
    const renderedSquads = useMemo(() => {
        // First filter owners
        const filteredOwners = owners.filter(([, o]) => {
            if (filterConfig.risk !== 'all' && o.riskLevel !== filterConfig.risk) return false;
            if (filterConfig.workload === 'overloaded' && (o.totalGoals || 0) <= 8) return false;
            if (filterConfig.velocity === 'high' && (o.completed || 0) < 5) return false;
            return true;
        });

        const squadsMap = filteredOwners.reduce((acc, [key, o]) => {
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
                return a[0].localeCompare(b[0]);
            })
            .map(([squadName, squadOwners]) => {
                // Sort owners within squad based on sortConfig
                const sortedOwners = [...squadOwners].sort((a, b) => {
                    const [_aKey, aData] = a;
                    const [_bKey, bData] = b;
                    let valA, valB;

                    switch (sortConfig.key) {
                        case 'name': valA = aData.name; valB = bData.name; break;
                        case 'active': valA = aData.active; valB = bData.active; break;
                        case 'completed': valA = aData.completed; valB = bData.completed; break;
                        case 'overdue': valA = aData.overdue; valB = bData.overdue; break;
                        case 'blocked': valA = aData.blocked; valB = bData.blocked; break;
                        case 'risk':
                            const riskMap = { red: 3, amber: 2, yellow: 1, green: 0 };
                            valA = riskMap[aData.riskLevel] || 0;
                            valB = riskMap[bData.riskLevel] || 0;
                            break;
                        case 'velocity': valA = aData.completed; valB = bData.completed; break; // Simple proxy
                        default: return 0;
                    }

                    if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
                    if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
                    return 0;
                });

                // Attach sort info for the UI
                sortedOwners._sortConfig = sortConfig;
                sortedOwners._onSort = handleSort;

                const primary = sortedOwners.filter(([, o]) => (o.totalGoals || 0) > 0);
                const contributors = sortedOwners.filter(([, o]) => (o.totalGoals || 0) === 0 && (o.contributedGoals?.length || 0) > 0);
                return [squadName, { primary, contributors }];
            });
    }, [owners, sortConfig, filterConfig]);

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
                <MetricCard label="Unknown Status" value={metrics.totalUnknown} icon={HelpCircle} color="var(--text-tertiary)" onClick={() => onFilterChange('status', 'unknown')} tooltip="Active goals without a defined status." />
                <MetricCard label="At Risk" value={metrics.atRisk} icon={AlertTriangle} color={metrics.atRisk > 0 ? 'var(--signal-red)' : 'var(--signal-green)'} onClick={() => onFilterChange('status', 'critical')} tooltip="Individuals with multiple overdue or blocked items." />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '12px', gap: '8px', position: 'relative' }}>
                <button
                    className="btn btn-sm"
                    onClick={() => setFilterMenuOpen(!filterMenuOpen)}
                    style={{ gap: '6px', background: Object.values(filterConfig).some(v => v !== 'all') ? 'var(--brand-primary-light)' : 'var(--bg-secondary)' }}
                >
                    <Filter size={14} />
                    Filter
                    <ChevronDown size={12} />
                </button>

                {filterMenuOpen && (
                    <>
                        <div className="dropdown-overlay" onClick={() => setFilterMenuOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 100 }} />
                        <div className="dropdown-menu animate-in" style={{ position: 'absolute', top: '100%', right: '140px', marginTop: '4px', zIndex: 101, width: '220px', background: 'var(--bg-elevated)', border: '1px solid var(--border-primary)', borderRadius: 'var(--radius-md)', padding: '12px', boxShadow: 'var(--shadow-lg)' }}>
                            <div style={{ marginBottom: '12px' }}>
                                <div style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', marginBottom: '8px' }}>Risk Level</div>
                                <div style={{ display: 'flex', gap: '4px' }}>
                                    {['all', 'red', 'amber', 'green'].map(r => (
                                        <button
                                            key={r}
                                            onClick={() => setFilterConfig(prev => ({ ...prev, risk: r }))}
                                            style={{
                                                flex: 1, padding: '4px', fontSize: '0.7rem', borderRadius: '4px', border: '1px solid var(--border-secondary)',
                                                background: filterConfig.risk === r ? 'var(--brand-primary)' : 'transparent',
                                                color: filterConfig.risk === r ? 'white' : 'var(--text-primary)'
                                            }}
                                        >
                                            {r.charAt(0).toUpperCase() + r.slice(1)}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div style={{ marginBottom: '12px' }}>
                                <div style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', marginBottom: '8px' }}>Workload</div>
                                <button
                                    onClick={() => setFilterConfig(prev => ({ ...prev, workload: prev.workload === 'overloaded' ? 'all' : 'overloaded' }))}
                                    style={{
                                        width: '100%', padding: '6px', fontSize: '0.75rem', textAlign: 'left', borderRadius: '4px', border: '1px solid var(--border-secondary)',
                                        background: filterConfig.workload === 'overloaded' ? 'var(--brand-primary)' : 'transparent',
                                        color: filterConfig.workload === 'overloaded' ? 'white' : 'var(--text-primary)'
                                    }}
                                >
                                    Overloaded (&gt; 8 goals)
                                </button>
                            </div>
                            <div>
                                <div style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', marginBottom: '8px' }}>Efficiency</div>
                                <button
                                    onClick={() => setFilterConfig(prev => ({ ...prev, velocity: prev.velocity === 'high' ? 'all' : 'high' }))}
                                    style={{
                                        width: '100%', padding: '6px', fontSize: '0.75rem', textAlign: 'left', borderRadius: '4px', border: '1px solid var(--border-secondary)',
                                        background: filterConfig.velocity === 'high' ? 'var(--brand-primary)' : 'transparent',
                                        color: filterConfig.velocity === 'high' ? 'white' : 'var(--text-primary)'
                                    }}
                                >
                                    High Velocity (5+ Done)
                                </button>
                            </div>
                            <div style={{ marginTop: '12px', borderTop: '1px solid var(--border-secondary)', paddingTop: '8px' }}>
                                <button
                                    onClick={() => { setFilterConfig({ risk: 'all', workload: 'all', velocity: 'all' }); setFilterMenuOpen(false); }}
                                    style={{ width: '100%', background: 'none', border: 'none', color: 'var(--brand-primary)', fontSize: '0.75rem', cursor: 'pointer' }}
                                >
                                    Reset Filters
                                </button>
                            </div>
                        </div>
                    </>
                )}

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
                            <div
                                key={pair.key}
                                className="card clickable-card"
                                onClick={() => setSelectedCollab(pair)}
                                style={{
                                    padding: '12px 16px', display: 'flex',
                                    alignItems: 'center', justifyContent: 'space-between',
                                    background: 'var(--bg-secondary)', border: '1px solid var(--border-primary)',
                                    transition: 'all 0.2s ease',
                                    cursor: 'pointer'
                                }}
                            >
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
                                    <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                                        {pair.names[0]} & {pair.names[1]}
                                    </div>
                                </div>
                                <div style={{
                                    fontSize: '0.7rem', fontWeight: 600,
                                    color: 'white', background: 'var(--brand-primary)',
                                    padding: '3px 10px', borderRadius: '12px', whiteSpace: 'nowrap'
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

            {selectedCollab && (
                <CollabDetailPanel
                    pair={selectedCollab}
                    allData={unfilteredData || data}
                    onClose={() => setSelectedCollab(null)}
                />
            )}
        </>
    );
}
