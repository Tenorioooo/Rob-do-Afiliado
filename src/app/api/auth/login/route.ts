import { NextRequest, NextResponse } from "next/server";
import { loginSchema } from "@/lib/validations/auth";
import { setSessionCookie } from "@/lib/auth/session";
import { MOCK_USER, MOCK_ADMIN_USER } from "@/lib/mock";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result = loginSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: "Dados inválidos", details: result.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { email, password, rememberMe } = result.data;

    // Check for admin account demo or standard user
    let authenticatedUser;
    if (email.toLowerCase() === "admin@affiliateai.com") {
      authenticatedUser = {
        userId: MOCK_ADMIN_USER.id,
        email: MOCK_ADMIN_USER.email,
        name: MOCK_ADMIN_USER.name,
        role: "ADMIN" as const,
        status: MOCK_ADMIN_USER.status,
        avatar: MOCK_ADMIN_USER.avatar,
      };
    } else {
      authenticatedUser = {
        userId: MOCK_USER.id,
        email: email,
        name: email.split("@")[0],
        role: "USER" as const,
        status: "ACTIVE",
        avatar: MOCK_USER.avatar,
      };
    }

    // Set secure HttpOnly session cookie
    await setSessionCookie(authenticatedUser, rememberMe);

    return NextResponse.json({
      success: true,
      message: "Login realizado com sucesso!",
      user: authenticatedUser,
    });
  } catch (error) {
    console.error("[Auth:Login:Error]", error);
    return NextResponse.json(
      { error: "Erro interno no servidor ao processar o login." },
      { status: 500 }
    );
  }
}
