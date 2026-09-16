import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { ProviderCapabilityAuditRegistry } from "@/domain/integrations/provider-capability-audit";

export async function GET(
  req: NextRequest,
  { params }: { params: { provider: string } }
) {
  try {
    const session = await getSession();
    if (!session?.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const auditRecord = ProviderCapabilityAuditRegistry.getByProviderId(params.provider);
    if (!auditRecord) {
      return NextResponse.json(
        { error: `Provedor "${params.provider}" não encontrado na auditoria` },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      provider: auditRecord,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Erro ao consultar capacidades do provedor" },
      { status: 500 }
    );
  }
}
