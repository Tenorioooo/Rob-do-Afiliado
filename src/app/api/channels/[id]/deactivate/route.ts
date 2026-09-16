import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { ChannelService } from "@/services/channels/channel-service";

export const dynamic = "force-dynamic";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const channel = await ChannelService.deactivateChannel(params.id, session.userId);
    return NextResponse.json({ success: true, channel });
  } catch (error: unknown) {
    console.error("[API:Channels:Deactivate:Error]", error);
    const msg = error instanceof Error ? error.message : "Erro ao desativar canal";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
