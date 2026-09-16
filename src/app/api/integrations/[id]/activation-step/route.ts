import { NextRequest, NextResponse } from "next/server";
import { IntegrationActivationService, ActivationStep } from "@/services/integrations/activation-service";
import { getSession } from "@/lib/auth/session";
import { z } from "zod";

const StepRequestSchema = z.object({
  step: z.enum([
    "CONFIGURE",
    "PREFLIGHT",
    "HEALTH_CHECK",
    "DESTINATION",
    "TEST_SEND",
    "WEBHOOK",
    "WEBHOOK_VALIDATE",
    "PROMOTE_TO_VERIFIED_REAL",
    "TOGGLE_AUTOPILOT",
  ]),
  credentials: z.record(z.any()).optional(),
  destination: z.string().optional(),
  webhookUrl: z.string().optional(),
  secretToken: z.string().optional(),
  enabledForAutopilot: z.boolean().optional(),
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
    const parseResult = StepRequestSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        { error: parseResult.error.errors[0]?.message || "Etapa ou parâmetros inválidos." },
        { status: 400 }
      );
    }

    const { step, credentials, destination, webhookUrl, secretToken, enabledForAutopilot } = parseResult.data;
    const ipAddress = request.headers.get("x-forwarded-for") || "127.0.0.1";

    switch (step) {
      case "CONFIGURE": {
        if (!credentials || Object.keys(credentials).length === 0) {
          return NextResponse.json({ error: "Credenciais não fornecidas." }, { status: 400 });
        }
        const res = await IntegrationActivationService.configureCredentials({
          userId: session.userId,
          connectionId: params.id,
          credentials,
          ipAddress,
        });
        return NextResponse.json(res);
      }

      case "PREFLIGHT": {
        const res = await IntegrationActivationService.runPreflightStep({
          userId: session.userId,
          connectionId: params.id,
          ipAddress,
        });
        return NextResponse.json(res);
      }

      case "HEALTH_CHECK": {
        const res = await IntegrationActivationService.runHealthCheckStep({
          userId: session.userId,
          connectionId: params.id,
          ipAddress,
        });
        return NextResponse.json(res);
      }

      case "DESTINATION": {
        if (!destination) {
          return NextResponse.json({ error: "Destino (Chat ID ou @canal) é obrigatório." }, { status: 400 });
        }
        const res = await IntegrationActivationService.configureDestinationStep({
          userId: session.userId,
          connectionId: params.id,
          destination,
          ipAddress,
        });
        return NextResponse.json(res);
      }

      case "WEBHOOK": {
        if (!webhookUrl) {
          return NextResponse.json({ error: "Webhook URL obrigatória." }, { status: 400 });
        }
        const res = await IntegrationActivationService.configureWebhookStep({
          userId: session.userId,
          connectionId: params.id,
          webhookUrl,
          secretToken,
          ipAddress,
        });
        return NextResponse.json(res);
      }

      case "WEBHOOK_VALIDATE": {
        const res = await IntegrationActivationService.validateWebhookStep({
          userId: session.userId,
          connectionId: params.id,
          ipAddress,
        });
        return NextResponse.json(res);
      }

      case "PROMOTE_TO_VERIFIED_REAL": {
        const res = await IntegrationActivationService.promoteToVerifiedReal({
          userId: session.userId,
          connectionId: params.id,
          enableForAutopilot: enabledForAutopilot ?? true,
          ipAddress,
        });
        return NextResponse.json(res);
      }

      case "TOGGLE_AUTOPILOT": {
        if (enabledForAutopilot === undefined) {
          return NextResponse.json({ error: "Flag enabledForAutopilot obrigatória." }, { status: 400 });
        }
        const res = await IntegrationActivationService.toggleAutopilotPermission({
          userId: session.userId,
          connectionId: params.id,
          enabled: enabledForAutopilot,
          ipAddress,
        });
        return NextResponse.json(res);
      }

      default:
        return NextResponse.json({ error: "Etapa desconhecida." }, { status: 400 });
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Erro interno ao processar etapa de ativação.";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
    }

    const progress = await IntegrationActivationService.getProgress(session.userId, params.id);
    if (!progress) {
      return NextResponse.json({ error: "Conexão não encontrada." }, { status: 404 });
    }

    const verifications = await IntegrationActivationService.getVerifications(session.userId, params.id);

    return NextResponse.json({ progress, verifications });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Erro ao buscar progresso de ativação.";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

