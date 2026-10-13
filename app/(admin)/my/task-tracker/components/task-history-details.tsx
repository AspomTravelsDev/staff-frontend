import { formatReadableDate } from "@/lib/utils/readable-date";

function DetailValues({ values }: { values: Record<string, unknown> }) {
  return Object.entries(values).filter(([key, value]) => value != null && value !== "" && !["before", "after"].includes(key) && !key.endsWith("_id")).map(([key, value]) => <p key={key} className="whitespace-pre-wrap break-words text-xs">
    <strong className="capitalize">{key.replaceAll("_", " ")}: </strong>
    {typeof value === "string" && /deadline|_at$|due_date/.test(key) && !Number.isNaN(Date.parse(value)) ? formatReadableDate(value) : Array.isArray(value) ? value.join(", ") : typeof value === "object" ? JSON.stringify(value) : String(value)}
  </p>);
}

export function TaskHistoryDetails({ type, details }: { type: string; details: Record<string, unknown> }) {
  const previous = details?.before;
  return <>
    <DetailValues values={details || {}} />
    {type === "reassigned" && previous && typeof previous === "object" && !Array.isArray(previous) ? <details className="pt-1">
      <summary className="cursor-pointer text-xs font-medium">Previous assignment details</summary>
      <div className="space-y-1 pt-2"><DetailValues values={previous as Record<string, unknown>} /></div>
    </details> : null}
  </>;
}
