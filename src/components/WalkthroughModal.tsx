"use client";

import React, { useState } from "react";
import { X, LayoutGrid, CalendarDays, Calendar, List, Trophy, MousePointer, ChevronRight } from "lucide-react";

interface WalkthroughModalProps {
  open: boolean;
  onClose: () => void;
}

const STEPS = [
  {
    icon: <div className="flex items-center gap-1.5">
      <LayoutGrid className="w-5 h-5 text-gold-400" />
      <CalendarDays className="w-5 h-5 text-gold-400" />
      <Calendar className="w-5 h-5 text-gold-400" />
      <List className="w-5 h-5 text-gold-400" />
      <Trophy className="w-5 h-5 text-gold-400" />
    </div>,
    title: "Five ways to view",
    body: "Switch between Grid, Calendar, Week, List, and Tournaments. Grid fits the whole year, Week zooms into one week, List reads like a schedule, and Tournaments groups events by competition.",
    highlight: "toolbar",
  },
  {
    icon: <MousePointer className="w-6 h-6 text-gold-400" />,
    title: "Open any event day",
    body: "Hover any highlighted day — like this — to see which tournaments are running, each with quick links to watch the broadcast and open its details page.",
    highlight: "day",
  },
  {
    icon: <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gold-500/15 border border-gold-500/30 text-gold-400 text-sm font-bold">⌘K</div>,
    title: "Jump anywhere instantly",
    body: "Press ⌘K (or Ctrl+K on Windows) to open the command palette. Search any tournament name, region, or view to jump there immediately.",
    highlight: "cmd",
  },
  {
    icon: <div className="flex items-center gap-1">
      <span className="w-3 h-3 rounded-full bg-amber-400" />
      <span className="w-3 h-3 rounded-full bg-cyan-400" />
      <span className="w-3 h-3 rounded-full bg-emerald-400" />
    </div>,
    title: "Event types explained",
    body: "Gold dots are Ranking events (ladders & leaderboards), Blue are Tournaments (prize pool competitions), and Green are Scrims (recurring team practice sessions).",
    highlight: "legend",
  },
];

export const WalkthroughModal: React.FC<WalkthroughModalProps> = ({ open, onClose }) => {
  const [step, setStep] = useState(0);
  const current = STEPS[step];
  const isLast = step === STEPS.length - 1;

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-sm bg-[#18181C] border border-white/10 rounded-2xl p-5 shadow-2xl animate-slideUp"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top bar */}
        <div className="flex items-center justify-between mb-4">
          {/* Step dots */}
          <div className="flex items-center gap-1.5">
            {STEPS.map((_, i) => (
              <button
                key={i}
                onClick={() => setStep(i)}
                className={`rounded-full transition-all ${
                  i === step
                    ? "w-5 h-2 bg-gold-500"
                    : "w-2 h-2 bg-surface-border hover:bg-neutral-600"
                }`}
              />
            ))}
          </div>
          <button onClick={onClose} className="p-1 text-neutral-600 hover:text-neutral-300 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Icon */}
        <div className="flex items-center justify-center mb-4">
          {current.icon}
        </div>

        {/* Content */}
        <h3 className="font-display font-bold text-white text-lg mb-2 tracking-wide">
          {current.title}
        </h3>
        <p className="text-sm text-neutral-400 leading-relaxed mb-5">
          {current.body}
        </p>

        {/* Actions */}
        <div className="flex items-center justify-between">
          <button
            onClick={onClose}
            className="text-xs text-neutral-600 hover:text-neutral-400 transition-colors"
          >
            Skip
          </button>
          <div className="flex items-center gap-2">
            {step > 0 && (
              <button
                onClick={() => setStep(step - 1)}
                className="px-4 py-2 text-sm font-semibold text-neutral-400 hover:text-white bg-surface-elevated rounded-xl transition-colors"
              >
                Back
              </button>
            )}
            <button
              onClick={() => {
                if (isLast) onClose();
                else setStep(step + 1);
              }}
              className="flex items-center gap-1.5 px-4 py-2 text-sm font-bold text-black bg-gold-gradient rounded-xl hover:opacity-90 transition-opacity"
            >
              {isLast ? "Done" : "Next"}
              {!isLast && <ChevronRight className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
