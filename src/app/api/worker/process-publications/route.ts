import { NextResponse } from "next/server";
import { PublicationService } from "@/services/publications/publication-service";

export const dynamic = "force-dynamic";

export async function POST() {
  try {
    const results = await PublicationService.processWorkerCycle();
    return NextResponse.json({
      success: true,
      processed: results.processed,
      succeeded: results.succeeded,
      failed: results.failed,
      results: results.results,
    });
  } catch (error: unknown) {
    console.error("[API:Worker:Process:Error]", error);
    const msg = error instanceof Error ? error.message : "Erro ao executar ciclo do worker";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
