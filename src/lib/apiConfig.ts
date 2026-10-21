/** Shared API Gateway / rotisserie-backend config. */

export const API_BASE =
  (typeof process !== "undefined" &&
    (process.env.API_BASE_URL || process.env.NEXT_PUBLIC_API_BASE_URL)
      ?.replace(/\/$/, "")) ||
  "http://localhost:8080/v1";

export function resolveApiKey(): string {
  return (
    process.env.API_KEY ||
    process.env.NEXT_PUBLIC_API_KEY ||
    ""
  );
}

export function resolveDefaultRole(): string {
  return (
    process.env.API_ROLE ||
    process.env.NEXT_PUBLIC_API_ROLE ||
    "ADMIN"
  );
}

export function extractToken(data: Record<string, unknown>): string | null {
  const candidates = [
    data.token,
    data.accessToken,
    data.idToken,
    data.jwt,
    (data as { AuthenticationResult?: { AccessToken?: string } })
      .AuthenticationResult?.AccessToken,
  ];
  for (const value of candidates) {
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return null;
}
