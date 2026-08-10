"use client";

import React, { useEffect, useMemo, useState } from "react";
import { ArrowUpRight, Clock3, Gamepad2, Radio } from "lucide-react";
import { addDays, format, parseISO, setHours, setMinutes } from "date-fns";
import { CalendarEvent } from "@/types/event";
import { OrgLogo } from "./OrgLogo";
import { CategoryPill } from "./CategoryPill";

interface NextEventCountdownProps {
  events: CalendarEvent[];
  onSelectEvent: (event: CalendarEvent) => void;
}

interface NextEventTarget { event: CalendarEvent; targetDate: Date; isLive: boolean; }

function getNextTarget(event: CalendarEvent, now: Date): NextEventTarget | null {
  try {
    if (event.category !== "scrim" || !event.recurrence) {
      const startDate = parseISO(event.startDate);
      const endDate = parseISO(event.endDate);
      if (now >= startDate && now <= endDate) return { event, targetDate: startDate, isLive: true };
      return startDate > now ? { event, targetDate: startDate, isLive: false } : null;
    }

    const { startTime, endTime, daysOfWeek, exceptions } = event.recurrence;
    const [startHour, startMinute] = (startTime || "18:00").split(":").map(Number);
    const [endHour, endMinute] = (endTime || "19:00").split(":").map(Number);
    const scrimStart = parseISO(event.startDate);
    const scrimEnd = parseISO(event.endDate);
    if (now > scrimEnd) return null;

    const checkDate = now < scrimStart ? new Date(scrimStart) : new Date(now);
    for (let offset = 0; offset < 14; offset += 1) {
      const day = addDays(checkDate, offset);
      const dateString = format(day, "yyyy-MM-dd");
      if (dateString > event.endDate) break;
      if (exceptions?.includes(dateString) || !daysOfWeek.includes(day.getDay())) continue;

      const eventStart = setMinutes(setHours(day, startHour), startMinute);
      let eventEnd = setMinutes(setHours(day, endHour), endMinute);
      if (eventEnd <= eventStart) eventEnd = addDays(eventEnd, 1);
      if (now >= eventStart && now <= eventEnd) return { event, targetDate: eventStart, isLive: true };
      if (eventStart > now) return { event, targetDate: eventStart, isLive: false };
    }
  } catch (error) {
    console.error("Unable to calculate the next event", error);
  }
  return null;
}

function Countdown({ target, now }: { target: Date; now: Date }) {
  const difference = Math.max(0, target.getTime() - now.getTime());
  const values = [
    { value: Math.floor(difference / 86_400_000), label: "days" },
    { value: Math.floor((difference / 3_600_000) % 24), label: "hours" },
    { value: Math.floor((difference / 60_000) % 60), label: "mins" },
    { value: Math.floor((difference / 1_000) % 60), label: "secs" },
  ];
  return (
    <div className="countdown" aria-label="Time until event">
      {values.map(({ value, label }) => (
        <div key={label}><strong>{String(value).padStart(2, "0")}</strong><span>{label}</span></div>
      ))}
    </div>
  );
}

export const NextEventCountdown: React.FC<NextEventCountdownProps> = ({ events, onSelectEvent }) => {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const nextTarget = useMemo(() => {
    let closest: NextEventTarget | null = null;
    for (const event of events) {
      const target = getNextTarget(event, now);
      if (!target) continue;
      if (target.isLive) return target;
      if (!closest || target.targetDate < closest.targetDate) closest = target;
    }
    return closest;
  }, [events, now]);

  return (
    <section className="now-board" aria-label="Current date and next event">
      <div className="date-ticket">
        <span>{format(now, "EEEE")}</span>
        <strong>{format(now, "dd")}</strong>
        <small>{format(now, "MMMM yyyy")}</small>
      </div>

      {nextTarget ? (
        <button className="next-match" onClick={() => onSelectEvent(nextTarget.event)}>
          <div className="next-match__identity">
            <OrgLogo orgName={nextTarget.event.orgName} logoUrl={nextTarget.event.orgLogoUrl} size="md" />
            <div>
              <div className="next-match__labels">
                <span className={nextTarget.isLive ? "status-live" : "status-next"}>
                  {nextTarget.isLive ? <Radio /> : <Clock3 />}{nextTarget.isLive ? "Live now" : "Up next"}
                </span>
                <CategoryPill category={nextTarget.event.category} size="sm" />
              </div>
              <h2>{nextTarget.event.name}</h2>
              <p>{nextTarget.event.orgName}{nextTarget.event.game && <><Gamepad2 />{nextTarget.event.game}</>}</p>
            </div>
          </div>
          <div className="next-match__timing">
            {nextTarget.isLive ? <div className="live-callout"><span />In progress</div> : <Countdown target={nextTarget.targetDate} now={now} />}
            <ArrowUpRight aria-hidden="true" />
          </div>
        </button>
      ) : (
        <div className="next-match next-match--empty"><div><span className="status-next"><Clock3 />Schedule open</span><h2>No upcoming event yet.</h2><p>Check the full calendar or submit the next match.</p></div></div>
      )}
    </section>
  );
};
