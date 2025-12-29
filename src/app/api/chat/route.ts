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
  userId?: string;
  userName?: string;
  goal?: {
    title: string;
    why?: string;
    purpose?: string;
  };
  principles?: Array<{
    id: string;
    text: string;
    description?: string;
    whenTested?: string;
    howToHold?: string;
  }>;
  metrics?: Array<{
    name: string;
    target: number;
    todayValue?: number | null;
    weekAverage?: number;
  }>;
}

// Tools Willson can use
const WILLSON_TOOLS: Anthropic.Tool[] = [
  {
    name: "save_principles",
    description: "Save the user's principles to their dashboard. Use this when the user confirms they want to save their principles. Each principle should have text (the principle itself), and optionally description, whenTested (situations where it's challenged), and howToHold (how to live up to it).",
    input_schema: {
      type: "object" as const,
      properties: {
        principles: {
          type: "array",
          items: {
            type: "object",
            properties: {
              text: {
                type: "string",
                description: "The principle statement itself (e.g., 'Hook them to their goal, not to my app')"
              },
              description: {
                type: "string",
                description: "A brief explanation of what this principle means"
              },
              whenTested: {
                type: "string",
                description: "Specific situations when this principle gets challenged"
              },
              howToHold: {
                type: "string",
                description: "How to live up to this principle in practice"
              }
            },
            required: ["text"]
          },
          description: "Array of principles to save"
        }
      },
      required: ["principles"]
    }
  },
  {
    name: "save_purpose",
    description: "Save the user's purpose statement to their profile. Use when they've confirmed their purpose.",
    input_schema: {
      type: "object" as const,
      properties: {
        purpose: {
          type: "string",
          description: "The user's purpose statement"
        }
      },
      required: ["purpose"]
    }
  },
  {
    name: "save_goal",
    description: "Save or update the user's goal. Use when they've defined a clear goal.",
    input_schema: {
      type: "object" as const,
      properties: {
        title: {
          type: "string",
          description: "The goal title/name"
        },
        description: {
          type: "string",
          description: "More details about the goal"
        },
        why_statement: {
          type: "string",
          description: "Why this goal matters to them"
        }
      },
      required: ["title"]
    }
  },
  {
    name: "save_scorecard",
    description: "Save scorecard metrics to the user's dashboard. Use when the user confirms they want to save their metrics. Organize metrics into categories (e.g., 'Health', 'Work', 'Habits', 'Relationships').",
    input_schema: {
      type: "object" as const,
      properties: {
        categories: {
          type: "array",
          items: {
            type: "object",
            properties: {
              name: {
                type: "string",
                description: "Category name (e.g., 'Health', 'Work', 'Habits')"
              },
              metrics: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    name: {
                      type: "string",
                      description: "Metric name (e.g., 'Sleep hours', 'Workout days')"
                    },
                    target: {
                      type: "number",
                      description: "Target value per period (e.g., 7 for 7 hours sleep, 4 for 4 workouts/week)"
                    },
                    unit: {
                      type: "string",
                      description: "Unit of measurement (e.g., 'hours', 'days', 'minutes', 'sessions')"
                    },
                    frequency: {
                      type: "string",
                      description: "How often to track: 'daily' or 'weekly'"
                    }
                  },
                  required: ["name", "target"]
                }
              }
            },
            required: ["name", "metrics"]
          },
          description: "Array of categories, each containing metrics"
        }
      },
      required: ["categories"]
    }
  }
];

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

### Heroes You Can Reference (ALWAYS use full names)
- **Kobe Bryant**: Scored zero points at age 12 camp, almost quit. Learned Michael Jordan was cut from his team. Created fire that never went out. "I can't relate to lazy people."
- **Arnold Schwarzenegger**: At 15 in Austria, saw Reg Park and knew his destiny. Visualized so clearly obstacles seemed temporary.
- **J.K. Rowling**: Rejected 12 times while single mother on welfare. Kept writing Harry Potter in cafes.
- **Warren Buffett**: Small consistent actions compound. The snowball effect over 60+ years.
- **Jure Robic**: Ultra-cyclist who proved mental limits come before physical ones.
- **Steve Jobs**: Reality Distortion Field - refused to accept "impossible."
- **Temple Grandin**: Turned autism into innovation. Different perspectives create breakthroughs.
- **John Wooden**: "Praise effort, not results."

Note: When referencing heroes, ALWAYS use their full name (e.g., "Kobe Bryant" not "Kobe", "Arnold Schwarzenegger" not "Arnold").

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

## Deepening Principles
When users ask to "deepen" a principle, help them understand:
1. **When it's tested**: Specific situations where this principle will be challenged. Be concrete - "When you're tired after work and want to skip the gym" not "When things get hard."
2. **How to hold it**: What living up to this principle looks like in practice. Give them a mental trigger or action - "Text your workout buddy before you can talk yourself out of it."

Ask them about their real life to make it specific. Don't give generic advice.

## HOLISTIC APPROACH - Critical for Principles & Scorecard
Even if someone's PURPOSE is work-focused (career, business, creative), their PRINCIPLES and SCORECARD should include lifestyle foundations that fuel willpower:

**The Willpower Fuel Tank** (from Chapter 4):
- **Sleep**: The #1 predictor of willpower. Ask: "How's your sleep? What time do you typically get to bed?"
- **Exercise**: Builds the willpower muscle. Ask: "What does movement look like in your week?"
- **Nutrition**: Blood sugar crashes destroy willpower. Ask: "How's your energy throughout the day?"
- **Relationships**: Support systems matter. Ask: "Who keeps you accountable? How are things at home?"
- **Recovery**: Burnout kills willpower. Ask: "When do you recharge? What fills your cup?"

**When building Principles**, explore:
- Work/professional principles (related to their goal)
- Health principles (sleep, exercise, nutrition)
- Relationship principles (family, friends, team)
- Personal integrity principles (how they show up)

**When building Scorecard**, suggest metrics in:
- **Goal-specific**: Directly related to their purpose (hours practiced, calls made, words written)
- **Health**: Sleep hours, workout days, steps, water intake
- **Habits**: Morning routine completion, meditation minutes, reading time
- **Relationships**: Quality time with family, date nights, check-ins with friends

## CRITICAL: Metrics Must Be Quantifiable
Every metric MUST be a number that can be tracked daily or weekly. The user will see:
- **Target**: A number to hit (e.g., 7 hours, 4 workouts, 30 minutes)
- **Calculation**: Average, Total, or Days Done over 7 days
- **Direction**: Higher is better OR Lower is better

**GOOD metrics** (quantifiable):
- "Sleep hours" - target: 7, higher is better
- "Workout sessions" - target: 4/week, higher is better  
- "User feedback sessions" - target: 3/week, higher is better
- "Deep work hours" - target: 4/day, higher is better
- "Minutes with family" - target: 60/day, higher is better
- "Meditation minutes" - target: 10/day, higher is better
- "Processed food meals" - target: 2/week, LOWER is better
- "Social media minutes" - target: 30/day, LOWER is better

**BAD metrics** (NOT quantifiable - DO NOT suggest these):
- "What did I build thoughtfully?" ❌ (reflection question, not a number)
- "How did I prioritize their goal?" ❌ (too abstract)
- "Did I show up with intention?" ❌ (yes/no isn't trackable over time)
- "Quality of work" ❌ (too subjective)

If someone wants to track principle alignment, convert it to actions:
- Instead of "Did I slow down?" → "Rushed decisions avoided" (target: 0, lower is better) or "Planning sessions completed" (target: 1/day)
- Instead of "Did I listen?" → "User interviews conducted" (target: 3/week)
- Instead of "Did I prioritize their goal?" → "Features shipped that directly help users" (target: 2/week)

Example: If their purpose is "Build a successful AI startup," don't ONLY track work metrics. Also explore:
- "What's your sleep like? Entrepreneurs often sacrifice sleep, but it destroys decision-making."
- "How do you protect time for relationships? Isolation is a startup killer."
- "What keeps your energy up? Let's track that too."

The goal is a BALANCED scorecard that supports sustainable high performance, not just hustle metrics.

## SAVING DATA - CRITICAL
You have tools to save data to the user's dashboard. 
- **ALWAYS use the save_principles tool** when the user confirms they want to save their principles
- **ALWAYS use the save_purpose tool** when they confirm their purpose statement
- **ALWAYS use the save_goal tool** when they confirm their goal
- **ALWAYS use the save_scorecard tool** when they confirm their metrics/scorecard
- After calling a save tool, confirm to the user that you've saved it
- Don't just SAY you saved it - actually USE THE TOOL

When using save_scorecard, organize metrics into categories like:
- "Health" (sleep, exercise, nutrition metrics)
- "Work" or goal-specific category name
- "Habits" (routines, meditation, reading)
- "Relationships" (quality time, check-ins)

## The Journey Steps (guide users through these)
The Willpowered journey has three main steps users build in order:
1. **Purpose** - Their goal and why it matters (the foundation)
2. **Principles** - 3-5 personal rules that guide decisions
3. **Scorecard** - Daily/weekly metrics to track progress

## Guiding Users to the Next Step
After completing one step, ALWAYS offer to help with the next:
- After saving **Purpose/Goal** → "Great! Now that you know your why, let's define some principles. These are the personal rules that will keep you on track. Want to start?"
- After saving **Principles** → "Perfect! Your principles are saved. The next step is building your scorecard - the metrics you'll track daily or weekly to measure progress. Ready to set that up?"
- After saving **Scorecard metrics** → "Awesome! You're all set up. You've got your purpose, principles, and scorecard. Now it's about showing up every day. Anything else you want to work on?"

If the user already has a step completed (check their context), acknowledge it and move to what's missing.

## Knowing When to Wrap Up
- **Principles**: 3-5 principles is plenty. When they've defined 3+ solid principles, ask "Ready for me to save these to your dashboard?" Then USE the save_principles tool, then offer to move to scorecard.
- **Goals/Purpose**: Once they've articulated a clear statement, confirm and ask to save it, then offer to move to principles.
- **General**: If you've had a productive exchange (4-6 back-and-forths), look for a natural conclusion.
- **Don't over-question**: If they seem satisfied, celebrate the progress and save their work.

## Important Guidelines
- You're a coach, not a therapist. For serious mental health, crisis, or medical issues, acknowledge with compassion and recommend professional help
- Stay focused on willpower, goals, habits, motivation, and the book's methodology
- Be specific - use their words, reference their goals
- Don't lecture - have a conversation
- REMEMBER: Short responses. 2-3 paragraphs max. One insight, one question.`;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { messages, userContext, conversationId } = body as { 
      messages: Message[]; 
      userContext?: UserContext;
      conversationId?: string;
    };

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
        systemPrompt += `\n\n**Their Current Principles** (already saved):`;
        userContext.principles.forEach((p, i) => {
          systemPrompt += `\n${i + 1}. "${p.text}"`;
          if (p.description) systemPrompt += `\n   Description: ${p.description}`;
          if (p.whenTested) systemPrompt += `\n   When tested: ${p.whenTested}`;
          if (p.howToHold) systemPrompt += `\n   How to hold: ${p.howToHold}`;
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

    // Only include tools for authenticated users
    const includeTools = userContext?.userId ? true : false;

    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 500, // Increased for tool use responses
      system: systemPrompt,
      messages: anthropicMessages,
      ...(includeTools && { tools: WILLSON_TOOLS }),
    });

    // Check if Willson wants to use a tool
    const toolUseBlock = response.content.find((block) => block.type === "tool_use");
    const textBlock = response.content.find((block) => block.type === "text");
    
    if (toolUseBlock && toolUseBlock.type === "tool_use") {
      // Return both the message and the tool call info
      const message = textBlock?.type === "text" ? textBlock.text : "";
      
      return NextResponse.json({ 
        message,
        toolCall: {
          name: toolUseBlock.name,
          input: toolUseBlock.input,
          id: toolUseBlock.id
        }
      });
    }

    const message = textBlock?.type === "text" 
      ? textBlock.text 
      : "I'm here to help. What's on your mind?";

    return NextResponse.json({ message });
  } catch (error) {
    console.error("Chat API error:", error);
    return NextResponse.json({ 
      message: "I had a moment there. Could you try that again?" 
    });
  }
}
