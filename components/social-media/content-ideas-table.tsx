"use client";

import { useState } from "react";
import { Lightbulb, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { ContentIdea } from "@/types/content-collections";
import { ContentCopyButton } from "./content-copy-button";

export function ContentIdeasTable({ ideas, onEdit, copyable = false, showFullDescriptions = false, copyContext }: { ideas: ContentIdea[]; onEdit?: (idea: ContentIdea) => void; copyable?: boolean; showFullDescriptions?: boolean; copyContext?: { staff: string; theme: string } }) {
  const [expanded, setExpanded] = useState<string[]>([]);
  if (!ideas.length) return <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed px-4 py-8 text-center"><Lightbulb className="size-6 text-muted-foreground/60" /><p className="text-sm font-medium">No ideas submitted yet</p><p className="text-xs text-muted-foreground">Submitted ideas will appear here.</p></div>;
  return <div className="min-w-0 overflow-hidden rounded-lg border"><Table className="table-fixed">
    <TableHeader className="bg-muted/40"><TableRow><TableHead className="w-9 pl-3">#</TableHead><TableHead className="w-[32%]">Idea</TableHead><TableHead>Description</TableHead>{(onEdit || copyable) && <TableHead className="w-24 text-right">Actions</TableHead>}</TableRow></TableHeader>
    <TableBody>{ideas.map((idea, index) => <TableRow key={idea.id}><TableCell className="pl-3 align-top text-xs text-muted-foreground">{index + 1}</TableCell><TableCell className="align-top text-sm font-medium [overflow-wrap:anywhere]"><div className="flex items-start gap-1"><span className="min-w-0 flex-1">{idea.title}</span>{copyable && <ContentCopyButton text={idea.title} label={`Copy title: ${idea.title}`} iconOnly />}</div></TableCell>
      <TableCell className="align-top"><div className="flex items-start gap-1"><p className={`min-w-0 flex-1 whitespace-pre-wrap text-xs leading-relaxed text-muted-foreground [overflow-wrap:anywhere] ${showFullDescriptions || expanded.includes(idea.id) ? "" : "line-clamp-3"}`}>{idea.description}</p>{copyable && <ContentCopyButton text={idea.description} label={`Copy description: ${idea.title}`} iconOnly />}</div>{!showFullDescriptions && (idea.description.length > 180 || idea.description.split("\n").length > 3) && <button type="button" className="mt-1 text-xs font-medium text-primary hover:underline" onClick={() => setExpanded(current => current.includes(idea.id) ? current.filter(id => id !== idea.id) : [...current, idea.id])}>{expanded.includes(idea.id) ? "Show less" : "Read more"}</button>}</TableCell>
      {(onEdit || copyable) && <TableCell className="text-right align-top"><div className="flex justify-end gap-1">{copyable && <ContentCopyButton rows={[copyContext ? [copyContext.staff, copyContext.theme, idea.title, idea.description] : [idea.title, idea.description]]} label={`Copy row: ${idea.title}`} iconOnly />}{onEdit && <Button variant="ghost" size="icon-sm" onClick={() => onEdit(idea)} aria-label={`Edit ${idea.title}`}><Pencil className="size-3.5" /></Button>}</div></TableCell>}
    </TableRow>)}</TableBody>
  </Table></div>;
}
