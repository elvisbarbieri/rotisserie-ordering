import { NextResponse } from "next/server";
import { backendFetch } from "@/lib/backend";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (!body?.customerName?.trim() || !body?.customerPhone?.trim()) {
      return NextResponse.json(
        { error: "Nome e telefone são obrigatórios" },
        { status: 400 }
      );
    }
    if (!Array.isArray(body.lines) || body.lines.length === 0) {
      return NextResponse.json(
        { error: "Carrinho vazio" },
        { status: 400 }
      );
    }

    const isDelivery = body.fulfillment === "DELIVERY";
    if (isDelivery) {
      const street = String(body.deliveryStreet || "").trim();
      const number = String(body.deliveryNumber || "").trim();
      if (!street || !number) {
        return NextResponse.json(
          { error: "Rua e número são obrigatórios para entrega" },
          { status: 400 }
        );
      }
    }

    const payload = {
      customerName: String(body.customerName).trim(),
      customerPhone: String(body.customerPhone).trim(),
      fulfillment: isDelivery ? "DELIVERY" : "PICKUP",
      customerNotes: body.customerNotes
        ? String(body.customerNotes).trim()
        : null,
      deliveryStreet: isDelivery
        ? String(body.deliveryStreet).trim()
        : null,
      deliveryNumber: isDelivery
        ? String(body.deliveryNumber).trim()
        : null,
      paymentMethod: "CASH",
      sendNow: true,
      lines: body.lines.map(
        (l: { itemId: string; qty: number; notes?: string | null }) => ({
          itemId: l.itemId,
          qty: l.qty,
          notes: l.notes || null,
        })
      ),
    };

    const res = await backendFetch("/orders", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) {
      return NextResponse.json(
        { error: data?.error?.message || "Falha ao criar pedido" },
        { status: res.status }
      );
    }
    return NextResponse.json(data, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "API indisponível. Suba o backend local." },
      { status: 502 }
    );
  }
}
