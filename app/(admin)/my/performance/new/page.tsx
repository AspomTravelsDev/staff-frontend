import { SelfAppraisalForm } from "../components/self-appraisal-form";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NewAppraisalPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/my/performance">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Performance
          </Button>
        </Link>
      </div>

      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Self-Appraisal Form
        </h1>
        <p className="text-muted-foreground">
          Complete your self-assessment for the review period
        </p>
      </div>

      <SelfAppraisalForm />
    </div>
  );
}
