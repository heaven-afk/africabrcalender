import { Clock3, Globe2, Link2, MapPin } from "lucide-react";
import type { SelectItem } from "@/components/SearchableSelect";

const favicon = (domain: string) => `https://www.google.com/s2/favicons?domain=${domain}&sz=128`;

export const GAME_OPTIONS: SelectItem[] = [
  { value: "Call of Duty: Mobile", label: "Call of Duty: Mobile", description: "Mobile · FPS", logo: "https://www.citypng.com/public/uploads/preview/hd-call-of-duty-mobile-cod-game-logo-png-701751694787785ikqtuo527l.png" },
  { value: "PUBG Mobile", label: "PUBG Mobile", description: "Mobile · Battle royale", logo: favicon("pubgmobile.com") },
  { value: "Free Fire", label: "Free Fire", description: "Mobile · Battle royale", logo: "https://www.pngplay.com/wp-content/uploads/10/Garena-Free-Fire-Logo-PNG-HD-Quality.png" },
  { value: "eFootball Mobile", label: "eFootball Mobile", description: "Mobile · Football", logo: "/efootball-mobile-logo.png" },
  { value: "Blood Strike", label: "Blood Strike", description: "Mobile · Battle royale FPS", logo: "/blood-strike-logo.png" },
  { value: "Mobile Legends: Bang Bang", label: "Mobile Legends: Bang Bang", description: "Mobile · MOBA", logo: favicon("mobilelegends.com") },
  { value: "Honor of Kings", label: "Honor of Kings", description: "Mobile · MOBA", logo: favicon("honorofkings.com") },
  { value: "VALORANT", label: "VALORANT", description: "PC · Tactical FPS", logo: favicon("playvalorant.com") },
  { value: "League of Legends", label: "League of Legends", description: "PC · MOBA", logo: favicon("leagueoflegends.com") },
  { value: "Counter-Strike 2", label: "Counter-Strike 2", description: "PC · Tactical FPS", logo: favicon("counter-strike.net") },
  { value: "Dota 2", label: "Dota 2", description: "PC · MOBA", logo: favicon("dota2.com") },
  { value: "Fortnite", label: "Fortnite", description: "Cross-platform · Battle royale", logo: favicon("fortnite.com") },
  { value: "Apex Legends", label: "Apex Legends", description: "Cross-platform · Battle royale", logo: favicon("ea.com/games/apex-legends") },
  { value: "Overwatch 2", label: "Overwatch 2", description: "Cross-platform · Hero shooter", logo: favicon("overwatch.blizzard.com") },
  { value: "Rocket League", label: "Rocket League", description: "Cross-platform · Sports", logo: favicon("rocketleague.com") },
  { value: "Rainbow Six Siege", label: "Rainbow Six Siege", description: "Cross-platform · Tactical FPS", logo: favicon("ubisoft.com/game/rainbow-six/siege") },
  { value: "EA Sports FC", label: "EA Sports FC", description: "Cross-platform · Football", logo: favicon("ea.com/games/ea-sports-fc") },
];

export const REGION_OPTIONS: SelectItem[] = [
  { value: "Global", label: "Global", description: "Worldwide / cross-region", icon: Globe2 },
  { value: "North America", label: "North America", description: "NA", icon: MapPin },
  { value: "Latin America", label: "Latin America", description: "LATAM", icon: MapPin },
  { value: "Brazil", label: "Brazil", description: "BR", icon: MapPin },
  { value: "Europe", label: "Europe", description: "EU", icon: MapPin },
  { value: "EMEA", label: "Europe, Middle East & Africa", description: "EMEA", icon: MapPin },
  { value: "MENA", label: "Middle East & North Africa", description: "MENA", icon: MapPin },
  { value: "Africa", label: "Africa", description: "AFR", icon: MapPin },
  { value: "Sub-Saharan Africa", label: "Sub-Saharan Africa", description: "SSA", icon: MapPin },
  { value: "Asia-Pacific", label: "Asia-Pacific", description: "APAC", icon: MapPin },
  { value: "Southeast Asia", label: "Southeast Asia", description: "SEA", icon: MapPin },
  { value: "South Asia", label: "South Asia", description: "SA", icon: MapPin },
  { value: "East Asia", label: "East Asia", description: "EA", icon: MapPin },
  { value: "Oceania", label: "Oceania", description: "OCE", icon: MapPin },
];

export const TIMEZONE_OPTIONS: SelectItem[] = [
  { value: "UTC", label: "UTC", description: "Coordinated Universal Time", icon: Clock3 },
  { value: "Africa/Lagos", label: "West Africa Time", description: "Lagos · WAT", icon: Clock3 },
  { value: "Africa/Johannesburg", label: "South Africa Time", description: "Johannesburg · SAST", icon: Clock3 },
  { value: "Europe/London", label: "United Kingdom", description: "London · GMT/BST", icon: Clock3 },
  { value: "Europe/Berlin", label: "Central Europe", description: "Berlin · CET/CEST", icon: Clock3 },
  { value: "America/New_York", label: "North America Eastern", description: "New York · ET", icon: Clock3 },
  { value: "America/Chicago", label: "North America Central", description: "Chicago · CT", icon: Clock3 },
  { value: "America/Denver", label: "North America Mountain", description: "Denver · MT", icon: Clock3 },
  { value: "America/Los_Angeles", label: "North America Pacific", description: "Los Angeles · PT", icon: Clock3 },
  { value: "America/Sao_Paulo", label: "Brazil Time", description: "São Paulo · BRT", icon: Clock3 },
  { value: "Asia/Dubai", label: "Gulf Time", description: "Dubai · GST", icon: Clock3 },
  { value: "Asia/Kolkata", label: "India Time", description: "Kolkata · IST", icon: Clock3 },
  { value: "Asia/Singapore", label: "Singapore Time", description: "Singapore · SGT", icon: Clock3 },
  { value: "Asia/Shanghai", label: "China Time", description: "Shanghai · CST", icon: Clock3 },
  { value: "Asia/Seoul", label: "Korea Time", description: "Seoul · KST", icon: Clock3 },
  { value: "Asia/Tokyo", label: "Japan Time", description: "Tokyo · JST", icon: Clock3 },
  { value: "Australia/Sydney", label: "Australia Eastern", description: "Sydney · AEST/AEDT", icon: Clock3 },
];

export const STREAM_OPTIONS: SelectItem[] = [
  { value: "YouTube", label: "YouTube", description: "Video and livestream", logo: "https://cdn.simpleicons.org/youtube/FF0033" },
  { value: "Twitch", label: "Twitch", description: "Livestream channel", logo: "https://cdn.simpleicons.org/twitch/9146FF" },
  { value: "TikTok", label: "TikTok", description: "Live or video post", logo: "https://cdn.simpleicons.org/tiktok/FFFFFF" },
  { value: "Kick", label: "Kick", description: "Livestream channel", logo: "https://cdn.simpleicons.org/kick/53FC18" },
  { value: "Other", label: "Other platform", description: "Any other broadcast link", icon: Link2 },
];

export function getStreamPlatform(label?: string, url?: string) {
  const haystack = `${label || ""} ${url || ""}`.toLowerCase();
  if (haystack.includes("youtube") || haystack.includes("youtu.be")) return STREAM_OPTIONS[0];
  if (haystack.includes("twitch")) return STREAM_OPTIONS[1];
  if (haystack.includes("tiktok")) return STREAM_OPTIONS[2];
  if (haystack.includes("kick.com") || label?.toLowerCase() === "kick") return STREAM_OPTIONS[3];
  return STREAM_OPTIONS.find((item) => item.value === label) || STREAM_OPTIONS[4];
}

export function normalizeGame(value?: string | null) {
  if (!value) return null;
  const aliases: Record<string, string> = {
    codm: "Call of Duty: Mobile",
    "call of duty mobile": "Call of Duty: Mobile",
    ff: "Free Fire",
    efootball: "eFootball Mobile",
    "e football": "eFootball Mobile",
    "e football mobile": "eFootball Mobile",
    bloodstrike: "Blood Strike",
  };
  return aliases[value.trim().toLowerCase()] || value.trim();
}

export function normalizeRegion(value?: string | null) {
  if (!value) return null;
  const aliases: Record<string, string> = {
    african: "Africa", "sub saharan africa": "Sub-Saharan Africa", apac: "Asia-Pacific", na: "North America", eu: "Europe", latam: "Latin America", br: "Brazil", sea: "Southeast Asia", oce: "Oceania", ssa: "Sub-Saharan Africa",
    "africa, europe, north america": "Global",
  };
  return aliases[value.trim().toLowerCase()] || value.trim();
}
