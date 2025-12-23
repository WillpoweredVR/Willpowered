import { NextRequest } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/lib/supabase/server";
import { SYSTEM_PROMPT, getGuardrailResponse } from "@/lib/ai-coach";
import { 
  TIER_LIMITS, 
  getTierFromStatus, 
  shouldResetConversations,
  getUsageStatus 
} from "@/lib/subscription-limits";

// Initialize Anthropic client
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || "",
});

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface SkillContext {
  skillName: string;
  createPlan: boolean;
}

interface CoachingContext {
  mode?: 'principles' | 'scorecard' | 'skill';
  skillName?: string;
}

// Detect if the message is about principles
function isPrinciplesRequest(message: string): boolean {
  const patterns = [
    /\bprinciple/i,
    /\bvalues?\b.*guide/i,
    /\brules?\b.*\b(live|decision|behavior)/i,
    /\bnon-?negotiable/i,
    /\bstandards?\b.*\bhold/i,
    /what (should|do) i stand for/i,
    /define my.*values/i,
  ];
  return patterns.some(p => p.test(message));
}

// Detect if the message is about scorecard
function isScorecardRequest(message: string): boolean {
  const patterns = [
    /\bscorecard/i,
    /\bmetric/i,
    /\btrack.*weekly/i,
    /\bweekly.*track/i,
    /\bleading indicator/i,
    /\bmeasure.*progress/i,
    /what (should|do) i.*track/i,
    /how do i know.*on track/i,
    /customize.*scorecard/i,
  ];
  return patterns.some(p => p.test(message));
}

// Parse scorecard updates from Willson's response
interface ScorecardUpdate {
  action: 'add' | 'update' | 'remove';
  category: string;
  metricId?: string;
  name: string;
  description: string;
  target: number;
  unit: string;
  direction: 'higher' | 'lower';
  calculation: 'average' | 'sum' | 'count';
}

function extractScorecardUpdates(content: string): ScorecardUpdate[] {
  const updates: ScorecardUpdate[] = [];
  
  // Find all [SCORECARD_UPDATES] blocks
  const blockRegex = /\[SCORECARD_UPDATES\]([\s\S]*?)\[\/SCORECARD_UPDATES\]/g;
  let match;
  
  while ((match = blockRegex.exec(content)) !== null) {
    const block = match[1];
    
    const action = block.match(/ACTION:\s*(add|update|remove)/i)?.[1]?.toLowerCase() as 'add' | 'update' | 'remove' || 'add';
    const category = block.match(/CATEGORY:\s*(\w+)/i)?.[1]?.toLowerCase() || 'custom';
    const metricId = block.match(/METRIC_ID:\s*(\S+)/i)?.[1];
    const name = block.match(/NAME:\s*(.+?)(?:\n|$)/i)?.[1]?.trim() || '';
    const description = block.match(/DESCRIPTION:\s*(.+?)(?:\n|$)/i)?.[1]?.trim() || '';
    const targetStr = block.match(/TARGET:\s*(\d+(?:\.\d+)?)/i)?.[1];
    const unit = block.match(/UNIT:\s*(.+?)(?:\n|$)/i)?.[1]?.trim() || '';
    const direction = block.match(/DIRECTION:\s*(higher|lower)/i)?.[1]?.toLowerCase() as 'higher' | 'lower' || 'higher';
    const calculation = block.match(/CALCULATION:\s*(average|sum|count)/i)?.[1]?.toLowerCase() as 'average' | 'sum' | 'count' || 'average';
    
    // For remove actions, we only need metricId OR name
    // For add/update actions, we need name and target
    const isValidRemove = action === 'remove' && (metricId || name);
    const isValidAddOrUpdate = (action === 'add' || action === 'update') && name && targetStr;
    
    if (isValidRemove || isValidAddOrUpdate) {
      updates.push({
        action,
        category,
        metricId,
        name,
        description,
        target: targetStr ? parseFloat(targetStr) : 0,
        unit,
        direction,
        calculation,
      });
    }
  }
  
  console.log('Extracted scorecard updates:', updates);
  return updates;
}

interface SkillTask {
  id: string;
  title: string;
  description?: string;
  link?: string;
  linkLabel?: string;
  status: 'pending' | 'in_progress' | 'completed';
  order: number;
  created_at: string;
}

// Principles discovery prompt (from Chapter 10: The Pursuit of Perfection)
const PRINCIPLES_DISCOVERY_PROMPT = `

## PRINCIPLES DISCOVERY MODE

You're helping the user define their personal principles - the "HOW" that bridges their Purpose (Why) and their Scorecard (What).

**The Framework:**
- **Purpose (Why)** = The reason you get up in the morning
- **Principles (How)** = The rules that guide your daily decisions
- **Scorecard (What)** = The specific actions you track weekly

Principles turn purpose into daily behavior. They conserve willpower by pre-making decisions. They give you an internal locus of control - YOU decide your standards, not circumstances.

**From Chapter 10 of The Will of Heroes:**
As Vince Lombardi said: "The quality of a person's life is in direct proportion to their commitment to excellence."

**Guide them through these 4 steps:**

1. **Identify Priorities** - "Given your purpose, what areas of life need principles? (Health, relationships, growth, work, creativity...)"

2. **Define Non-Negotiables** - "In each area, what's ONE rule you would NEVER break, even when it's hard?"

3. **Add Context** - "Why does this principle matter to you? What does it mean in practice?"

4. **Test Under Pressure** - "Would you hold this principle when tired, stressed, or tempted? Real principles reveal themselves in difficult moments."

**Help them articulate 3-5 clear, actionable principles. Each principle should have:**
- **A memorable name/statement** (e.g., "Consistency Conquers Intensity")
- **Context for why it matters** (e.g., "Small daily actions compound into massive results. I'd rather do 30 minutes every day than 4 hours once a week.")

**Example principles with context:**
- "I always keep my commitments" → "My word is my bond. Breaking promises breaks trust and erodes my self-respect."
- "Confront the brutal facts" → "I can't fix what I won't face. Optimism about the future requires honesty about the present."
- "Seek socialization" → "Relationships matter more than achievements. I prioritize connection over isolation."

**Format:** Keep responses SHORT (2-3 paragraphs max). Ask ONE question at a time. When they've identified 3+ solid principles, summarize them with their context and ask if they want to add these to their dashboard.
`;

// Scorecard customization prompt with full context
const SCORECARD_CUSTOMIZATION_PROMPT = `

## SCORECARD CUSTOMIZATION MODE

You're helping the user customize their personal scorecard. You have access to their full context.

{USER_CONTEXT}

**YOUR APPROACH: Observe → Reflect → Invite**

Start by:
1. Briefly acknowledge their purpose and 1-2 key principles
2. Note ONE observation about their current scorecard (gap, imbalance, or opportunity)
3. Ask what's prompting them to customize with 3 clear options:
   - "Feeling overwhelmed by too many metrics?"
   - "Missing something important?"
   - "Want to tune what you have?"

**WHEN SUGGESTING OR UPDATING METRICS:**

For EACH metric you discuss, be specific about ALL these fields:
- **Name**: Short, clear title
- **Description**: What exactly is being measured
- **Target**: The specific number to aim for
- **Unit**: How it's measured (score, hours, days, times, etc.)
- **Direction**: "higher is better" or "lower is better"
- **Calculation**: "average" (daily values averaged), "sum" (total over week), or "count" (days you did it)

**WHEN READY TO APPLY CHANGES:**

When the user confirms they want to add or update metrics, output them in this EXACT format:

[SCORECARD_UPDATES]
ACTION: add | update | remove
CATEGORY: health | productivity | growth | distractions | relationships | custom
METRIC_ID: (for update/remove only, use existing ID)
NAME: Metric Name
DESCRIPTION: What this measures
TARGET: number
UNIT: unit label
DIRECTION: higher | lower
CALCULATION: average | sum | count
[/SCORECARD_UPDATES]

You can include multiple metrics by repeating the block.

**GUIDELINES:**
- Keep responses SHORT (2-3 paragraphs max)
- One topic at a time
- Be specific, not generic
- Connect recommendations to their PURPOSE
- Default categories: health, productivity, growth, distractions
- User can add custom categories if needed
`;

// Skill learning system prompt addition
const SKILL_LEARNING_PROMPT = `

## SKILL LEARNING MODE

You are helping the user learn: {topic}

Create a simple, achievable 3-step learning plan using AI tools.

**STEP 1: Choose ONE Primary AI Tool Based on Skill Type**

Pick the BEST tool for this specific skill and use it for ALL 3 steps:

| Skill Category | Best Tool | URL |
|----------------|-----------|-----|
| **Coding/Programming** | Cursor | https://cursor.com |
| **Writing/Content** | Claude | https://claude.ai |
| **Marketing/Strategy** | ChatGPT | https://chat.openai.com |
| **Sales/Communication** | ChatGPT | https://chat.openai.com |
| **Research/Analysis** | Perplexity | https://perplexity.ai |
| **UI/Design** | v0.dev | https://v0.dev |
| **Data/Analytics** | Claude | https://claude.ai |
| **Business/Planning** | Claude | https://claude.ai |
| **Creative/Brainstorming** | ChatGPT | https://chat.openai.com |
| **Learning concepts** | Claude | https://claude.ai |

**IMPORTANT: Use the SAME tool for all 3 steps.** This creates a cohesive learning experience.

**Plan Guidelines:**
- EXACTLY 3 steps (no more, no less)
- All steps use the SAME AI tool
- Each step builds on the previous one
- Focus on DOING and building, not consuming content
- Step 1: Learn the basics with AI guidance
- Step 2: Practice/build something small
- Step 3: Create something real you can use

**Format each step like this:**
**Step 1: [Action-Oriented Title]**
[What to do with the AI tool - 1-2 sentences]
🔗 [Tool Name](url)

**After presenting the plan, ask:** "Does this plan look good? Say 'sounds good' to add these tasks to your dashboard."

When confirmed, respond briefly: "Added to your dashboard! Check them off as you go. 💪"
`;

// Check if user is confirming a plan
function isConfirmingPlan(message: string): boolean {
  const confirmPhrases = [
    "sounds good", "looks good", "perfect", "yes", "let's do it", 
    "let's go", "that works", "love it", "great", "awesome",
    "do it", "add them", "add it", "confirm", "approved", "go ahead",
    "ready", "dive in", "start", "begin", "i'm in", "let's start",
    "good to go", "all set", "locked in", "committed"
  ];
  const lowerMessage = message.toLowerCase();
  return confirmPhrases.some(phrase => lowerMessage.includes(phrase));
}

// Extract tasks from the AI's learning plan response
function extractTasksFromPlan(messages: Message[], skillName: string): SkillTask[] {
  // Look for the plan in recent assistant messages
  const recentAssistantMessages = messages
    .filter(m => m.role === "assistant")
    .slice(-3);

  const tasks: SkillTask[] = [];
  
  for (const msg of recentAssistantMessages) {
    const content = msg.content;
    console.log("Scanning message for tasks:", content.substring(0, 300));
    
    // Split content by "Step" markers and process each
    const stepSections = content.split(/(?=\*\*Step\s+\d|Step\s+\d)/i);
    
    for (const section of stepSections) {
      // Match: Step N: Title (with or without bold asterisks)
      const stepMatch = section.match(/^\*?\*?Step\s+(\d+)[:\.]?\s*(.+?)(?:\*\*)?(?:\n|$)/i);
      if (!stepMatch) continue;
      
      const stepNum = stepMatch[1];
      const titleAndDesc = stepMatch[2];
      
      // Split title from description (title is usually before the first sentence break or long text)
      const titleMatch = titleAndDesc.match(/^([^\.]+)/);
      const title = titleMatch ? titleMatch[1].replace(/\*+/g, '').trim() : titleAndDesc.replace(/\*+/g, '').trim();
      
      // Extract description (everything after title on same section)
      const descriptionMatch = section.match(/(?:Step\s+\d[:\.]?\s*[^\n]+\n)([^🔗]+)/i);
      const description = descriptionMatch ? descriptionMatch[1].trim().substring(0, 200) : undefined;
      
      // Extract link from the section
      const linkMatch = section.match(/🔗\s*\[([^\]]+)\]\(([^\)]+)\)/);
      const linkLabel = linkMatch?.[1]?.trim();
      const link = linkMatch?.[2]?.trim();
      
      console.log(`Found step ${stepNum}: "${title}" with link: ${link || 'none'}`);
      
      if (title && title.length > 3 && !tasks.find(t => t.title === title)) {
        tasks.push({
          id: crypto.randomUUID(),
          title,
          description: description || undefined,
          link: link || undefined,
          linkLabel: linkLabel || undefined,
          status: 'pending',
          order: parseInt(stepNum) - 1,
          created_at: new Date().toISOString(),
        });
      }
    }
    
    // If we found tasks in this message, stop looking at other messages
    if (tasks.length > 0) break;
  }

  console.log(`Total tasks extracted: ${tasks.length}`, tasks.map(t => t.title));
  // Limit to 3 tasks (simpler is better)
  return tasks.slice(0, 3);
}

// Generate user context for personalized coaching
async function getUserContext(): Promise<{ basic: string; full: FullUserContext | null }> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { basic: "", full: null }; // No authenticated user - use generic coaching
    }

    // Fetch user profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    // Fetch primary goal
    const { data: goal } = await supabase
      .from("goals")
      .select("*")
      .eq("user_id", user.id)
      .eq("is_primary", true)
      .eq("status", "active")
      .single();

    // Fetch recent habits
    const { data: habits } = await supabase
      .from("habits")
      .select("title, current_streak, journey_step")
      .eq("user_id", user.id)
      .eq("is_active", true)
      .limit(5);

    // Fetch today's completions
    const today = new Date().toISOString().split("T")[0];
    const { data: completions } = await supabase
      .from("habit_completions")
      .select("habit_id")
      .eq("user_id", user.id)
      .eq("completed_date", today);

    // Build context string
    let context = "\n\n## USER CONTEXT (Use this to personalize your coaching)\n\n";

    if (profile?.full_name) {
      context += `**User's Name:** ${profile.full_name.split(" ")[0]}\n`;
    }

    if (profile?.purpose_statement) {
      context += `**Their Purpose:** "${profile.purpose_statement}"\n`;
    }

    if (profile?.focus_step) {
      const stepNames = [
        "Finding Purpose",
        "Acquiring Skills",
        "Establishing Habits",
        "Becoming Gritty",
        "Handling Setbacks",
        "Overcoming Limits",
        "Persevering",
      ];
      context += `**Focus Area:** Step ${profile.focus_step} - ${stepNames[profile.focus_step - 1]}\n`;
    }

    if (goal) {
      const daysOnJourney = Math.floor(
        (Date.now() - new Date(goal.started_at).getTime()) / (1000 * 60 * 60 * 24)
      );
      context += `\n**Current Goal:** ${goal.title}\n`;
      if (goal.why_statement) {
        context += `**Why It Matters:** "${goal.why_statement}"\n`;
      }
      context += `**Days on Journey:** ${daysOnJourney}\n`;
      context += `**Progress:** ${goal.progress_percentage}%\n`;
    }

    if (habits && habits.length > 0) {
      const completedIds = completions?.map((c) => c.habit_id) || [];
      const completedCount = habits.filter((h) => completedIds.includes(h.title)).length;
      
      context += `\n**Today's Habits:** ${completedCount}/${habits.length} completed\n`;
      
      const streaks = habits.filter((h) => h.current_streak > 0);
      if (streaks.length > 0) {
        context += `**Active Streaks:** ${streaks.map((h) => `${h.title} (${h.current_streak} days)`).join(", ")}\n`;
      }
    }

    context += "\n---\n";
    context += "Use this context naturally in conversation. Address them by name. Reference their specific goal and purpose when relevant. Celebrate their progress and streaks.\n";

    // Build full context for scorecard customization
    const fullContext: FullUserContext = {
      name: profile?.full_name?.split(" ")[0] || "friend",
      purpose: profile?.purpose_statement || null,
      principles: (profile?.principles as { id: string; text: string }[]) || [],
      goal: goal?.title || null,
      scorecard: profile?.scorecard || null,
    };

    return { basic: context, full: fullContext };
  } catch (error) {
    console.error("Error fetching user context:", error);
    return { basic: "", full: null };
  }
}

interface FullUserContext {
  name: string;
  purpose: string | null;
  principles: { id: string; text: string }[];
  goal: string | null;
  scorecard: unknown;
}

// Format scorecard for Willson to understand
function formatScorecardForContext(context: FullUserContext): string {
  let text = `
**USER'S FULL CONTEXT:**

**Name:** ${context.name}
**Purpose:** ${context.purpose || "Not yet defined"}
**Goal:** ${context.goal || "Not yet set"}

**Principles (${context.principles.length}):**
${context.principles.length > 0 
  ? context.principles.map((p, i) => `${i + 1}. ${p.text}`).join('\n')
  : "None defined yet"}

**Current Scorecard:**
`;

  if (context.scorecard && typeof context.scorecard === 'object') {
    const scorecard = context.scorecard as { categories?: Array<{ id: string; name: string; metrics: Array<{ id: string; name: string; description?: string; target: number; unit?: string; direction: string; aggregation: string }> }> };
    if (scorecard.categories && scorecard.categories.length > 0) {
      for (const category of scorecard.categories) {
        text += `\n**${category.name}** (${category.metrics.length} metrics):\n`;
        for (const metric of category.metrics) {
          const dir = metric.direction === 'lower' ? '↓ lower is better' : '↑ higher is better';
          text += `- ${metric.name}: target ${metric.target} ${metric.unit || ''} (${dir}, ${metric.aggregation})\n`;
          if (metric.description) {
            text += `  Description: ${metric.description}\n`;
          }
        }
      }
    } else {
      text += "No metrics configured yet.\n";
    }
  } else {
    text += "No scorecard configured yet.\n";
  }

  return text;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { messages, skillContext } = body as { 
      messages: Message[]; 
      skillContext?: SkillContext;
    };

    if (!messages || !Array.isArray(messages)) {
      return new Response(
        JSON.stringify({ error: "Messages are required" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // ========== CONVERSATION LIMIT CHECK ==========
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (user) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("subscription_status, monthly_conversations, conversation_reset_date")
        .eq("id", user.id)
        .single();

      if (profile) {
        const tier = getTierFromStatus(profile.subscription_status);
        const limits = TIER_LIMITS[tier];
        
        // Check if we need to reset the monthly count
        const needsReset = shouldResetConversations(profile.conversation_reset_date);
        let currentConversations = needsReset ? 0 : (profile.monthly_conversations || 0);
        
        // If needs reset, update the database
        if (needsReset) {
          await supabase
            .from("profiles")
            .update({ 
              monthly_conversations: 0, 
              conversation_reset_date: new Date().toISOString() 
            })
            .eq("id", user.id);
        }

        // Check if user has hit their limit (free tier only)
        if (tier === 'free' && currentConversations >= limits.monthlyConversations) {
          const usage = getUsageStatus(
            profile.subscription_status, 
            currentConversations, 
            profile.conversation_reset_date
          );
          
          return new Response(
            JSON.stringify({ 
              error: "conversation_limit_reached",
              message: "You've reached your monthly conversation limit.",
              usage: {
                used: usage.conversationsUsed,
                limit: usage.conversationsLimit,
                daysUntilReset: usage.daysUntilReset,
              }
            }),
            { status: 403, headers: { "Content-Type": "application/json" } }
          );
        }
      }
    }
    // ========== END CONVERSATION LIMIT CHECK ==========

    // Check if API key is configured
    if (!process.env.ANTHROPIC_API_KEY) {
      // Return a helpful message if no API key
      return new Response(
        JSON.stringify({
          message: `I'm Willson, your Willpowered AI Coach! 🏐 I'm ready to help you strengthen your willpower and achieve your goals.

**To activate me fully, you'll need to:**
1. Get an API key from [Anthropic Console](https://console.anthropic.com/)
2. Add it to your \`.env.local\` file as \`ANTHROPIC_API_KEY=your-key-here\`
3. Restart your development server

In the meantime, I can tell you about the methodology:

**The 7-Step Willpower Journey:**
1. Finding Your Purpose - Connect to your "want power"
2. Acquiring Skills - Deliberate practice beats talent
3. Establishing Habits - Automate good decisions
4. Becoming Gritty - Passion + perseverance over time
5. Handling Setbacks - Failure is feedback, not finale
6. Overcoming Limits - Most limits are mental
7. Persevering to the Finish - Consistency compounds

What goal are you working toward?`,
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }

    // Get the last user message
    const lastUserMessage = messages[messages.length - 1]?.content || "";
    const firstUserMessage = messages.find(m => m.role === 'user')?.content || '';
    console.log("Last user message:", lastUserMessage);
    console.log("Is confirming check:", isConfirmingPlan(lastUserMessage));

    // Check if this is a principles or scorecard request (these are explicitly in-scope)
    const isPrinciples = isPrinciplesRequest(firstUserMessage) || isPrinciplesRequest(lastUserMessage);
    const isScorecard = isScorecardRequest(firstUserMessage) || isScorecardRequest(lastUserMessage);
    
    // Only check guardrails if NOT a known in-scope request
    if (!isPrinciples && !isScorecard) {
      const guardrailResponse = getGuardrailResponse(lastUserMessage);
      if (guardrailResponse) {
        return new Response(
          JSON.stringify({ message: guardrailResponse }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        );
      }
    }

    // Get user context for personalization
    const { basic: userContext, full: fullUserContext } = await getUserContext();

    // Build the full system prompt with user context
    let fullSystemPrompt = SYSTEM_PROMPT + userContext;

    // Add specialized prompts based on context (isPrinciples/isScorecard already detected above)
    // Scorecard customization takes priority over principles discovery
    if (isScorecard && fullUserContext) {
      // Use the full scorecard customization prompt with rich user context
      const scorecardContext = formatScorecardForContext(fullUserContext);
      fullSystemPrompt += SCORECARD_CUSTOMIZATION_PROMPT.replace('{USER_CONTEXT}', scorecardContext);
    } else if (isPrinciples) {
      fullSystemPrompt += PRINCIPLES_DISCOVERY_PROMPT;
    } else if (skillContext?.createPlan) {
      fullSystemPrompt += SKILL_LEARNING_PROMPT.replace(/\{topic\}/g, encodeURIComponent(skillContext.skillName));
    }

    // Format messages for Claude (exclude system messages, those go in system param)
    const formattedMessages = messages.map((msg) => ({
      role: msg.role as "user" | "assistant",
      content: msg.content,
    }));

    // Check if user is confirming a skill learning plan
    const isConfirming = skillContext?.createPlan && isConfirmingPlan(lastUserMessage);

    // Call Claude
    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: isConfirming ? 400 : 800, // Shorter response for confirmations
      system: fullSystemPrompt,
      messages: formattedMessages,
    });

    // Extract the text response
    const textContent = response.content.find((block) => block.type === "text");
    let messageText =
      textContent?.type === "text"
        ? textContent.text
        : "I'm here to help you on your willpower journey. What would you like to work on?";

    // Extract tasks if user confirmed a plan
    let extractedTasks: SkillTask[] = [];
    console.log("Skill context:", skillContext, "isConfirming:", isConfirming);
    if (isConfirming && skillContext?.skillName) {
      console.log("Extracting tasks from messages:", messages.length, "messages");
      extractedTasks = extractTasksFromPlan(messages, skillContext.skillName);
      console.log("Extracted tasks:", extractedTasks);
      
      // Remove the [TASKS_CONFIRMED] marker if present
      messageText = messageText.replace(/\[TASKS_CONFIRMED\]/g, '').trim();
    }

    // Extract scorecard updates if present
    const scorecardUpdates = extractScorecardUpdates(messageText);
    if (scorecardUpdates.length > 0) {
      // Remove the [SCORECARD_UPDATES] blocks from the visible message
      messageText = messageText.replace(/\[SCORECARD_UPDATES\][\s\S]*?\[\/SCORECARD_UPDATES\]/g, '').trim();
    }

    // ========== INCREMENT CONVERSATION COUNT ==========
    if (user) {
      // Get fresh count and increment
      const { data: freshProfile } = await supabase
        .from("profiles")
        .select("monthly_conversations, conversation_reset_date, subscription_status")
        .eq("id", user.id)
        .single();

      if (freshProfile) {
        const tier = getTierFromStatus(freshProfile.subscription_status);
        
        // Only increment for free tier users
        if (tier === 'free') {
          const needsReset = shouldResetConversations(freshProfile.conversation_reset_date);
          const currentCount = needsReset ? 0 : (freshProfile.monthly_conversations || 0);
          
          await supabase
            .from("profiles")
            .update({ 
              monthly_conversations: currentCount + 1,
              conversation_reset_date: needsReset ? new Date().toISOString() : freshProfile.conversation_reset_date,
            })
            .eq("id", user.id);
        }
      }
    }
    // ========== END INCREMENT ==========

    return new Response(JSON.stringify({ 
      message: messageText,
      tasks: extractedTasks.length > 0 ? extractedTasks : undefined,
      scorecardUpdates: scorecardUpdates.length > 0 ? scorecardUpdates : undefined,
    }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Chat API error:", error);

    // Handle specific Anthropic errors
    if (error instanceof Anthropic.APIError) {
      if (error.status === 401) {
        return new Response(
          JSON.stringify({
            message:
              "There's an issue with the API key configuration. Please check that ANTHROPIC_API_KEY is set correctly in your .env.local file.",
          }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        );
      }
      if (error.status === 429) {
        return new Response(
          JSON.stringify({
            message:
              "I'm getting a lot of requests right now. Please wait a moment and try again.",
          }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        );
      }
    }

    return new Response(
      JSON.stringify({
        message:
          "I encountered an issue processing your request. Please try again in a moment.",
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  }
}
