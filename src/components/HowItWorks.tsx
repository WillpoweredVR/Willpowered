"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Target, Shield, BarChart3, ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

const steps = [
  {
    number: "01",
    icon: Target,
    title: "Define Your Purpose",
    label: "Your Why",
    color: "amber",
    description: "Willson asks the questions you've been avoiding. In one conversation, you'll have more clarity than years of vague goal-setting.",
    example: "\"I want to be the kind of person my kids look up to: present, healthy, and building something meaningful.\"",
    time: "5 min",
  },
  {
    number: "02", 
    icon: Shield,
    title: "Set Your Principles",
    label: "Your How",
    color: "indigo",
    description: "Your personal rulebook. When you know your principles, hard decisions become obvious ones. No more analysis paralysis.",
    example: "\"Do the hard thing first.\" Stop letting the easy stuff eat your best hours.",
    time: "10 min",
  },
  {
    number: "03",
    icon: BarChart3,
    title: "Build Your Scorecard",
    label: "Your What",
    color: "emerald",
    description: "Track what you do, not what happens to you. These are the actions that compound into the person you want to become.",
    example: "4 deep work sessions. 5 workouts. 2 dates with my partner. Your numbers. Your targets.",
    time: "5 min",
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="py-24 bg-white">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-ember font-medium mb-4 uppercase tracking-wider text-sm"
          >
            The Framework
          </motion.p>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="font-serif text-4xl sm:text-5xl font-bold tracking-tight text-slate-900 mb-6"
          >
            Why → How → What
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-lg text-slate-600"
          >
            Habits without purpose are just busywork. Goals without systems are just wishes. 
            Here&apos;s how to build something that actually lasts.
          </motion.p>
        </div>

        {/* Steps */}
        <div className="space-y-8 mb-16">
          {steps.map((step, index) => (
            <motion.div
              key={step.number}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="relative"
            >
              <div className={`
                bg-gradient-to-r rounded-2xl p-8 lg:p-10
                ${step.color === 'amber' ? 'from-amber-50 to-orange-50 border border-amber-100' : ''}
                ${step.color === 'indigo' ? 'from-indigo-50 to-violet-50 border border-indigo-100' : ''}
                ${step.color === 'emerald' ? 'from-emerald-50 to-teal-50 border border-emerald-100' : ''}
              `}>
                <div className="flex flex-col lg:flex-row lg:items-center gap-6 lg:gap-10">
                  {/* Step indicator */}
                  <div className="flex items-center gap-4 lg:w-48 flex-shrink-0">
                    <div className={`
                      w-14 h-14 rounded-2xl flex items-center justify-center
                      ${step.color === 'amber' ? 'bg-amber-100' : ''}
                      ${step.color === 'indigo' ? 'bg-indigo-100' : ''}
                      ${step.color === 'emerald' ? 'bg-emerald-100' : ''}
                    `}>
                      <step.icon className={`
                        w-7 h-7
                        ${step.color === 'amber' ? 'text-amber-600' : ''}
                        ${step.color === 'indigo' ? 'text-indigo-600' : ''}
                        ${step.color === 'emerald' ? 'text-emerald-600' : ''}
                      `} />
                    </div>
                    <div>
                      <span className={`
                        text-xs font-bold uppercase tracking-wider
                        ${step.color === 'amber' ? 'text-amber-600' : ''}
                        ${step.color === 'indigo' ? 'text-indigo-600' : ''}
                        ${step.color === 'emerald' ? 'text-emerald-600' : ''}
                      `}>
                        Step {step.number}
                      </span>
                      <span className={`
                        ml-2 px-2 py-0.5 text-xs font-medium rounded-full
                        ${step.color === 'amber' ? 'bg-amber-200 text-amber-700' : ''}
                        ${step.color === 'indigo' ? 'bg-indigo-200 text-indigo-700' : ''}
                        ${step.color === 'emerald' ? 'bg-emerald-200 text-emerald-700' : ''}
                      `}>
                        {step.label}
                      </span>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="flex-1">
                    <h3 className="font-serif text-2xl font-bold text-slate-900 mb-3">
                      {step.title}
                    </h3>
                    <p className="text-slate-600 mb-4 max-w-2xl">
                      {step.description}
                    </p>
                    <div className={`
                      inline-block px-4 py-2 rounded-lg text-sm italic
                      ${step.color === 'amber' ? 'bg-amber-100/50 text-amber-800' : ''}
                      ${step.color === 'indigo' ? 'bg-indigo-100/50 text-indigo-800' : ''}
                      ${step.color === 'emerald' ? 'bg-emerald-100/50 text-emerald-800' : ''}
                    `}>
                      {step.example}
                    </div>
                  </div>

                  {/* Time */}
                  <div className="lg:text-right">
                    <span className="text-sm text-slate-500">
                      ~{step.time}
                    </span>
                  </div>
                </div>
              </div>

              {/* Connector arrow */}
              {index < steps.length - 1 && (
                <div className="flex justify-center py-4">
                  <ArrowRight className="w-6 h-6 text-slate-300 rotate-90" />
                </div>
              )}
            </motion.div>
          ))}
        </div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center"
        >
          <p className="text-slate-600 mb-6">
            <span className="font-semibold text-slate-900">Total time: ~20 minutes</span> to create a system 
            that will guide you for years.
          </p>
          <Button 
            size="lg" 
            className="gradient-ember text-white hover:opacity-90 text-lg px-10 py-6 rounded-xl shadow-lg shadow-ember/25"
            asChild
          >
            <Link href="/signup">
              <Sparkles className="w-5 h-5 mr-2" />
              Start Building Your System
            </Link>
          </Button>
        </motion.div>
      </div>
    </section>
  );
}

