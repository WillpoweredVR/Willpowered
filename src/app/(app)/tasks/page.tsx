"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence, Reorder } from "framer-motion";
import {
  Plus,
  Check,
  Circle,
  Clock,
  Target,
  Trash2,
  Edit3,
  ChevronRight,
  Sparkles,
  ArrowLeft,
  Filter,
  LayoutGrid,
  List,
  Calendar,
  Zap,
  Heart,
  BookOpen,
  AlertTriangle,
  Star,
  X,
  GripVertical,
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
  status: "pending" | "in_progress" | "completed";
  priority: "low" | "medium" | "high";
  dueDate?: string;
  createdAt: string;
  completedAt?: string;
  suggestedBy?: "user" | "willson";
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
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [filterMetric, setFilterMetric] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<"all" | "active" | "completed">("active");
  const [viewMode, setViewMode] = useState<"list" | "kanban">("list");
  const [showChatModal, setShowChatModal] = useState(false);
  const [chatInitialMessage, setChatInitialMessage] = useState("");
  const supabase = createClient();

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
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase
      .from("profiles")
      .update({ tasks: newTasks })
      .eq("id", user.id);

    setTasks(newTasks);
  };

  const addTask = async (task: Omit<Task, "id" | "createdAt">) => {
    const newTask: Task = {
      ...task,
      id: `task-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    await saveTasks([...tasks, newTask]);
    setShowNewTaskModal(false);
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

    const newStatus = task.status === "completed" ? "pending" : "completed";
    await updateTask(taskId, {
      status: newStatus,
      completedAt: newStatus === "completed" ? new Date().toISOString() : undefined,
    });
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

  // Group tasks by status for kanban view
  const tasksByStatus = {
    pending: filteredTasks.filter(t => t.status === "pending"),
    in_progress: filteredTasks.filter(t => t.status === "in_progress"),
    completed: filteredTasks.filter(t => t.status === "completed"),
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

        {/* Off-Track Alert */}
        {offTrackMetrics.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6"
          >
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-medium text-amber-800">
                  {offTrackMetrics.length} metric{offTrackMetrics.length > 1 ? "s" : ""} need attention
                </p>
                <p className="text-sm text-amber-700 mt-1">
                  {offTrackMetrics.map(m => m.name).join(", ")} — create tasks to get back on track
                </p>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={askWillsonForTasks}
                className="border-amber-300 text-amber-700 hover:bg-amber-100"
              >
                Get Suggestions
              </Button>
            </div>
          </motion.div>
        )}

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
                {filteredTasks.map((task, index) => (
                  <TaskRow
                    key={task.id}
                    task={task}
                    index={index}
                    metric={task.metricId ? getMetricById(task.metricId) : undefined}
                    category={task.metricId ? getCategoryByMetricId(task.metricId) : undefined}
                    onToggle={() => toggleTaskComplete(task.id)}
                    onEdit={() => setEditingTask(task)}
                    onDelete={() => deleteTask(task.id)}
                    onStatusChange={(status) => updateTask(task.id, { status })}
                  />
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {(["pending", "in_progress", "completed"] as const).map((status) => (
              <KanbanColumn
                key={status}
                status={status}
                tasks={tasksByStatus[status]}
                getMetricById={getMetricById}
                getCategoryByMetricId={getCategoryByMetricId}
                onToggle={toggleTaskComplete}
                onEdit={setEditingTask}
                onDelete={deleteTask}
                onStatusChange={(taskId, newStatus) => updateTask(taskId, { status: newStatus })}
              />
            ))}
          </div>
        )}

        {/* Quick Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-8">
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <p className="text-2xl font-bold text-foreground">{tasks.filter(t => t.status !== "completed").length}</p>
            <p className="text-sm text-muted-foreground">Active Tasks</p>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <p className="text-2xl font-bold text-emerald-600">{tasks.filter(t => t.status === "completed").length}</p>
            <p className="text-sm text-muted-foreground">Completed</p>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <p className="text-2xl font-bold text-amber-600">{tasks.filter(t => t.priority === "high" && t.status !== "completed").length}</p>
            <p className="text-sm text-muted-foreground">High Priority</p>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <p className="text-2xl font-bold text-purple-600">{tasks.filter(t => t.suggestedBy === "willson").length}</p>
            <p className="text-sm text-muted-foreground">From Willson</p>
          </div>
        </div>
      </div>

      {/* New/Edit Task Modal */}
      <AnimatePresence>
        {(showNewTaskModal || editingTask) && (
          <TaskModal
            task={editingTask}
            scorecard={scorecard}
            onSave={(task) => editingTask ? updateTask(editingTask.id, task) : addTask(task)}
            onClose={() => {
              setShowNewTaskModal(false);
              setEditingTask(null);
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
  onStatusChange,
}: {
  task: Task;
  index: number;
  metric?: Metric;
  category?: Category;
  onToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onStatusChange: (status: Task["status"]) => void;
}) {
  const CategoryIcon = category?.icon ? categoryIcons[category.icon] || Target : Target;
  const priorityColors = {
    low: "bg-slate-100 text-slate-600",
    medium: "bg-blue-100 text-blue-700",
    high: "bg-rose-100 text-rose-700",
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
            <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
              <Calendar className="w-3 h-3" />
              {new Date(task.dueDate).toLocaleDateString()}
            </span>
          )}
        </div>
      </div>

      <span className={`text-xs px-2 py-1 rounded-full ${priorityColors[task.priority]}`}>
        {task.priority}
      </span>

      <select
        value={task.status}
        onChange={(e) => onStatusChange(e.target.value as Task["status"])}
        className="text-xs px-2 py-1 border border-slate-200 rounded-lg bg-white"
        onClick={(e) => e.stopPropagation()}
      >
        <option value="pending">Pending</option>
        <option value="in_progress">In Progress</option>
        <option value="completed">Completed</option>
      </select>

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
  onStatusChange,
}: {
  status: Task["status"];
  tasks: Task[];
  getMetricById: (id: string) => Metric | undefined;
  getCategoryByMetricId: (id: string) => Category | undefined;
  onToggle: (id: string) => void;
  onEdit: (task: Task) => void;
  onDelete: (id: string) => void;
  onStatusChange: (taskId: string, status: Task["status"]) => void;
}) {
  const statusConfig = {
    pending: { label: "To Do", color: "bg-slate-100", dot: "bg-slate-400" },
    in_progress: { label: "In Progress", color: "bg-blue-50", dot: "bg-blue-500" },
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
                  {task.suggestedBy === "willson" && (
                    <Sparkles className="w-3 h-3 text-purple-500" />
                  )}
                  {task.priority === "high" && (
                    <span className="w-2 h-2 rounded-full bg-rose-500" />
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
  onSave,
  onClose,
}: {
  task: Task | null;
  scorecard: Scorecard | null;
  onSave: (task: Omit<Task, "id" | "createdAt">) => void;
  onClose: () => void;
}) {
  const [title, setTitle] = useState(task?.title || "");
  const [description, setDescription] = useState(task?.description || "");
  const [metricId, setMetricId] = useState(task?.metricId || "");
  const [priority, setPriority] = useState<Task["priority"]>(task?.priority || "medium");
  const [status, setStatus] = useState<Task["status"]>(task?.status || "pending");
  const [dueDate, setDueDate] = useState(task?.dueDate || "");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const metric = scorecard?.categories
      .flatMap(c => c.metrics)
      .find(m => m.id === metricId);

    onSave({
      title: title.trim(),
      description: description.trim() || undefined,
      metricId: metricId || undefined,
      metricName: metric?.name,
      priority,
      status,
      dueDate: dueDate || undefined,
      suggestedBy: task?.suggestedBy || "user",
    });
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

          <div className="grid grid-cols-2 gap-4">
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

            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Priority
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as Task["priority"])}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-ember/20 focus:border-ember"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as Task["status"])}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-ember/20 focus:border-ember"
              >
                <option value="pending">Pending</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
              </select>
            </div>

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
