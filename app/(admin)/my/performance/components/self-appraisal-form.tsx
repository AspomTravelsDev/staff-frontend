"use client";

import { useSelfAppraisal } from "./self-appraisal/use-self-appraisal";
import { Form } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Loader2, Send } from "lucide-react";
import { useRouter } from "next/navigation";
import { EmployeeInfoCard } from "./self-appraisal/employee-info";
import { RatingCriteria } from "./self-appraisal/rating-criteria";
import { KRASection } from "./self-appraisal/kra-section";
import { AchievementsSection } from "./self-appraisal/achievements-section";

export function SelfAppraisalForm() {
  const router = useRouter();
  const { form, expandedKRAs, toggleKRA, onSubmit, isSubmitting } =
    useSelfAppraisal();

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 pb-10">
        <EmployeeInfoCard />

        <RatingCriteria />

        <KRASection expandedKRAs={expandedKRAs} onToggle={toggleKRA} />

        <AchievementsSection />

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-4 pt-4 border-t sticky bottom-0 bg-background py-4 z-10">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push("/my/performance")}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            <Send className="mr-2 h-4 w-4" />
            Submit Appraisal
          </Button>
        </div>
      </form>
    </Form>
  );
}
