"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { 
  Check, 
  Sparkles, 
  Target, 
  MessageCircle, 
  BarChart3, 
  Zap,
  Shield,
  TrendingUp,
  Calendar,
  Download,
  Crown,
  ArrowRight,
  Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSubscription } from "@/hooks/useSubscription";

const freeTierFeatures = [
  { icon: Target, text: "Complete Purpose discovery journey" },
  { icon: Shield, text: "Up to 5 guiding Principles" },
  { icon: BarChart3, text: "Scorecard with 5 metrics" },
  { icon: MessageCircle, text: "20 AI coaching sessions/month" },
  { icon: Calendar, text: "Daily check-ins with summaries" },
  { icon: Sparkles, text: "Access to Willson, your AI coach" },
];

const proTierFeatures = [
  { icon: MessageCircle, text: "Unlimited AI coaching with Willson", highlight: true },
  { icon: BarChart3, text: "Unlimited scorecard metrics", highlight: true },
  { icon: TrendingUp, text: "Weekly insights & trend analysis", highlight: true },
  { icon: Sparkles, text: "Advanced personalized summaries", highlight: true },
  { icon: Zap, text: "Priority AI responses", highlight: true },
  { icon: Download, text: "Export your complete journey", highlight: true },
  { icon: Target, text: "Unlimited Principles", highlight: true },
  { icon: Calendar, text: "Historical progress tracking", highlight: true },
];

const faqs = [
  {
    q: "Can I really use Willpowered for free?",
    a: "Absolutely. Our free tier includes everything you need to discover your purpose, set your principles, and start tracking your scorecard. We want you to experience real transformation before asking for anything."
  },
  {
    q: "What happens when I hit the 20 conversation limit?",
    a: "You can still use all other features: check-ins, scorecard tracking, and reviewing your journey. Your conversations reset at the start of each month, or you can upgrade to Pro for unlimited coaching."
  },
  {
    q: "Can I cancel Pro anytime?",
    a: "Yes, cancel anytime with one click. No questions asked. You'll keep Pro access until the end of your billing period, and all your data stays yours forever."
  },
  {
    q: "Is my data private?",
    a: "Your journey is deeply personal, and we treat it that way. We never sell your data, never use it for ads, and never share it with third parties. You can export or delete everything anytime."
  },
  {
    q: "What's the difference between Willson's free and Pro responses?",
    a: "Free users get the same quality coaching. Willson doesn't hold back. Pro users get faster response times and can have unlimited conversations to go deeper on any topic."
  }
];

export default function PricingPage() {
  const router = useRouter();
  const { isPro, isTrialing, isLoading: subscriptionLoading, startCheckout, openPortal } = useSubscription();
  const [isCheckoutLoading, setIsCheckoutLoading] = useState(false);

  const handleStartTrial = async () => {
    setIsCheckoutLoading(true);
    try {
      await startCheckout();
    } catch (error) {
      console.error("Failed to start checkout:", error);
      // If not logged in, redirect to signup
      router.push("/signup?plan=pro");
    } finally {
      setIsCheckoutLoading(false);
    }
  };

  const handleManageSubscription = async () => {
    setIsCheckoutLoading(true);
    try {
      await openPortal();
    } catch (error) {
      console.error("Failed to open portal:", error);
    } finally {
      setIsCheckoutLoading(false);
    }
  };

  return (
    <div className="pt-24 pb-20">
        {/* Hero */}
        <section className="px-6 lg:px-8 mb-20">
          <div className="mx-auto max-w-4xl text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-50 text-emerald-700 text-sm font-medium mb-6">
                <Sparkles className="w-4 h-4" />
                Start free, upgrade when you're ready
              </span>
              
              <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-6">
                You know what to do.{" "}
                <span className="text-ember">Now actually do it.</span>
              </h1>
              
              <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
                You&apos;ve read the books. Made the lists. Set the goals. Still stuck in the same place? 
                That&apos;s not a you problem. It&apos;s a <span className="text-foreground font-medium">system</span> problem. 
                Let&apos;s fix it.
              </p>
            </motion.div>
          </div>
        </section>

        {/* Pricing Cards */}
        <section className="px-6 lg:px-8 mb-24">
          <div className="mx-auto max-w-5xl">
            <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
              
              {/* Free Tier */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="relative bg-white rounded-3xl border border-border p-8 lg:p-10 shadow-sm"
              >
                <div className="mb-8">
                  <h3 className="text-lg font-medium text-muted-foreground mb-2">Free</h3>
                  <div className="flex items-baseline gap-2">
                    <span className="text-5xl font-serif font-bold text-foreground">$0</span>
                    <span className="text-muted-foreground">forever</span>
                  </div>
                  <p className="mt-4 text-muted-foreground">
                    The complete system. No trial period. No bait-and-switch. Yours forever.
                  </p>
                </div>

                <Button asChild size="lg" variant="outline" className="w-full mb-8">
                  <Link href="/signup">
                    Get Started Free
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Link>
                </Button>

                <div className="space-y-4">
                  <p className="text-sm font-medium text-foreground">What's included:</p>
                  {freeTierFeatures.map((feature, index) => (
                    <div key={index} className="flex items-start gap-3">
                      <div className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Check className="w-3 h-3 text-emerald-600" />
                      </div>
                      <span className="text-muted-foreground">{feature.text}</span>
                    </div>
                  ))}
                </div>
              </motion.div>

              {/* Pro Tier */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="relative bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl p-8 lg:p-10 shadow-xl"
              >
                {/* Popular Badge */}
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-ember text-white text-sm font-medium shadow-lg shadow-ember/30">
                    <Crown className="w-4 h-4" />
                    Most Popular
                  </span>
                </div>

                <div className="mb-8">
                  <h3 className="text-lg font-medium text-slate-400 mb-2">Pro</h3>
                  <div className="flex items-baseline gap-2">
                    <span className="text-5xl font-serif font-bold text-white">$12</span>
                    <span className="text-slate-400">/month</span>
                  </div>
                  <p className="mt-2 text-slate-400">
                    or <span className="text-white font-medium">$99/year</span> (save 31%)
                  </p>
                  <p className="mt-4 text-slate-300">
                    Unlimited access. Unlimited coaching. For when &quot;good enough&quot; isn&apos;t.
                  </p>
                </div>

                {isPro || isTrialing ? (
                  <Button 
                    size="lg" 
                    className="w-full mb-8 bg-emerald-600 text-white hover:bg-emerald-700"
                    onClick={handleManageSubscription}
                    disabled={isCheckoutLoading}
                  >
                    {isCheckoutLoading ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : null}
                    {isTrialing ? "Currently on Trial - Manage" : "Current Plan - Manage"}
                  </Button>
                ) : (
                  <Button 
                    size="lg" 
                    className="w-full mb-8 gradient-ember text-white hover:opacity-90"
                    onClick={handleStartTrial}
                    disabled={isCheckoutLoading || subscriptionLoading}
                  >
                    {isCheckoutLoading ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : null}
                    Start 7-Day Free Trial
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                )}

                <div className="space-y-4">
                  <p className="text-sm font-medium text-white">Everything in Free, plus:</p>
                  {proTierFeatures.map((feature, index) => (
                    <div key={index} className="flex items-start gap-3">
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
                        feature.highlight ? 'bg-ember' : 'bg-slate-700'
                      }`}>
                        <Check className="w-3 h-3 text-white" />
                      </div>
                      <span className={feature.highlight ? 'text-white font-medium' : 'text-slate-300'}>
                        {feature.text}
                      </span>
                    </div>
                  ))}
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Value Comparison */}
        <section className="px-6 lg:px-8 mb-24">
          <div className="mx-auto max-w-4xl">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="bg-gradient-to-br from-cream to-white rounded-3xl p-8 lg:p-12 border border-border"
            >
              <h2 className="font-serif text-2xl md:text-3xl font-bold text-center text-foreground mb-8">
                Less than a single therapy session. Unlimited access.
              </h2>
              
              <div className="grid md:grid-cols-3 gap-8 text-center">
                <div>
                  <div className="text-4xl font-serif font-bold text-ember mb-2">∞</div>
                  <div className="font-medium text-foreground">Coaching Conversations</div>
                  <div className="text-sm text-muted-foreground mt-1">
                    A human coach costs $150+/hour
                  </div>
                </div>
                <div>
                  <div className="text-4xl font-serif font-bold text-ember mb-2">3am?</div>
                  <div className="font-medium text-foreground">Willson's awake</div>
                  <div className="text-sm text-muted-foreground mt-1">
                    Clarity on demand, not on a schedule
                  </div>
                </div>
                <div>
                  <div className="text-4xl font-serif font-bold text-ember mb-2">You</div>
                  <div className="font-medium text-foreground">Not generic advice</div>
                  <div className="text-sm text-muted-foreground mt-1">
                    Coaching based on your actual life
                  </div>
                </div>
              </div>

              <div className="mt-10 pt-8 border-t border-border">
                <p className="text-center text-muted-foreground">
                  <span className="font-medium text-foreground">You'll spend more on your next dinner out.</span>
                  <br className="hidden sm:block" />
                  {" "}This could actually change where your life goes.
                </p>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Social Proof / Transformation Focus */}
        <section className="px-6 lg:px-8 mb-24">
          <div className="mx-auto max-w-4xl text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="font-serif text-2xl md:text-3xl font-bold text-foreground mb-6">
                This isn&apos;t theory. It&apos;s survival.
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
                The methodology behind Willson comes from Colin&apos;s journey of rebuilding his life 
                after losing the use of his hands. It&apos;s battle-tested against real adversity, and 
                now it&apos;s available to help you with yours.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button asChild size="lg" className="gradient-ember text-white">
                  <Link href="/signup">
                    Start Your Journey Free
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline">
                  <Link href="/about">
                    Read Colin's Story
                  </Link>
                </Button>
              </div>
            </motion.div>
          </div>
        </section>

        {/* FAQ */}
        <section className="px-6 lg:px-8 mb-24">
          <div className="mx-auto max-w-3xl">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="font-serif text-2xl md:text-3xl font-bold text-center text-foreground mb-12">
                Questions? We've got answers.
              </h2>
              
              <div className="space-y-6">
                {faqs.map((faq, index) => (
                  <div key={index} className="bg-white rounded-2xl border border-border p-6">
                    <h3 className="font-medium text-foreground mb-2">{faq.q}</h3>
                    <p className="text-muted-foreground">{faq.a}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="px-6 lg:px-8">
          <div className="mx-auto max-w-4xl">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl p-8 lg:p-12 text-center"
            >
              <div className="w-16 h-16 rounded-2xl gradient-ember flex items-center justify-center mx-auto mb-6">
                <Sparkles className="w-8 h-8 text-white" />
              </div>
              
              <h2 className="font-serif text-2xl md:text-3xl font-bold text-white mb-4">
                Same time next year, you&apos;ll be different.
              </h2>
              <p className="text-slate-300 max-w-xl mx-auto mb-8">
                The only question is whether it&apos;ll be by design or by drift. 
                One takes 20 minutes to set up. The other takes another year of &quot;I&apos;ll start Monday.&quot;
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button asChild size="lg" className="gradient-ember text-white hover:opacity-90">
                  <Link href="/signup">
                    Start Free - No Credit Card
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Link>
                </Button>
              </div>
              
              <p className="mt-6 text-sm text-slate-400">
                Free forever plan available. Upgrade only if you love it.
              </p>
            </motion.div>
          </div>
        </section>
    </div>
  );
}

