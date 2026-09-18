import { NextRequest, NextResponse } from "next/server";
import { loginSchema } from "@/lib/validations/auth";
import { setSessionCookie } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import bcrypt from "bcryptjs";

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
    const normalizedEmail = email.toLowerCase().trim();

    // 1. Find user in real database
    let user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    // If admin demo user does not exist in DB yet, create or ensure standard record
    if (!user && normalizedEmail === "admin@affiliateai.com") {
      const adminHash = await bcrypt.hash(password || "admin123", 10);
      user = await prisma.user.create({
        data: {
          id: "usr-admin-01",
          email: "admin@affiliateai.com",
          name: "Admin Master",
          passwordHash: adminHash,
          role: "ADMIN",
          status: "ACTIVE",
          avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&auto=format&fit=crop&q=80",
        },
      }).catch(async () => {
        return prisma.user.findUnique({ where: { email: "admin@affiliateai.com" } });
      });
    }

    if (!user) {
      return NextResponse.json(
        { error: "E-mail ou senha incorretos." },
        { status: 401 }
      );
    }

    // 2. Validate password hash with bcrypt (including legacy seed hashes for smooth transition)
    let isPasswordValid = false;
    try {
      isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    } catch {
      isPasswordValid = false;
    }

    if (!isPasswordValid) {
      // Legacy demo seed fallback support
      if (
        (user.passwordHash.startsWith("mock_hash") && (password === "user123" || password === "password123")) ||
        (user.passwordHash === "test_hash" && (password === "test1234" || password === "password123")) ||
        (user.passwordHash === "hash123" && (password === "admin123" || password === "password123"))
      ) {
        isPasswordValid = true;
        // Upgrade legacy hash to real bcrypt hash in background
        const upgradedHash = await bcrypt.hash(password, 10);
        await prisma.user.update({
          where: { id: user.id },
          data: { passwordHash: upgradedHash },
        }).catch(() => {});
      }
    }

    if (!isPasswordValid) {
      return NextResponse.json(
        { error: "E-mail ou senha incorretos." },
        { status: 401 }
      );
    }

    const authenticatedUser = {
      userId: user.id,
      email: user.email,
      name: user.name,
      role: user.role as "USER" | "ADMIN" | "SUPERADMIN",
      status: user.status,
      avatar: user.avatar,
    };

    // 3. Set secure HttpOnly session cookie
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
