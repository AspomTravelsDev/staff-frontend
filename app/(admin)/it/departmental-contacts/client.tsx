"use client";

import { useState } from "react";
import { DepartmentalContact, createDepartmentalContact, updateDepartmentalContact, deleteDepartmentalContact } from "@/lib/api/departmental-contacts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { PlusCircle, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Label } from "@/components/ui/label";

interface Props {
    initialContacts: DepartmentalContact[];
}

export function DepartmentalContactsClient({ initialContacts }: Props) {
    const [contacts, setContacts] = useState<DepartmentalContact[]>(initialContacts);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingContact, setEditingContact] = useState<DepartmentalContact | null>(null);
    const [formData, setFormData] = useState<Partial<DepartmentalContact>>({
        department: "",
        contact_name: "",
        email: "",
        phone: "",
        description: "",
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleOpenDialog = (contact?: DepartmentalContact) => {
        if (contact) {
            setEditingContact(contact);
            setFormData({ ...contact });
        } else {
            setEditingContact(null);
            setFormData({
                department: "",
                contact_name: "",
                email: "",
                phone: "",
                description: "",
            });
        }
        setIsDialogOpen(true);
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        
        try {
            setIsSubmitting(true);
            if (editingContact) {
                const updated = await updateDepartmentalContact(editingContact.id, formData);
                setContacts((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
                toast.success("Contact updated successfully");
            } else {
                const created = await createDepartmentalContact(formData);
                setContacts((prev) => [...prev, created]);
                toast.success("Contact created successfully");
            }
            setIsDialogOpen(false);
        } catch (error: any) {
            toast.error(error.message || "Something went wrong.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm("Are you sure you want to delete this contact?")) return;

        try {
            await deleteDepartmentalContact(id);
            setContacts((prev) => prev.filter((c) => c.id !== id));
            toast.success("Contact deleted");
        } catch (error: any) {
            toast.error(error.message || "Failed to delete contact");
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex justify-end">
                <Button onClick={() => handleOpenDialog()}>
                    <PlusCircle className="h-4 w-4 mr-2" />
                    Add Contact
                </Button>
            </div>

            <div className="border rounded-md">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Department</TableHead>
                            <TableHead>Contact Name</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Phone</TableHead>
                            <TableHead className="w-[100px]">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {contacts.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center h-24 text-muted-foreground">
                                    No departmental contacts found. Create one.
                                </TableCell>
                            </TableRow>
                        ) : (
                            contacts.map((contact) => (
                                <TableRow key={contact.id}>
                                    <TableCell className="font-medium">{contact.department}</TableCell>
                                    <TableCell>{contact.contact_name}</TableCell>
                                    <TableCell>{contact.email || "-"}</TableCell>
                                    <TableCell>{contact.phone || "-"}</TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <Button
                                                variant="outline"
                                                size="icon"
                                                onClick={() => handleOpenDialog(contact)}
                                                className="h-8 w-8"
                                            >
                                                <Pencil className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="destructive"
                                                size="icon"
                                                onClick={() => handleDelete(contact.id)}
                                                className="h-8 w-8"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent>
                    <form onSubmit={handleSave}>
                        <DialogHeader>
                            <DialogTitle>{editingContact ? "Edit Contact" : "Add Contact"}</DialogTitle>
                        </DialogHeader>

                        <div className="grid gap-4 py-4">
                            <div className="space-y-2">
                                <Label htmlFor="department">Department Name <span className="text-red-500">*</span></Label>
                                <Input
                                    id="department"
                                    value={formData.department || ""}
                                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                                    required
                                    placeholder="e.g. IT Department"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="contact_name">Contact Person <span className="text-red-500">*</span></Label>
                                <Input
                                    id="contact_name"
                                    value={formData.contact_name || ""}
                                    onChange={(e) => setFormData({ ...formData, contact_name: e.target.value })}
                                    required
                                    placeholder="e.g. Helpdesk"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="email">Email</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    value={formData.email || ""}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    placeholder="helpdesk@example.com"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="phone">Phone</Label>
                                <Input
                                    id="phone"
                                    value={formData.phone || ""}
                                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                    placeholder="+123456789"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="description">Description (Optional)</Label>
                                <Textarea
                                    id="description"
                                    value={formData.description || ""}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    placeholder="Additional details..."
                                    className="min-h-[80px]"
                                />
                            </div>
                        </div>

                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)} disabled={isSubmitting}>
                                Cancel
                            </Button>
                            <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting ? "Saving..." : "Save"}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
