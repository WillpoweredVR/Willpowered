"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Save, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";

interface EditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  type: "goal" | "why" | "purpose";
  currentValue: string;
  goalId?: string;
}

const MODAL_CONFIG = {
  goal: {
    title: "Edit Your Quest",
    label: "What do you want to achieve?",
    placeholder: "I want to...",
    description: "Your primary goal - the quest you're working toward.",
  },
  why: {
    title: "Edit Your Why",
    label: "Why does this goal matter to you?",
    placeholder: "This matters because...",
    description: "The deeper reason that will motivate you on hard days.",
  },
  purpose: {
    title: "Edit Your Purpose",
    label: "What is your purpose?",
    placeholder: "My purpose is to...",
    description: "Your fundamental 'why' - the meaning behind everything you do.",
  },
};

export function EditModal({
  isOpen,
  onClose,
  onSave,
  type,
  currentValue,
  goalId,
}: EditModalProps) {
  const [value, setValue] = useState(currentValue);
  const [isSaving, setIsSaving] = useState(false);
  const config = MODAL_CONFIG[type];

  useEffect(() => {
    setValue(currentValue);
  }, [currentValue, isOpen]);

  const handleSave = async () => {
    if (!value.trim()) return;
    
    setIsSaving(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      setIsSaving(false);
      return;
    }

    try {
      if (type === "purpose") {
        await supabase
          .from("profiles")
          .update({ purpose_statement: value.trim() })
          .eq("id", user.id);
      } else if (type === "goal" && goalId) {
        await supabase
          .from("goals")
          .update({ title: value.trim() })
          .eq("id", goalId);
      } else if (type === "why" && goalId) {
        await supabase
          .from("goals")
          .update({ why_statement: value.trim() })
          .eq("id", goalId);
      }

      onSave();
      onClose();
    } catch (error) {
      console.error("Error saving:", error);
    } finally {
      setIsSaving(false);
    }
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
          className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
            <h2 className="font-serif text-xl font-semibold">{config.title}</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-slate-500" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6">
            <label className="block text-sm font-medium text-foreground mb-2">
              {config.label}
            </label>
            <textarea
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder={config.placeholder}
              className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-ember/20 focus:border-ember resize-none"
              rows={type === "purpose" ? 4 : 3}
              autoFocus
            />
            <p className="text-xs text-muted-foreground mt-2">{config.description}</p>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 px-6 py-4 bg-slate-50 border-t border-slate-200">
            <Button variant="outline" onClick={onClose} disabled={isSaving}>
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={!value.trim() || isSaving}
              className="gradient-ember text-white"
            >
              {isSaving ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              Save Changes
            </Button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}





