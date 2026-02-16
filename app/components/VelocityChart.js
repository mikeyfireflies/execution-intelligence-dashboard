'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';

export default function VelocityChart({ data }) {
    if (!data || data.length === 0) {
        return (
            <div style={{ height: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-tertiary)', fontSize: '0.875rem' }}>
                No historical data available for this period.
            </div>
        );
    }

    return (
        <div style={{ width: '100%', height: '250px' }}>
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data}>
                    <defs>
                        <linearGradient id="colorPoints" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="var(--brand-primary)" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="var(--brand-primary)" stopOpacity={0} />
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-secondary)" />
                    <XAxis
                        dataKey="week"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 10, fill: 'var(--text-tertiary)' }}
                        dy={10}
                    />
                    <YAxis
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 10, fill: 'var(--text-tertiary)' }}
                        label={{ value: 'Points', angle: -90, position: 'insideLeft', style: { fontSize: 10, fill: 'var(--text-tertiary)' } }}
                    />
                    <Tooltip
                        contentStyle={{
                            background: 'var(--bg-secondary)',
                            borderColor: 'var(--border-secondary)',
                            borderRadius: '8px',
                            fontSize: '0.75rem',
                            color: 'var(--text-primary)'
                        }}
                    />
                    <Area
                        type="monotone"
                        dataKey="points"
                        stroke="var(--brand-primary)"
                        fillOpacity={1}
                        fill="url(#colorPoints)"
                        strokeWidth={2}
                    />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    );
}
