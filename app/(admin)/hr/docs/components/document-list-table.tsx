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
import { DocumentFile } from "@/types/file-types";
import { format } from "date-fns";
import { Download, Trash2, FileText, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
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
import { deleteDocumentAction } from "../actions";
import { useState, useEffect } from "react";
import { getFileDownloadToken } from "@/lib/api/files";
import { toast } from "sonner";

interface DocumentListTableProps {
  documents: DocumentFile[];
  isLoading: boolean;
  showDelete?: boolean;
}

export function DocumentListTable({
  documents,
  isLoading,
  showDelete = false,
}: DocumentListTableProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    getFileDownloadToken().then(setToken);
  }, []);

  const handleDelete = async (fileId: string) => {
    setDeletingId(fileId);
    try {
      const result = await deleteDocumentAction(fileId);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Document deleted successfully");
      }
    } finally {
      setDeletingId(null);
    }
  };

  const handleDownload = async (doc: DocumentFile) => {
    try {
      if (!token) {
        console.error("No auth token available");
        return;
      }

      const baseUrl =
        process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

      const downloadId = doc.file_id || doc.id;
      const downloadUrl = `${baseUrl}/api/files/download/${downloadId}`;

      const response = await fetch(downloadUrl, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        console.error("Download failed:", response.status, response.statusText);
        return;
      }

      const contentDisposition = response.headers.get("Content-Disposition");
      let filename = doc.original_name || `${doc.title}.pdf`;

      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="?([^"]+)"?/);
        if (filenameMatch && filenameMatch[1]) {
          filename = filenameMatch[1];
        }
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
    }
  };

  const getFileExtension = (filename: string | undefined) => {
    if (!filename) return "";
    return filename.split(".").pop()?.toLowerCase() || "";
  };

  const renderFileIcon = (originalName: string | undefined) => {
    const ext = getFileExtension(originalName);

    if (ext === "pdf") {
      return <FileText className="h-4 w-4 text-red-500 shrink-0" />;
    }
    if (ext === "doc" || ext === "docx") {
      return <FileText className="h-4 w-4 text-blue-500 shrink-0" />;
    }
    if (ext === "ppt" || ext === "pptx") {
      return <FileText className="h-4 w-4 text-orange-500 shrink-0" />;
    }
    return <FileText className="h-4 w-4 text-gray-500 shrink-0" />;
  };

  if (isLoading) {
    return (
      <div className="p-4 text-center text-muted-foreground">
        Loading documents...
      </div>
    );
  }

  if (documents.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center border rounded-lg bg-muted/10 text-muted-foreground border-dashed">
        <FileText className="h-10 w-10 mb-2 opacity-50" />
        <p>No documents found.</p>
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Title</TableHead>
            <TableHead>Department</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Format</TableHead>
            <TableHead>Size</TableHead>
            <TableHead>Uploaded</TableHead>
            <TableHead>Uploaded By</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {documents.map((doc) => (
            <TableRow key={doc.id}>
              <TableCell className="font-medium">
                <div className="flex items-center gap-2">
                  {renderFileIcon(doc.original_name)}
                  <div className="flex flex-col">
                    <span>{doc.title}</span>
                    {doc.description && (
                      <span className="text-xs text-muted-foreground">
                        {doc.description}
                      </span>
                    )}
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <Badge variant="secondary" className="w-fit">
                  {doc.department}
                </Badge>
              </TableCell>
              <TableCell>
                <div className="flex flex-col gap-1">
                  <Badge variant="outline" className="capitalize w-fit">
                    {doc.category_label || doc.category}
                  </Badge>
                  {doc.type_label && (
                    <span className="text-[10px] text-muted-foreground">
                      {doc.type_label}
                    </span>
                  )}
                </div>
              </TableCell>
              <TableCell>
                {getFileExtension(doc.original_name).toUpperCase() || "N/A"}
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
                  {token ? (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDownload(doc)}
                      title="Download"
                    >
                      <Download className="h-4 w-4" />
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
                          <AlertDialogTitle>Delete Document?</AlertDialogTitle>
                          <AlertDialogDescription>
                            {`Are you sure you want to delete "${doc.title}"? This action cannot be undone.`}
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
  );
}
