import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { ConnectionService } from "@/services/integrations/connection-service";
import { prisma } from "@/lib/db/prisma";

export const dynamic = "force-dynamic";

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const connection = await ConnectionService.getConnection(session.userId, params.id, true);
    if (!connection) {
      return NextResponse.json({ error: "Integração não encontrada" }, { status: 404 });
    }

    return NextResponse.json({ connection });
  } catch (error: unknown) {
    console.error("[API:Integrations:Get:Error]", error);
    return NextResponse.json({ error: "Erro ao buscar integração" }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const conn = await prisma.integrationConnection.findFirst({
      where: { id: params.id, userId: session.userId },
    });

    if (!conn) {
      return NextResponse.json({ error: "Integração não encontrada" }, { status: 404 });
    }

    const body = await request.json();
    let metadata: Record<string, any> = {};
    try {
      if (conn.metadata) metadata = JSON.parse(conn.metadata);
    } catch {
      // ignore
    }

    if (body.enabledForAutopilot !== undefined) {
      // Only allow enabling autopilot if connection is VERIFIED_REAL
      if (body.enabledForAutopilot === true && conn.status !== "VERIFIED_REAL") {
        return NextResponse.json(
          { error: "O Autopilot só pode ser ativado em conexões com status VERIFIED_REAL." },
          { status: 400 }
        );
      }
      metadata.enabledForAutopilot = Boolean(body.enabledForAutopilot);
    }

    if (body.realDispatchEnabled !== undefined) {
      const { DispatchGuardService } = await import("@/services/integrations/dispatch-guard");
      DispatchGuardService.setProviderRealDispatchEnabled(conn.provider, Boolean(body.realDispatchEnabled));
      if (body.realDispatchEnabled === true) {
        DispatchGuardService.setGlobalRealDispatchEnabled(true);
      }
      metadata.realDispatchEnabled = Boolean(body.realDispatchEnabled);
    }

    if (body.destination !== undefined) {
      metadata.destination = body.destination;
    }

    const updated = await prisma.integrationConnection.update({
      where: { id: params.id },
      data: {
        metadata: JSON.stringify(metadata),
      },
    });

    // Also sync Channel if exists
    if (conn.provider === "TELEGRAM") {
      await prisma.channel.updateMany({
        where: { userId: session.userId, type: "TELEGRAM" },
        data: {
          destination: metadata.destination || undefined,
          identifier: metadata.destination || undefined,
          provider: "real",
        },
      });
    }

    return NextResponse.json({ success: true, connection: updated });
  } catch (error: unknown) {
    console.error("[API:Integrations:Patch:Error]", error);
    return NextResponse.json({ error: "Erro ao atualizar configuração" }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const conn = await prisma.integrationConnection.findFirst({
      where: { id: params.id, userId: session.userId },
    });

    if (!conn) {
      return NextResponse.json({ error: "Integração não encontrada" }, { status: 404 });
    }

    await prisma.integrationConnection.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true, message: "Integração removida com sucesso" });
  } catch (error: unknown) {
    console.error("[API:Integrations:Delete:Error]", error);
    return NextResponse.json({ error: "Erro ao remover integração" }, { status: 500 });
  }
}
