// Server-only file & in-memory persistence helper
import fs from "fs";
import path from "path";
import { CalendarEvent } from "@/types/event";

const DATA_DIR = path.join(process.cwd(), "data");
const DATA_FILE = path.join(DATA_DIR, "events.json");

// In-memory fallback cache for serverless environments (Vercel) where filesystem is read-only
let memoryCache: Map<string, CalendarEvent> | null = null;

export function ensureDataDir() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
  } catch {
    // Read-only filesystem on Vercel
  }
}

export function readJsonStore(): Map<string, CalendarEvent> {
  if (memoryCache) {
    return memoryCache;
  }

  const map = new Map<string, CalendarEvent>();
  try {
    if (fs.existsSync(DATA_FILE)) {
      const raw = fs.readFileSync(DATA_FILE, "utf-8");
      const arr: CalendarEvent[] = JSON.parse(raw);
      arr.forEach((e) => map.set(e.id, e));
    }
  } catch (err) {
    console.warn("Could not read file store, starting with empty map:", err);
  }

  memoryCache = map;
  return memoryCache;
}

export function writeJsonStore(map: Map<string, CalendarEvent>) {
  memoryCache = map;
  try {
    ensureDataDir();
    const arr = Array.from(map.values());
    fs.writeFileSync(DATA_FILE, JSON.stringify(arr, null, 2), "utf-8");
  } catch (err) {
    // Expected on Vercel read-only serverless filesystem
    console.warn("Filesystem is read-only (Vercel serverless). Saved event to in-memory store:", err);
  }
}
