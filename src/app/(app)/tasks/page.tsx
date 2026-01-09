"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence, Reorder } from "framer-motion";
import {
  Plus,
  Check,
  Clock,
  Target,
  Trash2,
  Edit3,
  ChevronRight,
  Sparkles,
  ArrowLeft,
  LayoutGrid,
  List,
  Calendar,
  Zap,
  Heart,
  BookOpen,
  AlertTriangle,
  Star,
  X,
  Repeat,
  Lightbulb,
  RefreshCw,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { ChatModal } from "@/components/ChatModal";

const ADMIN_EMAILS = ["colin.robertson3@gmail.com", "colin@willpowered.com"];

interface Task {
  id: string;
  title: string;
  description?: string;
  metricId?: string;
  metricName?: string;
  categoryId?: string;
  status: "in_progress" | "completed";
  dueDate?: string;
  recurrence?: "once" | "daily" | "weekly" | "monthly";
  createdAt: string;
  completedAt?: string;
  suggestedBy?: "user" | "willson";
}

// Helper to get urgency based on due date
function getUrgency(dueDate?: string): "overdue" | "today" | "soon" | "later" | "none" {
  if (!dueDate) return "none";
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  // Use parseDateLocal to avoid UTC conversion issues
  const due = parseDateLocal(dueDate);
  
  const diffDays = Math.floor((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  
  if (diffDays < 0) return "overdue";
  if (diffDays === 0) return "today";
  if (diffDays <= 7) return "soon";
  return "later";
}

// Helper to format date as YYYY-MM-DD using LOCAL time (not UTC)
function formatDateLocal(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Helper to display a date string in user-friendly format
function displayDate(dateStr: string): string {
  const date = parseDateLocal(dateStr);
  return date.toLocaleDateString();
}

// Helper to parse date string as LOCAL midnight (not UTC)
// Handles both "YYYY-MM-DD" and "M/D/YYYY" formats
function parseDateLocal(dateStr: string): Date {
  let year: number, month: number, day: number;
  
  if (dateStr.includes('-')) {
    // ISO format: YYYY-MM-DD
    [year, month, day] = dateStr.split('-').map(Number);
  } else if (dateStr.includes('/')) {
    // US format: M/D/YYYY
    const parts = dateStr.split('/');
    month = Number(parts[0]);
    day = Number(parts[1]);
    year = Number(parts[2]);
  } else {
    // Fallback: try to parse as Date
    const d = new Date(dateStr);
    year = d.getFullYear();
    month = d.getMonth() + 1;
    day = d.getDate();
  }
  
  return new Date(year, month - 1, day, 0, 0, 0, 0);
}

// Helper to get next occurrence date for recurring tasks
// Always advances to the next occurrence in the sequence
function getNextOccurrence(currentDate: string, recurrence: Task["recurrence"]): string {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  // Parse the date as LOCAL time to avoid timezone issues
  let date = parseDateLocal(currentDate);
  
  // Always add one interval first (the task is being completed, so move to next occurrence)
  switch (recurrence) {
    case "daily":
      date.setDate(date.getDate() + 1);
      break;
    case "weekly":
      date.setDate(date.getDate() + 7);
      break;
    case "monthly":
      date.setMonth(date.getMonth() + 1);
      break;
    default:
      // For "once" or undefined, just return tomorrow
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      return formatDateLocal(tomorrow);
  }
  
  // If still in the past (task was very overdue), keep advancing until future
  while (date <= today) {
    switch (recurrence) {
      case "daily":
        date.setDate(date.getDate() + 1);
        break;
      case "weekly":
        date.setDate(date.getDate() + 7);
        break;
      case "monthly":
        date.setMonth(date.getMonth() + 1);
        break;
    }
  }
  
  // Return formatted LOCAL date (not UTC)
  return formatDateLocal(date);
}

interface Metric {
  id: string;
  name: string;
  target: number;
  direction: "higher" | "lower";
  unit: string;
}

interface Category {
  id: string;
  name: string;
  icon: string;
  metrics: Metric[];
}

interface Scorecard {
  categories: Category[];
  data: {
    history: Record<string, Record<string, number>>;
  };
}

interface SuggestedTask {
  title: string;
  description?: string;
  metricId?: string;
  metricName?: string;
  dueDate?: string;
  recurrence?: "once" | "daily" | "weekly" | "monthly";
  reasoning: string;
}

const categoryIcons: Record<string, React.ElementType> = {
  heart: Heart,
  zap: Zap,
  book: BookOpen,
  alert: AlertTriangle,
  star: Star,
};

export default function TasksPage() {
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [scorecard, setScorecard] = useState<Scorecard | null>(null);
  const [showNewTaskModal, setShowNewTaskModal] = useState(false);
  const [preSelectedMetricId, setPreSelectedMetricId] = useState<string | null>(null);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [filterMetric, setFilterMetric] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<"all" | "active" | "completed">("active");
  const [viewMode, setViewMode] = useState<"list" | "kanban">("list");
  const [showChatModal, setShowChatModal] = useState(false);
  const [chatInitialMessage, setChatInitialMessage] = useState("");
  const [suggestions, setSuggestions] = useState<SuggestedTask[]>([]);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [dismissedSuggestions, setDismissedSuggestions] = useState<Set<string>>(new Set());
  const [suggestionsLoaded, setSuggestionsLoaded] = useState(false);
  const supabase = createClient();

  // Load suggestions from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem("willson-suggestions");
    const storedDismissed = localStorage.getItem("willson-suggestions-dismissed");
    
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setSuggestions(parsed);
      } catch (e) {
        console.error("Error parsing stored suggestions:", e);
      }
    }
    
    if (storedDismissed) {
      try {
        const parsed = JSON.parse(storedDismissed);
        setDismissedSuggestions(new Set(parsed));
      } catch (e) {
        console.error("Error parsing stored dismissed suggestions:", e);
      }
    }
    
    setSuggestionsLoaded(true);
  }, []);

  // Save suggestions to localStorage when they change
  useEffect(() => {
    if (suggestionsLoaded) {
      localStorage.setItem("willson-suggestions", JSON.stringify(suggestions));
    }
  }, [suggestions, suggestionsLoaded]);

  // Save dismissed suggestions to localStorage when they change
  useEffect(() => {
    if (suggestionsLoaded) {
      localStorage.setItem("willson-suggestions-dismissed", JSON.stringify([...dismissedSuggestions]));
    }
  }, [dismissedSuggestions, suggestionsLoaded]);

  // Check URL params for metric filter and auto-open modal
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const metricParam = params.get("metric");
    const newTaskParam = params.get("newTask");
    
    if (metricParam) {
      setFilterMetric(metricParam);
      // If newTask=true, open modal with metric pre-selected
      if (newTaskParam === "true") {
        setPreSelectedMetricId(metricParam);
        setShowNewTaskModal(true);
        // Clean up URL
        window.history.replaceState({}, "", "/tasks");
      }
    }
  }, []);

  const loadData = useCallback(async () => {
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

    const { data: profile } = await supabase
      .from("profiles")
      .select("scorecard, tasks")
      .eq("id", user.id)
      .single();

    if (profile?.scorecard) {
      setScorecard(profile.scorecard as Scorecard);
    }

    if (profile?.tasks) {
      setTasks(profile.tasks as Task[]);
    }

    setIsLoading(false);
  }, [supabase, router]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const saveTasks = async (newTasks: Task[]) => {
    // Optimistic update - update UI immediately
    setTasks(newTasks);
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase
      .from("profiles")
      .update({ tasks: newTasks })
      .eq("id", user.id);
  };

  const addTask = async (task: Omit<Task, "id" | "createdAt" | "status">) => {
    const newTask: Task = {
      ...task,
      id: `task-${Date.now()}`,
      status: "in_progress", // All new tasks start as in_progress
      createdAt: new Date().toISOString(),
    };
    await saveTasks([...tasks, newTask]);
    setShowNewTaskModal(false);
    setPreSelectedMetricId(null);
  };

  const updateTask = async (taskId: string, updates: Partial<Task>) => {
    const newTasks = tasks.map(t => 
      t.id === taskId ? { ...t, ...updates } : t
    );
    await saveTasks(newTasks);
    setEditingTask(null);
  };

  const toggleTaskComplete = async (taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    const isCompleting = task.status !== "completed";
    
    if (isCompleting) {
      // Mark as completed
      let newTasks = tasks.map(t =>
        t.id === taskId
          ? { ...t, status: "completed" as const, completedAt: new Date().toISOString() }
          : t
      );

      // If recurring, create next occurrence
      if (task.recurrence && task.recurrence !== "once" && task.dueDate) {
        const nextDueDate = getNextOccurrence(task.dueDate, task.recurrence);
        const nextTask: Task = {
          ...task,
          id: `task-${Date.now()}`,
          status: "in_progress",
          dueDate: nextDueDate,
          createdAt: new Date().toISOString(),
          completedAt: undefined,
        };
        newTasks = [...newTasks, nextTask];
      }

      await saveTasks(newTasks);
    } else {
      // Reopen task
      await updateTask(taskId, {
        status: "in_progress",
        completedAt: undefined,
      });
    }
  };

  const deleteTask = async (taskId: string) => {
    const newTasks = tasks.filter(t => t.id !== taskId);
    await saveTasks(newTasks);
  };

  const askWillsonForTasks = () => {
    const offTrackMetrics = getOffTrackMetrics();
    if (offTrackMetrics.length > 0) {
      const metricsList = offTrackMetrics.map(m => m.name).join(", ");
      setChatInitialMessage(`I need help creating actionable tasks to improve these metrics that are off track: ${metricsList}. Can you suggest 2-3 specific, concrete tasks for each that I can do this week?`);
    } else {
      setChatInitialMessage("Can you help me create some tasks to maintain my momentum on my scorecard metrics? What specific actions should I take this week to stay on track?");
    }
    setShowChatModal(true);
  };

  const getOffTrackMetrics = (): Metric[] => {
    if (!scorecard) return [];
    
    const offTrack: Metric[] = [];
    const today = new Date();
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - today.getDay());
    
    scorecard.categories.forEach(category => {
      category.metrics.forEach(metric => {
        const history = scorecard.data?.history?.[metric.id] || {};
        const weekValues = Object.entries(history)
          .filter(([date]) => new Date(date) >= weekStart)
          .map(([, value]) => value);
        
        if (weekValues.length > 0) {
          const avg = weekValues.reduce((a, b) => a + b, 0) / weekValues.length;
          const isOnTrack = metric.direction === "higher" 
            ? avg >= metric.target 
            : avg <= metric.target;
          
          if (!isOnTrack) {
            offTrack.push(metric);
          }
        }
      });
    });
    
    return offTrack;
  };

  // Load AI-generated task suggestions (only called when user clicks button)
  const loadSuggestions = useCallback(async () => {
    if (isLoadingSuggestions) return;
    
    setIsLoadingSuggestions(true);
    setDismissedSuggestions(new Set()); // Clear dismissed when getting new suggestions
    
    try {
      const response = await fetch("/api/suggest-tasks", {
        method: "POST",
      });
      
      if (!response.ok) throw new Error("Failed to load suggestions");
      
      const data = await response.json();
      const newSuggestions = data.suggestions || [];
      setSuggestions(newSuggestions);
      
      // Immediately save to localStorage
      localStorage.setItem("willson-suggestions", JSON.stringify(newSuggestions));
      localStorage.setItem("willson-suggestions-dismissed", JSON.stringify([]));
    } catch (error) {
      console.error("Error loading suggestions:", error);
      setSuggestions([]);
    } finally {
      setIsLoadingSuggestions(false);
    }
  }, [isLoadingSuggestions]);

  // Add a suggested task to the task list
  const addSuggestion = async (suggestion: SuggestedTask) => {
    const newTask: Task = {
      id: `task-${Date.now()}`,
      title: suggestion.title,
      description: suggestion.description,
      metricId: suggestion.metricId,
      metricName: suggestion.metricName,
      status: "in_progress",
      dueDate: suggestion.dueDate,
      recurrence: suggestion.recurrence || "once",
      createdAt: new Date().toISOString(),
      suggestedBy: "willson",
    };
    
    await saveTasks([...tasks, newTask]);
    
    // Remove from suggestions
    setSuggestions(prev => prev.filter(s => s.title !== suggestion.title));
  };

  // Dismiss a suggestion
  const dismissSuggestion = (title: string) => {
    setDismissedSuggestions(prev => new Set([...prev, title]));
  };

  // Note: Suggestions are loaded from localStorage on mount
  // User must click "Get new suggestions" to fetch fresh ones from AI

  const getMetricById = (metricId: string): Metric | undefined => {
    if (!scorecard) return undefined;
    for (const category of scorecard.categories) {
      const metric = category.metrics.find(m => m.id === metricId);
      if (metric) return metric;
    }
    return undefined;
  };

  const getCategoryByMetricId = (metricId: string): Category | undefined => {
    if (!scorecard) return undefined;
    return scorecard.categories.find(c => c.metrics.some(m => m.id === metricId));
  };

  // Filter tasks
  const filteredTasks = tasks.filter(task => {
    if (filterStatus === "active" && task.status === "completed") return false;
    if (filterStatus === "completed" && task.status !== "completed") return false;
    if (filterMetric && task.metricId !== filterMetric) return false;
    return true;
  });

  // Sort by urgency (due date based priority)
  const sortedTasks = [...filteredTasks].sort((a, b) => {
    // Completed tasks go to the bottom
    if (a.status === "completed" && b.status !== "completed") return 1;
    if (b.status === "completed" && a.status !== "completed") return -1;
    
    // Sort by urgency
    const urgencyOrder = { overdue: 0, today: 1, soon: 2, later: 3, none: 4 };
    const aUrgency = getUrgency(a.dueDate);
    const bUrgency = getUrgency(b.dueDate);
    const urgencyDiff = urgencyOrder[aUrgency] - urgencyOrder[bUrgency];
    if (urgencyDiff !== 0) return urgencyDiff;
    
    // Then by creation date (newest first)
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  // Group tasks for kanban view (now just active and completed)
  const tasksByStatus = {
    in_progress: sortedTasks.filter(t => t.status === "in_progress"),
    completed: sortedTasks.filter(t => t.status === "completed"),
  };

  if (isAdmin === null || isLoading) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading tasks...</div>
      </div>
    );
  }

  const offTrackMetrics = getOffTrackMetrics();

  return (
    <div className="min-h-screen bg-cream">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="text-muted-foreground hover:text-foreground">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-3xl font-serif font-bold text-foreground">Tasks</h1>
              <p className="text-muted-foreground">Actions to improve your metrics</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={askWillsonForTasks}
              className="gap-2"
            >
              <Sparkles className="w-4 h-4" />
              Ask Willson
            </Button>
            <Button onClick={() => setShowNewTaskModal(true)} className="gap-2">
              <Plus className="w-4 h-4" />
              New Task
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3 mb-6">
          <div className="flex items-center gap-2 bg-white rounded-lg border border-slate-200 p-1">
            {(["active", "all", "completed"] as const).map((status) => (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                  filterStatus === status
                    ? "bg-ember text-white"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </button>
            ))}
          </div>

          {scorecard && (
            <select
              value={filterMetric || ""}
              onChange={(e) => setFilterMetric(e.target.value || null)}
              className="px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-ember/20"
            >
              <option value="">All Metrics</option>
              {scorecard.categories.map(category => (
                <optgroup key={category.id} label={category.name}>
                  {category.metrics.map(metric => (
                    <option key={metric.id} value={metric.id}>
                      {metric.name}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          )}

          <div className="flex items-center gap-1 bg-white rounded-lg border border-slate-200 p-1 ml-auto">
            <button
              onClick={() => setViewMode("list")}
              className={`p-2 rounded-md transition-colors ${
                viewMode === "list" ? "bg-slate-100" : "hover:bg-slate-50"
              }`}
            >
              <List className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode("kanban")}
              className={`p-2 rounded-md transition-colors ${
                viewMode === "kanban" ? "bg-slate-100" : "hover:bg-slate-50"
              }`}
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Task List or Kanban */}
        {viewMode === "list" ? (
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
            {filteredTasks.length === 0 ? (
              <div className="text-center py-16">
                <Target className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                <p className="text-muted-foreground mb-4">No tasks yet</p>
                <Button onClick={() => setShowNewTaskModal(true)} variant="outline">
                  Create your first task
                </Button>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {sortedTasks.map((task, index) => (
                  <TaskRow
                    key={task.id}
                    task={task}
                    index={index}
                    metric={task.metricId ? getMetricById(task.metricId) : undefined}
                    category={task.metricId ? getCategoryByMetricId(task.metricId) : undefined}
                    onToggle={() => toggleTaskComplete(task.id)}
                    onEdit={() => setEditingTask(task)}
                    onDelete={() => deleteTask(task.id)}
                  />
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {(["in_progress", "completed"] as const).map((status) => (
              <KanbanColumn
                key={status}
                status={status}
                tasks={tasksByStatus[status]}
                getMetricById={getMetricById}
                getCategoryByMetricId={getCategoryByMetricId}
                onToggle={toggleTaskComplete}
                onEdit={setEditingTask}
                onDelete={deleteTask}
              />
            ))}
          </div>
        )}

        {/* Willson Suggests Section */}
        {isAdmin && suggestionsLoaded && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-8"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center">
                  <Lightbulb className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">Willson Suggests</h3>
                  <p className="text-xs text-muted-foreground">Based on your scorecard</p>
                </div>
              </div>
              <button
                onClick={loadSuggestions}
                disabled={isLoadingSuggestions}
                className="flex items-center gap-1 text-sm text-purple-600 hover:text-purple-700 font-medium transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${isLoadingSuggestions ? "animate-spin" : ""}`} />
                {isLoadingSuggestions ? "Thinking..." : "Get new suggestions"}
              </button>
            </div>

            {isLoadingSuggestions ? (
              <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-xl border border-purple-100 p-6">
                <div className="flex items-center justify-center gap-3">
                  <Loader2 className="w-5 h-5 animate-spin text-purple-500" />
                  <p className="text-sm text-purple-700">Analyzing your scorecard...</p>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <AnimatePresence mode="popLayout">
                  {suggestions
                    .filter(s => !dismissedSuggestions.has(s.title))
                    .map((suggestion, index) => (
                      <motion.div
                        key={suggestion.title}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20, height: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-xl border border-purple-100 p-4 group"
                      >
                        <div className="flex items-start gap-3">
                          <div className="w-6 h-6 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                            <Sparkles className="w-3 h-3 text-purple-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-foreground">{suggestion.title}</p>
                            {suggestion.description && (
                              <p className="text-sm text-muted-foreground mt-1">{suggestion.description}</p>
                            )}
                            <div className="flex items-center gap-3 mt-2 flex-wrap">
                              {suggestion.metricName && (
                                <span className="inline-flex items-center gap-1 text-xs text-purple-600 bg-purple-100 px-2 py-0.5 rounded-full">
                                  <Target className="w-3 h-3" />
                                  {suggestion.metricName}
                                </span>
                              )}
                              {suggestion.dueDate && (
                                <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                                  <Calendar className="w-3 h-3" />
                                  {displayDate(suggestion.dueDate)}
                                </span>
                              )}
                              {suggestion.recurrence && suggestion.recurrence !== "once" && (
                                <span className="inline-flex items-center gap-1 text-xs text-blue-600">
                                  <Repeat className="w-3 h-3" />
                                  {suggestion.recurrence}
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-purple-600 mt-2 italic">
                              💡 {suggestion.reasoning}
                            </p>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <Button
                              size="sm"
                              onClick={() => addSuggestion(suggestion)}
                              className="bg-purple-600 hover:bg-purple-700 text-white gap-1"
                            >
                              <Plus className="w-3 h-3" />
                              Add
                            </Button>
                            <button
                              onClick={() => dismissSuggestion(suggestion.title)}
                              className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-white rounded-lg transition-colors"
                              title="Dismiss"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                </AnimatePresence>
                
                {suggestions.filter(s => !dismissedSuggestions.has(s.title)).length === 0 && (
                  <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-xl border border-purple-100 p-6 text-center">
                    <Lightbulb className="w-8 h-8 text-purple-300 mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">
                      {suggestions.length === 0 
                        ? "Get personalized task suggestions based on your off-track metrics."
                        : "All suggestions added or dismissed."}
                    </p>
                    <button
                      onClick={loadSuggestions}
                      className="text-sm text-purple-600 hover:text-purple-700 mt-2 font-medium"
                    >
                      {suggestions.length === 0 ? "Get suggestions" : "Get new suggestions"}
                    </button>
                  </div>
                )}
              </div>
            )}
          </motion.div>
        )}

        {/* Quick Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-8">
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <p className="text-2xl font-bold text-foreground">{tasks.filter(t => t.status !== "completed").length}</p>
            <p className="text-sm text-muted-foreground">Active Tasks</p>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <p className="text-2xl font-bold text-rose-600">{tasks.filter(t => t.status !== "completed" && (getUrgency(t.dueDate) === "overdue" || getUrgency(t.dueDate) === "today")).length}</p>
            <p className="text-sm text-muted-foreground">Due Today/Overdue</p>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <p className="text-2xl font-bold text-blue-600">{tasks.filter(t => t.recurrence && t.recurrence !== "once").length}</p>
            <p className="text-sm text-muted-foreground">Recurring</p>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <p className="text-2xl font-bold text-emerald-600">{tasks.filter(t => t.status === "completed").length}</p>
            <p className="text-sm text-muted-foreground">Completed</p>
          </div>
        </div>
      </div>

      {/* New/Edit Task Modal */}
      <AnimatePresence>
        {(showNewTaskModal || editingTask) && (
          <TaskModal
            task={editingTask}
            scorecard={scorecard}
            preSelectedMetricId={preSelectedMetricId}
            onSave={(task) => editingTask ? updateTask(editingTask.id, task) : addTask(task)}
            onClose={() => {
              setShowNewTaskModal(false);
              setEditingTask(null);
              setPreSelectedMetricId(null);
            }}
          />
        )}
      </AnimatePresence>

      {/* Chat Modal */}
      <ChatModal
        isOpen={showChatModal}
        onClose={() => setShowChatModal(false)}
        initialMessage={chatInitialMessage}
      />
    </div>
  );
}

// Task Row Component
function TaskRow({
  task,
  index,
  metric,
  category,
  onToggle,
  onEdit,
  onDelete,
}: {
  task: Task;
  index: number;
  metric?: Metric;
  category?: Category;
  onToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const CategoryIcon = category?.icon ? categoryIcons[category.icon] || Target : Target;
  const urgency = getUrgency(task.dueDate);
  const urgencyConfig = {
    overdue: { label: "Overdue", color: "bg-rose-100 text-rose-700", dot: "bg-rose-500" },
    today: { label: "Today", color: "bg-amber-100 text-amber-700", dot: "bg-amber-500" },
    soon: { label: "This week", color: "bg-blue-100 text-blue-700", dot: "bg-blue-500" },
    later: { label: "", color: "bg-slate-100 text-slate-600", dot: "bg-slate-400" },
    none: { label: "", color: "", dot: "" },
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.03 }}
      className={`flex items-center gap-4 p-4 hover:bg-slate-50 transition-colors ${
        task.status === "completed" ? "opacity-60" : ""
      }`}
    >
      <button
        onClick={onToggle}
        className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
          task.status === "completed"
            ? "bg-emerald-500 border-emerald-500 text-white"
            : "border-slate-300 hover:border-ember"
        }`}
      >
        {task.status === "completed" && <Check className="w-4 h-4" />}
      </button>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className={`font-medium ${task.status === "completed" ? "line-through text-muted-foreground" : "text-foreground"}`}>
            {task.title}
          </p>
          {task.recurrence && task.recurrence !== "once" && (
            <Repeat className="w-3 h-3 text-blue-500" />
          )}
          {task.suggestedBy === "willson" && (
            <Sparkles className="w-3 h-3 text-purple-500" />
          )}
        </div>
        {task.description && (
          <p className="text-sm text-muted-foreground truncate">{task.description}</p>
        )}
        <div className="flex items-center gap-2 mt-1">
          {metric && (
            <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
              <CategoryIcon className="w-3 h-3" />
              {metric.name}
            </span>
          )}
          {task.dueDate && (
            <span className={`inline-flex items-center gap-1 text-xs ${urgency === "overdue" || urgency === "today" ? urgencyConfig[urgency].color.split(' ')[1] : "text-muted-foreground"}`}>
              <Calendar className="w-3 h-3" />
              {displayDate(task.dueDate)}
            </span>
          )}
        </div>
      </div>

      {/* Urgency indicator */}
      {task.status !== "completed" && urgency !== "none" && urgency !== "later" && (
        <span className={`text-xs px-2 py-1 rounded-full ${urgencyConfig[urgency].color}`}>
          {urgencyConfig[urgency].label}
        </span>
      )}

      <div className="flex items-center gap-1">
        <button
          onClick={onEdit}
          className="p-2 text-muted-foreground hover:text-foreground rounded-lg hover:bg-slate-100"
        >
          <Edit3 className="w-4 h-4" />
        </button>
        <button
          onClick={onDelete}
          className="p-2 text-muted-foreground hover:text-rose-600 rounded-lg hover:bg-rose-50"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </motion.div>
  );
}

// Kanban Column Component
function KanbanColumn({
  status,
  tasks,
  getMetricById,
  getCategoryByMetricId,
  onToggle,
  onEdit,
  onDelete,
}: {
  status: Task["status"];
  tasks: Task[];
  getMetricById: (id: string) => Metric | undefined;
  getCategoryByMetricId: (id: string) => Category | undefined;
  onToggle: (id: string) => void;
  onEdit: (task: Task) => void;
  onDelete: (id: string) => void;
}) {
  const statusConfig = {
    in_progress: { label: "Active", color: "bg-blue-50", dot: "bg-blue-500" },
    completed: { label: "Done", color: "bg-emerald-50", dot: "bg-emerald-500" },
  };

  const config = statusConfig[status];

  return (
    <div className={`rounded-xl ${config.color} p-4`}>
      <div className="flex items-center gap-2 mb-4">
        <span className={`w-2 h-2 rounded-full ${config.dot}`} />
        <h3 className="font-medium text-foreground">{config.label}</h3>
        <span className="text-xs text-muted-foreground ml-auto">{tasks.length}</span>
      </div>

      <div className="space-y-3">
        {tasks.map((task) => {
          const metric = task.metricId ? getMetricById(task.metricId) : undefined;
          const category = task.metricId ? getCategoryByMetricId(task.metricId) : undefined;
          const CategoryIcon = category?.icon ? categoryIcons[category.icon] || Target : Target;
          const urgency = getUrgency(task.dueDate);

          return (
            <motion.div
              key={task.id}
              layout
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-lg border border-slate-200 p-3 shadow-sm"
            >
              <div className="flex items-start gap-2">
                <button
                  onClick={() => onToggle(task.id)}
                  className={`w-5 h-5 rounded-full border-2 flex-shrink-0 mt-0.5 flex items-center justify-center ${
                    task.status === "completed"
                      ? "bg-emerald-500 border-emerald-500 text-white"
                      : "border-slate-300"
                  }`}
                >
                  {task.status === "completed" && <Check className="w-3 h-3" />}
                </button>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium ${task.status === "completed" ? "line-through text-muted-foreground" : ""}`}>
                    {task.title}
                  </p>
                  {metric && (
                    <span className="inline-flex items-center gap-1 text-xs text-muted-foreground mt-1">
                      <CategoryIcon className="w-3 h-3" />
                      {metric.name}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100">
                <div className="flex items-center gap-1">
                  {task.recurrence && task.recurrence !== "once" && (
                    <Repeat className="w-3 h-3 text-blue-500" />
                  )}
                  {task.suggestedBy === "willson" && (
                    <Sparkles className="w-3 h-3 text-purple-500" />
                  )}
                  {urgency === "overdue" && (
                    <span className="w-2 h-2 rounded-full bg-rose-500" />
                  )}
                  {urgency === "today" && (
                    <span className="w-2 h-2 rounded-full bg-amber-500" />
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => onEdit(task)}
                    className="p-1 text-muted-foreground hover:text-foreground"
                  >
                    <Edit3 className="w-3 h-3" />
                  </button>
                  <button
                    onClick={() => onDelete(task.id)}
                    className="p-1 text-muted-foreground hover:text-rose-600"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

// Task Modal Component
function TaskModal({
  task,
  scorecard,
  preSelectedMetricId,
  onSave,
  onClose,
}: {
  task: Task | null;
  scorecard: Scorecard | null;
  preSelectedMetricId?: string | null;
  onSave: (task: Omit<Task, "id" | "createdAt" | "status">) => void;
  onClose: () => void;
}) {
  // Default to today's date for new tasks
  const todayStr = formatDateLocal(new Date());
  
  const [title, setTitle] = useState(task?.title || "");
  const [description, setDescription] = useState(task?.description || "");
  const [metricId, setMetricId] = useState(task?.metricId || preSelectedMetricId || "");
  const [dueDate, setDueDate] = useState(task?.dueDate || todayStr);
  const [recurrence, setRecurrence] = useState<Task["recurrence"]>(task?.recurrence || "once");

  // Get metric name for display
  const selectedMetric = scorecard?.categories
    .flatMap(c => c.metrics)
    .find(m => m.id === metricId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    onSave({
      title: title.trim(),
      description: description.trim() || undefined,
      metricId: metricId || undefined,
      metricName: selectedMetric?.name,
      dueDate: dueDate || undefined,
      recurrence: recurrence || "once",
      suggestedBy: task?.suggestedBy || "user",
    });
  };

  // Get urgency for due date preview
  const urgency = getUrgency(dueDate);
  const urgencyConfig = {
    overdue: { label: "Overdue", color: "text-rose-600 bg-rose-50" },
    today: { label: "Due today", color: "text-amber-600 bg-amber-50" },
    soon: { label: "This week", color: "text-blue-600 bg-blue-50" },
    later: { label: "Later", color: "text-slate-600 bg-slate-50" },
    none: { label: "", color: "" },
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-white rounded-2xl w-full max-w-lg p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-serif font-bold text-foreground">
            {task ? "Edit Task" : "New Task"}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Task Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="What needs to be done?"
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-ember/20 focus:border-ember"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Description (optional)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add more details..."
              rows={2}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-ember/20 focus:border-ember resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Related Metric
            </label>
            <select
              value={metricId}
              onChange={(e) => setMetricId(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-ember/20 focus:border-ember"
            >
              <option value="">None</option>
              {scorecard?.categories.map(category => (
                <optgroup key={category.id} label={category.name}>
                  {category.metrics.map(metric => (
                    <option key={metric.id} value={metric.id}>
                      {metric.name}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Due Date
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-ember/20 focus:border-ember"
              />
              {dueDate && urgency !== "none" && (
                <span className={`inline-block mt-1 text-xs px-2 py-0.5 rounded-full ${urgencyConfig[urgency].color}`}>
                  {urgencyConfig[urgency].label}
                </span>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Repeat
              </label>
              <select
                value={recurrence}
                onChange={(e) => setRecurrence(e.target.value as Task["recurrence"])}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-ember/20 focus:border-ember"
              >
                <option value="once">Once</option>
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
              </select>
              {recurrence && recurrence !== "once" && (
                <p className="text-xs text-muted-foreground mt-1">
                  Creates a new task when completed
                </p>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={!title.trim()}>
              {task ? "Save Changes" : "Create Task"}
            </Button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}
