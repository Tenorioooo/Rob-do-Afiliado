import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { PublicationService } from "@/services/publications/publication-service";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") || undefined;
    const channelId = searchParams.get("channelId") || undefined;
    const offerId = searchParams.get("offerId") || undefined;
    const search = searchParams.get("search") || undefined;
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "20", 10);

    const result = await PublicationService.listPublications({
      userId: session.userId,
      status,
      channelId,
      offerId,
      search,
      page,
      limit,
    });

    return NextResponse.json({ success: true, ...result });
  } catch (error: unknown) {
    console.error("[API:Publications:List:Error]", error);
    const msg = error instanceof Error ? error.message : "Erro ao listar publicações";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
