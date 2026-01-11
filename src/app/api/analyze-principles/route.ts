import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/lib/supabase/server";

interface PrincipleEntry {
  text: string;
  wasTested: boolean;
  response?: "held" | "struggled" | "broke";
  situation?: string;
  learning?: string;
}

interface MetricData {
  name: string;
  category: string;
  target: number;
  current: string;
  direction: "higher" | "lower";
  isOnTrack: boolean;
}

export interface PrinciplesAnalysis {
  connection: string; // How principles connect to metrics
  pattern: string; // A pattern observed (positive or concerning)
  actionItem: string; // One specific actionable suggestion
  encouragement: string; // Motivational closing thought
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { principles, metrics } = await request.json() as {
      principles: PrincipleEntry[];
      metrics: MetricData[];
    };

    if (!principles || !metrics) {
      return NextResponse.json(
        { error: "Missing principles or metrics data" },
        { status: 400 }
      );
    }

    const client = new Anthropic();

    const systemPrompt = `You are Willson, an insightful AI coach. Analyze how the user's principles reflection connects to their scorecard metrics.

Return a JSON object with exactly these 4 fields:
{
  "connection": "One sentence connecting a tested principle to a relevant metric",
  "pattern": "One sentence about a positive pattern OR concerning pattern you notice",
  "actionItem": "One specific, actionable task for next week (e.g., 'Block 30 minutes each morning for...')",
  "encouragement": "One warm, motivating sentence to close"
}

RULES:
- Each field should be 1-2 sentences max
- Be specific - reference actual principles and metrics by name
- Be warm but direct
- Focus on the most impactful insight
- Return ONLY valid JSON, no markdown or extra text`;

    const testedPrinciples = principles.filter(p => p.wasTested);
    const offTrackMetrics = metrics.filter(m => !m.isOnTrack);
    const onTrackMetrics = metrics.filter(m => m.isOnTrack);

    const userMessage = `Analyze this user's weekly data:

PRINCIPLES TESTED THIS WEEK:
${testedPrinciples.length > 0 
  ? testedPrinciples.map(p => 
      `- "${p.text}": ${p.response === 'held' ? 'Held strong' : p.response === 'struggled' ? 'Struggled but held' : 'Broke it'}${p.situation ? ` | Context: ${p.situation}` : ''}${p.learning ? ` | Learning: ${p.learning}` : ''}`
    ).join('\n')
  : 'No principles were tested this week.'
}

PRINCIPLES NOT TESTED:
${principles.filter(p => !p.wasTested).map(p => `- "${p.text}"`).join('\n') || 'All were tested.'}

METRICS OFF-TRACK:
${offTrackMetrics.length > 0
  ? offTrackMetrics.map(m => 
      `- ${m.name}: ${m.current}/${m.target} (${m.direction === 'higher' ? 'need more' : 'need less'})`
    ).join('\n')
  : 'All on track!'
}

METRICS ON-TRACK:
${onTrackMetrics.length > 0
  ? onTrackMetrics.map(m => `- ${m.name}: ${m.current}/${m.target}`).join('\n')
  : 'None yet.'
}

Return the JSON analysis object.`;

    const response = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 512,
      messages: [{ role: "user", content: userMessage }],
      system: systemPrompt,
    });

    const content = response.content[0];
    if (content.type !== "text") {
      return NextResponse.json({ 
        analysis: getDefaultAnalysis() 
      });
    }

    // Parse JSON from response
    try {
      const jsonMatch = content.text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]) as PrinciplesAnalysis;
        return NextResponse.json({ analysis: parsed });
      }
    } catch {
      console.error("Failed to parse analysis JSON, using text fallback");
    }

    // Fallback: return as legacy text format
    return NextResponse.json({ 
      analysis: content.text,
      isLegacy: true 
    });
  } catch (error) {
    console.error("Error generating principles analysis:", error);
    return NextResponse.json({ 
      analysis: getDefaultAnalysis() 
    });
  }
}

function getDefaultAnalysis(): PrinciplesAnalysis {
  return {
    connection: "Your principles and metrics work together to build the life you want.",
    pattern: "Keep tracking both to see patterns emerge over time.",
    actionItem: "Pick one metric that connects to a principle you want to strengthen and focus on it this week.",
    encouragement: "Small, consistent actions compound into remarkable results."
  };
}
