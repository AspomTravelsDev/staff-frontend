import { formatReadableDate } from "@/lib/utils/readable-date";
import { getProxiedImageUrl } from "@/lib/utils";

function DetailValues({ values }: { values: Record<string, unknown> }) {
  return Object.entries(values).filter(([key, value]) => value != null && value !== "" && !["before", "after", "attachments"].includes(key) && !key.endsWith("_id")).map(([key, value]) => <p key={key} className="whitespace-pre-wrap break-words text-xs">
    <strong className="capitalize">{key.replaceAll("_", " ")}: </strong>
    {typeof value === "string" && /deadline|_at$|due_date/.test(key) && !Number.isNaN(Date.parse(value)) ? formatReadableDate(value) : Array.isArray(value) ? value.join(", ") : typeof value === "object" ? JSON.stringify(value) : String(value)}
  </p>);
}

function AttachmentLinks({ value }: { value: unknown }) {
  if (!Array.isArray(value) || value.length === 0) return null;
  return <div className="space-y-1"><p className="text-xs font-medium">Proof of work</p>{value.map((file, index) => {
    if (!file || typeof file !== "object") return null;
    const item = file as { id?: string; name?: string; download_url?: string };
    return item.download_url ? <a key={item.id || index} href={getProxiedImageUrl(item.download_url)} target="_blank" rel="noopener noreferrer" className="block break-all text-xs text-emerald-700 underline">{item.name || "Open attachment"}</a> : null;
  })}</div>;
}

export function TaskHistoryDetails({ type, details }: { type: string; details: Record<string, unknown> }) {
  const previous = details?.before;
  return <>
    <DetailValues values={details || {}} />
    <AttachmentLinks value={details?.attachments} />
    {type === "reassigned" && previous && typeof previous === "object" && !Array.isArray(previous) ? <details className="pt-1">
      <summary className="cursor-pointer text-xs font-medium">Previous assignment details</summary>
      <div className="space-y-1 pt-2"><DetailValues values={previous as Record<string, unknown>} /><AttachmentLinks value={(previous as Record<string, unknown>).submission_attachments} /></div>
    </details> : null}
  </>;
}
