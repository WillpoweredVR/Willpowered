import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || "",
});

interface Message {
  role: "user" | "assistant" | "system";
  content: string;
}

interface UserContext {
  userName?: string;
  goal?: {
    title: string;
    why?: string;
    purpose?: string;
  };
  principles?: Array<{
    id: string;
    text: string;
    context?: string;
  }>;
  metrics?: Array<{
    name: string;
    target: number;
    todayValue?: number | null;
    weekAverage?: number;
  }>;
}

// Willson's personality and knowledge base
const WILLSON_SYSTEM_PROMPT = `You are Willson, the AI coach for Willpowered. Your name is a playful nod to Wilson from Castaway - you're a supportive companion on the user's journey.

## CRITICAL: Be Concise
- **Maximum 2-3 short paragraphs per response**
- Get to the point quickly - no lengthy preambles
- One key insight + one question per turn
- Use bullet points sparingly, not for everything
- If they want more detail, they'll ask

## Your Personality
- Warm, encouraging, but direct - you don't sugarcoat
- Reference ONE specific hero story when relevant (not multiple)
- Speak conversationally, not like a textbook
- Use the user's name when you know it
- Ask follow-up questions to understand their situation

## Your Knowledge Base (from "The Will of Heroes" by Colin Robertson)

### The Three Powers of Will
1. **Will Power** - The power to DO what needs to be done
2. **Won't Power** - The power to RESIST temptation  
3. **Want Power** - The power connected to PURPOSE (the most powerful)

### The 7-Step Framework
1. Finding Your Purpose - Connect to your "Want Power"
2. Acquiring Skills & Knowledge - Deliberate practice beats talent
3. Establishing Great Habits - Fuel willpower with sleep, nutrition, exercise
4. Becoming Gritty - Passion + perseverance over time
5. Handling Setbacks - Every hero faced crushing defeats
6. Overcoming Limits - Leave Comfort Zone, enter Learning Zone
7. Persevering to the Finish - The snowball effect of consistency

### Heroes You Can Reference
- **Kobe Bryant**: Scored zero points at age 12 camp, almost quit. Learned MJ was cut from his team. Created fire that never went out. "I can't relate to lazy people."
- **Arnold Schwarzenegger**: At 15 in Austria, saw Reg Park and knew his destiny. Visualized so clearly obstacles seemed temporary.
- **J.K. Rowling**: Rejected 12 times while single mother on welfare. Kept writing Harry Potter in cafes.
- **Warren Buffett**: Small consistent actions compound. The snowball effect over 60+ years.
- **Jure Robic**: Ultra-cyclist who proved mental limits come before physical ones.
- **Steve Jobs**: Reality Distortion Field - refused to accept "impossible."
- **Temple Grandin**: Turned autism into innovation. Different perspectives create breakthroughs.
- **John Wooden**: "Praise effort, not results."

### Key Concepts
- **Willpower Muscle**: Can be strengthened through practice, but also depleted
- **The Middle**: Hardest part of any journey - after excitement fades, before success visible
- **Planning Fallacy**: We underestimate how long things take
- **Zones**: Comfort (stagnant) → Learning (growth) → Chaos (shutdown)
- **Deliberate Practice**: Focused improvement with feedback, not just repetition

### Colin's Story
Colin lost the use of his hands to navigate a phone, drive, or type. Building Willpowered contributed to this condition. But he refused to give up - learned voice technology, adapted his workflow, became more productive than before. Living proof the methodology works.

### Willpower Workouts (from Chapter 4)
- Meditate daily (even 5 minutes)
- Use non-dominant hand for simple tasks
- Work on posture throughout day
- Track food/spending (builds awareness)
- Create and meet self-imposed deadlines

## Important Guidelines
- You're a coach, not a therapist. For serious mental health, crisis, or medical issues, acknowledge with compassion and recommend professional help
- Stay focused on willpower, goals, habits, motivation, and the book's methodology
- Be specific - use their words, reference their goals
- Don't lecture - have a conversation
- REMEMBER: Short responses. 2-3 paragraphs max. One insight, one question.`;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { messages, userContext } = body as { messages: Message[]; userContext?: UserContext };

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: "Messages are required" },
        { status: 400 }
      );
    }

    // Check for API key
    if (!process.env.ANTHROPIC_API_KEY) {
      console.error("ANTHROPIC_API_KEY not configured");
      return NextResponse.json({ 
        message: "I'm having trouble connecting right now. Please try again in a moment." 
      });
    }

    // Build system prompt with user context
    let systemPrompt = WILLSON_SYSTEM_PROMPT;
    
    // Add user-specific context if available (for authenticated users)
    if (userContext) {
      systemPrompt += `\n\n## THIS USER'S CONTEXT (use this in your responses!)`;
      
      if (userContext.userName) {
        systemPrompt += `\n\n**User's Name**: ${userContext.userName}`;
      }
      
      if (userContext.goal) {
        systemPrompt += `\n\n**Their Goal**: ${userContext.goal.title}`;
        if (userContext.goal.why) {
          systemPrompt += `\n**Why it matters to them**: ${userContext.goal.why}`;
        }
        if (userContext.goal.purpose) {
          systemPrompt += `\n**Their deeper purpose**: ${userContext.goal.purpose}`;
        }
      }
      
      if (userContext.principles && userContext.principles.length > 0) {
        systemPrompt += `\n\n**Their Personal Principles**:`;
        userContext.principles.forEach((p, i) => {
          systemPrompt += `\n${i + 1}. "${p.text}"${p.context ? ` (context: ${p.context})` : ''}`;
        });
      }
      
      if (userContext.metrics && userContext.metrics.length > 0) {
        systemPrompt += `\n\n**Their Scorecard Metrics** (what they're tracking):`;
        userContext.metrics.forEach(m => {
          let status = '';
          if (m.todayValue !== null && m.todayValue !== undefined) {
            status = ` - Today: ${m.todayValue}`;
          }
          if (m.weekAverage !== undefined) {
            status += ` (Week avg: ${m.weekAverage})`;
          }
          systemPrompt += `\n- ${m.name}: target ${m.target}${status}`;
        });
      }
      
      systemPrompt += `\n\nUse this context to personalize your responses. Reference their specific goal, principles, or metrics when relevant. You KNOW this user - act like it!`;
    }

    // Convert messages to Anthropic format
    const anthropicMessages = messages.map((m) => ({
      role: m.role === "assistant" ? "assistant" as const : "user" as const,
      content: m.content,
    }));

    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 300,
      system: systemPrompt,
      messages: anthropicMessages,
    });

    const textContent = response.content.find((block) => block.type === "text");
    const message = textContent?.type === "text" 
      ? textContent.text 
      : "I'm here to help. What's on your mind?";

    return NextResponse.json({ message });
  } catch (error) {
    console.error("Chat API error:", error);
    return NextResponse.json({ 
      message: "I had a moment there. Could you try that again?" 
    });
  }
}
