'use client';

import DashboardClient from '../components/DashboardClient';
import ExecutiveView from '../components/ExecutiveView';

export default function ExecutivePage() {
    return (
        <DashboardClient>
            {({ data }) => (
                <ExecutiveView
                    data={data?.executive}
                    company={data?.company}
                />
            )}
        </DashboardClient>
    );
}
