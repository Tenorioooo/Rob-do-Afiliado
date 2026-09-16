import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";

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

    const link = await prisma.affiliateLink.findFirst({
      where: { id: params.id, userId: session.userId },
      include: {
        product: true,
        opportunity: true,
        offers: true,
      },
    });

    if (!link) {
      return NextResponse.json({ error: "Link não encontrado" }, { status: 404 });
    }

    return NextResponse.json({ link });
  } catch (error: unknown) {
    console.error("[API:AffiliateLink:GetSingle:Error]", error);
    return NextResponse.json({ error: "Erro ao buscar link" }, { status: 500 });
  }
}
