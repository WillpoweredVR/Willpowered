"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, Sparkles, MessageCircle, Zap, Crown, ArrowRight, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  usage?: {
    used: number;
    limit: number;
    daysUntilReset: number | null;
  };
}

export function UpgradeModal({ isOpen, onClose, usage }: UpgradeModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", duration: 0.5 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden">
              {/* Header */}
              <div className="relative gradient-ember p-6 text-white text-center">
                <button
                  onClick={onClose}
                  className="absolute right-4 top-4 p-1 rounded-full hover:bg-white/20 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>

                <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center mx-auto mb-4">
                  <MessageCircle className="w-8 h-8" />
                </div>

                <h2 className="text-2xl font-serif font-bold mb-2">
                  You've used all your conversations
                </h2>
                <p className="text-white/80">
                  {usage?.used || 20} of {usage?.limit || 20} this month
                </p>
              </div>

              {/* Content */}
              <div className="p-6">
                {/* Reset info */}
                {usage?.daysUntilReset && (
                  <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl mb-6">
                    <Clock className="w-5 h-5 text-slate-400" />
                    <div className="text-sm">
                      <span className="text-slate-600">Your conversations reset in </span>
                      <span className="font-semibold text-slate-900">
                        {usage.daysUntilReset} day{usage.daysUntilReset !== 1 ? 's' : ''}
                      </span>
                    </div>
                  </div>
                )}

                {/* Upgrade benefits */}
                <div className="mb-6">
                  <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                    <Crown className="w-5 h-5 text-ember" />
                    Upgrade to Pro for:
                  </h3>
                  <ul className="space-y-2">
                    <li className="flex items-center gap-2 text-muted-foreground">
                      <Sparkles className="w-4 h-4 text-ember" />
                      <span><strong className="text-foreground">Unlimited</strong> conversations with Willson</span>
                    </li>
                    <li className="flex items-center gap-2 text-muted-foreground">
                      <Zap className="w-4 h-4 text-ember" />
                      <span>Priority response times</span>
                    </li>
                    <li className="flex items-center gap-2 text-muted-foreground">
                      <Sparkles className="w-4 h-4 text-ember" />
                      <span>Advanced insights & trend analysis</span>
                    </li>
                  </ul>
                </div>

                {/* Price */}
                <div className="text-center mb-6">
                  <div className="inline-flex items-baseline gap-1">
                    <span className="text-3xl font-bold text-foreground">$12</span>
                    <span className="text-muted-foreground">/month</span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    Start with a 7-day free trial
                  </p>
                </div>

                {/* CTAs */}
                <div className="space-y-3">
                  <Button asChild className="w-full gradient-ember text-white" size="lg">
                    <Link href="/checkout">
                      Start Free Trial
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Link>
                  </Button>
                  <Button
                    variant="ghost"
                    className="w-full text-muted-foreground"
                    onClick={onClose}
                  >
                    Maybe later
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}


