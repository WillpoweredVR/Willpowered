"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  MessageSquare,
  Search,
  Loader2,
  ArrowLeft,
  Calendar,
  User,
  ChevronDown,
  ChevronUp,
  X,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import ReactMarkdown from "react-markdown";

const ADMIN_EMAILS = ["colin.robertson3@gmail.com", "colin@willpowered.com"];

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface Conversation {
  id: string;
  user_id: string;
  title: string;
  messages: Message[];
  created_at: string;
  updated_at: string;
  user_email?: string;
  user_name?: string;
}

export default function AdminConversationsPage() {
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  useEffect(() => {
    async function checkAdminAndFetch() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      const isAdminUser = ADMIN_EMAILS.includes(user.email || "");
      setIsAdmin(isAdminUser);

      if (!isAdminUser) {
        router.push("/dashboard");
        return;
      }

      // Fetch all conversations with user info
      const { data: convos, error } = await supabase
        .from("conversations")
        .select("*")
        .order("updated_at", { ascending: false })
        .limit(500);

      if (error) {
        console.error("Error fetching conversations:", error);
      } else if (convos) {
        // Get unique user IDs
        const userIds = [...new Set(convos.map(c => c.user_id))];
        
        // Fetch user profiles
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, email, full_name")
          .in("id", userIds);

        const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);

        // Merge user info into conversations
        const enrichedConvos = convos.map(c => ({
          ...c,
          user_email: profileMap.get(c.user_id)?.email,
          user_name: profileMap.get(c.user_id)?.full_name,
        }));

        setConversations(enrichedConvos);
      }

      setIsLoading(false);
    }

    checkAdminAndFetch();
  }, [router]);

  const filteredConversations = conversations.filter(conv => {
    const query = searchQuery.toLowerCase();
    const messagesText = conv.messages?.map(m => m.content).join(" ").toLowerCase() || "";
    return (
      conv.title?.toLowerCase().includes(query) ||
      conv.user_email?.toLowerCase().includes(query) ||
      conv.user_name?.toLowerCase().includes(query) ||
      messagesText.includes(query)
    );
  });

  const sortedConversations = [...filteredConversations].sort((a, b) => {
    const comparison = new Date(a.updated_at).getTime() - new Date(b.updated_at).getTime();
    return sortDir === "desc" ? -comparison : comparison;
  });

  if (isAdmin === null || isLoading) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-ember mx-auto mb-4" />
          <p className="text-muted-foreground">Loading conversations...</p>
        </div>
      </div>
    );
  }

  // Stats
  const totalConversations = conversations.length;
  const uniqueUsers = new Set(conversations.map(c => c.user_id)).size;
  const todayConversations = conversations.filter(c => 
    new Date(c.updated_at).toDateString() === new Date().toDateString()
  ).length;
  const avgMessages = conversations.length > 0
    ? Math.round(conversations.reduce((acc, c) => acc + (c.messages?.length || 0), 0) / conversations.length)
    : 0;

  return (
    <div className="min-h-screen bg-cream">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link href="/admin" className="text-muted-foreground hover:text-foreground">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-3xl font-serif font-bold text-foreground">Conversations</h1>
            <p className="text-muted-foreground">{totalConversations} total conversations</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
              <MessageSquare className="w-4 h-4" />
              Total
            </div>
            <p className="text-2xl font-bold">{totalConversations}</p>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
              <User className="w-4 h-4" />
              Unique Users
            </div>
            <p className="text-2xl font-bold">{uniqueUsers}</p>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
              <Calendar className="w-4 h-4" />
              Today
            </div>
            <p className="text-2xl font-bold">{todayConversations}</p>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
              <Sparkles className="w-4 h-4" />
              Avg Messages
            </div>
            <p className="text-2xl font-bold">{avgMessages}</p>
          </div>
        </div>

        {/* Search */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 mb-6">
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search conversations, users, or message content..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-ember/20 focus:border-ember"
              />
            </div>
            <button
              onClick={() => setSortDir(sortDir === "desc" ? "asc" : "desc")}
              className="flex items-center gap-1 px-3 py-2 text-sm text-muted-foreground hover:text-foreground border border-slate-200 rounded-lg"
            >
              {sortDir === "desc" ? "Newest first" : "Oldest first"}
              {sortDir === "desc" ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Conversations List */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="divide-y divide-slate-100">
            {sortedConversations.map((conv, index) => (
              <motion.div
                key={conv.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: index * 0.02 }}
                className="p-4 hover:bg-slate-50 cursor-pointer"
                onClick={() => setSelectedConversation(conv)}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-medium text-foreground truncate">
                        {conv.title || "Untitled conversation"}
                      </p>
                      <span className="text-xs text-muted-foreground bg-slate-100 px-2 py-0.5 rounded-full">
                        {conv.messages?.length || 0} messages
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {conv.user_name || conv.user_email || "Unknown user"}
                    </p>
                    {conv.messages && conv.messages.length > 0 && (
                      <p className="text-sm text-slate-500 mt-1 line-clamp-1">
                        {conv.messages[conv.messages.length - 1]?.content?.slice(0, 100)}...
                      </p>
                    )}
                  </div>
                  <div className="text-right text-sm text-muted-foreground whitespace-nowrap">
                    {new Date(conv.updated_at).toLocaleDateString()}
                    <br />
                    <span className="text-xs">
                      {new Date(conv.updated_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {sortedConversations.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              No conversations found.
            </div>
          )}
        </div>
      </div>

      {/* Conversation Detail Modal */}
      <AnimatePresence>
        {selectedConversation && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={() => setSelectedConversation(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl w-full max-w-3xl max-h-[80vh] flex flex-col overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between p-4 border-b border-slate-200">
                <div>
                  <h3 className="font-semibold text-foreground">
                    {selectedConversation.title || "Untitled conversation"}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {selectedConversation.user_name || selectedConversation.user_email} • {selectedConversation.messages?.length || 0} messages
                  </p>
                </div>
                <Button variant="ghost" size="icon" onClick={() => setSelectedConversation(null)}>
                  <X className="w-4 h-4" />
                </Button>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {selectedConversation.messages?.map((message, index) => (
                  <div
                    key={index}
                    className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                        message.role === "user"
                          ? "bg-ember text-white"
                          : "bg-slate-100 text-foreground"
                      }`}
                    >
                      {message.role === "assistant" ? (
                        <div className="prose prose-sm max-w-none">
                          <ReactMarkdown>{message.content}</ReactMarkdown>
                        </div>
                      ) : (
                        <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Modal Footer */}
              <div className="p-4 border-t border-slate-200 bg-slate-50">
                <p className="text-xs text-muted-foreground text-center">
                  Conversation started {new Date(selectedConversation.created_at).toLocaleString()} • 
                  Last updated {new Date(selectedConversation.updated_at).toLocaleString()}
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
