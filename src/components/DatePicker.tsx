"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { addDays, addMonths, eachDayOfInterval, format, isBefore, isSameDay, isSameMonth, parseISO, startOfMonth, startOfWeek } from "date-fns";
import { CalendarDays, ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";

interface DatePickerProps {
  value: string;
  onChange: (value: string) => void;
  min?: string;
  icon?: React.ElementType;
}

const WEEKDAYS = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];

export const DatePicker: React.FC<DatePickerProps> = ({ value, onChange, min, icon: Icon = CalendarDays }) => {
  const selectedDate = value ? parseISO(value) : new Date();
  const [open, setOpen] = useState(false);
  const [visibleMonth, setVisibleMonth] = useState(() => startOfMonth(selectedDate));
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => { if (value) setVisibleMonth(startOfMonth(parseISO(value))); }, [value]);
  useEffect(() => {
    const closeOutside = (event: MouseEvent) => { if (rootRef.current && !rootRef.current.contains(event.target as Node)) setOpen(false); };
    const closeEscape = (event: KeyboardEvent) => { if (event.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", closeOutside);
    document.addEventListener("keydown", closeEscape);
    return () => { document.removeEventListener("mousedown", closeOutside); document.removeEventListener("keydown", closeEscape); };
  }, []);

  const days = useMemo(() => {
    const start = startOfWeek(startOfMonth(visibleMonth), { weekStartsOn: 1 });
    return eachDayOfInterval({ start, end: addDays(start, 41) }) as Date[];
  }, [visibleMonth]);
  const minimum = min ? parseISO(min) : null;

  return (
    <div className="custom-date" ref={rootRef}>
      <button type="button" className="custom-date__trigger" onClick={() => setOpen((current) => !current)} aria-haspopup="dialog" aria-expanded={open}>
        <Icon /><span>{value ? format(selectedDate, "MMM d, yyyy") : "Choose a date"}</span><ChevronDown />
      </button>
      {open && <div className="custom-date__popover" role="dialog" aria-label="Choose date">
        <header><button type="button" onClick={() => setVisibleMonth((month: Date) => addMonths(month, -1))} aria-label="Previous month"><ChevronLeft /></button><strong>{format(visibleMonth, "MMMM yyyy")}</strong><button type="button" onClick={() => setVisibleMonth((month: Date) => addMonths(month, 1))} aria-label="Next month"><ChevronRight /></button></header>
        <div className="custom-date__weekdays">{WEEKDAYS.map((day) => <span key={day}>{day}</span>)}</div>
        <div className="custom-date__days">{days.map((day: Date) => {
          const disabled = Boolean(minimum && isBefore(day, minimum) && !isSameDay(day, minimum));
          const selected = value ? isSameDay(day, selectedDate) : false;
          return <button type="button" key={format(day, "yyyy-MM-dd")} disabled={disabled} className={`${!isSameMonth(day, visibleMonth) ? "is-outside" : ""} ${selected ? "is-selected" : ""}`} onClick={() => { onChange(format(day, "yyyy-MM-dd")); setOpen(false); }}>{format(day, "d")}</button>;
        })}</div>
        <footer><button type="button" onClick={() => { onChange(format(new Date(), "yyyy-MM-dd")); setOpen(false); }}>Today</button><span>{value ? format(selectedDate, "EEEE, MMMM d") : "No date selected"}</span></footer>
      </div>}
    </div>
  );
};
