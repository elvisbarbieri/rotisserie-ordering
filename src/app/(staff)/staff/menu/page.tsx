"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { Item, client, formatMoney } from "@/lib/api";
import { ItemImage } from "@/components/store/ItemImage";

const emptyForm = {
  name: "",
  description: "",
  price: "",
  category: "FRANGO",
  available: true,
  imageUrl: "",
};

export default function MenuPage() {
  const [items, setItems] = useState<Item[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setItems(await client.listItems(false));
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao listar itens");
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    const priceCents = Math.round(parseFloat(form.price.replace(",", ".")) * 100);
    if (!form.name || Number.isNaN(priceCents)) {
      setError("Nome e preço válidos são obrigatórios");
      return;
    }
    try {
      const body = {
        name: form.name,
        description: form.description,
        priceCents,
        category: form.category,
        available: form.available,
        imageUrl: form.imageUrl.trim() || null,
      };
      if (editingId) {
        await client.patchItem(editingId, body);
      } else {
        await client.createItem(body);
      }
      setForm(emptyForm);
      setEditingId(null);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao salvar");
    }
  }

  function startEdit(item: Item) {
    setEditingId(item.id);
    setForm({
      name: item.name,
      description: item.description,
      price: (item.priceCents / 100).toFixed(2),
      category: item.category,
      available: item.available,
      imageUrl: item.imageUrl || "",
    });
  }

  async function remove(id: string) {
    if (!confirm("Remover este item?")) return;
    await client.deleteItem(id);
    await load();
  }

  async function toggleAvailable(item: Item) {
    await client.patchItem(item.id, { available: !item.available });
    await load();
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_1.2fr]">
      <section>
        <h1 className="mb-1 font-display text-3xl">Cardápio</h1>
        <p className="mb-4 text-[var(--muted)]">
          Cadastre e edite itens — inclua a URL da imagem.
        </p>
        {error && (
          <p className="mb-3 rounded-md bg-red-50 px-3 py-2 text-sm text-red-800">
            {error}
          </p>
        )}
        <form
          onSubmit={onSubmit}
          className="space-y-3 rounded-xl border border-[var(--line)] bg-[var(--bone)] p-4"
        >
          <h2 className="text-lg">{editingId ? "Editar item" : "Novo item"}</h2>
          <input
            className="w-full rounded-md border border-[var(--line)] px-3 py-2"
            placeholder="Nome"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
          <textarea
            className="w-full rounded-md border border-[var(--line)] px-3 py-2"
            placeholder="Descrição"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
          <input
            className="w-full rounded-md border border-[var(--line)] px-3 py-2"
            placeholder="URL da imagem (https://...)"
            value={form.imageUrl}
            onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
          />
          {form.imageUrl.trim() && (
            <ItemImage
              src={form.imageUrl.trim()}
              alt="Prévia"
              className="h-28 w-full rounded-md"
            />
          )}
          <div className="grid grid-cols-2 gap-3">
            <input
              className="rounded-md border border-[var(--line)] px-3 py-2"
              placeholder="Preço (ex: 18.90)"
              value={form.price}
              onChange={(e) => setForm({ ...form, price: e.target.value })}
            />
            <input
              className="rounded-md border border-[var(--line)] px-3 py-2"
              placeholder="Categoria"
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
            />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.available}
              onChange={(e) =>
                setForm({ ...form, available: e.target.checked })
              }
            />
            Disponível
          </label>
          <div className="flex gap-2">
            <button
              type="submit"
              className="rounded-md bg-[var(--flame)] px-4 py-2 text-white"
            >
              {editingId ? "Salvar" : "Adicionar"}
            </button>
            {editingId && (
              <button
                type="button"
                className="rounded-md border px-4 py-2"
                onClick={() => {
                  setEditingId(null);
                  setForm(emptyForm);
                }}
              >
                Cancelar
              </button>
            )}
          </div>
        </form>
      </section>

      <section className="space-y-3">
        {items.map((item) => (
          <article
            key={item.id}
            className="flex flex-wrap items-start gap-3 rounded-lg border border-[var(--line)] bg-white/70 p-4"
          >
            <ItemImage
              src={item.imageUrl}
              alt={item.name}
              className="h-16 w-16 shrink-0 rounded-md"
            />
            <div className="min-w-0 flex-1">
              <h3 className="text-lg font-semibold">{item.name}</h3>
              <p className="text-sm text-[var(--muted)]">{item.description}</p>
              <p className="mt-1 text-sm">
                {item.category} · {formatMoney(item.priceCents)} ·{" "}
                <span
                  className={
                    item.available ? "text-[var(--ok)]" : "text-red-700"
                  }
                >
                  {item.available ? "disponível" : "indisponível"}
                </span>
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                className="rounded border px-3 py-1 text-sm"
                onClick={() => startEdit(item)}
              >
                Editar
              </button>
              <button
                type="button"
                className="rounded border px-3 py-1 text-sm"
                onClick={() => void toggleAvailable(item)}
              >
                {item.available ? "Pausar" : "Ativar"}
              </button>
              <button
                type="button"
                className="rounded border border-red-200 px-3 py-1 text-sm text-red-800"
                onClick={() => void remove(item.id)}
              >
                Remover
              </button>
            </div>
          </article>
        ))}
      </section>
    </div>
  );
}
