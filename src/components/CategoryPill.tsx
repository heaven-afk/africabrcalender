import React from "react";
import { EventCategory } from "@/types/event";

interface CategoryPillProps {
  category: EventCategory;
  size?: "sm" | "md";
}

export const CategoryPill: React.FC<CategoryPillProps> = ({ category, size = "md" }) => {
  const isSm = size === "sm";

  const styles = {
    ranking: {
      label: "RANKING",
      className: "border-amber-500/40 bg-amber-500/10 text-amber-300 shadow-[0_0_10px_rgba(232,163,61,0.15)]",
    },
    tournament: {
      label: "TOURNAMENT",
      className: "border-cyan-500/40 bg-cyan-500/10 text-cyan-300 shadow-[0_0_10px_rgba(6,182,212,0.15)]",
    },
    scrim: {
      label: "SCRIM",
      className: "border-emerald-500/40 bg-emerald-500/10 text-emerald-300 shadow-[0_0_10px_rgba(16,185,129,0.15)]",
    },
  }[category];

  return (
    <span
      className={`inline-flex items-center justify-center font-display tracking-wider border rounded-md uppercase font-bold ${
        isSm ? "px-2 py-0.5 text-[10px]" : "px-3 py-1 text-xs"
      } ${styles.className}`}
    >
      {styles.label}
    </span>
  );
};
