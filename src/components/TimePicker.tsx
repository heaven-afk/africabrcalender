"use client";

import React, { useEffect, useRef, useState } from "react";
import { ChevronDown, Clock3, X } from "lucide-react";

interface TimePickerProps { value:string; onChange:(value:string)=>void; placeholder?:string; optional?:boolean; align?:"left"|"right"; }
const labelTime=(value:string)=>{ if(!value)return ""; const [h,m]=value.split(":").map(Number); return `${h%12||12}:${String(m).padStart(2,"0")} ${h<12?"AM":"PM"}`; };
const QUICK_TIMES=["09:00","12:00","15:00","17:00","18:00","19:00","20:00","21:00"];
const segments=(value:string)=>{if(!value)return {hour:"",minute:"",period:""};const [rawHour,rawMinute]=value.split(":").map(Number);return {hour:String(rawHour%12||12).padStart(2,"0"),minute:String(rawMinute).padStart(2,"0"),period:rawHour<12?"AM":"PM"};};

export function TimePicker({value,onChange,placeholder="Choose time",optional=false,align="left"}:TimePickerProps){
  const initial=segments(value); const [open,setOpen]=useState(false); const [hour,setHour]=useState(initial.hour); const [minute,setMinute]=useState(initial.minute); const [period,setPeriod]=useState(initial.period); const root=useRef<HTMLDivElement>(null); const minuteRef=useRef<HTMLInputElement>(null); const periodRef=useRef<HTMLInputElement>(null); const hourRef=useRef<HTMLInputElement>(null);
  useEffect(()=>{const next=segments(value);setHour(next.hour);setMinute(next.minute);setPeriod(next.period)},[value]);
  useEffect(()=>{const close=(e:MouseEvent)=>{if(root.current&&!root.current.contains(e.target as Node))setOpen(false)};document.addEventListener("mousedown",close);return()=>document.removeEventListener("mousedown",close)},[]);
  const apply=(nextHour=hour,nextMinute=minute,nextPeriod=period)=>{const h=Number(nextHour);const m=Number(nextMinute);if(!nextHour||!nextMinute||!nextPeriod||h<1||h>12||m<0||m>59)return;let normalized=h%12;if(nextPeriod==="PM")normalized+=12;onChange(`${String(normalized).padStart(2,"0")}:${String(m).padStart(2,"0")}`);setOpen(false)};
  const toggle=()=>{if(!open){const next=segments(value);setHour(next.hour);setMinute(next.minute);setPeriod(next.period)}setOpen(current=>!current)};
  return <div className={`time-picker time-picker--${align}`} ref={root}>
    <button type="button" className="time-picker__trigger" onClick={toggle} aria-expanded={open}><Clock3/><span>{value?labelTime(value):placeholder}</span>{value&&optional?<X aria-label="Clear time" onClick={e=>{e.stopPropagation();onChange("")}}/>:<ChevronDown/>}</button>
    {open&&<div className="time-picker__menu">
      <header><div><small>{optional ? "Optional end time" : "Event time"}</small><strong>{value ? labelTime(value) : placeholder}</strong></div>{optional&&value&&<button type="button" onClick={()=>{onChange("");setOpen(false)}}>Clear</button>}</header>
      <div className="time-picker__manual"><span>Enter any time</span><div className="time-picker__entry">
        <input ref={hourRef} aria-label="Hour" inputMode="numeric" maxLength={2} value={hour} placeholder="--" onFocus={event=>event.currentTarget.select()} onChange={event=>{const next=event.target.value.replace(/\D/g,"").slice(0,2);setHour(next);if(next.length===2&&Number(next)>=1&&Number(next)<=12)minuteRef.current?.focus()}} onKeyDown={event=>{if(event.key==="Enter")apply()}} />
        <i>:</i>
        <input ref={minuteRef} aria-label="Minute" inputMode="numeric" maxLength={2} value={minute} placeholder="--" onFocus={event=>event.currentTarget.select()} onChange={event=>{const next=event.target.value.replace(/\D/g,"").slice(0,2);setMinute(next);if(next.length===2&&Number(next)<=59)periodRef.current?.focus()}} onKeyDown={event=>{if(event.key==="Backspace"&&!minute)hourRef.current?.focus();if(event.key==="Enter")apply()}} />
        <input ref={periodRef} className="time-picker__ampm" aria-label="AM or PM" maxLength={2} value={period} placeholder="AM/PM" onFocus={event=>event.currentTarget.select()} onChange={event=>{const typed=event.target.value.toUpperCase();const next=typed.startsWith("A")?"AM":typed.startsWith("P")?"PM":"";setPeriod(next);if(next)apply(hour,minute,next)}} onKeyDown={event=>{if(event.key==="Backspace"&&!period)minuteRef.current?.focus();if(event.key==="Enter")apply()}} />
      </div></div>
      <section className="time-picker__quick"><label>Or choose once</label><div>{QUICK_TIMES.map(item=><button type="button" key={item} className={value===item?"is-selected":""} onClick={()=>{onChange(item);setOpen(false)}}><strong>{labelTime(item)}</strong></button>)}</div></section>
    </div>}
  </div>;
}
