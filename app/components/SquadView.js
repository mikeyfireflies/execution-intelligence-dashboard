'use client';

import { useState } from 'react';
import { Building2, Activity, CheckCircle2, Clock, AlertTriangle, AlertCircle } from 'lucide-react';
import { MetricCard } from './DashboardMetrics';
import { SquadGrid } from './DashboardGrids';

export default function SquadView({ data, unfilteredData, onDrillDown, onFilterChange }) {
    if (!data) return null;
    const [watchlistOnly, setWatchlistOnly] = useState(false);
    const squads = Object.entries(data);
    const allSquadsData = Object.entries(unfilteredData || data);

    const totalActive = allSquadsData.reduce((s, [, sq]) => s + sq.active, 0);
    const totalCompleted = allSquadsData.reduce((s, [, sq]) => s + sq.completed, 0);
    const totalOverdue = allSquadsData.reduce((s, [, sq]) => s + sq.overdue, 0);
    const atRisk = allSquadsData.filter(([, sq]) => sq.riskLevel !== 'green').length;

    const filteredSquads = squads
        .filter(([, sq]) => !watchlistOnly || sq.riskLevel !== 'green')
        .sort((a, b) => {
            const riskOrder = { red: 0, amber: 1, green: 2 };
            return (riskOrder[a[1].riskLevel] || 3) - (riskOrder[b[1].riskLevel] || 3);
        });

    return (
        <>
            <div className="metrics-grid metrics-grid-3" style={{ marginBottom: 'var(--space-sm)' }}>
                <MetricCard label="Squads" value={squads.length} icon={Building2} color="var(--brand-primary)" tooltip="Functional teams grouping multiple individuals." />
                <MetricCard label="Active" value={totalActive} icon={Activity} color="var(--status-active)" onClick={() => onFilterChange('status', 'active')} tooltip="Aggregated active goals across all squads." />
                <MetricCard label="Completed" value={totalCompleted} icon={CheckCircle2} color="var(--signal-green)" onClick={() => onFilterChange('status', 'completed')} tooltip="Total completed goals across all squads." />
                <MetricCard label="Overdue" value={totalOverdue} icon={Clock} color="var(--signal-red)" onClick={() => onFilterChange('status', 'overdue')} tooltip="Total overdue items requiring attention." />
                <MetricCard label="At Risk" value={atRisk} icon={AlertTriangle} color={atRisk > 0 ? 'var(--signal-red)' : 'var(--signal-green)'} onClick={() => onFilterChange('status', 'critical')} tooltip="Squads with high concentration of risks." />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '12px' }}>
                <button
                    className={`btn btn-sm ${watchlistOnly ? 'active' : ''}`}
                    onClick={() => setWatchlistOnly(!watchlistOnly)}
                    style={{ gap: '6px' }}
                >
                    <AlertCircle size={14} />
                    {watchlistOnly ? 'Show All Squads' : 'Watchlist Only'}
                </button>
            </div>

            <SquadGrid squads={filteredSquads} onDrillDown={onDrillDown} />
        </>
    );
}
