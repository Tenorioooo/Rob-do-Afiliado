import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { PublicationService } from "@/services/publications/publication-service";

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

    const publication = await PublicationService.retryPublication(params.id, session.userId);
    return NextResponse.json({ success: true, publication });
  } catch (error: unknown) {
    console.error("[API:Publications:Retry:Error]", error);
    const msg = error instanceof Error ? error.message : "Erro ao reenviar publicação";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
