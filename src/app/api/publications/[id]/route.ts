import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { PublicationService } from "@/services/publications/publication-service";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const publication = await PublicationService.getPublicationById(params.id, session.userId);
    if (!publication) {
      return NextResponse.json({ error: "Publicação não encontrada" }, { status: 404 });
    }

    return NextResponse.json({ success: true, publication });
  } catch (error: unknown) {
    console.error("[API:Publications:Get:Error]", error);
    const msg = error instanceof Error ? error.message : "Erro ao obter publicação";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
