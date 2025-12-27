"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { Sparkles, Send, Loader2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import ReactMarkdown from "react-markdown";

interface Message {
  role: "coach" | "user";
  content: string;
  options?: { label: string; value: string }[];
}

// The coach's welcome message
const WELCOME_MESSAGE = `Hey there! 👋 Welcome to Willpowered.

I'm **Willson**, your AI coach - and yes, the name is a nod to Wilson from Castaway. Just like Wilson was Tom Hanks' companion through his impossible journey, I'm here to be yours. 🏐

I'm genuinely excited to meet you. Before we dive in, let me share the simple framework that separates people who achieve lasting change from those who don't.

**It's about starting with WHY, then HOW, then WHAT.**

Here's how it works:

**1. PURPOSE (Your Why)** — This is the foundation. Why do you get out of bed? What makes the hard days worth it? Without a clear why, you'll quit when things get tough.

**2. PRINCIPLES (Your How)** — These are the rules you live by. The standards that guide your decisions when no one's watching. They're how your purpose shows up in your daily life.

**3. SCORECARD (Your What)** — These are the specific actions you track weekly. Not outcomes you can't control, but leading indicators that tell you if you're becoming who you want to be.

Most people jump straight to the "what"—habits, goals, to-do lists. But without a clear why and how, those habits don't stick. They're disconnected from meaning.

**The beautiful thing? You don't need to be special to do this.** You just need a system and someone in your corner. That's where I come in.

So let's start with the most important piece—your purpose. This is what everything else builds on.`;

const PURPOSE_QUESTION = `Here's my question for you:

**Do you already have a sense of your purpose, or would you like me to help you discover it?**`;

const PURPOSE_OPTIONS = [
  { label: "I know my purpose — let me share it", value: "know" },
  { label: "I have a vague idea, help me clarify it", value: "vague" },
  { label: "I'm not sure — help me discover it", value: "discover" },
];

// Discovery question prompts (just the questions, AI will handle transitions)
const DISCOVERY_QUESTIONS = [
  {
    prompt: "ask_flow_state",
    question: "When was the last time you completely lost track of time because you were so absorbed in something? What were you doing? How did it feel?",
    field: "loseTrackOfTime",
  },
  {
    prompt: "ask_frustrations",
    question: "What problems in the world genuinely frustrate you? Not minor annoyances—things that make you think 'someone should really fix this.'",
    field: "problemsThatAngerYou",
  },
  {
    prompt: "ask_money_no_object",
    question: "Imagine money isn't a concern. You have everything you need financially. How would you spend your days?",
    field: "whatIfMoneyNoFactor",
  },
  {
    prompt: "ask_admiration",
    question: "Who do you deeply admire? It could be someone famous, someone you know personally, or even a fictional character. What specifically draws you to them?",
    field: "whoYouAdmire",
  },
  {
    prompt: "ask_regret",
    question: "At the end of your life, what would you most regret NOT having attempted? Don't be modest here. Dream big.",
    field: "whatYoudRegretNotAttempting",
  },
];

export default function OnboardingPage() {
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [stage, setStage] = useState<"welcome" | "purpose-choice" | "discovery" | "clarify" | "purpose-confirm" | "goal" | "goal-why" | "complete">("welcome");
  const [discoveryIndex, setDiscoveryIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [purpose, setPurpose] = useState("");
  const [goal, setGoal] = useState("");
  const [goalWhy, setGoalWhy] = useState("");
  const [userName, setUserName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const hasInitialized = useRef(false);

  useEffect(() => {
    // Prevent duplicate initialization (React Strict Mode / fast refresh)
    if (hasInitialized.current) return;
    hasInitialized.current = true;

    const init = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("full_name")
          .eq("id", user.id)
          .single();
        
        if (profile?.full_name) {
          setUserName(profile.full_name.split(" ")[0]);
        }
      }
      
      // Start with welcome message
      setTimeout(() => {
        showTypingThenMessage(WELCOME_MESSAGE, () => {
          // Add a meaningful pause before the question (feels more natural)
          setTimeout(() => {
            addMessage({
              role: "coach",
              content: PURPOSE_QUESTION,
              options: PURPOSE_OPTIONS,
            });
            setStage("purpose-choice");
          }, 1800); // ~2 second pause between welcome and question
        });
      }, 500);
    };
    
    init();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (stage !== "welcome" && inputRef.current) {
      inputRef.current.focus();
    }
  }, [stage, messages]);

  const showTypingThenMessage = (content: string, onComplete?: () => void) => {
    setIsTyping(true);
    const delay = Math.min(2000, content.length * 3);
    
    setTimeout(() => {
      setMessages(prev => [...prev, { role: "coach", content }]);
      setIsTyping(false);
      onComplete?.();
    }, delay);
  };

  const addMessage = (message: Message) => {
    setMessages(prev => [...prev, message]);
  };

  // Call the AI to get a personalized response
  const getAIResponse = async (prompt: string, context: Record<string, string>): Promise<string> => {
    try {
      const response = await fetch("/api/onboarding-coach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, context, userName }),
      });
      
      if (!response.ok) throw new Error("Failed to get response");
      
      const data = await response.json();
      return data.message;
    } catch (error) {
      console.error("AI response error:", error);
      // Fallback to a generic but warm response
      return "Thank you for sharing that with me. I can feel how much that means to you. Let's continue exploring...";
    }
  };

  const handleOptionSelect = async (value: string) => {
    const option = PURPOSE_OPTIONS.find(o => o.value === value);
    if (option) {
      addMessage({ role: "user", content: option.label });
    }

    if (value === "know" || value === "vague") {
      setStage("clarify");
      setIsTyping(true);
      const response = await getAIResponse("clarify_purpose", { choice: value });
      setIsTyping(false);
      addMessage({ role: "coach", content: response });
    } else {
      setStage("discovery");
      setIsTyping(true);
      const response = await getAIResponse("start_discovery", {});
      setIsTyping(false);
      addMessage({ role: "coach", content: response });
    }
  };

  const handleSend = async () => {
    if (!input.trim() || isTyping) return;

    const userMessage = input.trim();
    addMessage({ role: "user", content: userMessage });
    setInput("");
    // Reset textarea height
    if (inputRef.current) {
      inputRef.current.style.height = "auto";
    }
    setIsTyping(true);

    if (stage === "discovery") {
      const currentQ = DISCOVERY_QUESTIONS[discoveryIndex];
      const newAnswers = { ...answers, [currentQ.field]: userMessage };
      setAnswers(newAnswers);

      if (discoveryIndex < DISCOVERY_QUESTIONS.length - 1) {
        // Get AI response acknowledging their answer and asking next question
        const nextQ = DISCOVERY_QUESTIONS[discoveryIndex + 1];
        const response = await getAIResponse("discovery_transition", {
          previousQuestion: currentQ.field,
          previousAnswer: userMessage,
          nextQuestion: nextQ.question,
          questionNumber: String(discoveryIndex + 2),
          totalQuestions: String(DISCOVERY_QUESTIONS.length),
          allAnswers: JSON.stringify(newAnswers),
        });
        
        setDiscoveryIndex(prev => prev + 1);
        setIsTyping(false);
        addMessage({ role: "coach", content: response });
      } else {
        // Synthesize purpose from all answers
        const response = await getAIResponse("synthesize_purpose", {
          allAnswers: JSON.stringify(newAnswers),
        });
        
        setStage("purpose-confirm");
        setIsTyping(false);
        addMessage({ role: "coach", content: response });
      }
    } else if (stage === "clarify") {
      setPurpose(userMessage);
      const response = await getAIResponse("confirm_purpose", {
        sharedPurpose: userMessage,
      });
      
      setStage("purpose-confirm");
      setIsTyping(false);
      addMessage({ role: "coach", content: response });
    } else if (stage === "purpose-confirm") {
      // Check if they're confirming or ready to move on
      const isConfirming = /yes|good|right|perfect|love|great|exactly|resonates|works|complete|ready|let'?s|channel|move on|next|go|do it|sounds|that'?s it|nailed|spot on|absolutely|definitely|correct/i.test(userMessage);
      
      if (isConfirming) {
        const finalPurpose = purpose || userMessage;
        setPurpose(finalPurpose);
        
        const response = await getAIResponse("transition_to_goal", {
          purpose: finalPurpose,
          allAnswers: JSON.stringify(answers),
        });
        
        setStage("goal");
        setIsTyping(false);
        addMessage({ role: "coach", content: response });
      } else {
        // They're providing a new/adjusted purpose
        setPurpose(userMessage);
        const response = await getAIResponse("confirm_adjusted_purpose", {
          newPurpose: userMessage,
        });
        
        setIsTyping(false);
        addMessage({ role: "coach", content: response });
      }
    } else if (stage === "goal") {
      setGoal(userMessage);
      const response = await getAIResponse("ask_goal_why", {
        goal: userMessage,
        purpose: purpose,
      });
      
      setStage("goal-why");
      setIsTyping(false);
      addMessage({ role: "coach", content: response });
    } else if (stage === "goal-why") {
      setGoalWhy(userMessage);
      const response = await getAIResponse("complete_onboarding", {
        userName: userName || "Friend",
        purpose: purpose,
        goal: goal,
        goalWhy: userMessage,
        allAnswers: JSON.stringify(answers),
      });
      
      setStage("complete");
      setIsTyping(false);
      addMessage({ role: "coach", content: response });
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const completeOnboarding = async () => {
    setIsLoading(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
      await supabase
        .from("profiles")
        .update({
          purpose_statement: purpose,
          purpose_answers: answers,
          onboarding_completed: true,
          onboarding_step: 3,
        })
        .eq("id", user.id);

      if (goal) {
        const targetDate = new Date();
        targetDate.setMonth(targetDate.getMonth() + 6);

        await supabase.from("goals").insert({
          user_id: user.id,
          title: goal,
          why_statement: goalWhy,
          target_date: targetDate.toISOString().split("T")[0],
          is_primary: true,
        });
      }
    }

    router.push("/dashboard");
    router.refresh();
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur border-b border-slate-200">
        <div className="container mx-auto px-6 py-4">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg gradient-ember flex items-center justify-center">
              <span className="font-serif font-bold text-white">W</span>
            </div>
            <span className="font-serif text-lg font-semibold">Willpowered</span>
          </Link>
        </div>
      </header>

      {/* Chat area */}
      <div className="flex-1 overflow-y-auto">
        <div className="container mx-auto px-6 py-8 max-w-2xl">
          <div className="space-y-6">
            {messages.map((message, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
              >
                {message.role === "coach" && (
                  <div className="w-10 h-10 rounded-xl gradient-ember flex items-center justify-center mr-3 flex-shrink-0 shadow-lg shadow-ember/20">
                    <Sparkles className="w-5 h-5 text-white" />
                  </div>
                )}
                <div
                  className={`max-w-[85%] rounded-2xl px-5 py-4 ${
                    message.role === "user"
                      ? "gradient-ember text-white"
                      : "bg-white border border-slate-200 shadow-sm"
                  }`}
                >
                  {message.role === "coach" ? (
                    <div className="prose prose-slate prose-sm max-w-none">
                      <ReactMarkdown
                        components={{
                          p: ({ children }) => (
                            <p className="mb-4 last:mb-0 leading-relaxed">{children}</p>
                          ),
                          strong: ({ children }) => (
                            <strong className="font-semibold text-slate-900">{children}</strong>
                          ),
                          ol: ({ children }) => (
                            <ol className="list-decimal list-outside ml-4 mb-4 space-y-1">{children}</ol>
                          ),
                          ul: ({ children }) => (
                            <ul className="list-disc list-outside ml-4 mb-4 space-y-1">{children}</ul>
                          ),
                          li: ({ children }) => (
                            <li className="leading-relaxed">{children}</li>
                          ),
                        }}
                      >
                        {message.content}
                      </ReactMarkdown>
                    </div>
                  ) : (
                    <p className="leading-relaxed">{message.content}</p>
                  )}

                  {message.options && (
                    <div className="mt-4 space-y-2">
                      {message.options.map((option) => (
                        <button
                          key={option.value}
                          onClick={() => handleOptionSelect(option.value)}
                          className="w-full text-left px-4 py-3 rounded-xl border border-slate-200 hover:border-ember/30 hover:bg-ember/5 transition-all text-sm font-medium"
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            ))}

            {isTyping && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex justify-start"
              >
                <div className="w-10 h-10 rounded-xl gradient-ember flex items-center justify-center mr-3 flex-shrink-0">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <div className="bg-white border border-slate-200 rounded-2xl px-5 py-4 shadow-sm">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 bg-ember rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                    <span className="w-2 h-2 bg-ember rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                    <span className="w-2 h-2 bg-ember rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              </motion.div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </div>
      </div>

      {/* Input area */}
      <div className="sticky bottom-0 bg-white border-t border-slate-200 p-4">
        <div className="container mx-auto max-w-2xl">
          {stage === "complete" ? (
            <Button
              onClick={completeOnboarding}
              disabled={isLoading}
              className="w-full h-12 gradient-ember text-white text-lg"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  Go to My Dashboard
                  <ArrowRight className="w-5 h-5 ml-2" />
                </>
              )}
            </Button>
          ) : stage !== "welcome" && stage !== "purpose-choice" ? (
            <div className="flex items-end gap-3 bg-slate-50 rounded-xl border border-slate-200 p-2">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => {
                  setInput(e.target.value);
                  // Auto-resize textarea
                  e.target.style.height = "auto";
                  e.target.style.height = Math.min(e.target.scrollHeight, 200) + "px";
                }}
                onKeyDown={handleKeyDown}
                placeholder="Type your response... (Shift+Enter for new line)"
                rows={1}
                className="flex-1 px-3 py-2 bg-transparent border-none outline-none text-slate-800 placeholder:text-slate-400 resize-none overflow-y-auto"
                style={{ maxHeight: "200px" }}
                disabled={isTyping}
              />
              <Button
                onClick={handleSend}
                disabled={!input.trim() || isTyping}
                className="gradient-ember text-white rounded-lg flex-shrink-0 mb-0.5"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          ) : (
            <p className="text-center text-sm text-muted-foreground">
              {isTyping ? "Willson is typing..." : "Choose an option above"}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
