import { NextRequest } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/lib/supabase/server";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || "",
});

interface MetricSummary {
  name: string;
  todayValue: number;
  weekAverage: number;
  target: number;
  direction: 'higher' | 'lower';
  isOnTrack: boolean;
  aggregation: 'average' | 'sum' | 'count';
  category: string;
}

interface CheckinData {
  metrics: MetricSummary[];
  onTrackCount: number;
  totalCount: number;
  dayOfWeek: string;
  userName?: string;
  purpose?: string;
}

// Hero quotes for variable reward
const HERO_QUOTES = [
  { hero: "Kobe Bryant", quote: "The moment you give up is the moment you let someone else win.", context: "pushing through" },
  { hero: "J.K. Rowling", quote: "It is impossible to live without failing at something, unless you live so cautiously that you might as well not have lived at all.", context: "handling setbacks" },
  { hero: "Warren Buffett", quote: "Someone's sitting in the shade today because someone planted a tree a long time ago.", context: "consistency" },
  { hero: "Arnold Schwarzenegger", quote: "The mind is the limit. As long as the mind can envision that you can do something, you can do it.", context: "overcoming limits" },
  { hero: "Steve Jobs", quote: "The people who are crazy enough to think they can change the world are the ones who do.", context: "believing in yourself" },
  { hero: "Michael Jordan", quote: "I've failed over and over again in my life. And that is why I succeed.", context: "learning from failure" },
];

// Achievements that can be unlocked (variable reward)
const POSSIBLE_ACHIEVEMENTS = [
  { id: "perfect_day", name: "Perfect Day", emoji: "🏆", condition: (data: CheckinData) => data.onTrackCount === data.totalCount && data.totalCount > 0 },
  { id: "strong_start", name: "Strong Start", emoji: "🌅", condition: (data: CheckinData) => data.dayOfWeek === "Monday" && data.onTrackCount >= data.totalCount * 0.7 },
  { id: "midweek_momentum", name: "Midweek Momentum", emoji: "⚡", condition: (data: CheckinData) => data.dayOfWeek === "Wednesday" && data.onTrackCount >= data.totalCount * 0.6 },
  { id: "friday_finish", name: "Friday Finish", emoji: "🎉", condition: (data: CheckinData) => data.dayOfWeek === "Friday" && data.onTrackCount >= data.totalCount * 0.7 },
  { id: "weekend_warrior", name: "Weekend Warrior", emoji: "💪", condition: (data: CheckinData) => (data.dayOfWeek === "Saturday" || data.dayOfWeek === "Sunday") && data.onTrackCount >= data.totalCount * 0.5 },
  { id: "consistency_king", name: "Consistency King", emoji: "👑", condition: (data: CheckinData) => data.metrics.filter(m => m.weekAverage > 0).length >= data.totalCount * 0.8 },
];

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { metrics, onTrackCount, totalCount } = body as CheckinData;

    // Get user context
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    let userName = "friend";
    let purpose = "";
    
    if (user) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name, purpose_statement")
        .eq("id", user.id)
        .single();
      
      if (profile?.full_name) {
        userName = profile.full_name.split(" ")[0];
      }
      if (profile?.purpose_statement) {
        purpose = profile.purpose_statement;
      }
    }

    const dayOfWeek = new Date().toLocaleDateString("en-US", { weekday: "long" });
    const percentage = totalCount > 0 ? Math.round((onTrackCount / totalCount) * 100) : 0;

    // Check for achievements (variable reward!)
    const checkinData: CheckinData = { metrics, onTrackCount, totalCount, dayOfWeek, userName, purpose };
    const unlockedAchievements = POSSIBLE_ACHIEVEMENTS.filter(a => a.condition(checkinData));
    
    // Pick a random hero quote (variable reward!)
    const randomQuote = HERO_QUOTES[Math.floor(Math.random() * HERO_QUOTES.length)];

    // Build context for Willson
    const winsToday = metrics.filter(m => m.isOnTrack);
    const needsWork = metrics.filter(m => !m.isOnTrack && m.todayValue !== null);
    const notLogged = metrics.filter(m => m.todayValue === null);

    const metricsContext = `
TODAY'S CHECK-IN DATA:
- ${onTrackCount}/${totalCount} metrics on track (${percentage}%)
- Day: ${dayOfWeek}

WINS TODAY:
${winsToday.length > 0 ? winsToday.map(m => `- ${m.name}: ${m.todayValue} (target: ${m.direction === 'lower' ? '≤' : '≥'}${m.target})`).join('\n') : '- None yet'}

NEEDS ATTENTION:
${needsWork.length > 0 ? needsWork.map(m => `- ${m.name}: ${m.todayValue} (target: ${m.direction === 'lower' ? '≤' : '≥'}${m.target})`).join('\n') : '- All good!'}

WEEK TRENDS:
${metrics.filter(m => m.weekAverage > 0).map(m => `- ${m.name}: ${m.weekAverage} avg this week`).join('\n') || '- First day of tracking!'}
`;

    // Generate personalized commentary
    const systemPrompt = `You are Willson, the Willpowered AI Coach. You just received ${userName}'s daily check-in data.

Your job is to give honest, helpful feedback - not cheerleading.

${purpose ? `Their purpose: "${purpose}"` : ''}

TONE GUIDELINES:
- Be direct and honest, like a good coach - not sycophantic
- Acknowledge wins briefly, then move on
- Be straightforward about what's off track - don't sugarcoat
- Give SPECIFIC, ACTIONABLE advice they can use tomorrow
- No "crushing it!" or excessive praise - be real

CONTENT GUIDELINES:
- dayHighlight: State the actual win factually. "Sleep at 79 hit your target" not "You absolutely crushed your sleep!"
- weekInsight: Point out a PATTERN - what's working OR what's consistently off
- encouragement: Connect their progress (or struggle) to their PURPOSE. One sentence max.
- tomorrowTip: Give ONE specific action. Be prescriptive. "Do X before Y" not "Focus on improving X"

EXAMPLES OF GOOD vs BAD:

❌ BAD dayHighlight: "Colin, you absolutely crushed it with your meditation today!"
✅ GOOD dayHighlight: "Meditation at 5/5 - that's your best day this week."

❌ BAD encouragement: "You're doing amazing! The fact that you're tracking shows incredible commitment!"  
✅ GOOD encouragement: "German at 0/5 all week - that's the gap between intention and action. Worth asking why."

❌ BAD tomorrowTip: "Focus on improving your German practice tomorrow!"
✅ GOOD tomorrowTip: "Set a phone alarm for 8am labeled 'German - 5 phrases before email'."

Your response MUST be in this exact JSON format:
{
  "dayHighlight": "One factual sentence about today's best metric",
  "weekInsight": "One sentence about a pattern you see in the week data",
  "encouragement": "One honest sentence connecting data to their purpose or pointing out a real issue",
  "tomorrowTip": "One specific, prescriptive action for tomorrow"
}`;

    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 400,
      system: systemPrompt,
      messages: [
        { role: "user", content: metricsContext }
      ],
    });

    // Extract text response
    const textContent = response.content.find((block) => block.type === "text");
    let commentary = {
      dayHighlight: "Great job completing your check-in today!",
      weekInsight: "Keep tracking to see your patterns emerge.",
      encouragement: "Every day you show up and track is a win.",
      tomorrowTip: "Focus on the metrics that matter most to your goals."
    };

    if (textContent?.type === "text") {
      try {
        // Try to parse the JSON from the response
        const jsonMatch = textContent.text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          commentary = JSON.parse(jsonMatch[0]);
        }
      } catch (e) {
        console.error("Failed to parse commentary JSON:", e);
      }
    }

    return new Response(JSON.stringify({
      commentary,
      achievement: unlockedAchievements.length > 0 ? unlockedAchievements[0] : null,
      heroQuote: randomQuote,
      stats: {
        onTrack: onTrackCount,
        total: totalCount,
        percentage
      }
    }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Check-in summary error:", error);
    
    // Return a fallback response
    return new Response(JSON.stringify({
      commentary: {
        dayHighlight: "You showed up and tracked today - that's what matters!",
        weekInsight: "Consistency builds momentum. Keep going.",
        encouragement: "The fact that you're tracking means you're committed to growth.",
        tomorrowTip: "Pick one metric to focus on improving tomorrow."
      },
      achievement: null,
      heroQuote: HERO_QUOTES[0],
      stats: { onTrack: 0, total: 0, percentage: 0 }
    }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }
}



