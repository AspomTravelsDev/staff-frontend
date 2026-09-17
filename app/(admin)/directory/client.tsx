"use client";

import { useState } from "react";
import { Employee } from "@/lib/api/employees";
import { DepartmentalContact } from "@/lib/api/departmental-contacts";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Search,
  Mail,
  Phone,
  Smartphone,
  Building,
  Users,
  Copy,
  CalendarDays,
  IdCard,
  BriefcaseBusiness,
} from "lucide-react";
import { toProxiedImageUrl } from "@/lib/utils/image-url";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { differenceInMonths, format, parseISO } from "date-fns";

interface Props {
  initialEmployees: Employee[];
  initialDepartmentalContacts: DepartmentalContact[];
}

function getJoinDateLabel(joinDate: string | null) {
  if (!joinDate) return "Join date not provided";

  const parsedDate = parseISO(joinDate);
  if (Number.isNaN(parsedDate.getTime())) return "Join date not provided";

  return format(parsedDate, "d MMM yyyy");
}

function getTenureLabel(joinDate: string | null) {
  if (!joinDate) return null;

  const parsedDate = parseISO(joinDate);
  if (Number.isNaN(parsedDate.getTime())) return null;

  const months = Math.max(0, differenceInMonths(new Date(), parsedDate));
  if (months < 12) return `${months} month${months === 1 ? "" : "s"}`;

  const years = Math.floor(months / 12);
  const remainingMonths = months % 12;
  return `${years} year${years === 1 ? "" : "s"}${remainingMonths ? ` ${remainingMonths} month${remainingMonths === 1 ? "" : "s"}` : ""}`;
}

function getContractTypeLabel(contractType: string | null) {
  if (!contractType) return "Not provided";
  return contractType
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export function DirectoryClient({
  initialEmployees,
  initialDepartmentalContacts,
}: Props) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(
    null,
  );

  const copyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${type} copied to clipboard`);
  };

  const filteredEmployees = initialEmployees.filter((emp) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      emp.firstName.toLowerCase().includes(q) ||
      emp.lastName.toLowerCase().includes(q) ||
      emp.department?.toLowerCase().includes(q) ||
      emp.role?.toLowerCase().includes(q) ||
      emp.email?.toLowerCase().includes(q) ||
      emp.staff_id?.toLowerCase().includes(q) ||
      emp.phone?.toLowerCase().includes(q) ||
      emp.mobile_phone?.toLowerCase().includes(q)
    );
  });

  const filteredDeps = initialDepartmentalContacts.filter((dep) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      dep.department.toLowerCase().includes(q) ||
      dep.contact_name.toLowerCase().includes(q) ||
      dep.email?.toLowerCase().includes(q) ||
      dep.description?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4">
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search directory..."
            className="w-full pl-9 max-w-sm"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Users className="h-5 w-5 text-muted-foreground" />
            Staff Members
          </h2>
          <span className="text-sm text-muted-foreground">
            {filteredEmployees.length} found
          </span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredEmployees.map((emp) => (
            <Card
              key={emp.id}
              className="overflow-hidden hover:shadow-md transition-shadow"
            >
              <CardHeader className="pb-3 flex items-center gap-4 space-y-0 p-5 text-left">
                <Avatar className="h-14 w-14 border-2 shrink-0">
                  <AvatarImage
                    src={toProxiedImageUrl(emp.image_url)}
                    alt={`${emp.firstName} ${emp.lastName}`}
                    className="object-cover object-top"
                  />
                  <AvatarFallback className="text-lg">
                    {emp.firstName.charAt(0)}
                    {emp.lastName.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div className="space-y-0.5 flex-1 min-w-0 flex flex-col items-start text-left shrink">
                  <CardTitle className="text-base truncate w-full">
                    {emp.firstName} {emp.lastName}
                  </CardTitle>
                  <CardDescription className="line-clamp-1 text-xs">
                    {emp.role}
                  </CardDescription>
                  {emp.department && (
                    <div className="text-[11px] font-medium text-muted-foreground flex items-center justify-start gap-1 pt-1 w-full shrink-0">
                      <Building className="h-3 w-3 shrink-0" />
                      <span className="truncate">{emp.department}</span>
                    </div>
                  )}
                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    <span className="text-[11px] text-muted-foreground">
                      {emp.staff_id}
                    </span>
                    {emp.is_supervisor && (
                      <Badge
                        variant="secondary"
                        className="h-5 px-1.5 text-[10px]"
                      >
                        Supervisor
                      </Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="flex min-h-16 flex-col justify-center space-y-2 border-t bg-muted/20 p-3 pt-2 text-sm">
                {emp.email && (
                  <div className="flex items-center justify-between group">
                    <div className="flex items-center gap-2 text-muted-foreground truncate mr-2">
                      <Mail className="h-3.5 w-3.5 shrink-0" />
                      <a
                        href={`mailto:${emp.email}`}
                        className="truncate hover:text-primary transition-colors text-xs"
                      >
                        {emp.email}
                      </a>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 opacity-100 transition-opacity shrink-0 md:opacity-0 md:group-hover:opacity-100"
                      onClick={() => copyToClipboard(emp.email, "Email")}
                      title="Copy email"
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                )}
                {emp.phone && (
                  <div className="flex items-center justify-between group">
                    <div className="flex items-center gap-2 text-muted-foreground truncate mr-2">
                      <Phone className="h-3.5 w-3.5 shrink-0" />
                      <span className="text-[10px] text-muted-foreground/70">
                        Company
                      </span>
                      <a
                        href={`tel:${emp.phone}`}
                        className="hover:text-primary transition-colors text-xs"
                      >
                        {emp.phone}
                      </a>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 opacity-100 transition-opacity shrink-0 md:opacity-0 md:group-hover:opacity-100"
                      onClick={() => copyToClipboard(emp.phone, "Phone")}
                      title="Copy phone"
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                )}
                {emp.mobile_phone && (
                  <div className="flex items-center justify-between group">
                    <div className="flex items-center gap-2 text-muted-foreground truncate mr-2">
                      <Smartphone className="h-3.5 w-3.5 shrink-0" />
                      <span className="text-[10px] text-muted-foreground/70">
                        Mobile
                      </span>
                      <a
                        href={`tel:${emp.mobile_phone}`}
                        className="hover:text-primary transition-colors text-xs"
                      >
                        {emp.mobile_phone}
                      </a>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 opacity-100 transition-opacity shrink-0 md:opacity-0 md:group-hover:opacity-100"
                      onClick={() =>
                        copyToClipboard(emp.mobile_phone, "Mobile phone")
                      }
                      title="Copy mobile phone"
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                )}
                <div className="flex items-center justify-between gap-2 pt-1">
                  <span className="flex min-w-0 items-center gap-1.5 truncate text-[11px] text-muted-foreground">
                    <CalendarDays className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate">
                      Joined {getJoinDateLabel(emp.joinDate)}
                    </span>
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 shrink-0 text-xs"
                    onClick={() => setSelectedEmployee(emp)}
                  >
                    View details
                  </Button>
                </div>
                {!emp.email && !emp.phone && !emp.mobile_phone && (
                  <span className="text-muted-foreground/50 text-center w-full italic text-xs">
                    No contacts provided
                  </span>
                )}
              </CardContent>
            </Card>
          ))}
          {filteredEmployees.length === 0 && (
            <div className="col-span-full py-12 text-center text-muted-foreground border border-dashed rounded-lg bg-muted/5">
              No staff members found matching &quot;{searchQuery}&quot;
            </div>
          )}
        </div>
      </div>

      <Dialog
        open={Boolean(selectedEmployee)}
        onOpenChange={(open) => !open && setSelectedEmployee(null)}
      >
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          {selectedEmployee && (
            <>
              <DialogHeader className="pr-8">
                <div className="flex items-center gap-3">
                  <Avatar className="h-14 w-14 shrink-0 border-2">
                    <AvatarImage
                      src={toProxiedImageUrl(selectedEmployee.image_url)}
                      alt={`${selectedEmployee.firstName} ${selectedEmployee.lastName}`}
                      className="object-cover object-top"
                    />
                    <AvatarFallback className="text-lg">
                      {selectedEmployee.firstName.charAt(0)}
                      {selectedEmployee.lastName.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <DialogTitle className="truncate text-base">
                      {selectedEmployee.firstName} {selectedEmployee.lastName}
                    </DialogTitle>
                    <DialogDescription className="truncate">
                      {selectedEmployee.role}
                    </DialogDescription>
                  </div>
                </div>
              </DialogHeader>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-lg bg-muted/40 p-3">
                  <p className="flex items-center gap-2 text-[11px] text-muted-foreground">
                    <IdCard className="h-3.5 w-3.5" /> Staff ID
                  </p>
                  <p className="mt-1 font-medium">
                    {selectedEmployee.staff_id}
                  </p>
                </div>
                <div className="rounded-lg bg-muted/40 p-3">
                  <p className="flex items-center gap-2 text-[11px] text-muted-foreground">
                    <Building className="h-3.5 w-3.5" /> Department
                  </p>
                  <p className="mt-1 font-medium">
                    {selectedEmployee.department || "Not provided"}
                  </p>
                </div>
                <div className="rounded-lg bg-muted/40 p-3">
                  <p className="flex items-center gap-2 text-[11px] text-muted-foreground">
                    <BriefcaseBusiness className="h-3.5 w-3.5" /> Employment
                  </p>
                  <p className="mt-1 font-medium">
                    {getContractTypeLabel(selectedEmployee.contract_type)}
                  </p>
                </div>
                <div className="rounded-lg bg-muted/40 p-3">
                  <p className="flex items-center gap-2 text-[11px] text-muted-foreground">
                    <CalendarDays className="h-3.5 w-3.5" /> Tenure
                  </p>
                  <p className="mt-1 font-medium">
                    {getTenureLabel(selectedEmployee.joinDate) ||
                      "Not provided"}
                  </p>
                </div>
              </div>

              {selectedEmployee.secondary_roles &&
                selectedEmployee.secondary_roles.length > 0 && (
                  <div>
                    <p className="mb-2 text-xs font-medium text-muted-foreground">
                      Additional roles
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {selectedEmployee.secondary_roles.map((role) => (
                        <Badge key={role} variant="outline">
                          {role}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

              {selectedEmployee.is_supervisor && (
                <Badge variant="secondary" className="w-fit">
                  Supervisor
                </Badge>
              )}

              <div className="space-y-2 border-t pt-3">
                {selectedEmployee.email && (
                  <a
                    className="flex min-h-10 items-center gap-2 rounded-md px-2 text-sm hover:bg-muted"
                    href={`mailto:${selectedEmployee.email}`}
                  >
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    {selectedEmployee.email}
                  </a>
                )}
                {selectedEmployee.phone && (
                  <a
                    className="flex min-h-10 items-center gap-2 rounded-md px-2 text-sm hover:bg-muted"
                    href={`tel:${selectedEmployee.phone}`}
                  >
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    Company: {selectedEmployee.phone}
                  </a>
                )}
                {selectedEmployee.mobile_phone && (
                  <a
                    className="flex min-h-10 items-center gap-2 rounded-md px-2 text-sm hover:bg-muted"
                    href={`tel:${selectedEmployee.mobile_phone}`}
                  >
                    <Smartphone className="h-4 w-4 text-muted-foreground" />
                    Mobile: {selectedEmployee.mobile_phone}
                  </a>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      <Separator className="my-10" />

      <div className="space-y-6 pb-12">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Building className="h-5 w-5 text-muted-foreground" />
            Departmental Contacts
          </h2>
          <span className="text-sm text-muted-foreground">
            {filteredDeps.length} found
          </span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredDeps.map((dep) => (
            <Card key={dep.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="p-5 pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Building className="h-4 w-4 text-primary" />
                  {dep.department}
                </CardTitle>
                <CardDescription className="text-xs">
                  {dep.contact_name}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 p-5 pt-0">
                {dep.description && (
                  <p className="text-xs text-muted-foreground bg-muted/30 p-2.5 rounded-md">
                    {dep.description}
                  </p>
                )}
                <div className="space-y-1.5 text-sm">
                  {dep.email && (
                    <div className="flex items-center justify-between group">
                      <div className="flex items-center gap-2 text-muted-foreground truncate mr-2">
                        <Mail className="h-3.5 w-3.5 shrink-0" />
                        <a
                          href={`mailto:${dep.email}`}
                          className="truncate hover:text-primary transition-colors text-xs"
                        >
                          {dep.email}
                        </a>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                        onClick={() => copyToClipboard(dep.email!, "Email")}
                        title="Copy email"
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  )}
                  {dep.phone && (
                    <div className="flex items-center justify-between group">
                      <div className="flex items-center gap-2 text-muted-foreground truncate mr-2">
                        <Phone className="h-3.5 w-3.5 shrink-0" />
                        <a
                          href={`tel:${dep.phone}`}
                          className="hover:text-primary transition-colors text-xs"
                        >
                          {dep.phone}
                        </a>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                        onClick={() => copyToClipboard(dep.phone!, "Phone")}
                        title="Copy phone"
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
          {filteredDeps.length === 0 && (
            <div className="col-span-full py-12 text-center text-muted-foreground border border-dashed rounded-lg bg-muted/5">
              No departmental contacts found matching &quot;{searchQuery}&quot;
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
