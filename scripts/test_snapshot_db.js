const { Client } = require('@notionhq/client');
require('dotenv').config({ path: '.env.local' });

const notion = new Client({ auth: process.env.NOTION_TOKEN });
const SNAPSHOT_DB_ID = '3095fac5-f3d6-80d0-9e8d-000bacad2604';

async function test() {
    console.log('Testing Snapshot DB:', SNAPSHOT_DB_ID);

    try {
        console.log('--- Attempting Retrieve ---');
        const db = await notion.databases.retrieve({ database_id: SNAPSHOT_DB_ID });
        console.log('Retrieve Success. Properties:', Object.keys(db.properties));
    } catch (e) {
        console.error('Retrieve Failed:', e.message);
    }

    try {
        console.log('\n--- Attempting Query (no sort/filter) ---');
        const response = await (notion.dataSources?.query ? notion.dataSources.query({ data_source_id: SNAPSHOT_DB_ID }) : notion.databases.query({ database_id: SNAPSHOT_DB_ID }));
        console.log('Query Success. Results:', response.results.length);
        if (response.results.length > 0) {
            console.log('First result properties:', Object.keys(response.results[0].properties));
        }
    } catch (e) {
        console.error('Query Failed:', e.message);
    }

    try {
        console.log('\n--- Attempting Create Page ---');
        const response = await notion.pages.create({
            parent: { database_id: SNAPSHOT_DB_ID },
            properties: {
                'Name': { title: [{ text: { content: 'Test Ping' } }] }
            }
        });
        console.log('Create Success:', response.id);
    } catch (e) {
        console.error('Create Failed:', e.message);
    }
}

test();
