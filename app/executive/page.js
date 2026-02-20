'use client';

import { Suspense } from 'react';
import DashboardClient from '../components/DashboardClient';
import ExecutiveView from '../components/ExecutiveView';

export default function ExecutivePage() {
    return (
        <Suspense fallback={<div style={{ padding: 'var(--space-2xl)' }}>Loading executive dashboard...</div>}>
            <DashboardClient>
                {({ data }) => (
                    <ExecutiveView
                        data={data?.executive}
                        company={data?.company}
                        goals={data?.goals}
                    />
                )}
            </DashboardClient>
        </Suspense>
    );
}
