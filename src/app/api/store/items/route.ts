import { NextResponse } from "next/server";
import { SEED_ITEMS, backendFetch } from "@/lib/backend";

export async function GET() {
  try {
    let res = await backendFetch("/items?available=true");
    if (!res.ok) {
      return NextResponse.json(
        { error: "API indisponível" },
        { status: 502 }
      );
    }
    let data = await res.json();
    let items = data.items || [];

    if (items.length === 0) {
      for (const seed of SEED_ITEMS) {
        await backendFetch(
          "/items",
          { method: "POST", body: JSON.stringify(seed) },
          "ADMIN"
        );
      }
      res = await backendFetch("/items?available=true");
      data = await res.json();
      items = data.items || [];
    }

    return NextResponse.json({ items });
  } catch {
    return NextResponse.json(
      { error: "Não foi possível carregar o cardápio. Suba a API local." },
      { status: 502 }
    );
  }
}
