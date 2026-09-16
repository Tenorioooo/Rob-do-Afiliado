import React from "react";
import { AppLayout } from "@/components/layout/app-layout";
import { getSession } from "@/lib/auth/session";

export default async function DashboardLayoutWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  const isAdmin = session?.role === "ADMIN" || session?.role === "SUPERADMIN";

  return <AppLayout isAdmin={isAdmin}>{children}</AppLayout>;
}
