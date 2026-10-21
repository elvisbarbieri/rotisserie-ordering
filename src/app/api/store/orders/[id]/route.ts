import { NextResponse } from "next/server";
import { backendFetch } from "@/lib/backend";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const res = await backendFetch(`/orders/${id}`);
    const data = await res.json();
    if (!res.ok) {
      return NextResponse.json(
        { error: data?.error?.message || "Pedido não encontrado" },
        { status: res.status }
      );
    }
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: "API indisponível" }, { status: 502 });
  }
}
