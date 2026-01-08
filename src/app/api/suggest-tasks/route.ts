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

    for (const category of scorecard.categories) {
      for (const metric of category.metrics) {
        const history = scorecard.data?.history?.[metric.id] || {};
        const todayValue = history[today] || 0;
        
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
    
    const systemPrompt = `You are Willson, an AI coach helping users achieve their goals. Generate 2-3 specific, actionable task suggestions based on their scorecard data.

RULES:
- Tasks must be CONCRETE and ACTIONABLE (e.g., "Block 9-11am for deep work" not "Improve focus")
- Prioritize off-track metrics
- Consider their purpose and principles
- Include a brief reasoning for each suggestion
- Set appropriate due dates (today or tomorrow for urgent, this week for others)
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

    const userMessage = `Generate task suggestions for this user:

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

    // Add today's date as default if no due date
    const todayDate = new Date().toISOString().split('T')[0];
    const tomorrowDate = new Date(Date.now() + 86400000).toISOString().split('T')[0];
    
    const enrichedSuggestions = suggestions.map(s => ({
      ...s,
      dueDate: s.dueDate || tomorrowDate,
      recurrence: s.recurrence || "once",
    }));

    return NextResponse.json({ suggestions: enrichedSuggestions });
  } catch (error) {
    console.error("Error generating task suggestions:", error);
    return NextResponse.json({ error: "Failed to generate suggestions" }, { status: 500 });
  }
}
