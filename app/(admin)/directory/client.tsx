"use client";

import { useState } from "react";
import { Employee } from "@/lib/api/employees";
import { DepartmentalContact } from "@/lib/api/departmental-contacts";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Search, Mail, Phone, Building, Users, Copy } from "lucide-react";
import { toProxiedImageUrl } from "@/lib/utils/image-url";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface Props {
    initialEmployees: Employee[];
    initialDepartmentalContacts: DepartmentalContact[];
}

export function DirectoryClient({ initialEmployees, initialDepartmentalContacts }: Props) {
    const [searchQuery, setSearchQuery] = useState("");

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
            emp.email?.toLowerCase().includes(q)
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
                    <span className="text-sm text-muted-foreground">{filteredEmployees.length} found</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {filteredEmployees.map((emp) => (
                        <Card key={emp.id} className="overflow-hidden hover:shadow-md transition-shadow">
                            <CardHeader className="pb-3 flex items-center gap-4 space-y-0 p-5 text-left">
                                <Avatar className="h-14 w-14 border-2 shrink-0">
                                    <AvatarImage src={toProxiedImageUrl(emp.image_url)} alt={`${emp.firstName} ${emp.lastName}`} className="object-cover object-top" />
                                    <AvatarFallback className="text-lg">
                                        {emp.firstName.charAt(0)}{emp.lastName.charAt(0)}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="space-y-0.5 flex-1 min-w-0 flex flex-col items-start text-left shrink">
                                    <CardTitle className="text-base truncate w-full">
                                        {emp.firstName} {emp.lastName}
                                    </CardTitle>
                                    <CardDescription className="line-clamp-1 text-xs">{emp.role}</CardDescription>
                                    {emp.department && (
                                        <div className="text-[11px] font-medium text-muted-foreground flex items-center justify-start gap-1 pt-1 w-full shrink-0">
                                            <Building className="h-3 w-3 shrink-0" />
                                            <span className="truncate">{emp.department}</span>
                                        </div>
                                    )}
                                </div>
                            </CardHeader>
                            <CardContent className="p-3 pt-0 text-sm space-y-2 bg-muted/20 border-t flex flex-col justify-center min-h-16">
                                {emp.email && (
                                    <div className="flex items-center justify-between group">
                                        <div className="flex items-center gap-2 text-muted-foreground truncate mr-2">
                                            <Mail className="h-3.5 w-3.5 shrink-0" />
                                            <a href={`mailto:${emp.email}`} className="truncate hover:text-primary transition-colors text-xs">
                                                {emp.email}
                                            </a>
                                        </div>
                                        <Button 
                                            variant="ghost" 
                                            size="icon" 
                                            className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" 
                                            onClick={() => copyToClipboard(emp.email, 'Email')}
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
                                            <a href={`tel:${emp.phone}`} className="hover:text-primary transition-colors text-xs">
                                                {emp.phone}
                                            </a>
                                        </div>
                                        <Button 
                                            variant="ghost" 
                                            size="icon" 
                                            className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" 
                                            onClick={() => copyToClipboard(emp.phone, 'Phone')}
                                            title="Copy phone"
                                        >
                                            <Copy className="h-3 w-3" />
                                        </Button>
                                    </div>
                                )}
                                {!emp.email && !emp.phone && (
                                    <span className="text-muted-foreground/50 text-center w-full italic text-xs">No contacts provided</span>
                                )}
                            </CardContent>
                        </Card>
                    ))}
                    {filteredEmployees.length === 0 && (
                        <div className="col-span-full py-12 text-center text-muted-foreground border border-dashed rounded-lg bg-muted/5">
                            No staff members found matching "{searchQuery}"
                        </div>
                    )}
                </div>
            </div>

            <Separator className="my-10" />

            <div className="space-y-6 pb-12">
                <div className="flex justify-between items-center">
                    <h2 className="text-xl font-semibold flex items-center gap-2">
                        <Building className="h-5 w-5 text-muted-foreground" />
                        Departmental Contacts
                    </h2>
                    <span className="text-sm text-muted-foreground">{filteredDeps.length} found</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredDeps.map((dep) => (
                        <Card key={dep.id} className="hover:shadow-md transition-shadow">
                            <CardHeader className="p-5 pb-3">
                                <CardTitle className="flex items-center gap-2 text-base">
                                    <Building className="h-4 w-4 text-primary" />
                                    {dep.department}
                                </CardTitle>
                                <CardDescription className="text-xs">{dep.contact_name}</CardDescription>
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
                                                <a href={`mailto:${dep.email}`} className="truncate hover:text-primary transition-colors text-xs">
                                                    {dep.email}
                                                </a>
                                            </div>
                                            <Button 
                                                variant="ghost" 
                                                size="icon" 
                                                className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" 
                                                onClick={() => copyToClipboard(dep.email!, 'Email')}
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
                                                <a href={`tel:${dep.phone}`} className="hover:text-primary transition-colors text-xs">
                                                    {dep.phone}
                                                </a>
                                            </div>
                                            <Button 
                                                variant="ghost" 
                                                size="icon" 
                                                className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" 
                                                onClick={() => copyToClipboard(dep.phone!, 'Phone')}
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
                            No departmental contacts found matching "{searchQuery}"
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
