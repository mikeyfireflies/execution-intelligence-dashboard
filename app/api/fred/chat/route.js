import { GoogleGenerativeAI } from "@google/generative-ai";

export async function POST(req) {
    try {
        const { messages, dashboardData } = await req.json();

        const apiKey = process.env.GOOGLE_API_KEY;
        if (!apiKey) {
            return Response.json({ content: "I'm ready to help, but I need a 'GOOGLE_API_KEY' in the environment to start talking! Please add it to your .env.local file." }, { status: 200 });
        }

        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        // Build a concise system prompt with dashboard context
        const dashboardContext = summarizeDashboard(dashboardData);
        const systemPrompt = `You are Fred, the Fireflies.AI Execution Intelligence Assistant. 
You live in the dashboard and help leadership understand performance data.
You have access to the following live dashboard context:
${JSON.stringify(dashboardContext, null, 2)}

Instructions:
- Be concise, professional, and slightly proactive.
- Use the provided context to answer questions about risks, velocity, and health.
- If data is missing for a specific question, stick to what you can see.
- Refer to team members by name if they appear in the data.`;

        // Combine system prompt with message history
        const prompt = `${systemPrompt}\n\nUser: ${messages[messages.length - 1].content}`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        return Response.json({ content: text });
    } catch (error) {
        console.error("Fred Chat Error:", error);
        return Response.json({ error: "Failed to process chat" }, { status: 500 });
    }
}

function summarizeDashboard(data) {
    if (!data) return "No data currently available.";

    // Simplify the massive data object for the LLM context window
    const summary = {
        view: data.view || "Current View",
        summaryMetrics: {}
    };

    if (data.company) {
        summary.summaryMetrics = {
            healthScore: data.company.healthScore,
            totalPlanned: data.company.totalPlanned,
            overdue: data.company.overdue,
            blocked: data.company.blocked,
            slippageRate: data.company.slippageRate
        };
    }

    if (data.individual) {
        summary.individualPerformance = Object.entries(data.individual).map(([name, profile]) => ({
            name,
            active: profile.active,
            overdue: profile.overdue,
            blocked: profile.blocked,
            risk: profile.riskLevel,
            squad: profile.squad
        })).slice(0, 15); // Limit to top 15 to save tokens
    }

    if (data.squads) {
        summary.squadHealth = Object.entries(data.squads).map(([name, squad]) => ({
            name,
            health: squad.healthScore,
            overdue: squad.overdue,
            blocked: squad.blocked
        }));
    }

    return summary;
}
