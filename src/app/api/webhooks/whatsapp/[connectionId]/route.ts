import { NextRequest, NextResponse } from "next/server";
import { WebhookPipeline } from "@/services/integrations/webhook-pipeline";
import { ConnectionService } from "@/services/integrations/connection-service";

export async function GET(
  req: NextRequest,
  { params }: { params: { connectionId: string } }
) {
  try {
    const { searchParams } = new URL(req.url);
    const mode = searchParams.get("hub.mode");
    const token = searchParams.get("hub.verify_token");
    const challenge = searchParams.get("hub.challenge");

    if (!mode || !token) {
      return new NextResponse("Missing parameters", { status: 400 });
    }

    // Verify against connection credentials
    const credentials = await ConnectionService.getDecryptedCredentials(params.connectionId);
    const expectedToken = credentials.webhook_verify_token || credentials.verify_token || "affiliate_ai_secret";

    if (mode === "subscribe" && token === expectedToken) {
      return new NextResponse(challenge, { status: 200 });
    }

    return new NextResponse("Verification failed", { status: 403 });
  } catch (error: any) {
    return new NextResponse("Error: " + error.message, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: { connectionId: string } }
) {
  try {
    const rawBody = await req.text();
    const headers: Record<string, string> = {};
    req.headers.forEach((val, key) => {
      headers[key.toLowerCase()] = val;
    });

    const result = await WebhookPipeline.ingest({
      provider: "whatsapp",
      connectionId: params.connectionId,
      headers,
      rawBody,
    });

    return NextResponse.json(result, { status: result.success ? 200 : 400 });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Webhook processing error" },
      { status: 500 }
    );
  }
}
