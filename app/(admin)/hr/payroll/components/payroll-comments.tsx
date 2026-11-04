"use client";

import { useEffect, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { History, MessageSquarePlus, RefreshCw, Search, X } from "lucide-react";
import { toast } from "sonner";
import { getPayrollComments, postPayrollComment, readPayrollComments, type PayrollComment, type PayrollCommentRecipient, type PayrollRun } from "@/lib/api/payroll";
import { useRoleNotifications } from "@/lib/api/hooks/use-notifications";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useUser } from "@/providers/user-provider";
import { userHasAnyRole } from "@/types/user-types";

const stageLabel = (stage: string) => ({ draft: "HR draft", hr_draft: "HR draft", account_review: "Accounts review", compliance_review: "Compliance review", mp_review: "MP review", md_approval: "MD approval", closed: "Closed", processing: "Processing" }[stage] || stage);
const roleLabel = (role: string) => ({ hr: "HR", account: "Accounts", compliance: "Compliance", mp: "MP", md: "MD", super: "Super Admin" }[role] || role);

export function PayrollComments({ run, defaultOpen = false }: { run: PayrollRun; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  const [composerOpen, setComposerOpen] = useState(false);
  const [recipient, setRecipient] = useState<PayrollCommentRecipient | "">("");
  const [body, setBody] = useState("");
  const [kind, setKind] = useState<PayrollComment["kind"]>("comment");
  const [sending, setSending] = useState(false);
  const [older, setOlder] = useState<PayrollComment[]>([]);
  const [hasOlder, setHasOlder] = useState<boolean | null>(null);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [search, setSearch] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const searchRef = useRef("");
  useEffect(() => {
    const timer = window.setTimeout(() => setSearchTerm(search.trim()), 250);
    return () => window.clearTimeout(timer);
  }, [search]);
  const readThrough = useRef(0);
  const client = useQueryClient();
  const { user } = useUser();
  const { data: notifications } = useRoleNotifications();
  const allowed = !!user && userHasAnyRole(user, ["hr", "account", "compliance", "mp", "md", "super"]);
  const query = useQuery({
    queryKey: ["payroll-comments", run.id, searchTerm], enabled: (open || composerOpen) && allowed,
    refetchInterval: open ? 30000 : false,
    queryFn: async () => {
      const result = await getPayrollComments(run.id, undefined, searchTerm);
      if (!result.success) throw new Error(result.error.error || "Unable to load comments.");
      return result.data;
    },
  });
  const latest = query.data?.data.at(-1)?.id;
  useEffect(() => {
    if (!allowed || !open || !latest || query.isFetching || query.isError || search.trim() || searchTerm) return;
    let cancelled = false;
    const markRead = async () => {
      if (document.visibilityState !== "visible" || readThrough.current >= latest) return;
      const result = await readPayrollComments(run.id, latest);
      if (!cancelled && result.success) {
        readThrough.current = latest;
        void client.invalidateQueries({ queryKey: ["notifications"] });
      }
    };
    void markRead();
    document.addEventListener("visibilitychange", markRead);
    return () => { cancelled = true; document.removeEventListener("visibilitychange", markRead); };
  }, [allowed, open, latest, run.id, client, query.isFetching, query.isError, search, searchTerm]);

  if (!user) return null;
  const notification = notifications?.payrollComments;
  const unread = typeof notification === "object" ? notification.payroll_items?.find(item => item.id === run.id)?.count ?? 0 : 0;
  const searching = search.trim() !== searchTerm;
  const comments = !allowed || searching ? [] : [...new Map([...older, ...(query.data?.data ?? [])].map(comment => [comment.id, comment])).values()].sort((a, b) => a.id - b.id);
  const history = (run.approval_history ?? []).map((item, index) => ({
    id: -index - 1, run_id: run.id, user_id: item.actor_id,
    author_name: item.actor_name, author_role: item.actor_role, stage: item.to_status,
    recipient_role: null,
    kind: "comment" as const, body: `${stageLabel(item.from_status)} → ${stageLabel(item.to_status)}${item.note ? `\n${item.note}` : ""}`,
    created_at: item.created_at, action: item.action,
  })).filter(item => !search.trim() || [item.author_name, item.body, item.action === "advance" ? "Advanced" : "Sent back to HR"].some(text => text.toLocaleLowerCase().includes(search.trim().toLocaleLowerCase())));
  const activity = [...comments.map(comment => ({ ...comment, action: null })), ...history]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime() || b.id - a.id);
  const canComment = allowed && query.data?.can_comment && !["closed", "processing"].includes(run.status);

  async function loadOlder() {
    const first = comments[0]?.id;
    if (!first) return;
    setLoadingOlder(true);
    const currentSearch = searchRef.current;
    try {
      const result = await getPayrollComments(run.id, first, searchTerm);
      if (!result.success) throw new Error(result.error.error || "Unable to load older comments.");
      if (searchRef.current !== currentSearch) return;
      setOlder(current => [...result.data.data, ...current]);
      setHasOlder(result.data.has_more);
    } catch (error) { toast.error(error instanceof Error ? error.message : "Unable to load older comments."); }
    finally { setLoadingOlder(false); }
  }

  async function send(event: React.FormEvent) {
    event.preventDefault();
    if (!body.trim() || !recipient || !canComment || sending) return;
    setSending(true);
    try {
      const result = await postPayrollComment(run.id, body.trim(), kind, recipient);
      if (!result.success) throw new Error(result.error.error || "Unable to send comment.");
      // Keep the posted message visible even if refreshing the thread fails.
      if (!searchRef.current) setOlder(current => [...current, result.data.data]);
      setBody("");
      setKind("comment");
      setRecipient("");
      setComposerOpen(false);
      toast.success("Comment sent.");
      await client.invalidateQueries({ queryKey: ["payroll-comments", run.id] });
    } catch (error) { toast.error(error instanceof Error ? error.message : "Unable to send comment."); }
    finally { setSending(false); }
  }

  function changeSearch(value: string) {
    searchRef.current = value.trim();
    setSearch(value);
    setOlder([]);
    setHasOlder(null);
  }

  return <><Sheet open={open} onOpenChange={setOpen}>
    <SheetTrigger asChild><Button type="button" variant="ghost" size="sm" className="gap-1.5" data-payroll-tour="comments"><History className="size-3.5" />Log & comments{unread > 0 && <span className="min-w-5 rounded-full bg-red-500 px-1.5 text-xs font-semibold text-white">{unread}</span>}</Button></SheetTrigger>
    <SheetContent className="w-full gap-0 sm:max-w-xl">
      <SheetHeader className="border-b pr-12"><SheetTitle>Payroll activity</SheetTitle><SheetDescription>{run.payroll_month} · {stageLabel(run.status)} · Most recent first</SheetDescription></SheetHeader>
      <div className="border-b px-4 py-3"><div className="relative"><Search className="pointer-events-none absolute left-3 top-3 size-4 text-muted-foreground" /><Input aria-label="Search payroll activity" placeholder="Search activity or names…" value={search} onChange={event => changeSearch(event.target.value)} maxLength={100} className="pl-9 pr-9" />{search && <Button type="button" variant="ghost" size="icon" className="absolute right-0 top-0 size-10" aria-label="Clear activity search" onClick={() => changeSearch("")}><X className="size-4" /></Button>}</div></div>
      <div className="min-h-0 flex-1 overflow-y-auto px-4" aria-busy={query.isFetching}>
        {allowed && <div className="flex justify-end py-1"><Button size="sm" variant="ghost" disabled={query.isFetching} onClick={() => void query.refetch()}><RefreshCw className="mr-2 size-3.5" />Refresh comments</Button></div>}
        {allowed && (query.isPending || searching) && <p className="py-6 text-sm text-muted-foreground" role="status">Loading comments…</p>}
        {query.isError && <p className="py-4 text-sm text-destructive" role="alert">{query.error.message} Use Refresh to try again.</p>}
        {(!allowed || !query.isPending) && !query.isError && !searching && activity.length === 0 && <div className="py-8"><p className="text-sm font-medium">{searchTerm ? "No matching activity" : "No activity yet"}</p><p className="mt-1 text-sm text-muted-foreground">{searchTerm ? "Try another name or phrase, or clear the search." : "Comments and approval changes will appear here."}</p></div>}
        <ol className="divide-y">{activity.map(comment => <li key={comment.id} className="py-3">
          <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1"><p className="text-sm font-medium">{comment.author_name} <span className="font-normal text-muted-foreground">· {roleLabel(comment.author_role)}</span></p><time className="text-xs text-muted-foreground" dateTime={comment.created_at}>{new Date(comment.created_at).toLocaleString("en-NG", { dateStyle: "medium", timeStyle: "short" })}</time></div>
          <p className="mt-1 text-xs text-muted-foreground">{comment.action ? comment.action === "advance" ? "Advanced payroll" : "Sent back to HR" : comment.kind === "revision" ? "Revision comment" : "Comment"} · {stageLabel(comment.stage)}{comment.recipient_role && ` · To: ${roleLabel(comment.recipient_role)}`}</p>
          <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-relaxed [overflow-wrap:anywhere]">{comment.body}</p>
        </li>)}</ol>
        {!searching && (hasOlder ?? query.data?.has_more) && <Button variant="outline" size="sm" className="my-3" disabled={loadingOlder} onClick={() => void loadOlder()}>{loadingOlder ? "Loading…" : "Load earlier comments"}</Button>}
      </div>
      {query.data && !canComment && <p className="border-t p-4 text-sm text-muted-foreground">This payroll is read-only.</p>}
    </SheetContent>
  </Sheet>
    {allowed && !user.is_department_account && !["closed", "processing"].includes(run.status) && <Dialog open={composerOpen} onOpenChange={value => { if (!sending) setComposerOpen(value); }}>
      <DialogTrigger asChild><Button type="button" variant="outline" size="sm" className="gap-1.5"><MessageSquarePlus className="size-3.5" />Add comment</Button></DialogTrigger>
      <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto sm:max-w-lg" showCloseButton={!sending}>
        <DialogHeader><DialogTitle>Add payroll comment</DialogTitle><DialogDescription>{run.payroll_month} · Choose who to notify. Comments remain visible to payroll reviewers.</DialogDescription></DialogHeader>
        <form onSubmit={send} className="space-y-4">
          <fieldset disabled={sending} className="space-y-4 disabled:opacity-60">
            <div className="grid gap-2"><Label htmlFor={`payroll-recipient-${run.id}`}>To</Label><select id={`payroll-recipient-${run.id}`} required value={recipient} onChange={event => setRecipient(event.target.value as PayrollCommentRecipient)} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"><option value="" disabled>Select a recipient</option><option value="hr">HR</option><option value="account">Accounts</option><option value="compliance">Compliance</option><option value="mp">MP</option><option value="md">MD</option></select></div>
            <div className="grid gap-2"><Label htmlFor={`payroll-kind-${run.id}`}>Message type</Label><select id={`payroll-kind-${run.id}`} value={kind} onChange={event => setKind(event.target.value as PayrollComment["kind"])} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"><option value="comment">Comment</option><option value="revision">Revision comment</option></select></div>
            <div className="grid gap-2"><Label htmlFor={`payroll-comment-${run.id}`}>Comment</Label><Textarea id={`payroll-comment-${run.id}`} required value={body} onChange={event => setBody(event.target.value)} maxLength={5000} rows={5} placeholder="Describe an adjustment or reply to a review…" /></div>
          </fieldset>
          {query.isPending && <p role="status" className="text-sm text-muted-foreground">Checking comment access…</p>}
          {query.isError && <div role="alert" className="text-sm text-destructive">Unable to check comment access. <Button type="button" variant="outline" size="sm" onClick={() => void query.refetch()}>Retry</Button></div>}
          {query.data && !canComment && <p role="alert" className="text-sm text-muted-foreground">This payroll is read-only.</p>}
          <p className="text-xs text-muted-foreground">Notifies active users with the selected role. Keeps the current stage.</p>
          <DialogFooter><Button type="button" variant="outline" disabled={sending} onClick={() => setComposerOpen(false)}>Cancel</Button><Button type="submit" disabled={sending || !body.trim() || !recipient || !canComment || query.isError}>{sending ? "Sending…" : "Send comment"}</Button></DialogFooter>
        </form>
      </DialogContent>
    </Dialog>}
  </>;
}
