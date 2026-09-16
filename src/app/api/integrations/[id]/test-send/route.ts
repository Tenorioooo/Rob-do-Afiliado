import { NextRequest, NextResponse } from "next/server";
import { IntegrationActivationService } from "@/services/integrations/activation-service";
import { getSession } from "@/lib/auth/session";
import { z } from "zod";

const TestSendSchema = z.object({
  destination: z.string().optional(),
  confirmed: z.literal(true, {
    errorMap: () => ({ message: "O envio de mensagem de teste requer confirmação explícita (confirmed: true)." }),
  }),
});

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const parseResult = TestSendSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        { error: parseResult.error.errors[0]?.message || "Parâmetros inválidos." },
        { status: 400 }
      );
    }

    const ipAddress = request.headers.get("x-forwarded-for") || "127.0.0.1";

    const result = await IntegrationActivationService.executeTestSend({
      userId: session.userId,
      connectionId: params.id,
      destination: parseResult.data.destination,
      confirmed: parseResult.data.confirmed,
      ipAddress,
    });

    if (!result.success) {
      return NextResponse.json(
        {
          error: result.errorMessage || "Falha ao enviar mensagem de teste.",
          progress: result.progress,
        },
        { status: 422 }
      );
    }

    return NextResponse.json({
      success: true,
      messageId: result.messageId,
      message: "Mensagem de teste enviada e confirmada com sucesso pelo canal oficial.",
      progress: result.progress,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Erro interno no teste de envio.";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
