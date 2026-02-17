"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, Eye, Edit, PlayCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Review } from "@/lib/api/performance";

interface PerformanceTableProps {
  reviews: Review[];
}

export function PerformanceTable({ reviews }: PerformanceTableProps) {
  const getStatusVariant = (status: string) => {
    switch (status) {
      case "Completed":
        return "default";
      case "Processing":
        return "secondary";
      case "Pending":
        return "outline";
      default:
        return "outline";
    }
  };

  const getScoreColor = (score: number | null) => {
    if (score === null) return "text-muted-foreground";
    if (score >= 4.5) return "text-green-600 font-bold";
    if (score >= 3.5) return "text-blue-600 font-bold";
    if (score >= 2.5) return "text-yellow-600 font-bold";
    return "text-red-600 font-bold";
  };

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Employee</TableHead>
            <TableHead>Review Period</TableHead>
            <TableHead>Reviewer</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Score</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {reviews.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="h-24 text-center">
                No performance reviews found.
              </TableCell>
            </TableRow>
          ) : (
            reviews.map((review) => (
              <TableRow key={review.id}>
                <TableCell>
                  <div className="flex flex-col">
                    <span className="font-medium">{review.employeeName}</span>
                    <span className="text-xs text-muted-foreground">
                      {review.department}
                    </span>
                  </div>
                </TableCell>
                <TableCell>{review.period}</TableCell>
                <TableCell>{review.reviewer}</TableCell>
                <TableCell className="text-muted-foreground text-sm">
                  {review.date}
                </TableCell>
                <TableCell>
                  <span className={getScoreColor(review.score)}>
                    {review.score !== null ? review.score.toFixed(1) : "-"}
                  </span>
                </TableCell>
                <TableCell>
                  <Badge variant={getStatusVariant(review.status)}>
                    {review.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" />
                        <span className="sr-only">Open menu</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                      {review.status !== "Completed" && (
                        <DropdownMenuItem>
                          <PlayCircle className="mr-2 h-4 w-4" /> Start Review
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem>
                        <Eye className="mr-2 h-4 w-4" /> View Details
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Edit className="mr-2 h-4 w-4" /> Edit
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
