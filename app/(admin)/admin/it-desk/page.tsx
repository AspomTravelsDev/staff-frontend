import { getITGuides, deleteITGuide } from "@/lib/api/it-guides";
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  Eye,
  MoreHorizontal,
  LayoutGrid,
  List as ListIcon,
  CheckCircle2,
  FileEdit,
} from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { revalidatePath } from "next/cache";

export default async function ITDeskManagementPage() {
  const { items: guides } = await getITGuides({ limit: 100 });

  async function handleDelete(id: string) {
    "use server";
    await deleteITGuide(id);
    revalidatePath("/admin/it-desk");
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            IT Information Desk
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage guides, documentation, and help content for all staff.
          </p>
        </div>
        <Link href="/admin/it-desk/create">
          <Button className="h-11 px-6 shadow-md">
            <Plus className="mr-2 h-4 w-4" /> Create New Guide
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-card border rounded-xl p-5 shadow-sm">
          <p className="text-sm font-medium text-muted-foreground mb-1">
            Total Guides
          </p>
          <div className="flex items-end gap-2">
            <span className="text-2xl font-bold">{guides.length}</span>
            <Badge variant="secondary" className="mb-1">
              Active
            </Badge>
          </div>
        </div>
        <div className="bg-card border rounded-xl p-5 shadow-sm">
          <p className="text-sm font-medium text-muted-foreground mb-1">
            Published
          </p>
          <div className="flex items-end gap-2">
            <span className="text-2xl font-bold">
              {guides.filter((g) => g.status === "published").length}
            </span>
            <CheckCircle2 className="h-5 w-5 text-green-500 mb-1" />
          </div>
        </div>
        <div className="bg-card border rounded-xl p-5 shadow-sm">
          <p className="text-sm font-medium text-muted-foreground mb-1">
            Drafts
          </p>
          <div className="flex items-end gap-2">
            <span className="text-2xl font-bold">
              {guides.filter((g) => g.status === "draft").length}
            </span>
            <FileEdit className="h-5 w-5 text-amber-500 mb-1" />
          </div>
        </div>
        <div className="bg-card border rounded-xl p-5 shadow-sm">
          <p className="text-sm font-medium text-muted-foreground mb-1">
            Categories
          </p>
          <div className="flex items-end gap-2">
            <span className="text-2xl font-bold">
              {new Set(guides.map((g) => g.category)).size}
            </span>
            <Badge variant="outline" className="mb-1">
              Active
            </Badge>
          </div>
        </div>
      </div>

      <div className="bg-card border rounded-xl shadow-sm overflow-hidden">
        <div className="p-4 border-b bg-muted/20 flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search guides..."
              className="pl-9 bg-background"
            />
          </div>
          <div className="flex items-center gap-2 border rounded-lg p-1 bg-background">
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <ListIcon className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8 bg-muted">
              <LayoutGrid className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>Title</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Author</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {guides.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="h-32 text-center text-muted-foreground"
                >
                  No guides found. Create your first one to get started!
                </TableCell>
              </TableRow>
            ) : (
              guides.map((guide) => (
                <TableRow key={guide.id} className="group">
                  <TableCell className="font-medium">
                    <Link
                      href={`/admin/it-desk/${guide.id}/edit`}
                      className="hover:text-primary transition-colors"
                    >
                      {guide.title}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="font-normal">
                      {guide.category || "General"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {guide.author_name}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        guide.status === "published" ? "default" : "secondary"
                      }
                      className={
                        guide.status === "published"
                          ? "bg-green-500 hover:bg-green-600"
                          : ""
                      }
                    >
                      {guide.status === "published" ? "Published" : "Draft"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {new Date(guide.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Link href={`/my/it/${guide.slug}`}>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </Link>
                      <Link href={`/admin/it-desk/${guide.id}/edit`}>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <Edit2 className="h-4 w-4" />
                        </Button>
                      </Link>

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-destructive">
                            <Trash2 className="mr-2 h-4 w-4" /> Delete Guide
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
