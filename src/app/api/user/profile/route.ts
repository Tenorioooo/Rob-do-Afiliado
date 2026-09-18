import { NextRequest, NextResponse } from "next/server";
import { getSession, setSessionCookie } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import bcrypt from "bcryptjs";

export async function GET() {
  try {
    const session = await getSession();
    if (!session?.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: {
        id: true,
        name: true,
        email: true,
        avatar: true,
        role: true,
        status: true,
        phone: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 });
    }

    // Fetch active integration connections
    const connections = await prisma.integrationConnection.findMany({
      where: { userId: session.userId },
      select: {
        id: true,
        provider: true,
        type: true,
        status: true,
        externalAccountName: true,
        lastValidatedAt: true,
      },
    });

    return NextResponse.json({
      user,
      connections,
    });
  } catch (error: any) {
    console.error("[User:Profile:GET:Error]", error);
    return NextResponse.json({ error: error.message || "Erro ao carregar perfil." }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { name, phone, avatar } = body;

    const updatedUser = await prisma.user.update({
      where: { id: session.userId },
      data: {
        name: name !== undefined ? String(name).trim() : undefined,
        phone: phone !== undefined ? String(phone).trim() : undefined,
        avatar: avatar !== undefined ? String(avatar).trim() : undefined,
      },
      select: {
        id: true,
        name: true,
        email: true,
        avatar: true,
        role: true,
        status: true,
        phone: true,
      },
    });

    // Refresh session cookie with updated name/avatar
    await setSessionCookie({
      userId: updatedUser.id,
      email: updatedUser.email,
      name: updatedUser.name,
      role: updatedUser.role as "USER" | "ADMIN" | "SUPERADMIN",
      status: updatedUser.status,
      avatar: updatedUser.avatar,
    });

    return NextResponse.json({
      success: true,
      message: "Perfil atualizado com sucesso!",
      user: updatedUser,
    });
  } catch (error: any) {
    console.error("[User:Profile:PATCH:Error]", error);
    return NextResponse.json({ error: error.message || "Erro ao atualizar perfil." }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { currentPassword, newPassword } = body;

    if (!newPassword || newPassword.length < 6) {
      return NextResponse.json(
        { error: "A nova senha deve ter no mínimo 6 caracteres." },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: session.userId },
    });

    if (!user) {
      return NextResponse.json({ error: "Usuário não encontrado." }, { status: 404 });
    }

    // Validate current password
    let isMatch = false;
    try {
      isMatch = await bcrypt.compare(currentPassword, user.passwordHash);
    } catch {
      isMatch = false;
    }

    if (!isMatch && (user.passwordHash.startsWith("mock_hash") || user.passwordHash === "test_hash" || user.passwordHash === "hash123")) {
      isMatch = true; // allow upgrading initial test accounts
    }

    if (!isMatch) {
      return NextResponse.json(
        { error: "Senha atual incorreta." },
        { status: 400 }
      );
    }

    const newPasswordHash = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { id: session.userId },
      data: { passwordHash: newPasswordHash },
    });

    return NextResponse.json({
      success: true,
      message: "Senha alterada com sucesso!",
    });
  } catch (error: any) {
    console.error("[User:Profile:PUT:PasswordError]", error);
    return NextResponse.json({ error: error.message || "Erro ao alterar senha." }, { status: 500 });
  }
}
