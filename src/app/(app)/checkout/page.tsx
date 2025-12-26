"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { loadStripe } from "@stripe/stripe-js";
import {
  EmbeddedCheckoutProvider,
  EmbeddedCheckout,
} from "@stripe/react-stripe-js";
import { motion } from "framer-motion";
import { 
  Shield, 
  Sparkles, 
  Check, 
  ArrowLeft,
  Clock,
  CreditCard,
  Lock
} from "lucide-react";

// Load Stripe outside of component to avoid recreating on every render
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

const benefits = [
  "Unlimited AI coaching with Willson",
  "Unlimited scorecard metrics",
  "Weekly insights & trend analysis",
  "Advanced personalized summaries",
  "Priority AI responses",
  "Export your complete journey",
];

export default function CheckoutPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  const fetchClientSecret = useCallback(async () => {
    try {
      const response = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ embedded: true }),
      });

      const data = await response.json();

      if (data.error) {
        if (data.error === "You must be logged in to subscribe") {
          router.push("/login?redirect=/checkout");
          return "";
        }
        throw new Error(data.error);
      }

      return data.clientSecret;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load checkout");
      return "";
    }
  }, [router]);

  const options = { fetchClientSecret };

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-cream to-white flex items-center justify-center p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">Something went wrong</h1>
          <p className="text-muted-foreground mb-6">{error}</p>
          <Link href="/pricing" className="text-ember hover:underline">
            ← Back to pricing
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <header className="border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg gradient-ember flex items-center justify-center">
              <span className="font-serif font-bold text-white">W</span>
            </div>
            <span className="font-serif text-lg font-semibold text-white">Willpowered</span>
          </Link>
          <Link 
            href="/pricing" 
            className="text-slate-400 hover:text-white transition-colors flex items-center gap-2 text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to pricing
          </Link>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6 py-12">
        <div className="grid lg:grid-cols-2 gap-12 items-start">
          {/* Left side - Product info */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="text-white"
          >
            <div className="mb-8">
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-ember/20 text-ember text-sm font-medium mb-4">
                <Clock className="w-4 h-4" />
                7-day free trial
              </span>
              <h1 className="font-serif text-3xl md:text-4xl font-bold mb-4">
                Start your transformation
              </h1>
              <p className="text-slate-300 text-lg">
                Get unlimited access to Willson, your AI willpower coach. 
                Your card won't be charged for 7 days.
              </p>
            </div>

            {/* What's included */}
            <div className="bg-white/5 rounded-2xl p-6 mb-8 border border-white/10">
              <h2 className="font-semibold text-lg mb-4 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-ember" />
                What's included in Pro
              </h2>
              <div className="space-y-3">
                {benefits.map((benefit, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                      <Check className="w-3 h-3 text-emerald-400" />
                    </div>
                    <span className="text-slate-300">{benefit}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Price summary */}
            <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
              <div className="flex justify-between items-center mb-4">
                <span className="text-slate-300">Willpowered Pro</span>
                <span className="text-white font-semibold">$12/month</span>
              </div>
              <div className="flex justify-between items-center pb-4 border-b border-white/10">
                <span className="text-slate-300">7-day free trial</span>
                <span className="text-emerald-400 font-medium">-$12.00</span>
              </div>
              <div className="flex justify-between items-center pt-4">
                <span className="text-white font-semibold">Due today</span>
                <span className="text-2xl font-bold text-white">$0.00</span>
              </div>
              <p className="text-slate-400 text-sm mt-4">
                Then $12/month starting 7 days from now. Cancel anytime.
              </p>
            </div>

            {/* Trust badges */}
            <div className="mt-8 flex items-center gap-6 text-slate-400 text-sm">
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4" />
                <span>Secure checkout</span>
              </div>
              <div className="flex items-center gap-2">
                <CreditCard className="w-4 h-4" />
                <span>Powered by Stripe</span>
              </div>
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4" />
                <span>Cancel anytime</span>
              </div>
            </div>
          </motion.div>

          {/* Right side - Stripe Embedded Checkout */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="bg-white rounded-2xl shadow-2xl overflow-hidden"
          >
            <div className="p-1">
              <EmbeddedCheckoutProvider stripe={stripePromise} options={options}>
                <EmbeddedCheckout />
              </EmbeddedCheckoutProvider>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}



