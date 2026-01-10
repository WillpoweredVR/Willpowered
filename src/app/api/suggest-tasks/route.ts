import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/lib/supabase/server";

interface Metric {
  id: string;
  name: string;
  target: number;
  direction: "higher" | "lower";
  unit: string;
  current?: number;
  isOnTrack?: boolean;
}

interface Category {
  id: string;
  name: string;
  metrics: Metric[];
}

interface Task {
  id: string;
  title: string;
  metricId?: string;
  status: "in_progress" | "completed";
}

interface SuggestedTask {
  title: string;
  description?: string;
  metricId?: string;
  metricName?: string;
  dueDate?: string;
  recurrence?: "once" | "daily" | "weekly" | "monthly";
  reasoning: string;
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Parse request body for optional metricId filter
    let focusMetricId: string | null = null;
    try {
      const body = await request.json();
      focusMetricId = body.metricId || null;
    } catch {
      // No body or invalid JSON - that's fine, we'll suggest for all metrics
    }

    // Get user profile with scorecard and existing tasks
    const { data: profile, error } = await supabase
      .from("profiles")
      .select("scorecard, tasks, purpose_statement, principles")
      .eq("id", user.id)
      .single();

    if (error || !profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    const scorecard = profile.scorecard as { categories: Category[]; data: { history: Record<string, Record<string, number>> } } | null;
    const existingTasks = (profile.tasks as Task[] | null) || [];
    const purpose = profile.purpose_statement || "";
    const principles = profile.principles || [];

    if (!scorecard || !scorecard.categories) {
      return NextResponse.json({ suggestions: [] });
    }

    // Calculate current values and off-track metrics
    const today = new Date().toISOString().split('T')[0];
    const metricsWithStatus: Metric[] = [];
    const offTrackMetrics: Metric[] = [];
    let focusMetric: Metric | null = null;
    let focusCategoryName: string | null = null;

    for (const category of scorecard.categories) {
      for (const metric of category.metrics) {
        const history = scorecard.data?.history?.[metric.id] || {};
        
        // Calculate week average
        const weekValues: number[] = [];
        for (let i = 0; i < 7; i++) {
          const d = new Date();
          d.setDate(d.getDate() - i);
          const dateStr = d.toISOString().split('T')[0];
          if (history[dateStr] !== undefined) {
            weekValues.push(history[dateStr]);
          }
        }
        const current = weekValues.length > 0 
          ? weekValues.reduce((a, b) => a + b, 0) / weekValues.length 
          : 0;
        
        const isOnTrack = metric.direction === "higher" 
          ? current >= metric.target 
          : current <= metric.target;

        const metricWithStatus = { ...metric, current, isOnTrack };
        metricsWithStatus.push(metricWithStatus);
        
        if (!isOnTrack) {
          offTrackMetrics.push(metricWithStatus);
        }

        // Track the focus metric if specified
        if (focusMetricId && metric.id === focusMetricId) {
          focusMetric = metricWithStatus;
          focusCategoryName = category.name;
        }
      }
    }

    // Get metrics that don't have active tasks
    const metricsWithTasks = new Set(
      existingTasks
        .filter(t => t.status !== "completed" && t.metricId)
        .map(t => t.metricId)
    );
    const metricsWithoutTasks = metricsWithStatus.filter(m => !metricsWithTasks.has(m.id));

    // Build context for Claude
    const client = new Anthropic();
    
    // Get current date info for Claude
    const now = new Date();
    const currentDateStr = now.toISOString().split('T')[0];
    const tomorrowStr = new Date(now.getTime() + 86400000).toISOString().split('T')[0];
    const nextWeekStr = new Date(now.getTime() + 7 * 86400000).toISOString().split('T')[0];
    
    // Adjust prompt based on whether we're focusing on a specific metric
    const isFocused = focusMetric !== null;
    
    const systemPrompt = isFocused 
      ? `You are Willson, an AI coach. Generate 2-3 specific, actionable task suggestions to help the user improve their "${focusMetric!.name}" metric in the ${focusCategoryName} category.

TODAY'S DATE: ${currentDateStr}
TOMORROW: ${tomorrowStr}
NEXT WEEK: ${nextWeekStr}

FOCUS METRIC: ${focusMetric!.name}
- Current: ${focusMetric!.current?.toFixed(1) || 0}
- Target: ${focusMetric!.target} ${focusMetric!.unit}
- Direction: ${focusMetric!.direction === "higher" ? "Higher is better" : "Lower is better"}
- Status: ${focusMetric!.isOnTrack ? "On track ✓" : "Needs improvement"}

RULES:
- ALL suggestions must directly help improve the "${focusMetric!.name}" metric
- Tasks must be CONCRETE and ACTIONABLE (e.g., "Block 9-11am for deep work" not "Improve focus")
- Consider creative angles - what specific behaviors drive this metric?
- Include a brief reasoning for each suggestion
- Set due dates using the dates above (use tomorrow ${tomorrowStr} for urgent, or dates within the next week)
- IMPORTANT: All dates MUST be ${currentDateStr} or later. Never use past dates.
- All tasks MUST have metricId: "${focusMetricId}" and metricName: "${focusMetric!.name}"

Return a JSON array of task suggestions in this exact format:
{
  "suggestions": [
    {
      "title": "Specific actionable task",
      "description": "Optional brief details",
      "metricId": "${focusMetricId}",
      "metricName": "${focusMetric!.name}",
      "dueDate": "YYYY-MM-DD",
      "recurrence": "once|daily|weekly|monthly",
      "reasoning": "Brief explanation why this will help"
    }
  ]
}`
      : `You are Willson, an AI coach helping users achieve their goals. Generate 2-3 specific, actionable task suggestions based on their scorecard data.

TODAY'S DATE: ${currentDateStr}
TOMORROW: ${tomorrowStr}
NEXT WEEK: ${nextWeekStr}

RULES:
- Tasks must be CONCRETE and ACTIONABLE (e.g., "Block 9-11am for deep work" not "Improve focus")
- Prioritize off-track metrics
- Consider their purpose and principles
- Include a brief reasoning for each suggestion
- Set due dates using the dates above (use tomorrow ${tomorrowStr} for urgent, or dates within the next week)
- IMPORTANT: All dates MUST be ${currentDateStr} or later. Never use past dates.
- Suggest recurring tasks for habits that need consistency

Return a JSON array of task suggestions in this exact format:
{
  "suggestions": [
    {
      "title": "Specific actionable task",
      "description": "Optional brief details",
      "metricId": "metric-id",
      "metricName": "Metric Name",
      "dueDate": "YYYY-MM-DD",
      "recurrence": "once|daily|weekly|monthly",
      "reasoning": "Brief explanation why this will help"
    }
  ]
}`;

    const userMessage = isFocused 
      ? `Generate 2-3 task suggestions specifically for the "${focusMetric!.name}" metric.

USER'S PURPOSE: ${purpose || "Not set"}

RELEVANT PRINCIPLES: ${principles.map((p: { text: string }) => p.text).join(", ") || "None set"}

EXISTING TASKS FOR THIS METRIC:
${existingTasks.filter(t => t.status !== "completed" && t.metricId === focusMetricId).map(t => `- ${t.title}`).join("\n") || "No active tasks for this metric"}

Think about:
- What specific daily actions directly impact "${focusMetric!.name}"?
- What blockers or bad habits might be getting in the way?
- What time of day would be best for working on this?

Generate creative, specific suggestions that will move this metric ${focusMetric!.direction === "higher" ? "up" : "down"}.`
      : `Generate task suggestions for this user:

PURPOSE: ${purpose || "Not set"}

PRINCIPLES: ${principles.map((p: { text: string }) => p.text).join(", ") || "None set"}

OFF-TRACK METRICS (prioritize these):
${offTrackMetrics.map(m => `- ${m.name}: Current ${m.current?.toFixed(1)} vs Target ${m.target} (${m.direction === "higher" ? "need more" : "need less"})`).join("\n") || "All metrics on track!"}

METRICS WITHOUT ACTIVE TASKS:
${metricsWithoutTasks.map(m => `- ${m.name} (${m.id}): ${m.isOnTrack ? "On track" : "Off track"}`).join("\n") || "All metrics have tasks"}

EXISTING ACTIVE TASKS:
${existingTasks.filter(t => t.status !== "completed").map(t => `- ${t.title}`).join("\n") || "No active tasks"}

Generate 2-3 smart task suggestions that will help them improve. Focus on the most impactful actions.`;

    const response = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1024,
      messages: [
        { role: "user", content: userMessage }
      ],
      system: systemPrompt,
    });

    // Parse the response
    const content = response.content[0];
    if (content.type !== "text") {
      return NextResponse.json({ suggestions: [] });
    }

    // Extract JSON from response
    const jsonMatch = content.text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return NextResponse.json({ suggestions: [] });
    }

    const parsed = JSON.parse(jsonMatch[0]);
    const suggestions: SuggestedTask[] = parsed.suggestions || [];

    // Ensure all dates are in the future
    const todayDate = new Date().toISOString().split('T')[0];
    const defaultDueDate = new Date(Date.now() + 86400000).toISOString().split('T')[0]; // tomorrow
    
    const enrichedSuggestions = suggestions.map(s => {
      // If no due date or date is in the past, use tomorrow
      let dueDate = s.dueDate || defaultDueDate;
      if (dueDate < todayDate) {
        dueDate = defaultDueDate;
      }
      
      return {
        ...s,
        dueDate,
        recurrence: s.recurrence || "once",
      };
    });

    return NextResponse.json({ suggestions: enrichedSuggestions });
  } catch (error) {
    console.error("Error generating task suggestions:", error);
    return NextResponse.json({ error: "Failed to generate suggestions" }, { status: 500 });
  }
}
