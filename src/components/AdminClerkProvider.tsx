"use client";

import React, { Component, ReactNode } from "react";
import { ClerkProvider } from "@clerk/nextjs";
import { sanitizeClerkKey } from "@/lib/clerkUtils";
import Link from "next/link";
import { ShieldAlert, ArrowLeft } from "lucide-react";

interface State {
  hasError: boolean;
  error?: Error;
}

class AdminClerkErrorBoundary extends Component<
  { publishableKey: string; children: ReactNode },
  State
> {
  constructor(props: { publishableKey: string; children: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.warn("Clerk initialization error caught by AdminClerkErrorBoundary:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex flex-col bg-[#050606] text-zinc-100 items-center justify-center p-4 text-center">
          <div className="w-16 h-16 rounded-xl bg-[#b8ff3d]/10 border border-[#b8ff3d]/30 flex items-center justify-center mb-4">
            <ShieldAlert className="w-8 h-8 text-[#c9ff70]" />
          </div>
          <h2 className="font-display font-bold text-white text-2xl tracking-wide mb-2">
            Clerk Authentication Notice
          </h2>
          <p className="text-xs text-red-400 font-mono max-w-lg mb-4 bg-red-950/40 p-3 rounded-xl border border-red-500/30 break-all text-left">
            {this.state.error?.message || "Unknown initialization error"}
          </p>

          <Link
            href="/"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#111412] border border-[#222624] text-sm font-semibold text-neutral-300 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Return to Public Calendar
          </Link>
        </div>
      );
    }

    return (
      <ClerkProvider
        publishableKey={this.props.publishableKey}
        afterSignOutUrl="/admin"
        signInFallbackRedirectUrl="/admin"
        signUpFallbackRedirectUrl="/admin"
        signUpUrl="/admin"
        signInUrl="/admin"
      >
        {this.props.children}
      </ClerkProvider>
    );
  }
}

interface AdminClerkProviderProps {
  children: React.ReactNode;
}

export function AdminClerkProvider({ children }: AdminClerkProviderProps) {
  const rawKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ?? "";
  const publishableKey = sanitizeClerkKey(rawKey);

  return (
    <AdminClerkErrorBoundary publishableKey={publishableKey}>
      {children}
    </AdminClerkErrorBoundary>
  );
}
