import { getDashboardData } from '@/lib/notion';
import { slugify } from '@/lib/utils';
import { computeIndividualVelocity, computeAccountabilityRadar } from '@/lib/computations';
import Link from 'next/link';
import VelocityChart from '@/app/components/VelocityChart';
import ProfileInsights from '@/app/components/ProfileInsights';
import { ArrowLeft, Mail, MapPin, Briefcase, Calendar, Target, CheckCircle2, Clock, Shield, AlertTriangle, TrendingUp, Activity, BarChart3, Flame } from 'lucide-react';

export default async function ProfilePage({ params }) {
    const { slug } = await params;
    const data = await getDashboardData();

    // Find the owner by slug
    const ownerName = Object.keys(data.individual).find(name => slugify(name) === slug);
    const profile = data.individual[ownerName];
    const velocityData = ownerName ? computeIndividualVelocity(data.goals, ownerName) : [];
    const radarData = profile ? computeAccountabilityRadar(profile, velocityData) : [];

    if (!profile) {
        return (
            <div className="app-layout" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
                <div className="card text-center" style={{ padding: '40px' }}>
                    <AlertTriangle size={48} style={{ color: 'var(--signal-amber)', marginBottom: '16px' }} />
                    <h2>Profile Not Found</h2>
                    <p className="text-muted">Could not find a team member matching "{slug}"</p>
                    <Link href="/" className="btn btn-primary" style={{ marginTop: '20px' }}>
                        Back to Dashboard
                    </Link>
                </div>
            </div>
        );
    }

    // Group goals by status
    const goalsByStatus = profile.goals.reduce((acc, goal) => {
        const status = goal.status || 'Unknown';
        if (!acc[status]) acc[status] = [];
        acc[status].push(goal);
        return acc;
    }, {});

    return (
        <div className="app-layout" style={{ background: 'var(--bg-primary)', minHeight: '100vh', padding: 'var(--space-xl)' }}>
            <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
                <Link href="/" className="btn btn-ghost btn-sm" style={{ marginBottom: '24px', gap: '8px', paddingLeft: 0 }}>
                    <ArrowLeft size={16} /> Back to Dashboard
                </Link>

                {/* Profile Header */}
                <div className="card" style={{ padding: '32px', marginBottom: '32px', position: 'relative', overflow: 'hidden' }}>
                    <div style={{ display: 'flex', gap: '32px', alignItems: 'flex-start' }}>
                        <div style={{ position: 'relative' }}>
                            <div
                                style={{
                                    width: '120px', height: '120px', borderRadius: '24px',
                                    background: 'var(--bg-tertiary)', overflow: 'hidden',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontSize: '3rem', fontWeight: 700, color: 'var(--brand-primary)',
                                    boxShadow: 'var(--shadow-lg)', border: '4px solid var(--bg-secondary)'
                                }}
                            >
                                {profile.profileImage ? (
                                    <img src={profile.profileImage} alt={profile.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                ) : (
                                    profile.name.charAt(0)
                                )}
                            </div>
                            <div
                                style={{
                                    position: 'absolute', bottom: '-4px', right: '-4px',
                                    width: '32px', height: '32px', borderRadius: '50%',
                                    background: profile.riskLevel === 'green' ? 'var(--signal-green)' : profile.riskLevel === 'amber' ? 'var(--signal-amber)' : 'var(--signal-red)',
                                    border: '4px solid var(--bg-secondary)',
                                    boxShadow: 'var(--shadow-sm)'
                                }}
                            />
                        </div>

                        <div style={{ flex: 1 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <div>
                                    <h1 style={{ margin: 0, fontSize: '2.5rem', fontWeight: 800, letterSpacing: '-0.02em' }}>{profile.name}</h1>
                                    <div style={{ display: 'flex', gap: '12px', marginTop: '8px', alignItems: 'center', color: 'var(--text-secondary)' }}>
                                        <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '1rem' }}>
                                            <Briefcase size={16} /> {profile.role || 'Team Member'}
                                        </span>
                                        <span style={{ opacity: 0.3 }}>|</span>
                                        <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '1rem' }}>
                                            <MapPin size={16} /> {profile.department || 'General'}
                                        </span>
                                    </div>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginBottom: '4px' }}>Accountability Score</div>
                                    <div style={{ fontSize: '2rem', fontWeight: 700, color: profile.riskLevel === 'green' ? 'var(--signal-green)' : 'inherit' }}>
                                        {100 - (profile.overdue * 10 + profile.blocked * 5)}%
                                    </div>
                                </div>
                            </div>

                            <div style={{ marginTop: '24px', lineHeight: '1.6', fontSize: '1.1rem', color: 'var(--text-secondary)', maxWidth: '800px' }}>
                                {profile.bio || "No bio available in Team Directory."}
                            </div>

                            {profile.currentFocus && (
                                <div
                                    style={{
                                        marginTop: '24px', padding: '16px', borderRadius: '12px',
                                        background: 'rgba(var(--brand-primary-rgb), 0.1)',
                                        border: '1px solid var(--brand-primary)',
                                        display: 'flex', gap: '12px', alignItems: 'center'
                                    }}
                                >
                                    <Target size={20} style={{ color: 'var(--brand-primary)' }} />
                                    <div>
                                        <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--brand-primary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Current Focus</div>
                                        <div style={{ fontSize: '0.95rem', fontWeight: 500 }}>{profile.currentFocus}</div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Stats Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', marginBottom: '32px' }}>
                    <div className="card" style={{ padding: '20px' }}>
                        <div style={{ color: 'var(--text-tertiary)', fontSize: '0.75rem', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <Activity size={14} /> Active Goals
                        </div>
                        <div style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--status-active)' }}>{profile.active}</div>
                    </div>
                    <div className="card" style={{ padding: '20px' }}>
                        <div style={{ color: 'var(--text-tertiary)', fontSize: '0.75rem', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <CheckCircle2 size={14} /> Completed
                        </div>
                        <div style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--signal-green)' }}>{profile.completed}</div>
                    </div>
                    <div className="card" style={{ padding: '20px' }}>
                        <div style={{ color: 'var(--text-tertiary)', fontSize: '0.75rem', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <Clock size={14} /> Overdue
                        </div>
                        <div style={{ fontSize: '1.75rem', fontWeight: 700, color: profile.overdue > 0 ? 'var(--signal-red)' : 'inherit' }}>{profile.overdue}</div>
                    </div>
                    <div className="card" style={{ padding: '20px' }}>
                        <div style={{ color: 'var(--text-tertiary)', fontSize: '0.75rem', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <Shield size={14} /> Blocked
                        </div>
                        <div style={{ fontSize: '1.75rem', fontWeight: 700, color: profile.blocked > 0 ? 'var(--signal-amber)' : 'inherit' }}>{profile.blocked}</div>
                    </div>
                </div>

                {/* Performance Trend */}
                <div className="card" style={{ padding: '32px', marginBottom: '32px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                        <div>
                            <h2 style={{ margin: 0, fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <TrendingUp size={20} style={{ color: 'var(--brand-primary)' }} /> Performance Trend
                            </h2>
                            <p style={{ margin: '4px 0 0 0', fontSize: '0.875rem', color: 'var(--text-tertiary)' }}>Points completed per week (Last 8 weeks)</p>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>Current Velocity</div>
                            <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--brand-primary)' }}>
                                {velocityData.length > 0 ? (velocityData.reduce((s, w) => s + w.points, 0) / velocityData.length).toFixed(1) : 0} pts/wk
                            </div>
                        </div>
                    </div>
                    <VelocityChart data={velocityData} />
                </div>

                {/* Goals List */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '32px' }}>
                    <div>
                        <h2 style={{ marginBottom: '20px', fontSize: '1.25rem' }}>Active Objectives</h2>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {profile.goals.filter(g => g.status !== 'Done' && g.status !== 'Shipped').map((goal, i) => (
                                <div key={i} className="card" style={{ padding: '20px', borderLeft: `4px solid ${goal.status === 'Blocked' ? 'var(--signal-amber)' : 'var(--status-active)'}` }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                        <div>
                                            <h4 style={{ margin: 0, fontSize: '1.1rem' }}>{goal.goalTitle}</h4>
                                            <div style={{ display: 'flex', gap: '12px', marginTop: '8px', fontSize: '0.8rem', color: 'var(--text-tertiary)' }}>
                                                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Clock size={12} /> {goal.dueDate || 'No due date'}</span>
                                                {goal.squad && <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><MapPin size={12} /> {goal.squad}</span>}
                                            </div>
                                        </div>
                                        <span className={`badge badge-${goal.status === 'Blocked' ? 'amber' : 'blue'}`}>{goal.status}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div>
                        <ProfileInsights radarData={radarData} profile={profile} />
                    </div>
                </div>
            </div>
        </div>
    );
}
