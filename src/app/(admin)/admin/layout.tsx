import React from "react";
import { AppLayout } from "@/components/layout/app-layout";
import { getSession } from "@/lib/auth/session";
import { redirect } from "next/navigation";

export default async function AdminLayoutWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  if (!session || (session.role !== "ADMIN" && session.role !== "SUPERADMIN")) {
    redirect("/dashboard?error=unauthorized_admin");
  }

  return <AppLayout isAdmin={true}>{children}</AppLayout>;
}
