'use client';

import { Suspense } from 'react';
import DashboardClient from '../components/DashboardClient';
import IndividualView from '../components/IndividualView';
import FilterBar from '../components/FilterBar';

export default function IndividualPage() {
    return (
        <Suspense fallback={<div style={{ padding: 'var(--space-2xl)' }}>Loading individual dashboard...</div>}>
            <DashboardClient>
                {({ data, unfilteredData, filters, handleFilterChange, watchlistOnly, onToggleWatchlist }) => (
                    <>
                        <FilterBar filters={filters} onFilterChange={handleFilterChange} />
                        <IndividualView
                            data={data?.individual}
                            unfilteredData={unfilteredData?.individual}
                            onFilterChange={handleFilterChange}
                            watchlistOnly={watchlistOnly}
                            onToggleWatchlist={onToggleWatchlist}
                        />
                    </>
                )}
            </DashboardClient>
        </Suspense>
    );
}
