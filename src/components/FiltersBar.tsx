"use client";

import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Award, Check, Clock3, Crosshair, Gamepad2, Globe2, Medal, Mic2, Search, SlidersHorizontal, Trophy, X } from "lucide-react";
import { EventCategory } from "@/types/event";
import { GAME_OPTIONS, REGION_OPTIONS } from "@/lib/eventCatalog";

export type TimingFilter = "all" | "live" | "upcoming" | "past";
interface Props { search:string; onSearchChange:(v:string)=>void; selectedCategories:EventCategory[]; onCategoryToggle:(c:EventCategory)=>void; selectedRegions:string[]; onRegionsChange:(r:string[])=>void; selectedGames:string[]; onGamesChange:(g:string[])=>void; timing:TimingFilter; onTimingChange:(t:TimingFilter)=>void; }
const CATEGORIES=[{id:"ranking" as EventCategory,label:"Rankings",icon:Medal},{id:"tournament" as EventCategory,label:"Tournaments",icon:Trophy},{id:"scrim" as EventCategory,label:"Scrims",icon:Crosshair},{id:"award" as EventCategory,label:"Awards",icon:Award},{id:"podcast" as EventCategory,label:"Talks",icon:Mic2}];

export const FiltersBar:React.FC<Props>=(props)=>{
  const [open,setOpen]=useState(false); const [isMobile,setIsMobile]=useState(false); const root=useRef<HTMLDivElement>(null);
  useEffect(()=>{const media=window.matchMedia("(max-width: 760px)");const update=()=>setIsMobile(media.matches);update();media.addEventListener("change",update);return()=>media.removeEventListener("change",update)},[]);
  useEffect(()=>{if(isMobile)return;const close=(event:MouseEvent)=>{const target=event.target as Element;if(target.closest(".filter-more__panel"))return;if(root.current&&!root.current.contains(target))setOpen(false)};document.addEventListener("mousedown",close);return()=>document.removeEventListener("mousedown",close)},[isMobile]);
  useEffect(()=>{const close=(event:KeyboardEvent)=>{if(event.key==="Escape")setOpen(false)};document.addEventListener("keydown",close);return()=>document.removeEventListener("keydown",close)},[]);
  useEffect(()=>{if(!open||!isMobile)return;const previous=document.body.style.overflow;document.body.style.overflow="hidden";return()=>{document.body.style.overflow=previous}},[open,isMobile]);
  const toggleGame=(value:string)=>props.onGamesChange(props.selectedGames.includes(value)?props.selectedGames.filter(item=>item!==value):[...props.selectedGames,value]);
  const toggleRegion=(value:string)=>props.onRegionsChange(props.selectedRegions.includes(value)?props.selectedRegions.filter(item=>item!==value):[...props.selectedRegions,value]);
  const active=props.selectedGames.length+props.selectedRegions.length+Number(props.timing!=="all");
  const filterPanel=<><button type="button" className="filter-more__scrim" onClick={()=>setOpen(false)} aria-label="Close filters"/><div className="filter-more__panel" onMouseDown={event=>event.stopPropagation()}>
    <header><div><strong>Filter events</strong><span>Combine regions, games and timing</span></div><div className="filter-more__actions">{active>0&&<button type="button" onClick={()=>{props.onGamesChange([]);props.onRegionsChange([]);props.onTimingChange("all")}}>Clear all</button>}<button type="button" className="filter-more__close" onClick={()=>setOpen(false)} aria-label="Close filters"><X/></button></div></header>
    <div className="filter-group"><label><Globe2/>Esports regions <small>{props.selectedRegions.length?`${props.selectedRegions.length} selected`:"Any region"}</small></label><div className="filter-region-grid">{REGION_OPTIONS.map(region=><button type="button" key={region.value} aria-pressed={props.selectedRegions.includes(region.value)} className={props.selectedRegions.includes(region.value)?"is-selected":""} onClick={()=>toggleRegion(region.value)}><span><strong>{region.label}</strong>{region.description&&<small>{region.description}</small>}</span>{props.selectedRegions.includes(region.value)&&<Check/>}</button>)}</div></div>
    <div className="filter-group"><label><Gamepad2/>Games <small>{props.selectedGames.length?`${props.selectedGames.length} selected`:"Any game"}</small></label><div className="filter-choice-list">{GAME_OPTIONS.map(game=><button type="button" key={game.value} aria-pressed={props.selectedGames.includes(game.value)} className={props.selectedGames.includes(game.value)?"is-selected":""} onClick={()=>toggleGame(game.value)}>{game.logo&&<img src={game.logo} alt=""/>}<span>{game.label}</span>{props.selectedGames.includes(game.value)&&<Check/>}</button>)}</div></div>
    <div className="filter-group"><label><Clock3/>Schedule</label><div className="filter-segments">{(["all","live","upcoming","past"] as TimingFilter[]).map(value=><button type="button" key={value} className={props.timing===value?"is-selected":""} onClick={()=>props.onTimingChange(value)}>{value}</button>)}</div></div>
  </div></>;
  return <section className="filter-deck" aria-label="Search and filter events" ref={root} data-tour="filters">
    <div className="filter-deck__top">
      <label className="event-search"><Search/><span className="sr-only">Search events</span><input value={props.search} onChange={event=>props.onSearchChange(event.target.value)} placeholder="Search by event, organization, game or stage"/>{props.search&&<button type="button" onClick={()=>props.onSearchChange("")} aria-label="Clear search"><X/></button>}<kbd>⌘ K</kbd></label>
      <div className="filter-more">
        <button type="button" className={`filter-more__trigger ${active?"is-active":""}`} onClick={()=>setOpen(value=>!value)} aria-expanded={open}><SlidersHorizontal/><span>Filters</span>{active>0&&<b>{active}</b>}</button>
        {open&&(isMobile?createPortal(filterPanel,document.body):filterPanel)}
      </div>
    </div>
    <div className="filter-deck__bottom"><div className="filter-rail">{CATEGORIES.map(({id,label,icon:Icon})=><button key={id} className={`category-filter category-filter--${id} ${props.selectedCategories.includes(id)?"is-selected":""}`} onClick={()=>props.onCategoryToggle(id)} aria-pressed={props.selectedCategories.includes(id)}><Icon/><span>{label}</span></button>)}</div></div>
  </section>;
};
