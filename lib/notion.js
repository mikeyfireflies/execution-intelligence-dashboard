import { Client } from '@notionhq/client';

const notion = new Client({ auth: process.env.NOTION_TOKEN });
const DATA_SOURCE_ID = process.env.NOTION_DATABASE_ID;
const SNAPSHOT_DB_ID = process.env.NOTION_SNAPSHOT_DATABASE_ID;

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
  // Snapshot fields
  'Date': 'Date',
  'Completed': 'Completed',
  'Active': 'Active',
  'Overdue': 'Overdue',
  'Blocked': 'Blocked',
  'Health Score': 'Health Score',
};

export async function getDatabaseSchema() {
  const ds = await notion.databases.retrieve({ database_id: DATA_SOURCE_ID });
  return Object.entries(ds.properties).map(([name, prop]) => ({
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

export async function fetchAllGoals() {
  const results = [];
  let cursor = undefined;
  let hasMore = true;

  while (hasMore) {
    const response = await notion.dataSources.query({
      data_source_id: DATA_SOURCE_ID,
      start_cursor: cursor,
      page_size: 100,
    });

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
        'Date': { date: { start: snapshot.date } },
        'Completed': { number: snapshot.company.completed },
        'Active': { number: snapshot.company.active },
        'Overdue': { number: snapshot.company.overdue },
        'Blocked': { number: snapshot.company.blocked },
        'Health Score': { number: snapshot.company.healthScore }
      }
    });
    return response;
  } catch (error) {
    console.error('Failed to save snapshot to Notion:', error);
    return null;
  }
}

export async function getSnapshotsFromNotion(days = 90) {
  if (!SNAPSHOT_DB_ID) return [];

  try {
    const response = await notion.databases.query({
      database_id: SNAPSHOT_DB_ID,
      sorts: [
        {
          property: 'Date',
          direction: 'ascending',
        },
      ],
      filter: {
        property: 'Date',
        date: {
          on_or_after: new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
        }
      }
    });

    return response.results.map(page => ({
      date: extractProperty(page, 'Date'),
      company: {
        completed: extractProperty(page, 'Completed') || 0,
        active: extractProperty(page, 'Active') || 0,
        overdue: extractProperty(page, 'Overdue') || 0,
        blocked: extractProperty(page, 'Blocked') || 0,
        healthScore: extractProperty(page, 'Health Score') || 0,
      }
    }));
  } catch (error) {
    console.error('Failed to fetch snapshots from Notion:', error);
    return [];
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
