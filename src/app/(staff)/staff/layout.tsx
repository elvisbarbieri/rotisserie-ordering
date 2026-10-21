import { StaffNav } from "@/components/StaffNav";
import { StaffAuthGate } from "@/components/StaffAuthGate";

export default function StaffLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <StaffAuthGate>
      <div className="min-h-dvh bg-[var(--ash)]">
        <StaffNav />
        <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>
      </div>
    </StaffAuthGate>
  );
}
