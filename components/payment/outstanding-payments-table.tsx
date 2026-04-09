"use client";

import { format } from "date-fns";
import { TrendingDown } from "lucide-react";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
    Pagination,
    PaginationContent,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
} from "@/components/ui/pagination";
import { usePathname, useSearchParams } from "next/navigation";
import type { OutstandingPayment } from "@/lib/api/payment-confirmations";

interface OutstandingPaymentsTableProps {
    payments: OutstandingPayment[];
    pagination?: {
        page: number;
        limit: number;
        total: number;
        total_pages: number;
    };
}

function formatCurrency(amount: number | string) {
    return `₦${Number(amount).toLocaleString()}`;
}

export function OutstandingPaymentsTable({ payments, pagination }: OutstandingPaymentsTableProps) {
    const pathname = usePathname();
    const searchParams = useSearchParams();

    const createPageUrl = (pageNumber: number) => {
        const params = new URLSearchParams(searchParams.toString());
        params.set("page", pageNumber.toString());
        return `${pathname}?${params.toString()}`;
    };

    if (!payments.length) {
        return (
            <div className="rounded-lg border bg-card py-16 text-center">
                <TrendingDown className="mx-auto h-8 w-8 text-muted-foreground mb-3" />
                <p className="text-sm text-muted-foreground">No outstanding payments found.</p>
            </div>
        );
    }

    return (
        <>
            <div className="rounded-md border bg-card overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Client</TableHead>
                            <TableHead>Expected</TableHead>
                            <TableHead>Paid</TableHead>
                            <TableHead>Balance</TableHead>
                            <TableHead>Progress</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Date</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {payments.map((op) => {
                            const progress = Math.min(100, Math.round((Number(op.total_paid_amount) / Number(op.total_expected_amount)) * 100));
                            return (
                                <TableRow key={op.id}>
                                    <TableCell className="font-medium">
                                        {op.client?.name || "—"}
                                    </TableCell>
                                    <TableCell>{formatCurrency(op.total_expected_amount)}</TableCell>
                                    <TableCell className="text-green-600 font-medium">
                                        {formatCurrency(op.total_paid_amount)}
                                    </TableCell>
                                    <TableCell className="text-destructive font-semibold">
                                        {formatCurrency(op.balance)}
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden min-w-16">
                                                <div
                                                    className="h-full rounded-full bg-primary transition-all"
                                                    style={{ width: `${progress}%` }}
                                                />
                                            </div>
                                            <span className="text-xs text-muted-foreground w-8">{progress}%</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant={op.status === "completed" ? "default" : "secondary"}>
                                            {op.status === "completed" ? "Completed" : "Pending"}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-muted-foreground text-xs whitespace-nowrap">
                                        {format(new Date(op.created_at), "dd MMM yyyy")}
                                    </TableCell>
                                </TableRow>
                            );
                        })}
                    </TableBody>
                </Table>
            </div>

            {/* Pagination */}
            {pagination && pagination.total_pages > 1 && (
                <div className="flex items-center justify-between px-2 pt-4">
                    <p className="text-xs text-muted-foreground italic">
                        Showing {(pagination.page - 1) * pagination.limit + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} records
                    </p>
                    <Pagination className="justify-end w-auto mx-0">
                        <PaginationContent>
                            <PaginationItem>
                                <PaginationPrevious 
                                    href={createPageUrl(Math.max(1, pagination.page - 1))}
                                    aria-disabled={pagination.page <= 1}
                                    className={pagination.page <= 1 ? "pointer-events-none opacity-50" : ""}
                                />
                            </PaginationItem>
                            
                            {Array.from({ length: pagination.total_pages }, (_, i) => i + 1).map((p) => (
                                <PaginationItem key={p} className="hidden sm:inline-block">
                                    <PaginationLink 
                                        href={createPageUrl(p)}
                                        isActive={pagination.page === p}
                                    >
                                        {p}
                                    </PaginationLink>
                                </PaginationItem>
                            ))}

                            <PaginationItem>
                                <PaginationNext 
                                    href={createPageUrl(Math.min(pagination.total_pages, pagination.page + 1))}
                                    aria-disabled={pagination.page >= pagination.total_pages}
                                    className={pagination.page >= pagination.total_pages ? "pointer-events-none opacity-50" : ""}
                                />
                            </PaginationItem>
                        </PaginationContent>
                    </Pagination>
                </div>
            )}
        </>
    );
}
