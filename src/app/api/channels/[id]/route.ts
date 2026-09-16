import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { ChannelService } from "@/services/channels/channel-service";
import { z } from "zod";

export const dynamic = "force-dynamic";

const updateChannelSchema = z.object({
  name: z.string().min(2).optional(),
  destination: z.string().min(1).optional(),
  config: z.record(z.any()).optional(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const channel = await ChannelService.getChannelById(params.id, session.userId);
    if (!channel) {
      return NextResponse.json({ error: "Canal não encontrado" }, { status: 404 });
    }

    return NextResponse.json({ success: true, channel });
  } catch (error: unknown) {
    console.error("[API:Channels:Get:Error]", error);
    const msg = error instanceof Error ? error.message : "Erro ao obter canal";
    return NextResponse.json({ error: msg }, { status: 500 });
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

    const body = await request.json();
    const parsed = updateChannelSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Dados inválidos", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const channel = await ChannelService.updateChannel(params.id, session.userId, parsed.data);
    return NextResponse.json({ success: true, channel });
  } catch (error: unknown) {
    console.error("[API:Channels:Update:Error]", error);
    const msg = error instanceof Error ? error.message : "Erro ao atualizar canal";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    await ChannelService.deleteChannel(params.id, session.userId);
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error("[API:Channels:Delete:Error]", error);
    const msg = error instanceof Error ? error.message : "Erro ao excluir canal";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
