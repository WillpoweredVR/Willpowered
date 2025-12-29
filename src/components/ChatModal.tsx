"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Send, Sparkles, Loader2, ArrowRight, Check, MessageSquare, Target, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import ReactMarkdown from "react-markdown";
import Link from "next/link";
import { trackCTAClicked } from "@/lib/posthog";

interface Message {
  role: "user" | "assistant";
  content: string;
}

// User context for authenticated users
export interface UserContext {
  userName?: string;
  goal?: {
    title: string;
    why?: string;
    purpose?: string;
  };
  principles?: Array<{
    id: string;
    text: string;
    description?: string;
    whenTested?: string;
    howToHold?: string;
  }>;
  metrics?: Array<{
    name: string;
    target: number;
    todayValue?: number | null;
    weekAverage?: number;
  }>;
}

interface ChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMessage?: string;
  userContext?: UserContext; // Pass user data for authenticated users
  isAuthenticated?: boolean; // Skip gate for logged-in users
}

// Soft gate thresholds
const GENTLE_NUDGE_THRESHOLD = 3; // After 3 user messages, add a nudge
const HARD_GATE_THRESHOLD = 5; // After 5 user messages, require signup

// The gentle bridge message Willson adds after the threshold
const BRIDGE_SUFFIX = `

---

*I'm really enjoying our conversation! If you'd like me to remember what we've discussed and build a personalized plan for you, you can [create a free account](/signup?from=chat). I'll keep track of your progress and check in with you daily.*`;

export function ChatModal({ isOpen, onClose, initialMessage, userContext, isAuthenticated = false }: ChatModalProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [userMessageCount, setUserMessageCount] = useState(0);
  const [showSignupGate, setShowSignupGate] = useState(false);
  const [hasShownNudge, setHasShownNudge] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  
  // Skip gate for authenticated users
  const shouldGate = !isAuthenticated;

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isOpen && inputRef.current && !showSignupGate) {
      inputRef.current.focus();
    }
  }, [isOpen, showSignupGate]);

  // Send initial message when modal opens with one
  useEffect(() => {
    if (isOpen && initialMessage && messages.length === 0) {
      handleSend(initialMessage);
    }
  }, [isOpen, initialMessage]);

  // Save conversation to localStorage when it changes
  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem("willson_conversation", JSON.stringify(messages));
    }
  }, [messages]);

  const handleSend = async (messageText?: string) => {
    const text = messageText || input;
    if (!text.trim() || isLoading) return;

    // Check if we've hit the hard gate (only for unauthenticated users)
    const newUserMessageCount = userMessageCount + 1;
    if (shouldGate && newUserMessageCount > HARD_GATE_THRESHOLD) {
      setShowSignupGate(true);
      trackCTAClicked("chat-gate-triggered", "Signup Gate Shown", "chat");
      return;
    }

    setUserMessageCount(newUserMessageCount);
    const userMessage: Message = { role: "user", content: text };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...messages, userMessage],
          userContext, // Pass user context to API
        }),
      });

      if (!response.ok) throw new Error("Failed to get response");

      const data = await response.json();
      let responseContent = data.message;

      // Add the gentle nudge after threshold (but only once, and only for unauthenticated)
      if (shouldGate && newUserMessageCount === GENTLE_NUDGE_THRESHOLD && !hasShownNudge) {
        responseContent += BRIDGE_SUFFIX;
        setHasShownNudge(true);
      }

      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: responseContent },
      ]);
    } catch (error) {
      console.error("Chat error:", error);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            "I apologize, but I'm having trouble connecting right now. Please try again in a moment.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleClose = () => {
    // Don't clear messages - keep them for if user comes back
    setInput("");
    onClose();
  };

  const handleSignupClick = () => {
    trackCTAClicked("chat-signup-cta", "Continue Free", "chat-gate");
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
            onClick={handleClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", duration: 0.5 }}
            className="fixed inset-4 sm:inset-8 md:inset-16 lg:inset-24 bg-white rounded-2xl shadow-2xl z-50 flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl gradient-ember flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="font-serif text-lg font-semibold">
                    Willson
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    Based on The Will of Heroes methodology
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleClose}
                className="rounded-full"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>

            {/* Signup Gate Overlay */}
            <AnimatePresence>
              {showSignupGate && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 z-10 bg-white/95 backdrop-blur-sm flex items-center justify-center p-6"
                >
                  <motion.div
                    initial={{ scale: 0.9, y: 20 }}
                    animate={{ scale: 1, y: 0 }}
                    className="max-w-md text-center"
                  >
                    {/* Willson avatar */}
                    <div className="w-20 h-20 rounded-2xl gradient-ember flex items-center justify-center mx-auto mb-6">
                      <Sparkles className="w-10 h-10 text-white" />
                    </div>

                    <h3 className="font-serif text-2xl font-semibold mb-3">
                      I'm loving this conversation!
                    </h3>
                    
                    <p className="text-muted-foreground mb-6">
                      Create your free account to continue chatting, and I'll build you 
                      a personalized plan based on everything we've discussed.
                    </p>

                    {/* Value props */}
                    <div className="bg-slate-50 rounded-xl p-4 mb-6 text-left space-y-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center flex-shrink-0">
                          <MessageSquare className="w-4 h-4 text-emerald-600" />
                        </div>
                        <span className="text-sm">Continue this conversation</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                          <Target className="w-4 h-4 text-blue-600" />
                        </div>
                        <span className="text-sm">Get your personalized willpower plan</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center flex-shrink-0">
                          <Calendar className="w-4 h-4 text-purple-600" />
                        </div>
                        <span className="text-sm">Track progress with daily check-ins</span>
                      </div>
                    </div>

                    {/* CTA */}
                    <Button 
                      asChild 
                      size="lg" 
                      className="w-full gradient-ember text-white mb-3"
                      onClick={handleSignupClick}
                    >
                      <Link href="/signup?from=chat">
                        Continue Free
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </Link>
                    </Button>

                    <p className="text-xs text-muted-foreground">
                      Already have an account?{" "}
                      <Link href="/login" className="text-ember hover:underline">
                        Sign in
                      </Link>
                    </p>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {messages.length === 0 && !isLoading && (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <div className="w-16 h-16 rounded-2xl gradient-ember flex items-center justify-center mb-4">
                    <Sparkles className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="font-serif text-xl font-semibold mb-2">
                    Hi, I'm Willson
                  </h3>
                  <p className="text-muted-foreground max-w-md">
                    I'm here to guide you through the principles of "The Will of
                    Heroes" - from building habits to finding purpose to
                    overcoming your limits.
                  </p>
                </div>
              )}

              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`flex ${
                    message.role === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                      message.role === "user"
                        ? "gradient-ember text-white"
                        : "bg-secondary"
                    }`}
                  >
                    {message.role === "assistant" ? (
                      <div className="prose prose-sm max-w-none">
                        <ReactMarkdown
                          components={{
                            p: ({ children }) => (
                              <p className="mb-3 last:mb-0">{children}</p>
                            ),
                            strong: ({ children }) => (
                              <strong className="font-semibold text-foreground">
                                {children}
                              </strong>
                            ),
                            em: ({ children }) => (
                              <em className="text-muted-foreground">{children}</em>
                            ),
                            ul: ({ children }) => (
                              <ul className="list-disc list-inside mb-3 space-y-1">
                                {children}
                              </ul>
                            ),
                            ol: ({ children }) => (
                              <ol className="list-decimal list-inside mb-3 space-y-1">
                                {children}
                              </ol>
                            ),
                            li: ({ children }) => (
                              <li className="text-sm">{children}</li>
                            ),
                            h1: ({ children }) => (
                              <h3 className="font-serif font-semibold text-lg mt-4 mb-2">
                                {children}
                              </h3>
                            ),
                            h2: ({ children }) => (
                              <h4 className="font-serif font-semibold mt-3 mb-2">
                                {children}
                              </h4>
                            ),
                            h3: ({ children }) => (
                              <h5 className="font-semibold mt-2 mb-1">
                                {children}
                              </h5>
                            ),
                            a: ({ href, children }) => (
                              <Link 
                                href={href || "#"} 
                                className="text-ember hover:underline font-medium"
                                onClick={() => trackCTAClicked("chat-inline-link", String(children), "chat")}
                              >
                                {children}
                              </Link>
                            ),
                            hr: () => (
                              <hr className="my-4 border-border" />
                            ),
                          }}
                        >
                          {message.content}
                        </ReactMarkdown>
                      </div>
                    ) : (
                      <p>{message.content}</p>
                    )}
                  </div>
                </div>
              ))}

              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-secondary rounded-2xl px-4 py-3 flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-ember" />
                    <span className="text-muted-foreground">Thinking...</span>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Message counter hint - only for unauthenticated users */}
            {shouldGate && !showSignupGate && userMessageCount >= 3 && userMessageCount < HARD_GATE_THRESHOLD && (
              <div className="px-6 py-2 bg-amber-50 border-t border-amber-100">
                <p className="text-xs text-amber-700 text-center">
                  {HARD_GATE_THRESHOLD - userMessageCount} message{HARD_GATE_THRESHOLD - userMessageCount !== 1 ? 's' : ''} remaining •{" "}
                  <Link href="/signup?from=chat" className="font-medium hover:underline">
                    Sign up free
                  </Link>{" "}
                  to continue unlimited
                </p>
              </div>
            )}

            {/* Input */}
            <div className="p-4 border-t bg-secondary/30">
              <div className="flex items-center gap-3 bg-white rounded-xl border p-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask about willpower, habits, purpose..."
                  className="flex-1 px-3 py-2 bg-transparent border-none outline-none"
                  disabled={isLoading || showSignupGate}
                />
                <Button
                  onClick={() => handleSend()}
                  disabled={!input.trim() || isLoading || showSignupGate}
                  className="gradient-ember text-white rounded-lg"
                >
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
