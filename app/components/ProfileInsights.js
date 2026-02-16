'use client';

import { useState } from 'react';
import { Eye, EyeOff, BarChart3, Users } from 'lucide-react';
import AccountabilityRadar from './AccountabilityRadar';

export default function ProfileInsights({ radarData, profile }) {
    const [showRadar, setShowRadar] = useState(true);

    return (
        <div className="card" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h2 style={{ margin: 0, fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <BarChart3 size={20} style={{ color: 'var(--brand-primary)' }} /> Insights
                </h2>
                <button
                    onClick={() => setShowRadar(!showRadar)}
                    style={{
                        background: 'none', border: 'none', color: 'var(--text-tertiary)',
                        cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px',
                        fontSize: '0.75rem', fontWeight: 500, padding: '4px 8px', borderRadius: '6px',
                        background: 'rgba(var(--brand-primary-rgb), 0.05)'
                    }}
                >
                    {showRadar ? <><EyeOff size={14} /> Hide Radar</> : <><Eye size={14} /> Show Performance DNA</>}
                </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                {showRadar && (
                    <div className="animate-in" style={{
                        background: 'var(--bg-tertiary)',
                        borderRadius: '16px',
                        padding: '20px 10px',
                        border: '1px solid var(--border-secondary)'
                    }}>
                        <AccountabilityRadar data={radarData} />
                    </div>
                )}

                <div>
                    <div style={{
                        fontWeight: 600, fontSize: '0.8rem', color: 'var(--text-tertiary)',
                        marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px',
                        textTransform: 'uppercase', letterSpacing: '0.05em'
                    }}>
                        <Users size={14} /> Key Stakeholders
                    </div>
                    <div style={{
                        fontSize: '0.925rem', color: 'var(--text-secondary)', lineHeight: '1.5',
                        padding: '12px', background: 'var(--bg-secondary)', borderRadius: '12px',
                        border: '1px solid var(--border-secondary)'
                    }}>
                        {profile.keyStakeholders || "No shared stakeholders identified."}
                    </div>
                </div>
            </div>
        </div>
    );
}
