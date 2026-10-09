import { timingSafeEqual } from "node:crypto";

export function isAuthorizedServiceRequest(authorization: string | undefined, secret: string | undefined): boolean {
  if (!authorization || !secret) return false;
  const [scheme, token, ...extra] = authorization.split(" ");
  if (scheme !== "Bearer" || !token || extra.length > 0) return false;
  const provided = Buffer.from(token);
  const expected = Buffer.from(secret);
  return provided.length === expected.length && timingSafeEqual(provided, expected);
}
