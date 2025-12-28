"use client";

import { motion } from "framer-motion";
import { Sparkles, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { trackCTAClicked, trackSignupStarted } from "@/lib/posthog";

export function CTASection() {
  return (
    <section className="py-24 bg-white">
      <div className="mx-auto max-w-4xl px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="relative text-center p-12 sm:p-16 rounded-3xl overflow-hidden"
        >
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
          <div className="relative z-10">
            <motion.div
              initial={{ scale: 0 }}
              whileInView={{ scale: 1 }}
              viewport={{ once: true }}
              transition={{ type: "spring", delay: 0.2 }}
              className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center mx-auto mb-8"
            >
              <Sparkles className="w-8 h-8 text-white" />
            </motion.div>

            <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-semibold tracking-tight text-white mb-6">
              Ready to Strengthen<br />Your Willpower?
            </h2>
            
            <p className="text-white/80 text-lg max-w-xl mx-auto mb-10">
              Start a conversation with Willson. Get personalized 
              guidance based on the science of perseverance and the wisdom of heroes.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg" 
                className="bg-white text-ember hover:bg-white/90 gap-2 px-8"
                onClick={() => {
                  trackCTAClicked('footer-cta-coach', 'Talk to AI Coach', 'footer');
                  trackSignupStarted('footer_cta');
                }}
                asChild
              >
                <Link href="/signup">
                  <Sparkles className="w-4 h-4" />
                  Talk to AI Coach
                </Link>
              </Button>
              <Button 
                size="lg" 
                variant="outline" 
                className="border-white/30 text-white hover:bg-white/10 gap-2"
                onClick={() => trackCTAClicked('footer-cta-articles', 'Explore Articles', 'footer')}
                asChild
              >
                <Link href="/articles">
                  Explore Articles <ArrowRight className="w-4 h-4" />
                </Link>
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

