'use client';

import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts';

export default function AccountabilityRadar({ data }) {
    if (!data || data.length === 0) return null;

    return (
        <div style={{ width: '100%', height: '200px', position: 'relative' }}>
            <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="70%" data={data}>
                    <PolarGrid stroke="var(--border-secondary)" />
                    <PolarAngleAxis
                        dataKey="subject"
                        tick={{ fill: 'var(--text-tertiary)', fontSize: 10, fontWeight: 500 }}
                    />
                    <Radar
                        name="Performance"
                        dataKey="A"
                        stroke="var(--brand-primary)"
                        fill="var(--brand-primary)"
                        fillOpacity={0.4}
                    />
                </RadarChart>
            </ResponsiveContainer>

            {/* Subtle Legend/Instruction */}
            <div style={{
                position: 'absolute',
                bottom: '-10px',
                left: 0,
                right: 0,
                textAlign: 'center',
                fontSize: '9px',
                color: 'var(--text-tertiary)',
                opacity: 0.6,
                letterSpacing: '0.05em',
                textTransform: 'uppercase'
            }}>
                Performance DNA
            </div>
        </div>
    );
}
