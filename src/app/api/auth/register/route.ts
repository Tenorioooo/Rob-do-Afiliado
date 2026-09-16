import { NextRequest, NextResponse } from "next/server";
import { registerSchema } from "@/lib/validations/auth";
import { setSessionCookie } from "@/lib/auth/session";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result = registerSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: "Dados de cadastro inválidos", details: result.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { name, email } = result.data;

    const newUser = {
      userId: `usr-${Date.now()}`,
      email: email.toLowerCase(),
      name,
      role: "USER" as const,
      status: "TRIAL",
      avatar: null,
    };

    // Auto log-in after registration
    await setSessionCookie(newUser, false);

    return NextResponse.json({
      success: true,
      message: "Conta criada com sucesso!",
      user: newUser,
      redirectTo: "/onboarding",
    });
  } catch (error) {
    console.error("[Auth:Register:Error]", error);
    return NextResponse.json(
      { error: "Erro interno ao cadastrar usuário." },
      { status: 500 }
    );
  }
}
