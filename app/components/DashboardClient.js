'use client';

import { useState, useEffect, useCallback } from 'react';
import { AlertTriangle } from 'lucide-react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import DashboardLayout from './DashboardLayout';

export default function DashboardClient({ children }) {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [lastFetched, setLastFetched] = useState(null);
    const [theme, setTheme] = useState('dark');
    const [autoRefresh, setAutoRefresh] = useState(true);
    const [devMode, setDevMode] = useState(false);
    const [watchlistOnly, setWatchlistOnly] = useState(false);

    const searchParams = useSearchParams();
    const router = useRouter();
    const pathname = usePathname();

    // URL Sync for Filters
    const filters = {
        search: searchParams.get('q') || '',
        status: searchParams.get('status') || 'all'
    };

    const handleFilterChange = (key, value) => {
        const params = new URLSearchParams(searchParams.toString());
        if (key === 'reset') {
            params.delete('q');
            params.delete('status');
        } else if (key === 'search') {
            if (value) params.set('q', value);
            else params.delete('q');
        } else if (key === 'status') {
            if (value && value !== 'all') params.set('status', value);
            else params.delete('status');
        }
        router.replace(`${pathname}?${params.toString()}`);
    };

    const fetchData = useCallback(async (forceRefresh = false) => {
        try {
            setLoading(true);
            setError(null);
            const res = await fetch(`/api/notion?view=all${forceRefresh ? '&refresh=true' : ''}`);
            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || 'Failed to fetch');
            }
            const json = await res.json();
            setData(json);
            setLastFetched(json.lastFetched);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    useEffect(() => {
        if (!autoRefresh) return;
        const interval = setInterval(() => fetchData(), 5 * 60 * 1000); // 5 min
        return () => clearInterval(interval);
    }, [autoRefresh, fetchData]);

    const toggleTheme = () => {
        const next = theme === 'dark' ? 'light' : 'dark';
        setTheme(next);
        document.documentElement.setAttribute('data-theme', next);
    };

    const viewConfig = {
        individual: { title: 'Individual Execution', subtitle: 'Track each team member\'s goals, velocity, and risk signals' },
        squads: { title: 'Squad Rollups', subtitle: 'Aggregated squad-level execution visibility' },
        company: { title: 'Company Overview', subtitle: 'Holistic execution health and trend analysis' },
        executive: { title: 'Executive Mode', subtitle: 'Krish Mode — 10-minute daily scan' },
    };

    const getFilteredData = () => {
        if (!data) return null;
        const { search, status } = filters;
        if (!search && status === 'all' && !watchlistOnly) return data;

        const query = search.toLowerCase();

        // Filter Individual
        const filteredIndividual = {};
        if (data.individual) {
            Object.entries(data.individual).forEach(([key, owner]) => {
                if (watchlistOnly && owner.riskLevel === 'green') return;

                // Get goals that match the search criteria
                let relevantGoals = owner.goals || [];

                if (query) {
                    relevantGoals = relevantGoals.filter(g =>
                        (g.goalTitle || '').toLowerCase().includes(query)
                    );
                }

                // From those goals, check if any match the status criteria
                let hasMatchingGoal = false;

                if (status === 'all') {
                    hasMatchingGoal = relevantGoals.length > 0 || !query;
                } else if (status === 'critical') {
                    // Critical is an owner-level filter, not goal-level
                    hasMatchingGoal = owner.riskLevel === 'red' && (!query || relevantGoals.length > 0);
                } else {
                    hasMatchingGoal = relevantGoals.some(goal => {
                        const goalStatus = (goal.status || '').toLowerCase();
                        const dueDate = goal.dueDate ? new Date(goal.dueDate) : null;
                        const isOverdue = dueDate && dueDate < new Date() && !['done', 'complete', 'completed', 'shipped'].includes(goalStatus);
                        const isBlocked = goalStatus === 'blocked' || goalStatus === 'on hold' || goalStatus === 'waiting';
                        const isCompleted = ['done', 'complete', 'completed', 'shipped'].includes(goalStatus);
                        const isActive = ['in progress', 'active', 'in review'].includes(goalStatus);
                        const isHighPriority = goal.priority === 'High' || goal.priority === 'Critical';

                        return (
                            (status === 'overdue' && isOverdue) ||
                            (status === 'blocked' && isBlocked) ||
                            (status === 'completed' && isCompleted) ||
                            (status === 'active' && isActive) ||
                            (status === 'high_priority' && isHighPriority) ||
                            (status === 'at_risk' && (owner.riskLevel === 'amber' || owner.riskLevel === 'red'))
                        );
                    });
                }

                // Also allow showing owner by name/squad even if no matching goals (for name/squad search)
                const matchesNameOrSquad = !query ||
                    owner.name.toLowerCase().includes(query) ||
                    (owner.squad && owner.squad.toLowerCase().includes(query));

                // Show owner if they have matching goals OR if their name/squad matches (and status is 'all' or owner-level match)
                const shouldShow = hasMatchingGoal || (matchesNameOrSquad && (status === 'all' || (status === 'critical' && owner.riskLevel === 'red')));

                if (shouldShow) {
                    filteredIndividual[key] = owner;
                }
            });
        }

        // Filter Squads
        const filteredSquads = {};
        if (data.squads) {
            Object.entries(data.squads).forEach(([name, squad]) => {
                const matchesSearch = !query || name.toLowerCase().includes(query);
                const matchesStatus = status === 'all' ||
                    (status === 'overdue' && squad.overdue > 0) ||
                    (status === 'blocked' && squad.blocked > 0) ||
                    (status === 'completed' && squad.completed > 0) ||
                    (status === 'active' && squad.active > 0) ||
                    (status === 'high_priority' && squad.highPriority > 0);

                if (matchesSearch && matchesStatus) {
                    filteredSquads[name] = squad;
                }
            });
        }

        return { ...data, individual: filteredIndividual, squads: filteredSquads };
    };

    const displayData = getFilteredData();

    return (
        <DashboardLayout
            loading={loading}
            lastFetched={lastFetched}
            fetchData={fetchData}
            theme={theme}
            toggleTheme={toggleTheme}
            autoRefresh={autoRefresh}
            setAutoRefresh={setAutoRefresh}
            devMode={devMode}
            setDevMode={setDevMode}
            viewConfig={viewConfig}
            data={displayData}
        >
            {error && (
                <div className="error-state">
                    <div className="error-message">
                        <AlertTriangle size={20} style={{ marginBottom: '8px' }} />
                        <div style={{ fontWeight: 600, marginBottom: '4px' }}>Connection Error</div>
                        <div style={{ fontSize: '0.8125rem' }}>{error}</div>
                        <button className="btn btn-sm" onClick={() => fetchData(true)} style={{ marginTop: '12px' }}>
                            Refresh
                        </button>
                    </div>
                </div>
            )}

            {loading && !data && <div style={{ padding: 'var(--space-2xl)' }}>Loading dashboard data...</div>}

            {data && !error && (
                <div className="page-body">
                    {children({
                        data: displayData,
                        unfilteredData: data,
                        filters,
                        handleFilterChange,
                        watchlistOnly,
                        onToggleWatchlist: () => setWatchlistOnly(!watchlistOnly),
                        router
                    })}
                </div>
            )}
        </DashboardLayout>
    );
}
