"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Send, Sparkles, Loader2, Target, Flame, Shield, Compass, MessageSquarePlus, History, ChevronLeft, ChevronRight, BookOpen, Dumbbell, GraduationCap, MessageCircle, Crown } from "lucide-react";
import { Button } from "@/components/ui/button";
import ReactMarkdown from "react-markdown";
import { createClient } from "@/lib/supabase/client";
import { UpgradeModal } from "@/components/UpgradeModal";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface Conversation {
  id: string;
  title: string | null;
  conversation_type: string;
  created_at: string;
  updated_at: string;
}

interface ScorecardUpdate {
  action: 'add' | 'update' | 'remove';
  category: string;
  metricId?: string;
  name: string;
  description: string;
  target: number;
  unit: string;
  direction: 'higher' | 'lower';
  calculation: 'average' | 'sum' | 'count';
}

interface ChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMessage?: string;
  conversationTitle?: string; // Title for new skill-based conversations
  startFresh?: boolean;
  skillIndex?: number; // For skill-based conversations, to save tasks
  onTasksCreated?: (skillIndex: number, tasks: SkillTask[]) => void;
  onScorecardUpdates?: (updates: ScorecardUpdate[]) => void;
}

interface SkillTask {
  id: string;
  title: string;
  description?: string;
  link?: string;
  linkLabel?: string;
  status: 'pending' | 'in_progress' | 'completed';
  order: number;
  created_at: string;
}

// Quick action prompts for new users
const QUICK_ACTIONS = [
  {
    icon: Target,
    label: "Set a Goal",
    prompt: "I want to set a meaningful goal but I'm not sure where to start. Can you help me?",
    color: "from-emerald-500 to-teal-600",
  },
  {
    icon: Flame,
    label: "Build a Habit",
    prompt: "I've been trying to build a new habit but I keep falling off. What am I doing wrong?",
    color: "from-amber-500 to-orange-600",
  },
  {
    icon: Shield,
    label: "Handle Setback",
    prompt: "I recently faced a major setback and I'm struggling to get back on track. How do I recover?",
    color: "from-violet-500 to-purple-600",
  },
  {
    icon: Compass,
    label: "Find Purpose",
    prompt: "I feel like I'm going through the motions but don't have a clear sense of purpose. How do I find my 'why'?",
    color: "from-blue-500 to-indigo-600",
  },
];

// Get icon for conversation based on title
function getConversationIcon(title: string | null) {
  if (!title) return MessageCircle;
  const lowerTitle = title.toLowerCase();
  if (lowerTitle.includes("learn")) return BookOpen;
  if (lowerTitle.includes("practice")) return Dumbbell;
  if (lowerTitle.includes("test")) return GraduationCap;
  return MessageCircle;
}

// Format relative time
function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

export function ChatModal({ 
  isOpen, 
  onClose, 
  initialMessage,
  conversationTitle,
  startFresh = false,
  skillIndex,
  onTasksCreated,
  onScorecardUpdates,
}: ChatModalProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [usageInfo, setUsageInfo] = useState<{ used: number; limit: number; daysUntilReset: number | null } | null>(null);
  // Persist skill context for the duration of the conversation (using ref for immediate access)
  const activeSkillContextRef = useRef<{
    skillName: string;
    skillIndex: number;
    conversationTitle: string;
  } | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const hasInitialized = useRef(false);
  const supabase = createClient();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  // Load conversation history
  const loadConversations = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("coach_conversations")
        .select("*")
        .eq("user_id", user.id)
        .eq("is_active", true)
        .order("updated_at", { ascending: false })
        .limit(20);

      if (error) throw error;
      setConversations(data || []);
    } catch (error) {
      console.error("Error loading conversations:", error);
    }
  }, [supabase]);

  // Load messages for a conversation
  const loadMessages = useCallback(async (conversationId: string) => {
    setIsLoadingHistory(true);
    try {
      const { data, error } = await supabase
        .from("coach_messages")
        .select("role, content")
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: true });

      if (error) throw error;
      setMessages(data || []);
      setCurrentConversationId(conversationId);
    } catch (error) {
      console.error("Error loading messages:", error);
    } finally {
      setIsLoadingHistory(false);
    }
  }, [supabase]);

  // Create a new conversation
  const createConversation = useCallback(async (title?: string): Promise<string | null> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data, error } = await supabase
        .from("coach_conversations")
        .insert({
          user_id: user.id,
          title: title || "General Chat",
          conversation_type: "general",
        })
        .select()
        .single();

      if (error) throw error;
      setCurrentConversationId(data.id);
      await loadConversations();
      return data.id;
    } catch (error) {
      console.error("Error creating conversation:", error);
      return null;
    }
  }, [supabase, loadConversations]);

  // Save a message to the database
  const saveMessage = useCallback(async (conversationId: string, role: "user" | "assistant", content: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await supabase.from("coach_messages").insert({
        conversation_id: conversationId,
        user_id: user.id,
        role,
        content,
      });

      // Update conversation's updated_at
      await supabase
        .from("coach_conversations")
        .update({ updated_at: new Date().toISOString() })
        .eq("id", conversationId);

    } catch (error) {
      console.error("Error saving message:", error);
    }
  }, [supabase]);

  // Initialize on open
  useEffect(() => {
    if (isOpen && !hasInitialized.current) {
      hasInitialized.current = true;
      loadConversations();

      if (startFresh) {
        // Start a new conversation
        setMessages([]);
        setCurrentConversationId(null);
        
        // Set skill context if this is a skill learning conversation
        // Check for various skill-related conversation titles
        const isSkillConversation = skillIndex !== undefined && conversationTitle && 
          (conversationTitle.includes("Create Plan:") || 
           conversationTitle.includes("Learn:") || 
           conversationTitle.includes("Practice:") || 
           conversationTitle.includes("Test:"));
        
        if (isSkillConversation) {
          // Extract skill name by removing the prefix
          const skillName = conversationTitle
            .replace("Create Plan: ", "")
            .replace("Learn: ", "")
            .replace("Practice: ", "")
            .replace("Test: ", "");
          
          activeSkillContextRef.current = {
            skillName,
            skillIndex: skillIndex!,
            conversationTitle,
          };
          console.log("Set activeSkillContextRef:", activeSkillContextRef.current);
        } else {
          activeSkillContextRef.current = null;
        }
        
        if (initialMessage) {
          // Create conversation and send initial message
          (async () => {
            const convId = await createConversation(conversationTitle);
            if (convId && initialMessage) {
              handleSendWithConversation(initialMessage, convId);
            }
          })();
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, startFresh, initialMessage, conversationTitle, skillIndex]);

  // Reset when modal closes
  useEffect(() => {
    if (!isOpen) {
      hasInitialized.current = false;
      setInput("");
      setShowHistory(false);
      activeSkillContextRef.current = null;
    }
  }, [isOpen]);

  const handleSendWithConversation = async (messageText: string, conversationId: string) => {
    if (!messageText.trim() || isLoading) return;

    const userMessage: Message = { role: "user", content: messageText };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    // Reset textarea height
    if (inputRef.current) {
      inputRef.current.style.height = "auto";
    }
    setIsLoading(true);

    // Save user message
    await saveMessage(conversationId, "user", messageText);

    try {
      // Use persisted skill context for all messages in this conversation
      const skillContext = activeSkillContextRef.current;
      const isSkillConversation = skillContext !== null;
      console.log("Sending with skillContext:", skillContext);
      
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...messages, userMessage],
          skillContext: isSkillConversation ? {
            skillName: skillContext.skillName,
            createPlan: true,
          } : undefined,
        }),
      });

      const data = await response.json();
      
      // Check for conversation limit error
      if (response.status === 403 && data.error === "conversation_limit_reached") {
        setUsageInfo(data.usage);
        setShowUpgradeModal(true);
        // Remove the user message we just added since it wasn't processed
        setMessages((prev) => prev.slice(0, -1));
        return;
      }
      
      if (!response.ok) throw new Error("Failed to get response");

      const assistantMessage = data.message;
      
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: assistantMessage },
      ]);

      // Save assistant message
      await saveMessage(conversationId, "assistant", assistantMessage);

      // Check if tasks were extracted from the response
      console.log("API Response - tasks:", data.tasks, "skillContext:", skillContext);
      if (data.tasks && data.tasks.length > 0 && skillContext && onTasksCreated) {
        console.log("Calling onTasksCreated with", data.tasks.length, "tasks for skill index", skillContext.skillIndex);
        onTasksCreated(skillContext.skillIndex, data.tasks);
      }

      // Check if scorecard updates were extracted from the response
      if (data.scorecardUpdates && data.scorecardUpdates.length > 0 && onScorecardUpdates) {
        onScorecardUpdates(data.scorecardUpdates);
      }
      
      // Refresh conversation list to update timestamps
      loadConversations();

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

  const handleSend = async (messageText?: string) => {
    const text = messageText || input;
    if (!text.trim() || isLoading) return;

    let convId = currentConversationId;
    
    // Create conversation if needed
    if (!convId) {
      convId = await createConversation(conversationTitle || "General Chat");
      if (!convId) return;
    }

    await handleSendWithConversation(text, convId);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleClose = () => {
    onClose();
  };

  const handleNewChat = async () => {
    setMessages([]);
    setCurrentConversationId(null);
  };

  const handleSelectConversation = async (conversation: Conversation) => {
    await loadMessages(conversation.id);
    setShowHistory(false);
  };

  const handleQuickAction = (prompt: string) => {
    handleSend(prompt);
  };

  const currentConversation = conversations.find(c => c.id === currentConversationId);

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
            {/* History Sidebar */}
            <AnimatePresence>
              {showHistory && (
                <motion.div
                  initial={{ width: 0, opacity: 0 }}
                  animate={{ width: 280, opacity: 1 }}
                  exit={{ width: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="border-r bg-slate-50 flex flex-col overflow-hidden"
                >
                  <div className="p-4 border-b bg-white">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-sm">Conversations</h3>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setShowHistory(false)}
                        className="h-8 w-8 rounded-full"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="flex-1 overflow-y-auto p-2 space-y-1">
                    {conversations.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-8">
                        No conversations yet
                      </p>
                    ) : (
                      conversations.map((conv) => {
                        const Icon = getConversationIcon(conv.title);
                        const isActive = conv.id === currentConversationId;
                        return (
                          <button
                            key={conv.id}
                            onClick={() => handleSelectConversation(conv)}
                            className={`w-full text-left p-3 rounded-xl transition-all ${
                              isActive
                                ? "bg-ember/10 border border-ember/20"
                                : "hover:bg-white border border-transparent"
                            }`}
                          >
                            <div className="flex items-start gap-2">
                              <Icon className={`w-4 h-4 mt-0.5 flex-shrink-0 ${
                                isActive ? "text-ember" : "text-muted-foreground"
                              }`} />
                              <div className="flex-1 min-w-0">
                                <p className={`text-sm font-medium truncate ${
                                  isActive ? "text-ember" : "text-foreground"
                                }`}>
                                  {conv.title || "General Chat"}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {formatRelativeTime(conv.updated_at)}
                                </p>
                              </div>
                            </div>
                          </button>
                        );
                      })
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Main Chat Area */}
            <div className="flex-1 flex flex-col overflow-hidden">
              {/* Header */}
              <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-b bg-gradient-to-r from-slate-50 to-white">
                <div className="flex items-center gap-3">
                  {!showHistory && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setShowHistory(true)}
                      className="rounded-full hover:bg-slate-100"
                    >
                      <History className="w-5 h-5" />
                    </Button>
                  )}
                  <div className="w-10 h-10 rounded-xl gradient-ember flex items-center justify-center shadow-lg shadow-ember/20">
                    <Sparkles className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="font-serif text-lg font-semibold">
                        Willson
                      </h2>
                      {currentConversation && (
                        <span className="text-xs text-muted-foreground bg-slate-100 px-2 py-0.5 rounded-full truncate max-w-[150px]">
                          {currentConversation.title}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground hidden sm:block">
                      Powered by The Will of Heroes methodology
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleNewChat}
                    className="rounded-full hover:bg-slate-100 text-muted-foreground hover:text-foreground gap-1.5"
                  >
                    <MessageSquarePlus className="w-4 h-4" />
                    <span className="hidden sm:inline">New Chat</span>
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleClose}
                    className="rounded-full hover:bg-slate-100"
                  >
                    <X className="w-5 h-5" />
                  </Button>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {isLoadingHistory ? (
                  <div className="flex items-center justify-center h-full">
                    <Loader2 className="w-8 h-8 animate-spin text-ember" />
                  </div>
                ) : messages.length === 0 && !isLoading ? (
                  <div className="flex flex-col items-center justify-center h-full text-center px-4">
                    <div className="w-20 h-20 rounded-2xl gradient-ember flex items-center justify-center mb-6 shadow-xl shadow-ember/30">
                      <Sparkles className="w-10 h-10 text-white" />
                    </div>
                    <h3 className="font-serif text-2xl font-bold mb-3">
                      Meet Willson 🏐
                    </h3>
                    <p className="text-muted-foreground max-w-lg mb-8">
                      I'm here to guide you through the principles of "The Will of
                      Heroes" — from finding your purpose to building unshakeable
                      habits to pushing past your limits.
                    </p>

                    {/* Quick Actions */}
                    <div className="w-full max-w-2xl">
                      <p className="text-sm font-medium text-muted-foreground mb-4">
                        What would you like to work on?
                      </p>
                      <div className="grid grid-cols-2 gap-3">
                        {QUICK_ACTIONS.map((action) => (
                          <button
                            key={action.label}
                            onClick={() => handleQuickAction(action.prompt)}
                            className="group flex items-center gap-3 p-4 rounded-xl border border-border bg-white hover:border-ember/30 hover:shadow-md transition-all duration-200 text-left"
                          >
                            <div
                              className={`w-10 h-10 rounded-lg bg-gradient-to-br ${action.color} flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform`}
                            >
                              <action.icon className="w-5 h-5 text-white" />
                            </div>
                            <span className="font-medium text-foreground">
                              {action.label}
                            </span>
                          </button>
                        ))}
                      </div>
                      <p className="text-xs text-muted-foreground mt-6">
                        Or type your own question below
                      </p>
                    </div>
                  </div>
                ) : (
                  <>
                    {messages.map((message, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3 }}
                        className={`flex ${
                          message.role === "user" ? "justify-end" : "justify-start"
                        }`}
                      >
                        <div
                          className={`max-w-[85%] md:max-w-[75%] rounded-2xl px-5 py-4 ${
                            message.role === "user"
                              ? "gradient-ember text-white shadow-lg shadow-ember/20"
                              : "bg-slate-50 border border-slate-100"
                          }`}
                        >
                          {message.role === "assistant" ? (
                            <div className="prose prose-slate prose-sm max-w-none">
                              <ReactMarkdown
                                components={{
                                  p: ({ children }) => (
                                    <p className="mb-4 last:mb-0 leading-relaxed">{children}</p>
                                  ),
                                  strong: ({ children }) => (
                                    <strong className="font-semibold text-slate-900">
                                      {children}
                                    </strong>
                                  ),
                                  ul: ({ children }) => (
                                    <ul className="list-disc list-outside ml-4 mb-4 space-y-2">
                                      {children}
                                    </ul>
                                  ),
                                  ol: ({ children }) => (
                                    <ol className="list-decimal list-outside ml-4 mb-4 space-y-2">
                                      {children}
                                    </ol>
                                  ),
                                  li: ({ children }) => (
                                    <li className="leading-relaxed">{children}</li>
                                  ),
                                  h1: ({ children }) => (
                                    <h3 className="font-serif font-bold text-xl mt-6 mb-3 text-slate-900">
                                      {children}
                                    </h3>
                                  ),
                                  h2: ({ children }) => (
                                    <h4 className="font-serif font-bold text-lg mt-5 mb-2 text-slate-900">
                                      {children}
                                    </h4>
                                  ),
                                  h3: ({ children }) => (
                                    <h5 className="font-semibold mt-4 mb-2 text-slate-900">
                                      {children}
                                    </h5>
                                  ),
                                  blockquote: ({ children }) => (
                                    <blockquote className="border-l-4 border-ember pl-4 italic my-4 text-slate-600">
                                      {children}
                                    </blockquote>
                                  ),
                                  a: ({ href, children }) => (
                                    <a
                                      href={href}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-ember hover:text-ember-dark underline"
                                    >
                                      {children}
                                    </a>
                                  ),
                                  code: ({ children }) => (
                                    <code className="bg-slate-100 px-1.5 py-0.5 rounded text-sm font-mono">
                                      {children}
                                    </code>
                                  ),
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
                  </>
                )}

                {isLoading && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex justify-start"
                  >
                    <div className="bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 flex items-center gap-3">
                      <div className="flex gap-1">
                        <span className="w-2 h-2 bg-ember rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                        <span className="w-2 h-2 bg-ember rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                        <span className="w-2 h-2 bg-ember rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                      </div>
                      <span className="text-muted-foreground">Thinking...</span>
                    </div>
                  </motion.div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div className="p-4 border-t bg-gradient-to-r from-slate-50 to-white">
                <div className="flex items-end gap-3 bg-white rounded-xl border border-slate-200 p-2 shadow-sm focus-within:border-ember/50 focus-within:ring-2 focus-within:ring-ember/10 transition-all">
                  <textarea
                    ref={inputRef}
                    value={input}
                    onChange={(e) => {
                      setInput(e.target.value);
                      // Auto-resize textarea
                      e.target.style.height = "auto";
                      e.target.style.height = Math.min(e.target.scrollHeight, 150) + "px";
                    }}
                    onKeyDown={handleKeyDown}
                    placeholder="Ask about goals, habits, purpose... (Shift+Enter for new line)"
                    rows={1}
                    className="flex-1 px-3 py-2 bg-transparent border-none outline-none text-slate-800 placeholder:text-slate-400 resize-none overflow-y-auto"
                    style={{ maxHeight: "150px" }}
                    disabled={isLoading}
                  />
                  <Button
                    onClick={() => handleSend()}
                    disabled={!input.trim() || isLoading}
                    className="gradient-ember text-white rounded-lg shadow-md shadow-ember/20 hover:shadow-lg hover:shadow-ember/30 transition-all disabled:opacity-50 disabled:shadow-none flex-shrink-0 mb-0.5"
                  >
                    {isLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                  </Button>
                </div>
                <p className="text-xs text-center text-muted-foreground mt-2">
                  Willson draws from "The Will of Heroes" methodology
                </p>
              </div>
            </div>
          </motion.div>
        </>
      )}

      {/* Upgrade Modal for conversation limit */}
      <UpgradeModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        usage={usageInfo || undefined}
      />
    </AnimatePresence>
  );
}
