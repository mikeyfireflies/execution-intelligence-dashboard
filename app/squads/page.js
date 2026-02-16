'use client';

import DashboardClient from '../components/DashboardClient';
import SquadView from '../components/SquadView';
import FilterBar from '../components/FilterBar';

export default function SquadsPage() {
    return (
        <DashboardClient>
            {({ data, unfilteredData, filters, handleFilterChange, router }) => (
                <>
                    <FilterBar filters={filters} onFilterChange={handleFilterChange} />
                    <SquadView
                        data={data?.squads}
                        unfilteredData={unfilteredData?.squads}
                        onFilterChange={handleFilterChange}
                        onDrillDown={(type, value) => {
                            const params = new URLSearchParams();
                            if (type === 'squad') params.set('q', value);
                            if (type === 'status') params.set('status', value);
                            router.push(`/individual?${params.toString()}`);
                        }}
                    />
                </>
            )}
        </DashboardClient>
    );
}
