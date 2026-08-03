"use client";
import { ClerkProvider } from "@clerk/nextjs";
import React from "react";

interface Props {
  publishableKey: string;
  children: React.ReactNode;
}

export function ClerkProviderWrapper({ publishableKey, children }: Props) {
  return (
    <ClerkProvider publishableKey={publishableKey}>{children}</ClerkProvider>
  );
}
