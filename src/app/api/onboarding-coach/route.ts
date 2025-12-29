import { NextRequest } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || "",
});

const ONBOARDING_SYSTEM_PROMPT = `You are Willson, the Willpowered AI Coach. Your name nods to Wilson from Castaway - you're a supportive companion.

**CRITICAL: Be concise.**
- 2-3 sentences per response (except purpose synthesis)
- Reference SPECIFIC details they shared - never generic
- One acknowledgment + one question per turn
- No lengthy preambles

Your tone: Warm but efficient. Show you're listening by using their words, then move forward quickly.`;

interface OnboardingRequest {
  prompt: string;
  context: Record<string, string>;
  userName?: string;
}

const PROMPT_TEMPLATES: Record<string, (ctx: Record<string, string>, name?: string) => string> = {
  clarify_purpose: (ctx) => `The user chose: "${ctx.choice === 'know' ? 'I know my purpose' : 'I have a vague idea'}". 

IMPORTANT: Do NOT introduce yourself - you already did that in the welcome message.

Ask them to share what they know or sense about their purpose. Be warm and encouraging. 
Keep it to 2-3 sentences. End with a clear question inviting them to share.`,

  start_discovery: () => `The user wants help discovering their purpose. 

IMPORTANT: Do NOT introduce yourself - you already did that. Just get straight into the discovery.

Say something brief like "Let's discover what truly drives you. I'll ask a few questions - just go with your gut."
Then ask the first question: "When was the last time you completely lost track of time because you were so absorbed in something? What were you doing? How did it feel?"

Keep it to 2-3 sentences total before the question. No "Hey there" or "I'm Willson" - skip all that.`,

  discovery_transition: (ctx) => `The user answered question about "${ctx.previousQuestion}":
"${ctx.previousAnswer}"

This is question ${ctx.questionNumber} of ${ctx.totalQuestions}.

Your task:
1. Acknowledge their specific answer warmly (1-2 sentences that reference what they actually said)
2. Optionally share a brief insight about what this reveals
3. Then ask the next question: "${ctx.nextQuestion}"

Be genuine and specific. Reference details from their answer. Don't be generic.`,

  synthesize_purpose: (ctx) => {
    const answers = JSON.parse(ctx.allAnswers || "{}");
    return `The user completed all discovery questions. Here are their answers:

- Flow state (lost track of time): "${answers.loseTrackOfTime || 'not provided'}"
- Frustrations (problems that anger them): "${answers.problemsThatAngerYou || 'not provided'}"
- If money no object: "${answers.whatIfMoneyNoFactor || 'not provided'}"
- Who they admire and why: "${answers.whoYouAdmire || 'not provided'}"
- What they'd regret not attempting: "${answers.whatYoudRegretNotAttempting || 'not provided'}"

Your task:
1. Reflect back what you heard, weaving together the SPECIFIC themes from their answers (not generic summaries)
2. Identify the common threads connecting their answers
3. Craft a personalized purpose statement that incorporates the specific things they care about (travel, healthcare, family, or whatever they mentioned)
4. Ask if this resonates or if they'd like to adjust it

The purpose statement should feel like it was written FOR them, using their actual words and themes. Do NOT use generic phrases like "help others overcome challenges" unless that's what they actually said.`;
  },

  confirm_purpose: (ctx) => `The user shared their purpose idea:
"${ctx.sharedPurpose}"

Acknowledge what they shared with genuine appreciation. Reflect back what you heard.
Ask if this feels complete or if they'd like to refine it. Keep it warm and brief (2-3 sentences).`,

  confirm_adjusted_purpose: (ctx) => {
    if (ctx.refinementRequest) {
      // They want to refine an existing purpose
      return `The user wants to refine their purpose. Current purpose:
"${ctx.newPurpose}"

Their feedback: "${ctx.refinementRequest}"

Help them refine it. Ask a specific clarifying question about what they'd like to change or what feels off. Be collaborative and curious. Keep it to 2-3 sentences.`;
    }
    // They provided a new/adjusted purpose
    return `The user adjusted their purpose to:
"${ctx.newPurpose}"

Affirm this new version warmly in 1 sentence. Note what's powerful about it.
Then ask ONE clear question: "Does this feel complete, or would you like to adjust anything?"
Do NOT ask if they're ready - just ask if the purpose statement itself feels right. Keep it to 2 sentences max.`;
  },

  transition_to_goal: (ctx) => `The user confirmed their purpose:
"${ctx.purpose}"

Celebrate briefly (1 sentence), then transition to goal-setting.
Explain that purpose without action is just dreaming, so you'll define a concrete goal.
Ask: "What's one meaningful goal you want to accomplish in the next 3-12 months that moves you toward this purpose?"

Reference their specific purpose in your transition. Keep it to 3-4 sentences total.`,

  ask_goal_why: (ctx) => `The user's goal is:
"${ctx.goal}"

Their purpose is: "${ctx.purpose}"

Acknowledge their goal with enthusiasm (be specific about what they chose).
Then ask the crucial "why" question: "Why does this goal matter to you? Not the surface reason, the real one. The one that will get you out of bed on the hard days."

Keep it to 2-3 sentences.`,

  complete_onboarding: (ctx) => {
    const answers = JSON.parse(ctx.allAnswers || "{}");
    return `The user has completed onboarding.
Name: ${ctx.userName}
Purpose: "${ctx.purpose}"
Goal: "${ctx.goal}"
Why it matters: "${ctx.goalWhy}"
Discovery answers: ${JSON.stringify(answers)}

Write a warm, personalized completion message that:
1. Uses their name
2. Celebrates what they've accomplished (be specific)
3. Reflects back their purpose and goal
4. Previews what's next (dashboard, habit tracking, you'll be there to help)
5. Ends with encouragement about day one of their journey

Make it personal by referencing specific things from their answers. This should feel like a message written just for them, not a template. Keep it to 4-6 sentences.

End with: "**Ready to see your dashboard?**"`;
  },
};

export async function POST(request: NextRequest) {
  try {
    const body: OnboardingRequest = await request.json();
    const { prompt, context, userName } = body;

    if (!process.env.ANTHROPIC_API_KEY) {
      return new Response(
        JSON.stringify({ message: "Thank you for sharing that. Let's continue..." }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }

    const promptTemplate = PROMPT_TEMPLATES[prompt];
    if (!promptTemplate) {
      return new Response(
        JSON.stringify({ message: "Thank you for sharing that. Let's continue..." }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }

    const userPrompt = promptTemplate(context, userName);

    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 350,
      system: ONBOARDING_SYSTEM_PROMPT,
      messages: [{ role: "user", content: userPrompt }],
    });

    const textContent = response.content.find((block) => block.type === "text");
    const message = textContent?.type === "text" ? textContent.text : "Thank you for sharing that with me. Let's continue...";

    return new Response(
      JSON.stringify({ message }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Onboarding coach error:", error);
    return new Response(
      JSON.stringify({ message: "Thank you for sharing that. Let's keep going..." }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  }
}

