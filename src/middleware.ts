import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Minimal pass-through middleware.
// Route protection is handled at the API/page level via getAuth().
// Clerk middleware has been removed to avoid Edge runtime failures
// caused by malformed or missing NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY.
export function middleware(request: NextRequest) {
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
