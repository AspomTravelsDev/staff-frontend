"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { DocumentFile, DocumentFolder } from "@/types/file-types";
import { format } from "date-fns";
import {
  Download,
  Trash2,
  FileText,
  Loader2,
  Folder,
  ArrowUp,
  LayoutGrid,
  List,
  MoreVertical,
  Eye,
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { deleteVisaDocumentAction, deleteVisaFolderAction } from "../actions";
import { useState, useEffect } from "react";
import { getFileDownloadToken } from "@/lib/api/files";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Search, Tag, Pencil, FolderSymlink } from "lucide-react";
import { UploadDocumentDialog } from "./upload-document-dialog";
import { CreateFolderDialog } from "./create-folder-dialog";
import { MoveDocumentDialog } from "./move-document-dialog";

interface DocumentListTableProps {
  folders: DocumentFolder[];
  documents: DocumentFile[];
  allFolders: DocumentFolder[];
  isLoading: boolean;
  showDelete?: boolean;
  currentFolderId: string | null;
  parentFolderId: string | null;
  onNavigateFolder: (folderId: string | null) => void;
}

export function DocumentListTable({
  folders,
  documents,
  allFolders,
  isLoading,
  showDelete = false,
  currentFolderId,
  parentFolderId,
  onNavigateFolder,
}: DocumentListTableProps) {
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deletingFolderId, setDeletingFolderId] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [tagFilter, setTagFilter] = useState("");

  useEffect(() => {
    getFileDownloadToken().then(setToken);
    
    // Load preferred view mode
    const savedMode = localStorage.getItem("visa-documents-view-mode");
    if (savedMode === "grid" || savedMode === "list") {
      setViewMode(savedMode);
    }
  }, []);

  const handleSetViewMode = (mode: "grid" | "list") => {
    setViewMode(mode);
    localStorage.setItem("visa-documents-view-mode", mode);
  };

  const handleDelete = async (fileId: string) => {
    setDeletingId(fileId);
    try {
      const result = await deleteVisaDocumentAction(fileId);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Document deleted successfully");
      }
    } finally {
      setDeletingId(null);
    }
  };

  const handleDeleteFolder = async (folderId: string) => {
    setDeletingFolderId(folderId);
    try {
      const result = await deleteVisaFolderAction(folderId);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Folder and its contents deleted");
      }
    } finally {
      setDeletingFolderId(null);
    }
  };

  const handleView = (doc: DocumentFile) => {
    const downloadId = doc.file_id || doc.id;
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
    const downloadUrl = `${baseUrl}/api/files/download/${downloadId}`;
    const proxyUrl = `/api/proxy-file?url=${encodeURIComponent(downloadUrl)}&inline=true`;
    window.open(proxyUrl, "_blank");
  };

  // Filter & sort documents alphabetically (A-Z)
  const filteredDocuments = documents
    .filter((doc) => {
      const matchesSearch =
        doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        doc.description?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesTag =
        !tagFilter ||
        doc.tags?.some((t) => t.toLowerCase().includes(tagFilter.toLowerCase()));

      return matchesSearch && matchesTag;
    })
    .sort((a, b) => a.title.localeCompare(b.title, undefined, { sensitivity: "base", numeric: true }));

  // Filter & sort folders alphabetically (A-Z)
  const filteredFolders = folders
    .filter((folder) => {
      const matchesSearch = folder.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesTag = !tagFilter; // folders don't have tags
      return matchesSearch && matchesTag;
    })
    .sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: "base", numeric: true }));

  // Get unique tags for quick filtering
  const allTags = Array.from(
    new Set(documents.flatMap((doc) => doc.tags || [])),
  ).sort();

  const handleDownload = async (doc: DocumentFile) => {
    const downloadId = doc.file_id || doc.id;
    setDownloadingId(downloadId);
    try {
      if (!token) {
        console.error("No auth token available");
        return;
      }

      const baseUrl =
        process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

      const downloadUrl = `${baseUrl}/api/files/download/${downloadId}`;
      const proxyUrl = `/api/proxy-file?url=${encodeURIComponent(downloadUrl)}`;

      const response = await fetch(proxyUrl);

      if (!response.ok) {
        console.error("Download failed:", response.status, response.statusText);
        const errorText = await response.text();
        console.error("Error details:", errorText);
        return;
      }

      const contentDisposition = response.headers.get("Content-Disposition");
      let filename = doc.original_name || `${doc.title}.pdf`;

      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="?([^"]+)"?/);
        if (filenameMatch && filenameMatch[1]) {
          filename = filenameMatch[1];
        }
      } else if (!doc.original_name) {
        if (doc.mime_type === "image/jpeg") filename = `${doc.title}.jpg`;
        else if (doc.mime_type === "image/png") filename = `${doc.title}.png`;
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (e) {
      console.error("Download error", e);
    } finally {
      setDownloadingId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="p-8 text-center text-muted-foreground flex flex-col items-center justify-center gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span>Loading explorer...</span>
      </div>
    );
  }

  const isDirectoryEmpty = filteredFolders.length === 0 && filteredDocuments.length === 0;

  return (
    <div className="space-y-4">
      {/* Filtering and View Toggle UI */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search documents..."
            className="pl-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="relative w-full sm:w-52">
          <Tag className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Filter by tag..."
            className="pl-9"
            value={tagFilter}
            onChange={(e) => setTagFilter(e.target.value)}
            list="tags-list"
          />
          <datalist id="tags-list">
            {allTags.map((tag) => (
              <option key={tag} value={tag} />
            ))}
          </datalist>
        </div>
        
        {/* Toggle buttons */}
        <div className="flex items-center border rounded-lg p-0.5 bg-muted/10 shrink-0 h-10 self-end sm:self-auto">
          <Button
            variant={viewMode === "grid" ? "secondary" : "ghost"}
            size="icon"
            className="h-8.5 w-8.5 rounded-md"
            type="button"
            onClick={() => handleSetViewMode("grid")}
            title="Grid View"
          >
            <LayoutGrid className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === "list" ? "secondary" : "ghost"}
            size="icon"
            className="h-8.5 w-8.5 rounded-md"
            type="button"
            onClick={() => handleSetViewMode("list")}
            title="List View"
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {isDirectoryEmpty ? (
        <div className="flex flex-col items-center justify-center p-12 text-center border rounded-xl bg-muted/5 text-muted-foreground border-dashed">
          <Folder className="h-12 w-12 mb-2 text-muted-foreground/40 stroke-[1.5]" />
          <h3 className="font-semibold text-slate-800 text-sm">Empty Directory</h3>
          <p className="text-xs text-muted-foreground mt-1 max-w-[280px]">
            No folders or documents are inside this directory.
          </p>
          {currentFolderId && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onNavigateFolder(parentFolderId)}
              className="mt-4 text-sky-600 font-semibold"
            >
              <ArrowUp className="h-3.5 w-3.5 mr-1" />
              Go Back
            </Button>
          )}
        </div>
      ) : viewMode === "grid" ? (
        /* GRID FILE EXPLORER VIEW */
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
          {/* Back Card */}
          {currentFolderId && (
            <div
              onClick={() => onNavigateFolder(parentFolderId)}
              className="border border-dashed border-slate-200 bg-slate-50/50 hover:bg-slate-50 hover:border-sky-500 transition-all rounded-2xl p-3 cursor-pointer select-none flex flex-col items-center justify-center aspect-square group"
            >
              <div className="flex flex-col items-center gap-1.5 text-sky-600 font-semibold text-xs uppercase tracking-wider">
                <ArrowUp className="h-5 w-5 group-hover:-translate-y-1 transition-transform stroke-[2.5]" />
                <span>Go Up</span>
              </div>
            </div>
          )}

          {/* Folders */}
          {filteredFolders.map((folder) => (
            <div
              key={folder.id}
              onClick={() => onNavigateFolder(folder.id)}
              className="border border-slate-200 bg-white hover:border-amber-500 hover:shadow-md hover:shadow-amber-500/5 transition-all duration-200 rounded-2xl p-3 cursor-pointer select-none relative flex flex-col items-center justify-between aspect-square group"
            >
              {/* Dropdown Menu (top right) */}
              <div 
                className="absolute top-1.5 right-1.5 z-10"
                onClick={(e) => e.stopPropagation()}
              >
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-muted-foreground hover:text-primary rounded-md"
                    >
                      <MoreVertical className="h-3.5 w-3.5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-36">
                    <CreateFolderDialog
                      folder={folder}
                      trigger={
                        <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                          <Pencil className="mr-2 h-3.5 w-3.5" />
                          Rename
                        </DropdownMenuItem>
                      }
                    />
                    {showDelete && (
                      <>
                        <DropdownMenuSeparator />
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <DropdownMenuItem
                              onSelect={(e) => e.preventDefault()}
                              className="text-destructive focus:text-destructive"
                            >
                              <Trash2 className="mr-2 h-3.5 w-3.5" />
                              Delete
                            </DropdownMenuItem>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Folder?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete folder &quot;{folder.name}&quot; and all nested subfolders/documents recursively? This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                  onClick={() => handleDeleteFolder(folder.id)}
                                  className="bg-destructive hover:bg-destructive/90"
                                >
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                {/* Card Content centered */}
                <div className="flex flex-col items-center justify-center flex-1 w-full mt-3 min-w-0">
                  <Folder className="h-10 w-10 text-amber-500 fill-amber-500/10 shrink-0 group-hover:scale-105 transition-transform" />
                  <span className="font-semibold text-slate-800 text-center text-xs hover:underline mt-2 line-clamp-2 w-full px-1">
                    {folder.name}
                  </span>
                  <span className="text-[9px] text-muted-foreground uppercase tracking-wider font-bold mt-0.5">
                    {folder.department}
                  </span>
                </div>

                {/* Footer metadata */}
                <div className="w-full text-center text-[9px] text-muted-foreground border-t border-slate-50 pt-1.5 shrink-0">
                  <span className="block truncate">By {folder.created_by?.name || "System"}</span>
                </div>
              </div>
            ))}

          {/* Documents */}
          {filteredDocuments.map((doc) => {
            const downloadId = doc.file_id || doc.id;
            return (
              <div
                key={doc.id}
                onClick={() => handleView(doc)}
                className="border border-slate-200 bg-white hover:border-red-500 hover:shadow-md hover:shadow-red-500/5 hover:-translate-y-0.5 transition-all duration-200 rounded-2xl p-3 cursor-pointer select-none relative flex flex-col items-center justify-between aspect-square group"
              >
                {/* Dropdown Menu (top right) */}
                <div 
                  className="absolute top-1.5 right-1.5 z-10"
                  onClick={(e) => e.stopPropagation()}
                >
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-muted-foreground hover:text-primary rounded-md"
                      >
                        <MoreVertical className="h-3.5 w-3.5" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-36">
                      <DropdownMenuItem onClick={() => handleView(doc)}>
                        <Eye className="mr-2 h-3.5 w-3.5" />
                        View
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      {token ? (
                        <DropdownMenuItem
                          onClick={() => handleDownload(doc)}
                          disabled={downloadingId !== null}
                        >
                          {downloadingId === downloadId ? (
                            <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Download className="mr-2 h-3.5 w-3.5" />
                          )}
                          Download
                        </DropdownMenuItem>
                      ) : (
                        <DropdownMenuItem disabled>
                          <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                          Loading...
                        </DropdownMenuItem>
                      )}
                      <UploadDocumentDialog
                        document={doc}
                        folderId={currentFolderId}
                        trigger={
                          <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                            <Pencil className="mr-2 h-3.5 w-3.5" />
                            Edit
                          </DropdownMenuItem>
                        }
                      />
                      <MoveDocumentDialog
                        document={doc}
                        allFolders={allFolders}
                        trigger={
                          <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                            <FolderSymlink className="mr-2 h-3.5 w-3.5" />
                            Move
                          </DropdownMenuItem>
                        }
                      />
                      {showDelete && (
                        <>
                          <DropdownMenuSeparator />
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <DropdownMenuItem
                                onSelect={(e) => e.preventDefault()}
                                className="text-destructive focus:text-destructive"
                              >
                                <Trash2 className="mr-2 h-3.5 w-3.5" />
                                Delete
                              </DropdownMenuItem>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete Document?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete &quot;{doc.title}&quot;? This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDelete(doc.id)}
                                  className="bg-destructive hover:bg-destructive/90"
                                >
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                {/* Card Content centered */}
                <div className="flex flex-col items-center justify-center flex-1 w-full mt-3 min-w-0">
                  <FileText className="h-10 w-10 text-red-500 shrink-0 group-hover:scale-105 transition-transform" />
                  <span className="font-semibold text-slate-800 text-center text-xs mt-2 line-clamp-2 w-full px-1" title={doc.title}>
                    {doc.title}
                  </span>
                  <span className="text-[9px] text-muted-foreground uppercase tracking-wider font-semibold mt-0.5">
                    {doc.category_label || doc.category} • {(doc.file_size / 1024 / 1024).toFixed(2)} MB
                  </span>
                </div>

                {/* Footer metadata */}
                <div className="w-full text-center text-[9px] text-muted-foreground border-t border-slate-50 pt-1.5 shrink-0">
                  <span className="block truncate">By {doc.uploaded_by?.name || "System"}</span>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* LEGACY LIST VIEW TABLE */
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Tags</TableHead>
                <TableHead>Size</TableHead>
                <TableHead>Uploaded</TableHead>
                <TableHead>Uploaded By</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {/* Go Back Row */}
              {currentFolderId && (
                <TableRow
                  onClick={() => onNavigateFolder(parentFolderId)}
                  className="cursor-pointer hover:bg-muted/50 bg-muted/10 select-none"
                >
                  <TableCell colSpan={8} className="py-3 font-semibold text-sky-600">
                    <div className="flex items-center gap-2">
                      <ArrowUp className="h-4 w-4" />
                      <span>.. (Go back to parent folder)</span>
                    </div>
                  </TableCell>
                </TableRow>
              )}

              {/* Folders */}
              {filteredFolders.map((folder) => (
                <TableRow key={folder.id} className="group hover:bg-muted/30">
                  <TableCell
                    className="font-medium cursor-pointer"
                    onClick={() => onNavigateFolder(folder.id)}
                  >
                    <div className="flex items-center gap-2">
                      <Folder className="h-4 w-4 text-amber-500 fill-amber-500/10 shrink-0" />
                      <span className="hover:underline">{folder.name}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="secondary"
                      className="text-[10px] px-2 py-0 h-5"
                    >
                      {folder.department}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <span className="text-xs font-medium text-muted-foreground">
                      Folder
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="text-xs text-muted-foreground italic">
                      No tags
                    </span>
                  </TableCell>
                  <TableCell>-</TableCell>
                  <TableCell>
                    {format(new Date(folder.created_at), "MMM dd, yyyy")}
                  </TableCell>
                  <TableCell>{folder.created_by?.name || "System"}</TableCell>
                  <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-end gap-2">
                      <CreateFolderDialog
                        folder={folder}
                        trigger={
                          <Button
                            variant="ghost"
                            size="icon"
                            title="Rename"
                            className="text-muted-foreground hover:text-primary"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                        }
                      />

                      {showDelete && (
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-muted-foreground hover:text-destructive"
                              disabled={deletingFolderId === folder.id}
                            >
                              {deletingFolderId === folder.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Trash2 className="h-4 w-4" />
                              )}
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>
                                Delete Folder?
                              </AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete folder &quot;{folder.name}&quot; and all of its nested contents recursively? This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDeleteFolder(folder.id)}
                                className="bg-destructive hover:bg-destructive/90"
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}

              {/* Documents */}
              {filteredDocuments.map((doc) => (
                <TableRow key={doc.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-red-500 shrink-0" />
                      <div className="flex flex-col">
                        <span>{doc.title}</span>
                        {doc.description && (
                          <span className="text-xs text-muted-foreground line-clamp-1">
                            {doc.description}
                          </span>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="secondary"
                      className="text-[10px] px-2 py-0 h-5"
                    >
                      {doc.department}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-0.5">
                      <span className="text-xs font-medium capitalize">
                        {doc.category_label || doc.category}
                      </span>
                      {doc.type_label && (
                        <span className="text-[9px] text-muted-foreground uppercase tracking-tighter">
                          {doc.type_label}
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {doc.tags && doc.tags.length > 0 ? (
                        doc.tags.map((tag) => (
                          <Badge
                            key={tag}
                            variant="secondary"
                            className="text-[10px] px-1.5 py-0 h-5"
                          >
                            {tag}
                          </Badge>
                        ))
                      ) : (
                        <span className="text-xs text-muted-foreground italic">
                          No tags
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {(doc.file_size / 1024 / 1024).toFixed(2)} MB
                  </TableCell>
                  <TableCell>
                    {format(new Date(doc.created_at), "MMM dd, yyyy")}
                  </TableCell>
                  <TableCell>{doc.uploaded_by?.name || "System"}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleView(doc)}
                        title="View inline"
                        className="text-muted-foreground hover:text-primary"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      {token ? (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDownload(doc)}
                          title="Download"
                          className="text-muted-foreground hover:text-primary"
                          disabled={downloadingId !== null}
                        >
                          {downloadingId === (doc.file_id || doc.id) ? (
                            <Loader2 className="h-4 w-4 animate-spin text-primary" />
                          ) : (
                            <Download className="h-4 w-4" />
                          )}
                        </Button>
                      ) : (
                        <Button
                          variant="ghost"
                          size="icon"
                          disabled
                          title="Loading..."
                        >
                          <Loader2 className="h-4 w-4 animate-spin" />
                        </Button>
                      )}

                      <UploadDocumentDialog
                        document={doc}
                        folderId={currentFolderId}
                        trigger={
                          <Button
                            variant="ghost"
                            size="icon"
                            title="Edit"
                            className="text-muted-foreground hover:text-primary"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                        }
                      />
                      <MoveDocumentDialog
                        document={doc}
                        allFolders={allFolders}
                        trigger={
                          <Button
                            variant="ghost"
                            size="icon"
                            title="Move"
                            className="text-muted-foreground hover:text-primary"
                          >
                            <FolderSymlink className="h-4 w-4" />
                          </Button>
                        }
                      />

                      {showDelete && (
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-muted-foreground hover:text-destructive"
                              disabled={deletingId === doc.id}
                            >
                              {deletingId === doc.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Trash2 className="h-4 w-4" />
                              )}
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>
                                Delete Document?
                              </AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete &quot;{doc.title}&quot;?
                                This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDelete(doc.id)}
                                className="bg-destructive hover:bg-destructive/90"
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
