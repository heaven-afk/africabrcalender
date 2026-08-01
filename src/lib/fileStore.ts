// Server-only file persistence helper
// This module is ONLY imported in server-side code (API routes, server components)
import fs from "fs";
import path from "path";
import { CalendarEvent } from "@/types/event";

const DATA_DIR = path.join(process.cwd(), "data");
const DATA_FILE = path.join(DATA_DIR, "events.json");

export function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

export function readJsonStore(): Map<string, CalendarEvent> {
  ensureDataDir();
  try {
    if (fs.existsSync(DATA_FILE)) {
      const raw = fs.readFileSync(DATA_FILE, "utf-8");
      const arr: CalendarEvent[] = JSON.parse(raw);
      const map = new Map<string, CalendarEvent>();
      arr.forEach((e) => map.set(e.id, e));
      return map;
    }
  } catch {
    // corrupt file - start fresh
  }
  return new Map();
}

export function writeJsonStore(map: Map<string, CalendarEvent>) {
  ensureDataDir();
  const arr = Array.from(map.values());
  fs.writeFileSync(DATA_FILE, JSON.stringify(arr, null, 2), "utf-8");
}
