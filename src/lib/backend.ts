/**
 * Server-side calls to rotisserie-backend (contract: …/contract.md).
 * Base must be `{host}/v1` — never `/api/store` (that prefix is Next-only).
 *
 * With auth enabled, API Gateway expects:
 *   x-api-key + Authorization: Bearer <jwt> + X-Role
 */
import {
  API_BASE,
  extractToken,
  resolveApiKey,
  resolveDefaultRole,
} from "@/lib/apiConfig";

const API_KEY = resolveApiKey();

/** Cached service JWT from POST /auth/login (or /auth/session). */
let cachedBearer: { token: string; expiresAt: number } | null = null;

function logBackendCurlEnabled(): boolean {
  const v = (process.env.LOG_BACKEND_CURL || "").toLowerCase();
  return v === "1" || v === "true" || v === "yes";
}

function shellQuote(value: string): string {
  return `'${value.replace(/'/g, `'\\''`)}'`;
}

function formatBackendCurl(
  url: string,
  method: string,
  headers: Headers,
  body: BodyInit | null | undefined
): string {
  const parts = [`curl -s -X ${method}`, shellQuote(url)];
  headers.forEach((value, key) => {
    parts.push(`-H ${shellQuote(`${key}: ${value}`)}`);
  });
  if (body != null && method !== "GET" && method !== "HEAD") {
    const payload =
      typeof body === "string" ? body : JSON.stringify(body);
    parts.push(`-d ${shellQuote(payload)}`);
  }
  return parts.join(" \\\n  ");
}

async function loginForBearer(): Promise<string | null> {
  const username =
    process.env.API_USERNAME || process.env.STAFF_USERNAME || "admin";
  const password =
    process.env.API_PASSWORD || process.env.STAFF_PASSWORD || "admin321";

  const headers: HeadersInit = { "Content-Type": "application/json" };
  if (API_KEY) headers["x-api-key"] = API_KEY;

  // Prefer /auth/login; some deployments also accept POST /auth/session with body.
  for (const path of ["/auth/login", "/auth/session"]) {
    try {
      const res = await fetch(`${API_BASE}${path}`, {
        method: "POST",
        headers,
        body: JSON.stringify({ username, password }),
      });
      if (!res.ok) continue;
      const data = (await res.json().catch(() => ({}))) as Record<
        string,
        unknown
      >;
      const token = extractToken(data);
      if (token) return token;
    } catch {
      /* try next */
    }
  }
  return null;
}

/**
 * Resolve Authorization Bearer for server → API calls.
 * 1) API_BEARER_TOKEN env
 * 2) login with API_USERNAME / API_PASSWORD
 * 3) fallback non-empty Bearer (API accepts Bearer + X-Role when JWT claims are absent)
 */
async function resolveBearerToken(): Promise<string> {
  const fromEnv = process.env.API_BEARER_TOKEN?.trim();
  if (fromEnv) return fromEnv;

  if (cachedBearer && Date.now() < cachedBearer.expiresAt) {
    return cachedBearer.token;
  }

  const fromLogin = await loginForBearer();
  if (fromLogin) {
    cachedBearer = {
      token: fromLogin,
      expiresAt: Date.now() + 10 * 60 * 60 * 1000,
    };
    return fromLogin;
  }

  return process.env.API_BEARER_FALLBACK?.trim() || "staff";
}

export async function backendFetch(
  path: string,
  init: RequestInit = {},
  role = "CASHIER"
): Promise<Response> {
  const headers = new Headers(init.headers);
  headers.set("Content-Type", "application/json");
  headers.set("X-Role", role || resolveDefaultRole());
  if (API_KEY) headers.set("x-api-key", API_KEY);

  const bearer = await resolveBearerToken();
  headers.set("Authorization", `Bearer ${bearer}`);

  const url = `${API_BASE}${path}`;
  const method = (init.method || "GET").toUpperCase();

  if (logBackendCurlEnabled()) {
    console.log(
      `[backend] ${method} ${path}\n${formatBackendCurl(url, method, headers, init.body)}`
    );
  }

  const res = await fetch(url, { ...init, headers });

  // One retry on 401 with a fresh login (drop cache).
  if (res.status === 401 && !process.env.API_BEARER_TOKEN) {
    cachedBearer = null;
    const retryBearer = await resolveBearerToken();
    headers.set("Authorization", `Bearer ${retryBearer}`);
    if (logBackendCurlEnabled()) {
      console.log(`[backend] retry after 401 ${method} ${path}`);
    }
    const retry = await fetch(url, { ...init, headers });
    if (logBackendCurlEnabled()) {
      console.log(`[backend] ← ${retry.status} ${method} ${path}`);
    }
    return retry;
  }

  if (logBackendCurlEnabled()) {
    console.log(`[backend] ← ${res.status} ${method} ${path}`);
  }

  return res;
}

export const SEED_ITEMS = [
  {
    name: "Frango inteiro",
    description: "Assado no espeto, crocante por fora e suculento por dentro.",
    priceCents: 5490,
    category: "FRANGO",
    available: true,
    imageUrl:
      "https://images.unsplash.com/photo-1598103442097-8b74394b95c6?auto=format&fit=crop&w=800&q=80",
  },
  {
    name: "Meio frango",
    description: "Metade do frango para uma refeição generosa.",
    priceCents: 2990,
    category: "FRANGO",
    available: true,
    imageUrl:
      "https://images.unsplash.com/photo-1532550907401-a532f99bcecc?auto=format&fit=crop&w=800&q=80",
  },
  {
    name: "Coxa e sobrecoxa (2un)",
    description: "Peças selecionadas, tempero da casa.",
    priceCents: 1890,
    category: "FRANGO",
    available: true,
    imageUrl:
      "https://images.unsplash.com/photo-1604503468506-a8da13d82791?auto=format&fit=crop&w=800&q=80",
  },
  {
    name: "Costela BBQ",
    description: "Costela assada, molho da casa.",
    priceCents: 6990,
    category: "COSTELA",
    available: true,
    imageUrl: "/home/icon-costela.jpeg",
  },
  {
    name: "Porco assado",
    description: "Porção generosa, crosta crocante.",
    priceCents: 5990,
    category: "PORCO",
    available: true,
    imageUrl: "/home/icon-porco.jpeg",
  },
  {
    name: "Batata rústica",
    description: "Porção crocante com alecrim.",
    priceCents: 1490,
    category: "ACOMPANHAMENTOS",
    available: true,
    imageUrl:
      "https://images.unsplash.com/photo-1518013431117-eb1465fa5752?auto=format&fit=crop&w=800&q=80",
  },
  {
    name: "Farofa da casa",
    description: "Crocante, com bacon e cebola.",
    priceCents: 990,
    category: "ACOMPANHAMENTOS",
    available: true,
    imageUrl:
      "https://images.unsplash.com/photo-1604908177453-7462950a6a3b?auto=format&fit=crop&w=800&q=80",
  },
  {
    name: "Salada verde",
    description: "Mix fresco com molho cítrico.",
    priceCents: 1290,
    category: "ACOMPANHAMENTOS",
    available: true,
    imageUrl:
      "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=800&q=80",
  },
];
