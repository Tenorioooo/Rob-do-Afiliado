import { NextRequest, NextResponse } from "next/server";
import { ProviderCapabilityAuditRegistry } from "@/domain/integrations/provider-capability-audit";
import { DispatchGuardService } from "@/services/integrations/dispatch-guard";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
    }

    const auditRecords = ProviderCapabilityAuditRegistry.getAll();
    const userConnections = await prisma.integrationConnection.findMany({
      where: { userId: session.userId },
    });

    const connMap = new Map(userConnections.map((c) => [c.provider.toUpperCase(), c]));
    const dispatchConfig = DispatchGuardService.getDispatchConfig();

    const matrix = auditRecords.flatMap((record) => {
      const userConn = connMap.get(record.providerId.toUpperCase());
      let metadata: Record<string, any> = {};
      try {
        if (userConn?.metadata) metadata = JSON.parse(userConn.metadata);
      } catch {
        // ignore
      }

      const steps: string[] = metadata.stepsCompleted || [];

      return record.capabilities.map((cap) => {
        let liveStatus = cap.status;
        if (userConn) {
          if (userConn.status === "VERIFIED_REAL") {
            liveStatus = "VERIFIED_REAL";
          } else if (userConn.status === "ERROR") {
            liveStatus = "UNVERIFIED";
          } else if (userConn.status === "DISCONNECTED") {
            liveStatus = "REQUIRES_CREDENTIALS";
          }
        }

        const isKillSwitchActive = dispatchConfig.realDispatchEnabled &&
          DispatchGuardService.isProviderRealDispatchEnabled(record.providerId);

        return {
          providerId: record.providerId,
          providerName: record.providerName,
          type: record.type,
          capability: cap.capability,
          label: cap.label,
          officialEvidence: cap.isOfficialApiConfirmed,
          officialSourceTitle: cap.officialSourceTitle,
          officialSourceUrl: cap.officialSourceUrl,
          authType: cap.authentication,
          credentialsRequired: cap.credentialsRequired,
          hasCredentials: Boolean(userConn?.encryptedCredentials),
          requiresApproval: cap.status === "REQUIRES_APPROVAL",
          accountRequirements: cap.accountRequirements,
          healthCheckPassed: steps.includes("HEALTH_CHECK") || Boolean(userConn?.lastValidatedAt),
          realTestPassed: steps.includes("TEST_SEND"),
          webhookConfigured: steps.includes("WEBHOOK"),
          isVerifiedReal: userConn?.status === "VERIFIED_REAL",
          enabledForAutopilot: Boolean(metadata.enabledForAutopilot),
          isKillSwitchActive,
          status: liveStatus,
          verifiedAt: cap.verifiedAt,
          limitationsAndNotes: cap.limitationsAndNotes,
        };
      });
    });

    return NextResponse.json({
      matrix,
      dispatchConfig,
      stats: ProviderCapabilityAuditRegistry.getSummaryStats(),
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Erro ao carregar matriz de capacidades.";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
