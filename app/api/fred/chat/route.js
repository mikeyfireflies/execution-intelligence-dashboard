import { GoogleGenerativeAI } from "@google/generative-ai";
import { getDashboardData } from "@/lib/notion";

// Tool declarations for Gemini
const tools = [
    {
        functionDeclarations: [
            {
                name: "get_dashboard_summary",
                description: "Get high-level company execution metrics (Health Score, Overdue, Blocked, etc.)",
            },
            {
                name: "get_team_performance",
                description: "Get performance metrics for all individuals including risk levels and task counts",
            },
            {
                name: "get_squad_health",
                description: "Get health scores and task status for each squad",
            },
            {
                name: "search_goals",
                description: "Search for specific goals in the execution database",
                parameters: {
                    type: "OBJECT",
                    properties: {
                        query: { type: "STRING", description: "Search term for goal title or owner" },
                    },
                    required: ["query"],
                },
            },
        ],
    },
];

export async function POST(req) {
    try {
        const { messages } = await req.json();
        const apiKey = process.env.GOOGLE_API_KEY;

        if (!apiKey) {
            return Response.json({ content: "I'm ready to help, but I need a 'GOOGLE_API_KEY' in the environment to start talking! Please add it to your .env.local file." }, { status: 200 });
        }

        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({
            model: "gemini-1.5-flash",
            tools: tools,
            systemInstruction: `You are Fred, the official Fireflies.AI Execution Intelligence Assistant.
You are embedded directly within the Execution Dashboard.

Key Knowledge:
- The dashboard is deployed at: https://execution-intelligence-dashboard.vercel.app/
- The MCP (Model Context Protocol) endpoint is: https://execution-intelligence-dashboard.vercel.app/api/mcp
- You HAVE direct tools to fetch dashboard metrics and search Notion database.
- If users ask about connecting you as an MCP server, you should confirm that the endpoint is /api/mcp and it supports SSE.
- Be concise, executive, and highly helpful. Do not ask generic questions about the implementation if the information is already in your knowledge.`
        });

        const chat = model.startChat({
            history: messages.slice(0, -1).map(m => ({
                role: m.role === 'assistant' ? 'model' : 'user',
                parts: [{ text: m.content }],
            })),
        });

        const userMessage = messages[messages.length - 1].content;
        let result = await chat.sendMessage(userMessage);
        let response = result.response;

        // Handle tool calls iteratively
        while (response.candidates[0].content.parts.some(part => part.functionCall)) {
            const toolCalls = response.candidates[0].content.parts.filter(part => part.functionCall);
            const toolResults = [];

            for (const call of toolCalls) {
                const { name, args } = call.functionCall;
                console.log(`Chatbot Tool Call: ${name}`, args);

                let toolData;
                const dashboard = await getDashboardData();

                switch (name) {
                    case "get_dashboard_summary":
                        toolData = dashboard.company;
                        break;
                    case "get_team_performance":
                        toolData = dashboard.individual;
                        break;
                    case "get_squad_health":
                        toolData = dashboard.squads;
                        break;
                    case "search_goals":
                        const { query } = args;
                        toolData = (dashboard.goals || []).filter(g =>
                            g.goalTitle?.toLowerCase().includes(query?.toLowerCase()) ||
                            g.owner?.toLowerCase().includes(query?.toLowerCase())
                        ).slice(0, 5);
                        break;
                    default:
                        toolData = { error: "Unknown tool" };
                }

                toolResults.push({
                    functionResponse: {
                        name,
                        response: { content: toolData },
                    },
                });
            }

            result = await chat.sendMessage(toolResults);
            response = result.response;
        }

        return Response.json({ content: response.text() });
    } catch (error) {
        console.error("Fred Chat Error:", error);
        return Response.json({ error: "Failed to process chat: " + error.message }, { status: 500 });
    }
}
