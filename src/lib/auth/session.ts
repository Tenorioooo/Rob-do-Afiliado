import { cookies } from "next/headers";
import { signToken, verifyToken, TokenPayload } from "./jwt";

export const SESSION_COOKIE_NAME = "affiliate_ai_session";

export async function setSessionCookie(payload: TokenPayload, rememberMe: boolean = false) {
  const expiresIn = rememberMe ? "30d" : "7d";
  const maxAge = rememberMe ? 30 * 24 * 60 * 60 : 7 * 24 * 60 * 60;
  const token = await signToken(payload, expiresIn);

  cookies().set({
    name: SESSION_COOKIE_NAME,
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge,
  });

  return token;
}

export async function getSession(): Promise<TokenPayload | null> {
  const cookie = cookies().get(SESSION_COOKIE_NAME);
  if (!cookie?.value) return null;
  return await verifyToken(cookie.value);
}

export async function clearSessionCookie() {
  cookies().set({
    name: SESSION_COOKIE_NAME,
    value: "",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}
