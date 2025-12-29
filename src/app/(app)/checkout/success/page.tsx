"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { CheckCircle, Sparkles, ArrowRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import confetti from "canvas-confetti";

function CheckoutSuccessContent() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    
    // Trigger confetti celebration
    const duration = 3 * 1000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

    function randomInRange(min: number, max: number) {
      return Math.random() * (max - min) + min;
    }

    const interval: ReturnType<typeof setInterval> = setInterval(function() {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        return clearInterval(interval);
      }

      const particleCount = 50 * (timeLeft / duration);
      
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
        colors: ['#E85A3C', '#F5F0E8', '#1E293B'],
      });
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
        colors: ['#E85A3C', '#F5F0E8', '#1E293B'],
      });
    }, 250);

    return () => clearInterval(interval);
  }, []);

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-cream to-white flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="max-w-lg w-full text-center"
      >
        {/* Success icon */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", delay: 0.2 }}
          className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-6"
        >
          <CheckCircle className="w-10 h-10 text-emerald-600" />
        </motion.div>

        <h1 className="font-serif text-3xl md:text-4xl font-bold text-foreground mb-4">
          Welcome to Pro! 🎉
        </h1>
        
        <p className="text-lg text-muted-foreground mb-8">
          Your 7-day free trial has started. You now have unlimited access to Willson 
          and all Pro features. Let's make this transformation happen.
        </p>

        {/* What's next */}
        <div className="bg-white rounded-2xl shadow-lg border border-border p-6 mb-8 text-left">
          <h2 className="font-semibold text-lg mb-4 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-ember" />
            What's next?
          </h2>
          <ul className="space-y-3 text-muted-foreground">
            <li className="flex items-start gap-3">
              <span className="w-6 h-6 rounded-full bg-ember/10 flex items-center justify-center flex-shrink-0 text-ember font-medium text-sm">1</span>
              <span>Complete your daily check-in with Willson</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="w-6 h-6 rounded-full bg-ember/10 flex items-center justify-center flex-shrink-0 text-ember font-medium text-sm">2</span>
              <span>Customize your scorecard with unlimited metrics</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="w-6 h-6 rounded-full bg-ember/10 flex items-center justify-center flex-shrink-0 text-ember font-medium text-sm">3</span>
              <span>Have deeper conversations with unlimited coaching</span>
            </li>
          </ul>
        </div>

        <Button asChild size="lg" className="gradient-ember text-white w-full">
          <Link href="/dashboard">
            Go to Dashboard
            <ArrowRight className="w-4 h-4 ml-2" />
          </Link>
        </Button>

        <p className="text-sm text-muted-foreground mt-6">
          Questions? Chat with Willson anytime. He's got your back.
        </p>
      </motion.div>
    </div>
  );
}

function LoadingFallback() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-cream to-white flex items-center justify-center p-6">
      <div className="text-center">
        <Loader2 className="w-8 h-8 animate-spin text-ember mx-auto mb-4" />
        <p className="text-muted-foreground">Loading...</p>
      </div>
    </div>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <CheckoutSuccessContent />
    </Suspense>
  );
}
