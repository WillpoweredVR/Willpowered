"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Send, Sparkles, Loader2, ArrowRight, Check, MessageSquare, Target, Calendar, History, Plus, Trash2, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import ReactMarkdown from "react-markdown";
import Link from "next/link";
import { trackCTAClicked } from "@/lib/posthog";
import { createClient } from "@/lib/supabase/client";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  created_at: string;
  updated_at: string;
}

// User context for authenticated users
export interface UserContext {
  userId?: string;
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
  onDataSaved?: () => void; // Callback when Willson saves data (to refresh dashboard)
}

// Soft gate thresholds
const GENTLE_NUDGE_THRESHOLD = 3; // After 3 user messages, add a nudge
const HARD_GATE_THRESHOLD = 5; // After 5 user messages, require signup

// The gentle bridge message Willson adds after the threshold
const BRIDGE_SUFFIX = `

---

*I'm really enjoying our conversation! If you'd like me to remember what we've discussed and build a personalized plan for you, you can [create a free account](/signup?from=chat). I'll keep track of your progress and check in with you daily.*`;

export function ChatModal({ isOpen, onClose, initialMessage, userContext, isAuthenticated = false, onDataSaved }: ChatModalProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [userMessageCount, setUserMessageCount] = useState(0);
  const [showSignupGate, setShowSignupGate] = useState(false);
  const [hasShownNudge, setHasShownNudge] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [savingStatus, setSavingStatus] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const supabase = createClient();
  
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

  // Load conversations for authenticated users
  useEffect(() => {
    if (isOpen && isAuthenticated && userContext?.userId) {
      loadConversations();
    }
  }, [isOpen, isAuthenticated, userContext?.userId]);

  // Send initial message when modal opens with one
  useEffect(() => {
    if (isOpen && initialMessage && messages.length === 0) {
      handleSend(initialMessage);
    }
  }, [isOpen, initialMessage]);

  // Auto-save conversation for authenticated users
  const saveConversation = useCallback(async (msgs: Message[]) => {
    if (!isAuthenticated || !userContext?.userId || msgs.length === 0) return;

    try {
      // Generate a title from first user message
      const firstUserMsg = msgs.find(m => m.role === "user");
      const title = firstUserMsg?.content.slice(0, 50) + (firstUserMsg && firstUserMsg.content.length > 50 ? "..." : "") || "New conversation";

      if (currentConversationId) {
        // Update existing
        await supabase
          .from("conversations")
          .update({ messages: msgs, title })
          .eq("id", currentConversationId);
      } else {
        // Create new
        const { data, error } = await supabase
          .from("conversations")
          .insert({
            user_id: userContext.userId,
            title,
            messages: msgs,
          })
          .select("id")
          .single();

        if (data && !error) {
          setCurrentConversationId(data.id);
        }
      }
    } catch (error) {
      console.error("Error saving conversation:", error);
    }
  }, [isAuthenticated, userContext?.userId, currentConversationId, supabase]);

  // Save on message change (debounced would be better but this works)
  useEffect(() => {
    if (messages.length > 0 && isAuthenticated) {
      const timeout = setTimeout(() => saveConversation(messages), 1000);
      return () => clearTimeout(timeout);
    }
  }, [messages, isAuthenticated, saveConversation]);

  const loadConversations = async () => {
    if (!userContext?.userId) return;

    const { data, error } = await supabase
      .from("conversations")
      .select("*")
      .eq("user_id", userContext.userId)
      .order("updated_at", { ascending: false })
      .limit(20);

    if (data && !error) {
      setConversations(data);
    }
  };

  const loadConversation = (conv: Conversation) => {
    setMessages(conv.messages);
    setCurrentConversationId(conv.id);
    setShowHistory(false);
    setUserMessageCount(conv.messages.filter(m => m.role === "user").length);
  };

  const startNewConversation = () => {
    setMessages([]);
    setCurrentConversationId(null);
    setUserMessageCount(0);
    setHasShownNudge(false);
    setShowHistory(false);
  };

  const deleteConversation = async (convId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await supabase.from("conversations").delete().eq("id", convId);
    setConversations(prev => prev.filter(c => c.id !== convId));
    if (currentConversationId === convId) {
      startNewConversation();
    }
  };

  const handleToolCall = async (toolName: string, toolInput: unknown) => {
    setSavingStatus(`Saving ${toolName === "save_principles" ? "principles" : toolName === "save_purpose" ? "purpose" : "goal"}...`);
    
    try {
      const response = await fetch("/api/chat/save-data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ toolName, toolInput }),
      });

      const data = await response.json();
      
      if (data.success) {
        setSavingStatus("✓ Saved successfully!");
        // Notify parent to refresh data
        onDataSaved?.();
        setTimeout(() => setSavingStatus(null), 3000);
      } else {
        setSavingStatus("Failed to save. Please try again.");
        setTimeout(() => setSavingStatus(null), 3000);
      }
    } catch (error) {
      console.error("Tool call error:", error);
      setSavingStatus("Failed to save. Please try again.");
      setTimeout(() => setSavingStatus(null), 3000);
    }
  };

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
          conversationId: currentConversationId,
        }),
      });

      if (!response.ok) throw new Error("Failed to get response");

      const data = await response.json();
      let responseContent = data.message;

      // Handle tool calls from Willson
      if (data.toolCall) {
        await handleToolCall(data.toolCall.name, data.toolCall.input);
        // Add a confirmation to the message if there wasn't already text
        if (!responseContent) {
          responseContent = "Done! I've saved that to your dashboard.";
        }
      }

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


  const handleClose = () => {
    // Don't clear messages - keep them for if user comes back
    setInput("");
    setShowHistory(false);
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
            className="fixed inset-4 sm:inset-8 md:inset-16 lg:inset-24 bg-white rounded-2xl shadow-2xl z-50 flex overflow-hidden"
          >
            {/* History Sidebar - Only for authenticated users */}
            {isAuthenticated && (
              <AnimatePresence>
                {showHistory && (
                  <motion.div
                    initial={{ width: 0, opacity: 0 }}
                    animate={{ width: 280, opacity: 1 }}
                    exit={{ width: 0, opacity: 0 }}
                    className="border-r bg-slate-50 flex flex-col overflow-hidden"
                  >
                    <div className="p-4 border-b bg-white">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-semibold text-sm">Conversations</h3>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setShowHistory(false)}
                          className="h-8 w-8"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                      <Button
                        onClick={startNewConversation}
                        variant="outline"
                        className="w-full justify-start gap-2"
                        size="sm"
                      >
                        <Plus className="w-4 h-4" />
                        New conversation
                      </Button>
                    </div>
                    <div className="flex-1 overflow-y-auto p-2 space-y-1">
                      {conversations.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-4">
                          No conversations yet
                        </p>
                      ) : (
                        conversations.map((conv) => (
                          <div
                            key={conv.id}
                            onClick={() => loadConversation(conv)}
                            className={`group p-3 rounded-lg cursor-pointer hover:bg-white transition-colors ${
                              currentConversationId === conv.id ? "bg-white shadow-sm" : ""
                            }`}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <p className="text-sm font-medium truncate flex-1">
                                {conv.title || "Untitled"}
                              </p>
                              <button
                                onClick={(e) => deleteConversation(conv.id, e)}
                                className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-opacity"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                              {new Date(conv.updated_at).toLocaleDateString()}
                            </p>
                          </div>
                        ))
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            )}

            {/* Main Chat Area */}
            <div className="flex-1 flex flex-col">
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b">
                <div className="flex items-center gap-3">
                  {isAuthenticated && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        setShowHistory(!showHistory);
                        if (!showHistory) loadConversations();
                      }}
                      className="rounded-full mr-1"
                      title="Conversation history"
                    >
                      <History className="w-5 h-5" />
                    </Button>
                  )}
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
                <div className="flex items-center gap-2">
                  {isAuthenticated && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={startNewConversation}
                      className="text-muted-foreground"
                    >
                      <Plus className="w-4 h-4 mr-1" />
                      New
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleClose}
                    className="rounded-full"
                  >
                    <X className="w-5 h-5" />
                  </Button>
                </div>
              </div>

              {/* Save Status Banner */}
              <AnimatePresence>
                {savingStatus && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="bg-emerald-50 border-b border-emerald-100 px-6 py-2 overflow-hidden"
                  >
                    <div className="flex items-center gap-2 text-sm text-emerald-700">
                      {savingStatus.includes("✓") ? (
                        <CheckCircle className="w-4 h-4" />
                      ) : (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      )}
                      {savingStatus}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

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
                    <div className="bg-secondary rounded-2xl px-5 py-4">
                      <div className="flex gap-1">
                        <span className="w-2 h-2 bg-ember rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                        <span className="w-2 h-2 bg-ember rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                        <span className="w-2 h-2 bg-ember rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                      </div>
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
                <form 
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSend();
                }}
                className="flex items-center gap-3 bg-white rounded-xl border p-2"
              >
                  <input
                    ref={inputRef}
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Ask about willpower, habits, purpose..."
                    className="flex-1 px-3 py-2 bg-transparent border-none outline-none"
                    disabled={isLoading || showSignupGate}
                  />
                  <Button
                    type="submit"
                    disabled={!input.trim() || isLoading || showSignupGate}
                    className="gradient-ember text-white rounded-lg"
                  >
                    {isLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                  </Button>
                </form>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
