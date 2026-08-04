import { NextRequest, NextResponse } from "next/server";
import { getEvents } from "@/lib/kv";
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

export async function GET(request: NextRequest) {
  try {
    const authorized = await isAuthorized(request);
    if (!authorized) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });
    }

    const allEvents = await getEvents();
    const pending = allEvents.filter((e) => e.status === "pending");

    return NextResponse.json({
      success: true,
      count: pending.length,
      data: pending,
    });
  } catch (error: any) {
    console.error("GET /api/admin/events/pending error:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to fetch pending events" },
      { status: 500 }
    );
  }
}
