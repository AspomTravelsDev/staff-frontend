"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Link from "next/link";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

import type { AnnouncementItem } from "@/lib/api/announcements";

const ITEMS_PER_PAGE = 5;

interface RecentUpdatesProps {
  className?: string;
  updates: AnnouncementItem[];
}

export function RecentUpdates({ className, updates }: RecentUpdatesProps) {
  const [currentPage, setCurrentPage] = useState(1);

  if (!updates || updates.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>Newsletter & Announcements</CardTitle>
          <CardDescription>
            Latest company news and announcements.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-10 text-muted-foreground">
            No updates available.
          </div>
        </CardContent>
      </Card>
    );
  }

  const totalPages = Math.ceil(updates.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const currentItems = updates.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  const handlePrevious = () => {
    setCurrentPage((prev) => Math.max(prev - 1, 1));
  };

  const handleNext = () => {
    setCurrentPage((prev) => Math.min(prev + 1, totalPages));
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Newsletter & Announcements</CardTitle>
        <CardDescription>
          Latest company news and announcements.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Published</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {currentItems.map((item) => {
              return (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Link
                        href={`/announcements/${item.id}`}
                        className="hover:underline font-bold"
                      >
                        {item.title}
                      </Link>
                      {item.priority === "urgent" && (
                        <Badge
                          variant="destructive"
                          className="uppercase text-[9px] px-1.5 py-0 h-4 tracking-wider animate-pulse"
                        >
                          Important
                        </Badge>
                      )}
                      {item.priority === "high" && (
                        <Badge
                          variant="secondary"
                          className="uppercase text-[9px] px-1.5 py-0 h-4 tracking-wider bg-orange-100 text-orange-800 hover:bg-orange-100 dark:bg-orange-900/40 dark:text-orange-400 border-none"
                        >
                          High Priority
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="capitalize">{item.type}</TableCell>
                  <TableCell>
                    {format(
                      new Date(item.published_at ?? item.created_at),
                      "MMM dd, yyyy",
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        item.status === "approved" ? "default" : "secondary"
                      }
                      className="uppercase text-[10px]"
                    >
                      {item.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>

        <div className="mt-4">
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    handlePrevious();
                  }}
                  className={
                    currentPage === 1
                      ? "pointer-events-none opacity-50"
                      : "cursor-pointer"
                  }
                />
              </PaginationItem>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                (page) => (
                  <PaginationItem key={page}>
                    <PaginationLink
                      href="#"
                      isActive={page === currentPage}
                      onClick={(e) => {
                        e.preventDefault();
                        setCurrentPage(page);
                      }}
                    >
                      {page}
                    </PaginationLink>
                  </PaginationItem>
                ),
              )}

              <PaginationItem>
                <PaginationNext
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    handleNext();
                  }}
                  className={
                    currentPage === totalPages
                      ? "pointer-events-none opacity-50"
                      : "cursor-pointer"
                  }
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      </CardContent>
    </Card>
  );
}
