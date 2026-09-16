import { NextRequest, NextResponse } from "next/server";
import { forgotPasswordSchema } from "@/lib/validations/auth";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result = forgotPasswordSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: "E-mail inválido" },
        { status: 400 }
      );
    }

    // Simulate sending recovery email
    return NextResponse.json({
      success: true,
      message: "Se o e-mail estiver cadastrado, um link de recuperação foi enviado para sua caixa de entrada.",
    });
  } catch (error) {
    return NextResponse.json({ error: "Erro ao processar solicitação." }, { status: 500 });
  }
}
