export type AuthMode = "sign-in" | "sign-up";

const defaultNextPath = "/learn/openai-api-fundamentals";

export function getSafeNextPath(path: string | undefined): string {
  if (!path || !path.startsWith("/") || path.startsWith("//") || path.includes("\\")) {
    return defaultNextPath;
  }
  return path;
}

export function getAuthMode(mode: string | undefined): AuthMode {
  return mode === "sign-up" ? "sign-up" : "sign-in";
}

export function getAuthPath(mode: AuthMode, nextPath?: string): string {
  const route = mode === "sign-up" ? "/auth/signup" : "/auth/signin";
  if (nextPath === undefined) return route;
  const safeNextPath = getSafeNextPath(nextPath);
  return safeNextPath === defaultNextPath && nextPath !== defaultNextPath
    ? route
    : `${route}?next=${encodeURIComponent(safeNextPath)}`;
}
