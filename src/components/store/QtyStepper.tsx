"use client";

type QtyStepperProps = {
  qty: number;
  onIncrement: () => void;
  onDecrement: () => void;
  size?: "md" | "lg";
};

export function QtyStepper({
  qty,
  onIncrement,
  onDecrement,
  size = "md",
}: QtyStepperProps) {
  const box =
    size === "lg"
      ? "h-11 w-11 text-lg"
      : "h-10 w-10 text-base";

  return (
    <div className="flex items-center gap-2">
      {qty > 0 && (
        <button
          type="button"
          aria-label="Remover um"
          onClick={onDecrement}
          className={`flex ${box} items-center justify-center rounded-md bg-white font-semibold text-[var(--ink)] ring-1 ring-[var(--line)] transition active:scale-95`}
        >
          −
        </button>
      )}
      {qty > 0 && (
        <span className="min-w-6 text-center font-semibold tabular-nums text-[var(--ink)]">
          {qty}
        </span>
      )}
      <button
        type="button"
        aria-label="Adicionar um"
        onClick={onIncrement}
        className={`flex ${box} items-center justify-center rounded-md bg-[var(--flame)] font-semibold text-white transition hover:bg-[var(--flame-deep)] active:scale-95`}
      >
        +
      </button>
    </div>
  );
}
