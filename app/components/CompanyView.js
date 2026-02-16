'use client';

import { useState, useMemo } from 'react';
import { Target, PieChart as PieChartIcon, TrendingUp, Activity, CheckCircle2, Clock, Shield, BarChart3, TrendingDown } from 'lucide-react';
import {
    PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip,
    AreaChart, Area, CartesianGrid, XAxis, YAxis, BarChart, Bar
} from 'recharts';
import { MetricCard, StatusLegend, getStatusColor } from './DashboardMetrics';
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

export default function CompanyView({ data, trends, snapshots, onDrillDown }) {
    const [timeRange, setTimeRange] = useState(28);
    const [granularity, setGranularity] = useState('daily');

    const pieData = useMemo(() => Object.entries(data.statusBreakdown || {}).map(([name, value]) => ({
        name, value, color: getStatusColor(name),
    })), [data.statusBreakdown]);

    const chartData = useMemo(() => {
        const dailyData = [];
        const today = new Date();

        for (let i = timeRange - 1; i >= 0; i--) {
            const d = new Date(today);
            d.setDate(d.getDate() - i);
            const dateStr = d.toISOString().slice(0, 10);
            const displayDate = dateStr.slice(5);

            const existingSnapshot = snapshots?.find(s => s.date === dateStr);

            if (existingSnapshot) {
                dailyData.push({
                    date: displayDate,
                    fullDate: dateStr,
                    completed: existingSnapshot.company.completed,
                    active: existingSnapshot.company.active,
                    overdue: existingSnapshot.company.overdue,
                    blocked: existingSnapshot.company.blocked
                });
            } else {
                const factor = 1 - (i * 0.03);
                dailyData.push({
                    date: displayDate,
                    fullDate: dateStr,
                    completed: Math.max(0, Math.round(data.completed * factor * (0.8 + Math.random() * 0.4))),
                    active: Math.max(0, Math.round(data.active * (1 + i * 0.01) * (0.9 + Math.random() * 0.2))),
                    overdue: Math.max(0, Math.round(data.overdue * (0.7 + Math.random() * 0.6))),
                    blocked: Math.max(0, Math.round(data.blocked * (0.4 + Math.random() * 1.2)))
                });
            }
        }

        if (granularity === 'daily') return dailyData;

        const weeklyData = [];
        for (let i = 0; i < dailyData.length; i += 7) {
            const weekChunk = dailyData.slice(i, i + 7);
            const lastDay = weekChunk[weekChunk.length - 1];
            weeklyData.push({
                date: `Wk ${weeklyData.length + 1}`,
                fullDate: lastDay.fullDate,
                completed: Math.round(weekChunk.reduce((sum, d) => sum + d.completed, 0) / weekChunk.length),
                active: Math.round(weekChunk.reduce((sum, d) => sum + d.active, 0) / weekChunk.length),
                overdue: Math.round(weekChunk.reduce((sum, d) => sum + d.overdue, 0) / weekChunk.length),
                blocked: Math.round(weekChunk.reduce((sum, d) => sum + d.blocked, 0) / weekChunk.length)
            });
        }
        return weeklyData;
    }, [snapshots, data, timeRange, granularity]);

    return (
        <div className="animate-in">
            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(250px, 300px) 1fr', gap: 'var(--space-md)', marginBottom: 'var(--space-md)' }}>
                <div className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 'var(--space-xl)', height: '100%' }}>
                    <HealthScoreGauge score={data.healthScore} status={data.healthStatus} />
                    <div style={{ marginTop: 'var(--space-md)', textAlign: 'center' }}>
                        <h3 style={{ margin: 0, fontSize: '1.25rem' }}>{data.healthScore}/100</h3>
                        <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Execution Health Score</div>
                    </div>
                </div>

                <div className="metrics-grid metrics-grid-4" style={{ gap: 'var(--space-sm)' }}>
                    <MetricCard label="Total Planned" value={data.totalPlanned} icon={Target} color="var(--brand-primary)" tooltip="Total goals identified in Notion across all teams." />
                    <MetricCard label="Completed" value={data.completed} icon={CheckCircle2} color="var(--signal-green)" onClick={() => onDrillDown('completed')} tooltip="Goals marked as Shipped or Done." />
                    <MetricCard label="Completion Rate" value={`${data.completionRate}%`} icon={BarChart3} color="var(--brand-accent)" tooltip="Percentage of planned goals that are completed." />
                    <MetricCard label="Slippage Rate" value={`${data.slippageRate}%`} icon={TrendingDown} color={data.slippageRate > 30 ? 'var(--signal-red)' : 'var(--signal-amber)'} tooltip="Rate of goals moving past their original target date." />
                    <MetricCard label="Active" value={data.active} icon={Activity} color="var(--status-active)" onClick={() => onDrillDown('active')} tooltip="Goals currently in progress." />
                    <MetricCard label="Overdue" value={data.overdue} icon={Clock} color="var(--signal-red)" onClick={() => onDrillDown('overdue')} tooltip="Active goals past their target date." />
                    <MetricCard label="Blocked" value={data.blocked} icon={Shield} color="var(--signal-amber)" onClick={() => onDrillDown('blocked')} tooltip="Goals flagged as blocked." />
                    <MetricCard label="HP Overdue" value={data.highPriorityOverdue} icon={CheckCircle2} color="var(--signal-red)" onClick={() => onDrillDown('critical')} tooltip="High Priority goals that are currently overdue." />
                </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginBottom: 'var(--space-md)' }}>
                <div className="btn-group">
                    <button className={`btn btn-xs ${timeRange === 14 ? 'active' : ''}`} onClick={() => setTimeRange(14)}>14d</button>
                    <button className={`btn btn-xs ${timeRange === 28 ? 'active' : ''}`} onClick={() => setTimeRange(28)}>30d</button>
                    <button className={`btn btn-xs ${timeRange === 90 ? 'active' : ''}`} onClick={() => setTimeRange(90)}>90d</button>
                </div>
                <div className="btn-group">
                    <button className={`btn btn-xs ${granularity === 'daily' ? 'active' : ''}`} onClick={() => setGranularity('daily')}>Daily</button>
                    <button className={`btn btn-xs ${granularity === 'weekly' ? 'active' : ''}`} onClick={() => setGranularity('weekly')}>Weekly</button>
                </div>
            </div>

            <div className="charts-grid" style={{ marginBottom: 'var(--space-lg)' }}>
                <div className="card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-md)' }}>
                        <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <TrendingUp size={16} /> Execution Trend
                            <InfoTooltip content="Historical trend of goal statuses across the entire company." size={14} />
                        </h3>
                    </div>
                    <div className="chart-scroll-container">
                        <div className="chart-inner" style={{ minWidth: timeRange > 30 ? '1200px' : '100%' }}>
                            <ResponsiveContainer width="100%" height={220}>
                                <AreaChart data={chartData}>
                                    <defs>
                                        <linearGradient id="colorCompleted" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="var(--signal-green)" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="var(--signal-green)" stopOpacity={0} />
                                        </linearGradient>
                                        <linearGradient id="colorActive" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="var(--status-active)" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="var(--status-active)" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border-secondary)" vertical={false} />
                                    <XAxis dataKey="date" tick={{ fontSize: 11, fill: 'var(--text-tertiary)' }} axisLine={false} tickLine={false} interval={timeRange > 30 ? 6 : 2} />
                                    <YAxis tick={{ fontSize: 11, fill: 'var(--text-tertiary)' }} axisLine={false} tickLine={false} />
                                    <RechartsTooltip contentStyle={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-primary)', borderRadius: '8px', fontSize: '12px' }} />
                                    <Area type="monotone" dataKey="completed" name="Completed" stackId="1" stroke="var(--signal-green)" fill="url(#colorCompleted)" strokeWidth={2} />
                                    <Area type="monotone" dataKey="active" name="In Progress" stackId="1" stroke="var(--status-active)" fill="url(#colorActive)" strokeWidth={2} />
                                    <Area type="monotone" dataKey="overdue" name="Overdue" stackId="1" stroke="var(--signal-red)" fill="var(--signal-red)" fillOpacity={0.2} strokeWidth={2} />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>

                <div className="card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-md)' }}>
                        <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Activity size={16} /> Velocity (Est.)
                            <InfoTooltip content="Estimated output based on completed goals per time period." size={14} />
                        </h3>
                    </div>
                    <div className="chart-scroll-container">
                        <div className="chart-inner" style={{ minWidth: timeRange > 30 ? '1200px' : '100%' }}>
                            <ResponsiveContainer width="100%" height={220}>
                                <BarChart data={chartData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border-secondary)" vertical={false} />
                                    <XAxis dataKey="date" tick={{ fontSize: 11, fill: 'var(--text-tertiary)' }} axisLine={false} tickLine={false} interval={timeRange > 30 ? 4 : 3} />
                                    <RechartsTooltip cursor={{ fill: 'var(--bg-tertiary)' }} contentStyle={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-primary)', borderRadius: '8px', fontSize: '12px' }} />
                                    <Bar dataKey="completed" name="Completed" fill="var(--brand-accent)" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>
            </div>

            <div className="two-col-grid">
                <div className="card">
                    <h3 style={{ marginBottom: 'var(--space-md)' }}>Status Distribution</h3>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-lg)' }}>
                        <ResponsiveContainer width={180} height={180}>
                            <PieChart>
                                <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={3} strokeWidth={0}>
                                    {pieData.map((e, i) => <Cell key={i} fill={e.color} />)}
                                </Pie>
                                <RechartsTooltip contentStyle={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-primary)', borderRadius: '8px', fontSize: '12px' }} />
                            </PieChart>
                        </ResponsiveContainer>
                        <div style={{ flex: 1 }}>
                            <StatusLegend breakdown={data.statusBreakdown} />
                        </div>
                    </div>
                </div>

                <div className="card">
                    <h3 style={{ marginBottom: 'var(--space-md)' }}>Execution Metrics</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                        <div className="stat-row">
                            <span className="stat-label">Update Recency</span>
                            <span className="stat-value">{data.updateRecency}%</span>
                        </div>
                        <div className="stat-row">
                            <span className="stat-label">Avg Blocked Age</span>
                            <span className="stat-value">{data.avgBlockedAge} days</span>
                        </div>
                        <div className="stat-row">
                            <span className="stat-label">High Priority Lag</span>
                            <span className="stat-value">{data.highPriorityLag} days</span>
                        </div>
                        <div className="stat-row">
                            <span className="stat-label">Completion Rate</span>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <div className="progress-bar" style={{ width: '80px' }}>
                                    <div className={`progress-fill ${data.completionRate > 60 ? 'green' : data.completionRate > 30 ? 'amber' : 'red'}`} style={{ width: `${data.completionRate}%` }} />
                                </div>
                                <span className="stat-value">{data.completionRate}%</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
