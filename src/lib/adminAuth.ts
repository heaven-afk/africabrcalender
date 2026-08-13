import "server-only";

import { NextRequest } from "next/server";
import { isAuthorizedAdminEmail } from "@/lib/adminPermissions";

export interface AdminAuthorization {
  userId: string | null;
  authorized: boolean;
}

export async function authorizeAdminRequest(request: NextRequest): Promise<AdminAuthorization> {
  if (process.env.NODE_ENV !== "production") {
    return { userId: "dev-admin-user", authorized: true };
  }

  try {
    const { getAuth, clerkClient } = await import("@clerk/nextjs/server");
    const { userId } = getAuth(request);
    if (!userId) return { userId: null, authorized: false };

    const client = await clerkClient();
    const user = await client.users.getUser(userId);
    const email = user.primaryEmailAddress?.emailAddress;
    return { userId, authorized: isAuthorizedAdminEmail(email) };
  } catch (error) {
    console.error("Admin authorization failed.", error);
    return { userId: null, authorized: false };
  }
}
