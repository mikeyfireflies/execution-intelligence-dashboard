import { Client } from '@notionhq/client';

const notion = new Client({ auth: process.env.NOTION_TOKEN });
const DATA_SOURCE_ID = process.env.NOTION_DATABASE_ID;

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
};

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

export async function getDatabaseSchema() {
  const ds = await notion.dataSources.retrieve({ data_source_id: DATA_SOURCE_ID });
  return Object.entries(ds.properties).map(([name, prop]) => ({
    name,
    type: prop.type,
  }));
}

export { FIELD_MAP };
