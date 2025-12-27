import { NextRequest, NextResponse } from "next/server";

// The Will of Heroes - Complete Knowledge Base
// Based on Colin Robertson's book and methodology

interface Message {
  role: "user" | "assistant" | "system";
  content: string;
}

const BOOK_KNOWLEDGE = {
  // Core framework
  threePoowers: {
    willPower: "The power to do what you need to do - taking action even when it's hard",
    wontPower: "The power to resist what you shouldn't do - saying no to temptation",
    wantPower: "The power connected to your purpose and long-term goals - your deep motivation",
  },
  
  // The 7-step framework mapped to book chapters
  sevenSteps: {
    purpose: {
      title: "Finding Your Purpose",
      chapter: 5,
      keyPoints: [
        "Connect to your 'want power' - the deep motivation that fuels everything",
        "Purpose changes your perspective on challenges",
        "Find your inspiration, but beware inspiration without action",
        "Develop genuine belief in your goals",
      ],
    },
    skills: {
      title: "Acquiring Skills & Knowledge",
      chapters: [1, 4],
      keyPoints: [
        "The Myth of Talent - success comes from deliberate practice, not innate ability",
        "Deliberate practice requires focused improvement, not just repetition",
        "Willpower workouts strengthen your capacity over time",
        "Meditation is one of the most effective willpower practices",
      ],
    },
    habits: {
      title: "Establishing Great Habits",
      chapters: [3, 4],
      keyPoints: [
        "Fuel your willpower: good glucose, sleep, exercise",
        "The willpower muscle can be strengthened but also depleted",
        "Automate good decisions to reduce willpower drain",
        "Use chunking to make big goals manageable",
      ],
    },
    grit: {
      title: "Becoming Gritty",
      chapter: 6,
      keyPoints: [
        "Grit = passion + perseverance for long-term goals",
        "The difference: willpower is moment-to-moment, grit is sustained over time",
        "'The Middle' is the hardest part of any journey - prepare for it",
        "Use small wins to build momentum through difficult periods",
      ],
    },
    setbacks: {
      title: "Handling Setbacks",
      chapters: [6, 12],
      keyPoints: [
        "How heroes respond to failure defines their legacy",
        "Overcoming defeat requires refusing to settle",
        "Every hero in history faced crushing setbacks",
        "The journey has no end - each setback is just a chapter",
      ],
    },
    limits: {
      title: "Overcoming Limits",
      chapters: [7, 8],
      keyPoints: [
        "The Comfort Zone keeps you safe but stagnant",
        "The Learning Zone is where growth happens",
        "The Chaos Zone is too far - find the edge, not the abyss",
        "Mental limits often come before physical ones (Jure Robic)",
        "The Reality Distortion Field - refuse to accept artificial limitations",
      ],
    },
    perseverance: {
      title: "Persevering to the Finish",
      chapters: [9, 10, 12],
      keyPoints: [
        "Long-term thinking beats short-term intensity",
        "The Snowball Effect - small consistent actions compound",
        "Beware the Planning Fallacy - we underestimate how long things take",
        "The journey without an end - mastery is infinite",
      ],
    },
  },
  
  // Heroes and their lessons
  heroes: {
    kobeBryant: {
      name: "Kobe Bryant",
      story: "At age 12, Kobe scored zero points at summer basketball camp and nearly gave up. Then he learned how Michael Jordan got cut from his high school team but used it as motivation to outwork everyone. This created a fire in Kobe that never went out.",
      quote: "I can't relate to lazy people. I don't understand you. I don't want to understand you.",
      lesson: "Work harder than everyone else. Use setbacks as fuel.",
    },
    arnoldSchwarzenegger: {
      name: "Arnold Schwarzenegger",
      story: "From Thal, Austria, Arnold had a clear vision from age 15 after seeing Reg Park. He visualized his success so clearly that obstacles seemed temporary. He became Mr. Olympia, then a movie star, then Governor.",
      lesson: "The power of vision and purpose. See your future so clearly that nothing can stop you.",
    },
    jkRowling: {
      name: "J.K. Rowling",
      story: "Rejected by 12 publishers while a single mother on welfare. She kept writing Harry Potter in cafes while her baby slept. The rejections were just 'the middle' of her journey.",
      lesson: "Persistence through 'the middle' - the hardest part of any journey.",
    },
    warrenBuffett: {
      name: "Warren Buffett",
      story: "Built his fortune through patient, boring consistency. Like a snowball rolling downhill, small consistent actions compounded into extraordinary results over decades.",
      lesson: "The Snowball Effect - consistency over time beats intensity.",
    },
    jureRobic: {
      name: "Jure Robic",
      story: "Ultra-endurance cyclist who discovered that mental limits come before physical ones. In races lasting days without sleep, the body can continue long after the mind wants to quit.",
      lesson: "Your perceived limits are not your actual limits.",
    },
    steveJobs: {
      name: "Steve Jobs",
      story: "Known for his 'Reality Distortion Field' - the ability to convince himself and others that the impossible was possible. He refused to accept limitations that others saw as fixed.",
      lesson: "Open your mind to possibilities others dismiss.",
    },
    templeGrandin: {
      name: "Temple Grandin",
      story: "Overcame autism to revolutionize the cattle industry. Her different way of seeing the world became her superpower, allowing her to understand animals in ways others couldn't.",
      lesson: "Different perspectives create innovation. Adversity can become advantage.",
    },
    johnWooden: {
      name: "John Wooden",
      story: "Legendary UCLA basketball coach who won 10 national championships. Famous for praising effort over results, building character alongside skill.",
      lesson: "Praise effort, not results. The process matters more than the outcome.",
    },
  },
  
  // Key concepts from the book
  concepts: {
    willpowerMuscle: "Willpower is like a muscle - it can be strengthened through practice but also depleted through overuse. This is why managing your willpower throughout the day matters.",
    primitiveBrain: "Your primitive brain seeks immediate gratification. Your modern brain (prefrontal cortex) handles long-term planning. Success requires training the modern brain to override primitive impulses.",
    zones: {
      comfort: "The Comfort Zone - safe but stagnant. No growth happens here.",
      learning: "The Learning Zone - challenging but manageable. This is where transformation happens.",
      chaos: "The Chaos Zone - too far beyond your limits. Leads to shutdown and retreat.",
    },
    planningFallacy: "We consistently underestimate how long things take and how hard they'll be. Solution: Use reference class forecasting - look at how long similar things have taken others.",
    smallWins: "Each small victory builds confidence for the next challenge. Success snowballs. Start with wins you know you can achieve.",
    deliberatePractice: "Not just repetition, but focused improvement with feedback. Quality of practice matters more than quantity.",
    theMiddle: "The hardest part of any journey is the middle - after the initial excitement fades but before success is visible. This is where most people quit.",
  },
  
  // Practical willpower workouts from Chapter 4
  willpowerWorkouts: [
    "Meditate daily - even 5 minutes strengthens the prefrontal cortex",
    "Work on your posture - maintaining awareness builds willpower",
    "Use your non-dominant hand for simple tasks",
    "Correct your speech - eliminate filler words like 'um' and 'like'",
    "Keep a food diary - tracking builds conscious awareness",
    "Track your spending - same principle as food diary",
    "Create and meet self-imposed deadlines",
    "Carry around something tempting but don't consume it",
    "Make conscious decisions about things you usually do automatically",
  ],
  
  colinStory: `Six years ago, Colin lost the ability to use his hands to navigate a phone, drive a car, or type. The very act of building Willpowered - the blog, the book, the business - contributed to this condition. 

But Colin refused to give up. He learned voice technology, adapted his entire workflow, and eventually became more productive than before. This journey taught him firsthand every principle in The Will of Heroes.

Now Colin can write, code, and build without ever touching a keyboard. His story is living proof that the willpower principles in the book actually work when applied with persistence.`,
};

// Generate contextual responses based on user input and book knowledge
function generateResponse(messages: Message[]): string {
  const lastMessage = messages[messages.length - 1]?.content.toLowerCase() || "";
  const conversationContext = messages.map(m => m.content.toLowerCase()).join(" ");
  
  // Habits and willpower workouts
  if (lastMessage.includes("habit") || lastMessage.includes("routine") || lastMessage.includes("consistent") || lastMessage.includes("workout")) {
    return `Building habits is central to the Willpowered methodology. Here's what "The Will of Heroes" teaches:

**The Willpower Muscle (Chapter 4)**
Your willpower works like a muscle - it can be strengthened through practice, but also depleted through overuse. This is why we need systems, not just motivation.

**Practical Willpower Workouts from the book:**
• Meditate daily - even 5 minutes strengthens your prefrontal cortex
• Use your non-dominant hand for simple tasks
• Work on your posture throughout the day
• Track what you eat or spend - awareness builds willpower
• Create and meet self-imposed deadlines

**Fueling Your Willpower (Chapter 3)**
Your willpower needs proper fuel:
• Good glucose (not sugar spikes) for stable energy
• Quality sleep to restore your willpower reserves
• Regular exercise to boost overall capacity

**The Key Insight:**
As Warren Buffett demonstrates, consistency beats intensity. Like a snowball rolling downhill, small daily habits compound into extraordinary results.

What specific habit are you trying to build? I can give you more targeted guidance.`;
  }

  // Purpose and meaning questions
  if (lastMessage.includes("purpose") || lastMessage.includes("why") || lastMessage.includes("meaning") || lastMessage.includes("passion") || lastMessage.includes("motivation")) {
    return `Finding your purpose is Chapter 5 of "The Will of Heroes" - and it unlocks what I call your "Want Power."

**The Three Powers of Will:**
1. **Will Power** - The power to DO what needs to be done
2. **Won't Power** - The power to RESIST temptation
3. **Want Power** - The power connected to PURPOSE

Want Power is the most powerful of the three. When you're connected to a deep purpose, the daily struggles become meaningful instead of draining.

**Arnold Schwarzenegger's Example:**
At age 15 in Thal, Austria, Arnold saw bodybuilder Reg Park and immediately knew his purpose. He visualized his future so clearly - Mr. Olympia, Hollywood, beyond - that obstacles seemed temporary inconveniences rather than roadblocks.

**How Purpose Changes Perspective:**
When you know WHY you're doing something, the HOW becomes easier. Challenges transform from "problems" into "the price of admission" for the life you want.

**Finding Your Purpose:**
1. What problems do you feel compelled to solve?
2. When do you lose track of time because you're so engaged?
3. What would you pursue even if success wasn't guaranteed?

**Warning from the book:** Beware inspiration without action. Purpose without execution is just daydreaming. Once you find your why, you must connect it to daily habits.

What draws your energy and attention naturally? That's often a clue to your purpose.`;
  }

  // Setbacks and failure questions
  if (lastMessage.includes("setback") || lastMessage.includes("fail") || lastMessage.includes("give up") || lastMessage.includes("quit") || lastMessage.includes("stuck") || lastMessage.includes("defeat")) {
    return `Chapter 12 of "The Will of Heroes" is called "The Journey Without an End" - and it addresses exactly this.

**Kobe Bryant's Story:**
At age 12, Kobe scored ZERO POINTS at summer basketball camp. He nearly quit forever. Then he learned that his hero, Michael Jordan, had been cut from his high school team. Michael used that rejection as fuel. When Kobe learned this, it created a fire inside him that never went out.

${BOOK_KNOWLEDGE.heroes.kobeBryant.quote}

**How Heroes Respond to Failure:**
Every hero in the book faced crushing defeats:
• J.K. Rowling was rejected by 12 publishers while on welfare
• Steve Jobs was fired from his own company
• Jure Robic's body and mind broke down repeatedly in ultramarathons

What separated them? They refused to let defeat be the final chapter.

**The Middle (Chapter 6):**
"The Middle" is the hardest part of any journey - after initial excitement fades, before success is visible. This is where most people quit. The key is:
1. Expect the middle - it's not a sign you chose wrong
2. Use small wins to build momentum
3. Remember your "want power" - why you started

**Colin's Personal Experience:**
When Colin lost the use of his hands, he could have quit Willpowered forever. Instead, he spent years adapting, learning voice technology, failing repeatedly until he could work faster than before.

What setback are you facing? Let's work through it together.`;
  }

  // Christy Brown or disability-related
  if (lastMessage.includes("christy") || lastMessage.includes("brown") || lastMessage.includes("disability") || lastMessage.includes("limit")) {
    return `While Christy Brown isn't a primary figure in "The Will of Heroes," his story perfectly exemplifies Chapter 8: Overcoming Limits.

**The Zones Model from the book:**
• **Comfort Zone** - Safe but stagnant
• **Learning Zone** - Where growth happens  
• **Chaos Zone** - Too far, leads to shutdown

Christy Brown lived in what others saw as permanent chaos - severe cerebral palsy, unable to control his body. But he found his Learning Zone: his left foot. That single capability became his gateway to writing, painting, and eventually literary fame.

**Jure Robic's Lesson (Chapter 8):**
Ultra-cyclist Jure Robic discovered that mental limits come before physical ones. In races lasting days without sleep, he learned the body can continue long after the mind wants to quit.

**Steve Jobs' Reality Distortion Field (Chapter 7):**
Jobs refused to accept limitations others saw as fixed. He literally bent reality through belief. This isn't magical thinking - it's refusing to let perceived limits become actual limits.

**Key Insight:**
The book teaches that most limits are mental constructs. Your brain creates artificial barriers to keep you "safe." But growth requires pushing past them - carefully, into the Learning Zone, not the Chaos Zone.

What limits are you facing that might be more mental than real?`;
  }

  // Grit questions
  if (lastMessage.includes("grit") || lastMessage.includes("persever") || lastMessage.includes("long-term") || lastMessage.includes("keep going")) {
    return `Chapter 6 of "The Will of Heroes" is dedicated entirely to Becoming Gritty.

**What Is Grit?**
Grit = Passion + Perseverance for long-term goals

The difference between grit and willpower:
• **Willpower** is moment-to-moment resistance and action
• **Grit** is sustained commitment over months, years, decades

**J.K. Rowling's Example:**
Writing Harry Potter while a single mother on welfare. Rejected 12 times. She didn't just need willpower for one hard day - she needed grit to continue for years before seeing any success.

**"The Middle" - The Hardest Part:**
After initial excitement fades but before success is visible - this is where most people quit. The book teaches that understanding "the middle" is coming helps you prepare for it.

**How to Build Grit:**
1. Connect every action to your purpose (Want Power)
2. Celebrate small wins - they compound
3. Find a support system who believes in you
4. Expect the middle and plan for it
5. Study heroes who persevered before you

**Warren Buffett's Snowball:**
Small, consistent actions compound over time. Buffett's approach is boring - but it works. He didn't try to get rich quick. He got rich slowly, consistently, for 60+ years.

What long-term goal are you working toward? I can help you build grit for your specific journey.`;
  }

  // Kobe Bryant specific
  if (lastMessage.includes("kobe") || lastMessage.includes("bryant") || lastMessage.includes("basketball") || lastMessage.includes("mamba")) {
    return `Kobe Bryant opens "The Will of Heroes" for a reason - his story perfectly captures the book's core message.

**The Zero Points Story:**
At age 12, Kobe attended summer basketball camp expecting to dominate. His father had played in the NBA for 14 years. Basketball was in his blood.

Instead, he was humiliated. He didn't score a single point. Not one jumper, not one layup, not one free throw. Nothing. He was ready to quit basketball forever and return to soccer.

**The Turning Point:**
Then Kobe learned about his hero, Michael Jordan. Michael had been cut from his high school basketball team - completely rejected. But instead of quitting, Michael used it as fuel to outwork everyone around him.

When Kobe learned this, something clicked. He decided right then: "I will work harder than everyone else for the rest of my basketball career."

And he did.

**The Mamba Mentality:**
${BOOK_KNOWLEDGE.heroes.kobeBryant.quote}

Kobe became famous for arriving at practice at 4am. For taking 1,000 shots before anyone else woke up. For studying game film obsessively. His talent wasn't born - it was built through relentless deliberate practice.

**The Lesson:**
Natural talent is overrated. Chapter 1, "The Myth of Talent," uses research to show that deliberate practice is the real determinant of success. Kobe is living proof.

What "zero points" moment have you faced that could become your turning point?`;
  }

  // Willpower depletion / energy
  if (lastMessage.includes("tired") || lastMessage.includes("exhaust") || lastMessage.includes("drain") || lastMessage.includes("no energy") || lastMessage.includes("willpower deplet")) {
    return `Chapter 3, "Fueling Your Willpower," directly addresses this.

**The Willpower Muscle Reality:**
Your willpower is like a muscle - it gets depleted through use. This is called "ego depletion" in psychology. Making decisions, resisting temptation, and doing hard things all drain from the same tank.

**Why You Feel Depleted:**
• Too many decisions (decision fatigue)
• Poor sleep (willpower doesn't restore)
• Bad fuel (sugar spikes and crashes)
• No breaks between demanding tasks

**How to Restore and Protect Willpower:**

**1. Sleep (Critical):**
Willpower literally restores during sleep. A completely dark room, consistent sleep schedule, and meditation before bed all help.

**2. Fuel Properly:**
• Good glucose from complex carbs, not sugar
• Protein for stable energy
• Avoid the spike-crash cycle

**3. Exercise:**
Counterintuitively, exercise BUILDS willpower capacity even though it uses energy in the moment.

**4. Decision Automation:**
Steve Jobs wore the same outfit daily. Barack Obama limited decisions on trivial things. Automate what doesn't matter to save willpower for what does.

**5. Willpower "Chunking":**
Break big tasks into smaller pieces. Instead of "write chapter," aim for "write 500 words." Each small win restores rather than depletes.

**Quick Boost (from Chapter 4):**
When depleted, try:
• 5 minutes of meditation
• A short walk
• Good glucose (not sugar)
• A power nap if possible

What time of day do you feel most depleted? We can strategize around that.`;
  }

  // Seven steps overview
  if (lastMessage.includes("7 step") || lastMessage.includes("seven step") || lastMessage.includes("framework") || lastMessage.includes("methodology") || lastMessage.includes("overview")) {
    return `The 7-Step Willpower Journey is derived from the chapter structure of "The Will of Heroes":

**Step 1: Finding Your Purpose** (Chapter 5)
Connect to your "Want Power" - the deep motivation that makes struggles worthwhile. Arnold Schwarzenegger visualized his future at 15 and never wavered.

**Step 2: Acquiring Skills & Knowledge** (Chapters 1, 4)  
The Myth of Talent - success comes from deliberate practice, not innate ability. Kobe Bryant wasn't born great; he built greatness through 4am practices.

**Step 3: Establishing Great Habits** (Chapters 3, 4)
Fuel your willpower properly (sleep, nutrition, exercise) and build the willpower muscle through practice. Automate good decisions.

**Step 4: Becoming Gritty** (Chapter 6)
Grit = passion + perseverance over time. J.K. Rowling wrote Harry Potter through 12 rejections and poverty. Navigate "the middle" using small wins.

**Step 5: Handling Setbacks** (Chapters 6, 12)
How heroes respond to failure defines their legacy. Every person in the book faced crushing defeats - they refused to let those be final chapters.

**Step 6: Overcoming Limits** (Chapters 7, 8)
Leave the Comfort Zone, enter the Learning Zone. Steve Jobs' "Reality Distortion Field" - refuse to accept artificial limitations.

**Step 7: Persevering to the Finish** (Chapters 9, 10, 12)
Warren Buffett's Snowball - consistency over time. The Planning Fallacy - expect things to take longer. The journey has no end.

Which step speaks to where you are right now?`;
  }

  // Procrastination
  if (lastMessage.includes("procrastinat") || lastMessage.includes("put off") || lastMessage.includes("later") || lastMessage.includes("avoidance")) {
    return `Chapter 9, "The Long Term," has an entire section on defeating procrastination.

**Why We Procrastinate (from the book):**

1. **Delay Discounting** - Our brains value immediate rewards over future ones. The primitive brain wants satisfaction NOW.

2. **Impulsiveness** - Some people are more sensitive to immediate rewards than others.

3. **Perfectionism** - Fear of not doing it perfectly leads to not doing it at all.

4. **Task Aversion** - Some tasks just feel unpleasant, so we avoid them.

**The Planning Fallacy:**
We consistently underestimate how long things take. This makes tasks feel overwhelming before we start, feeding procrastination.

**Defeating Procrastination (strategies from Chapter 9):**

**1. Use Reference Class Forecasting**
Instead of guessing, look at how long similar tasks actually took. This reduces anxiety.

**2. Break It Into Chunks**
"Write chapter" is overwhelming. "Write 500 words" is doable.

**3. The Seinfeld Method**
Jerry Seinfeld's "don't break the chain" - focus on daily consistency rather than outcomes.

**4. Automate Goal Dedication**
Remove decisions. Schedule your important work. Make it automatic.

**5. Make Commitments**
Tell someone your deadline. Use accountability.

**The Snowball Effect:**
Once you start, momentum builds. The hardest part is the first action. Warren Buffett's approach: small, consistent actions compound.

What are you putting off right now? Let's break it down into a manageable first step.`;
  }

  // Default response with book grounding
  return `That's a great question. Let me share insights from "The Will of Heroes" methodology.

**The Core Framework:**
The book teaches three types of willpower:
• **Will Power** - The power to DO what needs to be done
• **Won't Power** - The power to RESIST temptation
• **Want Power** - The power connected to PURPOSE

Most struggles come from trying to rely on Will Power and Won't Power alone. The secret is connecting to your Want Power - your deep purpose that makes the struggle meaningful.

**Key Lessons from the Heroes:**
• **Kobe Bryant** - Work harder than everyone; use setbacks as fuel
• **Warren Buffett** - Consistency over time; the snowball effect
• **J.K. Rowling** - Persist through "the middle" when success isn't visible
• **Steve Jobs** - Refuse to accept artificial limitations

**Colin's Personal Experience:**
When Colin lost the use of his hands, every principle in this book was tested. Voice technology, adaptation, years of struggling to find new ways to work. The methodology isn't theory - it's lived experience.

Could you tell me more about what you're working through? I can draw on specific chapters and heroes that match your situation.`;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { messages } = body as { messages: Message[] };

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: "Messages are required" },
        { status: 400 }
      );
    }

    // Generate response based on the conversation and book knowledge
    const response = generateResponse(messages);

    // Simulate a slight delay for more natural feel
    await new Promise((resolve) => setTimeout(resolve, 500));

    return NextResponse.json({ message: response });
  } catch (error) {
    console.error("Chat API error:", error);
    return NextResponse.json(
      { error: "Failed to process request" },
      { status: 500 }
    );
  }
}
