const { Client } = require('@notionhq/client');

const NOTION_TOKEN = process.env.NOTION_TOKEN;

if (!NOTION_TOKEN) {
    console.error("Please set NOTION_TOKEN env var");
    process.exit(1);
}

const notion = new Client({ auth: NOTION_TOKEN });

async function searchDataSources() {
    try {
        console.log("Searching for accessible data sources...");
        const response = await notion.search({
            filter: {
                value: 'data_source', // Correct value based on validation error
                property: 'object'
            }
        });

        console.log(`Found ${response.results.length} results:`);
        response.results.forEach(item => {
            const title = item.title?.[0]?.plain_text || "Untitled";
            console.log(`- ${title} (ID: ${item.id}, Type: ${item.object})`);
            if (title.includes("Team Directory") || item.object === 'data_source') {
                console.log("  --- Properties ---");
                if (item.properties) {
                    Object.keys(item.properties).sort().forEach(prop => {
                        console.log(`  - ["${prop}"] (${item.properties[prop].type})`);
                    });
                } else {
                    console.log("  (No properties direct on search result)");
                }
            }
        });
    } catch (error) {
        console.error("Error searching data sources:", error.message);
        console.log("Retrying without filter...");
        try {
            const response = await notion.search({});
            console.log(`Found ${response.results.length} total objects:`);
            response.results.forEach(item => {
                const title = item.title?.[0]?.plain_text || "Untitled";
                console.log(`- ${title} (ID: ${item.id}, Type: ${item.object})`);
            });
        } catch (e2) {
            console.error("Total search failed:", e2.message);
        }
    }
}

searchDataSources();
