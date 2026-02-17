const http = require('http');

async function testMCP() {
    console.log("Starting MCP Test...");

    const sseReq = http.get('http://localhost:3000/api/mcp/sse', (res) => {
        console.log(`SSE connected with status: ${res.statusCode}`);

        res.on('data', (chunk) => {
            const text = chunk.toString();
            console.log('SSE Raw Chunk:', text);
            const lines = text.split('\n');
            for (const line of lines) {
                if (line.startsWith('data: ')) {
                    const data = JSON.parse(line.substring(6));
                    console.log('Received from SSE:', JSON.stringify(data, null, 2));

                    if (data.method === "endpoint/created") {
                        const sessionId = new URL(data.params.uri, 'http://localhost').searchParams.get('sessionId');
                        console.log(`Found Session ID: ${sessionId}`);
                        listTools(sessionId);
                    }
                }
            }
        });
    });

    sseReq.on('error', (e) => console.error(`SSE Error: ${e.message}`));
}

function listTools(sessionId) {
    console.log(`Sending tools/list for session ${sessionId}...`);
    const postData = JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "tools/list"
    });

    const postReq = http.request({
        hostname: 'localhost',
        port: 3000,
        path: `/api/mcp/messages?sessionId=${sessionId}`,
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': postData.length
        }
    }, (res) => {
        console.log(`POST Status: ${res.statusCode}`);
        res.on('data', (d) => process.stdout.write(d));
    });

    postReq.on('error', (e) => console.error(`POST Error: ${e.message}`));
    postReq.write(postData);
    postReq.end();
}

testMCP();
