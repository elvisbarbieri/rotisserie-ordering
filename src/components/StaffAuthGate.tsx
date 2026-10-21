"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  clearStaffSession,
  getStaffToken,
  saveStaffSession,
  staffLogin,
  staffSession,
} from "@/lib/staffAuth";

type GateState = "checking" | "login" | "ready";

export function StaffAuthGate({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [state, setState] = useState<GateState>("checking");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function boot() {
      const token = getStaffToken();
      if (!token) {
        if (!cancelled) setState("login");
        return;
      }
      try {
        await staffSession(token);
        if (!cancelled) setState("ready");
      } catch {
        clearStaffSession();
        if (!cancelled) setState("login");
      }
    }
    void boot();
    return () => {
      cancelled = true;
    };
  }, []);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const session = await staffLogin(username, password);
      saveStaffSession(session);
      setState("ready");
    } catch {
      clearStaffSession();
      router.replace("/");
    } finally {
      setBusy(false);
    }
  }

  if (state === "checking") {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-[var(--ash)] text-sm text-[var(--muted)]">
        Verificando acesso…
      </div>
    );
  }

  if (state === "login") {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--smoke)]/70 p-4 backdrop-blur-sm">
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="staff-login-title"
          className="w-full max-w-sm rounded-lg border border-[var(--line)] bg-[var(--bone)] p-6 shadow-xl"
        >
          <h2
            id="staff-login-title"
            className="font-display text-2xl font-extrabold text-[var(--ink)]"
          >
            Acesso da equipe
          </h2>
          <p className="mt-1 text-sm text-[var(--muted)]">
            Entre com usuário e senha para abrir o balcão.
          </p>
          <form className="mt-5 space-y-3" onSubmit={onSubmit}>
            <label className="block text-sm font-medium text-[var(--ink-soft)]">
              Usuário
              <input
                autoFocus
                autoComplete="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="mt-1 w-full rounded-md border border-[var(--line)] bg-white px-3 py-2 text-[var(--ink)] outline-none focus:border-[var(--flame)]"
                required
              />
            </label>
            <label className="block text-sm font-medium text-[var(--ink-soft)]">
              Senha
              <input
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 w-full rounded-md border border-[var(--line)] bg-white px-3 py-2 text-[var(--ink)] outline-none focus:border-[var(--flame)]"
                required
              />
            </label>
            <button
              type="submit"
              disabled={busy}
              className="mt-2 w-full rounded-md bg-[var(--flame)] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[var(--flame-deep)] disabled:opacity-60"
            >
              {busy ? "Entrando…" : "Entrar"}
            </button>
            <button
              type="button"
              onClick={() => router.replace("/")}
              className="w-full rounded-md px-4 py-2 text-sm text-[var(--muted)] underline"
            >
              Voltar à loja
            </button>
          </form>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
