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

    const systemPrompt = `You are Willson, an insightful AI coach. Your task is to analyze how the user's principles reflection connects to their daily scorecard metrics.

FORMATTING RULES (CRITICAL):
- Use **bold** for section headers
- Each bold header MUST have a blank line (paragraph break) before it
- Keep sections concise but meaningful
- Use clear, direct language
- Focus on actionable insights

Your analysis should:
1. Identify connections between principles tested and relevant metrics
2. Highlight patterns (positive or concerning)
3. Suggest ONE specific, actionable adjustment
4. Keep the total response under 200 words

Be warm but direct. Focus on the most impactful insight.`;

    const testedPrinciples = principles.filter(p => p.wasTested);
    const offTrackMetrics = metrics.filter(m => !m.isOnTrack);
    const onTrackMetrics = metrics.filter(m => m.isOnTrack);

    const userMessage = `Analyze how this user's weekly principle reflections connect to their daily metrics:

PRINCIPLES REFLECTION THIS WEEK:
${testedPrinciples.length > 0 
  ? testedPrinciples.map(p => 
      `- "${p.text}": ${p.response === 'held' ? '💪 Held strong' : p.response === 'struggled' ? '😓 Struggled but held' : '💔 Broke it'}${p.situation ? ` (Situation: ${p.situation})` : ''}${p.learning ? ` (Learning: ${p.learning})` : ''}`
    ).join('\n')
  : 'No principles were tested this week.'
}

NOT TESTED THIS WEEK:
${principles.filter(p => !p.wasTested).map(p => `- "${p.text}"`).join('\n') || 'All principles were tested.'}

METRICS NEEDING ATTENTION (off-track):
${offTrackMetrics.length > 0
  ? offTrackMetrics.map(m => 
      `- ${m.name} (${m.category}): ${m.current}/${m.target} ${m.direction === 'higher' ? '↑ need more' : '↓ need less'}`
    ).join('\n')
  : 'All metrics are on track! 🎉'
}

METRICS ON TRACK:
${onTrackMetrics.length > 0
  ? onTrackMetrics.map(m => 
      `- ${m.name} (${m.category}): ${m.current}/${m.target} ✓`
    ).join('\n')
  : 'No metrics on track yet.'
}

Provide a brief, insightful analysis connecting the principle reflections to the metric patterns. What does this week tell them about living their principles in daily action?`;

    const response = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 512,
      messages: [{ role: "user", content: userMessage }],
      system: systemPrompt,
    });

    const content = response.content[0];
    if (content.type !== "text") {
      return NextResponse.json({ analysis: "Unable to generate analysis." });
    }

    return NextResponse.json({ analysis: content.text });
  } catch (error) {
    console.error("Error generating principles analysis:", error);
    return NextResponse.json(
      { error: "Failed to generate analysis" },
      { status: 500 }
    );
  }
}
