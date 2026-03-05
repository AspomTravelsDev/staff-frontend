"use client";

import { DocumentFile } from "@/types/file-types";
import { format } from "date-fns";
import {
  Download,
  Trash2,
  FileText,
  MoreVertical,
  Calendar,
  User as UserIcon,
  HardDrive,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface DocumentGridProps {
  documents: DocumentFile[];
  isLoading: boolean;
  showDelete?: boolean;
}

export function DocumentGrid({
  documents,
  isLoading,
  showDelete = false,
}: DocumentGridProps) {
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    getFileDownloadToken().then(setToken);
  }, []);

  const handleDelete = async (fileId: string) => {
    try {
      const result = await deleteDocumentAction(fileId);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Document deleted successfully");
      }
    } catch (e) {
      toast.error("Failed to delete document");
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
      return (
        <div className="p-2 rounded-lg bg-red-50 dark:bg-red-950/30 flex items-center justify-center transition-transform duration-200 group-hover:scale-105">
          <FileText className="h-8 w-8 text-red-500" />
        </div>
      );
    }
    if (ext === "doc" || ext === "docx") {
      return (
        <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950/30 flex items-center justify-center transition-transform duration-200 group-hover:scale-105">
          <FileText className="h-8 w-8 text-blue-500" />
        </div>
      );
    }
    if (ext === "ppt" || ext === "pptx") {
      return (
        <div className="p-2 rounded-lg bg-orange-50 dark:bg-orange-950/30 flex items-center justify-center transition-transform duration-200 group-hover:scale-105">
          <FileText className="h-8 w-8 text-orange-500" />
        </div>
      );
    }
    return (
      <div className="p-2 rounded-lg bg-gray-50 dark:bg-gray-950/30 flex items-center justify-center transition-transform duration-200 group-hover:scale-105">
        <FileText className="h-8 w-8 text-gray-500" />
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {[...Array(10)].map((_, i) => (
          <Card
            key={i}
            className="animate-pulse bg-muted/50 border h-[160px]"
          />
        ))}
      </div>
    );
  }

  if (documents.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center border rounded-xl bg-muted/10 text-muted-foreground border-dashed">
        <HardDrive className="h-10 w-10 mb-4 opacity-50" />
        <p className="text-lg font-medium">No documents found</p>
        <p className="text-sm opacity-70">
          Try adjusting your filters or upload a new document.
        </p>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {documents.map((doc) => (
          <Card
            key={doc.id}
            className="group relative flex flex-col overflow-hidden border bg-card/50 hover:bg-card hover:shadow-md transition-all duration-200 cursor-default h-[180px]"
          >
            {/* Top Toolbar */}
            <div className="absolute top-1 right-1 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 rounded-md bg-background/80 backdrop-blur-sm border shadow-sm"
                  >
                    <MoreVertical className="h-3.5 w-3.5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    onClick={() => handleDownload(doc)}
                    className="gap-2 cursor-pointer text-xs"
                  >
                    <Download className="h-3.5 w-3.5" /> Download
                  </DropdownMenuItem>
                  {showDelete && (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <DropdownMenuItem
                          onSelect={(e) => e.preventDefault()}
                          className="gap-2 text-destructive cursor-pointer focus:text-destructive focus:bg-destructive/10 text-xs"
                        >
                          <Trash2 className="h-3.5 w-3.5" /> Delete
                        </DropdownMenuItem>
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
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Icon Area */}
            <div className="pt-4 pb-2 flex flex-col items-center justify-center">
              {renderFileIcon(doc.original_name)}
              <div className="mt-2 flex gap-1 flex-wrap justify-center px-2">
                <Badge
                  variant="secondary"
                  className="text-[9px] h-3.5 px-1 uppercase font-semibold tracking-wider"
                >
                  {getFileExtension(doc.original_name) || "file"}
                </Badge>
              </div>
            </div>

            {/* Content Area */}
            <CardContent className="flex-1 flex flex-col gap-1 pt-1 px-3 pb-2 text-center overflow-hidden">
              <Tooltip>
                <TooltipTrigger asChild>
                  <h3 className="font-medium text-xs line-clamp-2 leading-tight group-hover:text-primary transition-colors px-1">
                    {doc.title}
                  </h3>
                </TooltipTrigger>
                <TooltipContent
                  side="bottom"
                  className="max-w-[200px] text-[10px]"
                >
                  <p>{doc.title}</p>
                </TooltipContent>
              </Tooltip>

              <div className="mt-auto flex flex-col gap-0.5 text-[10px] text-muted-foreground opacity-70 group-hover:opacity-100 transition-opacity">
                <div className="flex items-center justify-center gap-1">
                  <UserIcon className="h-2.5 w-2.5 shrink-0" />
                  <span className="truncate max-w-[80px]">
                    {doc.uploaded_by?.name.split(" ")[0] || "System"}
                  </span>
                </div>
                <div className="flex items-center justify-center gap-1">
                  <Calendar className="h-2.5 w-2.5 shrink-0" />
                  <span>{format(new Date(doc.created_at), "MMM dd, yy")}</span>
                </div>
              </div>
            </CardContent>

            {/* Hidden Action Bar for hover */}
            <div
              className="absolute inset-x-0 bottom-0 py-1.5 px-3 bg-primary/5 border-t translate-y-full group-hover:translate-y-0 transition-transform duration-200 flex items-center justify-between text-[10px] font-semibold text-primary cursor-pointer"
              onClick={() => handleDownload(doc)}
            >
              <span>Download</span>
              <Download className="h-3 w-3" />
            </div>
          </Card>
        ))}
      </div>
    </TooltipProvider>
  );
}
