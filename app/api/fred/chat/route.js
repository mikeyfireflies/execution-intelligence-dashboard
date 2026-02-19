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
        const { messages, apiKey: clientApiKey, model: clientModel } = await req.json();
        const apiKey = clientApiKey || process.env.GOOGLE_API_KEY;
        // Whitelist valid models — auto-corrects stale localStorage values like gemini-1.5-flash
        const VALID_MODELS = ['gemini-2.0-flash', 'gemini-1.5-pro', 'gemini-2.0-flash-exp'];
        const modelId = VALID_MODELS.includes(clientModel) ? clientModel : 'gemini-2.0-flash';

        if (!apiKey) {
            return Response.json({ content: "I need an API key to work! Please add your Google Gemini API key in the Configuration tab (⚙️) or set GOOGLE_API_KEY in .env.local." }, { status: 200 });
        }

        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({
            model: modelId,
            tools: tools,
            systemInstruction: `You are Fred, the official Fireflies.AI Execution Intelligence Assistant.
You are embedded directly within the Execution Dashboard and have deep knowledge of how its metrics are calculated.

### 🧠 Dashboard Logic & Calculations (Your Source of Truth)
When users ask "How is this calculated?" or "Why is this red?", use these exact definitions:

#### 1. Company Health Score (0-100)
A weighted algorithm measuring overall execution quality.
- **Completion Rate (30%)**: Percentage of total planned items marked "Done".
- **Overdue Rate (25%)**: Inverse of overdue items (Lower overdue = Higher score).
- **Update Recency (20%)**: Percentage of active items updated in the last 7 days.
- **Blocked Rate (15%)**: Inverse of blocked items.
- **High Priority Lag (10%)**: Penalty for high-priority items sitting overdue.
*Scale: Red (<50), Amber (50-70), Green (>70).*

#### 2. Risk Levels (The "Traffic Light" System)
Every item and person gets a risk level based on these triggers:
- **Red (Critical)**: High Priority item that is Overdue.
- **Amber (Warning)**: Item is Blocked OR hasn't been updated in >7 days.
- **Caution**: Item is Overdue (but regular priority).
- **Green**: On track, active, and recently updated.

#### 3. Individual Velocity (Sparklines)
- Calculated based on **Effort Points** completed in the last 4 weeks.
- If Effort Points are missing, we count tasks as 1 point.
- Purpose: To show momentum. A flat line means "stuck" or "on leave", not necessarily "lazy".

#### 4. Squad "Ownership Clarity"
- The percentage of goals in a squad that have a specific **Owner** assigned vs "Unassigned".
- Low clarity (<80%) usually predicts future slippage.

### 🛠️ Your Tools & Capabilities
- **get_dashboard_summary**: For high-level company pulse (Health Score, etc).
- **get_team_performance**: For individual stats (Who is overloaded? Who is at risk?).
- **get_squad_health**: For team-level blockers and clarity.
- **search_goals**: To find specific tickets or context.

### 🔗 Linking & Formatting Rules (CRITICAL)
Always make your answer actionable with links:
1. **Goals/Tickets**: Format as \`[Goal Title](sourceUrl)\`.
   - Use \`sourceUrl\` if available (e.g., Jira/Notion link). Fallback to \`notionUrl\`.
2. **People**: Format as \`[Name](/people/slugified-name)\`.
   - Use simple slug format: "Greg D" -> \`/people/greg-d\`.
   - Always mention the **Role** if available (from Team Directory).
3. **Lists**: When listing a squad, show \`[Name](/people/slug) - Role\`.

### 🗣️ Communication Style
- **Executive Summary First**: Give the data point answer first, then explain the "Why".
- **Proactive**: If a score is low, suggest *why* (e.g., "Health is 45% because 12 High Priority items are overdue.").
- **Concise**: No fluff. You are talking to leadership.`
        });

        // Gemini requires the history to start with a 'user' turn.
        // Drop any leading assistant/model messages (e.g. Fred's greeting).
        const rawHistory = messages.slice(0, -1).map(m => ({
            role: m.role === 'assistant' ? 'model' : 'user',
            parts: [{ text: m.content }],
        }));
        const firstUserIdx = rawHistory.findIndex(m => m.role === 'user');
        const history = firstUserIdx >= 0 ? rawHistory.slice(firstUserIdx) : [];

        const chat = model.startChat({ history });

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
