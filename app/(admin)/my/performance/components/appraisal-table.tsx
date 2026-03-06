import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eye } from "lucide-react";
import type { PerformanceAppraisal } from "@/lib/api/performance-appraisal";
import Link from "next/link";

interface AppraisalTableProps {
  appraisals: PerformanceAppraisal[];
}

export function AppraisalTable({ appraisals }: AppraisalTableProps) {
  const getStatusBadge = (status: string) => {
    const variants: Record<
      string,
      {
        variant: "default" | "secondary" | "destructive" | "outline";
        label: string;
      }
    > = {
      draft: { variant: "outline", label: "Draft" },
      submitted: { variant: "secondary", label: "Submitted" },
      supervisor_review: { variant: "default", label: "Supervisor Review" },
      mp_review: { variant: "default", label: "MP Review" },
      completed: { variant: "secondary", label: "Completed" },
    };
    const config = variants[status] || {
      variant: "outline" as const,
      label: status,
    };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  if (!appraisals || appraisals.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Appraisal History</CardTitle>
          <CardDescription>Your performance review history</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-10 text-muted-foreground">
            No appraisals found. Start your first self-appraisal today!
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Appraisal History</CardTitle>
        <CardDescription>Your performance review history</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Period</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Overall Rating</TableHead>
              <TableHead>Submitted</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {appraisals.map((appraisal) => (
              <TableRow key={appraisal.id}>
                <TableCell className="font-medium">
                  {new Intl.DateTimeFormat("en-US", {
                    timeZone: "Africa/Lagos",
                    month: "short",
                    year: "numeric",
                  }).format(new Date(appraisal.period_start))}{" "}
                  -{" "}
                  {new Intl.DateTimeFormat("en-US", {
                    timeZone: "Africa/Lagos",
                    month: "short",
                    year: "numeric",
                  }).format(new Date(appraisal.period_end))}
                </TableCell>
                <TableCell>{appraisal.appraisal_type}</TableCell>
                <TableCell>{getStatusBadge(appraisal.status)}</TableCell>
                <TableCell>
                  {appraisal.overall_rating ? (
                    <span className="font-semibold">
                      {appraisal.overall_rating}/10
                    </span>
                  ) : (
                    <span className="text-muted-foreground">Pending</span>
                  )}
                </TableCell>
                <TableCell>
                  {appraisal.self_submitted_at
                    ? new Intl.DateTimeFormat("en-US", {
                        timeZone: "Africa/Lagos",
                      }).format(new Date(appraisal.self_submitted_at))
                    : "Not submitted"}
                </TableCell>
                <TableCell className="text-right">
                  <Link href={`/my/performance/${appraisal.id}`}>
                    <Button variant="ghost" size="sm">
                      <Eye className="h-4 w-4 mr-2" />
                      View
                    </Button>
                  </Link>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
