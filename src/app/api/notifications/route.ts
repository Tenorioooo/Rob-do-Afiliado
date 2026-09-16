import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { NotificationService } from "@/services/notifications/notification-service";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const [notifications, unreadCount] = await Promise.all([
      NotificationService.listUserNotifications(session.userId, 25),
      NotificationService.getUnreadCount(session.userId),
    ]);

    return NextResponse.json({
      notifications,
      unreadCount,
    });
  } catch (error: unknown) {
    console.error("[API:Notifications:GET:Error]", error);
    return NextResponse.json({ error: "Erro ao buscar notificações" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    let notificationId: string | undefined;
    try {
      const body = await request.json();
      notificationId = body.notificationId;
    } catch {}

    await NotificationService.markAsRead(session.userId, notificationId);

    return NextResponse.json({
      success: true,
      message: "Notificações marcadas como lidas.",
    });
  } catch (error: unknown) {
    console.error("[API:Notifications:PATCH:Error]", error);
    return NextResponse.json({ error: "Erro ao atualizar notificações" }, { status: 500 });
  }
}
