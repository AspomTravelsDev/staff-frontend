import type { Metadata } from "next";
import { ThemeSwitcher } from "@/components/icons/theme-switcher";

export const metadata: Metadata = {
  manifest: null,
  appleWebApp: null,
  icons: { icon: "/payment-icon.svg", apple: [] },
};

export default function PaymentLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-svh bg-background text-foreground">
      <header className="border-b border-border/40 bg-background">
        <div className="flex h-14 items-center justify-between px-4 sm:px-6">
          <span className="text-lg font-semibold">Payments</span>
          <ThemeSwitcher />
        </div>
      </header>
      <main className="px-4 py-8 sm:py-10">{children}</main>
    </div>
  );
}
