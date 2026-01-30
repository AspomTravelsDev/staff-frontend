"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, Archive, Edit, Eye } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Client } from "@/lib/api/crm";

interface CRMTableProps {
  clients: Client[];
}

export function CRMTable({ clients }: CRMTableProps) {
  const getStatusVariant = (status: string) => {
    switch (status) {
      case "Customer":
        return "default"; // or custom 'success'
      case "Lead":
        return "secondary";
      case "Qualified":
        return "secondary"; // blue-ish
      case "Negotiation":
        return "outline";
      case "Lost":
        return "destructive";
      default:
        return "outline";
    }
  };

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Client / Company</TableHead>
            <TableHead>Contact Person</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Value</TableHead>
            <TableHead>Assigned To</TableHead>
            <TableHead>Last Contact</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {clients.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="h-24 text-center">
                No clients found.
              </TableCell>
            </TableRow>
          ) : (
            clients.map((client) => (
              <TableRow key={client.id}>
                <TableCell>
                  <div className="flex flex-col">
                    <span className="font-medium">{client.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {client.email}
                    </span>
                  </div>
                </TableCell>
                <TableCell>{client.contactPerson}</TableCell>
                <TableCell>
                  <Badge variant={getStatusVariant(client.status)}>
                    {client.status}
                  </Badge>
                </TableCell>
                <TableCell>{client.value}</TableCell>
                <TableCell>{client.assignedTo}</TableCell>
                <TableCell className="text-muted-foreground text-sm">
                  {client.lastContact}
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" />
                        <span className="sr-only">Open menu</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                      <DropdownMenuItem>
                        <Eye className="mr-2 h-4 w-4" /> View Details
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Edit className="mr-2 h-4 w-4" /> Edit
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="text-muted-foreground">
                        <Archive className="mr-2 h-4 w-4" /> Archive
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
