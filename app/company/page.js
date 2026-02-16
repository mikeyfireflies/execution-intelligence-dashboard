'use client';

import DashboardClient from '../components/DashboardClient';
import CompanyView from '../components/CompanyView';

export default function CompanyPage() {
    return (
        <DashboardClient>
            {({ data, router }) => (
                <CompanyView
                    data={data?.company}
                    trends={data?.trends}
                    snapshots={data?.snapshots}
                    onDrillDown={(type, value) => {
                        const params = new URLSearchParams();
                        if (type === 'status') params.set('status', value);
                        router.push(`/individual?${params.toString()}`);
                    }}
                />
            )}
        </DashboardClient>
    );
}
