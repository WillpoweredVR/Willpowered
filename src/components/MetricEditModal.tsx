"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, TrendingUp, TrendingDown, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ScorecardMetric } from "@/lib/supabase/types";

interface MetricEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  metric: ScorecardMetric | null;
  onSave: (metric: ScorecardMetric) => void;
  onDelete?: (metricId: string) => void;
  isNew?: boolean;
}

export function MetricEditModal({
  isOpen,
  onClose,
  metric,
  onSave,
  onDelete,
  isNew = false,
}: MetricEditModalProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [target, setTarget] = useState("");
  const [unit, setUnit] = useState("");
  const [direction, setDirection] = useState<"higher" | "lower">("higher");
  const [aggregation, setAggregation] = useState<"average" | "sum" | "count">("average");

  useEffect(() => {
    if (metric) {
      setName(metric.name);
      setDescription(metric.description || "");
      setTarget(String(metric.target));
      setUnit(metric.unit || "");
      setDirection(metric.direction);
      setAggregation(metric.aggregation);
    } else {
      // Reset for new metric
      setName("");
      setDescription("");
      setTarget("");
      setUnit("");
      setDirection("higher");
      setAggregation("average");
    }
  }, [metric, isOpen]);

  const handleSave = () => {
    if (!name.trim() || !target) return;

    const updatedMetric: ScorecardMetric = {
      id: metric?.id || `metric-${Date.now()}`,
      name: name.trim(),
      description: description.trim() || undefined,
      target: parseFloat(target),
      unit: unit.trim() || undefined,
      direction,
      aggregation,
    };

    onSave(updatedMetric);
    onClose();
  };

  const handleDelete = () => {
    if (metric && onDelete) {
      onDelete(metric.id);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b">
            <h2 className="text-lg font-semibold">
              {isNew ? "Add Metric" : "Edit Metric"}
            </h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Form */}
          <div className="p-4 space-y-4">
            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Metric Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Sleep Quality"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:border-emerald-400"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Description
              </label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g., Sleep quality score from Oura (0-100)"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:border-emerald-400"
              />
            </div>

            {/* Target & Unit */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Target
                </label>
                <input
                  type="number"
                  value={target}
                  onChange={(e) => setTarget(e.target.value)}
                  placeholder="85"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:border-emerald-400"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Unit
                </label>
                <input
                  type="text"
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                  placeholder="e.g., score, hrs, days"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:border-emerald-400"
                />
              </div>
            </div>

            {/* Direction */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Success Direction
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setDirection("higher")}
                  className={`flex items-center justify-center gap-2 p-3 rounded-lg border-2 transition-colors ${
                    direction === "higher"
                      ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                      : "border-slate-200 hover:border-slate-300"
                  }`}
                >
                  <TrendingUp className="w-4 h-4" />
                  <span className="font-medium">Higher is Better</span>
                </button>
                <button
                  onClick={() => setDirection("lower")}
                  className={`flex items-center justify-center gap-2 p-3 rounded-lg border-2 transition-colors ${
                    direction === "lower"
                      ? "border-blue-500 bg-blue-50 text-blue-700"
                      : "border-slate-200 hover:border-slate-300"
                  }`}
                >
                  <TrendingDown className="w-4 h-4" />
                  <span className="font-medium">Lower is Better</span>
                </button>
              </div>
            </div>

            {/* Aggregation */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                How to Calculate (over 7 days)
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => setAggregation("average")}
                  className={`p-2 rounded-lg border-2 text-sm font-medium transition-colors ${
                    aggregation === "average"
                      ? "border-indigo-500 bg-indigo-50 text-indigo-700"
                      : "border-slate-200 hover:border-slate-300"
                  }`}
                >
                  Average
                </button>
                <button
                  onClick={() => setAggregation("sum")}
                  className={`p-2 rounded-lg border-2 text-sm font-medium transition-colors ${
                    aggregation === "sum"
                      ? "border-indigo-500 bg-indigo-50 text-indigo-700"
                      : "border-slate-200 hover:border-slate-300"
                  }`}
                >
                  Total
                </button>
                <button
                  onClick={() => setAggregation("count")}
                  className={`p-2 rounded-lg border-2 text-sm font-medium transition-colors ${
                    aggregation === "count"
                      ? "border-indigo-500 bg-indigo-50 text-indigo-700"
                      : "border-slate-200 hover:border-slate-300"
                  }`}
                >
                  Days Done
                </button>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                {aggregation === "average" && "Shows the average of all logged values"}
                {aggregation === "sum" && "Shows the total of all logged values"}
                {aggregation === "count" && "Counts days where you logged any value"}
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between p-4 border-t bg-slate-50">
            {!isNew && onDelete ? (
              <button
                onClick={handleDelete}
                className="flex items-center gap-1 px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                Delete
              </button>
            ) : (
              <div />
            )}
            <div className="flex gap-2">
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={!name.trim() || !target}>
                {isNew ? "Add Metric" : "Save Changes"}
              </Button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}



