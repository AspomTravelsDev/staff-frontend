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
import { useDeleteDocument } from "@/lib/api/hooks/use-files";
import { useState, useEffect } from "react";
import { getFileDownloadToken } from "@/lib/api/files";

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
  const deleteMutation = useDeleteDocument();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    getFileDownloadToken().then(setToken);
  }, []);

  const handleDelete = async (fileId: string) => {
    setDeletingId(fileId);
    try {
      await deleteMutation.mutateAsync(fileId);
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

      // Use file_id if available (for documents that have separate file records), otherwise fallback to id
      const downloadId = doc.file_id || doc.id;
      const downloadUrl = `${baseUrl}/api/files/download/${downloadId}`;

      const response = await fetch(downloadUrl, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        console.error("Download failed:", response.status, response.statusText);
        // Try to parse error message
        const errorText = await response.text();
        console.error("Error details:", errorText);
        return;
      }

      // Get filename from header or fallback
      const contentDisposition = response.headers.get("Content-Disposition");
      let filename = doc.original_name || `${doc.title}.pdf`; // Default fallback

      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="?([^"]+)"?/);
        if (filenameMatch && filenameMatch[1]) {
          filename = filenameMatch[1];
        }
      } else if (!doc.original_name) {
        // Fallback guess based on mime type if no header and no original name
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
    }
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
            <TableHead>Category</TableHead>
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
                  <FileText className="h-4 w-4 text-red-500 shrink-0" />
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
                <Badge variant="outline" className="capitalize">
                  {doc.category}
                </Badge>
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
                            Are you sure you want to delete "{doc.title}"? This
                            action cannot be undone.
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
