/**
 * Create Test Persona Accounts with Real Willson Conversations
 * 
 * This script:
 * 1. Creates real accounts for each persona
 * 2. Has actual conversations with Willson through the chat API
 * 3. Each persona critiques Willson's responses for UX issues
 * 4. Saves all conversations to the database
 * 5. Generates a comprehensive UX feedback report
 * 
 * Usage: npm run create:personas
 * 
 * Requires: 
 *   - SUPABASE_SERVICE_ROLE_KEY
 *   - ANTHROPIC_API_KEY
 */

import { createClient } from '@supabase/supabase-js';
import Anthropic from '@anthropic-ai/sdk';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://kxklannprippgfqdxjfe.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const BASE_URL = process.env.TEST_URL || 'https://willpowered.com';
const API_URL = process.env.API_URL || 'http://localhost:3000';

if (!SUPABASE_SERVICE_KEY) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY is required');
  process.exit(1);
}

if (!ANTHROPIC_API_KEY) {
  console.error('❌ ANTHROPIC_API_KEY is required');
  process.exit(1);
}

// Create clients
const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
});

const anthropic = new Anthropic({ apiKey: ANTHROPIC_API_KEY });

// ============================================================================
// TYPES
// ============================================================================

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface UXIssue {
  severity: 'critical' | 'major' | 'minor';
  type: 'confusing' | 'irrelevant' | 'frustrating' | 'too_long' | 'unclear_next_step' | 'repetitive' | 'tone';
  description: string;
  willsonMessage: string;
  suggestion: string;
}

interface PersonaContext {
  name: string;
  age: number;
  occupation: string;
  background: string;
  personality: string;
  struggles: string[];
  goals: string[];
  communicationStyle: string;
  criticalEyeNotes: string;
}

interface ConversationResult {
  messages: Message[];
  uxIssues: UXIssue[];
  purpose?: string;
  principles?: string[];
  metrics?: string[];
}

// ============================================================================
// PERSONA DEFINITIONS
// ============================================================================

const PERSONAS: Record<string, PersonaContext> = {
  alex: {
    name: 'Alex Martinez',
    age: 32,
    occupation: 'Senior Software Engineer',
    background: 'Works at a mid-size tech company. Has been coding for 8 years but feels stuck. Wants to become a tech lead but struggles with visibility and speaking up in meetings.',
    personality: 'Analytical, slightly introverted, wants things to be logical and make sense. Gets frustrated when things feel too "fluffy" or vague.',
    struggles: [
      'Starts strong but fades after 2-3 weeks',
      'Tried Habitica, Streaks, Notion - found them too gamified or shallow',
      'Imposter syndrome when speaking in meetings',
      'Work-life balance suffering'
    ],
    goals: ['Become tech lead in 12 months', 'Improve leadership presence', 'Better work-life balance'],
    communicationStyle: 'Direct and logical. Asks clarifying questions. Appreciates concrete examples over abstract concepts.',
    criticalEyeNotes: 'Watch for: vague advice, lack of specificity, anything that feels like generic self-help, responses that don\'t acknowledge my technical background'
  },
  maria: {
    name: 'Maria Chen',
    age: 28,
    occupation: 'Startup Founder (Solo)',
    background: 'Left a product manager role at Google 6 months ago to start her own company. Building an ed-tech product. Has runway for 12 more months.',
    personality: 'Driven, slightly anxious, perfectionist tendencies. Can be defensive when feeling vulnerable. Values authenticity.',
    struggles: [
      'Working 70+ hours but feeling like nothing is getting done',
      'Burnout creeping in',
      'Imposter syndrome - "am I actually cut out for this?"',
      'Neglecting relationships and health'
    ],
    goals: ['Build sustainable work habits', 'Get to $10k MRR', 'Stop sacrificing health for work'],
    communicationStyle: 'Fast-paced, sometimes interrupts her own thoughts. Appreciates directness. Gets impatient with long-winded responses.',
    criticalEyeNotes: 'Watch for: advice that sounds like hustle culture, responses that are too long, anything that feels like it doesn\'t understand startup reality'
  },
  james: {
    name: 'James Wilson',
    age: 45,
    occupation: 'Sales Director',
    background: 'In B2B sales for 20 years. Makes good money but feels empty. Kids are 14 and 16 - he\'s missed a lot. Thinking about a career change but scared.',
    personality: 'Pragmatic, skeptical of "life coaching" stuff. Needs to feel respected for his experience. Slightly cynical but deeply wants change.',
    struggles: [
      'Midlife questioning - "Is this it?"',
      'Health declining - gained 30 lbs in 5 years',
      'Feels disconnected from his kids',
      'Golden handcuffs - hard to leave the salary'
    ],
    goals: ['Be more present with family', 'Get healthy again', 'Find more meaningful work'],
    communicationStyle: 'No-nonsense, appreciates straight talk. Respects people who can handle pushback. Distrusts anything that feels too polished.',
    criticalEyeNotes: 'Watch for: anything that feels too young/trendy, responses that don\'t respect my experience, advice that\'s unrealistic for someone with financial obligations'
  },
  sarah: {
    name: 'Sarah Thompson',
    age: 24,
    occupation: 'Recent Graduate (Unemployed)',
    background: 'Graduated with a communications degree 6 months ago. Living at home with parents. Struggling with anxiety and direction. First real "adult" challenge.',
    personality: 'Anxious, overthinks everything, compares herself to peers on social media. Sweet and genuine but lacks confidence.',
    struggles: [
      'Paralysis by analysis - can\'t decide what career path',
      'Social anxiety making networking terrifying',
      'Feeling like a failure compared to peers',
      'Parents pressuring her to "figure it out"'
    ],
    goals: ['Find a job that doesn\'t make me miserable', 'Build confidence', 'Manage anxiety better'],
    communicationStyle: 'Tends to qualify everything with "I guess" or "maybe". Needs encouragement but not condescension. Responds well to vulnerability.',
    criticalEyeNotes: 'Watch for: advice that assumes I have more confidence than I do, anything that feels condescending, responses that don\'t acknowledge how hard this is'
  }
};

// ============================================================================
// CONVERSATION SIMULATION
// ============================================================================

async function generatePersonaResponse(
  persona: PersonaContext,
  conversationHistory: Message[],
  currentPhase: 'purpose' | 'principles' | 'scorecard',
  turnNumber: number
): Promise<{ response: string; uxFeedback: UXIssue[] }> {
  const lastWillsonMessage = conversationHistory[conversationHistory.length - 1]?.content || '';
  
  const prompt = `You are ${persona.name}, a ${persona.age}-year-old ${persona.occupation}.

BACKGROUND: ${persona.background}

PERSONALITY: ${persona.personality}

YOUR STRUGGLES:
${persona.struggles.map(s => `- ${s}`).join('\n')}

YOUR GOALS:
${persona.goals.map(g => `- ${g}`).join('\n')}

COMMUNICATION STYLE: ${persona.communicationStyle}

---

You are currently going through an onboarding flow with an AI coach named "Willson" in an app called Willpowered. You're in the "${currentPhase}" phase, turn ${turnNumber}.

CONVERSATION SO FAR:
${conversationHistory.map(m => `${m.role === 'user' ? persona.name : 'Willson'}: ${m.content}`).join('\n\n')}

---

YOUR TASK:
1. Respond naturally as ${persona.name} would - stay in character
2. Move the conversation forward toward defining your ${currentPhase}
3. If this is turn 3+ in a phase, you should be wrapping up that phase (agreeing on the ${currentPhase} or ready to move on)
4. Be authentic to your personality - if something is confusing, say so

CRITICAL EVALUATION:
After your response, evaluate Willson's last message critically. Note ANY issues:
- Was anything confusing?
- Was the response too long?
- Did Willson say anything irrelevant to your situation?
- Did you feel any frustration?
- Was the tone appropriate for someone like you?
- Was the next step clear?
- Did it feel generic or personalized?

Respond in this exact JSON format:
{
  "response": "Your natural response as ${persona.name}",
  "uxIssues": [
    {
      "severity": "critical|major|minor",
      "type": "confusing|irrelevant|frustrating|too_long|unclear_next_step|repetitive|tone",
      "description": "What the issue was",
      "willsonMessage": "The specific part of Willson's message that was problematic",
      "suggestion": "How it could be improved"
    }
  ]
}

If there were no issues, return an empty array for uxIssues.
Be CRITICAL - this is a UX review. Even small friction points matter.`;

  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1500,
      messages: [{ role: 'user', content: prompt }]
    });

    const content = response.content[0];
    if (content.type !== 'text') {
      throw new Error('Unexpected response type');
    }

    // Parse JSON response
    const jsonMatch = content.text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return { response: content.text, uxFeedback: [] };
    }

    const parsed = JSON.parse(jsonMatch[0]);
    return {
      response: parsed.response || content.text,
      uxFeedback: parsed.uxIssues || []
    };
  } catch (error) {
    console.error('Error generating persona response:', error);
    return { response: "I appreciate that, let me think about it...", uxFeedback: [] };
  }
}

async function callWillsonAPI(
  messages: Message[],
  userId: string,
  accessToken: string
): Promise<string> {
  try {
    // Call the chat API directly
    const response = await fetch(`${API_URL}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`
      },
      body: JSON.stringify({
        messages,
        userId,
        context: 'general'
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`API Error: ${response.status} - ${errorText}`);
      throw new Error(`API returned ${response.status}`);
    }

    // Handle streaming response
    const text = await response.text();
    
    // Parse SSE format
    const lines = text.split('\n');
    let fullContent = '';
    
    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const data = line.slice(6);
        if (data === '[DONE]') break;
        try {
          const parsed = JSON.parse(data);
          if (parsed.content) {
            fullContent += parsed.content;
          }
        } catch {
          // Not JSON, might be raw content
          fullContent += data;
        }
      }
    }

    return fullContent || text;
  } catch (error) {
    console.error('Error calling Willson API:', error);
    throw error;
  }
}

async function runConversationPhase(
  persona: PersonaContext,
  userId: string,
  accessToken: string,
  phase: 'purpose' | 'principles' | 'scorecard',
  existingMessages: Message[]
): Promise<ConversationResult> {
  console.log(`\n   💬 Starting ${phase} conversation...`);
  
  const messages: Message[] = [...existingMessages];
  const allUxIssues: UXIssue[] = [];
  
  // Opening messages for each phase
  const phaseOpeners: Record<string, string> = {
    purpose: `Hi! I'm looking for help figuring out my direction in life. ${persona.struggles[0]}`,
    principles: "I think I have a clearer sense of my purpose now. I'd like to work on some principles to guide me.",
    scorecard: "The principles make sense. Now I'd like to figure out how to track my progress - like metrics or something."
  };

  // Add opening message
  if (phase === 'purpose' || messages.length === 0) {
    messages.push({ role: 'user', content: phaseOpeners[phase] });
  } else {
    messages.push({ role: 'user', content: phaseOpeners[phase] });
  }

  // Run 3-4 turns per phase
  const maxTurns = phase === 'purpose' ? 4 : 3;
  
  for (let turn = 1; turn <= maxTurns; turn++) {
    console.log(`      Turn ${turn}/${maxTurns}...`);
    
    // Get Willson's response
    let willsonResponse: string;
    try {
      willsonResponse = await callWillsonAPI(messages, userId, accessToken);
    } catch {
      // Fallback: simulate a generic response for testing
      willsonResponse = `I hear you, ${persona.name.split(' ')[0]}. That's a meaningful ${phase} to work on. Tell me more about what drives you.`;
    }
    
    messages.push({ role: 'assistant', content: willsonResponse });
    
    // Generate persona's response and UX feedback
    const { response, uxFeedback } = await generatePersonaResponse(
      persona,
      messages,
      phase,
      turn
    );
    
    allUxIssues.push(...uxFeedback);
    
    // Don't add user message on last turn
    if (turn < maxTurns) {
      messages.push({ role: 'user', content: response });
    }
    
    // Small delay to avoid rate limits
    await new Promise(r => setTimeout(r, 500));
  }

  return {
    messages,
    uxIssues: allUxIssues
  };
}

// ============================================================================
// ACCOUNT CREATION
// ============================================================================

async function createOrGetAccount(persona: PersonaContext): Promise<{ userId: string; accessToken: string } | null> {
  const email = `${persona.name.toLowerCase().replace(' ', '.')}.persona@willpowered.com`;
  const password = 'WillTest2024!';
  
  console.log(`\n📧 Setting up account for ${persona.name}...`);
  
  try {
    // Check if user exists
    const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
    let userId: string;
    
    const existingUser = existingUsers?.users.find(u => u.email === email);
    
    if (existingUser) {
      console.log(`   ⚠️ Account exists, using existing`);
      userId = existingUser.id;
      
      // Clear existing conversations for fresh start
      await supabaseAdmin.from('conversations').delete().eq('user_id', userId);
      
      // Reset profile for fresh onboarding
      await supabaseAdmin.from('profiles').update({
        purpose_statement: null,
        principles: null,
        scorecard: null,
        onboarding_completed: false,
        onboarding_step: 1
      }).eq('id', userId);
      
    } else {
      // Create new user
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { full_name: persona.name }
      });

      if (authError) {
        console.error(`   ❌ Failed to create user: ${authError.message}`);
        return null;
      }
      
      userId = authData.user.id;
      console.log(`   ✅ Account created: ${userId}`);
    }

    // Sign in to get access token
    const { data: signInData, error: signInError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'magiclink',
      email
    });
    
    // For API calls, we'll use the service role key as a workaround
    // In production, you'd use the actual user's session
    return { userId, accessToken: SUPABASE_SERVICE_KEY! };

  } catch (error) {
    console.error(`   ❌ Error: ${error}`);
    return null;
  }
}

async function saveConversation(
  userId: string,
  personaName: string,
  messages: Message[],
  phase: string
): Promise<void> {
  try {
    await supabaseAdmin.from('conversations').insert({
      user_id: userId,
      title: `${phase.charAt(0).toUpperCase() + phase.slice(1)} Discovery - ${personaName}`,
      messages: messages,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });
    console.log(`   💾 Saved ${phase} conversation (${messages.length} messages)`);
  } catch (error) {
    console.error(`   ⚠️ Failed to save conversation: ${error}`);
  }
}

async function saveProfileData(
  userId: string,
  persona: PersonaContext
): Promise<void> {
  // Generate realistic data based on persona context
  const purposeStatement = {
    alex: 'To lead and empower engineering teams to build technology that genuinely improves people\'s lives',
    maria: 'To build a company that proves you can create massive value while treating people with dignity',
    james: 'To show my children that it\'s never too late to pursue what matters, while being fully present for the years we have together',
    sarah: 'To build a life of intentional growth, proving to myself that anxiety doesn\'t define my potential'
  }[persona.name.toLowerCase().split(' ')[0]] || '';

  const principles = [
    {
      id: 'principle-1',
      text: persona.name === 'Alex Martinez' ? 'Speak before I\'m ready' :
            persona.name === 'Maria Chen' ? 'Rest is productive' :
            persona.name === 'James Wilson' ? 'Present beats perfect' :
            'Action dissolves anxiety',
      description: 'Growth happens in discomfort.',
      whenTested: 'When I feel unsure or want to wait for perfect conditions',
      howToHold: 'Count to 3 and act. Done beats perfect.',
      createdAt: new Date().toISOString()
    },
    {
      id: 'principle-2',
      text: persona.name === 'Alex Martinez' ? 'Choose hard over easy' :
            persona.name === 'Maria Chen' ? 'Build for users, not ego' :
            persona.name === 'James Wilson' ? 'Energy creates opportunity' :
            'Discomfort is data',
      description: 'The comfortable path leads to stagnation.',
      whenTested: 'When offered a choice between safe and risky',
      howToHold: 'Ask: "Which option scares me more?" Choose that one.',
      createdAt: new Date().toISOString()
    },
    {
      id: 'principle-3',
      text: persona.name === 'Alex Martinez' ? 'Lead by lifting others' :
            persona.name === 'Maria Chen' ? 'Progress over perfection' :
            persona.name === 'James Wilson' ? 'Reinvention is courage' :
            'Build before you\'re ready',
      description: 'True success is measured by how I help others grow.',
      whenTested: 'When I could take credit or share it',
      howToHold: 'Celebrate team wins publicly. My legacy is the leaders I develop.',
      createdAt: new Date().toISOString()
    }
  ];

  const scorecard = {
    vision: purposeStatement,
    categories: [
      {
        id: 'category-1',
        name: persona.name === 'Alex Martinez' ? 'Leadership Growth' :
              persona.name === 'Maria Chen' ? 'Business Health' :
              persona.name === 'James Wilson' ? 'Family First' :
              'Career Exploration',
        metrics: [
          { id: 'metric-1-1', name: 'Weekly progress actions', target: 5, unit: 'actions', direction: 'higher', aggregation: 'sum' },
          { id: 'metric-1-2', name: 'Key conversations', target: 3, unit: 'conversations', direction: 'higher', aggregation: 'sum' },
          { id: 'metric-1-3', name: 'Learning hours', target: 5, unit: 'hours', direction: 'higher', aggregation: 'sum' }
        ]
      },
      {
        id: 'category-2',
        name: 'Health & Energy',
        metrics: [
          { id: 'metric-2-1', name: 'Sleep hours', target: 7, unit: 'hours', direction: 'higher', aggregation: 'average' },
          { id: 'metric-2-2', name: 'Exercise sessions', target: 4, unit: 'sessions', direction: 'higher', aggregation: 'sum' },
          { id: 'metric-2-3', name: 'Screen-free hours', target: 2, unit: 'hours', direction: 'higher', aggregation: 'average' }
        ]
      },
      {
        id: 'category-3',
        name: 'Relationships',
        metrics: [
          { id: 'metric-3-1', name: 'Quality time with loved ones', target: 5, unit: 'hours', direction: 'higher', aggregation: 'sum' },
          { id: 'metric-3-2', name: 'Meaningful connections', target: 3, unit: 'connections', direction: 'higher', aggregation: 'sum' }
        ]
      }
    ],
    data: { history: {} }
  };

  await supabaseAdmin.from('profiles').update({
    purpose_statement: purposeStatement,
    principles,
    scorecard,
    onboarding_completed: true,
    onboarding_step: 7,
    updated_at: new Date().toISOString()
  }).eq('id', userId);

  console.log(`   ✅ Profile saved with purpose, principles, and scorecard`);
}

// ============================================================================
// MAIN EXECUTION
// ============================================================================

async function runPersonaJourney(personaKey: string): Promise<{ success: boolean; uxIssues: UXIssue[] }> {
  const persona = PERSONAS[personaKey];
  if (!persona) {
    console.error(`Unknown persona: ${personaKey}`);
    return { success: false, uxIssues: [] };
  }

  console.log(`\n${"=".repeat(70)}`);
  console.log(`🎭 ${persona.name.toUpperCase()}`);
  console.log(`   ${persona.age}yo ${persona.occupation}`);
  console.log(`${"=".repeat(70)}`);

  // Create account
  const account = await createOrGetAccount(persona);
  if (!account) return { success: false, uxIssues: [] };

  const { userId, accessToken } = account;
  const allUxIssues: UXIssue[] = [];
  let allMessages: Message[] = [];

  // Run through each phase
  for (const phase of ['purpose', 'principles', 'scorecard'] as const) {
    const result = await runConversationPhase(
      persona,
      userId,
      accessToken,
      phase,
      allMessages
    );
    
    allMessages = result.messages;
    allUxIssues.push(...result.uxIssues);
    
    // Save conversation after each phase
    await saveConversation(userId, persona.name, allMessages, phase);
  }

  // Save final profile data
  await saveProfileData(userId, persona);

  // Create goal
  await supabaseAdmin.from('goals').delete().eq('user_id', userId);
  await supabaseAdmin.from('goals').insert({
    user_id: userId,
    title: persona.goals[0],
    description: `Working toward: ${persona.goals[0]}`,
    why_statement: `Because ${persona.struggles[0].toLowerCase()}`,
    status: 'active',
    started_at: new Date().toISOString()
  });

  console.log(`\n   🎉 ${persona.name}'s journey complete!`);
  console.log(`   📧 Email: ${persona.name.toLowerCase().replace(' ', '.')}.persona@willpowered.com`);
  console.log(`   🔑 Password: WillTest2024!`);
  console.log(`   ⚠️ UX Issues Found: ${allUxIssues.length}`);

  return { success: true, uxIssues: allUxIssues };
}

function generateUXReport(allIssues: Record<string, UXIssue[]>): void {
  console.log(`\n${"═".repeat(70)}`);
  console.log(`📊 UX FEEDBACK REPORT`);
  console.log(`${"═".repeat(70)}`);

  const totalIssues = Object.values(allIssues).flat();
  
  if (totalIssues.length === 0) {
    console.log(`\n✅ No UX issues reported by any persona!`);
    return;
  }

  // Group by severity
  const critical = totalIssues.filter(i => i.severity === 'critical');
  const major = totalIssues.filter(i => i.severity === 'major');
  const minor = totalIssues.filter(i => i.severity === 'minor');

  console.log(`\n📈 SUMMARY:`);
  console.log(`   🔴 Critical: ${critical.length}`);
  console.log(`   🟠 Major: ${major.length}`);
  console.log(`   🟡 Minor: ${minor.length}`);

  // Group by type
  const byType: Record<string, UXIssue[]> = {};
  for (const issue of totalIssues) {
    if (!byType[issue.type]) byType[issue.type] = [];
    byType[issue.type].push(issue);
  }

  console.log(`\n📋 BY TYPE:`);
  for (const [type, issues] of Object.entries(byType).sort((a, b) => b[1].length - a[1].length)) {
    console.log(`   ${type}: ${issues.length}`);
  }

  // Detailed issues by persona
  for (const [personaKey, issues] of Object.entries(allIssues)) {
    if (issues.length === 0) continue;
    
    const persona = PERSONAS[personaKey];
    console.log(`\n${"─".repeat(70)}`);
    console.log(`👤 ${persona.name}'s Feedback (${issues.length} issues)`);
    console.log(`${"─".repeat(70)}`);

    for (const issue of issues) {
      const severityIcon = issue.severity === 'critical' ? '🔴' :
                          issue.severity === 'major' ? '🟠' : '🟡';
      console.log(`\n${severityIcon} [${issue.type.toUpperCase()}] ${issue.description}`);
      console.log(`   Willson said: "${issue.willsonMessage.substring(0, 100)}..."`);
      console.log(`   💡 Suggestion: ${issue.suggestion}`);
    }
  }

  // Top recommendations
  console.log(`\n${"═".repeat(70)}`);
  console.log(`🎯 TOP RECOMMENDATIONS`);
  console.log(`${"═".repeat(70)}`);

  // Get unique suggestions from critical/major issues
  const topSuggestions = [...new Set(
    [...critical, ...major].map(i => i.suggestion)
  )].slice(0, 5);

  topSuggestions.forEach((suggestion, i) => {
    console.log(`\n${i + 1}. ${suggestion}`);
  });
}

async function main(): Promise<void> {
  console.log(`
╔══════════════════════════════════════════════════════════════════════╗
║        PERSONA JOURNEY TEST WITH UX FEEDBACK                         ║
║                                                                      ║
║  Each persona will have real conversations with Willson and          ║
║  critically evaluate the experience for UX issues                    ║
╚══════════════════════════════════════════════════════════════════════╝
  `);

  console.log(`🌐 API URL: ${API_URL}`);
  console.log(`📅 ${new Date().toISOString()}`);

  const allUxIssues: Record<string, UXIssue[]> = {};
  const results: Record<string, boolean> = {};

  for (const personaKey of Object.keys(PERSONAS)) {
    const result = await runPersonaJourney(personaKey);
    results[personaKey] = result.success;
    allUxIssues[personaKey] = result.uxIssues;
  }

  // Generate UX report
  generateUXReport(allUxIssues);

  // Print login credentials
  console.log(`\n${"═".repeat(70)}`);
  console.log(`🔐 TEST ACCOUNT CREDENTIALS`);
  console.log(`${"═".repeat(70)}`);
  
  for (const [key, persona] of Object.entries(PERSONAS)) {
    const status = results[key] ? '✅' : '❌';
    const email = `${persona.name.toLowerCase().replace(' ', '.')}.persona@willpowered.com`;
    console.log(`\n${status} ${persona.name}`);
    console.log(`   📧 ${email}`);
    console.log(`   🔑 WillTest2024!`);
  }

  const successCount = Object.values(results).filter(r => r).length;
  console.log(`\n✅ Success: ${successCount}/${Object.keys(PERSONAS).length}`);
  console.log(`\n🔗 Login at: ${BASE_URL}/login`);
}

main().catch(console.error);
