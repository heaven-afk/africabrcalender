import { NextRequest, NextResponse } from "next/server";
import { readJsonStore } from "@/lib/fileStore";
import { getSupabaseClient, isSupabaseConfigured, mapEventToRow } from "@/lib/supabase";
import { isAuthorizedAdminEmail } from "@/lib/adminPermissions";

export const dynamic = "force-dynamic";

async function isAuthorized(req: NextRequest): Promise<boolean> {
  try {
    const { getAuth, clerkClient } = await import("@clerk/nextjs/server");
    const { userId } = getAuth(req);
    if (!userId) return false;
    try {
      const client = await clerkClient();
      const user = await client.users.getUser(userId);
      const email = user?.primaryEmailAddress?.emailAddress;
      return isAuthorizedAdminEmail(email);
    } catch {
      return true;
    }
  } catch {
    return true;
  }
}

export async function POST(request: NextRequest) {
  try {
    const authorized = await isAuthorized(request);
    if (!authorized) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });
    }

    if (!isSupabaseConfigured()) {
      return NextResponse.json(
        {
          success: false,
          error: "Supabase environment variables (NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY or NEXT_PUBLIC_SUPABASE_ANON_KEY) are not set.",
        },
        { status: 400 }
      );
    }

    const client = getSupabaseClient();
    if (!client) {
      return NextResponse.json({ success: false, error: "Failed to initialize Supabase client" }, { status: 500 });
    }

    const store = readJsonStore();
    const events = Array.from(store.values());

    if (events.length === 0) {
      return NextResponse.json({ success: true, message: "No events to migrate." });
    }

    const rows = events.map(mapEventToRow);
    const { data, error } = await client.from("events").upsert(rows, { onConflict: "id" });

    if (error) {
      console.error("Supabase manual migration error:", error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: `Successfully migrated ${events.length} events into Supabase PostgreSQL!`,
      count: events.length,
    });
  } catch (error: any) {
    console.error("POST /api/admin/migrate-supabase error:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to migrate data to Supabase" },
      { status: 500 }
    );
  }
}
