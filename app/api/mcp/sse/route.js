import { NextJSSETransport } from "@/lib/mcp-transport";
import { createMCPServer } from "@/lib/mcp";
import { transports } from "@/lib/mcp-state";

export async function GET(req) {
    const stream = new ReadableStream({
        async start(controller) {
            const transport = new NextJSSETransport("/api/mcp/messages", controller);
            const server = createMCPServer();

            await server.connect(transport);
            await transport.start();

            transports.set(transport.sessionId, transport);
            console.log(`MCP Session started: ${transport.sessionId}`);

            transport.onclose = () => {
                transports.delete(transport.sessionId);
                console.log(`MCP Session closed: ${transport.sessionId}`);
            };
        },
        cancel() {
            // Handle stream cancellation if needed
        }
    });

    return new Response(stream, {
        headers: {
            "Content-Type": "text/event-stream",
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
        },
    });
}

// Export the transports map so messages route can find it
export { transports };
