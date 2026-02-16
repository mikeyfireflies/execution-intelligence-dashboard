const { Client } = require('@notionhq/client');

const notion = new Client({ auth: process.env.NOTION_TOKEN });

const IDS = [
    '3095fac5-f3d6-80d0-9e8d-000bacad2604', // User's Data Source ID
    '3095fac5f3d680e0b02bf3e9bf8ca44f'    // ID from URL path
];

async function testIds() {
    for (const id of IDS) {
        console.log(`\n=== Testing ID: ${id} ===`);

        try {
            console.log('--- databases.retrieve ---');
            const db = await notion.databases.retrieve({ database_id: id });
            console.log('Success! Object type:', db.object);
            console.log('Properties:', Object.keys(db.properties).join(', '));
        } catch (e) {
            console.log('databases.retrieve failed:', e.message);
        }

        try {
            console.log('--- dataSources.query ---');
            if (notion.dataSources && notion.dataSources.query) {
                const ds = await notion.dataSources.query({ data_source_id: id, page_size: 1 });
                console.log('Success! Results:', ds.results.length);
            } else {
                console.log('dataSources.query not available in this SDK version');
            }
        } catch (e) {
            console.log('dataSources.query failed:', e.message);
        }

        try {
            console.log('--- pages.create (Test Ping) ---');
            const response = await notion.pages.create({
                parent: { database_id: id },
                properties: {
                    'Name': { title: [{ text: { content: 'Connectivity Test' } }] }
                }
            });
            console.log('Success! Page created:', response.id);
        } catch (e) {
            console.log('pages.create failed:', e.message);
        }
    }
}

testIds();
