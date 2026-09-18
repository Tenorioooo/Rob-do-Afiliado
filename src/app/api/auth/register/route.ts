import { NextRequest, NextResponse } from "next/server";
import { registerSchema } from "@/lib/validations/auth";
import { setSessionCookie } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import bcrypt from "bcryptjs";

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

    const { name, email, password } = result.data;
    const normalizedEmail = email.toLowerCase().trim();

    // 1. Check if email is already in use
    const existing = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Este e-mail já está cadastrado. Faça login para continuar." },
        { status: 409 }
      );
    }

    // 2. Hash password with bcrypt
    const passwordHash = await bcrypt.hash(password, 10);

    // 3. Create user in database
    const user = await prisma.user.create({
      data: {
        name: name.trim(),
        email: normalizedEmail,
        passwordHash,
        role: "USER",
        status: "TRIAL",
      },
    });

    // 4. Initialize default AutopilotConfig for the new user
    await prisma.autopilotConfig.create({
      data: {
        userId: user.id,
        enabled: false,
        automationMode: "MANUAL",
        scanIntervalMinutes: 30,
        minOpportunityScore: 70,
        minDiscount: 15,
        maxOffersPerDay: 20,
        maxOpportunitiesPerCycle: 5,
        maxProductsPerCycle: 10,
        minPublicationInterval: 60,
      },
    }).catch(() => {});

    const newUserPayload = {
      userId: user.id,
      email: user.email,
      name: user.name,
      role: user.role as "USER" | "ADMIN" | "SUPERADMIN",
      status: user.status,
      avatar: user.avatar,
    };

    // 5. Auto log-in after registration
    await setSessionCookie(newUserPayload, false);

    return NextResponse.json({
      success: true,
      message: "Conta criada com sucesso!",
      user: newUserPayload,
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
