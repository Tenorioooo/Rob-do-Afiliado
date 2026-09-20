import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { OAuthService } from "@/services/integrations/oauth-service";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.userId) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const baseUrl = (process.env.NEXTAUTH_URL || "http://localhost:3000").replace(/\/+$/, "");
    const appId = searchParams.get("app_id") || process.env.META_APP_ID || process.env.NEXT_PUBLIC_META_APP_ID;
    const redirectUri = searchParams.get("redirect_uri") || process.env.META_WHATSAPP_REDIRECT_URI || `${baseUrl}/api/integrations/oauth/whatsapp/callback`;
    const format = searchParams.get("format");

    if (!appId) {
      const errorMsg = "META_APP_ID não configurado no servidor. Configure a chave META_APP_ID no arquivo .env.";
      const isJsonRequest = format === "json" || req.headers.get("accept")?.includes("application/json");

      if (isJsonRequest) {
        return NextResponse.json({ error: errorMsg }, { status: 400 });
      }

      return NextResponse.redirect(
        `${baseUrl}/integrations?error=${encodeURIComponent(errorMsg)}`
      );
    }

    const { url, state } = OAuthService.generateMetaWhatsAppAuthUrl({
      appId,
      redirectUri,
      userId: session.userId,
    });

    if (format === "json") {
      return NextResponse.json({ url, state });
    }

    return NextResponse.redirect(url);
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Erro ao iniciar autenticação com Facebook";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
