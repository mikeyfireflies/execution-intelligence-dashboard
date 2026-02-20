import { NextResponse } from 'next/server';
import { getDashboardData, getDatabaseSchema } from '@/lib/notion';

let cachedData = null;
let cacheTimestamp = 0;
const CACHE_DURATION = 60 * 1000; // 1 minute

async function getData() {
    const now = Date.now();
    if (cachedData && (now - cacheTimestamp) < CACHE_DURATION) {
        return cachedData;
    }

    cachedData = await getDashboardData();
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
                    goals: data.goals,
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
