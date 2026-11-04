'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowRight, Megaphone, Newspaper, Plus } from 'lucide-react';
import type { AnnouncementItem, AnnouncementType } from '@/lib/api/announcements';
import type { PaginationMeta } from '@/lib/api/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DetailsTableRow } from '@/components/ui/details-table-row';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AnnouncementForm } from '@/app/(admin)/my/announcement/components/announcement-form';

const dateFormat = new Intl.DateTimeFormat('en-GB', { timeZone: 'Africa/Lagos', day: '2-digit', month: 'short', year: 'numeric' });

export function AnnouncementsTable({ announcements, pagination, type }: {
  announcements: AnnouncementItem[];
  pagination: PaginationMeta;
  type?: AnnouncementType;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [formOpen, setFormOpen] = useState(false);
  function navigate(page: number, nextType: AnnouncementType | 'all' = type || 'all') {
    const params = new URLSearchParams();
    if (nextType !== 'all') params.set('type', nextType);
    if (page > 1) params.set('page', String(page));
    startTransition(() => router.push(`/announcements${params.size ? `?${params}` : ''}`));
  }

  return <div className="flex flex-1 flex-col gap-6 p-4 pt-0" aria-busy={pending}>
    <header className="flex flex-wrap items-start justify-between gap-4">
      <div><h1 className="text-2xl font-bold">Announcements & Newsletters</h1><p className="mt-1 text-sm text-muted-foreground">Company updates and newsletters. Open an announcement to read it in full.</p></div>
      <div className="flex flex-wrap gap-2"><Button variant="outline" asChild><Link href="/my/announcement">My submissions</Link></Button><Button onClick={() => setFormOpen(true)}><Plus className="size-4" />New submission</Button></div>
    </header>
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-card p-3 sm:p-4">
      <p className="text-sm text-muted-foreground">{pagination.total} published {pagination.total === 1 ? 'update' : 'updates'}</p>
      <div className="flex items-center gap-2"><label htmlFor="announcement-type" className="text-sm font-medium">Type</label><Select value={type || 'all'} disabled={pending} onValueChange={value => navigate(1, value as AnnouncementType | 'all')}><SelectTrigger id="announcement-type" className="w-44"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All updates</SelectItem><SelectItem value="announcement">Announcements</SelectItem><SelectItem value="newsletter">Newsletters</SelectItem></SelectContent></Select></div>
    </div>
    <div className="rounded-xl border bg-card">
      <Table>
        <TableHeader><TableRow><TableHead className="px-4">Announcement</TableHead><TableHead>Type</TableHead><TableHead>Priority</TableHead><TableHead>Author</TableHead><TableHead>Published</TableHead><TableHead className="w-12"><span className="sr-only">Open announcement</span></TableHead></TableRow></TableHeader>
        <TableBody>
          {announcements.map(item => {
            const href = `/announcements/${encodeURIComponent(item.id)}`;
            const TypeIcon = item.type === 'newsletter' ? Newspaper : Megaphone;
            const date = new Date(item.published_at || item.publish_at || item.created_at);
            return <DetailsTableRow key={item.id} detailLabel={`Read ${item.title}`} onOpenDetails={() => router.push(href)}>
              <TableCell className="min-w-60 max-w-lg px-4 py-3"><Link href={href} className="font-medium underline-offset-4 hover:underline focus-visible:underline">{item.title}</Link></TableCell>
              <TableCell><span className="inline-flex items-center gap-2 whitespace-nowrap"><TypeIcon className="size-4 text-muted-foreground" />{item.type === 'newsletter' ? 'Newsletter' : 'Announcement'}</span></TableCell>
              <TableCell><Badge variant={item.priority === 'urgent' ? 'destructive' : item.priority === 'high' ? 'default' : 'secondary'} className="capitalize">{item.priority}</Badge></TableCell>
              <TableCell className="min-w-36">{item.author_name || '—'}</TableCell>
              <TableCell className="whitespace-nowrap text-muted-foreground">{Number.isNaN(date.getTime()) ? '—' : dateFormat.format(date)}</TableCell>
              <TableCell><ArrowRight className="size-4 text-muted-foreground" aria-hidden="true" /></TableCell>
            </DetailsTableRow>;
          })}
          {!announcements.length && <TableRow><TableCell colSpan={6} className="h-36 text-center text-muted-foreground">No published {type === 'newsletter' ? 'newsletters' : type === 'announcement' ? 'announcements' : 'updates'} yet.</TableCell></TableRow>}
        </TableBody>
      </Table>
    </div>
    <div className="flex flex-wrap items-center justify-between gap-3 text-sm"><span className="text-muted-foreground">Page {pagination.page} of {Math.max(1, pagination.total_pages)}</span><div className="flex gap-2"><Button variant="outline" disabled={pending || pagination.page <= 1} onClick={() => navigate(pagination.page - 1)}>Previous</Button><Button variant="outline" disabled={pending || pagination.page >= pagination.total_pages} onClick={() => navigate(pagination.page + 1)}>Next</Button></div></div>
    <AnnouncementForm open={formOpen} onOpenChange={setFormOpen} />
  </div>;
}
