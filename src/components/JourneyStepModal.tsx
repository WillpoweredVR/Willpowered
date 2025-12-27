"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Send, Sparkles, Loader2, CheckCircle, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import ReactMarkdown from "react-markdown";
import type { Profile, Goal } from "@/lib/supabase/types";

interface Message {
  id?: string;
  role: "coach" | "user";
  content: string;
}

interface JourneyStepModalProps {
  stepId: string;
  isOpen: boolean;
  onClose: () => void;
  onComplete: (stepId: string, isRevisit: boolean) => void;
  goal: Goal | null;
  profile: Profile | null;
  isRevisit?: boolean;
}

const STEP_CONFIG: Record<string, {
  title: string;
  color: string;
  prompts: {
    initial: string;
    revisit: string;
  };
}> = {
  purpose: {
    title: "Finding Your Purpose",
    color: "from-amber-500 to-orange-600",
    prompts: {
      initial: "purpose_initial",
      revisit: "purpose_revisit",
    },
  },
  skills: {
    title: "Acquiring Skills",
    color: "from-emerald-500 to-teal-600",
    prompts: {
      initial: "skills_initial",
      revisit: "skills_revisit",
    },
  },
  habits: {
    title: "Establishing Habits",
    color: "from-blue-500 to-indigo-600",
    prompts: {
      initial: "habits_initial",
      revisit: "habits_revisit",
    },
  },
  grit: {
    title: "Becoming Gritty",
    color: "from-rose-500 to-pink-600",
    prompts: {
      initial: "grit_initial",
      revisit: "grit_revisit",
    },
  },
  setbacks: {
    title: "Handling Setbacks",
    color: "from-violet-500 to-purple-600",
    prompts: {
      initial: "setbacks_initial",
      revisit: "setbacks_revisit",
    },
  },
  limits: {
    title: "Overcoming Limits",
    color: "from-cyan-500 to-blue-600",
    prompts: {
      initial: "limits_initial",
      revisit: "limits_revisit",
    },
  },
  perseverance: {
    title: "Persevering",
    color: "from-yellow-500 to-amber-600",
    prompts: {
      initial: "perseverance_initial",
      revisit: "perseverance_revisit",
    },
  },
};

// Map step IDs to conversation types (matching database constraint)
const STEP_TO_CONVERSATION_TYPE: Record<string, string> = {
  purpose: "purpose_discovery",
  skills: "goal_setting", // Using goal_setting for skills planning
  habits: "general",
  grit: "general",
  setbacks: "setback_recovery",
  limits: "general",
  perseverance: "milestone_celebration", // Using for final push
};

export function JourneyStepModal({
  stepId,
  isOpen,
  onClose,
  onComplete,
  goal,
  profile,
  isRevisit = false,
}: JourneyStepModalProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [stepData, setStepData] = useState<Record<string, string>>({});
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasInitialized, setHasInitialized] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const supabase = createClient();

  const config = STEP_CONFIG[stepId];

  useEffect(() => {
    // Prevent double initialization (React strict mode)
    if (isOpen && !hasInitialized) {
      setMessages([]);
      setIsComplete(false);
      setStepData({});
      setConversationId(null);
      setIsLoading(true);
      setHasInitialized(true);
      loadOrStartConversation();
    }
    
    // Reset when modal closes
    if (!isOpen) {
      setHasInitialized(false);
    }
  }, [isOpen, stepId, hasInitialized]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (!isTyping && !isLoading && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isTyping, isLoading, messages]);

  const loadOrStartConversation = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const conversationType = STEP_TO_CONVERSATION_TYPE[stepId] || "general";

    // Look for an existing active conversation for this step
    // Order by created_at desc to get the most recent one if multiples exist
    const { data: existingConversations } = await supabase
      .from("coach_conversations")
      .select("id")
      .eq("user_id", user.id)
      .eq("title", config.title)
      .eq("is_active", true)
      .order("created_at", { ascending: false })
      .limit(1);

    const existingConversation = existingConversations?.[0];

    if (existingConversation) {
      // Load existing messages
      setConversationId(existingConversation.id);
      
      const { data: existingMessages } = await supabase
        .from("coach_messages")
        .select("id, role, content")
        .eq("conversation_id", existingConversation.id)
        .order("created_at", { ascending: true });

      if (existingMessages && existingMessages.length > 0) {
        const formattedMessages: Message[] = existingMessages.map((m) => ({
          id: m.id,
          role: m.role === "assistant" ? "coach" : "user",
          content: m.content,
        }));
        setMessages(formattedMessages);
        setIsLoading(false);
        return;
      }
    }

    // No existing conversation or no messages - start fresh
    await startNewConversation(user.id, conversationType);
  };

  const startNewConversation = async (userId: string, conversationType: string) => {
    // Double-check we don't already have an active conversation (race condition prevention)
    const { data: existingCheck } = await supabase
      .from("coach_conversations")
      .select("id")
      .eq("user_id", userId)
      .eq("title", config.title)
      .eq("is_active", true)
      .limit(1);

    if (existingCheck && existingCheck.length > 0) {
      // Use existing conversation instead of creating duplicate
      setConversationId(existingCheck[0].id);
      setIsLoading(false);
      return;
    }

    // Create new conversation
    const { data: newConversation, error } = await supabase
      .from("coach_conversations")
      .insert({
        user_id: userId,
        conversation_type: conversationType,
        title: config.title,
        goal_id: goal?.id || null,
        is_active: true,
      })
      .select("id")
      .single();

    if (error) {
      console.error("Error creating conversation:", error);
      setIsLoading(false);
      return;
    }

    if (newConversation) {
      setConversationId(newConversation.id);
    }

    setIsLoading(false);
    setIsTyping(true);

    const promptType = isRevisit ? config.prompts.revisit : config.prompts.initial;

    try {
      const response = await fetch("/api/journey-coach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: promptType,
          context: {
            stepId,
            goal: goal?.title || "",
            goalWhy: goal?.why_statement || "",
            purpose: profile?.purpose_statement || "",
            userName: profile?.full_name?.split(" ")[0] || "",
          },
        }),
      });

      const data = await response.json();
      setIsTyping(false);

      const coachMessage: Message = { role: "coach", content: data.message };
      setMessages([coachMessage]);

      // Save the coach message to database
      if (newConversation) {
        await saveMessage(newConversation.id, userId, "assistant", data.message);
      }
    } catch (error) {
      console.error("Error starting conversation:", error);
      setIsTyping(false);
      setMessages([{
        role: "coach",
        content: `Let's work on ${config.title} together. What questions do you have?`,
      }]);
    }
  };

  const saveMessage = async (convId: string, userId: string, role: "user" | "assistant", content: string) => {
    await supabase.from("coach_messages").insert({
      conversation_id: convId,
      user_id: userId,
      role,
      content,
    });
  };

  const handleSend = async () => {
    if (!input.trim() || isTyping) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const userMessage = input.trim();
    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    setInput("");
    setIsTyping(true);

    // Save user message to database
    if (conversationId) {
      await saveMessage(conversationId, user.id, "user", userMessage);
    }

    try {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      
      const response = await fetch("/api/journey-coach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: "continue_conversation",
          context: {
            stepId,
            goal: goal?.title || "",
            goalWhy: goal?.why_statement || "",
            purpose: profile?.purpose_statement || "",
            userName: profile?.full_name?.split(" ")[0] || "",
            userId: currentUser?.id,
            conversationHistory: [...messages, { role: "user", content: userMessage }],
            stepData,
          },
        }),
      });

      const data = await response.json();
      setIsTyping(false);
      setMessages((prev) => [...prev, { role: "coach", content: data.message }]);

      // Save coach message to database
      if (conversationId) {
        await saveMessage(conversationId, user.id, "assistant", data.message);
      }

      // Check if step is complete
      if (data.stepComplete) {
        setIsComplete(true);
        if (data.stepData) {
          setStepData(data.stepData);
          // Save step data to database
          await saveStepProgress(data.stepData);
        }
        // Mark conversation as inactive when complete
        if (conversationId) {
          await supabase
            .from("coach_conversations")
            .update({ is_active: false })
            .eq("id", conversationId);
        }
      }
    } catch (error) {
      console.error("Error in conversation:", error);
      setIsTyping(false);
      setMessages((prev) => [
        ...prev,
        { role: "coach", content: "I had a moment there. Could you repeat that?" },
      ]);
    }
  };

  const saveStepProgress = async (data: Record<string, string>) => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return;

    // Update the journey_assessment with step completion
    const currentAssessment = (profile?.journey_assessment as Record<string, number>) || {};
    const updatedAssessment = {
      ...currentAssessment,
      [stepId]: 100, // Mark as complete
    };

    await supabase
      .from("profiles")
      .update({
        journey_assessment: updatedAssessment,
      })
      .eq("id", user.id);

    // If this is the skills step, we might create skills-related habits
    if (stepId === "skills" && data.skillsToLearn) {
      // Could create learning habits here
    }

    // If this is the habits step, create the habits
    if (stepId === "habits" && data.habits) {
      try {
        const habitsArray = JSON.parse(data.habits);
        for (const habit of habitsArray) {
          await supabase.from("habits").insert({
            user_id: user.id,
            title: habit.title || habit,
            journey_step: 3,
            frequency: "daily",
          });
        }
      } catch (e) {
        console.error("Error creating habits:", e);
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleRedoStep = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Mark old conversation as inactive
    if (conversationId) {
      await supabase
        .from("coach_conversations")
        .update({ is_active: false })
        .eq("id", conversationId);
    }

    // Reset state
    setIsComplete(false);
    setMessages([]);
    setStepData({});
    setConversationId(null);
    setIsLoading(true);

    // Start fresh conversation
    const conversationType = STEP_TO_CONVERSATION_TYPE[stepId] || "general";
    await startNewConversation(user.id, conversationType);
  };

  const handleComplete = () => {
    onComplete(stepId, isRevisit);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className={`bg-gradient-to-r ${config.color} text-white p-6`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="font-serif text-xl font-semibold">{config.title}</h2>
                  <p className="text-white/80 text-sm">
                    {isRevisit ? "Revisiting this step" : "Step " + (Object.keys(STEP_CONFIG).indexOf(stepId) + 1) + " of 7"}
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {messages.map((message, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
              >
                {message.role === "coach" && (
                  <div className={`w-8 h-8 rounded-lg bg-gradient-to-r ${config.color} flex items-center justify-center mr-3 flex-shrink-0`}>
                    <Sparkles className="w-4 h-4 text-white" />
                  </div>
                )}
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                    message.role === "user"
                      ? `bg-gradient-to-r ${config.color} text-white`
                      : "bg-slate-100"
                  }`}
                >
                  {message.role === "coach" ? (
                    <div className="prose prose-sm max-w-none">
                      <ReactMarkdown
                        components={{
                          p: ({ children }) => (
                            <p className="mb-3 last:mb-0 leading-relaxed">{children}</p>
                          ),
                          strong: ({ children }) => (
                            <strong className="font-semibold">{children}</strong>
                          ),
                          ul: ({ children }) => (
                            <ul className="list-disc list-outside ml-4 mb-3 space-y-1">{children}</ul>
                          ),
                          ol: ({ children }) => (
                            <ol className="list-decimal list-outside ml-4 mb-3 space-y-1">{children}</ol>
                          ),
                          li: ({ children }) => <li className="leading-relaxed">{children}</li>,
                        }}
                      >
                        {message.content}
                      </ReactMarkdown>
                    </div>
                  ) : (
                    <p className="leading-relaxed">{message.content}</p>
                  )}
                </div>
              </motion.div>
            ))}

            {isTyping && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex justify-start"
              >
                <div className={`w-8 h-8 rounded-lg bg-gradient-to-r ${config.color} flex items-center justify-center mr-3`}>
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
                <div className="bg-slate-100 rounded-2xl px-4 py-3">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                    <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                    <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              </motion.div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input / Complete Button */}
          <div className="border-t border-slate-200 p-4">
            {isLoading ? (
              <div className="flex items-center justify-center py-3">
                <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                <span className="ml-2 text-muted-foreground">Loading conversation...</span>
              </div>
            ) : isComplete ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-emerald-600 justify-center">
                  <CheckCircle className="w-5 h-5" />
                  <span className="font-medium">Step Complete!</span>
                </div>
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={handleRedoStep}
                  >
                    <RotateCcw className="w-4 h-4 mr-2" />
                    Redo Step
                  </Button>
                  <Button
                    className={`flex-1 bg-gradient-to-r ${config.color} text-white`}
                    onClick={handleComplete}
                  >
                    Continue Journey
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Type your response..."
                  className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-300"
                  disabled={isTyping}
                />
                <Button
                  onClick={handleSend}
                  disabled={!input.trim() || isTyping}
                  className={`bg-gradient-to-r ${config.color} text-white`}
                >
                  {isTyping ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </Button>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

