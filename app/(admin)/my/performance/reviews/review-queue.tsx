"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { callAction } from "@/lib/api/action-result";
import { listAssignedReviews } from "@/lib/api/performance-review.actions";
import { reviewStageLabel, reviewStatusLabel } from "@/lib/performance-review";
import type { ReviewSummary } from "@/lib/types/performance-review";

export function ReviewQueue({ initialData }: { initialData: { items: ReviewSummary[] } }) {
  const query = useQuery({ queryKey: ["performance", "assigned-reviews"], queryFn: () => callAction(listAssignedReviews), initialData });
  const [filter, setFilter] = useState("action");
  const [search, setSearch] = useState("");
  const items = (query.data?.items ?? []).filter((item) => `${item.employee_name} ${item.employee_staff_id} ${item.department} ${item.month}`.toLowerCase().includes(search.toLowerCase())
    && (filter === "all" || (filter === "action" ? item.can_review : filter === "submitted" ? item.assessment_status === "submitted" : !item.can_review && item.assessment_status !== "submitted")));
  const ready = query.data.items.filter((item) => item.can_review).length;

  return <div className="space-y-6"><header className="space-y-1"><h1 className="text-2xl font-bold">Reviews to Complete</h1><p className="max-w-2xl text-sm text-muted-foreground">Assess the staff assigned to you using their saved monthly KPIs. Reviews appear after the staff member submits their self-assessment.</p></header>
    {query.error && <div role="alert" className="space-y-2 text-sm text-destructive"><p>Unable to refresh your reviews. The last loaded information is shown.</p><Button variant="outline" onClick={() => void query.refetch()}>Retry loading</Button></div>}
    <p className="border-y py-4 text-sm"><span className="font-semibold tabular-nums">{ready}</span> ready for your assessment · <span className="font-semibold tabular-nums">{query.data.items.length}</span> assigned reviews and history</p>
    <div className="grid max-w-2xl gap-3 sm:grid-cols-2"><div className="space-y-2"><Label htmlFor="review-search">Search staff, department or month</Label><Input id="review-search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Name, staff ID or month" /></div><div className="space-y-2"><Label htmlFor="review-filter">Show</Label><select id="review-filter" className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" value={filter} onChange={(event) => setFilter(event.target.value)}><option value="action">Ready for my review</option><option value="waiting">Waiting or submission closed</option><option value="submitted">My submitted reviews</option><option value="all">All assigned reviews</option></select></div></div>
    {!items.length ? <div className="rounded-xl border border-dashed px-6 py-12 text-center"><h2 className="font-medium">{query.data.items.length ? "No reviews match this view" : "No submitted appraisals assigned to you yet"}</h2><p className="mt-2 text-sm text-muted-foreground">{query.data.items.length ? "Change the search or show all assigned reviews." : "Assigned appraisals will appear after staff submit their self-assessments."}</p>{query.data.items.length > 0 && <Button className="mt-4" variant="outline" onClick={() => { setFilter("all"); setSearch(""); }}>Show all assigned reviews</Button>}</div> : <ul className="divide-y rounded-xl border">{items.map((review) => <li key={review.id} className="flex flex-wrap items-start justify-between gap-4 p-4 sm:p-5"><div className="min-w-0 space-y-2"><div className="flex flex-wrap items-center gap-3"><h2 className="break-words font-semibold">{review.employee_name}</h2><Badge variant={review.can_review ? "outline" : "secondary"}>{reviewStatusLabel(review)}</Badge></div><p className="text-sm text-muted-foreground">{review.employee_staff_id} · {review.department} · {review.month}</p><p className="text-sm">{reviewStageLabel(review)} · Deadline {review.submission_deadline}</p>{review.final_score !== null && <p className="text-sm font-medium tabular-nums">Final score: {Number(review.final_score).toFixed(2)} / 5</p>}</div><Button variant={review.can_review ? "default" : "outline"} asChild><Link href={`/my/performance/reviews/${review.id}`} aria-label={`${review.can_review ? "Review" : "View review for"} ${review.employee_name}, ${review.month}`}>{review.can_review ? review.assessment_status === "draft" ? "Continue draft" : "Assess staff" : "View review"}</Link></Button></li>)}</ul>}
  </div>;
}
