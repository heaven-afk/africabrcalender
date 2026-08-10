"use client";

import React, { useEffect, useRef, useState } from "react";
import { ChevronDown, Clock3, X } from "lucide-react";

interface TimePickerProps { value:string; onChange:(value:string)=>void; placeholder?:string; optional?:boolean; }
const labelTime=(value:string)=>{ if(!value)return ""; const [h,m]=value.split(":").map(Number); return `${h%12||12}:${String(m).padStart(2,"0")} ${h<12?"AM":"PM"}`; };

export function TimePicker({value,onChange,placeholder="Choose time",optional=false}:TimePickerProps){
  const [open,setOpen]=useState(false); const root=useRef<HTMLDivElement>(null);
  const [rawHour,rawMinute]=value?value.split(":").map(Number):[9,0]; const hour=rawHour%12||12; const minute=String(rawMinute).padStart(2,"0"); const period=rawHour<12?"AM":"PM";
  const setTime=(nextHour=hour,nextMinute=minute,nextPeriod=period)=>{ let h=nextHour%12; if(nextPeriod==="PM")h+=12; onChange(`${String(h).padStart(2,"0")}:${nextMinute}`); };
  useEffect(()=>{const close=(e:MouseEvent)=>{if(root.current&&!root.current.contains(e.target as Node))setOpen(false)};document.addEventListener("mousedown",close);return()=>document.removeEventListener("mousedown",close)},[]);
  return <div className="time-picker" ref={root}>
    <button type="button" className="time-picker__trigger" onClick={()=>setOpen(v=>!v)} aria-expanded={open}><Clock3/><span>{value?labelTime(value):placeholder}</span>{value&&optional?<X aria-label="Clear time" onClick={e=>{e.stopPropagation();onChange("")}}/>:<ChevronDown/>}</button>
    {open&&<div className="time-picker__menu">
      <header><div><small>Selected time</small><strong>{labelTime(value||"09:00")}</strong></div>{optional&&<button type="button" onClick={()=>{onChange("");setOpen(false)}}>No end time</button>}</header>
      <section><label>Hour</label><div className="time-picker__hours">{Array.from({length:12},(_,i)=>i+1).map(item=><button type="button" key={item} className={hour===item?"is-selected":""} onClick={()=>setTime(item)}>{item}</button>)}</div></section>
      <section><label>Minutes</label><div className="time-picker__minutes">{["00","15","30","45"].map(item=><button type="button" key={item} className={minute===item?"is-selected":""} onClick={()=>setTime(hour,item)}>{item}</button>)}</div></section>
      <section><label>Period</label><div className="time-picker__period">{["AM","PM"].map(item=><button type="button" key={item} className={period===item?"is-selected":""} onClick={()=>setTime(hour,minute,item)}>{item}</button>)}</div></section>
      <button type="button" className="time-picker__done" onClick={()=>{if(!value)setTime();setOpen(false)}}>Done</button>
    </div>}
  </div>;
}
