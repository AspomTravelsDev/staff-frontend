import { redirect } from "next/navigation";
import { getPublicApplication } from "@/lib/api/hr";

export default async function ApplicantLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  // Validate UUID format (basic check)
  if (!id || id.length !== 36) {
    redirect("/");
  }

  try {
    // Verify application exists
    await getPublicApplication(id);
  } catch (error) {
    console.error("Application validation error:", error);
    redirect("/");
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-blue-50 to-indigo-100 dark:from-slate-900 dark:to-indigo-950/20 text-foreground">
      {/* Header */}
      <header className="border-b bg-white dark:bg-card shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-center">
            <h1 className="text-xl font-bold">Aspom HR Onboarding</h1>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="mx-auto max-w-2xl">{children}</div>
      </main>

    </div>
  );
}
