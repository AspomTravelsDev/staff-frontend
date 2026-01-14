"use client";

import { useState } from "react";
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
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Badge } from "@/components/ui/badge";

// Dummy data for news
const newsData = [
  {
    id: 1,
    title: "New Office Opening in London",
    date: "2024-01-15",
    category: "Company News",
    status: "New",
  },
  {
    id: 2,
    title: "Quarterly Town Hall Meeting",
    date: "2024-01-12",
    category: "Events",
    status: "Upcoming",
  },
  {
    id: 3,
    title: "Updated Remote Work Policy",
    date: "2024-01-10",
    category: "HR Policy",
    status: "Important",
  },
  {
    id: 4,
    title: "System Maintenance Scheduled",
    date: "2024-01-08",
    category: "IT Support",
    status: "Alert",
  },
  {
    id: 5,
    title: "Welcome New Team Members",
    date: "2024-01-05",
    category: "Team",
    status: "General",
  },
  {
    id: 6,
    title: "Annual Performance Reviews",
    date: "2024-01-03",
    category: "HR",
    status: "Action Required",
  },
  {
    id: 7,
    title: "New Health Benefit Options",
    date: "2024-01-01",
    category: "Benefits",
    status: "New",
  },
  {
    id: 8,
    title: "Q4 Financial Results",
    date: "2023-12-28",
    category: "Finance",
    status: "Report",
  },
  {
    id: 9,
    title: "Holiday Party Photos",
    date: "2023-12-20",
    category: "Events",
    status: "General",
  },
  {
    id: 10,
    title: "Security Training Reminder",
    date: "2023-12-15",
    category: "Compliance",
    status: "Mandatory",
  },
];

const ITEMS_PER_PAGE = 5;

export function RecentUpdates() {
  const [currentPage, setCurrentPage] = useState(1);

  const totalPages = Math.ceil(newsData.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const currentItems = newsData.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  const handlePrevious = () => {
    setCurrentPage((prev) => Math.max(prev - 1, 1));
  };

  const handleNext = () => {
    setCurrentPage((prev) => Math.min(prev + 1, totalPages));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Updates</CardTitle>
        <CardDescription>
          Latest company news and announcements.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {currentItems.map((item) => (
              <TableRow key={item.id}>
                <TableCell className="font-medium">{item.title}</TableCell>
                <TableCell>{item.category}</TableCell>
                <TableCell>
                  {new Date(item.date).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </TableCell>
                <TableCell>
                  <Badge
                    variant={
                      item.status === "Important" || item.status === "Alert"
                        ? "destructive"
                        : "secondary"
                    }
                  >
                    {item.status}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
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

              {/* Basic page numbers */}
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
                )
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
