"use client";

import React, { useState } from "react";
import { X, LayoutGrid, CalendarDays, Rows3, Trophy, MousePointer, ChevronRight } from "lucide-react";

interface WalkthroughModalProps {
  open: boolean;
  onClose: () => void;
}

const STEPS = [
  {
    icon: <div className="flex items-center gap-1.5">
      <LayoutGrid className="w-5 h-5 text-[#c9ff70]" />
      <Rows3 className="w-5 h-5 text-[#c9ff70]" />
      <CalendarDays className="w-5 h-5 text-[#c9ff70]" />
      <Trophy className="w-5 h-5 text-[#c9ff70]" />
    </div>,
    title: "Four views, one schedule",
    body: "Use Year for the big picture, Agenda for a clean event feed, Week for immediate planning, and Events to follow multi-stage competitions.",
    highlight: "toolbar",
  },
  {
    icon: <MousePointer className="w-6 h-6 text-[#c9ff70]" />,
    title: "Open any event day",
    body: "Hover any highlighted day — like this — to see which tournaments are running, each with quick links to watch the broadcast and open its details page.",
    highlight: "day",
  },
  {
    icon: <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-[#b8ff3d]/15 border border-[#b8ff3d]/40 text-[#c9ff70] text-sm font-bold">⌘K</div>,
    title: "Jump anywhere instantly",
    body: "Press ⌘K (or Ctrl+K on Windows) to open the command palette. Search any tournament name, region, or view to jump there immediately.",
    highlight: "cmd",
  },
  {
    icon: <div className="flex items-center gap-1">
      <span className="w-3 h-3 rounded-full bg-amber-400" />
      <span className="w-3 h-3 rounded-full bg-[#b8ff3d]" />
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
      className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-4 bg-black/80 animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="match-dialog relative w-full max-w-sm p-5 animate-slideUp"
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
                    ? "w-5 h-2 bg-[#b8ff3d]"
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
          className="flex items-center gap-1.5 px-4 py-2 text-sm font-bold text-white bg-[#b8ff3d] rounded-lg hover:bg-[#d0ff7b] transition-colors"
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
