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
            });
    }, [owners]);

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

            {renderedSquads.map(([squadName, squadOwners]) => (
                <SquadSection
                    key={squadName}
                    name={squadName}
                    owners={squadOwners}
                    onOwnerClick={(owner, data) => setSelectedOwner({ owner, data })}
                />
            ))}

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
