"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { 
  Sparkles, 
  ArrowRight, 
  CheckCircle2, 
  Target, 
  Shield, 
  BarChart3,
  BookOpen,
  Play,
  Zap
} from "lucide-react";
import { Button } from "@/components/ui/button";

const benefits = [
  "Finally know what you're building toward (not just wandering)",
  "Make hard decisions on autopilot with your personal rulebook",
  "See yourself improving week over week with real data",
];

const features = [
  {
    icon: BookOpen,
    title: "Research-backed",
    description: "Not invented yesterday. Built on proven psychology and real stories of transformation.",
  },
  {
    icon: Sparkles,
    title: "AI that actually helps",
    description: "Willson doesn't just chat—it builds your system, tracks your progress, and keeps you honest.",
  },
  {
    icon: Zap,
    title: "20 minutes to clarity",
    description: "Define your purpose, set your rules, track what matters. That's it. That's the system.",
  },
];

export function AICoachHero() {
  return (
    <section className="relative min-h-screen flex items-center overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-slate-50 via-white to-amber-50/30" />
      
      {/* Subtle grid pattern */}
      <div 
        className="absolute inset-0 opacity-[0.015]"
        style={{
          backgroundImage: `linear-gradient(to right, currentColor 1px, transparent 1px), linear-gradient(to bottom, currentColor 1px, transparent 1px)`,
          backgroundSize: '60px 60px',
        }}
      />

      {/* Gradient orbs */}
      <div className="absolute top-20 left-1/4 w-96 h-96 bg-ember/10 rounded-full blur-3xl" />
      <div className="absolute bottom-20 right-1/4 w-96 h-96 bg-amber-400/10 rounded-full blur-3xl" />

      <div className="relative z-10 mx-auto max-w-7xl px-6 py-24 lg:py-32">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          
          {/* Left side - Copy */}
          <div>
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-ember/10 border border-ember/20 text-ember text-sm font-medium mb-6"
            >
              <BookOpen className="w-4 h-4" />
              <span>Based on &quot;The Will of Heroes&quot; methodology</span>
            </motion.div>

            {/* Main headline */}
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="font-serif text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-slate-900 mb-6 leading-[1.1]"
            >
              Stop drifting.
              <span className="block text-ember">Start achieving.</span>
            </motion.h1>

            {/* Subheadline */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="text-xl text-slate-600 mb-8 max-w-lg"
            >
              You don&apos;t need more motivation. You need a system. In 20 minutes, 
              Willson helps you build one that actually sticks.
            </motion.p>

            {/* Benefits */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="space-y-3 mb-8"
            >
              {benefits.map((benefit, i) => (
                <div key={i} className="flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                  <span className="text-slate-700">{benefit}</span>
                </div>
              ))}
            </motion.div>

            {/* CTAs */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="flex flex-col sm:flex-row gap-4 mb-6"
            >
              <Button 
                size="lg" 
                className="gradient-ember text-white hover:opacity-90 text-lg px-8 py-6 rounded-xl shadow-lg shadow-ember/25"
                asChild
              >
                <Link href="/signup">
                  Start Your Journey — Free
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Link>
              </Button>
              <Button 
                size="lg" 
                variant="outline" 
                className="text-lg px-8 py-6 rounded-xl border-slate-200 hover:bg-slate-50"
                asChild
              >
                <Link href="#how-it-works">
                  <Play className="w-4 h-4 mr-2" />
                  See How It Works
                </Link>
              </Button>
            </motion.div>

            {/* Trust signals */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.5 }}
              className="text-sm text-slate-500"
            >
              ✓ Free forever plan &nbsp;•&nbsp; ✓ No credit card required &nbsp;•&nbsp; ✓ Setup in 5 minutes
            </motion.p>
          </div>

          {/* Right side - Visual */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="relative"
          >
            {/* Main card - Dashboard preview */}
            <div className="relative bg-white rounded-2xl border border-slate-200 shadow-2xl shadow-slate-200/50 overflow-hidden">
              {/* Header */}
              <div className="bg-gradient-to-r from-slate-900 to-slate-800 p-6">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-3 h-3 rounded-full bg-red-400" />
                  <div className="w-3 h-3 rounded-full bg-amber-400" />
                  <div className="w-3 h-3 rounded-full bg-emerald-400" />
                </div>
                <div className="flex items-center gap-3">
                  <Target className="w-5 h-5 text-amber-400" />
                  <div>
                    <p className="text-xs text-slate-400 uppercase tracking-wide">Your Purpose</p>
                    <p className="text-white font-medium">Build a life of meaning and impact</p>
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="p-6 space-y-4">
                {/* Step indicators */}
                <div className="flex items-center gap-2 mb-4">
                  <span className="px-2 py-1 text-xs font-medium bg-amber-100 text-amber-700 rounded-full">Your Why</span>
                  <span className="px-2 py-1 text-xs font-medium bg-indigo-100 text-indigo-700 rounded-full">Your How</span>
                  <span className="px-2 py-1 text-xs font-medium bg-emerald-100 text-emerald-700 rounded-full">Your What</span>
                </div>

                {/* Principles */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-slate-500">
                    <Shield className="w-4 h-4 text-indigo-500" />
                    <span className="font-medium">Principles</span>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                    <div className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-xs font-bold">1</div>
                    <span className="text-sm text-slate-700">Consistency conquers intensity</span>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                    <div className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-xs font-bold">2</div>
                    <span className="text-sm text-slate-700">Confront the brutal facts</span>
                  </div>
                </div>

                {/* Scorecard preview */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-slate-500">
                    <BarChart3 className="w-4 h-4 text-emerald-500" />
                    <span className="font-medium">This Week&apos;s Progress</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="p-3 bg-emerald-50 rounded-xl text-center">
                      <p className="text-lg font-bold text-emerald-600">5/5</p>
                      <p className="text-xs text-emerald-600">Workouts</p>
                    </div>
                    <div className="p-3 bg-amber-50 rounded-xl text-center">
                      <p className="text-lg font-bold text-amber-600">4/5</p>
                      <p className="text-xs text-amber-600">Deep Work</p>
                    </div>
                    <div className="p-3 bg-emerald-50 rounded-xl text-center">
                      <p className="text-lg font-bold text-emerald-600">7/7</p>
                      <p className="text-xs text-emerald-600">Routine</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Floating Willson card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.7 }}
              className="absolute -bottom-6 -left-6 bg-white rounded-xl border border-slate-200 shadow-xl p-4 max-w-[280px]"
            >
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl gradient-ember flex items-center justify-center flex-shrink-0">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="font-medium text-slate-900 text-sm">Willson</p>
                  <p className="text-sm text-slate-600">&quot;You&apos;re on a 7-day streak! Keep going—consistency is your superpower.&quot;</p>
                </div>
              </div>
            </motion.div>

            {/* Book badge */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.8 }}
              className="absolute -top-4 -right-4 bg-white rounded-xl border border-slate-200 shadow-lg px-4 py-3"
            >
              <div className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-ember" />
                <div>
                  <p className="text-xs font-medium text-slate-900">Powered by</p>
                  <p className="text-xs text-slate-600">The Will of Heroes</p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>

        {/* Features row - replaces fake stats */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="mt-20 pt-12 border-t border-slate-200"
        >
          <div className="grid sm:grid-cols-3 gap-8">
            {features.map((feature, i) => (
              <div key={i} className="text-center">
                <div className="w-12 h-12 rounded-xl bg-ember/10 flex items-center justify-center mx-auto mb-4">
                  <feature.icon className="w-6 h-6 text-ember" />
                </div>
                <h3 className="font-semibold text-slate-900 mb-2">{feature.title}</h3>
                <p className="text-sm text-slate-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* The "Why This Works" section - replaces testimonials */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.7 }}
          className="mt-16"
        >
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-slate-900 mb-6">
              You&apos;ve tried willpower.<br />
              <span className="text-ember">Try a system instead.</span>
            </h2>
            <div className="grid sm:grid-cols-2 gap-6 text-left">
              <div className="bg-red-50 border border-red-100 rounded-2xl p-6">
                <p className="font-medium text-red-800 mb-3">❌ What doesn&apos;t work</p>
                <ul className="space-y-2 text-sm text-red-700">
                  <li>• Setting goals without knowing why they matter</li>
                  <li>• Relying on motivation (it always fades)</li>
                  <li>• Tracking outcomes you can&apos;t control</li>
                  <li>• Going it alone and hoping for the best</li>
                </ul>
              </div>
              <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-6">
                <p className="font-medium text-emerald-800 mb-3">✓ What does</p>
                <ul className="space-y-2 text-sm text-emerald-700">
                  <li>• A purpose that pulls you forward on hard days</li>
                  <li>• Principles that make decisions automatic</li>
                  <li>• A scorecard of actions you control</li>
                  <li>• A coach that&apos;s always in your corner</li>
                </ul>
              </div>
            </div>
            <p className="mt-8 text-slate-600">
              This isn&apos;t about working harder. It&apos;s about building a system 
              that does the hard work for you.
            </p>
            <Button 
              size="lg" 
              className="gradient-ember text-white hover:opacity-90 mt-6"
              asChild
            >
              <Link href="/signup">
                Try It Free — No Credit Card Required
              </Link>
            </Button>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
