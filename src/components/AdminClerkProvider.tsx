"use client";

import React from "react";
import { ClerkProvider } from "@clerk/nextjs";
import { sanitizeClerkKey } from "@/lib/clerkUtils";

interface AdminClerkProviderProps {
  children: React.ReactNode;
}

export function AdminClerkProvider({ children }: AdminClerkProviderProps) {
  const rawKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ?? "";
  const publishableKey = sanitizeClerkKey(rawKey);

  return (
    <ClerkProvider publishableKey={publishableKey}>
      {children}
    </ClerkProvider>
  );
}
