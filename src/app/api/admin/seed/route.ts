import { NextResponse } from "next/server";
import { readJsonStore } from "@/lib/fileStore";
import { saveEvent } from "@/lib/kv";

export const dynamic = "force-dynamic";

export async function POST() {
  try {
    const store = readJsonStore();
    const events = Array.from(store.values());
    let migratedCount = 0;

    for (const evt of events) {
      await saveEvent(evt);
      migratedCount++;
    }

    return NextResponse.json({
      success: true,
      message: `Successfully migrated/synced ${migratedCount} events to KV database.`,
      migratedCount,
    });
  } catch (error) {
    console.error("Error seeding events:", error);
    return NextResponse.json(
      { success: false, error: "Failed to seed events" },
      { status: 500 }
    );
  }
}
