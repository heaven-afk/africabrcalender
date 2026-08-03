import React from "react";
import { AdminClerkProvider } from "@/components/AdminClerkProvider";

export const dynamic = "force-dynamic";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AdminClerkProvider>{children}</AdminClerkProvider>;
}
