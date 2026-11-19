"use client";

import { useState } from "react";
import { format } from "date-fns";
import { Download, ExternalLink, TrendingDown } from "lucide-react";
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
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { usePathname, useSearchParams } from "next/navigation";
import type {
  OutstandingPayment,
  PaymentConfirmation,
} from "@/lib/api/payment-confirmations";
import {
  STATUS_COLORS,
  STATUS_LABELS,
} from "./payment-confirmation-constants";

interface OutstandingPaymentsTableProps {
  payments: OutstandingPayment[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
  };
}

function formatCurrency(amount: number | string, currency = "NGN") {
  const symbol = currency === "USD" ? "$" : "₦";
  return `${symbol}${Number(amount || 0).toLocaleString()}`;
}

function ConfirmationStatusBadge({
  status,
}: {
  status: PaymentConfirmation["status"];
}) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[status]}`}
    >
      {STATUS_LABELS[status]}
    </span>
  );
}

export function OutstandingPaymentsTable({
  payments,
  pagination,
}: OutstandingPaymentsTableProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [selected, setSelected] = useState<OutstandingPayment | null>(null);

  const createPageUrl = (pageNumber: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", pageNumber.toString());
    return `${pathname}?${params.toString()}`;
  };

  if (!payments.length) {
    return (
      <div className="rounded-lg border bg-card py-16 text-center">
        <TrendingDown className="mx-auto h-8 w-8 text-muted-foreground mb-3" />
        <p className="text-sm text-muted-foreground">
          No outstanding payments found.
        </p>
      </div>
    );
  }

  const selectedOrigin = selected?.original_confirmation;
  const selectedCurrency =
    selected?.payment_confirmations?.[0]?.currency || "NGN";
  const selectedProduct =
    selectedOrigin?.product || selected?.client?.service || "—";
  const selectedCloser =
    selectedOrigin?.deal_closer?.name || selectedOrigin?.deal || "—";
  const selectedExpected = Number(selected?.total_expected_amount || 0);
  const selectedProgress =
    selectedExpected > 0
      ? Math.min(
          100,
          Math.round(
            (Number(selected?.total_paid_amount || 0) / selectedExpected) * 100,
          ),
        )
      : 0;
  const installments = selected?.payment_confirmations ?? [];

  return (
    <>
      <div className="rounded-md border bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Client</TableHead>
              <TableHead>Product</TableHead>
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
              const expected = Number(op.total_expected_amount);
              const progress =
                expected > 0
                  ? Math.min(
                      100,
                      Math.round(
                        (Number(op.total_paid_amount) / expected) * 100,
                      ),
                    )
                  : 0;
              const product =
                op.original_confirmation?.product || op.client?.service || "—";
              const currency = op.payment_confirmations?.[0]?.currency || "NGN";

              return (
                <TableRow
                  key={op.id}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => setSelected(op)}
                >
                  <TableCell className="font-medium">
                    {op.client?.name || "—"}
                  </TableCell>
                  <TableCell>{product}</TableCell>
                  <TableCell>
                    {formatCurrency(op.total_expected_amount, currency)}
                  </TableCell>
                  <TableCell className="text-green-600 font-medium">
                    {formatCurrency(op.total_paid_amount, currency)}
                  </TableCell>
                  <TableCell className="text-destructive font-semibold">
                    {formatCurrency(op.balance, currency)}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden min-w-16">
                        <div
                          className="h-full rounded-full bg-primary transition-all"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                      <span className="text-xs text-muted-foreground w-8">
                        {progress}%
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        op.status === "completed" ? "default" : "secondary"
                      }
                    >
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
            Showing {(pagination.page - 1) * pagination.limit + 1} to{" "}
            {Math.min(pagination.page * pagination.limit, pagination.total)} of{" "}
            {pagination.total} records
          </p>
          <Pagination className="justify-end w-auto mx-0">
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  href={createPageUrl(Math.max(1, pagination.page - 1))}
                  aria-disabled={pagination.page <= 1}
                  className={
                    pagination.page <= 1 ? "pointer-events-none opacity-50" : ""
                  }
                />
              </PaginationItem>

              {Array.from(
                { length: pagination.total_pages },
                (_, i) => i + 1,
              ).map((p) => (
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
                  href={createPageUrl(
                    Math.min(pagination.total_pages, pagination.page + 1),
                  )}
                  aria-disabled={pagination.page >= pagination.total_pages}
                  className={
                    pagination.page >= pagination.total_pages
                      ? "pointer-events-none opacity-50"
                      : ""
                  }
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}

      {/* Details Sheet */}
      <Sheet open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <SheetContent className="sm:max-w-lg overflow-y-auto p-4 px-6">
          <SheetHeader>
            <SheetTitle>Outstanding Payment Details</SheetTitle>
            <SheetDescription>
              Client balance breakdown, product details, and payment history.
            </SheetDescription>
          </SheetHeader>

          {selected && (
            <div className="mt-6 space-y-5 text-sm">
              {/* Balance Summary */}
              <div className="rounded-lg border bg-muted/30 p-3.5 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-muted-foreground">
                    Payment Progress ({selectedProgress}%)
                  </span>
                  <Badge
                    variant={
                      selected.status === "completed" ? "default" : "secondary"
                    }
                  >
                    {selected.status === "completed" ? "Completed" : "Pending"}
                  </Badge>
                </div>
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full rounded-full bg-primary transition-all"
                    style={{ width: `${selectedProgress}%` }}
                  />
                </div>
                <div className="grid grid-cols-3 gap-2 pt-1">
                  <div>
                    <p className="text-xs text-muted-foreground">Expected</p>
                    <p className="font-semibold">
                      {formatCurrency(
                        selected.total_expected_amount,
                        selectedCurrency,
                      )}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Paid</p>
                    <p className="font-semibold text-green-600">
                      {formatCurrency(
                        selected.total_paid_amount,
                        selectedCurrency,
                      )}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Balance</p>
                    <p className="font-semibold text-destructive">
                      {formatCurrency(selected.balance, selectedCurrency)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Client & Product Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground">Client</p>
                  <p className="font-medium">{selected.client?.name || "—"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Product</p>
                  <p className="font-medium">{selectedProduct}</p>
                </div>
                {selected.client?.phone && (
                  <div>
                    <p className="text-xs text-muted-foreground">Phone</p>
                    <p>{selected.client.phone}</p>
                  </div>
                )}
                {selected.client?.email && (
                  <div>
                    <p className="text-xs text-muted-foreground">Email</p>
                    <p className="truncate">{selected.client.email}</p>
                  </div>
                )}
                <div>
                  <p className="text-xs text-muted-foreground">Deal Closer</p>
                  <p>{selectedCloser}</p>
                </div>
                {selectedOrigin?.user?.name && (
                  <div>
                    <p className="text-xs text-muted-foreground">Submitted By</p>
                    <p>{selectedOrigin.user.name}</p>
                  </div>
                )}
                {selectedOrigin?.number_of_persons && (
                  <div>
                    <p className="text-xs text-muted-foreground">
                      Number of Persons
                    </p>
                    <p>{selectedOrigin.number_of_persons}</p>
                  </div>
                )}
                {selectedOrigin?.dollar_rate && (
                  <div>
                    <p className="text-xs text-muted-foreground">
                      Dollar Billing Rate
                    </p>
                    <p>
                      ₦{Number(selectedOrigin.dollar_rate).toLocaleString()}
                    </p>
                  </div>
                )}
              </div>

              {selectedOrigin?.service_description && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">
                    Description &amp; Notes
                  </p>
                  <p className="rounded-md border bg-muted/20 p-2.5 text-sm leading-relaxed">
                    {selectedOrigin.service_description}
                  </p>
                </div>
              )}

              {/* Payments Made */}
              <div className="space-y-2.5">
                <p className="text-xs font-medium text-muted-foreground">
                  Payments Made ({installments.length})
                </p>
                {installments.length === 0 ? (
                  <p className="text-xs text-muted-foreground italic">
                    No payment records found.
                  </p>
                ) : (
                  <div className="space-y-2.5">
                    {installments.map((entry) => {
                      const entryCurrency = entry.currency || selectedCurrency;
                      return (
                        <div
                          key={entry.id}
                          className="rounded-md border p-3 space-y-2"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <p className="font-semibold">
                                {formatCurrency(
                                  entry.amount_paid,
                                  entryCurrency,
                                )}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {format(
                                  new Date(entry.payment_date),
                                  "dd MMM yyyy",
                                )}{" "}
                                · {entry.payment_method}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                Payer: {entry.payer_name}
                                {entry.user?.name
                                  ? ` · Submitted by ${entry.user.name}`
                                  : ""}
                              </p>
                            </div>
                            <ConfirmationStatusBadge status={entry.status} />
                          </div>

                          {entry.status === "rejected" &&
                            entry.rejection_reason && (
                              <p className="text-xs text-destructive">
                                Decline reason: {entry.rejection_reason}
                              </p>
                            )}

                          {entry.files && entry.files.length > 0 && (
                            <div className="space-y-1.5 pt-1 border-t">
                              {entry.files.map((file) => {
                                const fileName =
                                  file.original_name ||
                                  file.filename ||
                                  "Attachment";
                                const fileUrl = `/api/proxy/image/api/files/download/${file.id}`;
                                return (
                                  <div
                                    key={file.id}
                                    className="flex items-center justify-between gap-2 text-xs"
                                  >
                                    <span className="truncate text-muted-foreground">
                                      {fileName}
                                    </span>
                                    <div className="flex items-center gap-1 shrink-0">
                                      <Button
                                        asChild
                                        size="sm"
                                        variant="outline"
                                        className="h-6 px-2 text-xs"
                                      >
                                        <a
                                          href={fileUrl}
                                          target="_blank"
                                          rel="noreferrer"
                                        >
                                          <ExternalLink className="mr-1 h-3 w-3" />
                                          Open
                                        </a>
                                      </Button>
                                      <Button
                                        asChild
                                        size="sm"
                                        variant="outline"
                                        className="h-6 px-2 text-xs"
                                      >
                                        <a href={fileUrl} download={fileName}>
                                          <Download className="mr-1 h-3 w-3" />
                                          Download
                                        </a>
                                      </Button>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </>
  );
}
