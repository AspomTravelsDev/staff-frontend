import { AspomLogo } from "@/components/icons/aspom-logo";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-muted/40 p-4">
      <div className="mb-8 flex flex-col items-center gap-2">
        <AspomLogo className="h-12 w-auto" />
        <span className="text-xl font-semibold">ASPOM</span>
      </div>
      <div className="w-full max-w-md">{children}</div>
    </div>
  );
}
