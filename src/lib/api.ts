import {
  API_BASE,
  resolveApiKey,
  resolveDefaultRole,
} from "@/lib/apiConfig";

/** Shapes aligned with rotisserie-backend/contract.md */
export type Item = {
  id: string;
  name: string;
  description: string;
  priceCents: number;
  category: string;
  available: boolean;
  imageUrl?: string | null;
  createdAt: string;
  updatedAt: string;
  deleted?: boolean;
};

export type OrderLine = {
  itemId: string;
  name: string;
  qty: number;
  unitPriceCents: number;
  notes: string | null;
  lineTotalCents: number;
};

export type OrderStatus =
  | "DRAFT"
  | "SENT"
  | "IN_PROGRESS"
  | "READY"
  | "COMPLETED"
  | "CANCELLED";

export type PrintStatus =
  | "NONE"
  | "QUEUED"
  | "CLAIMED"
  | "PRINTED"
  | "FAILED";

export type Fulfillment = "PICKUP" | "DELIVERY";

export type PaymentMethod = "CASH" | "CARD" | "OTHER";

export type Order = {
  id: string;
  status: OrderStatus | string;
  printStatus: PrintStatus | string;
  customerName: string | null;
  customerPhone?: string | null;
  fulfillment?: Fulfillment | string;
  customerNotes?: string | null;
  deliveryStreet?: string | null;
  deliveryNumber?: string | null;
  deliveryFeeCents?: number;
  paymentMethod: PaymentMethod | string;
  lines: OrderLine[];
  totalCents: number;
  createdAt: string;
  sentAt: string | null;
  printJobId: string | null;
};

export type CartLine = {
  itemId: string;
  name: string;
  qty: number;
  unitPriceCents: number;
  notes: string;
  imageUrl?: string | null;
};

export type SalesPeriod = "today" | "yesterday" | "week" | "month";

export type SalesReport = {
  period: string;
  from: string | null;
  to: string | null;
  timezone: string;
  kpis: {
    grossSalesCents: number;
    orderCount: number;
    averageTicketCents: number;
    cancelledCount: number;
    cancelRate: number;
    deliveryFeeCents: number;
  };
  byPayment: { key: string; orderCount: number; totalCents: number }[];
  byFulfillment: { key: string; orderCount: number; totalCents: number }[];
  byStatus: { key: string; orderCount: number; totalCents: number }[];
  seriesMode: "hour" | "day" | string;
  series: {
    bucket: string;
    label: string;
    orderCount: number;
    totalCents: number;
  }[];
  topItems: {
    itemId: string;
    name: string;
    qty: number;
    revenueCents: number;
  }[];
  recentOrders: {
    id: string;
    status: string;
    customerName: string | null;
    fulfillment?: string | null;
    paymentMethod: string;
    totalCents: number;
    createdAt: string;
    sentAt: string | null;
    linesSummary: string;
  }[];
};

const API_KEY = resolveApiKey();

function roleHeader(): string {
  if (typeof window === "undefined") return resolveDefaultRole();
  return localStorage.getItem("rotisserie_role") || resolveDefaultRole();
}

function bearerToken(): string | null {
  if (typeof window !== "undefined") {
    const fromStorage = localStorage.getItem("rotisserie_token");
    if (fromStorage) return fromStorage;
  }
  // Optional shared bearer for client calls before/without staff login UI.
  return process.env.NEXT_PUBLIC_API_BEARER_TOKEN || null;
}

async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  headers.set("Content-Type", "application/json");
  // Auth on: Bearer JWT required; X-Role used when JWT claims are absent.
  headers.set("X-Role", roleHeader());
  if (API_KEY) headers.set("x-api-key", API_KEY);
  const token = bearerToken();
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  } else {
    // Non-empty Bearer required by API when auth is enabled (with X-Role fallback).
    headers.set("Authorization", "Bearer staff");
  }

  const res = await fetch(`${API_BASE}${path}`, { ...init, headers });
  // Contract: 204 = success with no JSON body (DELETE item, empty claim).
  if (res.status === 204) return undefined as T;
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = data?.error?.message || res.statusText;
    throw new Error(msg);
  }
  return data as T;
}

export const client = {
  listItems: (availableOnly = false) =>
    api<{ items: Item[] }>(
      `/items${availableOnly ? "?available=true" : ""}`
    ).then((r) => r.items),
  createItem: (
    body: Partial<Item> & { name: string; priceCents: number; category: string }
  ) => api<Item>("/items", { method: "POST", body: JSON.stringify(body) }),
  patchItem: (id: string, body: Partial<Item>) =>
    api<Item>(`/items/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
  deleteItem: (id: string) =>
    api<void>(`/items/${id}`, { method: "DELETE" }),
  listOrders: (status?: string) =>
    api<{ orders: Order[] }>(
      `/orders${status ? `?status=${encodeURIComponent(status)}` : ""}`
    ).then((r) => r.orders),
  createOrder: (body: {
    customerName?: string;
    customerPhone?: string;
    fulfillment?: Fulfillment | string;
    customerNotes?: string;
    deliveryStreet?: string;
    deliveryNumber?: string;
    paymentMethod?: PaymentMethod | string;
    sendNow?: boolean;
    lines: { itemId: string; qty: number; notes?: string | null }[];
  }) => api<Order>("/orders", { method: "POST", body: JSON.stringify(body) }),
  patchOrder: (
    id: string,
    body: {
      customerName?: string | null;
      customerPhone?: string | null;
      fulfillment?: Fulfillment | string;
      customerNotes?: string | null;
      deliveryStreet?: string | null;
      deliveryNumber?: string | null;
      paymentMethod?: PaymentMethod | string;
      lines?: { itemId: string; qty: number; notes?: string | null }[];
    }
  ) =>
    api<Order>(`/orders/${id}`, {
      method: "PATCH",
      body: JSON.stringify(body),
    }),
  getOrder: (id: string) => api<Order>(`/orders/${id}`),
  sendOrder: (id: string) =>
    api<Order>(`/orders/${id}/send`, { method: "POST", body: "{}" }),
  updateStatus: (id: string, status: "IN_PROGRESS" | "READY" | "COMPLETED") =>
    api<Order>(`/orders/${id}/status`, {
      method: "POST",
      body: JSON.stringify({ status }),
    }),
  cancelOrder: (id: string) =>
    api<Order>(`/orders/${id}/cancel`, { method: "POST", body: "{}" }),
  salesReport: (period: SalesPeriod = "today") =>
    api<SalesReport>(
      `/reports/sales?period=${encodeURIComponent(period)}`
    ),
};

/** Browser-facing store API via Next.js BFF (no staff role needed in browser). */
export const storeApi = {
  listItems: async () => {
    const res = await fetch("/api/store/items");
    const data = await res.json();
    if (!res.ok) throw new Error(data?.error || "Falha ao carregar cardápio");
    return data.items as Item[];
  },
  placeOrder: async (body: {
    customerName: string;
    customerPhone: string;
    fulfillment: "PICKUP" | "DELIVERY";
    customerNotes?: string;
    deliveryStreet?: string;
    deliveryNumber?: string;
    lines: { itemId: string; qty: number; notes?: string | null }[];
  }) => {
    const res = await fetch("/api/store/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data?.error || "Falha ao enviar pedido");
    return data as Order;
  },
  getOrder: async (id: string) => {
    const res = await fetch(`/api/store/orders/${id}`);
    const data = await res.json();
    if (!res.ok) throw new Error(data?.error || "Pedido não encontrado");
    return data as Order;
  },
};

export function formatMoney(cents: number): string {
  return (cents / 100).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}
