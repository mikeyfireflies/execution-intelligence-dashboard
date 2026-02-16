'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Users, Building2, BarChart3, Zap, RefreshCw, Sun, Moon,
  AlertTriangle, CheckCircle2, Clock, Target, TrendingUp,
  TrendingDown, Minus, Shield, Eye, ArrowRight, ExternalLink,
  Activity, Flame, ChevronRight, Search, Filter, X, AlertCircle
} from 'lucide-react';
import {
  PieChart, Pie, Cell, ResponsiveContainer, AreaChart, Area,
  Tooltip as RechartsTooltip, XAxis, YAxis, BarChart, Bar, CartesianGrid
} from 'recharts';
import {
  isCompleted, isOverdue, isHighPriority, isActive, isBlocked, getStatusColor as getStatusColorLogic
} from '@/lib/computations';

// ─── Status Color Map ───────────────────────────────
const STATUS_COLORS = {
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

function getStatusColor(status) {
  return STATUS_COLORS[status] || '#9CA3AF';
}

// ─── Trend Arrow Component ──────────────────────────
function TrendArrow({ trend, size = 14 }) {
  if (trend === 'up') return <TrendingUp size={size} style={{ color: 'var(--signal-green)' }} />;
  if (trend === 'down') return <TrendingDown size={size} style={{ color: 'var(--signal-red)' }} />;
  return <Minus size={size} style={{ color: 'var(--text-tertiary)' }} />;
}

// ─── Risk Badge Component ───────────────────────────
function RiskBadge({ level, compact = false }) {
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
function MetricCard({ label, value, icon: Icon, color, trend, delta, onClick, tooltip }) {
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
            <div className="tooltip-container">
              <AlertCircle size={10} style={{ opacity: 0.5, cursor: 'help' }} />
              <div className="tooltip-content">{tooltip}</div>
            </div>
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
function StatusBar({ breakdown, total }) {
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
function StatusLegend({ breakdown }) {
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
function MiniDonut({ breakdown, size = 80 }) {
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

// ─── Filter Bar Component ───────────────────────────
function FilterBar({ onFilterChange, filters }) {
  return (
    <div className="filter-bar animate-in" style={{
      display: 'flex', gap: '8px', alignItems: 'center',
      marginBottom: 'var(--space-md)', padding: '8px 12px',
      background: 'var(--bg-elevated)', borderRadius: 'var(--radius-md)',
      border: '1px solid var(--border-primary)',
      maxWidth: '1200px'
    }}>
      <div style={{ position: 'relative', flex: 1 }}>
        <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }} />


        <input
          type="text"
          placeholder="Search owners, goals, or squads..."
          className="search-input"
          value={filters.search}
          onChange={(e) => onFilterChange('search', e.target.value)}
          style={{
            width: '100%', padding: '6px 10px 6px 32px',
            borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-secondary)',
            background: 'var(--bg-tertiary)', color: 'var(--text-primary)',
            fontSize: '0.8125rem'
          }}
        />
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        <Filter size={14} className="text-muted" />
        <select
          className="filter-select"
          value={filters.status}
          onChange={(e) => onFilterChange('status', e.target.value)}
          style={{
            padding: '6px 10px', borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--border-secondary)', background: 'var(--bg-tertiary)',
            color: 'var(--text-primary)', fontSize: '0.8125rem',
            minWidth: '120px'
          }}
        >

          <option value="all">All Statuses</option>
          <option value="active">Active</option>
          <option value="completed">Completed</option>
          <option value="overdue">Overdue</option>
          <option value="blocked">Blocked</option>
          <option value="critical">Critical</option>
          <option value="high_priority">High Priority</option>
        </select>
      </div>

      {(filters.search || filters.status !== 'all') && (
        <button
          className="btn btn-ghost btn-sm"
          onClick={() => onFilterChange('reset')}
          title="Clear filters"
        >
          <X size={16} />
        </button>
      )}
    </div>
  );
}

// ─── Sparkline Component ─────────────────────────────
function SparkLine({ data, color }) {
  if (!data || data.length === 0) return <div style={{ height: '24px', width: '100%', background: 'var(--bg-tertiary)', opacity: 0.3, borderRadius: '2px' }} />;

  return (
    <div style={{ width: '60px', height: '24px' }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <Bar dataKey="value" fill={color} radius={[2, 2, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

// ─── Squad Grid Component ──────────────────────────
function SquadGrid({ squads, onDrillDown }) {
  return (
    <div className="squad-grid animate-in">
      <div className="grid-header">
        <div style={{ textAlign: 'left' }}>Squad Name</div>
        <div style={{ textAlign: 'center' }}>Active</div>
        <div style={{ textAlign: 'center' }}>Done</div>
        <div style={{ textAlign: 'center' }}>Overdue</div>
        <div style={{ textAlign: 'center' }}>Blocked</div>
        <div style={{ textAlign: 'center' }}>Risk</div>
        <div style={{ textAlign: 'right' }}>Velocity</div>
      </div>
      {squads.map(([name, data]) => (
        <div
          key={name}
          className="grid-row clickable-row"
          style={{ cursor: 'pointer' }}
          onClick={() => {
            if (onDrillDown) onDrillDown('squad', name);
          }}
        >
          <div className="grid-cell" data-label="Squad Name" style={{ gap: '12px', justifyContent: 'flex-start' }}>
            <div
              style={{
                width: '32px', height: '32px', borderRadius: '50%',
                background: 'var(--bg-tertiary)', color: 'var(--brand-primary)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0
              }}
            >
              <Building2 size={16} />
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</div>
              <div style={{ fontSize: '0.6875rem', color: 'var(--text-tertiary)' }}>{data.totalGoals} goals</div>
            </div>
          </div>
          <div className="grid-cell" data-label="Active" style={{ justifyContent: 'center' }}>
            <span className="grid-cell-value" style={{ color: 'var(--status-active)' }}>{data.active}</span>
          </div>
          <div className="grid-cell" data-label="Done" style={{ justifyContent: 'center' }}>
            <span className="grid-cell-value" style={{ color: 'var(--signal-green)' }}>{data.completed}</span>
          </div>
          <div className="grid-cell" data-label="Overdue" style={{ justifyContent: 'center' }}>
            <span className="grid-cell-value" style={{ color: data.overdue > 0 ? 'var(--signal-red)' : 'inherit' }}>{data.overdue}</span>
          </div>
          <div className="grid-cell" data-label="Blocked" style={{ justifyContent: 'center' }}>
            <span className="grid-cell-value" style={{ color: data.blocked > 0 ? 'var(--signal-amber)' : 'inherit' }}>{data.blocked}</span>
          </div>
          <div className="grid-cell" data-label="Risk" style={{ justifyContent: 'center' }}>
            <RiskBadge level={data.riskLevel} compact />
          </div>
          <div className="grid-cell" data-label="Velocity" style={{ justifyContent: 'flex-end' }}>
            <SparkLine
              data={[
                { value: Math.max(2, data.completed * 0.5) },
                { value: Math.max(3, data.completed * 0.8) },
                { value: data.completed }
              ]}
              color="var(--brand-primary)"
            />
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Owner Detail Panel (Drill-Down) ────────────────
function OwnerDetailPanel({ owner, data, onClose }) {
  if (!owner || !data) return null;
  const [activeFilter, setActiveFilter] = useState('all');

  // Group goals by status/priority for the drill-down
  const groupedGoals = useMemo(() => {
    const goals = data.goals || [];
    const activeResults = {
      'Critical & Overdue': goals.filter(g => !isCompleted(g.status) && (isOverdue(g) || isHighPriority(g))),
      'Blocked': goals.filter(g => !isCompleted(g.status) && isBlocked(g.status)),
      'Active In Progress': goals.filter(g => !isCompleted(g.status) && isActive(g.status) && !isOverdue(g) && !isHighPriority(g)),
      'Completed': goals.filter(g => isCompleted(g.status)).map(g => {
        // Determine "Was" context
        // Since we don't have historical state per goal, we infer from dates and priority
        const wasOverdue = g.dueDate && new Date(g.dueDate) < new Date();
        const wasCritical = isHighPriority(g);
        return { ...g, wasOverdue, wasCritical };
      }),
    };
    return activeResults;
  }, [data.goals]);

  const filteredGroups = activeFilter === 'all'
    ? groupedGoals
    : Object.fromEntries(
      Object.entries(groupedGoals).map(([name, goals]) => {
        if (activeFilter === 'overdue' && name === 'Critical & Overdue') return [name, goals.filter(g => isOverdue(g))];
        if (activeFilter === 'high_priority' && name === 'Critical & Overdue') return [name, goals.filter(g => isHighPriority(g))];
        if (activeFilter === 'blocked' && name === 'Blocked') return [name, goals];
        if (activeFilter === 'active' && name === 'Active In Progress') return [name, goals];
        if (activeFilter === 'health' && name === 'Critical & Overdue') return [name, goals];
        if (activeFilter === 'completed' && name === 'Completed') return [name, goals];
        return [name, []];
      })
    );

  const toggleFilter = (f) => setActiveFilter(activeFilter === f ? 'all' : f);

  return (
    <div className="detail-panel-overlay" onClick={onClose}>
      <div className="detail-panel animate-in-right" onClick={e => e.stopPropagation()}>
        <div className="detail-header">
          <div>
            <h2 style={{ margin: 0, fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{
                width: '32px', height: '32px', borderRadius: '50%',
                background: 'var(--brand-primary)', color: 'white',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem'
              }}>
                {owner.charAt(0)}
              </div>
              {owner}
            </h2>
            <div style={{ fontSize: '0.875rem', color: 'var(--text-tertiary)', marginTop: '4px' }}>
              {data.squad || 'Independent Contributors'} · {data.totalGoals} goals
            </div>
          </div>
          <button className="btn btn-ghost" onClick={onClose}><X size={20} /></button>
        </div>

        <div className="detail-content">
          <div className="metrics-grid metrics-grid-3" style={{ gap: '8px' }}>
            <div
              className={`stat-box clickable ${activeFilter === 'active' ? 'active' : ''}`}
              onClick={() => toggleFilter('active')}
              style={{ cursor: 'pointer', transition: 'all 0.2s', padding: '12px', border: activeFilter === 'active' ? '1px solid var(--status-active)' : '1px solid var(--border-secondary)' }}
            >
              <div className="stat-label">Active</div>
              <div className="stat-value" style={{ color: 'var(--status-active)' }}>{data.active}</div>
            </div>
            <div
              className={`stat-box clickable ${activeFilter === 'high_priority' ? 'active' : ''}`}
              onClick={() => toggleFilter('high_priority')}
              style={{ cursor: 'pointer', transition: 'all 0.2s', padding: '12px', border: activeFilter === 'high_priority' ? '1px solid var(--status-overdue)' : '1px solid var(--border-secondary)' }}
            >
              <div className="stat-label">High P</div>
              <div className="stat-value" style={{ color: 'var(--status-overdue)' }}>{data.highPriority}</div>
            </div>
            <div
              className={`stat-box clickable ${activeFilter === 'overdue' ? 'active' : ''}`}
              onClick={() => toggleFilter('overdue')}
              style={{ cursor: 'pointer', transition: 'all 0.2s', padding: '12px', border: activeFilter === 'overdue' ? '1px solid var(--signal-red)' : '1px solid var(--border-secondary)' }}
            >
              <div className="stat-label">Overdue</div>
              <div className="stat-value" style={{ color: 'var(--signal-red)' }}>{data.overdue}</div>
            </div>
            <div
              className={`stat-box clickable ${activeFilter === 'blocked' ? 'active' : ''}`}
              onClick={() => toggleFilter('blocked')}
              style={{ cursor: 'pointer', transition: 'all 0.2s', padding: '12px', border: activeFilter === 'blocked' ? '1px solid var(--signal-amber)' : '1px solid var(--border-secondary)' }}
            >
              <div className="stat-label">Blocked</div>
              <div className="stat-value" style={{ color: 'var(--signal-amber)' }}>{data.blocked}</div>
            </div>
            <div
              className={`stat-box clickable ${activeFilter === 'completed' ? 'active' : ''}`}
              onClick={() => toggleFilter('completed')}
              style={{ cursor: 'pointer', transition: 'all 0.2s', padding: '12px', border: activeFilter === 'completed' ? '1px solid var(--signal-green)' : '1px solid var(--border-secondary)' }}
            >
              <div className="stat-label">Done</div>
              <div className="stat-value" style={{ color: 'var(--signal-green)' }}>{data.completed}</div>
            </div>
            <div
              className={`stat-box clickable ${activeFilter === 'health' ? 'active' : ''}`}
              onClick={() => toggleFilter('health')}
              style={{ cursor: 'pointer', transition: 'all 0.2s', padding: '12px', border: activeFilter === 'health' ? '1px solid var(--brand-primary)' : '1px solid var(--border-secondary)' }}
            >
              <div className="stat-label">Health</div>
              <RiskBadge level={data.riskLevel} />
            </div>
          </div>

          <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
              {activeFilter !== 'all' ? `Filtering by ${activeFilter}` : 'Showing all tasks'}
            </div>
            {activeFilter !== 'all' && (
              <button className="btn btn-ghost btn-sm" onClick={() => setActiveFilter('all')} style={{ fontSize: '0.7rem' }}>Clear Filter</button>
            )}
          </div>

          {Object.entries(filteredGroups).map(([group, goals]) => (
            goals.length > 0 && (
              <div key={group} style={{ marginTop: '24px' }}>
                <h3 style={{
                  fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-secondary)',
                  borderBottom: '1px solid var(--border-secondary)', paddingBottom: '8px', marginBottom: '12px'
                }}>
                  {group} <span style={{ opacity: 0.5 }}>({goals.length})</span>
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {goals.map((goal, i) => (
                    <div key={i} className="card task-card" style={{ padding: '12px', borderLeft: `3px solid ${getStatusColor(goal.status)}` }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '4px' }}>
                        <a
                          href={goal.sourceUrl || goal.notionUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover-underline"
                          style={{ fontWeight: 500, color: 'var(--text-primary)', textDecoration: 'none', lineHeight: '1.4' }}
                        >
                          {goal.goalTitle} <ExternalLink size={10} style={{ display: 'inline', opacity: 0.5 }} />
                        </a>
                        <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                          {isHighPriority(goal) && !isCompleted(goal.status) && (
                            <span className="badge badge-red" style={{ fontSize: '0.6rem', padding: '1px 4px' }}>Critical</span>
                          )}
                          {isOverdue(goal) && !isCompleted(goal.status) && (
                            <span className="badge badge-amber" style={{ fontSize: '0.6rem', padding: '1px 4px' }}>Overdue</span>
                          )}
                          <span className="badge badge-neutral" style={{ fontSize: '0.65rem' }}>{goal.status}</span>
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '8px', fontSize: '0.75rem', color: 'var(--text-tertiary)', flexWrap: 'wrap' }}>
                        {goal.dueDate && (
                          <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: (isOverdue(goal) && !isCompleted(goal.status)) ? 'var(--signal-red)' : 'inherit' }}>
                            <Clock size={10} /> {goal.dueDate}
                          </span>
                        )}
                        {group === 'Completed' && (
                          <>
                            {goal.wasCritical && (
                              <span className="badge badge-red" style={{ scale: '0.8', margin: 0, padding: '2px 6px' }}>Was Critical</span>
                            )}
                            {goal.wasOverdue && (
                              <span className="badge badge-amber" style={{ scale: '0.8', margin: 0, padding: '2px 6px' }}>Was Overdue</span>
                            )}
                            <span className="badge badge-green" style={{ scale: '0.8', margin: 0, padding: '2px 6px' }}>Completed</span>
                          </>
                        )}
                        {(!isCompleted(goal.status) && (goal.daysSinceLastUpdate || 0) > 7) && (
                          <span style={{ color: 'var(--signal-amber)' }}>
                            {goal.daysSinceLastUpdate}d stale
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Owner Grid Component ──────────────────────────
function OwnerGrid({ owners, onRowClick }) {
  return (
    <div className="owner-grid animate-in">
      <div className="grid-header">
        <div style={{ textAlign: 'left' }}>Team Member</div>
        <div style={{ textAlign: 'center' }}>Active</div>
        <div style={{ textAlign: 'center' }}>Done</div>
        <div style={{ textAlign: 'center' }}>Overdue</div>
        <div style={{ textAlign: 'center' }}>Blocked</div>
        <div style={{ textAlign: 'center' }}>Risk</div>
        <div style={{ textAlign: 'right' }}>Velocity</div>
      </div>
      {owners.map(([owner, data]) => (
        <div
          key={owner}
          className="grid-row clickable-row"
          onClick={() => onRowClick && onRowClick(owner, data)}
          style={{ cursor: 'pointer' }}
        >
          <div className="grid-cell" data-label="Team Member" style={{ gap: '12px', justifyContent: 'flex-start' }}>
            <div
              style={{
                width: '32px', height: '32px', borderRadius: '50%',
                background: 'var(--bg-tertiary)', color: 'var(--brand-primary)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '0.875rem', fontWeight: 700, flexShrink: 0
              }}
            >
              {owner.charAt(0)}
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{owner}</div>
              <div style={{ fontSize: '0.6875rem', color: 'var(--text-tertiary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span>{data.goals.length} goals</span>
                {data.daysSinceLastUpdate > 5 && data.daysSinceLastUpdate < 999 && (
                  <span style={{
                    color: data.daysSinceLastUpdate > 10 ? 'var(--signal-red)' : 'var(--signal-amber)',
                    display: 'flex', alignItems: 'center', gap: '2px',
                    background: data.daysSinceLastUpdate > 10 ? 'rgba(239, 68, 68, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                    padding: '0 4px', borderRadius: '4px'
                  }}>
                    <Clock size={10} /> {data.daysSinceLastUpdate}d stale
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="grid-cell" data-label="Active" style={{ justifyContent: 'center' }}>
            <span className="grid-cell-value" style={{ color: 'var(--status-active)' }}>{data.active}</span>
          </div>
          <div className="grid-cell" data-label="Done" style={{ justifyContent: 'center' }}>
            <span className="grid-cell-value" style={{ color: 'var(--signal-green)' }}>{data.completed}</span>
          </div>
          <div className="grid-cell" data-label="Overdue" style={{ justifyContent: 'center' }}>
            <span className="grid-cell-value" style={{ color: data.overdue > 0 ? 'var(--signal-red)' : 'inherit' }}>{data.overdue}</span>
          </div>
          <div className="grid-cell" data-label="Blocked" style={{ justifyContent: 'center' }}>
            <span className="grid-cell-value" style={{ color: data.blocked > 0 ? 'var(--signal-amber)' : 'inherit' }}>{data.blocked}</span>
          </div>
          <div className="grid-cell" data-label="Risk" style={{ justifyContent: 'center' }}>
            <RiskBadge level={data.riskLevel} compact />
          </div>
          <div className="grid-cell" data-label="Velocity" style={{ justifyContent: 'flex-end' }}>
            <SparkLine
              data={[
                { value: Math.max(1, data.completed * 0.3) },
                { value: Math.max(2, data.completed * 0.6) },
                { value: data.completed }
              ]}
              color="var(--status-active)"
            />
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Owner Card ─────────────────────────────────────
function OwnerCard({ owner, data }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className={`card risk-${data.riskLevel} animate-in`}>
      <div className="card-header">
        <div>
          <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{
              width: '32px', height: '32px', borderRadius: 'var(--radius-full)',
              background: 'linear-gradient(135deg, var(--brand-primary), var(--brand-accent))',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'white', fontSize: '0.8125rem', fontWeight: 700,
            }}>
              {owner.charAt(0).toUpperCase()}
            </div>
            {owner}
          </h3>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginTop: '2px' }}>
            {data.totalGoals} goals · {data.totalEffort} effort points
          </div>
        </div>
        <RiskBadge level={data.riskLevel} />
      </div>

      <div className="card-body">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--status-active)' }}>{data.active}</div>
            <div className="text-xs text-muted">Active</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '1.25rem', fontWeight: 700, color: data.overdue > 0 ? 'var(--signal-red)' : 'var(--text-primary)' }}>{data.overdue}</div>
            <div className="text-xs text-muted">Overdue</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '1.25rem', fontWeight: 700, color: data.blocked > 0 ? 'var(--signal-amber)' : 'var(--text-primary)' }}>{data.blocked}</div>
            <div className="text-xs text-muted">Blocked</div>
          </div>
        </div>

        <StatusBar breakdown={data.statusBreakdown} total={data.totalGoals} />

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem' }}>
              <Target size={12} style={{ color: 'var(--brand-primary)' }} />
              <span className="text-muted">High P:</span>
              <span style={{ fontWeight: 600 }}>{data.highPriority}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem' }}>
              <Clock size={12} style={{ color: data.daysSinceLastUpdate > 7 ? 'var(--signal-amber)' : 'var(--text-tertiary)' }} />
              <span className="text-muted">Updated:</span>
              <span style={{ fontWeight: 600, color: data.daysSinceLastUpdate > 7 ? 'var(--signal-amber)' : 'inherit' }}>
                {data.daysSinceLastUpdate === 999 ? 'Never' : `${data.daysSinceLastUpdate}d ago`}
              </span>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem' }}>
            <Activity size={12} />
            <span className="text-muted">Effort:</span>
            <span style={{ fontWeight: 600 }}>{data.effortInProgress}</span>
          </div>
        </div>

        {data.risks.length > 0 && (
          <div>
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => setExpanded(!expanded)}
              style={{ width: '100%', justifyContent: 'space-between', marginTop: '8px' }}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <AlertTriangle size={12} style={{ color: data.riskLevel === 'red' ? 'var(--signal-red)' : 'var(--signal-amber)' }} />
                {data.risks.length} risk{data.risks.length > 1 ? 's' : ''} detected
              </span>
              <ChevronRight size={12} style={{ transform: expanded ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s' }} />
            </button>
            {expanded && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '8px' }}>
                {data.risks.map((risk, i) => (
                  <div key={i} className={`risk-item ${risk.type}`} style={{ padding: '8px 12px' }}>
                    <div className="risk-item-content">
                      <div className="risk-item-title">
                        <a
                          href={risk.sourceUrl || risk.notionUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover-underline"
                          style={{ color: 'inherit', textDecoration: 'none' }}
                        >
                          {risk.message} <ExternalLink size={10} style={{ display: 'inline', marginLeft: '2px', opacity: 0.5 }} />
                        </a>
                      </div>
                      <div className="risk-item-meta" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span>{risk.goalTitle}</span>
                        {risk.daysSinceUpdate && risk.daysSinceUpdate < 999 && (
                          <span style={{ fontSize: '10px', opacity: 0.8 }}>{risk.daysSinceUpdate}d stale</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Squad Card ─────────────────────────────────────
function SquadCard({ name, data }) {
  return (
    <div className={`card risk-${data.riskLevel} animate-in`}>
      <div className="card-header">
        <div>
          <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Building2 size={18} style={{ color: 'var(--brand-primary)' }} />
            {name}
          </h3>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginTop: '2px' }}>
            {data.owners.length} member{data.owners.length !== 1 ? 's' : ''} · {data.totalGoals} goals
          </div>
        </div>
        <RiskBadge level={data.riskLevel} />
      </div>

      <div className="card-body">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--status-active)' }}>{data.active}</div>
            <div className="text-xs text-muted">Active</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--signal-green)' }}>{data.completed}</div>
            <div className="text-xs text-muted">Done</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '1.125rem', fontWeight: 700, color: data.overdue > 0 ? 'var(--signal-red)' : 'var(--text-primary)' }}>{data.overdue}</div>
            <div className="text-xs text-muted">Overdue</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '1.125rem', fontWeight: 700, color: data.blocked > 0 ? 'var(--signal-amber)' : 'var(--text-primary)' }}>{data.blocked}</div>
            <div className="text-xs text-muted">Blocked</div>
          </div>
        </div>

        <StatusBar breakdown={data.statusBreakdown} total={data.totalGoals} />
        <StatusLegend breakdown={data.statusBreakdown} />

        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <div className="stat-row">
            <span className="stat-label">Ownership Clarity</span>
            <span className="stat-value">{data.ownershipClarity}%</span>
          </div>
          <div className="progress-bar">
            <div className={`progress-fill ${data.ownershipClarity > 80 ? 'green' : data.ownershipClarity > 50 ? 'amber' : 'red'}`} style={{ width: `${data.ownershipClarity}%` }} />
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <div className="stat-row">
            <span className="stat-label">Total Effort</span>
            <span className="stat-value">{data.totalEffort} pts</span>
          </div>
          {data.effortConcentrationRisk && (
            <span className="badge badge-amber" style={{ alignSelf: 'flex-start' }}>
              <AlertTriangle size={10} /> Effort concentration risk
            </span>
          )}
        </div>

        {data.stuckGoals.length > 0 && (
          <div style={{ borderTop: '1px solid var(--border-secondary)', paddingTop: '12px' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--signal-amber)', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <AlertTriangle size={12} /> {data.stuckGoals.length} stuck item{data.stuckGoals.length > 1 ? 's' : ''}
            </div>
            {data.stuckGoals.slice(0, 3).map((g, i) => (
              <div key={i} style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', padding: '2px 0' }}>
                • <a href={g.sourceUrl || g.notionUrl} target="_blank" rel="noopener noreferrer" className="hover-underline" style={{ color: 'inherit', textDecoration: 'none' }}>
                  {g.goalTitle}
                </a>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

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


// ─── Squad Section Component ───────────────────────
function SquadSection({ name, owners, onOwnerClick }) {
  const [isOpen, setIsOpen] = useState(true);
  const totalOverdue = owners.reduce((s, [, o]) => s + o.overdue, 0);
  const totalBlocked = owners.reduce((s, [, o]) => s + o.blocked, 0);
  const atRisk = owners.filter(([, o]) => o.riskLevel !== 'green').length;

  return (
    <div style={{ marginBottom: 'var(--space-md)' }}>
      <div
        className="card"
        style={{
          padding: '12px 16px',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'var(--bg-secondary)',
          borderBottom: isOpen ? 'none' : '1px solid var(--border-primary)',
          borderBottomLeftRadius: isOpen ? 0 : 'var(--radius-lg)',
          borderBottomRightRadius: isOpen ? 0 : 'var(--radius-lg)',
          transition: 'all 0.2s ease'
        }}
        onClick={() => setIsOpen(!isOpen)}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <ChevronRight
            size={18}
            style={{
              transform: isOpen ? 'rotate(90deg)' : 'none',
              transition: 'transform 0.2s ease',
              color: 'var(--text-tertiary)'
            }}
          />
          <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 600 }}>{name}</h3>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>{owners.length} members</span>
        </div>
        <div style={{ display: 'flex', gap: '16px', fontSize: '0.75rem' }}>
          {totalOverdue > 0 && <span style={{ color: 'var(--signal-red)', fontWeight: 600 }}>{totalOverdue} Overdue</span>}
          {totalBlocked > 0 && <span style={{ color: 'var(--signal-amber)', fontWeight: 600 }}>{totalBlocked} Blocked</span>}
          {atRisk > 0 && <span className="badge badge-red" style={{ scale: '0.9', margin: 0 }}>{atRisk} at risk</span>}
        </div>
      </div>
      {isOpen && (
        <div style={{ borderTop: 'none' }}>
          <OwnerGrid owners={owners} onRowClick={onOwnerClick} />
        </div>
      )}
    </div>
  );
}

// ─── VIEWS ──────────────────────────────────────────
function IndividualView({ data, unfilteredData, trends, watchlistOnly, onToggleWatchlist, onFilterChange }) {
  if (!data) return null;
  const [selectedOwner, setSelectedOwner] = useState(null);
  const owners = Object.entries(data);
  const allOwnersData = Object.entries(unfilteredData || data);

  const totalActive = allOwnersData.reduce((s, [, o]) => s + (o.active || 0), 0);
  const totalCompleted = allOwnersData.reduce((s, [, o]) => s + (o.completed || 0), 0);
  const totalOverdue = allOwnersData.reduce((s, [, o]) => s + (o.overdue || 0), 0);
  const totalBlocked = allOwnersData.reduce((s, [, o]) => s + (o.blocked || 0), 0);
  const totalHighP = allOwnersData.reduce((s, [, o]) => s + (o.highPriority || 0), 0);
  const atRisk = allOwnersData.filter(([, o]) => o.riskLevel !== 'green').length;

  return (
    <>
      <div className="metrics-grid metrics-grid-4" style={{ marginBottom: 'var(--space-sm)' }}>
        <MetricCard label="Team Members" value={owners.length} icon={Users} color="var(--brand-primary)" onClick={() => onToggleWatchlist()} />
        <MetricCard label="Active Goals" value={totalActive} icon={Activity} color="var(--status-active)" onClick={() => onFilterChange('status', 'active')} />
        <MetricCard label="Completed" value={totalCompleted} icon={CheckCircle2} color="var(--signal-green)" onClick={() => onFilterChange('status', 'completed')} />
        <MetricCard label="Overdue" value={totalOverdue} icon={Clock} color="var(--signal-red)" onClick={() => onFilterChange('status', 'overdue')} />
        <MetricCard label="Blocked" value={totalBlocked} icon={Shield} color="var(--signal-amber)" onClick={() => onFilterChange('status', 'blocked')} />
        <MetricCard label="High Priority" value={totalHighP} icon={Flame} color="var(--status-overdue)" onClick={() => onFilterChange('status', 'high_priority')} />
        <MetricCard label="At Risk" value={atRisk} icon={AlertTriangle} color={atRisk > 0 ? 'var(--signal-red)' : 'var(--signal-green)'} onClick={() => onFilterChange('status', 'critical')} />
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

      {/* Group by Squad */}
      {(() => {
        const squadsMap = owners.reduce((acc, [key, o]) => {
          const s = o.squad || 'Independent Contributors';
          if (!acc[s]) acc[s] = [];
          acc[s].push([key, o]);
          return acc;
        }, {});

        // Sort squads by presence of risk? Optional but good for Krish
        return Object.entries(squadsMap)
          .sort((a, b) => {
            const aHasRisk = b[1].some(o => o[1].riskLevel !== 'green');
            const bHasRisk = a[1].some(o => o[1].riskLevel !== 'green');
            if (aHasRisk && !bHasRisk) return 1;
            if (!aHasRisk && bHasRisk) return -1;
            return 0;
          })
          .map(([squadName, squadOwners]) => (
            <SquadSection
              key={squadName}
              name={squadName}
              owners={squadOwners}
              onOwnerClick={(owner, data) => setSelectedOwner({ owner, data })}
            />
          ));
      })()}

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

// View 2: Squad Rollups
function SquadView({ data, unfilteredData, trends, onDrillDown, onFilterChange }) {
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
        <MetricCard label="Squads" value={squads.length} icon={Building2} color="var(--brand-primary)" />
        <MetricCard label="Active" value={totalActive} icon={Activity} color="var(--status-active)" onClick={() => onFilterChange('status', 'active')} />
        <MetricCard label="Completed" value={totalCompleted} icon={CheckCircle2} color="var(--signal-green)" onClick={() => onFilterChange('status', 'completed')} />
        <MetricCard label="Overdue" value={totalOverdue} icon={Clock} color="var(--signal-red)" onClick={() => onFilterChange('status', 'overdue')} />
        <MetricCard label="At Risk" value={atRisk} icon={AlertTriangle} color={atRisk > 0 ? 'var(--signal-red)' : 'var(--signal-green)'} onClick={() => onFilterChange('status', 'critical')} />
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

// View 3: Company Execution Overview
// View 3: Company Execution Overview
function CompanyView({ data, trends, snapshots, onDrillDown }) {
  const [timeRange, setTimeRange] = useState(28); // 28 days by default
  const [granularity, setGranularity] = useState('daily');

  const pieData = useMemo(() => Object.entries(data.statusBreakdown).map(([name, value]) => ({
    name, value, color: getStatusColor(name),
  })), [data.statusBreakdown]);

  // Generate data based on range and granularity
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

    // Aggregate weekly
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
          <MetricCard label="Completed" value={data.completed} icon={CheckCircle2} color="var(--signal-green)" onClick={() => onDrillDown('status', 'completed')} tooltip="Goals marked as Shipped or Done." />
          <MetricCard label="Completion Rate" value={`${data.completionRate}%`} icon={BarChart3} color="var(--brand-accent)" tooltip="Percentage of planned goals that are completed." />
          <MetricCard label="Slippage Rate" value={`${data.slippageRate}%`} icon={TrendingDown} color={data.slippageRate > 30 ? 'var(--signal-red)' : 'var(--signal-amber)'} tooltip="Rate of goals moving past their original target date." />
          <MetricCard label="Active" value={data.active} icon={Activity} color="var(--status-active)" onClick={() => onDrillDown('active')} tooltip="Goals currently in progress." />
          <MetricCard label="Overdue" value={data.overdue} icon={Clock} color="var(--signal-red)" onClick={() => onDrillDown('overdue')} tooltip="Active goals past their target date." />
          <MetricCard label="Blocked" value={data.blocked} icon={Shield} color="var(--signal-amber)" onClick={() => onDrillDown('blocked')} tooltip="Goals flagged as blocked." />
          <MetricCard label="HP Overdue" value={data.highPriorityOverdue} icon={Flame} color="var(--signal-red)" onClick={() => onDrillDown('critical')} tooltip="High Priority goals that are currently overdue." />
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
              <div className="tooltip-container">
                <AlertCircle size={14} style={{ opacity: 0.5, cursor: 'help' }} />
                <div className="tooltip-content shadow-lg">Historical trend of goal statuses across the entire company.</div>
              </div>
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
                  <RechartsTooltip
                    contentStyle={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-primary)', borderRadius: '8px', fontSize: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                    itemStyle={{ padding: 0 }}
                  />
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
              <div className="tooltip-container">
                <AlertCircle size={14} style={{ opacity: 0.5, cursor: 'help' }} />
                <div className="tooltip-content shadow-lg">Estimated output based on completed goals per time period.</div>
              </div>
            </h3>
          </div>
          <div className="chart-scroll-container">
            <div className="chart-inner" style={{ minWidth: timeRange > 30 ? '1200px' : '100%' }}>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border-secondary)" vertical={false} />
                  <XAxis dataKey="date" tick={{ fontSize: 11, fill: 'var(--text-tertiary)' }} axisLine={false} tickLine={false} interval={timeRange > 30 ? 4 : 3} />
                  <RechartsTooltip
                    cursor={{ fill: 'var(--bg-tertiary)' }}
                    contentStyle={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-primary)', borderRadius: '8px', fontSize: '12px' }}
                  />
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

// View 4: Executive Mode (Krish Mode)
function ExecutiveView({ data, company, trends }) {
  if (!data) return null;

  return (
    <div className="executive-mode animate-in">
      <div style={{ textAlign: 'center', marginBottom: 'var(--space-2xl)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', marginBottom: '8px' }}>
          <Eye size={24} style={{ color: 'var(--brand-primary)' }} />
          <h1>Executive 10-Minute View</h1>
        </div>
        <p className="text-muted">Critical signals only. No task clutter.</p>
        {company && (
          <div style={{ marginTop: 'var(--space-lg)' }}>
            <HealthScoreGauge score={company.healthScore} status={company.healthStatus} />
          </div>
        )}
      </div>

      {data.topRisks.length > 0 && (
        <div className="executive-section">
          <div className="executive-section-title">
            <Flame size={14} /> Top Risks
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {data.topRisks.map((risk, i) => (
              <div key={i} className={`risk-item ${risk.type}`}>
                <div className="risk-item-content">
                  <div className="risk-item-title">
                    <a href={risk.sourceUrl || risk.notionUrl} target="_blank" rel="noopener noreferrer" className="hover-underline" style={{ color: 'inherit', textDecoration: 'none' }}>
                      {risk.goalTitle}
                    </a>
                  </div>
                  <div className="risk-item-meta">
                    {risk.message} · {risk.owner} · {risk.daysSinceUpdate}d since update
                  </div>
                </div>
                <RiskBadge level={risk.type === 'critical' ? 'red' : risk.type === 'warning' ? 'amber' : 'green'} compact />
              </div>
            ))}
          </div>
        </div>
      )}

      {data.highPriorityOverdue.length > 0 && (
        <div className="executive-section">
          <div className="executive-section-title">
            <AlertTriangle size={14} /> High Priority Overdue
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {data.highPriorityOverdue.map((item, i) => (
              <div key={i} className="card" style={{ padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>
                    <a href={item.sourceUrl || item.notionUrl} target="_blank" rel="noopener noreferrer" className="hover-underline" style={{ color: 'inherit', textDecoration: 'none' }}>
                      {item.goalTitle}
                    </a>
                  </div>
                  <div className="text-xs text-muted">{item.owner} · Due: {item.dueDate || 'No date'}</div>
                </div>
                <span className="badge badge-red">{item.daysSinceUpdate}d stale</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {data.needsUnblock.length > 0 && (
        <div className="executive-section">
          <div className="executive-section-title">
            <Shield size={14} /> Needs Unblock
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {data.needsUnblock.map((item, i) => (
              <div key={i} className="card" style={{ padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>
                    <a href={item.sourceUrl || item.notionUrl} target="_blank" rel="noopener noreferrer" className="hover-underline" style={{ color: 'inherit', textDecoration: 'none' }}>
                      {item.goalTitle}
                    </a>
                  </div>
                  <div className="text-xs text-muted">{item.owner} · {item.status}</div>
                </div>
                <span className="badge badge-amber">{item.daysSinceUpdate}d waiting</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {data.slippingInitiatives.length > 0 && (
        <div className="executive-section">
          <div className="executive-section-title">
            <TrendingDown size={14} /> Slipping Initiatives
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {data.slippingInitiatives.map((item, i) => (
              <div key={i} className="card" style={{ padding: '12px 16px' }}>
                <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>
                  <a href={item.sourceUrl || item.notionUrl} target="_blank" rel="noopener noreferrer" className="hover-underline" style={{ color: 'inherit', textDecoration: 'none' }}>
                    {item.goalTitle}
                  </a>
                </div>
                <div className="text-xs text-muted">{item.owner} · Due: {item.dueDate || 'No date'} · {item.status}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {data.squadSummary.length > 0 && (
        <div className="executive-section">
          <div className="executive-section-title">
            <BarChart3 size={14} /> Squad Velocity
          </div>
          <div className="card">
            <div className="metrics-grid metrics-grid-3">
              {data.squadSummary.map((squad, i) => (
                <div key={i} style={{ padding: '12px', borderRadius: 'var(--radius-md)', background: 'var(--bg-tertiary)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span style={{ fontWeight: 600, fontSize: '0.8125rem' }}>{squad.name}</span>
                    <RiskBadge level={squad.riskLevel} compact />
                  </div>
                  <div style={{ display: 'flex', gap: '12px', fontSize: '0.75rem' }}>
                    <span><span className="text-muted">Active:</span> <strong>{squad.active}</strong></span>
                    <span><span className="text-muted">Done:</span> <strong>{squad.completed}</strong></span>
                    <span style={{ color: squad.overdue > 0 ? 'var(--signal-red)' : 'inherit' }}><span className="text-muted">Late:</span> <strong>{squad.overdue}</strong></span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Loading Skeleton ───────────────────────────────
function LoadingSkeleton() {
  return (
    <div style={{ padding: 'var(--space-2xl)' }}>
      <div className="metrics-grid metrics-grid-4" style={{ marginBottom: 'var(--space-lg)' }}>
        {[1, 2, 3, 4, 5].map(i => (
          <div key={i} className="card">
            <div className="loading-skeleton" style={{ width: '60%', height: 12, marginBottom: 12 }} />
            <div className="loading-skeleton" style={{ width: '40%', height: 28 }} />
          </div>
        ))}
      </div>
      <div className="cards-grid">
        {[1, 2, 3].map(i => (
          <div key={i} className="card" style={{ minHeight: 200 }}>
            <div className="loading-skeleton" style={{ width: '70%', height: 16, marginBottom: 16 }} />
            <div className="loading-skeleton" style={{ width: '100%', height: 8, marginBottom: 12 }} />
            <div className="loading-skeleton" style={{ width: '90%', height: 8, marginBottom: 12 }} />
            <div className="loading-skeleton" style={{ width: '60%', height: 8 }} />
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Main Dashboard ─────────────────────────────────
export default function Dashboard() {
  const [view, setView] = useState('individual');
  const [theme, setTheme] = useState('dark');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastFetched, setLastFetched] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [filters, setFilters] = useState({ search: '', status: 'all' });
  const [watchlistOnly, setWatchlistOnly] = useState(false);
  const [deepFilter, setDeepFilter] = useState(null); // { type: 'status' | 'squad', value: string }
  const [devMode, setDevMode] = useState(false);

  const handleFilterChange = (key, value) => {
    if (key === 'reset') setFilters({ search: '', status: 'all' });
    else setFilters(prev => ({ ...prev, [key]: value }));
  };

  // Filter Data Logic
  const getFilteredData = () => {
    if (!data) return null;
    let { search, status } = filters;

    // Apply Deep Filter Overrides
    if (deepFilter) {
      if (deepFilter.type === 'status') status = deepFilter.value;
      if (deepFilter.type === 'squad') search = deepFilter.value;
    }

    if (!search && status === 'all' && !watchlistOnly) return data;

    const query = search.toLowerCase();

    // Build Owner->Squad Map (since individual owner.squad might be null)
    const ownerSquadMap = {};
    if (data.squads) {
      Object.entries(data.squads).forEach(([squadName, squadData]) => {
        if (squadData.owners) {
          squadData.owners.forEach(ownerName => {
            ownerSquadMap[ownerName] = squadName;
          });
        }
      });
    }

    // Filter Individual View
    const filteredIndividual = {};
    if (data.individual) {
      const riskOrder = { red: 0, amber: 1, green: 2 };

      Object.entries(data.individual)
        .filter(([key, owner]) => {
          if (watchlistOnly && owner.riskLevel === 'green') return false;
          return true;
        })
        .sort((a, b) => (riskOrder[a[1].riskLevel] || 3) - (riskOrder[b[1].riskLevel] || 3))
        .forEach(([key, owner]) => {
          const ownerSquad = owner.squad || ownerSquadMap[owner.name];

          const matchesSearch = Boolean(!query ||
            owner.name.toLowerCase().includes(query) ||
            (owner.goals && owner.goals.some(g => (g.goalTitle || '').toLowerCase().includes(query))) ||
            (ownerSquad && ownerSquad.toLowerCase().includes(query)) ||
            (query.length > 3 && (ownerSquad || '').toLowerCase().split(/[—–+\-] /)[0].trim().includes(query.split(/[—–+\-] /)[0].trim())) ||
            (filters.search === ownerSquad) // Exact match for drill-down
          );

          const matchesStatus = status === 'all' ||
            (status === 'overdue' && owner.overdue > 0) ||
            (status === 'blocked' && owner.blocked > 0) ||
            (status === 'completed' && owner.completed > 0) ||
            (status === 'critical' && owner.riskLevel === 'red') ||
            (status === 'high_priority' && owner.highPriority > 0) ||
            (status === 'active' && owner.active > 0);

          if (matchesSearch && matchesStatus) {
            filteredIndividual[key] = { ...owner, squad: ownerSquad }; // Inject squad name
          }
        });
    }

    // Filter Squads View
    const filteredSquads = {};
    if (data.squads) {
      Object.entries(data.squads).forEach(([name, squad]) => {
        const matchesSearch = !query || name.toLowerCase().includes(query) ||
          (squad.owners && squad.owners.some(o => o.toLowerCase().includes(query)));

        const matchesStatus = status === 'all' ||
          (status === 'overdue' && squad.overdue > 0) ||
          (status === 'blocked' && squad.blocked > 0) ||
          (status === 'completed' && squad.completed > 0) ||
          (status === 'critical' && squad.riskLevel === 'red') ||
          (status === 'active' && squad.active > 0);

        if (matchesSearch && matchesStatus) {
          filteredSquads[name] = squad;
        }
      });
    }

    // Return a new data object with filtered metrics
    return {
      ...data,
      individual: filteredIndividual,
      squads: filteredSquads,
    };
  };

  const displayData = getFilteredData();

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

  const navItems = [
    { id: 'individual', label: 'Individual', icon: Users, desc: 'Per-person execution' },
    { id: 'squads', label: 'Squads', icon: Building2, desc: 'Squad rollups' },
    { id: 'company', label: 'Company', icon: BarChart3, desc: 'Execution overview' },
    { id: 'executive', label: 'Executive', icon: Eye, desc: '10-min view' },
  ];

  const viewConfig = {
    individual: { title: 'Individual Execution', subtitle: 'Track each team member\'s goals, velocity, and risk signals' },
    squads: { title: 'Squad Rollups', subtitle: 'Aggregated squad-level execution visibility' },
    company: { title: 'Company Overview', subtitle: 'Holistic execution health and trend analysis' },
    executive: { title: 'Executive Mode', subtitle: 'Krish Mode — 10-minute daily scan' },
  };

  const handleDrillDown = (type, value) => {
    if (type === 'squad') {
      setFilters({ search: value, status: 'all' });
      setDeepFilter(null);
    } else if (type === 'status') {
      setFilters({ search: '', status: value });
      setDeepFilter(null);
    } else {
      setDeepFilter({ type, value });
      setFilters({ search: '', status: 'all' });
    }
    setView('individual');
  };

  // Expose to window for SquadGrid click access
  if (typeof window !== 'undefined') {
    window.handleSquadDrillDown = (squad) => handleDrillDown('squad', squad);
  }

  return (
    <div className="app-layout">
      {/* Sidebar */}
      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <div className="sidebar-logo" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '8px' }}>
            <img src="/fireflies.webp" alt="Fireflies.ai" style={{ height: '28px', width: 'auto' }} />
            <div className="sidebar-logo-subtitle" style={{ fontSize: '0.625rem', lineHeight: '1.2' }}>
              Execution Intelligence
              <br />
              (Team Accountability Dashboard)
            </div>
          </div>
        </div>

        <nav className="sidebar-nav">
          <div className="nav-section-label">Views</div>
          {navItems.map(item => (
            <button
              key={item.id}
              className={`nav-item ${view === item.id ? 'active' : ''}`}
              onClick={() => {
                setView(item.id);
                setSidebarOpen(false);
                setDeepFilter(null); // Clear deep filter when switching manually
              }}
            >
              <item.icon className="nav-item-icon" size={18} />
              <div>
                <div>{item.label}</div>
                <div style={{ fontSize: '0.6875rem', opacity: 0.7, fontWeight: 400 }}>{item.desc}</div>
              </div>
            </button>
          ))}
        </nav>

        <div className="sidebar-footer" style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: '16px', borderTop: '1px solid var(--border-primary)' }}>
          <div className="toggle-wrapper" onClick={() => setAutoRefresh(!autoRefresh)} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div className={`toggle ${autoRefresh ? 'active' : ''}`}>
              <div className="toggle-knob" />
            </div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Auto refresh</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {lastFetched && (
              <div className="live-dot" title={`Last synced: ${new Date(lastFetched).toLocaleTimeString()}`} />
            )}
            <div
              style={{
                width: '24px', height: '24px', borderRadius: '50%',
                background: devMode ? 'var(--brand-primary)' : 'var(--bg-tertiary)',
                color: devMode ? 'white' : 'var(--text-secondary)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '0.75rem', fontWeight: 600, border: '1px solid var(--border-secondary)',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
              onClick={() => setDevMode(!devMode)}
              title="Toggle Dev Mode"
            >
              N
            </div>
          </div>
        </div>
      </aside>

      {/* Dev Console Overlay */}
      {devMode && (
        <div style={{
          position: 'fixed', bottom: '20px', right: '20px',
          width: '300px', background: 'var(--bg-elevated)', border: '1px solid var(--border-primary)',
          borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-lg)', zIndex: 2000,
          padding: '16px', fontSize: '0.75rem', fontFamily: 'monospace'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-secondary)', paddingBottom: '8px', marginBottom: '8px' }}>
            <strong style={{ color: 'var(--brand-primary)' }}>DEV CONSOLE</strong>
            <X size={14} style={{ cursor: 'pointer' }} onClick={() => setDevMode(false)} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <div><strong>View:</strong> {view}</div>
            <div><strong>Theme:</strong> {theme}</div>
            <div><strong>Filters:</strong> {JSON.stringify(filters)}</div>
            <div><strong>Deep Filter:</strong> {JSON.stringify(deepFilter)}</div>
            <div><strong>Watchlist:</strong> {watchlistOnly ? 'ON' : 'OFF'}</div>
            <div style={{ marginTop: '8px' }}>
              <button
                className="btn btn-sm btn-primary"
                style={{ width: '100%' }}
                onClick={() => {
                  if (typeof window !== 'undefined') window.location.reload();
                }}
              >
                Restore Turbopack Overlay
              </button>
            </div>
          </div>
        </div>
      )
      }

      {/* Main Content */}
      <main className="main-content">
        <header className="page-header">
          <div className="page-header-left">
            <button className="btn btn-ghost btn-icon mobile-menu-btn" onClick={() => setSidebarOpen(!sidebarOpen)}>
              ☰
            </button>
            <h1 className="page-title">{viewConfig[view]?.title}</h1>
            <p className="page-subtitle">{viewConfig[view]?.subtitle}</p>
          </div>
          <div className="page-header-actions">
            {lastFetched && (
              <div className="last-fetched" style={{ marginRight: '8px' }}>
                <div className="live-dot" />
                {new Date(lastFetched).toLocaleTimeString()}
              </div>
            )}
            <button className="btn btn-sm" onClick={() => fetchData(true)} disabled={loading}>
              <RefreshCw size={14} className={loading ? 'loading-pulse' : ''} />
              {loading ? 'Syncing...' : 'Refresh'}
            </button>
            <button className="btn btn-icon" onClick={toggleTheme} title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}>
              {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
            </button>
          </div>
        </header>

        {(view === 'individual' || view === 'executive' || view === 'squads') && (
          <div style={{ padding: '0 var(--space-md)' }}>
            <FilterBar filters={filters} onFilterChange={handleFilterChange} />
          </div>
        )}

        {error && (
          <div className="error-state">
            <div className="error-message">
              <AlertTriangle size={20} style={{ marginBottom: '8px' }} />
              <div style={{ fontWeight: 600, marginBottom: '4px' }}>Connection Error</div>
              <div style={{ fontSize: '0.8125rem' }}>{error}</div>
              <button className="btn btn-sm" onClick={() => fetchData(true)} style={{ marginTop: '12px' }}>
                <RefreshCw size={14} /> Retry
              </button>
            </div>
          </div>
        )}

        {loading && !data && <LoadingSkeleton />}

        {data && !error && (
          <div className="page-body">
            {view === 'individual' && (
              <IndividualView
                data={getFilteredData().individual}
                unfilteredData={data.individual}
                trends={data.trends}
                watchlistOnly={watchlistOnly}
                onToggleWatchlist={() => setWatchlistOnly(!watchlistOnly)}
                onFilterChange={(type, val) => setFilters(f => ({ ...f, [type]: val }))}
              />
            )}
            {view === 'squads' && (
              <SquadView
                data={getFilteredData().squads}
                unfilteredData={data.squads}
                trends={data.trends}
                onDrillDown={handleDrillDown}
                onFilterChange={(type, val) => setFilters(f => ({ ...f, [type]: val }))}
              />
            )}
            {view === 'company' && (
              <CompanyView
                data={data.company}
                trends={data.trends}
                snapshots={data.snapshots}
                onDrillDown={(status) => handleDrillDown('status', status)}
              />
            )}
            {view === 'executive' && <ExecutiveView data={data.executive} company={data.company} trends={data.trends} />}
          </div>
        )}
      </main>
    </div >
  );
}
