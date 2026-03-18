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
        <div className="mx-auto max-w-2xl space-y-4">
          <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-900/30 dark:bg-amber-900/10 dark:text-amber-200">
            <p className="font-medium">Best experience notice</p>
            <p>
              Please complete this onboarding form on a laptop/desktop browser
              for best results. Upload limits are 1MB for passport images and
              2MB for documents.
            </p>
          </div>
          {children}
        </div>
      </main>
    </div>
  );
}
