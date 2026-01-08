"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Users,
  Search,
  Shield,
  Loader2,
  ArrowLeft,
  Mail,
  Calendar,
  Crown,
  CheckCircle,
  XCircle,
  MessageSquare,
  BarChart3,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

const ADMIN_EMAILS = ["colin.robertson3@gmail.com", "colin@willpowered.com"];

interface UserProfile {
  id: string;
  email: string;
  full_name: string | null;
  created_at: string;
  onboarding_completed: boolean;
  subscription_status: string | null;
  monthly_conversations: number;
  purpose_statement: string | null;
  principles: unknown[] | null;
  scorecard: unknown | null;
  is_admin: boolean;
}

export default function AdminUsersPage() {
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"created_at" | "name" | "conversations">("created_at");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [expandedUser, setExpandedUser] = useState<string | null>(null);

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

      // Fetch all users
      const { data: profiles, error } = await supabase
        .from("profiles")
        .select("id, email, full_name, created_at, onboarding_completed, subscription_status, monthly_conversations, purpose_statement, principles, scorecard, is_admin")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching users:", error);
      } else {
        setUsers(profiles || []);
      }

      setIsLoading(false);
    }

    checkAdminAndFetch();
  }, [router]);

  const filteredUsers = users.filter(user => {
    const query = searchQuery.toLowerCase();
    return (
      user.email?.toLowerCase().includes(query) ||
      user.full_name?.toLowerCase().includes(query) ||
      user.purpose_statement?.toLowerCase().includes(query)
    );
  });

  const sortedUsers = [...filteredUsers].sort((a, b) => {
    let comparison = 0;
    switch (sortBy) {
      case "name":
        comparison = (a.full_name || "").localeCompare(b.full_name || "");
        break;
      case "conversations":
        comparison = (a.monthly_conversations || 0) - (b.monthly_conversations || 0);
        break;
      case "created_at":
      default:
        comparison = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
    }
    return sortDir === "desc" ? -comparison : comparison;
  });

  const toggleSort = (field: typeof sortBy) => {
    if (sortBy === field) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortDir("desc");
    }
  };

  if (isAdmin === null || isLoading) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-ember mx-auto mb-4" />
          <p className="text-muted-foreground">Loading users...</p>
        </div>
      </div>
    );
  }

  // Stats
  const totalUsers = users.length;
  const proUsers = users.filter(u => u.subscription_status === "active" || u.subscription_status === "trialing").length;
  const completedOnboarding = users.filter(u => u.onboarding_completed).length;
  const activeThisMonth = users.filter(u => u.monthly_conversations > 0).length;

  return (
    <div className="min-h-screen bg-cream">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link href="/admin" className="text-muted-foreground hover:text-foreground">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-3xl font-serif font-bold text-foreground">Users</h1>
            <p className="text-muted-foreground">{totalUsers} total users</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
              <Users className="w-4 h-4" />
              Total Users
            </div>
            <p className="text-2xl font-bold">{totalUsers}</p>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
              <Crown className="w-4 h-4 text-amber-500" />
              Pro Users
            </div>
            <p className="text-2xl font-bold">{proUsers}</p>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
              <CheckCircle className="w-4 h-4 text-emerald-500" />
              Onboarded
            </div>
            <p className="text-2xl font-bold">{completedOnboarding}</p>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
              <MessageSquare className="w-4 h-4 text-blue-500" />
              Active This Month
            </div>
            <p className="text-2xl font-bold">{activeThisMonth}</p>
          </div>
        </div>

        {/* Search */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search by name, email, or purpose..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-ember/20 focus:border-ember"
            />
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">
                    <button onClick={() => toggleSort("name")} className="flex items-center gap-1 hover:text-foreground">
                      User
                      {sortBy === "name" && (sortDir === "desc" ? <ChevronDown className="w-3 h-3" /> : <ChevronUp className="w-3 h-3" />)}
                    </button>
                  </th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">Status</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">
                    <button onClick={() => toggleSort("conversations")} className="flex items-center gap-1 hover:text-foreground">
                      Conversations
                      {sortBy === "conversations" && (sortDir === "desc" ? <ChevronDown className="w-3 h-3" /> : <ChevronUp className="w-3 h-3" />)}
                    </button>
                  </th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">Progress</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">
                    <button onClick={() => toggleSort("created_at")} className="flex items-center gap-1 hover:text-foreground">
                      Joined
                      {sortBy === "created_at" && (sortDir === "desc" ? <ChevronDown className="w-3 h-3" /> : <ChevronUp className="w-3 h-3" />)}
                    </button>
                  </th>
                </tr>
              </thead>
              <tbody>
                {sortedUsers.map((user, index) => (
                  <motion.tr
                    key={user.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: index * 0.02 }}
                    className="border-b border-slate-100 hover:bg-slate-50 cursor-pointer"
                    onClick={() => setExpandedUser(expandedUser === user.id ? null : user.id)}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-sm font-medium">
                          {user.full_name?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium text-foreground flex items-center gap-2">
                            {user.full_name || "No name"}
                            {user.is_admin && <Shield className="w-3 h-3 text-ember" />}
                          </p>
                          <p className="text-sm text-muted-foreground">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {user.subscription_status === "active" || user.subscription_status === "trialing" ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700">
                            <Crown className="w-3 h-3" />
                            Pro
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600">
                            Free
                          </span>
                        )}
                        {user.onboarding_completed ? (
                          <CheckCircle className="w-4 h-4 text-emerald-500" />
                        ) : (
                          <XCircle className="w-4 h-4 text-slate-300" />
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-medium">{user.monthly_conversations || 0}</span>
                      <span className="text-muted-foreground text-sm"> this month</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2 text-sm">
                        {user.purpose_statement && <span className="text-emerald-600">Purpose</span>}
                        {Array.isArray(user.principles) && user.principles.length > 0 && (
                          <span className="text-indigo-600">{user.principles.length} principles</span>
                        )}
                        {user.scorecard !== null && user.scorecard !== undefined && <span className="text-blue-600">Scorecard</span>}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">
                      {new Date(user.created_at).toLocaleDateString()}
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>

          {sortedUsers.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              No users found matching your search.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
