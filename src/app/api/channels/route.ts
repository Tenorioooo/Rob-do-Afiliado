import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { ChannelService } from "@/services/channels/channel-service";
import { z } from "zod";

export const dynamic = "force-dynamic";

const createChannelSchema = z.object({
  name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  type: z.enum(["TELEGRAM", "WHATSAPP", "DISCORD"]),
  provider: z.string().optional(),
  destination: z.string().min(1, "Destino é obrigatório"),
  config: z.record(z.any()).default({}),
});

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const channels = await ChannelService.listUserChannels(session.userId);
    return NextResponse.json({ success: true, channels });
  } catch (error: unknown) {
    console.error("[API:Channels:List:Error]", error);
    const msg = error instanceof Error ? error.message : "Erro ao listar canais";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const parsed = createChannelSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Dados inválidos", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const channel = await ChannelService.createChannel({
      userId: session.userId,
      name: parsed.data.name,
      type: parsed.data.type,
      provider: parsed.data.provider,
      destination: parsed.data.destination,
      config: parsed.data.config,
    });

    return NextResponse.json({ success: true, channel }, { status: 201 });
  } catch (error: unknown) {
    console.error("[API:Channels:Create:Error]", error);
    const msg = error instanceof Error ? error.message : "Erro ao criar canal";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
