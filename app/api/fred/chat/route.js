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
                description: "List all team members with their names, roles, risk levels, active/overdue/blocked task counts, and velocity sparklines",
            },
            {
                name: "list_team_members",
                description: "Get the full Team Directory roster with names, roles, departments, bios, and profile links for every member",
            },
            {
                name: "get_squad_health",
                description: "Get health scores and task status for each squad",
            },
            {
                name: "search_goals",
                description: "Search for specific goals in the execution database by title or owner name",
                parameters: {
                    type: "OBJECT",
                    properties: {
                        query: { type: "STRING", description: "Search term for goal title or owner" },
                    },
                    required: ["query"],
                },
            },
            {
                name: "get_goals_by_status",
                description: "Filter goals by status (In Progress, Blocked, Done, Not Started, Overdue) and optionally by owner name. Use this when users ask about overdue, blocked, completed, or in-progress tasks.",
                parameters: {
                    type: "OBJECT",
                    properties: {
                        status: { type: "STRING", description: "Status to filter by: 'In Progress', 'Blocked', 'Done', 'Not Started', 'Overdue', or 'At Risk'" },
                        owner: { type: "STRING", description: "Optional owner name to further filter results" },
                    },
                    required: ["status"],
                },
            },
            {
                name: "get_execution_trends",
                description: "Get week-over-week trends for Health Score, Overdue items, and Completion rates. Use this to answer 'Are we getting better or worse?'",
            },
            {
                name: "get_top_performers",
                description: "Rank team members by tasks completed and average velocity (effort points) in the last 30 days.",
            },
            {
                name: "get_stale_goals",
                description: "Identify goals that haven't been updated in more than 7 days. Use this to spot 'zombie' or forgotten tasks.",
                parameters: {
                    type: "OBJECT",
                    properties: {
                        days: { type: "NUMBER", description: "Threshold for days without updates (default: 7)" },
                    },
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

### 🛡️ Operational Safeguards (IMPORTANT)
1. **NEVER Hallucinate Metrics**: If a user asks for a specific number (Health Score, Overdue count, etc.), you **MUST** call the appropriate tool. Do not guess or use information from your training data or previous turns if a tool is available.
2. **Use Tool Values Exactly**: When a tool returns a value (e.g., \`healthScore: 56\`), use that exact number. Do not re-calculate it or round it differently.
3. **Link Everything**: Every person name and goal title mentioned should be linked using the provided rules.
4. **Be Professional & Technical**: You are an Execution Intelligence Assistant. Your tone is helpful, data-driven, and concise.

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
                        console.log("FRED DEBUG: get_dashboard_summary", {
                            healthScore: toolData.healthScore,
                            completed: toolData.completed,
                            totalPlanned: toolData.totalPlanned
                        });
                        break;
                    case "get_team_performance":
                        toolData = dashboard.individual;
                        break;
                    case "get_squad_health":
                        toolData = dashboard.squads;
                        break;
                    case "list_team_members":
                        toolData = dashboard.directory;
                        break;
                    case "search_goals": {
                        const { query } = args;
                        toolData = (dashboard.goals || []).filter(g =>
                            g.goalTitle?.toLowerCase().includes(query?.toLowerCase()) ||
                            g.owner?.toLowerCase().includes(query?.toLowerCase())
                        ).slice(0, 10);
                        break;
                    }
                    case "get_goals_by_status": {
                        const statusFilter = (args.status || '').toLowerCase();
                        const ownerFilter = (args.owner || '').toLowerCase();
                        let filtered = dashboard.goals || [];

                        // Filter by owner if provided
                        if (ownerFilter) {
                            filtered = filtered.filter(g =>
                                g.owner?.toLowerCase().includes(ownerFilter)
                            );
                        }

                        // Filter by status
                        if (statusFilter === 'overdue') {
                            const now = new Date();
                            filtered = filtered.filter(g =>
                                g.dueDate && new Date(g.dueDate) < now &&
                                !['done', 'complete', 'completed', 'shipped'].includes(g.status?.toLowerCase())
                            );
                        } else if (statusFilter === 'at risk') {
                            filtered = filtered.filter(g => {
                                const isOverdue = g.dueDate && new Date(g.dueDate) < new Date();
                                const isBlocked = ['blocked', 'on hold', 'waiting'].includes(g.status?.toLowerCase());
                                return (isOverdue || isBlocked) && !['done', 'complete', 'completed', 'shipped'].includes(g.status?.toLowerCase());
                            });
                        } else {
                            filtered = filtered.filter(g =>
                                g.status?.toLowerCase().includes(statusFilter)
                            );
                        }

                        toolData = filtered.slice(0, 15).map(g => ({
                            goalTitle: g.goalTitle,
                            owner: g.owner,
                            status: g.status,
                            priority: g.priority,
                            dueDate: g.dueDate,
                            sourceUrl: g.sourceUrl || g.notionUrl,
                        }));
                        break;
                    }
                    case "get_execution_trends":
                        toolData = {
                            trends: dashboard.trends,
                            recentSnapshots: (dashboard.snapshots || []).slice(-5).map(s => ({
                                date: s.date,
                                healthScore: s.company.healthScore,
                                completed: s.company.completed,
                                overdue: s.company.overdue,
                                blocked: s.company.blocked,
                            }))
                        };
                        break;
                    case "get_top_performers":
                        toolData = Object.values(dashboard.individual || {})
                            .map(o => ({
                                name: o.name,
                                role: o.role,
                                completedLast30: o.completed,
                                totalGoals: o.totalGoals,
                                riskLevel: o.riskLevel,
                                velocityScore: Math.round(o.velocity.reduce((sum, v) => sum + v.points, 0) / 4 * 10) / 10
                            }))
                            .sort((a, b) => b.completedLast30 - a.completedLast30)
                            .slice(0, 5);
                        break;
                    case "get_stale_goals": {
                        const threshold = args.days || 7;
                        toolData = (dashboard.goals || [])
                            .filter(g => {
                                if (['done', 'complete', 'completed', 'shipped'].includes(g.status?.toLowerCase())) return false;
                                const lastUpdated = new Date(g.lastUpdated || g.created_time || Date.now());
                                const diff = (Date.now() - lastUpdated.getTime()) / (1000 * 60 * 60 * 24);
                                return diff > threshold;
                            })
                            .sort((a, b) => {
                                const lastA = new Date(a.lastUpdated || a.created_time || 0);
                                const lastB = new Date(b.lastUpdated || b.created_time || 0);
                                return lastA - lastB; // Oldest first
                            })
                            .slice(0, 10)
                            .map(g => ({
                                goalTitle: g.goalTitle,
                                owner: g.owner,
                                lastUpdated: g.lastUpdated,
                                notionUrl: g.notionUrl,
                            }));
                        break;
                    }
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
