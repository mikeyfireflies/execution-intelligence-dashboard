import { NextResponse } from 'next/server';
import { fetchAllGoals, getDatabaseSchema } from '@/lib/notion';
import {
    computeIndividualMetrics,
    computeSquadMetrics,
    computeCompanyMetrics,
    computeExecutiveMetrics,
} from '@/lib/computations';
import { takeSnapshot, getSnapshots, computeTrends } from '@/lib/snapshots';

let cachedData = null;
let cacheTimestamp = 0;
const CACHE_DURATION = 60 * 1000; // 1 minute

async function getData() {
    const now = Date.now();
    if (cachedData && (now - cacheTimestamp) < CACHE_DURATION) {
        return cachedData;
    }

    const goals = await fetchAllGoals();
    const individualMetrics = computeIndividualMetrics(goals);
    const squadMetrics = computeSquadMetrics(goals);
    const companyMetrics = computeCompanyMetrics(goals);
    const executiveMetrics = computeExecutiveMetrics(goals);

    // Take a snapshot
    takeSnapshot(companyMetrics, individualMetrics, squadMetrics);

    // Get historical snapshots for trends
    const snapshots = getSnapshots(30);
    const trends = computeTrends(snapshots);

    cachedData = {
        goals,
        individual: individualMetrics,
        squads: squadMetrics,
        company: companyMetrics,
        executive: executiveMetrics,
        trends,
        snapshots,
        lastFetched: new Date().toISOString(),
    };
    cacheTimestamp = now;

    return cachedData;
}

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const view = searchParams.get('view') || 'all';
        const forceRefresh = searchParams.get('refresh') === 'true';

        if (forceRefresh) {
            cachedData = null;
            cacheTimestamp = 0;
        }

        const data = await getData();

        switch (view) {
            case 'individual':
                return NextResponse.json({
                    individual: data.individual,
                    trends: data.trends,
                    lastFetched: data.lastFetched,
                });
            case 'squads':
                return NextResponse.json({
                    squads: data.squads,
                    trends: data.trends,
                    lastFetched: data.lastFetched,
                });
            case 'company':
                return NextResponse.json({
                    company: data.company,
                    trends: data.trends,
                    snapshots: data.snapshots,
                    lastFetched: data.lastFetched,
                });
            case 'executive':
                return NextResponse.json({
                    executive: data.executive,
                    company: data.company,
                    trends: data.trends,
                    lastFetched: data.lastFetched,
                });
            case 'schema':
                const schema = await getDatabaseSchema();
                return NextResponse.json({ schema });
            default:
                return NextResponse.json(data);
        }
    } catch (error) {
        console.error('Notion API error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to fetch data from Notion' },
            { status: 500 }
        );
    }
}
