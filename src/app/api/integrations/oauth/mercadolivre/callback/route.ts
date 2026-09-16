import { NextRequest, NextResponse } from "next/server";
import { OAuthService } from "@/services/integrations/oauth-service";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const code = searchParams.get("code");
    const state = searchParams.get("state");
    const error = searchParams.get("error");
    const errorDescription = searchParams.get("error_description");

    const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";

    if (error) {
      return NextResponse.redirect(
        `${baseUrl}/integrations?error=${encodeURIComponent(errorDescription || error)}`
      );
    }

    if (!code || !state) {
      return NextResponse.redirect(
        `${baseUrl}/integrations?error=missing_oauth_code_or_state`
      );
    }

    // Validate state and extract userId
    const stateValidation = OAuthService.validateState(state);
    if (!stateValidation.valid || !stateValidation.userId) {
      return NextResponse.redirect(
        `${baseUrl}/integrations?error=invalid_or_expired_oauth_state`
      );
    }

    const redirectUri = `${baseUrl}/api/integrations/oauth/mercadolivre/callback`;
    const clientSecret = process.env.MERCADOLIVRE_CLIENT_SECRET || "";
    const clientId = process.env.MERCADOLIVRE_CLIENT_ID || "";

    const result = await OAuthService.handleMercadoLivreCallback({
      userId: stateValidation.userId!,
      code,
      clientId,
      clientSecret,
      redirectUri,
    });

    if (!result.success) {
      return NextResponse.redirect(
        `${baseUrl}/integrations?error=${encodeURIComponent(result.error || "oauth_failed")}`
      );
    }

    return NextResponse.redirect(
      `${baseUrl}/integrations?success=mercadolivre&connectionId=${result.connectionId}`
    );
  } catch (error: any) {
    const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
    return NextResponse.redirect(
      `${baseUrl}/integrations?error=${encodeURIComponent(error.message || "unexpected_oauth_error")}`
    );
  }
}
