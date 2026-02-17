import { transports } from "@/lib/mcp-state";

export async function POST(req) {
    const { searchParams } = new URL(req.url);
    const sessionId = searchParams.get("sessionId");

    if (!sessionId) {
        return new Response("Missing sessionId", { status: 400 });
    }

    console.log(`MCP POST attempt for session: ${sessionId}. Available sessions: ${Array.from(transports.keys()).join(', ')}`);
    const transport = transports.get(sessionId);
    if (!transport) {
        return new Response("Session not found", { status: 404 });
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
