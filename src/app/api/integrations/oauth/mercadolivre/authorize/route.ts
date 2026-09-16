import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { OAuthService } from "@/services/integrations/oauth-service";

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const clientId = searchParams.get("client_id") || searchParams.get("app_id") || process.env.MERCADOLIVRE_CLIENT_ID;
    const redirectUri = searchParams.get("redirect_uri") || `${process.env.NEXTAUTH_URL || "http://localhost:3000"}/api/integrations/oauth/mercadolivre/callback`;
    const format = searchParams.get("format");
    const codeChallenge = searchParams.get("code_challenge") || undefined;
    const codeChallengeMethod = (searchParams.get("code_challenge_method") as "S256" | "plain") || (codeChallenge ? "S256" : undefined);

    const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";

    if (!clientId) {
      const errorMsg = "MERCADOLIVRE_CLIENT_ID não configurado";
      const isJsonRequest = format === "json" || req.headers.get("accept")?.includes("application/json");

      if (isJsonRequest) {
        return NextResponse.json(
          { error: errorMsg },
          { status: 400 }
        );
      }

      return NextResponse.redirect(
        `${baseUrl}/integrations?error=${encodeURIComponent(errorMsg)}`
      );
    }

    const { url, state } = OAuthService.generateAuthUrl({
      provider: "MERCADO_LIVRE",
      clientId,
      redirectUri,
      userId: session.userId,
      codeChallenge,
      codeChallengeMethod,
    });

    if (format === "json") {
      return NextResponse.json({ url, state });
    }

    return NextResponse.redirect(url);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
