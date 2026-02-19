import { Client } from '@notionhq/client';
import {
  computeIndividualMetrics,
  computeSquadMetrics,
  computeCompanyMetrics,
  computeExecutiveMetrics,
} from '@/lib/computations';
import { takeSnapshot, getSnapshots, computeTrends } from '@/lib/snapshots';

const notion = new Client({ auth: process.env.NOTION_TOKEN });
const DATA_SOURCE_ID = process.env.NOTION_DATABASE_ID;
const SNAPSHOT_DB_ID = process.env.NOTION_SNAPSHOT_DATABASE_ID;
const SNAPSHOT_DS_ID = process.env.NOTION_SNAPSHOT_DATA_SOURCE_ID;
const TEAM_DIR_DB_ID = process.env.NOTION_TEAM_DIRECTORY_DATABASE_ID;

// Direct fetch helper — bypasses the Fireflies custom SDK endpoint
async function notionQuery(databaseId, body = {}) {
  const res = await fetch(`https://api.notion.com/v1/databases/${databaseId}/query`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.NOTION_TOKEN}`,
      'Notion-Version': '2022-06-28',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `Notion query failed: ${res.status}`);
  }
  return res.json();
}

// Configurable field mapping — adjust if Notion schema differs
const FIELD_MAP = {
  goalTitle: 'Goal Title',
  parentGoal: 'Parent Goal',
  owner: 'Owner',
  squad: 'Squad',
  status: 'Status',
  priority: 'Priority',
  dueDate: 'Due Date',
  effortPoints: 'Effort Points',
  role: 'Role',
  sourceUrl: 'Source URL',
  lastUpdated: 'Last Updated',
  // Snapshot fields (Match your "Greg D" DB properties)
  'Date': 'Date ',
  'Completed': 'Completed',
  'Active': 'Active ',
  'Overdue': 'Overdue',
  'Blocked': 'Blocked',
  'Health Score': 'HealthScore',
  // Team Directory fields
  'Current Focus': 'Current Focus',
  'Profile Image': 'Profile Image',
  'Department': 'Department',
  'Bio': 'Bio',
  'Role': 'Role',
  'Key Stakeholders': 'Key Stakeholders',
  'Relation': 'Relation',
};

export async function getDatabaseSchema() {
  const ds = await notion.databases.retrieve({ database_id: DATA_SOURCE_ID });
  // If retrieve fails with databases, try searching or just assume data_source
  return Object.entries(ds.properties || {}).map(([name, prop]) => ({
    name,
    type: prop.type,
  }));
}

function extractProperty(page, fieldName) {
  const prop = page.properties[fieldName];
  if (!prop) return null;

  switch (prop.type) {
    case 'title':
      return prop.title?.map(t => t.plain_text).join('') || '';
    case 'rich_text':
      return prop.rich_text?.map(t => t.plain_text).join('') || '';
    case 'select':
      return prop.select?.name || null;
    case 'multi_select':
      return prop.multi_select?.map(s => s.name) || [];
    case 'number':
      return prop.number ?? null;
    case 'date':
      return prop.date?.start || null;
    case 'url':
      return prop.url || null;
    case 'people':
      return prop.people?.map(p => p.name || p.id).join(', ') || '';
    case 'last_edited_time':
      return prop.last_edited_time || null;
    case 'created_time':
      return prop.created_time || null;
    case 'checkbox':
      return prop.checkbox || false;
    case 'files':
      return prop.files?.[0]?.file?.url || prop.files?.[0]?.external?.url || null;
    case 'status':
      return prop.status?.name || null;
    case 'relation':
      return prop.relation?.map(r => r.id) || [];
    case 'rollup':
      if (prop.rollup?.type === 'number') return prop.rollup.number;
      if (prop.rollup?.type === 'array')
        return prop.rollup.results?.map(r => extractProperty({ properties: { x: r } }, 'x'));
      return null;
    case 'formula':
      if (prop.formula?.type === 'string') return prop.formula.string;
      if (prop.formula?.type === 'number') return prop.formula.number;
      if (prop.formula?.type === 'boolean') return prop.formula.boolean;
      if (prop.formula?.type === 'date') return prop.formula.date?.start;
      return null;
    default:
      return null;
  }
}

function normalizeGoal(page) {
  return {
    id: page.id,
    goalTitle: extractProperty(page, FIELD_MAP.goalTitle) || 'Untitled',
    parentGoal: extractProperty(page, FIELD_MAP.parentGoal),
    owner: extractProperty(page, FIELD_MAP.owner) || 'Unassigned',
    squad: extractProperty(page, FIELD_MAP.squad),
    status: extractProperty(page, FIELD_MAP.status) || 'Unknown',
    priority: extractProperty(page, FIELD_MAP.priority) || 'Medium',
    dueDate: extractProperty(page, FIELD_MAP.dueDate),
    effortPoints: extractProperty(page, FIELD_MAP.effortPoints) || 0,
    role: extractProperty(page, FIELD_MAP.role),
    sourceUrl: extractProperty(page, FIELD_MAP.sourceUrl),
    lastUpdated: extractProperty(page, FIELD_MAP.lastUpdated) || page.last_edited_time,
    notionUrl: page.url,
  };
}

const localCache = {
  data: null,
  timestamp: 0,
};

const CACHE_TTL = 60 * 1000; // 60 seconds

export async function getDashboardData() {
  try {
    const now = Date.now();
    if (localCache.data && (now - localCache.timestamp) < CACHE_TTL) {
      console.log('Returning cached dashboard data');
      return localCache.data;
    }

    console.log('Fetching fresh dashboard data from Notion');
    const goals = await fetchAllGoals();
    const directory = await fetchTeamDirectory();

    if (!goals || goals.length === 0) {
      console.warn('No goals returned from Notion. Check NOTION_DATABASE_ID.');
    }

    const individualMetrics = computeIndividualMetrics(goals);
    const squadMetrics = computeSquadMetrics(goals);
    const companyMetrics = computeCompanyMetrics(goals);
    const executiveMetrics = computeExecutiveMetrics(goals);

    // Merge directory data into individual metrics
    Object.keys(individualMetrics).forEach(name => {
      if (directory[name]) {
        individualMetrics[name] = {
          ...individualMetrics[name],
          ...directory[name]
        };
      }
    });

    // Take a snapshot
    try {
      await takeSnapshot(companyMetrics, individualMetrics, squadMetrics);
    } catch (snapshotError) {
      console.error('Failed to take snapshot, continuing...', snapshotError);
    }

    // Get historical snapshots for trends
    let snapshots = [];
    try {
      snapshots = await getSnapshots(30);
    } catch (e) {
      console.error('Failed to get snapshots, continuing...', e);
    }

    const trends = computeTrends(snapshots);

    const result = {
      goals,
      directory,
      individual: individualMetrics,
      squads: squadMetrics,
      company: companyMetrics,
      executive: executiveMetrics,
      trends,
      snapshots,
      lastFetched: new Date().toISOString(),
    };

    localCache.data = result;
    localCache.timestamp = now;

    return result;
  } catch (error) {
    console.error('CRITICAL ERROR in getDashboardData:', error);
    throw error;
  }
}

export async function fetchAllGoals() {
  const results = [];
  let cursor = undefined;
  let hasMore = true;

  while (hasMore) {
    const body = { page_size: 100 };
    if (cursor) body.start_cursor = cursor;

    const response = await notionQuery(DATA_SOURCE_ID, body);

    results.push(...response.results);
    hasMore = response.has_more;
    cursor = response.next_cursor;
  }

  return results.map(normalizeGoal);
}

export async function saveSnapshotToNotion(snapshot) {
  if (!SNAPSHOT_DB_ID) {
    console.warn('NOTION_SNAPSHOT_DATABASE_ID not set. Skipping snapshot save.');
    return null;
  }

  try {
    const response = await notion.pages.create({
      parent: { database_id: SNAPSHOT_DB_ID },
      properties: {
        'Name': {
          title: [{ text: { content: `Snapshot ${snapshot.date}` } }]
        },
        [FIELD_MAP.Date]: { rich_text: [{ text: { content: snapshot.date } }] },
        [FIELD_MAP.Completed]: { rich_text: [{ text: { content: String(snapshot.company.completed) } }] },
        [FIELD_MAP.Active]: { rich_text: [{ text: { content: String(snapshot.company.active) } }] },
        [FIELD_MAP.Overdue]: { rich_text: [{ text: { content: String(snapshot.company.overdue) } }] },
        [FIELD_MAP.Blocked]: { rich_text: [{ text: { content: String(snapshot.company.blocked) } }] },
        [FIELD_MAP['Health Score']]: { rich_text: [{ text: { content: String(snapshot.company.healthScore) } }] }
      }
    });
    return response;
  } catch (error) {
    console.error('Failed to save snapshot to Notion:', error);
    return null;
  }
}

export async function getSnapshotsFromNotion(days = 90) {
  if (!SNAPSHOT_DB_ID && !SNAPSHOT_DS_ID) return [];

  const tryQuery = async (id) => {
    if (!id) return null;
    try {
      return await notionQuery(id, {
        sorts: [{ property: FIELD_MAP.Date, direction: 'ascending' }],
      });
    } catch (e) {
      console.warn(`Failed to query snapshot database ${id}:`, e.message);
      return null;
    }
  };

  try {
    // Try Data Source ID first if it exists, otherwise use Primary DB ID
    let response = await tryQuery(SNAPSHOT_DS_ID);
    if (!response) {
      response = await tryQuery(SNAPSHOT_DB_ID);
    }

    if (!response || !response.results) return [];

    return response.results.map(page => {
      const getNum = (val) => isNaN(parseFloat(val)) ? 0 : parseFloat(val);
      return {
        date: extractProperty(page, FIELD_MAP.Date),
        company: {
          completed: getNum(extractProperty(page, FIELD_MAP.Completed)),
          active: getNum(extractProperty(page, FIELD_MAP.Active)),
          overdue: getNum(extractProperty(page, FIELD_MAP.Overdue)),
          blocked: getNum(extractProperty(page, FIELD_MAP.Blocked)),
          healthScore: getNum(extractProperty(page, FIELD_MAP['Health Score'])),
        }
      };
    });
  } catch (error) {
    console.error('Failed to fetch snapshots from Notion:', error);
    return [];
  }
}

export async function fetchTeamDirectory() {
  if (!TEAM_DIR_DB_ID) return {};

  try {
    const response = await notionQuery(TEAM_DIR_DB_ID);

    const directory = {};
    response.results.forEach(page => {
      const name = extractProperty(page, 'Name');
      if (name) {
        directory[name] = {
          name,
          role: extractProperty(page, 'Role'),
          department: extractProperty(page, 'Department'),
          bio: extractProperty(page, 'Bio'),
          profileImage: extractProperty(page, 'Profile Image'),
          currentFocus: extractProperty(page, 'Current Focus'),
          keyStakeholders: extractProperty(page, 'Key Stakeholders'),
          relation: extractProperty(page, 'Relation'),
          notionUrl: page.url,
        };
      }
    });
    return directory;
  } catch (error) {
    console.error('Failed to fetch team directory from Notion:', error);
    return {};
  }
}

export async function getSnapshotSchema() {
  if (!SNAPSHOT_DB_ID) return { error: "NO_DB_ID" };
  try {
    let ds = await notion.databases.retrieve({ database_id: SNAPSHOT_DB_ID });

    // Handle linked databases (views) which don't have properties directly
    if (!ds.properties && ds.data_sources && ds.data_sources[0]) {
      console.log('Found linked database, fetching source:', ds.data_sources[0].id);
      ds = await notion.databases.retrieve({ database_id: ds.data_sources[0].id });
    }

    return ds;
  } catch (e) {
    console.error('Schema fetch error:', e);
    return { error: e.message };
  }
}

export { FIELD_MAP };
