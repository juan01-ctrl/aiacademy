import { createHash, createHmac, timingSafeEqual } from "node:crypto";

export const SESSION_COOKIE = "academy_session";

export type Session = {
  learnerId: string;
  email: string;
  name: string;
};

function secret(): string {
  const value = process.env.AUTH_SECRET;
  if (value) return value;
  if (process.env.NODE_ENV === "production") throw new Error("AUTH_SECRET is required in production");
  return "local-dev-auth-secret";
}

export function learnerIdFromEmail(email: string): string {
  return createHash("sha256").update(email.trim().toLowerCase()).digest("hex").slice(0, 24);
}

export function signSession(session: Session): string {
  const body = Buffer.from(JSON.stringify(session)).toString("base64url");
  const signature = createHmac("sha256", secret()).update(body).digest("base64url");
  return `${body}.${signature}`;
}

export function readSessionToken(token: string | undefined): Session | null {
  if (!token) return null;
  const [body, signature] = token.split(".");
  if (!body || !signature) return null;
  const expected = createHmac("sha256", secret()).update(body).digest("base64url");
  const actual = Buffer.from(signature);
  const control = Buffer.from(expected);
  if (actual.length !== control.length || !timingSafeEqual(actual, control)) return null;
  const parsed = JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as Session;
  if (!parsed.learnerId || !parsed.email) return null;
  return parsed;
}
