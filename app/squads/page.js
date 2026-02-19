'use client';

import { Suspense } from 'react';
import DashboardClient from '../components/DashboardClient';
import SquadView from '../components/SquadView';
import FilterBar from '../components/FilterBar';

export default function SquadsPage() {
    return (
        <Suspense fallback={<div style={{ padding: 'var(--space-2xl)' }}>Loading squads dashboard...</div>}>
            <DashboardClient>
                {({ data, unfilteredData, filters, handleFilterChange, router }) => (
                    <>
                        <FilterBar filters={filters} onFilterChange={handleFilterChange} />
                        <SquadView
                            data={data?.squads}
                            unfilteredData={unfilteredData?.squads}
                            onFilterChange={handleFilterChange}
                        />
                    </>
                )}
            </DashboardClient>
        </Suspense>
    );
}
