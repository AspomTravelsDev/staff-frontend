import Link from "next/link";
import { ThemeSwitcher } from "@/components/icons/theme-switcher";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="bg-background min-h-screen w-full">
      {/* Header */}
      <header className="border-border/40 sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
        <div className="flex h-14 items-center justify-between px-4">
          <Link href="#" className="flex items-center gap-2">
            {/* <AspomLogo className="size-8" /> */}
            <span className="text-lg font-semibold">Aspom Travels</span>
          </Link>
          <div className="flex items-center gap-2">
            <ThemeSwitcher />
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="px-4 py-8">{children}</main>

      {/* Footer */}
      <footer className="border-border/40 mt-auto border-t py-6">
        <div className="px-4">
          <div className="text-muted-foreground flex flex-col items-center justify-between gap-4 text-sm md:flex-row">
            <p>
              © {new Date().getFullYear()} Aspom Travels. All rights reserved.
            </p>
            <div className="flex gap-4">
              <Link
                href="/privacy"
                className="hover:text-foreground transition-colors"
              >
                Privacy Policy
              </Link>
              <Link
                href="/terms"
                className="hover:text-foreground transition-colors"
              >
                Terms of Service
              </Link>
              <Link
                href="/contact"
                className="hover:text-foreground transition-colors"
              >
                Contact Us
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
