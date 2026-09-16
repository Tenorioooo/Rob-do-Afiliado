import { NextResponse } from "next/server";
import { ProviderRegistry } from "@/integrations/provider-registry";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const providers = ProviderRegistry.getAll();
    return NextResponse.json({ providers });
  } catch (error: unknown) {
    console.error("[API:Integrations:Providers:Error]", error);
    return NextResponse.json({ error: "Erro ao listar provedores" }, { status: 500 });
  }
}
