// Journey step configuration - the 7-step Willpowered framework
export interface JourneyStep {
  slug: string;
  number: number;
  title: string;
  tagline: string;
  description: string;
  heroQuote?: {
    text: string;
    author: string;
    source?: string;
  };
  keyPrinciples: string[];
  categories: string[]; // Categories that map to this step
  color: string; // Accent color for the step
  icon: string; // Lucide icon name
}

export const journeySteps: JourneyStep[] = [
  {
    slug: "finding-your-purpose",
    number: 1,
    title: "Finding Your Purpose",
    tagline: "Discover what truly drives you",
    description: `Every hero's journey begins with discovering their purpose: the "why" that fuels their determination. Purpose isn't found; it's cultivated through self-reflection, experimentation, and honest assessment of what makes you come alive. When you have a clear purpose, obstacles become stepping stones rather than roadblocks. Your purpose is the compass that guides every decision and the fuel that powers your willpower when motivation fades.`,
    heroQuote: {
      text: "He who has a why to live can bear almost any how.",
      author: "Friedrich Nietzsche",
    },
    keyPrinciples: [
      "Purpose provides direction when motivation fails",
      "Your purpose connects your daily actions to a larger meaning",
      "Finding purpose requires experimentation and self-reflection",
      "Purpose evolves as you grow. Stay open to its transformation",
    ],
    categories: ["Finding Your Purpose"],
    color: "from-amber-500 to-orange-600",
    icon: "Compass",
  },
  {
    slug: "acquiring-skills",
    number: 2,
    title: "Acquiring Skills & Knowledge",
    tagline: "Build the foundation for excellence",
    description: `Knowledge is the raw material of achievement. The world's greatest heroes were relentless learners who treated every experience as an opportunity to grow. Deliberate practice, focused study, and continuous improvement separate those who dream from those who achieve. Skills compound over time. Every hour invested in learning today multiplies your capabilities tomorrow.`,
    heroQuote: {
      text: "An investment in knowledge pays the best interest.",
      author: "Benjamin Franklin",
    },
    keyPrinciples: [
      "Deliberate practice beats mindless repetition",
      "Learn from those who've walked the path before you",
      "Skills compound. Small improvements lead to massive results",
      "Stay curious and embrace the discomfort of not knowing",
    ],
    categories: ["Skills & Knowledge", "Acquiring Skills"],
    color: "from-blue-500 to-indigo-600",
    icon: "BookOpen",
  },
  {
    slug: "establishing-habits",
    number: 3,
    title: "Establishing Great Habits",
    tagline: "Automate your path to success",
    description: `Willpower is a muscle that fatigues, but habits run on autopilot. The most successful people don't rely on motivation; they build systems that make excellence inevitable. By designing your environment and routines strategically, you reduce the friction to good choices and increase the cost of bad ones. Great habits are the architecture of an extraordinary life.`,
    heroQuote: {
      text: "We are what we repeatedly do. Excellence, then, is not an act, but a habit.",
      author: "Aristotle",
    },
    keyPrinciples: [
      "Habits conserve willpower for decisions that truly matter",
      "Environment design beats willpower every time",
      "Stack new habits onto existing routines",
      "Start small. Consistency beats intensity",
    ],
    categories: ["Establishing Habits", "Establishing Great Habits"],
    color: "from-emerald-500 to-teal-600",
    icon: "Repeat",
  },
  {
    slug: "becoming-gritty",
    number: 4,
    title: "Becoming Gritty",
    tagline: "Cultivate passion and perseverance",
    description: `Grit is the intersection of passion and perseverance: the sustained commitment to long-term goals despite setbacks. It's not about being the most talented; it's about being the most dedicated. Gritty individuals understand that mastery takes years, not months, and they embrace the daily grind that others avoid. Grit can be developed through challenge, practice, and a growth mindset.`,
    heroQuote: {
      text: "Enthusiasm is common. Endurance is rare.",
      author: "Angela Duckworth",
      source: "Grit: The Power of Passion and Perseverance",
    },
    keyPrinciples: [
      "Passion sustains effort when the initial excitement fades",
      "Embrace struggle as the path to growth",
      "Commit to your goals for the long haul",
      "Develop a growth mindset. Effort leads to improvement",
    ],
    categories: ["Becoming Gritty"],
    color: "from-red-500 to-rose-600",
    icon: "Flame",
  },
  {
    slug: "handling-setbacks",
    number: 5,
    title: "Handling Setbacks",
    tagline: "Transform obstacles into opportunities",
    description: `Setbacks are not the opposite of success. They're part of it. Every hero in history faced rejection, failure, and moments of despair. What separated them was their response: they used setbacks as feedback, fuel, and motivation. Resilience isn't about avoiding falls; it's about how quickly and wisely you rise. The obstacle in your path becomes the path.`,
    heroQuote: {
      text: "The impediment to action advances action. What stands in the way becomes the way.",
      author: "Marcus Aurelius",
      source: "Meditations",
    },
    keyPrinciples: [
      "Reframe failures as learning opportunities",
      "Setbacks reveal what needs to change",
      "Resilience is built through adversity, not despite it",
      "Control your response. It's the one thing always in your power",
    ],
    categories: ["Handling Setbacks"],
    color: "from-violet-500 to-purple-600",
    icon: "RefreshCcw",
  },
  {
    slug: "overcoming-limits",
    number: 6,
    title: "Overcoming Limits",
    tagline: "Break through your perceived boundaries",
    description: `Most limits are mental, not physical. The stories of heroes who achieved the "impossible" reveal a common thread: they refused to accept conventional boundaries. Breaking limits requires challenging your assumptions, pushing past comfort zones, and discovering that you're capable of far more than you believe. Your potential expands when you test its edges.`,
    heroQuote: {
      text: "Whether you think you can or you think you can't, you're right.",
      author: "Henry Ford",
    },
    keyPrinciples: [
      "Most limitations are self-imposed beliefs",
      "Comfort zones shrink unless deliberately expanded",
      "Small wins build confidence for bigger challenges",
      "Surround yourself with people who've broken similar limits",
    ],
    categories: ["Overcoming Limits"],
    color: "from-cyan-500 to-blue-600",
    icon: "TrendingUp",
  },
  {
    slug: "persevering",
    number: 7,
    title: "Persevering to the Finish",
    tagline: "Cross the finish line with determination",
    description: `The final stretch is often the hardest. When you're exhausted, discouraged, and tempted to quit, perseverance becomes your greatest asset. Heroes don't finish because they never wanted to quit. They finish because they refused to. The ability to push through the final mile, when every fiber of your being wants to stop, is what separates the good from the legendary.`,
    heroQuote: {
      text: "It does not matter how slowly you go as long as you do not stop.",
      author: "Confucius",
    },
    keyPrinciples: [
      "The last 10% requires 50% of the effort. Prepare for it",
      "Visualize crossing the finish line during hard moments",
      "Break the final stretch into smaller milestones",
      "Remember why you started when you're tempted to quit",
    ],
    categories: ["Persevering", "Persevering to the Finish"],
    color: "from-amber-500 to-yellow-500",
    icon: "Trophy",
  },
];

export function getJourneyStepBySlug(slug: string): JourneyStep | undefined {
  return journeySteps.find((step) => step.slug === slug);
}

export function getAllJourneySlugs(): string[] {
  return journeySteps.map((step) => step.slug);
}






