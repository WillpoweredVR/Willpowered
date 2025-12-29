"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Sparkles, Send, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ChatModal } from "./ChatModal";
import { useHeroVariant } from "@/hooks/useFeatureFlag";
import { trackChatStarted, trackCTAClicked } from "@/lib/posthog";

const suggestedPrompts = [
  "I know what to do, I just can't make myself do it",
  "What did Arnold Schwarzenegger do differently?",
  "I start strong but always fade",
  "What's the real secret to habits that stick?",
];

// A/B Test Variants for Headlines
const headlineVariants = {
  control: {
    line1: "Strengthen Your",
    line2: "Willpower",
  },
  discipline: {
    line1: "Build Unstoppable",
    line2: "Discipline",
  },
  coach: {
    line1: "Meet Your AI",
    line2: "Coach, Willson",
  },
};

export function AICoachHero() {
  const [inputValue, setInputValue] = useState("");
  const [isHovered, setIsHovered] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [initialMessage, setInitialMessage] = useState("");
  
  // A/B Test: Get headline variant
  const heroVariant = useHeroVariant();
  const headline = headlineVariants[heroVariant || 'control'];

  const handleSubmit = (message?: string) => {
    const text = message || inputValue;
    if (text.trim()) {
      // Track chat started
      trackChatStarted('hero_input');
      trackCTAClicked('hero-chat-submit', 'Ask', 'hero');
      
      setInitialMessage(text);
      setIsChatOpen(true);
      setInputValue("");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <>
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 gradient-warm" />
        
        {/* Subtle pattern overlay */}
        <div 
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)`,
            backgroundSize: '40px 40px',
          }}
        />

        {/* Ember glow effect */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full bg-ember/5 blur-3xl" />

        <div className="relative z-10 mx-auto max-w-4xl px-6 py-32 text-center">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-ember/10 text-ember text-sm font-medium mb-8"
          >
            <Sparkles className="w-4 h-4" />
            <span>Meet Willson, Your AI Coach</span>
          </motion.div>

          {/* Main headline - A/B Tested */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-5xl sm:text-6xl lg:text-7xl font-semibold tracking-tight text-foreground mb-6 leading-tight"
          >
            {headline.line1}
            <span className="block text-ember mt-2">{headline.line2}</span>
          </motion.h1>

          {/* Subheadline */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-xl text-muted-foreground max-w-2xl mx-auto mb-12 text-balance"
          >
            Learn from the extraordinary stories of heroes who overcame impossible odds. 
            Your personal AI coach is ready to guide you through the science of perseverance.
          </motion.p>

          {/* AI Chat Input */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="relative max-w-2xl mx-auto"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
          >
            <div 
              className={`relative bg-white rounded-2xl shadow-lg border-2 transition-all duration-300 ${
                isHovered ? 'border-ember shadow-xl shadow-ember/10' : 'border-border'
              }`}
            >
              <div className="flex items-center gap-4 p-4">
                <div className="w-10 h-10 rounded-xl gradient-ember flex items-center justify-center flex-shrink-0">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask Willson anything..."
                  className="flex-1 text-lg bg-transparent border-none outline-none placeholder:text-muted-foreground/50"
                />
                <Button 
                  size="lg" 
                  className="gradient-ember text-white hover:opacity-90 rounded-xl gap-2"
                  onClick={() => handleSubmit()}
                >
                  <Send className="w-4 h-4" />
                  <span className="hidden sm:inline">Ask</span>
                </Button>
              </div>
            </div>

            {/* Suggested prompts */}
            <div className="mt-4 flex flex-wrap justify-center gap-2">
              {suggestedPrompts.map((prompt, index) => (
                <button
                  key={prompt}
                  onClick={() => {
                    trackCTAClicked(`hero-prompt-${index}`, prompt, 'hero');
                    handleSubmit(prompt);
                  }}
                  className="px-4 py-2 text-sm text-muted-foreground bg-white/80 hover:bg-white hover:text-foreground border border-border/50 rounded-full transition-all hover:border-ember/30"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </motion.div>

          {/* Scroll indicator */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.8 }}
            className="absolute bottom-8 left-1/2 -translate-x-1/2"
          >
            <a 
              href="#journey" 
              className="flex flex-col items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <span className="text-sm">Explore the journey</span>
              <motion.div
                animate={{ y: [0, 8, 0] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                <ArrowRight className="w-5 h-5 rotate-90" />
              </motion.div>
            </a>
          </motion.div>
        </div>
      </section>

      {/* Chat Modal */}
      <ChatModal 
        isOpen={isChatOpen} 
        onClose={() => {
          setIsChatOpen(false);
          setInitialMessage("");
        }}
        initialMessage={initialMessage}
      />
    </>
  );
}
