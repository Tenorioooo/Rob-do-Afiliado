import { SignJWT, jwtVerify } from "jose";

const JWT_SECRET = process.env.JWT_SECRET || "affiliate_ai_super_secure_jwt_secret_change_in_production_2026";
const key = new TextEncoder().encode(JWT_SECRET);

export interface TokenPayload {
  userId: string;
  email: string;
  name: string;
  role: "USER" | "ADMIN" | "SUPERADMIN";
  status: string;
  avatar?: string | null;
  [key: string]: unknown;
}

export async function signToken(payload: TokenPayload, expiresIn: string = "7d"): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(expiresIn)
    .sign(key);
}

export async function verifyToken(token: string): Promise<TokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, key);
    return payload as unknown as TokenPayload;
  } catch (err) {
    return null;
  }
}
