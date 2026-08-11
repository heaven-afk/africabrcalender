"use client";

import React, { useEffect, useMemo, useState } from "react";
import { ArrowUpRight, CalendarClock, Clock3, Gamepad2, Radio } from "lucide-react";
import { format, subDays } from "date-fns";
import { CalendarEvent } from "@/types/event";
import { isScrimActiveOnDate } from "@/lib/utils";
import { OrgLogo } from "./OrgLogo";
import { CategoryPill } from "./CategoryPill";

interface Props { events:CalendarEvent[]; onSelectEvent:(event:CalendarEvent)=>void; }
interface TodayOccurrence { event:CalendarEvent; startTime:string|null; endTime:string|null; sortMinutes:number; live:boolean; timezone:string; }

function zonedParts(now:Date,timezone:string){
  const parts=new Intl.DateTimeFormat("en-CA",{timeZone:timezone,year:"numeric",month:"2-digit",day:"2-digit",hour:"2-digit",minute:"2-digit",hourCycle:"h23"}).formatToParts(now);
  const value=(type:string)=>parts.find(part=>part.type===type)?.value||"00";
  return {date:`${value("year")}-${value("month")}-${value("day")}`,minutes:Number(value("hour"))*60+Number(value("minute"))};
}
const minutes=(time:string)=>{const [hour,minute]=time.split(":").map(Number);return hour*60+minute;};
function occurrenceForToday(event:CalendarEvent,now:Date):TodayOccurrence|null{
  const timezone=event.recurrence?.timezone||event.location?.timezone||Intl.DateTimeFormat().resolvedOptions().timeZone||"UTC";
  const local=zonedParts(now,timezone); const date=local.date;
  const active=event.recurrence?isScrimActiveOnDate(date,event.recurrence,event.startDate,event.endDate):date>=event.startDate&&date<=event.endDate;
  const startTime=event.startTime||event.recurrence?.startTime;
  const endTime=event.endTime||event.recurrence?.endTime;
  if(!active&&!startTime)return null;
  if(!startTime)return {event,startTime:null,endTime:null,sortMinutes:Number.MAX_SAFE_INTEGER,live:false,timezone};
  const start=minutes(startTime); const end=endTime?minutes(endTime):1439;
  const previousDate=format(subDays(new Date(`${date}T12:00:00`),1),"yyyy-MM-dd");
  const previousActive=event.recurrence?isScrimActiveOnDate(previousDate,event.recurrence,event.startDate,event.endDate):previousDate>=event.startDate&&previousDate<=event.endDate;
  const live=end>start ? active&&local.minutes>=start&&local.minutes<=end : (active&&local.minutes>=start)||(previousActive&&local.minutes<=end);
  if(!active&&!live)return null;
  return {event,startTime,endTime:endTime||null,sortMinutes:start,live,timezone};
}
const clockLabel=(time:string|null)=>{if(!time)return "Time TBA";const [hour,minute]=time.split(":").map(Number);return `${hour%12||12}:${String(minute).padStart(2,"0")} ${hour<12?"AM":"PM"}`;};
const zoneLabel=(timezone:string)=>timezone==="UTC"?"UTC":timezone.split("/").pop()?.replaceAll("_"," ")||timezone;

export const NextEventCountdown:React.FC<Props>=({events,onSelectEvent})=>{
  const [now,setNow]=useState(()=>new Date());
  useEffect(()=>{const timer=window.setInterval(()=>setNow(new Date()),30_000);return()=>window.clearInterval(timer)},[]);
  const today=useMemo(()=>events.map(event=>occurrenceForToday(event,now)).filter(Boolean).sort((a,b)=>a!.sortMinutes-b!.sortMinutes) as TodayOccurrence[],[events,now]);
  const live=today.find(item=>item.live);
  const upcoming=today.filter(item=>!item.live&&(!item.startTime||item.sortMinutes>zonedParts(now,item.timezone).minutes)).slice(0,3);

  return <section className="now-board" aria-label="Today and live schedule">
    <div className="date-ticket"><span>{format(now,"EEEE")}</span><strong>{format(now,"dd")}</strong><small>{format(now,"MMMM yyyy")}</small></div>
    {live?<button className="next-match next-match--live" onClick={()=>onSelectEvent(live.event)}>
      <div className="next-match__identity"><OrgLogo orgName={live.event.orgName} logoUrl={live.event.orgLogoUrl} size="md"/><div><div className="next-match__labels"><span className="status-live"><Radio/>Live now</span><CategoryPill category={live.event.category} size="sm"/></div><h2>{live.event.name}</h2><p>{live.event.orgName}{live.event.game&&<><Gamepad2/>{live.event.game}</>}</p></div></div>
      <div className="next-match__timing"><div className="live-callout"><span/>{clockLabel(live.startTime)}{live.endTime?` – ${clockLabel(live.endTime)}`:""} · {zoneLabel(live.timezone)}</div><ArrowUpRight/></div>
    </button>:<div className="next-match next-match--quiet">
      <div className="quiet-schedule__intro"><span><Clock3/>Nothing live right now</span><h2>{today.length?"Still on today’s schedule":"No events scheduled today"}</h2><p>{today.length?"Tap an event to see the complete details.":"The calendar is clear for the rest of today."}</p></div>
      {upcoming.length>0&&<div className="quiet-schedule" aria-label="Upcoming today">{upcoming.map(item=><button key={item.event.id} onClick={()=>onSelectEvent(item.event)}><OrgLogo orgName={item.event.orgName} logoUrl={item.event.orgLogoUrl} size="sm"/><span><small>{clockLabel(item.startTime)} · {zoneLabel(item.timezone)}</small><strong>{item.event.name}</strong></span><CalendarClock/></button>)}</div>}
    </div>}
  </section>;
};
