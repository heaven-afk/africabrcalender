"use client";

import React from "react";
import { ClerkProvider } from "@clerk/nextjs";
import { isValidClerkPublishableKey, sanitizeClerkKey } from "@/lib/clerkUtils";
import { ShieldAlert, KeyRound, ExternalLink } from "lucide-react";
import Link from "next/link";

interface AdminClerkProviderProps {
  children: React.ReactNode;
}

export function AdminClerkProvider({ children }: AdminClerkProviderProps) {
  const rawKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ?? "";
  const publishableKey = sanitizeClerkKey(rawKey);
  const isValid = isValidClerkPublishableKey(publishableKey);

  if (!isValid) {
    return (
      <div className="min-h-screen flex flex-col bg-[#0a0a0c] text-zinc-100 items-center justify-center p-4 text-center">
        <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mb-4 shadow-xl">
          <KeyRound className="w-8 h-8 text-amber-400" />
        </div>
        <h2 className="font-display font-bold text-white text-2xl tracking-wide mb-2">
          Clerk Authentication Setup Required
        </h2>
        <p className="text-sm text-[#71717a] max-w-md mb-6 leading-relaxed">
          The environment variable <code className="text-amber-400 bg-black/50 px-1.5 py-0.5 rounded">NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY</code> is missing or invalid in Vercel.
        </p>

        <div className="bg-[#141417] border border-[#27272a] rounded-xl p-4 text-left max-w-md w-full mb-6 space-y-2 text-xs text-[#a1a1aa]">
          <div className="font-bold text-white mb-1">To enable Clerk Admin Login:</div>
          <div>1. Go to your Vercel Dashboard → Project Settings → Environment Variables.</div>
          <div>2. Add <code className="text-white bg-black/40 px-1 py-0.5 rounded">NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY</code> with your key from dashboard.clerk.com.</div>
          <div>3. Add <code className="text-white bg-black/40 px-1 py-0.5 rounded">NEXT_PUBLIC_ADMIN_EMAILS</code> with authorized admin emails.</div>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="px-4 py-2 rounded-xl bg-[#18181b] border border-[#27272a] text-sm font-semibold text-neutral-300 hover:text-white transition-colors"
          >
            Back to Calendar
          </Link>
          <a
            href="https://dashboard.clerk.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-black font-extrabold text-sm shadow-lg hover:scale-[1.02] transition-transform"
            style={{ background: "linear-gradient(135deg,#e8a33d,#c9821f)" }}
          >
            <span>Clerk Dashboard</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>
    );
  }

  return (
    <ClerkProvider publishableKey={publishableKey}>
      {children}
    </ClerkProvider>
  );
}
