import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { OAuthService } from "@/services/integrations/oauth-service";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const baseUrl = (process.env.NEXTAUTH_URL || "http://localhost:3000").replace(/\/+$/, "");

  try {
    const { searchParams } = new URL(req.url);
    const code = searchParams.get("code");
    const state = searchParams.get("state");
    const errorParam = searchParams.get("error");
    const errorDescription = searchParams.get("error_description");

    if (errorParam || errorDescription) {
      const err = errorDescription || errorParam || "Autenticação cancelada pelo usuário no Facebook.";
      return NextResponse.redirect(
        `${baseUrl}/integrations?error=${encodeURIComponent(err)}`
      );
    }

    if (!code || !state) {
      return NextResponse.redirect(
        `${baseUrl}/integrations?error=${encodeURIComponent("Parâmetros de autorização inválidos ou ausentes.")}`
      );
    }

    // 1. Validate state
    const stateValidation = OAuthService.validateWhatsAppState(state);
    if (!stateValidation.valid || !stateValidation.userId) {
      return NextResponse.redirect(
        `${baseUrl}/integrations?error=${encodeURIComponent("State inválido ou expirado. Tente novamente.")}`
      );
    }

    // 2. Validate session matches state user (if active session exists)
    const session = await getSession();
    const effectiveUserId = session?.userId || stateValidation.userId;

    const redirectUri = process.env.META_WHATSAPP_REDIRECT_URI || `${baseUrl}/api/integrations/oauth/whatsapp/callback`;

    // 3. Handle Token Exchange and Persist Connection
    const result = await OAuthService.handleMetaWhatsAppCallback({
      userId: effectiveUserId,
      code,
      redirectUri,
    });

    if (!result.success) {
      return NextResponse.redirect(
        `${baseUrl}/integrations?error=${encodeURIComponent(result.error || "Falha ao vincular conta do WhatsApp")}`
      );
    }

    return NextResponse.redirect(
      `${baseUrl}/integrations?success=whatsapp`
    );
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Erro interno ao processar callback do WhatsApp";
    return NextResponse.redirect(
      `${baseUrl}/integrations?error=${encodeURIComponent(msg)}`
    );
  }
}
