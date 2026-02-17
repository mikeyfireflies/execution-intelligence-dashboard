import { NextJSSETransport } from "@/lib/mcp-transport";
import { createMCPServer } from "@/lib/mcp";
import { transports } from "@/lib/mcp-state";

export const dynamic = "force-dynamic";

export async function GET(req) {
    try {
        const stream = new ReadableStream({
            async start(controller) {
                try {
                    // Point the internal message handling back to this same route
                    const transport = new NextJSSETransport("/api/mcp", controller);
                    const server = createMCPServer();

                    await server.connect(transport);
                    await transport.start();

                    transports.set(transport.sessionId, transport);
                    console.log(`MCP Session started: ${transport.sessionId}`);

                    transport.onclose = () => {
                        transports.delete(transport.sessionId);
                        console.log(`MCP Session closed: ${transport.sessionId}`);
                    };
                } catch (streamError) {
                    console.error("MCP Stream Start Error:", streamError);
                    controller.error(streamError);
                }
            }
        });

        return new Response(stream, {
            headers: {
                "Content-Type": "text/event-stream",
                "Cache-Control": "no-cache",
                "Connection": "keep-alive",
            },
        });
    } catch (error) {
        console.error("MCP SSE Route Error:", error);
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { "Content-Type": "application/json" }
        });
    }
}

export async function POST(req) {
    const { searchParams } = new URL(req.url);
    const sessionId = searchParams.get("sessionId");

    if (!sessionId) {
        return new Response("Missing sessionId", { status: 400 });
    }

    const transport = transports.get(sessionId);
    if (!transport) {
        // Fallback: If session not found, it might be a different Lambda instance.
        // For stateless requests like tools/list, we can attempt a one-off response.
        try {
            const message = await req.json();
            if (message.method === 'tools/list') {
                const server = createMCPServer();
                const result = await server.listTools();
                return new Response(JSON.stringify({
                    jsonrpc: "2.0",
                    id: message.id,
                    result: result
                }), { status: 200, headers: { "Content-Type": "application/json" } });
            }
        } catch (e) { }

        return new Response("Session not found on this instance. Please reconnect the connector.", { status: 404 });
    }

    try {
        const message = await req.json();
        await transport.handleMessage(message);
        return new Response("OK", { status: 200 });
    } catch (error) {
        console.error(`MCP Message Error [${sessionId}]:`, error);
        return new Response(error.message, { status: 500 });
    }
}
