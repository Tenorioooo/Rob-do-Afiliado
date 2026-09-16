import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { ProviderCapabilityAuditRegistry } from "@/domain/integrations/provider-capability-audit";

export async function GET() {
  try {
    const session = await getSession();
    if (!session?.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const auditRecords = ProviderCapabilityAuditRegistry.getAll();
    const stats = ProviderCapabilityAuditRegistry.getSummaryStats();

    return NextResponse.json({
      success: true,
      stats,
      providers: auditRecords,
      auditRecords,
      auditedAt: "2026-09-15",
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Erro ao consultar auditoria de integrações" },
      { status: 500 }
    );
  }
}
