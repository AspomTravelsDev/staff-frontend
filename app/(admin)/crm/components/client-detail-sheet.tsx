"use client";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Client, CRMStatus } from "@/lib/api/crm-constants";
import {
  Mail,
  Phone,
  User,
  Briefcase,
  Globe,
  CalendarDays,
  UserCheck,
  FileText,
  ClipboardList,
} from "lucide-react";

interface ClientDetailSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  client: Client | null;
}

const STATUS_COLORS: Record<CRMStatus, string> = {
  potential: "bg-blue-100 text-blue-800 border-blue-200",
  follow_up: "bg-amber-100 text-amber-800 border-amber-200",
  negotiation: "bg-orange-100 text-orange-800 border-orange-200",
  paid: "bg-green-100 text-green-800 border-green-200",
  inactive: "bg-gray-100 text-gray-500 border-gray-200",
};

function DetailRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value?: string | null;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="mt-0.5 text-muted-foreground">
        <Icon className="h-4 w-4" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-medium wrap-break-word">
          {value || <span className="text-muted-foreground italic">—</span>}
        </p>
      </div>
    </div>
  );
}

export function ClientDetailSheet({
  open,
  onOpenChange,
  client,
}: ClientDetailSheetProps) {
  if (!client) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-[480px] overflow-y-auto p-6">
        <SheetHeader className="pb-4">
          <div className="flex items-start justify-between gap-2">
            <div>
              <SheetTitle className="text-xl">{client.name}</SheetTitle>
              <p className="text-sm text-muted-foreground mt-0.5">
                ID: {client.id}
              </p>
            </div>
            <Badge
              className={`shrink-0 mt-1 border ${STATUS_COLORS[client.status]}`}
              variant="outline"
            >
              {client.status}
            </Badge>
          </div>
        </SheetHeader>

        <div className="grid gap-5">
          {/* Contact Info */}
          <div>
            <h3 className="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wide">
              Contact Information
            </h3>
            <div className="grid gap-3">
              <DetailRow
                icon={User}
                label="Contact Person"
                value={client.contactPerson}
              />
              <DetailRow icon={CalendarDays} label="Date of Birth" value={client.dateOfBirth} />
              <DetailRow icon={Mail} label="Email" value={client.email} />
              <DetailRow icon={Phone} label="Phone" value={client.phone} />
            </div>
          </div>

          <Separator />

          {/* Service Details */}
          <div>
            <h3 className="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wide">
              Service Details
            </h3>
            <div className="grid gap-3">
              <DetailRow
                icon={Briefcase}
                label="Service"
                value={client.service}
              />
              <DetailRow
                icon={Globe}
                label="Source / How They Found Us"
                value={client.source}
              />
              <DetailRow
                icon={UserCheck}
                label="Assigned To"
                value={client.assignedTo}
              />
            </div>
          </div>

          <Separator />

          {/* Timeline */}
          <div>
            <h3 className="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wide">
              Timeline
            </h3>
            <div className="grid gap-3">
              <DetailRow
                icon={CalendarDays}
                label="Last Contact"
                value={client.lastContact}
              />
              <DetailRow
                icon={ClipboardList}
                label="Date Added"
                value={client.createdAt}
              />
              <DetailRow
                icon={User}
                label="Added By"
                value={client.createdBy}
              />
            </div>
          </div>

          {client.notes && (
            <>
              <Separator />
              <div>
                <h3 className="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wide">
                  Notes
                </h3>
                <div className="flex items-start gap-3">
                  <FileText className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
                  <p className="text-sm leading-relaxed">{client.notes}</p>
                </div>
              </div>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
