import fs from 'fs';
import path from 'path';
import { format, subDays, parseISO } from 'date-fns';

const SNAPSHOT_DIR = path.join(process.cwd(), 'data');
const SNAPSHOT_FILE = path.join(SNAPSHOT_DIR, 'snapshots.json');

function ensureDir() {
    if (!fs.existsSync(SNAPSHOT_DIR)) {
        fs.mkdirSync(SNAPSHOT_DIR, { recursive: true });
    }
}

function readSnapshots() {
    ensureDir();
    if (!fs.existsSync(SNAPSHOT_FILE)) return [];
    try {
        return JSON.parse(fs.readFileSync(SNAPSHOT_FILE, 'utf-8'));
    } catch {
        return [];
    }
}

function writeSnapshots(snapshots) {
    try {
        ensureDir();
        fs.writeFileSync(SNAPSHOT_FILE, JSON.stringify(snapshots, null, 2));
    } catch (error) {
        console.warn('Failed to write snapshot (likely read-only fs):', error.message);
    }
}

import { saveSnapshotToNotion, getSnapshotsFromNotion } from './notion';

export async function takeSnapshot(companyMetrics, individualMetrics, squadMetrics) {
    const today = format(new Date(), 'yyyy-MM-dd');

    // Construct the snapshot object
    const snapshot = {
        date: today,
        timestamp: new Date().toISOString(),
        company: {
            completed: companyMetrics.completed,
            overdue: companyMetrics.overdue,
            blocked: companyMetrics.blocked,
            active: companyMetrics.active,
            healthScore: companyMetrics.healthScore,
            healthStatus: companyMetrics.healthStatus,
            slippageRate: companyMetrics.slippageRate,
            completionRate: companyMetrics.completionRate,
            totalPlanned: companyMetrics.totalPlanned,
        },
        // We only persist company metrics to Notion for trends
        // Detailed metrics are computed live
    };

    // Try to save to Notion
    await saveSnapshotToNotion(snapshot);

    // Fallback: Try to save locally (will fail on Vercel, work locally)
    try {
        const snapshots = readSnapshots();
        const filtered = snapshots.filter(s => s.date !== today);
        filtered.push(snapshot);

        // Keep last 90 days locally
        const cutoff = format(subDays(new Date(), 90), 'yyyy-MM-dd');
        const trimmed = filtered.filter(s => s.date >= cutoff);

        writeSnapshots(trimmed);
    } catch (e) {
        // Ignore local write errors
    }

    return snapshot;
}

export async function getSnapshots(days = 30) {
    // Try fetching from Notion first
    const notionSnapshots = await getSnapshotsFromNotion(days);

    if (notionSnapshots.length > 0) {
        return notionSnapshots;
    }

    // Fallback to local file system
    const snapshots = readSnapshots();
    const cutoff = format(subDays(new Date(), days), 'yyyy-MM-dd');
    return snapshots.filter(s => s.date >= cutoff).sort((a, b) => a.date.localeCompare(b.date));
}

export function computeTrends(snapshots) {
    if (snapshots.length < 2) {
        return {
            completionTrend: 'neutral',
            overdueTrend: 'neutral',
            healthTrend: 'neutral',
            velocityTrend: 'neutral',
            weekOverWeek: null,
        };
    }

    const latest = snapshots[snapshots.length - 1];
    const weekAgo = snapshots.find(s => {
        const diff = Math.abs(
            (new Date(latest.date).getTime() - new Date(s.date).getTime()) / (1000 * 60 * 60 * 24)
        );
        return diff >= 6 && diff <= 8;
    }) || snapshots[Math.max(0, snapshots.length - 7)];

    const trend = (current, previous) => {
        if (current > previous) return 'up';
        if (current < previous) return 'down';
        return 'neutral';
    };

    return {
        completionTrend: trend(latest.company.completed, weekAgo.company.completed),
        overdueTrend: trend(latest.company.overdue, weekAgo.company.overdue),
        healthTrend: trend(latest.company.healthScore, weekAgo.company.healthScore),
        velocityTrend: trend(
            latest.company.completed - weekAgo.company.completed,
            0
        ),
        weekOverWeek: {
            completionDelta: latest.company.completed - weekAgo.company.completed,
            overdueDelta: latest.company.overdue - weekAgo.company.overdue,
            healthDelta: latest.company.healthScore - weekAgo.company.healthScore,
        },
    };
}

export function getTrendArrow(trend) {
    switch (trend) {
        case 'up': return '↑';
        case 'down': return '↓';
        default: return '→';
    }
}
