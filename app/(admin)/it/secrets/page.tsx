"use client";

import { useState, useEffect, useCallback } from "react";
import {
  KeyRound,
  Flame,
  Clock,
  Copy,
  Check,
  ShieldCheck,
  Search,
  Filter,
  Plus,
  RefreshCw,
  Trash2,
  ExternalLink,
  ShieldAlert,
  Loader2,
  Lock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { CreateSecretModal } from "@/components/chat/create-secret-modal";
import { SecureSecretMetadata } from "@/types/secret";
import { getSecretAuditLogs, revokeSecret } from "@/lib/api/secrets";
import { toast } from "sonner";

export default function ITSecretsAuditPage() {
  const [secrets, setSecrets] = useState<SecureSecretMetadata[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "burned" | "expired">("all");
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [revokingId, setRevokingId] = useState<string | null>(null);
  const [revoking, setRevoking] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const loadSecrets = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getSecretAuditLogs();
      setSecrets(res.data);
    } catch (err: unknown) {
      toast.error(
        "Failed to load secret drops: " +
          (err instanceof Error ? err.message : "Error")
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadSecrets();
  }, [loadSecrets]);

  const filteredSecrets = secrets.filter((s) => {
    if (statusFilter === "active" && (s.is_destroyed || s.is_expired)) return false;
    if (statusFilter === "burned" && !s.is_destroyed) return false;
    if (statusFilter === "expired" && (!s.is_expired || s.is_destroyed)) return false;

    if (search.trim()) {
      const q = search.toLowerCase();
      const matchTitle = s.title.toLowerCase().includes(q);
      const matchRecipient = s.recipient?.name?.toLowerCase().includes(q);
      const matchSender = s.sender?.name?.toLowerCase().includes(q);
      return matchTitle || Boolean(matchRecipient) || Boolean(matchSender);
    }
    return true;
  });

  const totalCount = secrets.length;
  const activeCount = secrets.filter((s) => !s.is_destroyed && !s.is_expired).length;
  const burnedCount = secrets.filter((s) => s.is_destroyed).length;
  const expiredCount = secrets.filter((s) => s.is_expired && !s.is_destroyed).length;

  async function handleRevoke(id: string) {
    setRevoking(true);
    try {
      await revokeSecret(id);
      toast.success("Secret revoked and erased immediately.");
      setRevokingId(null);
      void loadSecrets();
    } catch (err: unknown) {
      toast.error(
        "Failed to revoke secret: " +
          (err instanceof Error ? err.message : "Error")
      );
    } finally {
      setRevoking(false);
    }
  }

  function copyShareUrl(id: string) {
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const url = `${origin}/secret/${id}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopiedId(id);
      toast.success("Public link copied to clipboard!");
      setTimeout(() => setCopiedId(null), 2500);
    });
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight flex items-center gap-2">
            <span className="p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <KeyRound className="h-6 w-6" />
            </span>
            <span>IT Secure Credential Drops</span>
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Zero-knowledge Burn-After-Reading system for securely transmitting logins and secrets.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={() => void loadSecrets()}
            disabled={loading}
            className="gap-1.5 text-xs"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
            <span>Refresh</span>
          </Button>

          <Button
            size="sm"
            onClick={() => setCreateModalOpen(true)}
            className="gap-1.5 text-xs font-medium"
          >
            <Plus className="h-4 w-4" />
            <span>New Credential Drop</span>
          </Button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-muted-foreground">Total Created</p>
            <KeyRound className="h-4 w-4 text-muted-foreground" />
          </div>
          <p className="text-2xl font-bold mt-2">{totalCount}</p>
        </Card>

        <Card className="p-4 border-amber-500/30">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-amber-600 dark:text-amber-400">Active (Pending)</p>
            <Clock className="h-4 w-4 text-amber-500" />
          </div>
          <p className="text-2xl font-bold mt-2 text-amber-600 dark:text-amber-400">
            {activeCount}
          </p>
        </Card>

        <Card className="p-4 border-red-500/30">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-red-600 dark:text-red-400">Burned & Destroyed</p>
            <Flame className="h-4 w-4 text-red-500" />
          </div>
          <p className="text-2xl font-bold mt-2 text-red-600 dark:text-red-400">
            {burnedCount}
          </p>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-muted-foreground">Expired Unread</p>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </div>
          <p className="text-2xl font-bold mt-2 text-muted-foreground">{expiredCount}</p>
        </Card>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by title, sender, or recipient..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-9 text-xs"
          />
        </div>

        <div className="flex items-center gap-1.5 w-full sm:w-auto shrink-0 overflow-x-auto pb-1 sm:pb-0">
          <Button
            size="sm"
            variant={statusFilter === "all" ? "default" : "outline"}
            onClick={() => setStatusFilter("all")}
            className="h-8 text-xs px-3"
          >
            All
          </Button>
          <Button
            size="sm"
            variant={statusFilter === "active" ? "default" : "outline"}
            onClick={() => setStatusFilter("active")}
            className="h-8 text-xs px-3 gap-1"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            Active
          </Button>
          <Button
            size="sm"
            variant={statusFilter === "burned" ? "default" : "outline"}
            onClick={() => setStatusFilter("burned")}
            className="h-8 text-xs px-3 gap-1"
          >
            <Flame className="h-3 w-3 text-red-500" />
            Burned
          </Button>
          <Button
            size="sm"
            variant={statusFilter === "expired" ? "default" : "outline"}
            onClick={() => setStatusFilter("expired")}
            className="h-8 text-xs px-3"
          >
            Expired
          </Button>
        </div>
      </div>

      {/* Audit Log Table */}
      <Card>
        <CardHeader className="py-4">
          <CardTitle className="text-base flex items-center justify-between">
            <span>Dispatched Secrets</span>
            <span className="text-xs font-normal text-muted-foreground">
              Showing {filteredSecrets.length} of {totalCount}
            </span>
          </CardTitle>
          <CardDescription className="text-xs">
            Encrypted with AES-256-GCM. Payloads are purged from storage immediately upon viewing.
          </CardDescription>
        </CardHeader>

        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-12 text-muted-foreground gap-2">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span className="text-sm">Loading audit logs...</span>
            </div>
          ) : filteredSecrets.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground space-y-2">
              <KeyRound className="h-8 w-8 mx-auto opacity-40" />
              <p className="text-sm font-medium">No secret drops found</p>
              <p className="text-xs">
                {search ? "Try clearing your search query" : "Click New Credential Drop to create your first secret"}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">Service / Title</TableHead>
                    <TableHead className="text-xs">Created By</TableHead>
                    <TableHead className="text-xs">Recipient</TableHead>
                    <TableHead className="text-xs">Created At</TableHead>
                    <TableHead className="text-xs">Expires At</TableHead>
                    <TableHead className="text-xs">Status</TableHead>
                    <TableHead className="text-xs text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSecrets.map((secret) => {
                    const isBurned = secret.is_destroyed;
                    const isExpired = secret.is_expired && !isBurned;
                    const isActive = !isBurned && !isExpired;

                    return (
                      <TableRow key={secret.id}>
                        <TableCell className="font-medium text-xs">
                          <div className="flex items-center gap-2">
                            <span
                              className={`p-1.5 rounded-md ${
                                isBurned
                                  ? "bg-red-500/10 text-red-500"
                                  : isExpired
                                  ? "bg-muted text-muted-foreground"
                                  : "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                              }`}
                            >
                              {isBurned ? (
                                <Flame className="h-3.5 w-3.5" />
                              ) : isExpired ? (
                                <Clock className="h-3.5 w-3.5" />
                              ) : (
                                <KeyRound className="h-3.5 w-3.5" />
                              )}
                            </span>
                            <div className="min-w-0">
                              <span className="font-semibold block truncate max-w-44">
                                {secret.title}
                              </span>
                              {secret.has_pin && (
                                <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                                  <Lock className="h-2.5 w-2.5" />
                                  PIN protected
                                </span>
                              )}
                            </div>
                          </div>
                        </TableCell>

                        <TableCell className="text-xs text-muted-foreground">
                          {secret.sender?.name || "IT Officer"}
                        </TableCell>

                        <TableCell className="text-xs">
                          {secret.recipient?.name ? (
                            <span className="font-medium">{secret.recipient.name}</span>
                          ) : (
                            <span className="text-muted-foreground italic">Public Link</span>
                          )}
                        </TableCell>

                        <TableCell className="text-xs text-muted-foreground">
                          {secret.created_at
                            ? new Date(secret.created_at).toLocaleString([], {
                                month: "short",
                                day: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              })
                            : "—"}
                        </TableCell>

                        <TableCell className="text-xs text-muted-foreground">
                          {new Date(secret.expires_at).toLocaleString([], {
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </TableCell>

                        <TableCell className="text-xs">
                          {isBurned ? (
                            <Badge variant="destructive" className="gap-1 text-[10px] font-semibold">
                              <Flame className="h-3 w-3" />
                              Burned
                            </Badge>
                          ) : isExpired ? (
                            <Badge variant="secondary" className="text-[10px]">
                              Expired
                            </Badge>
                          ) : (
                            <Badge
                              variant="outline"
                              className="border-amber-500/50 bg-amber-500/10 text-amber-700 dark:text-amber-400 text-[10px] font-semibold"
                            >
                              Active
                            </Badge>
                          )}
                        </TableCell>

                        <TableCell className="text-xs text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {isActive && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => copyShareUrl(secret.id)}
                                className="h-7 px-2 text-xs gap-1"
                                title="Copy public share URL"
                              >
                                {copiedId === secret.id ? (
                                  <>
                                    <Check className="h-3 w-3 text-emerald-500" />
                                    <span className="text-emerald-500 text-[10px]">Copied</span>
                                  </>
                                ) : (
                                  <>
                                    <Copy className="h-3 w-3" />
                                    <span className="text-[10px]">Link</span>
                                  </>
                                )}
                              </Button>
                            )}

                            {isActive && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => setRevokingId(secret.id)}
                                className="h-7 px-2 text-xs text-destructive hover:text-destructive hover:bg-destructive/10"
                                title="Revoke and destroy immediately"
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            )}

                            {isBurned && (
                              <span className="text-[10px] text-muted-foreground italic">
                                Destroyed
                              </span>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Revoke Confirmation Dialog */}
      <AlertDialog
        open={Boolean(revokingId)}
        onOpenChange={(open) => {
          if (!open && !revoking) setRevokingId(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Revoke this credential drop?</AlertDialogTitle>
            <AlertDialogDescription>
              The encrypted payload will be immediately purged from the database. The recipient will not be able to view it.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={revoking}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={revoking}
              onClick={(e) => {
                e.preventDefault();
                if (revokingId) void handleRevoke(revokingId);
              }}
            >
              {revoking ? "Revoking..." : "Revoke & Destroy"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Create Modal */}
      <CreateSecretModal
        open={createModalOpen}
        onOpenChange={setCreateModalOpen}
        onSecretCreated={() => {
          void loadSecrets();
        }}
      />
    </div>
  );
}
