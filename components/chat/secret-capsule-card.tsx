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
} from "lucide-react";
import { SecureSecretMetadata, RevealedSecretData } from "@/types/secret";
import { getSecretMetadata, revealSecret } from "@/lib/api/secrets";
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
        className={`w-full max-w-sm rounded-xl border p-3 text-xs transition-colors shadow-xs ${
          isDestroyed
            ? "border-destructive/30 bg-destructive/5 text-destructive dark:text-red-400"
            : isExpired
            ? "border-border bg-muted/40 text-muted-foreground"
            : isOwn
            ? "border-amber-400/40 bg-amber-500/10 text-amber-950 dark:text-amber-100"
            : "border-amber-500/30 bg-card text-foreground"
        }`}
      >
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex items-center gap-2 min-w-0">
            <span
              className={`p-1.5 rounded-lg shrink-0 ${
                isDestroyed
                  ? "bg-destructive/10 text-destructive dark:text-red-400"
                  : isExpired
                  ? "bg-muted text-muted-foreground"
                  : "bg-amber-500/20 text-amber-600 dark:text-amber-400"
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
              <p className="font-semibold truncate text-sm">{title}</p>
              <p className="text-[11px] opacity-80 truncate">
                {isDestroyed
                  ? "Burned & Destroyed"
                  : isExpired
                  ? "Expired without viewing"
                  : "One-Time IT Credential"}
              </p>
            </div>
          </div>

          <span
            className={`text-[10px] font-medium px-2 py-0.5 rounded-full shrink-0 ${
              isDestroyed
                ? "bg-destructive/15 text-destructive dark:text-red-400 font-semibold"
                : isExpired
                ? "bg-muted text-muted-foreground"
                : "bg-amber-500/20 text-amber-700 dark:text-amber-300"
            }`}
          >
            {isDestroyed ? "Burned" : isExpired ? "Expired" : "Active"}
          </span>
        </div>

        {isDestroyed ? (
          <div className="text-[11px] opacity-80 pt-1 border-t border-destructive/20 flex items-center justify-between">
            <span>
              {metadata?.viewed_at
                ? `Burned on ${new Date(metadata.viewed_at).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}`
                : "Erased from server"}
            </span>
            <span className="italic">Payload wiped</span>
          </div>
        ) : isExpired ? (
          <div className="text-[11px] text-muted-foreground pt-1 border-t border-border">
            <span>Expired. Contact IT to re-issue.</span>
          </div>
        ) : (
          <div className="pt-2 border-t border-amber-500/20 flex items-center justify-between gap-2">
            <span className="text-[11px] opacity-80 flex items-center gap-1">
              <Clock className="h-3 w-3" />
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

      {/* Reveal Credential Modal */}
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
                </div>
              )}

              <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg flex items-start gap-2 text-xs text-amber-800 dark:text-amber-300">
                <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
                <span>
                  Confirm you are ready to copy and save the login details now. The secret cannot be retrieved again after closing.
                </span>
              </div>

              <DialogFooter className="pt-2 flex items-center justify-between sm:justify-between">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setDialogOpen(false)}
                  disabled={revealing}
                  className="text-xs h-8"
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  size="sm"
                  onClick={handleReveal}
                  disabled={revealing || (hasPin && !pin.trim())}
                  className="text-xs h-8 gap-1.5"
                >
                  {revealing ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <KeyRound className="h-3.5 w-3.5" />
                  )}
                  <span>{revealing ? "Decrypting..." : "Decrypt & Copy"}</span>
                </Button>
              </DialogFooter>
            </div>
          ) : (
            <div className="space-y-3 py-2">
              {/* Username row */}
              {revealedData.username && (
                <div className="space-y-1">
                  <span className="text-[11px] text-muted-foreground font-medium">Username / Email:</span>
                  <div className="flex items-center justify-between gap-2 p-2 rounded-lg bg-muted border border-border">
                    <span className="font-mono text-xs select-all truncate text-foreground">
                      {revealedData.username}
                    </span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleCopyUsername(revealedData.username!)}
                      className="h-7 px-2 text-xs gap-1"
                    >
                      {copiedUsername ? (
                        <>
                          <Check className="h-3.5 w-3.5 text-emerald-600" />
                          <span className="text-emerald-600 font-medium">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="h-3.5 w-3.5" />
                          <span>Copy</span>
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              )}

              {/* Password row: strictly masked, never plain text on screen */}
              <div className="space-y-1">
                <span className="text-[11px] text-muted-foreground font-medium">Password:</span>
                <div className="flex items-center justify-between gap-2 p-2.5 rounded-lg bg-primary/10 border border-primary/20">
                  <div className="flex items-center gap-2 min-w-0">
                    <Lock className="h-4 w-4 text-primary shrink-0" />
                    <span className="font-mono text-sm tracking-widest text-foreground select-none">
                      ••••••••••••••••
                    </span>
                  </div>
                  <Button
                    type="button"
                    variant="default"
                    size="sm"
                    onClick={() => handleCopyPassword(revealedData.password)}
                    className="h-8 px-3 text-xs gap-1.5 font-semibold shrink-0 shadow-xs"
                  >
                    {copiedPassword ? (
                      <>
                        <Check className="h-3.5 w-3.5 text-primary-foreground stroke-[3]" />
                        <span>Password Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-3.5 w-3.5" />
                        <span>Click to Copy Password</span>
                      </>
                    )}
                  </Button>
                </div>
                <p className="text-[10px] text-muted-foreground italic px-0.5">
                  Hidden on screen to protect against screen-sharing and shoulder-surfing. Click the button to copy directly to your clipboard.
                </p>
              </div>

              {/* Notes */}
              {revealedData.notes && (
                <div className="space-y-1 pt-1">
                  <span className="text-[11px] text-muted-foreground font-medium">Notes from IT:</span>
                  <div className="p-2.5 rounded-lg bg-muted text-xs whitespace-pre-wrap text-foreground border border-border">
                    {revealedData.notes}
                  </div>
                </div>
              )}

              <div className="p-2.5 bg-destructive/10 border border-destructive/20 rounded-lg flex items-center gap-2 text-xs text-destructive dark:text-red-400">
                <Flame className="h-4 w-4 shrink-0" />
                <span className="font-medium text-[11px]">
                  This secret has been burned. The payload has been completely erased from the database.
                </span>
              </div>

              <DialogFooter className="pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setDialogOpen(false)}
                  className="w-full h-8 text-xs font-medium"
                >
                  Done
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
