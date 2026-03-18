import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function ApplicantPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <div className="space-y-6 rounded-lg border bg-card p-6 text-card-foreground shadow-sm">
      <div>
        <h2 className="text-2xl font-bold">Welcome to ASPOM Onboarding</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Please read this before you begin. You will complete 8 steps and
          upload your final signed documents at the end.
        </p>
      </div>

      <div className="space-y-3 rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm text-blue-900 dark:border-blue-900/30 dark:bg-blue-900/10 dark:text-blue-200">
        <p className="font-semibold">Before you start</p>
        <ul className="space-y-1">
          <li>• Use a laptop/desktop browser for best experience.</li>
          <li>• Passport images must be JPG/PNG and up to 1MB each.</li>
          <li>• Signed documents must be PDF and up to 2MB each.</li>
          <li>• Fill all required fields on each step before continuing.</li>
          <li>
            • In steps 7 and 8, ensure documents are signed before upload.
          </li>
        </ul>
      </div>

      <div className="flex justify-end">
        <Button asChild>
          <Link href={`/applicant/${id}/1`}>Start Application</Link>
        </Button>
      </div>
    </div>
  );
}
