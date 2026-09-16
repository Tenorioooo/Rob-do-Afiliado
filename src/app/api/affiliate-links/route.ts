import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { AffiliateLinkService } from "@/services/affiliate/affiliate-link-service";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "20", 10);
    const platform = searchParams.get("platform") || undefined;
    const search = searchParams.get("search") || undefined;

    const data = await AffiliateLinkService.getUserLinks(session.userId, {
      page,
      limit,
      platform,
      search,
    });

    return NextResponse.json(data);
  } catch (error: unknown) {
    console.error("[API:AffiliateLinks:List:Error]", error);
    return NextResponse.json({ error: "Erro ao listar links de afiliados" }, { status: 500 });
  }
}
