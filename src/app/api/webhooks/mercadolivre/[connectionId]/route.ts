import { NextRequest, NextResponse } from "next/server";
import { WebhookPipeline } from "@/services/integrations/webhook-pipeline";

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
      provider: "mercadolivre",
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
