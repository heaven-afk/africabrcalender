"use client";

import React, { useCallback, useEffect, useState } from "react";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Download,
  LayoutGrid,
  Search,
  SlidersHorizontal,
  X,
} from "lucide-react";

interface WalkthroughModalProps {
  open: boolean;
  onClose: () => void;
}

const STEPS = [
  {
    target: '[data-tour="views"]',
    eyebrow: "Choose your view",
    title: "The same schedule, your way",
    body: "Move between the full year, agenda, week and event-series views. Your filters stay with you while you switch.",
    icon: LayoutGrid,
  },
  {
    target: '[data-tour="search"]',
    eyebrow: "Find anything",
    title: "Jump straight to an event",
    body: "Search events from here. On desktop, Ctrl+K or ⌘K opens the same quick search without reaching for the mouse.",
    icon: Search,
  },
  {
    target: '[data-tour="filters"]',
    eyebrow: "Shape the schedule",
    title: "Filter without losing context",
    body: "Combine event types, games, esports regions and timing. Every selected filter updates all calendar views together.",
    icon: SlidersHorizontal,
  },
  {
    target: '[data-tour="schedule"]',
    eyebrow: "Explore the calendar",
    title: "Open a day, then an event",
    body: "Select any marked day to see its schedule. Event colours identify the category; open an event for times, game, streams and full details.",
    icon: CalendarDays,
  },
  {
    target: '[data-tour="export"]',
    eyebrow: "Take it with you",
    title: "Add the schedule to your calendar",
    body: "Download the full schedule or just the month you are viewing as an .ics file for Google, Apple or Outlook Calendar.",
    icon: Download,
  },
] as const;

type SpotlightRect = { top: number; left: number; width: number; height: number };

export const WalkthroughModal: React.FC<WalkthroughModalProps> = ({ open, onClose }) => {
  const [step, setStep] = useState(0);
  const [spotlight, setSpotlight] = useState<SpotlightRect | null>(null);
  const current = STEPS[step];
  const CurrentIcon = current.icon;
  const isLast = step === STEPS.length - 1;

  const getVisibleTarget = useCallback(() => {
    return Array.from(document.querySelectorAll<HTMLElement>(current.target)).find((element) => {
      const rect = element.getBoundingClientRect();
      return rect.width > 0 && rect.height > 0 && window.getComputedStyle(element).visibility !== "hidden";
    }) ?? null;
  }, [current.target]);

  const measureTarget = useCallback(() => {
    const target = getVisibleTarget();
    if (!target) { setSpotlight(null); return; }
    const rect = target.getBoundingClientRect();
    const pad = window.innerWidth <= 760 ? 5 : 7;
    setSpotlight({
      top: Math.max(6, rect.top - pad),
      left: Math.max(6, rect.left - pad),
      width: Math.min(window.innerWidth - 12, rect.width + pad * 2),
      height: Math.min(window.innerHeight - 12, rect.height + pad * 2),
    });
  }, [getVisibleTarget]);

  useEffect(() => {
    if (open) setStep(0);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const target = getVisibleTarget();
    if (target) {
      const rect = target.getBoundingClientRect();
      const obscured = rect.top < 8 || rect.bottom > window.innerHeight - 230;
      if (obscured) target.scrollIntoView({ behavior: "smooth", block: "center" });
    }
    measureTarget();
    const settle = window.setTimeout(measureTarget, 380);
    window.addEventListener("resize", measureTarget);
    window.addEventListener("scroll", measureTarget, true);
    return () => {
      window.clearTimeout(settle);
      window.removeEventListener("resize", measureTarget);
      window.removeEventListener("scroll", measureTarget, true);
    };
  }, [current.target, getVisibleTarget, measureTarget, open]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
      if (event.key === "ArrowRight") setStep((value) => Math.min(STEPS.length - 1, value + 1));
      if (event.key === "ArrowLeft") setStep((value) => Math.max(0, value - 1));
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose, open]);

  if (!open) return null;

  const cardStyle: React.CSSProperties = spotlight && typeof window !== "undefined" && window.innerWidth > 760
    ? {
        left: Math.min(Math.max(16, spotlight.left), window.innerWidth - 376),
        top: spotlight.top + spotlight.height + 14 + 245 < window.innerHeight
          ? spotlight.top + spotlight.height + 14
          : Math.max(16, spotlight.top - 259),
      }
    : {};

  return (
    <div className="product-tour" role="dialog" aria-modal="true" aria-label="Calendar walkthrough">
      <button className="product-tour__dismiss-area" onClick={onClose} aria-label="Close walkthrough" />

      {spotlight && (
        <div
          className="product-tour__spotlight"
          style={{
            top: spotlight.top,
            left: spotlight.left,
            width: spotlight.width,
            height: spotlight.height,
          }}
          aria-hidden="true"
        />
      )}

      <section className="product-tour__card" style={cardStyle}>
        <header className="product-tour__header">
          <div className="product-tour__step-icon"><CurrentIcon aria-hidden="true" /></div>
          <span>{step + 1} of {STEPS.length}</span>
          <button onClick={onClose} aria-label="Close walkthrough"><X aria-hidden="true" /></button>
        </header>

        <div className="product-tour__copy">
          <small>{current.eyebrow}</small>
          <h2>{current.title}</h2>
          <p>{current.body}</p>
        </div>

        <footer className="product-tour__footer">
          <div className="product-tour__progress" aria-label={`Step ${step + 1} of ${STEPS.length}`}>
            {STEPS.map((item, index) => (
              <button
                key={item.target}
                className={index === step ? "is-active" : index < step ? "is-complete" : ""}
                onClick={() => setStep(index)}
                aria-label={`Go to step ${index + 1}`}
              />
            ))}
          </div>
          <div className="product-tour__actions">
            {step > 0 && <button className="product-tour__back" onClick={() => setStep(step - 1)}><ChevronLeft />Back</button>}
            <button className="product-tour__next" onClick={() => isLast ? onClose() : setStep(step + 1)}>
              {isLast ? "Start exploring" : "Next"}{!isLast && <ChevronRight />}
            </button>
          </div>
        </footer>
      </section>
    </div>
  );
};
