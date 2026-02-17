import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { ListToolsRequestSchema, CallToolRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import { getDashboardData, fetchAllGoals } from "./notion";

export function createMCPServer() {
    const server = new Server(
        {
            name: "fireflies-execution-dashboard",
            version: "1.0.0",
        },
        {
            capabilities: {
                tools: {},
            },
        }
    );

    // Define tools
    server.setRequestHandler(ListToolsRequestSchema, async () => {
        return {
            tools: [
                {
                    name: "get_dashboard_summary",
                    description: "Get high-level company execution metrics (Health Score, Overdue, Blocked, etc.)",
                    inputSchema: { type: "object", properties: {} },
                },
                {
                    name: "get_team_performance",
                    description: "Get performance metrics for all individuals including risk levels and task counts",
                    inputSchema: { type: "object", properties: {} },
                },
                {
                    name: "get_squad_health",
                    description: "Get health scores and task status for each squad",
                    inputSchema: { type: "object", properties: {} },
                },
                {
                    name: "search_goals",
                    description: "Search for specific goals in the execution database",
                    inputSchema: {
                        type: "object",
                        properties: {
                            query: { type: "string", description: "Search term for goal title or owner" },
                        },
                    },
                },
            ],
        };
    });

    // Handle tool calls
    server.setRequestHandler(CallToolRequestSchema, async (request) => {
        const data = await getDashboardData();

        switch (request.params.name) {
            case "get_dashboard_summary":
                return {
                    content: [
                        {
                            type: "text",
                            text: JSON.stringify(data.company, null, 2),
                        },
                    ],
                };

            case "get_team_performance":
                return {
                    content: [
                        {
                            type: "text",
                            text: JSON.stringify(data.individual, null, 2),
                        },
                    ],
                };

            case "get_squad_health":
                return {
                    content: [
                        {
                            type: "text",
                            text: JSON.stringify(data.squads, null, 2),
                        },
                    ],
                };

            case "search_goals": {
                const { query } = request.params.arguments || {};
                const goals = data.goals || [];
                const filtered = goals.filter(g =>
                    (g.goalTitle?.toLowerCase().includes(query?.toLowerCase())) ||
                    (g.owner?.toLowerCase().includes(query?.toLowerCase()))
                ).slice(0, 10);

                return {
                    content: [
                        {
                            type: "text",
                            text: JSON.stringify(filtered, null, 2),
                        },
                    ],
                };
            }

            default:
                throw new Error(`Unknown tool: ${request.params.name}`);
        }
    });

    return server;
}
