"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  KeyRound,
  Flame,
  Clock,
  Copy,
  Check,
  ShieldCheck,
  Lock,
  Loader2,
  AlertTriangle,
  Trash2,
} from "lucide-react";
import { SecureSecretMetadata, RevealedSecretData } from "@/types/secret";
import { getSecretMetadata, revealSecret, revokeSecret } from "@/lib/api/secrets";
import { toast } from "sonner";

interface SecretCapsuleCardProps {
  secretId: string;
  initialTitle?: string;
  currentUserId?: string;
  isOwn?: boolean;
  onBurned?: () => void;
}

export function SecretCapsuleCard({
  secretId,
  initialTitle,
  currentUserId,
  isOwn = false,
  onBurned,
}: SecretCapsuleCardProps) {
  const [metadata, setMetadata] = useState<SecureSecretMetadata | null>(null);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [pin, setPin] = useState("");
  const [revealing, setRevealing] = useState(false);
  const [revoking, setRevoking] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [revealedData, setRevealedData] = useState<RevealedSecretData | null>(null);
  const [copiedPassword, setCopiedPassword] = useState(false);
  const [copiedUsername, setCopiedUsername] = useState(false);

  useEffect(() => {
    let active = true;
    getSecretMetadata(secretId)
      .then((data) => {
        if (active) setMetadata(data);
      })
      .catch((err) => {
        console.warn("Failed to load secret capsule metadata:", err);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [secretId]);

  const title = metadata?.title || initialTitle || "Secure Credential Drop";
  const isDestroyed = metadata?.is_destroyed || false;
  const isExpired = metadata?.is_expired || false;
  const hasPin = metadata?.has_pin || false;

  async function handleReveal() {
    setRevealing(true);
    try {
      const res = await revealSecret(secretId, pin || undefined);
      setRevealedData(res);
      setMetadata((prev) =>
        prev
          ? {
              ...prev,
              is_destroyed: true,
              viewed_at: new Date().toISOString(),
            }
          : null
      );
      toast.success("Credential decrypted. Payload permanently erased from database.");
      onBurned?.();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to reveal credential.";
      toast.error(msg);
    } finally {
      setRevealing(false);
    }
  }

  async function handleRevoke() {
    setRevoking(true);
    try {
      await revokeSecret(secretId);
      setMetadata((prev) =>
        prev
          ? {
              ...prev,
              is_destroyed: true,
              viewed_at: new Date().toISOString(),
            }
          : null
      );
      toast.success("Secret drop revoked and destroyed.");
      onBurned?.();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to revoke secret.");
    } finally {
      setRevoking(false);
    }
  }

  function handleCopyShareLink() {
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const url = `${origin}/secret/${secretId}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopiedLink(true);
      toast.success("Public share link copied to clipboard!");
      setTimeout(() => setCopiedLink(false), 2500);
    });
  }

  async function handleCopyPassword(passwordToCopy: string) {
    try {
      await navigator.clipboard.writeText(passwordToCopy);
      setCopiedPassword(true);
      toast.success("Password copied to clipboard!");
      setTimeout(() => setCopiedPassword(false), 2500);
    } catch {
      toast.error("Failed to copy password.");
    }
  }

  async function handleCopyUsername(usernameToCopy: string) {
    try {
      await navigator.clipboard.writeText(usernameToCopy);
      setCopiedUsername(true);
      toast.success("Username copied to clipboard!");
      setTimeout(() => setCopiedUsername(false), 2500);
    } catch {
      toast.error("Failed to copy username.");
    }
  }

  return (
    <>
      <div
        className={`w-full max-w-sm rounded-xl border p-3.5 text-xs transition-colors shadow-xs ${
          isDestroyed
            ? "border-border/80 bg-card text-card-foreground dark:border-border/60"
            : isExpired
            ? "border-border/80 bg-muted/40 text-muted-foreground"
            : "border-amber-500/30 bg-card text-card-foreground dark:border-amber-500/25"
        }`}
      >
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <span
              className={`p-2 rounded-lg shrink-0 ${
                isDestroyed
                  ? "bg-destructive/10 text-destructive dark:text-red-400"
                  : isExpired
                  ? "bg-muted text-muted-foreground"
                  : "bg-amber-500/15 text-amber-600 dark:text-amber-400"
              }`}
            >
              {isDestroyed ? (
                <Flame className="h-4 w-4" />
              ) : isExpired ? (
                <Clock className="h-4 w-4" />
              ) : (
                <KeyRound className="h-4 w-4" />
              )}
            </span>
            <div className="min-w-0">
              <p className="font-semibold truncate text-sm text-foreground">{title}</p>
              <p className="text-[11px] text-muted-foreground truncate">
                {isDestroyed
                  ? isOwn
                    ? "Opened by recipient · Burned"
                    : "Burned & Destroyed"
                  : isExpired
                  ? "Expired without viewing"
                  : isOwn
                  ? "Single-use · Awaiting recipient"
                  : "Single-use IT credential drop"}
              </p>
            </div>
          </div>

          <span
            className={`text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0 ${
              isDestroyed
                ? "bg-muted text-muted-foreground border border-border/80"
                : isExpired
                ? "bg-muted text-muted-foreground"
                : "bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30"
            }`}
          >
            {isDestroyed ? "Burned" : isExpired ? "Expired" : "Active"}
          </span>
        </div>

        {isDestroyed ? (
          <div className="text-[11px] text-muted-foreground pt-2 border-t border-border/60 flex items-center justify-between">
            <span>
              {metadata?.viewed_at
                ? `Burned at ${new Date(metadata.viewed_at).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}`
                : "Erased from server"}
            </span>
            <span className="italic">Payload wiped</span>
          </div>
        ) : isExpired ? (
          <div className="text-[11px] text-muted-foreground pt-2 border-t border-border/60">
            <span>Expired. Contact IT to re-issue.</span>
          </div>
        ) : isOwn ? (
          /* Sender View: IT Officer cannot reveal/burn the secret meant for recipient; can revoke or copy share link */
          <div className="pt-2 border-t border-border/60 flex items-center justify-between gap-2">
            <span className="text-[11px] text-muted-foreground flex items-center gap-1">
              <Clock className="h-3 w-3 text-amber-500 shrink-0" />
              <span className="truncate">Recipient only</span>
            </span>
            <div className="flex items-center gap-1.5 shrink-0">
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={handleCopyShareLink}
                className="h-7 px-2.5 text-xs gap-1 font-medium"
                title="Copy public link"
              >
                {copiedLink ? (
                  <>
                    <Check className="h-3 w-3 text-emerald-500" />
                    <span className="text-[10px] text-emerald-500">Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-3 w-3" />
                    <span className="text-[10px]">Copy Link</span>
                  </>
                )}
              </Button>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                disabled={revoking}
                onClick={handleRevoke}
                className="h-7 px-2 text-xs text-destructive hover:text-destructive hover:bg-destructive/10"
                title="Revoke and cancel drop"
              >
                {revoking ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <Trash2 className="h-3 w-3" />
                )}
              </Button>
            </div>
          </div>
        ) : (
          /* Recipient View: Can reveal and burn the secret */
          <div className="pt-2 border-t border-amber-500/20 flex items-center justify-between gap-2">
            <span className="text-[11px] text-muted-foreground flex items-center gap-1">
              <Clock className="h-3 w-3 text-amber-500" />
              Single-use drop
            </span>
            <Button
              type="button"
              size="sm"
              variant="default"
              onClick={() => {
                setRevealedData(null);
                setPin("");
                setDialogOpen(true);
              }}
              className="h-7 px-3 text-xs gap-1.5 font-medium shadow-xs"
            >
              <KeyRound className="h-3 w-3" />
              <span>Reveal</span>
            </Button>
          </div>
        )}
      </div>

      {/* Reveal Credential Modal (Only for recipient) */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="w-[calc(100vw-1rem)] max-h-[calc(100dvh-1rem)] overflow-y-auto p-4 sm:p-6 sm:max-w-[440px]">
          <DialogHeader className="text-left space-y-1.5">
            <DialogTitle className="text-lg flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
                <ShieldCheck className="h-5 w-5" />
              </span>
              <span>{title}</span>
            </DialogTitle>
            <DialogDescription className="text-xs">
              {revealedData
                ? "Credentials decrypted successfully. For your security, the password is not shown on screen."
                : "This credential drop is single-use. Once decrypted, it will be permanently erased from the server."}
            </DialogDescription>
          </DialogHeader>

          {!revealedData ? (
            <div className="space-y-4 py-2">
              {hasPin && (
                <div className="space-y-1.5">
                  <Label htmlFor="reveal-pin" className="text-xs font-medium flex items-center gap-1">
                    <Lock className="h-3.5 w-3.5 text-muted-foreground" />
                    Enter 4-digit Security PIN
                  </Label>
                  <Input
                    id="reveal-pin"
                    type="password"
                    placeholder="Enter PIN provided by IT"
                    value={pin}
                    onChange={(e) => setPin(e.target.value)}
                    maxLength={16}
                    autoFocus
                    className="h-9 text-xs"
                  />
                  <p className="text-[11px] text-muted-foreground">
                    This drop was protected by a secondary PIN.
                  </p>
                </div>
              )}

              <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-3 text-xs text-amber-900 dark:text-amber-300 leading-relaxed flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
                <span>
                  <strong>Notice:</strong> Decrypting will destroy this credential forever on the server. Make sure you are ready to copy and use it now.
                </span>
              </div>
            </div>
          ) : (
            <div className="space-y-4 py-2">
              {/* Username row */}
              {revealedData.username && (
                <div className="space-y-1">
                  <Label className="text-xs font-medium text-muted-foreground">
                    Username / Account ID
                  </Label>
                  <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/40 p-2">
                    <span className="flex-1 font-mono text-xs select-all break-all">
                      {revealedData.username}
                    </span>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() => handleCopyUsername(revealedData.username!)}
                      className="h-7 px-2 text-xs gap-1"
                    >
                      {copiedUsername ? (
                        <>
                          <Check className="h-3 w-3 text-emerald-500" />
                          <span className="text-[11px] text-emerald-500">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="h-3 w-3" />
                          <span className="text-[11px]">Copy</span>
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              )}

              {/* Password row: Masked dots with click-to-copy button */}
              <div className="space-y-1">
                <Label className="text-xs font-medium text-muted-foreground">
                  Password (Masked for Security)
                </Label>
                <div className="rounded-lg border border-border bg-muted/40 p-3 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-sm tracking-widest text-muted-foreground select-none">
                      ••••••••••••••••
                    </span>
                    <span className="text-[10px] text-muted-foreground italic">
                      Hidden from screen
                    </span>
                  </div>

                  <Button
                    type="button"
                    size="sm"
                    variant="default"
                    onClick={() => handleCopyPassword(revealedData.password)}
                    className="w-full h-8 text-xs font-medium gap-1.5 shadow-xs"
                  >
                    {copiedPassword ? (
                      <>
                        <Check className="h-3.5 w-3.5 text-emerald-300" />
                        <span>Password Copied to Clipboard!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-3.5 w-3.5" />
                        <span>Click to Copy Password</span>
                      </>
                    )}
                  </Button>
                </div>
              </div>

              {/* Notes row */}
              {revealedData.notes && (
                <div className="space-y-1">
                  <Label className="text-xs font-medium text-muted-foreground">
                    Additional Instructions / Notes
                  </Label>
                  <div className="rounded-lg border border-border bg-muted/20 p-2 text-xs leading-relaxed whitespace-pre-wrap">
                    {revealedData.notes}
                  </div>
                </div>
              )}

              <div className="rounded-lg border border-red-500/20 bg-red-500/5 p-2.5 text-[11px] text-red-600 dark:text-red-400 flex items-center gap-2">
                <Flame className="h-4 w-4 shrink-0" />
                <span>Payload permanently destroyed on the server.</span>
              </div>
            </div>
          )}

          <DialogFooter className="sm:justify-between gap-2">
            {!revealedData ? (
              <>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  size="sm"
                  onClick={handleReveal}
                  disabled={revealing || (hasPin && !pin.trim())}
                  className="gap-1.5"
                >
                  {revealing ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      <span>Decrypting & Burning...</span>
                    </>
                  ) : (
                    <>
                      <KeyRound className="h-3.5 w-3.5" />
                      <span>Confirm & Reveal</span>
                    </>
                  )}
                </Button>
              </>
            ) : (
              <Button
                type="button"
                variant="default"
                size="sm"
                onClick={() => setDialogOpen(false)}
                className="w-full"
              >
                Done
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
