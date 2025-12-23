import { NextRequest } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@supabase/supabase-js";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || "",
});

// Create a Supabase client with service role key for server-side operations (bypasses RLS)
// Falls back to anon key if service role not available
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
);

interface Message {
  role: "coach" | "user";
  content: string;
}

interface JourneyRequest {
  prompt: string;
  context: {
    stepId: string;
    goal: string;
    goalWhy: string;
    purpose: string;
    userName: string;
    userId?: string;
    conversationHistory?: Message[];
    stepData?: Record<string, string>;
  };
}

const JOURNEY_SYSTEM_PROMPT = `You are Willson, the Willpowered AI Coach. Your name nods to Wilson from Castaway - you're a supportive companion through the user's journey.

You guide users through the 7-step Willpower methodology: Purpose → Skills → Habits → Grit → Setbacks → Limits → Perseverance.

**CRITICAL: Be concise.**
- Max 2-3 short paragraphs per response
- Lead with the key point, then support briefly
- One question at a time
- No lengthy preambles or excessive encouragement
- Get to the point quickly

Your tone: Warm but efficient. Substantive, not fluffy. Like a wise friend who respects their time.

Reference heroes (Kobe, J.K. Rowling, Buffett) only when directly relevant - don't force it.`;

const STEP_PROMPTS: Record<string, {
  initial: string;
  revisit: string;
  completionKeyword: string;
  extractFields?: string[];
}> = {
  skills: {
    initial: `Start the "Acquiring Skills" conversation. The user has completed their purpose and goal.

Their goal: "{goal}"
Their purpose: "{purpose}"
Their name: "{userName}"

Be DIRECT and efficient:
1. One sentence acknowledging this step
2. Ask: "For your goal, what 3-5 skills do you think you'll need to learn? Just list them out."

That's it. No lengthy explanation. Get straight to the skill identification.`,
    revisit: `The user is revisiting the "Acquiring Skills" step.

Their goal: "{goal}"
Their purpose: "{purpose}"

Ask what they'd like to adjust about their skill list. Be brief.`,
    completionKeyword: "complete|finish|done|set|ready|all set|good|yes|sounds|looks|that's|perfect|right|correct",
    extractFields: ["skillsToLearn", "learningPlan"],
  },
  habits: {
    initial: `Start the "Establishing Habits" conversation. The user has identified their skills to develop.

Their goal: "{goal}"
Their purpose: "{purpose}"
Their name: "{userName}"

Your task:
1. Celebrate their progress - they've done purpose, skills, and now habits!
2. Explain that habits are the secret weapon - they automate the hard work
3. Ask: "Based on your goal, what daily or weekly habits would move you forward consistently?"

Give 1 brief example, then ask. Keep it short.`,
    revisit: `The user is revisiting their habits. Help them adjust.

Their goal: "{goal}"

Ask what's working and what's not. Help them refine.`,
    completionKeyword: "these habits|commit|ready|let's do|locked in",
    extractFields: ["habits"],
  },
  grit: {
    initial: `Start the "Becoming Gritty" conversation.

Their goal: "{goal}"
Their purpose: "{purpose}"
Their name: "{userName}"

Explain that grit is passion + perseverance over the long haul. It's what separates those who achieve from those who quit.

Ask: "What has kept you going in the past when things got hard? And what tends to make you want to quit?"

This helps them understand their grit patterns.`,
    revisit: `Help them strengthen their grit. Ask about recent challenges and how they've been handling them.`,
    completionKeyword: "understand|got it|makes sense|committed",
    extractFields: ["gritStrengths", "gritChallenges"],
  },
  setbacks: {
    initial: `Start the "Handling Setbacks" conversation.

Their goal: "{goal}"
Their purpose: "{purpose}"

Be real with them: setbacks WILL happen. The question isn't if, but when and how they'll respond.

Share a brief example of a hero who faced setbacks (J.K. Rowling rejected 12 times, Kobe's injuries, etc.)

Then ask: "What setbacks are you most worried about? And what's your plan for when they happen?"`,
    revisit: `Help them work through a current setback or refine their recovery strategies.`,
    completionKeyword: "plan|prepared|ready|handle it",
    extractFields: ["potentialSetbacks", "recoveryPlan"],
  },
  limits: {
    initial: `Start the "Overcoming Limits" conversation.

Their goal: "{goal}"
Their purpose: "{purpose}"

Most limits are mental, not physical. Ask them to identify the limiting beliefs or barriers that might hold them back.

"What voice in your head tries to convince you that you can't do this? What does it say?"`,
    revisit: `Help them work through limiting beliefs that have emerged.`,
    completionKeyword: "see it|clear|understand|break through",
    extractFields: ["limitingBeliefs", "counterBeliefs"],
  },
  perseverance: {
    initial: `Start the "Persevering" conversation - this is the final step!

Their goal: "{goal}"
Their purpose: "{purpose}"
Their name: "{userName}"

Celebrate how far they've come! They've built the entire framework.

Now it's about consistent action. Ask:
"What does success look like for you in 30 days? 90 days? 1 year?"

Help them visualize the compound effect of small consistent actions.`,
    revisit: `Check in on their perseverance. Ask about their consistency and what's helping them stay on track.`,
    completionKeyword: "ready|let's go|committed|starting|begin",
    extractFields: ["milestones"],
  },
  purpose: {
    initial: `The user wants to revisit their purpose. 

Current purpose: "{purpose}"

Ask what's prompting them to revisit. Is something not feeling right? Have they learned something new about themselves?

IMPORTANT: When the user shares a new purpose statement or refines their existing one, acknowledge it warmly and confirm you'll update it. Look for statements like "my purpose is...", "I want to...", "my why is..." etc.`,
    revisit: `Help them refine their purpose statement.

Current purpose: "{purpose}"

Ask what feels off and what they'd like to change.

IMPORTANT: When the user shares a new purpose statement, confirm it and let them know it's been updated. Look for purpose-like statements in their messages.`,
    completionKeyword: "feels right|resonates|perfect|love it|that's it|yes|exactly",
    extractFields: ["purpose"],
  },
};

function buildPrompt(template: string, context: Record<string, unknown>): string {
  return template.replace(/{(\w+)}/g, (match, key) => {
    const value = context[key];
    return typeof value === 'string' ? value : match;
  });
}

export async function POST(request: NextRequest) {
  try {
    const body: JourneyRequest = await request.json();
    const { prompt, context } = body;

    if (!process.env.ANTHROPIC_API_KEY) {
      return new Response(
        JSON.stringify({ message: "Let's work on this together. What questions do you have?" }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }

    let userPrompt = "";
    let isStepComplete = false;
    let extractedData: Record<string, string> = {};

    if (prompt === "continue_conversation") {
      // Build conversation context
      const history = context.conversationHistory || [];
      const stepConfig = STEP_PROMPTS[context.stepId];
      
      // Check if user is indicating completion
      const lastUserMessage = history[history.length - 1]?.content || "";
      if (stepConfig?.completionKeyword) {
        const completionRegex = new RegExp(stepConfig.completionKeyword, "i");
        if (completionRegex.test(lastUserMessage)) {
          isStepComplete = true;
        }
      }

      // Build the conversation prompt
      const conversationText = history
        .map((m) => `${m.role === "user" ? "User" : "Coach"}: ${m.content}`)
        .join("\n\n");

      // For skills step, extract and save the skills from the conversation
      if (context.stepId === "skills" && context.userId) {
        console.log("Extracting skills for user:", context.userId);
        console.log("Conversation text:", conversationText.substring(0, 500));
        
        const skillsExtractionPrompt = `Analyze this conversation and extract ALL skills/knowledge the user mentions they need to acquire.

Conversation:
${conversationText}

Return a JSON array of skills. Each skill should have:
- "title": short name of the skill (2-5 words)
- "description": brief description of why they need it (1 sentence)

Example: [{"title": "Public Speaking", "description": "To pitch my product to investors"}]

Be thorough - if the user mentioned ANY skills, include them all.
If no clear skills mentioned, return []. Return ONLY valid JSON array, nothing else.`;

        try {
          const extractionResponse = await anthropic.messages.create({
            model: "claude-sonnet-4-20250514",
            max_tokens: 500,
            messages: [{ role: "user", content: skillsExtractionPrompt }],
          });

          const extractedText = extractionResponse.content.find((block) => block.type === "text");
          const skillsJson = extractedText?.type === "text" ? extractedText.text.trim() : "[]";
          
          console.log("Extracted skills JSON:", skillsJson);

          try {
            const skills = JSON.parse(skillsJson);
            console.log("Parsed skills:", skills);
            
            if (Array.isArray(skills) && skills.length > 0) {
              // Add id and status to each skill
              const skillsWithStatus = skills.map((s: { title: string; description: string }, index: number) => ({
                id: `skill-${Date.now()}-${index}`,
                title: s.title,
                description: s.description,
                status: "to_learn",
                added_at: new Date().toISOString(),
                tasks: [],
              }));

              console.log("Saving skills to profile:", skillsWithStatus);
              
              const { error: updateError } = await supabase
                .from("profiles")
                .update({ skills_to_learn: skillsWithStatus })
                .eq("id", context.userId);

              if (updateError) {
                console.error("Supabase update error:", updateError);
              } else {
                console.log("Skills saved successfully!");
                extractedData.skills = JSON.stringify(skillsWithStatus);
              }
            }
          } catch (parseError) {
            console.error("Skills JSON parse error:", parseError, "Raw JSON:", skillsJson);
          }
        } catch (extractionError) {
          console.error("Skills extraction error:", extractionError);
        }
      }

      // For purpose step, try to extract and save the purpose from the conversation
      if (context.stepId === "purpose" && context.userId) {
        const purposeExtractionPrompt = `Analyze this conversation and extract the user's purpose statement if they've shared one.

Conversation:
${conversationText}

If the user has clearly stated their purpose (look for phrases like "my purpose is", "I want to", "my why is", "to help others", etc.), return ONLY the purpose statement. 
If they haven't clearly stated a purpose yet, return "NO_PURPOSE_FOUND".

Return just the purpose text or "NO_PURPOSE_FOUND", nothing else.`;

        try {
          const extractionResponse = await anthropic.messages.create({
            model: "claude-sonnet-4-20250514",
            max_tokens: 200,
            messages: [{ role: "user", content: purposeExtractionPrompt }],
          });

          const extractedText = extractionResponse.content.find((block) => block.type === "text");
          const extractedPurpose = extractedText?.type === "text" ? extractedText.text.trim() : null;

          if (extractedPurpose && extractedPurpose !== "NO_PURPOSE_FOUND" && extractedPurpose.length > 10) {
            // Save the extracted purpose to the database
            await supabase
              .from("profiles")
              .update({ purpose_statement: extractedPurpose })
              .eq("id", context.userId);
            
            extractedData.purpose = extractedPurpose;
          }
        } catch (extractionError) {
          console.error("Purpose extraction error:", extractionError);
        }
      }

      if (isStepComplete) {
        userPrompt = `The user seems ready to complete the "${context.stepId}" step.

Conversation so far:
${conversationText}

Their goal: "${context.goal}"
Their purpose: "${context.purpose}"

Provide a brief wrap-up (2 sentences max):
1. Confirm what you've captured for this step
2. Say you've saved it to their dashboard

End with "Ready to continue?"`;
      } else if (context.stepId === "skills") {
        // Special handling for skills - wrap up quickly once skills are mentioned
        userPrompt = `Continue the skills conversation but WRAP IT UP FAST.

Conversation so far:
${conversationText}

IMPORTANT: If the user has listed ANY skills (even just 1-2), immediately:
1. Repeat back the skills you heard (as a quick list)
2. Ask "Should I add these to your dashboard, or do you want to add more?"

Do NOT keep asking more questions. Do NOT give lengthy advice. Just confirm and offer to save.
2 sentences max.`;
      } else {
        userPrompt = `Continue the "${context.stepId}" coaching conversation.

Conversation so far:
${conversationText}

Their goal: "${context.goal}"
Their purpose: "${context.purpose}"

BE CONCISE: 2-3 sentences max, then one clear question.
Reference what they shared specifically. No lengthy explanations.
If they seem ready, ask if they want to move on.`;
      }
    } else {
      // Initial or revisit prompt
      const stepConfig = STEP_PROMPTS[context.stepId];
      const promptTemplate = prompt.includes("revisit") 
        ? stepConfig?.revisit 
        : stepConfig?.initial;
      
      if (promptTemplate) {
        userPrompt = buildPrompt(promptTemplate, context);
      } else {
        userPrompt = `Start a coaching conversation about "${context.stepId}" for someone with goal: "${context.goal}"`;
      }
    }

    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 400,
      system: JOURNEY_SYSTEM_PROMPT,
      messages: [{ role: "user", content: userPrompt }],
    });

    const textContent = response.content.find((block) => block.type === "text");
    const message = textContent?.type === "text" 
      ? textContent.text 
      : "Let's work on this step together. What's on your mind?";

    return new Response(
      JSON.stringify({ 
        message,
        stepComplete: isStepComplete,
        stepData: isStepComplete ? extractedData : undefined,
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Journey coach error:", error);
    return new Response(
      JSON.stringify({ message: "I had a moment there. Could you share that again?" }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  }
}

