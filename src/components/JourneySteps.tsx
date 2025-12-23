"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { 
  Compass, 
  BookOpen, 
  Repeat, 
  Flame, 
  Shield, 
  Unlock, 
  Trophy,
  ArrowRight 
} from "lucide-react";

const steps = [
  {
    number: 1,
    title: "Finding Your Purpose",
    description: "Discover the 'why' that will fuel your journey through every challenge.",
    icon: Compass,
    href: "/journey/finding-your-purpose",
    color: "from-amber-500 to-orange-600",
  },
  {
    number: 2,
    title: "Acquiring Skills",
    description: "Build the competencies and knowledge you need to succeed.",
    icon: BookOpen,
    href: "/journey/acquiring-skills",
    color: "from-emerald-500 to-teal-600",
  },
  {
    number: 3,
    title: "Establishing Habits",
    description: "Create systems that make success automatic and sustainable.",
    icon: Repeat,
    href: "/journey/establishing-habits",
    color: "from-blue-500 to-indigo-600",
  },
  {
    number: 4,
    title: "Becoming Gritty",
    description: "Develop the passion and perseverance for long-term goals.",
    icon: Flame,
    href: "/journey/becoming-gritty",
    color: "from-rose-500 to-pink-600",
  },
  {
    number: 5,
    title: "Handling Setbacks",
    description: "Learn to bounce back stronger when things don't go as planned.",
    icon: Shield,
    href: "/journey/handling-setbacks",
    color: "from-violet-500 to-purple-600",
  },
  {
    number: 6,
    title: "Overcoming Limits",
    description: "Break through the barriers that seem impossible to cross.",
    icon: Unlock,
    href: "/journey/overcoming-limits",
    color: "from-cyan-500 to-blue-600",
  },
  {
    number: 7,
    title: "Persevering to the Finish",
    description: "Push through the final stretch to achieve your ultimate goals.",
    icon: Trophy,
    href: "/journey/persevering",
    color: "from-yellow-500 to-amber-600",
  },
];

export function JourneySteps() {
  return (
    <section id="journey" className="py-24 bg-white">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        {/* Section header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-ember font-medium mb-4"
          >
            THE 7-STEP FRAMEWORK
          </motion.p>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="font-serif text-4xl sm:text-5xl font-semibold tracking-tight text-foreground mb-6"
          >
            The Willpower Journey
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-lg text-muted-foreground text-balance"
          >
            A proven path from discovery to mastery, drawn from the stories of 
            heroes who transformed adversity into triumph.
          </motion.p>
        </div>

        {/* Steps grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {steps.map((step, index) => (
            <motion.div
              key={step.number}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className={index === 6 ? "md:col-span-2 lg:col-span-1" : ""}
            >
              <Link
                href={step.href}
                className="group block h-full p-6 bg-card border border-border rounded-2xl hover:border-ember/30 hover:shadow-lg hover:shadow-ember/5 transition-all duration-300"
              >
                {/* Step number and icon */}
                <div className="flex items-start justify-between mb-4">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${step.color} flex items-center justify-center`}>
                    <step.icon className="w-6 h-6 text-white" />
                  </div>
                  <span className="text-5xl font-serif font-bold text-muted/20 group-hover:text-ember/20 transition-colors">
                    {step.number}
                  </span>
                </div>

                {/* Content */}
                <h3 className="font-serif text-xl font-semibold text-foreground mb-2 group-hover:text-ember transition-colors">
                  {step.title}
                </h3>
                <p className="text-muted-foreground text-sm leading-relaxed mb-4">
                  {step.description}
                </p>

                {/* Link */}
                <span className="inline-flex items-center gap-2 text-sm font-medium text-ember opacity-0 group-hover:opacity-100 transition-opacity">
                  Explore step <ArrowRight className="w-4 h-4" />
                </span>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

