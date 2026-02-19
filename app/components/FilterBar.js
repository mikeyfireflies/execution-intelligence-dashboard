'use client';

import { Search, Filter, X } from 'lucide-react';

export default function FilterBar({ onFilterChange, filters }) {
    return (
        <div className="filter-bar animate-in" style={{
            display: 'flex', gap: '8px', alignItems: 'center',
            flexWrap: 'wrap',
            marginBottom: 'var(--space-md)', padding: '8px 12px',
            background: 'var(--bg-elevated)', borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-primary)'
        }}>
            <div style={{ position: 'relative', flex: 1 }}>
                <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }} />
                <input
                    type="text"
                    placeholder="Search owners, goals, or squads..."
                    className="search-input"
                    value={filters.search || ''}
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
                    value={filters.status || 'all'}
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

            {(filters.search || (filters.status && filters.status !== 'all')) && (
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
