import { differenceInDays, subDays, isAfter, isBefore, parseISO, startOfDay, startOfWeek, format } from 'date-fns';

const NOW = () => new Date();

// ─── Status categorization ──────────────────────────
const ACTIVE_STATUSES = ['In Progress', 'In Review', 'Active'];
const BLOCKED_STATUSES = ['Blocked', 'On Hold', 'Waiting'];
const COMPLETED_STATUSES = ['Done', 'Complete', 'Completed', 'Shipped'];
const NOT_STARTED_STATUSES = ['Not Started', 'Backlog', 'To Do'];

function isActive(status) {
    return ACTIVE_STATUSES.some(s => status?.toLowerCase() === s.toLowerCase());
}
function isBlocked(status) {
    return BLOCKED_STATUSES.some(s => status?.toLowerCase() === s.toLowerCase());
}
function isCompleted(status) {
    return COMPLETED_STATUSES.some(s => status?.toLowerCase() === s.toLowerCase());
}
function isNotStarted(status) {
    return NOT_STARTED_STATUSES.some(s => status?.toLowerCase() === s.toLowerCase());
}

function isOverdue(goal) {
    if (!goal.dueDate) return false;
    const due = parseISO(goal.dueDate);
    return isBefore(due, startOfDay(NOW())) && !isCompleted(goal.status);
}

function daysSinceUpdate(goal) {
    if (!goal.lastUpdated) return 999;
    return differenceInDays(NOW(), parseISO(goal.lastUpdated));
}

function isHighPriority(goal) {
    return goal.priority?.toLowerCase() === 'high';
}

// ─── Risk Detection ─────────────────────────────────
function detectRisks(goal) {
    if (isCompleted(goal.status)) return [];

    const risks = [];
    if (isHighPriority(goal) && isOverdue(goal)) {
        risks.push({ type: 'critical', message: 'High priority overdue' });
    }
    if (daysSinceUpdate(goal) > 7) {
        risks.push({ type: 'warning', message: `No update in ${daysSinceUpdate(goal)} days` });
    }
    if (isBlocked(goal.status)) {
        risks.push({ type: 'warning', message: 'Blocked' });
    }
    if (isOverdue(goal)) {
        risks.push({ type: 'caution', message: 'Overdue' });
    }
    return risks;
}

function riskLevel(risks) {
    if (risks.some(r => r.type === 'critical')) return 'red';
    if (risks.some(r => r.type === 'warning')) return 'amber';
    return 'green';
}

// ─── Individual Metrics ─────────────────────────────
// ─── Individual Metrics ─────────────────────────────
export function computeIndividualMetrics(goals) {
    const owners = {};

    goals.forEach(goal => {
        const owner = goal.owner || 'Unassigned';
        if (!owners[owner]) {
            owners[owner] = {
                name: owner,
                goals: [],
                active: 0,
                blocked: 0,
                overdue: 0,
                completed: 0,
                notStarted: 0,
                highPriority: 0,
                totalEffort: 0,
                effortInProgress: 0,
                daysSinceLastUpdate: 999,
                risks: [],
                statusBreakdown: {},
                velocity: [],
            };

            // Initialize last 4 weeks for sparkline
            for (let i = 3; i >= 0; i--) {
                const weekStart = startOfWeek(subDays(NOW(), i * 7), { weekStartsOn: 1 });
                const key = format(weekStart, 'MMM dd');
                owners[owner].velocity.push({ week: key, points: 0 });
            }
        }

        const o = owners[owner];
        o.goals.push(goal);

        if (isActive(goal.status)) { o.active++; o.effortInProgress += (goal.effortPoints || 0); }
        if (isBlocked(goal.status)) { o.blocked++; o.effortInProgress += (goal.effortPoints || 0); }
        if (isCompleted(goal.status)) o.completed++;
        if (isNotStarted(goal.status)) o.notStarted++;
        if (isOverdue(goal)) o.overdue++;
        if (isHighPriority(goal) && !isCompleted(goal.status)) o.highPriority++;
        o.totalEffort += (goal.effortPoints || 0);

        const dsu = daysSinceUpdate(goal);
        if (dsu < o.daysSinceLastUpdate) o.daysSinceLastUpdate = dsu;

        const goalRisks = detectRisks(goal);
        o.risks.push(...goalRisks.map(r => ({
            ...r,
            goalTitle: goal.goalTitle,
            notionUrl: goal.notionUrl,
            sourceUrl: goal.sourceUrl,
            daysSinceUpdate: dsu,
            dueDate: goal.dueDate
        })));

        // Status breakdown
        const s = goal.status || 'Unknown';
        o.statusBreakdown[s] = (o.statusBreakdown[s] || 0) + 1;

        // Velocity (for sparklines - 4 weeks)
        if (isCompleted(goal.status)) {
            // Priority: lastUpdated > created_time > NOW (last resort)
            const dateStr = goal.lastUpdated || goal.created_time || NOW().toISOString();
            const updatedDate = parseISO(dateStr);
            const weekStart = startOfWeek(updatedDate, { weekStartsOn: 1 });
            const key = format(weekStart, 'MMM dd');
            const weekBucket = o.velocity.find(v => v.week === key);
            if (weekBucket) {
                weekBucket.points += (goal.effortPoints || 0);
            }
        }
    });

    // Compute risk level for each owner
    Object.values(owners).forEach(o => {
        o.riskLevel = riskLevel(o.risks);
        o.totalGoals = o.goals.length;
    });

    return owners;
}

/**
 * Computes weekly throughput (velocity) for a specific owner
 * Returns last 8 weeks of data
 */
export function computeIndividualVelocity(goals, ownerName) {
    const ownerGoals = goals.filter(g => g.owner === ownerName && isCompleted(g.status));
    const weeks = {};

    // Initialize last 8 weeks
    for (let i = 7; i >= 0; i--) {
        const weekStart = startOfWeek(subDays(NOW(), i * 7), { weekStartsOn: 1 });
        const key = format(weekStart, 'MMM dd');
        weeks[key] = 0;
    }

    ownerGoals.forEach(goal => {
        const dateStr = goal.lastUpdated || goal.created_time || NOW().toISOString();
        const updatedDate = parseISO(dateStr);
        const weekStart = startOfWeek(updatedDate, { weekStartsOn: 1 });
        const key = format(weekStart, 'MMM dd');

        if (weeks.hasOwnProperty(key)) {
            weeks[key] += (goal.effortPoints || 0);
        }
    });

    return Object.entries(weeks).map(([week, points]) => ({
        week,
        points: Math.round(points * 10) / 10 // Round to 1 decimal
    }));
}

/**
 * Computes the 4 performance genes for the Accountability Radar
 */
export function computeAccountabilityRadar(profile, velocityData) {
    // 1. Velocity (Avg points per week vs target of 5)
    const avgVelocity = velocityData.length > 0
        ? velocityData.reduce((sum, w) => sum + w.points, 0) / velocityData.length
        : 0;
    const velocityScore = Math.min(100, Math.round((avgVelocity / 5) * 100));

    // 2. Timeliness (Percentage of goals not overdue)
    const timelinessScore = profile.totalGoals > 0
        ? Math.round(((profile.totalGoals - profile.overdue) / profile.totalGoals) * 100)
        : 100;

    // 3. Responsiveness (Based on update freshness)
    // 100% if updated < 2 days ago, 0% if > 14 days
    const responsivenessScore = Math.max(0, Math.min(100, Math.round(100 - (profile.daysSinceLastUpdate * 7))));

    // 4. Resilience (Inverse of blockers)
    // 100% if 0 blocked, -25% per blocker
    const resilienceScore = Math.max(0, 100 - (profile.blocked * 25));

    return [
        { subject: 'Resilience', A: resilienceScore, fullMark: 100 },
        { subject: 'Timeliness', A: timelinessScore, fullMark: 100 },
        { subject: 'Responsiveness', A: responsivenessScore, fullMark: 100 },
        { subject: 'Velocity', A: velocityScore, fullMark: 100 },
    ];
}

// ─── Squad Rollups ──────────────────────────────────
export function computeSquadMetrics(goals) {
    const squads = {};

    goals.forEach(goal => {
        const squadName = goal.squad || goal.parentGoal || 'Uncategorized';
        if (!squads[squadName]) {
            squads[squadName] = {
                name: squadName,
                goals: [],
                active: 0,
                completed: 0,
                overdue: 0,
                blocked: 0,
                notStarted: 0,
                totalEffort: 0,
                owners: new Set(),
                ownedCount: 0,
                stuckGoals: [],
                risks: [],
                statusBreakdown: {},
            };
        }

        const s = squads[squadName];
        s.goals.push(goal);

        if (isActive(goal.status)) s.active++;
        if (isCompleted(goal.status)) s.completed++;
        if (isOverdue(goal)) s.overdue++;
        if (isBlocked(goal.status)) s.blocked++;
        if (isNotStarted(goal.status)) s.notStarted++;
        s.totalEffort += (goal.effortPoints || 0);

        if (goal.owner && goal.owner !== 'Unassigned') {
            s.owners.add(goal.owner);
            s.ownedCount++;
        }

        // Stuck detection: status unchanged + overdue or >14 days since update
        if (daysSinceUpdate(goal) > 14 || (isOverdue(goal) && isActive(goal.status))) {
            s.stuckGoals.push({
                goalTitle: goal.goalTitle,
                notionUrl: goal.notionUrl,
                sourceUrl: goal.sourceUrl
            });
        }

        const goalRisks = detectRisks(goal);
        s.risks.push(...goalRisks.map(r => ({
            ...r,
            goalTitle: goal.goalTitle,
            notionUrl: goal.notionUrl,
            sourceUrl: goal.sourceUrl
        })));

        const dsu = daysSinceUpdate(goal);
        if (dsu < s.daysSinceLastUpdate) s.daysSinceLastUpdate = dsu;

        const status = goal.status || 'Unknown';
        s.statusBreakdown[status] = (s.statusBreakdown[status] || 0) + 1;
    });

    Object.values(squads).forEach(s => {
        s.totalGoals = s.goals.length;
        s.ownershipClarity = s.totalGoals > 0
            ? Math.round((s.ownedCount / s.totalGoals) * 100)
            : 0;
        s.owners = Array.from(s.owners);
        s.riskLevel = riskLevel(s.risks);

        // Effort concentration risk: if one owner has >60% of effort
        const effortByOwner = {};
        s.goals.forEach(g => {
            const o = g.owner || 'Unassigned';
            effortByOwner[o] = (effortByOwner[o] || 0) + (g.effortPoints || 0);
        });
        const maxEffort = Math.max(...Object.values(effortByOwner), 0);
        s.effortConcentrationRisk = s.totalEffort > 0 && maxEffort / s.totalEffort > 0.6;
    });

    return squads;
}

// ─── Company Overview ───────────────────────────────
export function computeCompanyMetrics(goals) {
    const totalPlanned = goals.length;
    const completed = goals.filter(g => isCompleted(g.status)).length;
    const overdue = goals.filter(g => isOverdue(g)).length;
    const blocked = goals.filter(g => isBlocked(g.status)).length;
    const active = goals.filter(g => isActive(g.status)).length;
    const highPriorityOverdue = goals.filter(g => isHighPriority(g) && isOverdue(g)).length;

    // Slippage rate
    const goalsWithDue = goals.filter(g => g.dueDate);
    const slipped = goalsWithDue.filter(g => isOverdue(g)).length;
    const slippageRate = goalsWithDue.length > 0
        ? Math.round((slipped / goalsWithDue.length) * 100)
        : 0;

    // Update recency
    const staleCount = goals.filter(g => daysSinceUpdate(g) > 7).length;
    const updateRecency = totalPlanned > 0
        ? Math.round(((totalPlanned - staleCount) / totalPlanned) * 100)
        : 100;

    // Blocked aging (avg days for blocked items)
    const blockedGoals = goals.filter(g => isBlocked(g.status));
    const avgBlockedAge = blockedGoals.length > 0
        ? Math.round(blockedGoals.reduce((sum, g) => sum + daysSinceUpdate(g), 0) / blockedGoals.length)
        : 0;

    // High priority lag
    const highPriorityGoals = goals.filter(g => isHighPriority(g) && !isCompleted(g.status));
    const highPriorityLag = highPriorityGoals.length > 0
        ? Math.round(highPriorityGoals.reduce((sum, g) => {
            if (g.dueDate && isOverdue(g)) return sum + differenceInDays(NOW(), parseISO(g.dueDate));
            return sum;
        }, 0) / Math.max(highPriorityGoals.filter(g => isOverdue(g)).length, 1))
        : 0;

    // Execution Health Score (0-100)
    const completionRate = totalPlanned > 0 ? completed / totalPlanned : 0;
    const overduePercent = totalPlanned > 0 ? overdue / totalPlanned : 0;
    const updateRecencyScore = updateRecency / 100;
    const blockedScore = totalPlanned > 0 ? 1 - (blocked / totalPlanned) : 1;

    const healthScore = Math.round(
        (completionRate * 30) +
        ((1 - overduePercent) * 25) +
        (updateRecencyScore * 20) +
        (blockedScore * 15) +
        ((1 - Math.min(highPriorityLag / 30, 1)) * 10)
    );

    let healthStatus = 'green';
    if (healthScore < 50) healthStatus = 'red';
    else if (healthScore < 70) healthStatus = 'amber';

    // Status breakdown
    const statusBreakdown = {};
    goals.forEach(g => {
        const s = g.status || 'Unknown';
        statusBreakdown[s] = (statusBreakdown[s] || 0) + 1;
    });

    return {
        totalPlanned,
        completed,
        overdue,
        blocked,
        active,
        highPriorityOverdue,
        slippageRate,
        updateRecency,
        avgBlockedAge,
        highPriorityLag,
        healthScore,
        healthStatus,
        statusBreakdown,
        completionRate: Math.round(completionRate * 100),
    };
}

// ─── Executive Mode (Krish Mode) ────────────────────
export function computeExecutiveMetrics(goals) {
    const allRisks = [];

    goals.forEach(goal => {
        const risks = detectRisks(goal);
        risks.forEach(r => {
            allRisks.push({
                ...r,
                goalTitle: goal.goalTitle,
                owner: goal.owner,
                dueDate: goal.dueDate,
                status: goal.status,
                priority: goal.priority,
                daysSinceUpdate: daysSinceUpdate(goal),
                notionUrl: goal.notionUrl,
                sourceUrl: goal.sourceUrl
            });
        });
    });

    // Sort by severity
    const severityOrder = { critical: 0, warning: 1, caution: 2 };
    allRisks.sort((a, b) => (severityOrder[a.type] || 3) - (severityOrder[b.type] || 3));

    const topRisks = allRisks.slice(0, 5);
    const highPriorityOverdue = goals.filter(g => isHighPriority(g) && isOverdue(g));
    const needsUnblock = goals.filter(g => isBlocked(g.status));
    const slippingInitiatives = goals.filter(g => isOverdue(g) && isActive(g.status));

    // Delivery drops (owners with high overdue relative to total)
    const ownerMetrics = computeIndividualMetrics(goals);
    const deliveryDrops = Object.values(ownerMetrics)
        .filter(o => o.totalGoals > 0 && (o.overdue / o.totalGoals) > 0.3)
        .map(o => ({ name: o.name, overdueRate: Math.round((o.overdue / o.totalGoals) * 100) }));

    // Squad velocity summary
    const squadMetrics = computeSquadMetrics(goals);
    const squadSummary = Object.values(squadMetrics).map(s => ({
        name: s.name,
        active: s.active,
        completed: s.completed,
        overdue: s.overdue,
        blocked: s.blocked,
        riskLevel: s.riskLevel,
    }));

    return {
        topRisks,
        highPriorityOverdue: highPriorityOverdue.map(g => ({
            goalTitle: g.goalTitle,
            owner: g.owner,
            dueDate: g.dueDate,
            daysSinceUpdate: daysSinceUpdate(g),
            notionUrl: g.notionUrl,
            sourceUrl: g.sourceUrl
        })),
        deliveryDrops,
        slippingInitiatives: slippingInitiatives.map(g => ({
            goalTitle: g.goalTitle,
            owner: g.owner,
            dueDate: g.dueDate,
            status: g.status,
            notionUrl: g.notionUrl,
            sourceUrl: g.sourceUrl
        })),
        needsUnblock: needsUnblock.map(g => ({
            goalTitle: g.goalTitle,
            owner: g.owner,
            status: g.status,
            daysSinceUpdate: daysSinceUpdate(g),
            notionUrl: g.notionUrl,
            sourceUrl: g.sourceUrl
        })),
        squadSummary,
    };
}

export { isActive, isBlocked, isCompleted, isOverdue, daysSinceUpdate, isHighPriority, detectRisks, riskLevel };
