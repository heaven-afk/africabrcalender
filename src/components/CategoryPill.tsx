import React from "react";
import { EventCategory } from "@/types/event";

interface CategoryPillProps {
  category: EventCategory;
  size?: "sm" | "md";
}

export const CategoryPill: React.FC<CategoryPillProps> = ({ category, size = "md" }) => {
  const isSm = size === "sm";

  const stylesMap: Record<EventCategory, { label: string; className: string }> = {
    ranking: {
      label: "RANKING",
      className: "border-amber-400/60 bg-transparent text-amber-300",
    },
    tournament: {
      label: "TOURNAMENT",
      className: "border-[#4F7CFF]/60 bg-transparent text-[#4F7CFF]",
    },
    scrim: {
      label: "SCRIM",
      className: "border-emerald-400/60 bg-transparent text-emerald-300",
    },
    award: {
      label: "AWARD CEREMONY",
      className: "border-orange-400/60 bg-transparent text-orange-300",
    },
    podcast: {
      label: "PODCAST / TALK SHOW",
      className: "border-rose-400/60 bg-transparent text-rose-300",
    },
  };

  const style = stylesMap[category] || stylesMap.tournament;

  return (
    <span
      className={`inline-flex items-center justify-center tracking-[0.1em] border-l-2 border-y-0 border-r-0 uppercase font-extrabold ${
        isSm ? "pl-2 py-0.5 text-[9px]" : "pl-2.5 py-1 text-[11px]"
      } ${style.className}`}
    >
      {style.label}
    </span>
  );
};
