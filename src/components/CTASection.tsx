"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Sparkles, Clock, Shield, Users } from "lucide-react";
import { Button } from "@/components/ui/button";

const reasons = [
  {
    icon: Clock,
    title: "Start in 5 minutes",
    description: "Not 5 hours of planning. Answer a few questions, get your system.",
  },
  {
    icon: Shield,
    title: "Works when motivation fails",
    description: "Because it will fail. Your system catches you when willpower doesn't.",
  },
  {
    icon: Users,
    title: "Always available",
    description: "3am doubt spiral? Willson is awake. Bad day? Willson has your back.",
  },
];

export function CTASection() {
  return (
    <section className="py-24 bg-white">
      <div className="mx-auto max-w-5xl px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center"
        >
          {/* Main CTA Card */}
          <div className="relative rounded-3xl overflow-hidden">
            {/* Background */}
            <div className="absolute inset-0 gradient-ember" />
            
            {/* Pattern overlay */}
            <div 
              className="absolute inset-0 opacity-10"
              style={{
                backgroundImage: `radial-gradient(circle at 1px 1px, white 1px, transparent 0)`,
                backgroundSize: '24px 24px',
              }}
            />

            {/* Content */}
            <div className="relative z-10 px-8 py-16 sm:px-16 sm:py-20">
              <motion.div
                initial={{ scale: 0 }}
                whileInView={{ scale: 1 }}
                viewport={{ once: true }}
                transition={{ type: "spring", delay: 0.2 }}
                className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center mx-auto mb-8"
              >
                <Sparkles className="w-8 h-8 text-white" />
              </motion.div>

              <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-white mb-6">
                The gap between who you are<br />
                and who you want to be?<br />
                <span className="text-amber-300">It&apos;s just a system.</span>
              </h2>
              
              <p className="text-white/90 text-lg sm:text-xl max-w-2xl mx-auto mb-10">
                You&apos;ve tried motivation. You&apos;ve tried discipline. You&apos;ve tried &quot;just doing it.&quot;
                <br className="hidden sm:block" />
                What if the answer isn&apos;t trying harder—it&apos;s building smarter?
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
                <Button 
                  size="lg" 
                  className="bg-white text-ember hover:bg-white/90 text-lg px-10 py-6 rounded-xl shadow-lg"
                  asChild
                >
                  <Link href="/signup">
                    <Sparkles className="w-5 h-5 mr-2" />
                    Start Your Journey — Free
                  </Link>
                </Button>
              </div>

              <p className="text-white/70 text-sm">
                No credit card required • Free forever plan available •{" "}
                <Link href="/pricing" className="underline hover:text-white">
                  See all plans
                </Link>
              </p>
            </div>
          </div>

          {/* Reasons to act now */}
          <div className="mt-16 grid sm:grid-cols-3 gap-8">
            {reasons.map((reason, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="text-center"
              >
                <div className="w-12 h-12 rounded-xl bg-ember/10 flex items-center justify-center mx-auto mb-4">
                  <reason.icon className="w-6 h-6 text-ember" />
                </div>
                <h3 className="font-semibold text-slate-900 mb-2">{reason.title}</h3>
                <p className="text-slate-600 text-sm">{reason.description}</p>
              </motion.div>
            ))}
          </div>

          {/* Final urgency */}
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="mt-16 p-6 bg-slate-50 rounded-2xl border border-slate-200"
          >
            <p className="text-slate-700">
              <span className="font-semibold">A year from now, you&apos;ll be somewhere.</span>
              <br />
              <span className="text-slate-500">The question is: will it be where you want to be?</span>
            </p>
            <Link 
              href="/signup" 
              className="inline-flex items-center gap-2 text-ember font-medium mt-4 hover:underline"
            >
              Start building your system <ArrowRight className="w-4 h-4" />
            </Link>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
