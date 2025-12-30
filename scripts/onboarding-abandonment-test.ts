/**
 * Onboarding Abandonment Test
 * 
 * Tests onboarding with skeptical personas who WILL abandon if:
 * - They get confused
 * - They lose patience
 * - They don't see value
 * - The experience feels generic
 * 
 * Each persona has specific abandonment triggers based on their personality.
 */

import Anthropic from '@anthropic-ai/sdk';

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const API_URL = process.env.API_URL || 'https://willpowered.com';

if (!ANTHROPIC_API_KEY) {
  console.error('❌ ANTHROPIC_API_KEY is required');
  process.exit(1);
}

const anthropic = new Anthropic({ apiKey: ANTHROPIC_API_KEY });

// ============================================================================
// SKEPTICAL PERSONA DEFINITIONS
// ============================================================================

interface SkepticalPersona {
  name: string;
  age: number;
  occupation: string;
  background: string;
  skepticismType: string;
  abandonmentTriggers: string[];
  patienceLevel: 'low' | 'medium' | 'high';
  openingMessage: string;
  innerMonologue: string;
}

const SKEPTICAL_PERSONAS: SkepticalPersona[] = [
  {
    name: "Derek Chen",
    age: 38,
    occupation: "VP of Engineering",
    background: "Has tried Headspace, Calm, Noom, and 5 other self-improvement apps. Spent thousands on courses. Nothing sticks past 2 weeks. Extremely busy - only downloaded this because his wife insisted.",
    skepticismType: "App fatigue - been burned too many times",
    abandonmentTriggers: [
      "Generic advice that could apply to anyone",
      "Too many questions before showing value",
      "Feels like every other app he's tried",
      "Asks him to commit before proving worth",
      "More than 3 exchanges without clear direction"
    ],
    patienceLevel: "low",
    openingMessage: "My wife made me try this. I've used a dozen apps like this and they all fail after a week. What makes this different?",
    innerMonologue: "Here we go again. Let's see how long before I hear 'set SMART goals' or 'build habits.' If this is the same recycled advice, I'm out."
  },
  {
    name: "Priya Sharma",
    age: 29,
    occupation: "ER Nurse (Night Shift)",
    background: "Works 12-hour overnight shifts. Chronically sleep-deprived. Has exactly zero patience for anything that wastes her time. Downloaded this during a 3am break hoping it might help with burnout.",
    skepticismType: "Zero patience - needs immediate value",
    abandonmentTriggers: [
      "Long-winded responses",
      "Philosophical questions when she needs practical help",
      "Anything that feels like homework",
      "More than 2 back-and-forths without a clear plan",
      "Advice that ignores her shift work reality"
    ],
    patienceLevel: "low",
    openingMessage: "I work nights, I'm exhausted, and I have maybe 5 minutes before I need to check on patients. Can you actually help or is this going to be another waste of time?",
    innerMonologue: "I don't have time for 'what's your deeper purpose' nonsense. I just need something actionable. If this takes more than 5 minutes to show value, I'm closing the app."
  },
  {
    name: "Marcus Thompson",
    age: 52,
    occupation: "Retired Military, Now Security Consultant",
    background: "Spent 25 years in the Army. Deeply skeptical of 'soft' approaches. His therapist recommended trying something for anger management and work-life balance. He thinks self-help is for weak people but promised he'd try.",
    skepticismType: "Culturally skeptical - thinks this is 'soft' stuff",
    abandonmentTriggers: [
      "Touchy-feely language",
      "Anything that feels condescending",
      "Celebrity examples he doesn't respect",
      "Being asked to 'explore feelings'",
      "Perceived lack of structure or discipline"
    ],
    patienceLevel: "medium",
    openingMessage: "My therapist said I should try this. I think it's probably nonsense but I told her I'd give it a shot. So what is this exactly?",
    innerMonologue: "If this thing starts talking about 'manifesting' or 'energy' I'm done. I need structure and accountability, not feelings."
  },
  {
    name: "Zoe Martinez",
    age: 24,
    occupation: "Content Creator (struggling)",
    background: "Has ADHD. Her attention span is measured in seconds. She's tried dozens of productivity apps - they all feel like chores. Downloaded this because someone on TikTok mentioned it.",
    skepticismType: "ADHD brain - needs instant engagement",
    abandonmentTriggers: [
      "Walls of text",
      "Boring or predictable responses",
      "Feels like a chore or homework",
      "Too many steps before seeing something interesting",
      "Generic questions that don't hook her curiosity"
    ],
    patienceLevel: "low",
    openingMessage: "ok so I have adhd and like zero attention span. most apps lose me in 30 seconds. can you actually keep up or nah?",
    innerMonologue: "Already kind of bored. If the next message is a paragraph I'm definitely closing this. Show me something interesting or I'm gone."
  },
  {
    name: "Robert Okafor",
    age: 45,
    occupation: "Small Business Owner (Dry Cleaning Chain)",
    background: "Works 60+ hours a week running 3 dry cleaning locations. His doctor told him his blood pressure is dangerously high. Skeptical of anything 'tech' - his 19-year-old daughter installed this on his phone.",
    skepticismType: "Tech skeptic - doesn't trust AI or apps",
    abandonmentTriggers: [
      "Anything that feels too 'tech-y' or AI-generated",
      "Advice that doesn't understand small business reality",
      "Being talked down to",
      "Features or concepts that need explanation",
      "Feeling like he's talking to a robot"
    ],
    patienceLevel: "medium",
    openingMessage: "My daughter put this on my phone. She says it's supposed to help with stress or something. I don't really trust these AI things but she won't leave me alone about it. What do you want from me?",
    innerMonologue: "This is probably just going to tell me to meditate. I don't have time to meditate. I have three stores to run and employees who call in sick."
  },
  {
    name: "Lisa Park",
    age: 31,
    occupation: "Corporate Lawyer",
    background: "Brilliant, analytical, and deeply cynical. She picks apart arguments for a living. Downloaded this to 'prove it's BS' after a colleague wouldn't stop talking about it.",
    skepticismType: "Intellectual skeptic - looking for logical flaws",
    abandonmentTriggers: [
      "Logical inconsistencies or vague claims",
      "Platitudes without evidence",
      "Oversimplification of complex issues",
      "Being asked to accept things on faith",
      "Anything that sounds like pseudoscience"
    ],
    patienceLevel: "high",
    openingMessage: "A colleague won't stop talking about this app. I'm skeptical of anything that promises 'transformation' but I'm willing to engage if you can actually substantiate your approach. What's the evidence that this works?",
    innerMonologue: "Let's see how long before the logical fallacies start. If this is just motivational quotes dressed up as methodology, I'm writing a scathing review."
  }
];

// ============================================================================
// ABANDONMENT TESTING
// ============================================================================

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface AbandonmentResult {
  persona: SkepticalPersona;
  abandoned: boolean;
  abandonedAt: number;  // Exchange number
  abandonmentReason: string | null;
  frustrationPoints: string[];
  positivePoints: string[];
  messages: Message[];
  wouldReturn: boolean;
  wouldRecommend: boolean;
  overallScore: number;  // 1-10
}

async function callWillsonAPI(messages: Message[]): Promise<string> {
  try {
    const response = await fetch(`${API_URL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages })
    });

    if (!response.ok) {
      throw new Error(`API returned ${response.status}`);
    }

    const data = await response.json();
    return data.message || "I'm here to help.";
  } catch (error) {
    console.error('API Error:', error);
    return "I'm here to help. What's on your mind?";
  }
}

async function simulatePersonaResponse(
  persona: SkepticalPersona,
  conversationHistory: Message[],
  exchangeNumber: number
): Promise<{
  response: string;
  shouldAbandon: boolean;
  abandonReason: string | null;
  frustration: string | null;
  positive: string | null;
}> {
  const lastWillsonMessage = conversationHistory[conversationHistory.length - 1]?.content || '';
  
  const prompt = `You are ${persona.name}, a ${persona.age}-year-old ${persona.occupation}.

CRITICAL: You are a REAL user testing an app. You WILL abandon if the experience is bad.

## Your Background
${persona.background}

## Your Skepticism Type
${persona.skepticismType}

## Your Inner Monologue (how you're feeling)
${persona.innerMonologue}

## Things That Will Make You ABANDON (close the app and never return):
${persona.abandonmentTriggers.map((t, i) => `${i + 1}. ${t}`).join('\n')}

## Your Patience Level: ${persona.patienceLevel.toUpperCase()}
${persona.patienceLevel === 'low' ? 'You will abandon QUICKLY if not impressed.' : 
  persona.patienceLevel === 'medium' ? 'You\'ll give it a fair shot but won\'t tolerate much friction.' :
  'You\'ll persist longer but still have limits.'}

## Current Exchange: ${exchangeNumber} of max 6

---

## Conversation So Far:
${conversationHistory.map(m => `${m.role === 'user' ? persona.name : 'Willson'}: ${m.content}`).join('\n\n')}

---

## Your Task:
Evaluate Willson's last message through ${persona.name}'s eyes. Decide if you would:
1. CONTINUE - respond naturally and keep engaging
2. ABANDON - close the app because something triggered you

Be HONEST. Real users abandon apps all the time. If this experience isn't working for you, abandon.

Consider:
- Did the response feel personalized or generic?
- Did it waste your time?
- Did it give you value or just ask more questions?
- Would someone like you actually continue or close the app?

Respond in this exact JSON format:
{
  "shouldAbandon": true/false,
  "abandonReason": "If abandoning: exactly why (be specific). If continuing: null",
  "frustration": "Something that annoyed you (even if continuing), or null",
  "positive": "Something you actually liked, or null",
  "response": "Your next message to Willson (if abandoning, this is your final message showing you're leaving, like 'Yeah this isn't for me' or just nothing)"
}

Remember: You're ${persona.name}. Stay in character. Be honest about whether you'd actually continue.`;

  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 800,
      messages: [{ role: 'user', content: prompt }]
    });

    const content = response.content[0];
    if (content.type !== 'text') {
      throw new Error('Unexpected response type');
    }

    const jsonMatch = content.text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return { 
        response: "I'll think about it.", 
        shouldAbandon: false, 
        abandonReason: null,
        frustration: null,
        positive: null
      };
    }

    return JSON.parse(jsonMatch[0]);
  } catch (error) {
    console.error('Error generating persona response:', error);
    return { 
      response: "Hmm, let me think about that.", 
      shouldAbandon: false, 
      abandonReason: null,
      frustration: null,
      positive: null
    };
  }
}

async function generatePostMortem(
  persona: SkepticalPersona,
  result: AbandonmentResult
): Promise<{
  wouldReturn: boolean;
  wouldRecommend: boolean;
  overallScore: number;
  summary: string;
}> {
  const prompt = `You are ${persona.name}. You just ${result.abandoned ? 'abandoned' : 'completed'} the Willpowered onboarding.

## The Experience:
${result.messages.map(m => `${m.role === 'user' ? 'You' : 'Willson'}: ${m.content}`).join('\n\n')}

## Frustration Points:
${result.frustrationPoints.length > 0 ? result.frustrationPoints.join('\n') : 'None noted'}

## Positive Points:
${result.positivePoints.length > 0 ? result.positivePoints.join('\n') : 'None noted'}

${result.abandoned ? `## Why You Abandoned:\n${result.abandonmentReason}` : '## You completed onboarding'}

---

As ${persona.name}, honestly evaluate:

1. **Would you ever come back to this app?** (not "should you" - WOULD you actually?)
2. **Would you recommend it to a friend?** (honestly)
3. **Overall score 1-10?** (1 = terrible, 10 = amazing)
4. **One sentence summary of your experience**

Respond in JSON:
{
  "wouldReturn": true/false,
  "wouldRecommend": true/false,
  "overallScore": 1-10,
  "summary": "One sentence summary"
}`;

  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 300,
      messages: [{ role: 'user', content: prompt }]
    });

    const content = response.content[0];
    if (content.type !== 'text') throw new Error('Unexpected');

    const jsonMatch = content.text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('No JSON');

    return JSON.parse(jsonMatch[0]);
  } catch {
    return {
      wouldReturn: !result.abandoned,
      wouldRecommend: false,
      overallScore: result.abandoned ? 3 : 6,
      summary: result.abandoned ? "Didn't work for me." : "It was okay."
    };
  }
}

async function testPersonaOnboarding(persona: SkepticalPersona): Promise<AbandonmentResult> {
  console.log(`\n${"─".repeat(60)}`);
  console.log(`🧪 Testing: ${persona.name}`);
  console.log(`   ${persona.occupation} | Patience: ${persona.patienceLevel.toUpperCase()}`);
  console.log(`   Skepticism: ${persona.skepticismType}`);
  console.log(`${"─".repeat(60)}`);

  const messages: Message[] = [];
  const frustrationPoints: string[] = [];
  const positivePoints: string[] = [];
  let abandoned = false;
  let abandonmentReason: string | null = null;
  let exchangeNumber = 0;

  // Add opening message
  messages.push({ role: 'user', content: persona.openingMessage });
  console.log(`\n   📤 ${persona.name}: "${persona.openingMessage.substring(0, 60)}..."`);

  const maxExchanges = persona.patienceLevel === 'low' ? 4 : 
                       persona.patienceLevel === 'medium' ? 5 : 6;

  while (!abandoned && exchangeNumber < maxExchanges) {
    exchangeNumber++;
    console.log(`\n   Exchange ${exchangeNumber}/${maxExchanges}...`);

    // Get Willson's response
    const willsonResponse = await callWillsonAPI(messages);
    messages.push({ role: 'assistant', content: willsonResponse });
    console.log(`   🤖 Willson: "${willsonResponse.substring(0, 80)}..."`);

    // Get persona's reaction
    const reaction = await simulatePersonaResponse(persona, messages, exchangeNumber);

    if (reaction.frustration) {
      frustrationPoints.push(reaction.frustration);
      console.log(`   😤 Frustration: ${reaction.frustration.substring(0, 50)}...`);
    }
    if (reaction.positive) {
      positivePoints.push(reaction.positive);
      console.log(`   👍 Positive: ${reaction.positive.substring(0, 50)}...`);
    }

    if (reaction.shouldAbandon) {
      abandoned = true;
      abandonmentReason = reaction.abandonReason;
      if (reaction.response && reaction.response.trim()) {
        messages.push({ role: 'user', content: reaction.response });
      }
      console.log(`\n   ❌ ABANDONED at exchange ${exchangeNumber}`);
      console.log(`   📝 Reason: ${abandonmentReason}`);
    } else {
      messages.push({ role: 'user', content: reaction.response });
      console.log(`   📤 ${persona.name}: "${reaction.response.substring(0, 60)}..."`);
    }

    // Rate limit
    await new Promise(r => setTimeout(r, 500));
  }

  if (!abandoned) {
    console.log(`\n   ✅ COMPLETED onboarding (${exchangeNumber} exchanges)`);
  }

  // Generate post-mortem
  const result: AbandonmentResult = {
    persona,
    abandoned,
    abandonedAt: abandoned ? exchangeNumber : -1,
    abandonmentReason,
    frustrationPoints,
    positivePoints,
    messages,
    wouldReturn: false,
    wouldRecommend: false,
    overallScore: 5
  };

  const postMortem = await generatePostMortem(persona, result);
  result.wouldReturn = postMortem.wouldReturn;
  result.wouldRecommend = postMortem.wouldRecommend;
  result.overallScore = postMortem.overallScore;

  console.log(`\n   📊 Post-Mortem:`);
  console.log(`      Score: ${result.overallScore}/10`);
  console.log(`      Would Return: ${result.wouldReturn ? '✅' : '❌'}`);
  console.log(`      Would Recommend: ${result.wouldRecommend ? '✅' : '❌'}`);
  console.log(`      Summary: "${postMortem.summary}"`);

  return result;
}

// ============================================================================
// PRODUCT ANALYSIS
// ============================================================================

function generateProductPlan(results: AbandonmentResult[]): void {
  console.log(`\n${"═".repeat(70)}`);
  console.log(`📋 PRODUCT IMPROVEMENT PLAN`);
  console.log(`${"═".repeat(70)}`);

  // Calculate metrics
  const abandonmentRate = results.filter(r => r.abandoned).length / results.length;
  const avgScore = results.reduce((sum, r) => sum + r.overallScore, 0) / results.length;
  const returnRate = results.filter(r => r.wouldReturn).length / results.length;
  const recommendRate = results.filter(r => r.wouldRecommend).length / results.length;

  console.log(`\n## Executive Summary`);
  console.log(`   Abandonment Rate: ${(abandonmentRate * 100).toFixed(0)}%`);
  console.log(`   Average Score: ${avgScore.toFixed(1)}/10`);
  console.log(`   Would Return: ${(returnRate * 100).toFixed(0)}%`);
  console.log(`   Would Recommend: ${(recommendRate * 100).toFixed(0)}%`);

  // Collect all frustrations
  const allFrustrations = results.flatMap(r => r.frustrationPoints);
  const allPositives = results.flatMap(r => r.positivePoints);
  const abandonReasons = results.filter(r => r.abandoned).map(r => ({
    persona: r.persona.name,
    reason: r.abandonmentReason,
    exchangeNumber: r.abandonedAt,
    skepticismType: r.persona.skepticismType
  }));

  console.log(`\n## Abandonment Analysis`);
  console.log(`${"─".repeat(50)}`);
  
  if (abandonReasons.length === 0) {
    console.log(`   🎉 No users abandoned! (But review frustrations below)`);
  } else {
    abandonReasons.forEach(a => {
      console.log(`\n   ❌ ${a.persona} (${a.skepticismType})`);
      console.log(`      Left at: Exchange ${a.exchangeNumber}`);
      console.log(`      Reason: ${a.reason}`);
    });
  }

  // Categorize frustrations
  const frustrationCategories: Record<string, string[]> = {
    'Too Long/Slow': [],
    'Generic/Impersonal': [],
    'Confusing Flow': [],
    'Irrelevant Content': [],
    'Tech/AI Issues': [],
    'Tone Problems': [],
    'Other': []
  };

  allFrustrations.forEach(f => {
    const lower = f.toLowerCase();
    if (lower.includes('long') || lower.includes('slow') || lower.includes('wait') || lower.includes('time')) {
      frustrationCategories['Too Long/Slow'].push(f);
    } else if (lower.includes('generic') || lower.includes('anyone') || lower.includes('personal')) {
      frustrationCategories['Generic/Impersonal'].push(f);
    } else if (lower.includes('confus') || lower.includes('unclear') || lower.includes('lost')) {
      frustrationCategories['Confusing Flow'].push(f);
    } else if (lower.includes('irrelevant') || lower.includes('doesn\'t apply') || lower.includes('example')) {
      frustrationCategories['Irrelevant Content'].push(f);
    } else if (lower.includes('ai') || lower.includes('robot') || lower.includes('tech')) {
      frustrationCategories['Tech/AI Issues'].push(f);
    } else if (lower.includes('tone') || lower.includes('condescend') || lower.includes('soft')) {
      frustrationCategories['Tone Problems'].push(f);
    } else {
      frustrationCategories['Other'].push(f);
    }
  });

  console.log(`\n## Frustration Categories`);
  console.log(`${"─".repeat(50)}`);
  Object.entries(frustrationCategories)
    .filter(([_, items]) => items.length > 0)
    .sort((a, b) => b[1].length - a[1].length)
    .forEach(([category, items]) => {
      console.log(`\n   📌 ${category} (${items.length} instances)`);
      items.slice(0, 3).forEach(item => {
        console.log(`      • ${item.substring(0, 70)}${item.length > 70 ? '...' : ''}`);
      });
    });

  console.log(`\n## What Worked`);
  console.log(`${"─".repeat(50)}`);
  if (allPositives.length === 0) {
    console.log(`   ⚠️ No positive feedback recorded`);
  } else {
    allPositives.forEach(p => {
      console.log(`   ✅ ${p}`);
    });
  }

  // Generate recommendations
  console.log(`\n## 🎯 RECOMMENDED FIXES (Priority Order)`);
  console.log(`${"═".repeat(50)}`);

  const recommendations: Array<{priority: string; issue: string; fix: string; effort: string}> = [];

  // Analyze patterns and generate recommendations
  if (frustrationCategories['Too Long/Slow'].length >= 2 || 
      abandonReasons.some(a => a.reason?.toLowerCase().includes('time') || a.reason?.toLowerCase().includes('long'))) {
    recommendations.push({
      priority: 'P0',
      issue: 'Onboarding takes too long to show value',
      fix: 'Add "Quick Start" option - skip purpose/principles, jump straight to 3 starter metrics. Full onboarding becomes optional.',
      effort: 'Medium (1-2 days)'
    });
  }

  if (frustrationCategories['Generic/Impersonal'].length >= 2) {
    recommendations.push({
      priority: 'P0',
      issue: 'Responses feel generic/not personalized',
      fix: 'Use their name more. Reference specific details they shared. Reduce canned advice.',
      effort: 'Low (prompt tuning)'
    });
  }

  if (abandonReasons.some(a => a.exchangeNumber <= 2)) {
    recommendations.push({
      priority: 'P0',
      issue: 'Users abandoning within first 2 exchanges',
      fix: 'First response must deliver immediate value - not just ask questions. Show what the app can do.',
      effort: 'Medium (redesign first response)'
    });
  }

  if (frustrationCategories['Confusing Flow'].length >= 1) {
    recommendations.push({
      priority: 'P1',
      issue: 'Users getting lost in the flow',
      fix: 'Add progress indicator: "Step 1/3: Define Purpose". Make phase transitions explicit.',
      effort: 'Medium (UI + prompt changes)'
    });
  }

  if (frustrationCategories['Irrelevant Content'].length >= 2) {
    recommendations.push({
      priority: 'P1',
      issue: 'Hero examples not relevant to user',
      fix: 'Remove hero references entirely from onboarding. Save them for ongoing coaching where context is established.',
      effort: 'Low (prompt change)'
    });
  }

  if (frustrationCategories['Tech/AI Issues'].length >= 1) {
    recommendations.push({
      priority: 'P1',
      issue: 'Feels too "AI-like" or robotic',
      fix: 'Add more conversational variability. Use contractions. Shorter sentences. Sound more human.',
      effort: 'Low (prompt tuning)'
    });
  }

  if (frustrationCategories['Tone Problems'].length >= 1) {
    recommendations.push({
      priority: 'P2',
      issue: 'Tone not matching user expectations',
      fix: 'Add personality detection in first exchange. Adjust tone (direct vs warm) based on how they communicate.',
      effort: 'High (new feature)'
    });
  }

  if (avgScore < 6) {
    recommendations.push({
      priority: 'P0',
      issue: 'Overall experience not meeting expectations',
      fix: 'Consider fundamental redesign: guided flow with preset options vs open-ended conversation.',
      effort: 'High (major redesign)'
    });
  }

  if (recommendations.length === 0) {
    recommendations.push({
      priority: 'P2',
      issue: 'No critical issues found',
      fix: 'Continue monitoring and iterate based on real user feedback.',
      effort: 'Ongoing'
    });
  }

  recommendations
    .sort((a, b) => a.priority.localeCompare(b.priority))
    .forEach((rec, i) => {
      console.log(`\n   ${i + 1}. [${rec.priority}] ${rec.issue}`);
      console.log(`      Fix: ${rec.fix}`);
      console.log(`      Effort: ${rec.effort}`);
    });

  // Success criteria
  console.log(`\n## Success Metrics to Track`);
  console.log(`${"─".repeat(50)}`);
  console.log(`   • Onboarding completion rate (target: >70%)`);
  console.log(`   • Time to first value (target: <2 minutes)`);
  console.log(`   • Day 1 return rate (target: >40%)`);
  console.log(`   • Day 7 retention (target: >20%)`);
  console.log(`   • NPS score (target: >30)`);
}

// ============================================================================
// MAIN
// ============================================================================

async function main(): Promise<void> {
  console.log(`
╔══════════════════════════════════════════════════════════════════════╗
║           ONBOARDING ABANDONMENT TEST                                ║
║                                                                      ║
║  Testing with skeptical personas who WILL abandon if frustrated      ║
╚══════════════════════════════════════════════════════════════════════╝
`);

  console.log(`🌐 API URL: ${API_URL}`);
  console.log(`👥 Testing ${SKEPTICAL_PERSONAS.length} skeptical personas`);
  console.log(`📅 ${new Date().toISOString()}`);

  const results: AbandonmentResult[] = [];

  for (const persona of SKEPTICAL_PERSONAS) {
    const result = await testPersonaOnboarding(persona);
    results.push(result);
  }

  // Summary
  console.log(`\n${"═".repeat(70)}`);
  console.log(`📊 TEST RESULTS SUMMARY`);
  console.log(`${"═".repeat(70)}`);

  console.log(`\n   | Persona               | Result    | Score | Return? | Recommend? |`);
  console.log(`   |${"-".repeat(23)}|${"-".repeat(11)}|${"-".repeat(7)}|${"-".repeat(9)}|${"-".repeat(12)}|`);
  
  results.forEach(r => {
    const status = r.abandoned ? `❌ Left @${r.abandonedAt}` : '✅ Complete';
    console.log(`   | ${r.persona.name.padEnd(21)} | ${status.padEnd(9)} | ${r.overallScore}/10   | ${r.wouldReturn ? '✅' : '❌'}       | ${r.wouldRecommend ? '✅' : '❌'}          |`);
  });

  // Generate product plan
  generateProductPlan(results);

  console.log(`\n${"═".repeat(70)}`);
  console.log(`✅ Test complete!`);
}

main().catch(console.error);
