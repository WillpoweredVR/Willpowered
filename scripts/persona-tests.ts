/**
 * Persona-Based API Testing Script for Willpowered
 * 
 * This script simulates complete user journeys through the eyes of different personas,
 * testing Willson's AI responses and the overall user experience.
 * 
 * Usage: npx ts-node scripts/persona-tests.ts
 */

const BASE_URL = process.env.TEST_URL || 'https://willpowered.com';

// ============================================================================
// PERSONA DEFINITIONS
// ============================================================================

interface Persona {
  name: string;
  age: number;
  occupation: string;
  background: string;
  goals: string[];
  struggles: string[];
  conversationStyle: string;
}

const PERSONAS: Record<string, Persona> = {
  alex: {
    name: "Alex Martinez",
    age: 32,
    occupation: "Software Engineer",
    background: "Works at a mid-sized tech company, wants to become a tech lead",
    goals: ["Get promoted to tech lead", "Speak up more in meetings", "Take on harder projects"],
    struggles: ["Starts strong but fades after 2-3 weeks", "Avoids uncomfortable situations", "Overthinks decisions"],
    conversationStyle: "Direct, analytical, sometimes self-deprecating"
  },
  maria: {
    name: "Maria Chen",
    age: 28,
    occupation: "Startup Founder",
    background: "Left corporate job to start her own company, bootstrapping",
    goals: ["Build a successful business", "Maintain work-life balance", "Stay motivated during hard times"],
    struggles: ["Imposter syndrome", "Burnout cycles", "Comparing herself to others"],
    conversationStyle: "Ambitious, vulnerable, seeks validation"
  },
  james: {
    name: "James Wilson",
    age: 45,
    occupation: "Sales Director",
    background: "Mid-career professional feeling stuck, kids in high school",
    goals: ["Reinvent career", "Be a better father", "Get healthier"],
    struggles: ["Feels too old to change", "Lacks energy", "Prioritizes work over family"],
    conversationStyle: "Skeptical at first, appreciates practical advice"
  },
  sarah: {
    name: "Sarah Thompson",
    age: 24,
    occupation: "Recent Graduate",
    background: "Just finished college, unsure about career direction",
    goals: ["Find meaningful work", "Build good habits early", "Overcome anxiety"],
    struggles: ["Analysis paralysis", "Social anxiety", "Fear of failure"],
    conversationStyle: "Curious, uncertain, asks lots of questions"
  }
};

// ============================================================================
// CONVERSATION SCENARIOS
// ============================================================================

interface ConversationScenario {
  name: string;
  description: string;
  initialPrompt: string;
  followUpResponses: ((response: string) => string)[];
  expectedElements: string[];
}

function createScenariosForPersona(persona: Persona): ConversationScenario[] {
  return [
    {
      name: "Discovery - Initial Struggle",
      description: `${persona.name} shares their main struggle`,
      initialPrompt: `I'm ${persona.name}, a ${persona.age}-year-old ${persona.occupation}. ${persona.struggles[0]}. I don't know what to do.`,
      followUpResponses: [
        (response) => {
          if (response.includes("?")) {
            return `Yes, that's exactly it. ${persona.struggles[1]} too. What should I focus on first?`;
          }
          return "That resonates with me. Can you give me a specific example of how to apply that?";
        },
        (response) => {
          return `That's helpful. My main goal is to ${persona.goals[0].toLowerCase()}. How do I stay consistent?`;
        }
      ],
      expectedElements: [
        "empathy", // Should acknowledge their struggle
        "question", // Should ask a follow-up question
        "actionable" // Should provide actionable advice
      ]
    },
    {
      name: "Purpose Discovery",
      description: `${persona.name} explores their deeper purpose`,
      initialPrompt: `I want to figure out my purpose. I'm a ${persona.occupation} and I feel like there should be more to life than just ${persona.goals[0].toLowerCase()}.`,
      followUpResponses: [
        (response) => `When I was younger, I always wanted to make a difference. Now I'm not sure what that means for me.`,
        (response) => `I think what really matters to me is ${persona.goals[1].toLowerCase()}. But I'm not sure if that's a purpose or just a goal.`,
        (response) => `That helps clarify things. What's the difference between purpose and goals?`
      ],
      expectedElements: [
        "purpose-focused",
        "clarifying-questions",
        "hero-reference" // Should mention a hero from the book
      ]
    },
    {
      name: "Principles Development",
      description: `${persona.name} works on defining principles`,
      initialPrompt: `I want to develop some personal principles to guide my decisions. I'm tired of being inconsistent.`,
      followUpResponses: [
        (response) => `One thing I believe in is never giving up, but I struggle to live by it. ${persona.struggles[0]}.`,
        (response) => `I think another principle for me would be about ${persona.goals[1].toLowerCase()}. How do I make it actionable?`,
        (response) => `Can you help me refine these into 3 clear principles I can actually follow?`
      ],
      expectedElements: [
        "principle-format", // Should help structure principles
        "when-tested", // Should ask about when principles are tested
        "how-to-hold" // Should explore how to hold the principle
      ]
    },
    {
      name: "Scorecard Metrics",
      description: `${persona.name} develops quantifiable metrics`,
      initialPrompt: `I need help tracking my progress. What metrics should I track to know if I'm living up to my goals?`,
      followUpResponses: [
        (response) => `My main focus is ${persona.goals[0].toLowerCase()}. What specific numbers should I track?`,
        (response) => `I also want to make sure I'm taking care of my health and relationships. How do I track those?`,
        (response) => `These are great. Can you summarize 5 specific metrics I should track weekly?`
      ],
      expectedElements: [
        "quantifiable", // All metrics should be measurable
        "weekly-trackable", // Should be trackable on weekly basis
        "holistic" // Should include lifestyle metrics, not just work
      ]
    }
  ];
}

// ============================================================================
// API TESTING FUNCTIONS
// ============================================================================

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface ChatResponse {
  message: string;
  toolCall?: {
    name: string;
    input: unknown;
  };
}

async function sendChatMessage(
  messages: Message[],
  userContext?: {
    userId?: string;
    userName?: string;
    goal?: { title: string; why?: string; purpose?: string };
    principles?: Array<{ id: string; text: string }>;
    metrics?: Array<{ name: string; target: number }>;
  }
): Promise<ChatResponse> {
  const response = await fetch(`${BASE_URL}/api/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      messages,
      userContext,
    }),
  });

  if (!response.ok) {
    throw new Error(`API error: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

// ============================================================================
// TEST EXECUTION
// ============================================================================

interface TestResult {
  persona: string;
  scenario: string;
  passed: boolean;
  messages: Message[];
  issues: string[];
  highlights: string[];
  responseTime: number;
}

async function runScenario(
  persona: Persona,
  scenario: ConversationScenario
): Promise<TestResult> {
  const startTime = Date.now();
  const messages: Message[] = [];
  const issues: string[] = [];
  const highlights: string[] = [];

  console.log(`\n  📝 Scenario: ${scenario.name}`);
  console.log(`     ${scenario.description}`);

  try {
    // Send initial message
    console.log(`\n     [${persona.name}]: ${scenario.initialPrompt.substring(0, 60)}...`);
    messages.push({ role: "user", content: scenario.initialPrompt });

    const firstResponse = await sendChatMessage(messages, {
      userName: persona.name,
    });

    messages.push({ role: "assistant", content: firstResponse.message });
    console.log(`     [Willson]: ${firstResponse.message.substring(0, 80)}...`);

    // Analyze first response
    analyzeResponse(firstResponse.message, scenario.expectedElements, issues, highlights);

    // Continue conversation with follow-ups
    for (let i = 0; i < scenario.followUpResponses.length; i++) {
      const followUp = scenario.followUpResponses[i](firstResponse.message);
      console.log(`\n     [${persona.name}]: ${followUp.substring(0, 60)}...`);
      messages.push({ role: "user", content: followUp });

      const response = await sendChatMessage(messages, {
        userName: persona.name,
      });

      messages.push({ role: "assistant", content: response.message });
      console.log(`     [Willson]: ${response.message.substring(0, 80)}...`);

      // Check for tool calls (saving data)
      if (response.toolCall) {
        highlights.push(`✅ Tool called: ${response.toolCall.name}`);
      }

      analyzeResponse(response.message, scenario.expectedElements, issues, highlights);

      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 500));
    }

  } catch (error) {
    issues.push(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }

  const responseTime = Date.now() - startTime;
  const passed = issues.length === 0;

  return {
    persona: persona.name,
    scenario: scenario.name,
    passed,
    messages,
    issues,
    highlights,
    responseTime,
  };
}

function analyzeResponse(
  response: string,
  expectedElements: string[],
  issues: string[],
  highlights: string[]
): void {
  // Check response length (should be concise)
  if (response.length > 1500) {
    issues.push(`⚠️ Response too long (${response.length} chars)`);
  } else if (response.length < 100) {
    issues.push(`⚠️ Response too short (${response.length} chars)`);
  }

  // Check for question (engagement)
  if (response.includes("?")) {
    highlights.push("✅ Asks follow-up question");
  }

  // Check for hero references (full names)
  const heroNames = [
    "Arnold Schwarzenegger",
    "Kobe Bryant",
    "Temple Grandin",
    "Christy Brown",
    "Stephen Hawking",
    "Nelson Mandela",
  ];
  
  for (const hero of heroNames) {
    if (response.includes(hero)) {
      highlights.push(`✅ References ${hero}`);
    }
  }

  // Check for partial hero names (should use full names)
  const partialNames = ["Arnold", "Kobe", "Temple", "Christy", "Stephen", "Mandela"];
  for (const partial of partialNames) {
    const fullName = heroNames.find(h => h.includes(partial));
    if (response.includes(partial) && fullName && !response.includes(fullName)) {
      issues.push(`⚠️ Uses partial name "${partial}" instead of full name`);
    }
  }

  // Check for em dashes (should be avoided)
  if (response.includes("—")) {
    issues.push(`⚠️ Contains em dash (—)`);
  }

  // Check for AI-sounding phrases
  const aiPhrases = [
    "I understand",
    "I hear you",
    "That's a great question",
    "Absolutely",
    "Certainly",
  ];
  for (const phrase of aiPhrases) {
    if (response.toLowerCase().includes(phrase.toLowerCase())) {
      // Not necessarily an issue, but worth noting
    }
  }

  // Check for expected elements
  for (const element of expectedElements) {
    switch (element) {
      case "empathy":
        if (response.includes("not alone") || response.includes("common") || response.includes("understand")) {
          highlights.push("✅ Shows empathy");
        }
        break;
      case "actionable":
        if (response.includes("try") || response.includes("start") || response.includes("focus")) {
          highlights.push("✅ Provides actionable advice");
        }
        break;
      case "quantifiable":
        if (/\d+/.test(response) || response.includes("track") || response.includes("measure")) {
          highlights.push("✅ Mentions quantifiable metrics");
        }
        break;
      case "holistic":
        if (response.includes("sleep") || response.includes("health") || response.includes("relationship")) {
          highlights.push("✅ Addresses holistic wellbeing");
        }
        break;
    }
  }
}

async function runPersonaTests(personaKey: string): Promise<TestResult[]> {
  const persona = PERSONAS[personaKey];
  if (!persona) {
    throw new Error(`Unknown persona: ${personaKey}`);
  }

  console.log(`\n${"=".repeat(70)}`);
  console.log(`🎭 PERSONA: ${persona.name}`);
  console.log(`   ${persona.age}yo ${persona.occupation}`);
  console.log(`   "${persona.background}"`);
  console.log(`${"=".repeat(70)}`);

  const scenarios = createScenariosForPersona(persona);
  const results: TestResult[] = [];

  for (const scenario of scenarios) {
    const result = await runScenario(persona, scenario);
    results.push(result);

    // Print scenario results
    console.log(`\n     ${result.passed ? "✅ PASSED" : "❌ FAILED"} (${result.responseTime}ms)`);
    
    if (result.highlights.length > 0) {
      console.log(`     Highlights:`);
      for (const h of result.highlights) {
        console.log(`       ${h}`);
      }
    }
    
    if (result.issues.length > 0) {
      console.log(`     Issues:`);
      for (const i of result.issues) {
        console.log(`       ${i}`);
      }
    }
  }

  return results;
}

async function runAllTests(): Promise<void> {
  console.log(`
╔══════════════════════════════════════════════════════════════════════╗
║                    WILLPOWERED PERSONA TESTS                         ║
║                                                                      ║
║  Testing Willson's AI responses through the eyes of different users  ║
╚══════════════════════════════════════════════════════════════════════╝
  `);

  console.log(`🌐 Testing against: ${BASE_URL}`);
  console.log(`📅 ${new Date().toISOString()}`);

  const allResults: TestResult[] = [];

  for (const personaKey of Object.keys(PERSONAS)) {
    const results = await runPersonaTests(personaKey);
    allResults.push(...results);
  }

  // Print summary
  console.log(`\n${"=".repeat(70)}`);
  console.log(`📊 TEST SUMMARY`);
  console.log(`${"=".repeat(70)}`);

  const passed = allResults.filter(r => r.passed).length;
  const failed = allResults.filter(r => !r.passed).length;
  const avgTime = Math.round(allResults.reduce((a, r) => a + r.responseTime, 0) / allResults.length);

  console.log(`\n  Total Scenarios: ${allResults.length}`);
  console.log(`  ✅ Passed: ${passed}`);
  console.log(`  ❌ Failed: ${failed}`);
  console.log(`  ⏱️  Avg Response Time: ${avgTime}ms`);

  // Group issues by type
  const allIssues = allResults.flatMap(r => r.issues);
  if (allIssues.length > 0) {
    console.log(`\n  Common Issues:`);
    const issueCounts: Record<string, number> = {};
    for (const issue of allIssues) {
      const key = issue.substring(0, 30);
      issueCounts[key] = (issueCounts[key] || 0) + 1;
    }
    for (const [issue, count] of Object.entries(issueCounts).sort((a, b) => b[1] - a[1])) {
      console.log(`    ${issue}... (${count}x)`);
    }
  }

  // Highlight common successes
  const allHighlights = allResults.flatMap(r => r.highlights);
  const highlightCounts: Record<string, number> = {};
  for (const h of allHighlights) {
    highlightCounts[h] = (highlightCounts[h] || 0) + 1;
  }
  
  console.log(`\n  Strengths:`);
  for (const [highlight, count] of Object.entries(highlightCounts).sort((a, b) => b[1] - a[1]).slice(0, 5)) {
    console.log(`    ${highlight} (${count}x)`);
  }

  console.log(`\n${"=".repeat(70)}`);
  console.log(`Test run complete!`);
  console.log(`${"=".repeat(70)}\n`);

  // Exit with error code if any tests failed
  if (failed > 0) {
    process.exit(1);
  }
}

// ============================================================================
// CLI
// ============================================================================

const args = process.argv.slice(2);
const personaArg = args.find(a => a.startsWith('--persona='));

if (personaArg) {
  const personaKey = personaArg.split('=')[1];
  runPersonaTests(personaKey).catch(console.error);
} else {
  runAllTests().catch(console.error);
}

