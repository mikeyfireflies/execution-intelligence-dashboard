'use client';

import {
    CheckCircle2, AlertTriangle, Flame, TrendingUp, TrendingDown, Minus
} from 'lucide-react';
import {
    PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, Tooltip as RechartsTooltip
} from 'recharts';
import InfoTooltip from './InfoTooltip';

// ─── Status Color Map ───────────────────────────────
export const STATUS_COLORS = {
    'In Progress': '#3B82F6',
    'Active': '#3B82F6',
    'In Review': '#8B5CF6',
    'Completed': '#10B981',
    'Done': '#10B981',
    'Complete': '#10B981',
    'Shipped': '#10B981',
    'Blocked': '#EF4444',
    'On Hold': '#F59E0B',
    'Not Started': '#6B7280',
    'Backlog': '#6B7280',
    'To Do': '#6B7280',
    'Unknown': '#9CA3AF',
};

export function getStatusColor(status) {
    return STATUS_COLORS[status] || '#9CA3AF';
}

// ─── Trend Arrow Component ──────────────────────────
export function TrendArrow({ trend, size = 14 }) {
    if (trend === 'up') return <TrendingUp size={size} style={{ color: 'var(--signal-green)' }} />;
    if (trend === 'down') return <TrendingDown size={size} style={{ color: 'var(--signal-red)' }} />;
    return <Minus size={size} style={{ color: 'var(--text-tertiary)' }} />;
}

// ─── Risk Badge Component ───────────────────────────
export function RiskBadge({ level, compact = false }) {
    const config = {
        green: { label: 'Healthy', className: 'badge-green', icon: <CheckCircle2 size={12} /> },
        amber: { label: 'At Risk', className: 'badge-amber', icon: <AlertTriangle size={12} /> },
        red: { label: 'Critical', className: 'badge-red', icon: <Flame size={12} /> },
    };
    const c = config[level] || config.green;
    return (
        <span className={`badge ${c.className}`}>
            {c.icon}
            {!compact && c.label}
        </span>
    );
}

// ─── Metric Card Component ──────────────────────────
export function MetricCard({ label, value, icon: Icon, color, trend, delta, onClick, tooltip }) {
    const isClickable = !!onClick;

    return (
        <div
            className={`card metric-card animate-in ${isClickable ? 'clickable-card' : ''}`}
            onClick={onClick}
            style={{ cursor: isClickable ? 'pointer' : 'default', position: 'relative' }}
        >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                <span className="metric-label" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    {label}
                    {tooltip && (
                        <InfoTooltip content={tooltip} size={12} />
                    )}
                </span>
                {Icon && <Icon size={16} style={{ color: color || 'var(--text-tertiary)' }} />}
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                <span className="metric-value" style={{ color }}>{value}</span>
                {delta !== undefined && delta !== null && (
                    <span className={`metric-delta ${trend || 'neutral'}`}>
                        <TrendArrow trend={trend} size={12} />
                        {typeof delta === 'number' ? (delta > 0 ? `+${delta}` : delta) : delta}
                    </span>
                )}
            </div>
        </div>
    );
}

// ─── Status Breakdown Bar ───────────────────────────
export function StatusBar({ breakdown, total }) {
    if (!breakdown || total === 0) return null;
    return (
        <div className="status-bar">
            {Object.entries(breakdown).map(([status, count]) => (
                <div
                    key={status}
                    className="status-bar-segment"
                    style={{
                        width: `${(count / total) * 100}%`,
                        background: getStatusColor(status),
                    }}
                    title={`${status}: ${count}`}
                />
            ))}
        </div>
    );
}

// ─── Status Legend ──────────────────────────────────
export function StatusLegend({ breakdown }) {
    if (!breakdown) return null;
    return (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '8px' }}>
            {Object.entries(breakdown).map(([status, count]) => (
                <div key={status} style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem' }}>
                    <span className="status-dot" style={{ background: getStatusColor(status) }} />
                    <span style={{ color: 'var(--text-secondary)' }}>{status}</span>
                    <span style={{ fontWeight: 600 }}>{count}</span>
                </div>
            ))}
        </div>
    );
}

// ─── Mini Donut Chart ───────────────────────────────
export function MiniDonut({ breakdown, size = 80 }) {
    if (!breakdown) return null;
    const data = Object.entries(breakdown).map(([name, value]) => ({
        name,
        value,
        color: getStatusColor(name),
    }));

    return (
        <ResponsiveContainer width={size} height={size}>
            <PieChart>
                <Pie
                    data={data}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={size * 0.3}
                    outerRadius={size * 0.45}
                    paddingAngle={3}
                    strokeWidth={0}
                >
                    {data.map((entry, i) => (
                        <Cell key={i} fill={entry.color} />
                    ))}
                </Pie>
                <RechartsTooltip
                    contentStyle={{
                        background: 'var(--bg-elevated)',
                        border: '1px solid var(--border-primary)',
                        borderRadius: '8px',
                        fontSize: '12px',
                    }}
                />
            </PieChart>
        </ResponsiveContainer>
    );
}

// ─── Sparkline Component ─────────────────────────────
export function SparkLine({ data, color }) {
    if (!data || data.length === 0) return <div style={{ height: '24px', width: '100%', background: 'var(--bg-tertiary)', opacity: 0.3, borderRadius: '2px' }} />;

    return (
        <div style={{ width: '60px', height: '24px' }}>
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data}>
                    <RechartsTooltip
                        cursor={{ fill: 'var(--bg-tertiary)' }}
                        contentStyle={{
                            background: 'var(--bg-elevated)',
                            border: '1px solid var(--border-primary)',
                            borderRadius: '4px',
                            fontSize: '10px',
                            padding: '4px 8px'
                        }}
                        itemStyle={{ padding: 0 }}
                        formatter={(value) => [`${value} goals`, '']}
                        labelStyle={{ display: 'none' }}
                    />
                    <Bar dataKey="value" fill={color} radius={[2, 2, 0, 0]} />
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
}
