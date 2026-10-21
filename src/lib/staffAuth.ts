import {
  API_BASE,
  extractToken,
  resolveApiKey,
  resolveDefaultRole,
} from "@/lib/apiConfig";

const TOKEN_KEY = "rotisserie_token";
const ROLE_KEY = "rotisserie_role";

const API_KEY = resolveApiKey();

function apiHeaders(extra?: HeadersInit): Headers {
  const headers = new Headers(extra);
  headers.set("Content-Type", "application/json");
  if (API_KEY) headers.set("x-api-key", API_KEY);
  return headers;
}

export type StaffSession = {
  token: string;
  username: string;
  role: string;
};

export function getStaffToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function clearStaffSession(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(ROLE_KEY);
}

export function saveStaffSession(session: StaffSession): void {
  localStorage.setItem(TOKEN_KEY, session.token);
  localStorage.setItem(ROLE_KEY, session.role || resolveDefaultRole());
}

/**
 * Obtain JWT via credentials.
 * Tries POST /auth/login then POST /auth/session (body login, if deployed).
 */
export async function staffLogin(
  username: string,
  password: string
): Promise<StaffSession> {
  const body = JSON.stringify({ username, password });
  let lastError = "Falha no login";

  for (const path of ["/auth/login", "/auth/session"]) {
    const res = await fetch(`${API_BASE}${path}`, {
      method: "POST",
      headers: apiHeaders(),
      body,
    });
    const data = (await res.json().catch(() => ({}))) as Record<
      string,
      unknown
    >;
    if (!res.ok) {
      lastError =
        (data?.error as { message?: string } | undefined)?.message ||
        lastError;
      continue;
    }
    const token = extractToken(data);
    if (!token) {
      lastError = "Token ausente na resposta de login";
      continue;
    }
    return {
      token,
      username:
        (typeof data.username === "string" && data.username) || username,
      role:
        (typeof data.role === "string" && data.role) || resolveDefaultRole(),
    };
  }

  throw new Error(lastError);
}

/** Confirm stored token with backend (`GET /auth/session`). */
export async function staffSession(
  token: string
): Promise<{ username: string; role: string }> {
  const res = await fetch(`${API_BASE}/auth/session`, {
    headers: apiHeaders({
      Authorization: `Bearer ${token}`,
      "X-Role":
        (typeof window !== "undefined" &&
          localStorage.getItem(ROLE_KEY)) ||
        resolveDefaultRole(),
    }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data?.error?.message || "Sessão inválida");
  }
  return {
    username: data.username as string,
    role: (data.role as string) || resolveDefaultRole(),
  };
}
