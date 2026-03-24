"use client";

import { useState } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2 } from "lucide-react";
import Papa, { ParseResult } from "papaparse";
import { CRMStatus, CreateClientRequest } from "@/lib/api/crm-constants";
import { bulkCreateClientsAction } from "../actions";

interface ImportClientsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ImportClientsDialog({ open, onOpenChange }: ImportClientsDialogProps) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<CreateClientRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<{ imported: number; merged: number; skipped: number; errors: string[] } | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setError(null);
      setResults(null);
    }
  };

  const processCSV = () => {
    if (!file) return;
    setLoading(true);
    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: true,
      complete: (parseResults: ParseResult<Record<string, string>>) => {
        const parsed = parseResults.data.map((rawRow: Record<string, string>) => {
          // Normalize keys to lowercase for robust mapping
          const row: Record<string, string> = {};
          Object.keys(rawRow).forEach(key => {
            row[key.toLowerCase().trim()] = rawRow[key];
          });

          let name = row["name"] || row["full name"] || "";
          if (!name && (row["first name"] || row["last name"])) {
            name = `${row["first name"] || ""} ${row["last name"] || ""}`.trim();
          }

          let statusStr = (row["status"] || "").toLowerCase();
          const validStatuses = ["potential", "follow_up", "negotiation", "paid", "inactive"];
          let status: CRMStatus = validStatuses.includes(statusStr) ? (statusStr as CRMStatus) : "potential";

          return {
            name,
            contactPerson: row["contact person"] || name,
            email: row["email"] || null,
            phone: row["phone"] || null,
            status,
            service: row["service"] || "Other",
            source: row["source"] || "Other",
            notes: row["notes"] || "Imported via CSV",
            dateOfBirth: row["date of birth"] || row["dob"] || row["birth date"] || row["birthday"] || null,
          } as CreateClientRequest;
        });

        const validRows = parsed.filter(row => row.name.length > 0);

        if (validRows.length === 0) {
          setError("No valid rows found. Please ensure the CSV contains a 'Name' or 'First Name'/'Last Name' column.");
        } else {
          setPreview(validRows);
        }
        setLoading(false);
      },
      error: (err: Error) => {
        setError("Failed to parse CSV: " + err.message);
        setLoading(false);
      }
    });
  };

  const handleImport = async () => {
    if (preview.length === 0) return;
    setUploading(true);
    setError(null);

    const res = await bulkCreateClientsAction(preview);
    setUploading(false);

    if (res.success && res.data) {
      setResults(res.data);
      setPreview([]);
      setFile(null);
    } else {
      setError(res.error || "An error occurred during import.");
    }
  };

  const reset = () => {
    setFile(null);
    setPreview([]);
    setResults(null);
    setError(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={(val) => { if(!val) reset(); else onOpenChange(val); }}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Import Customers from CSV</DialogTitle>
          <DialogDescription>
            Upload a CSV file to bulk import clients. Recognized columns: Name (or First Name/Last Name), Contact Person, Email, Phone, Status, Service, Source, Notes, Date of Birth (or DOB).
          </DialogDescription>
        </DialogHeader>

        {!results && preview.length === 0 && (
          <div className="grid gap-4 py-4">
            <Input type="file" accept=".csv" onChange={handleFileChange} />
            {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}
            <Button onClick={processCSV} disabled={!file || loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Preview Data
            </Button>
          </div>
        )}

        {!results && preview.length > 0 && (
          <div className="grid gap-4 py-4">
            <div className="flex justify-between items-center text-sm">
              <span>Found <strong>{preview.length}</strong> valid rows to import. Duplicates (by email/phone) will be skipped.</span>
              <Button variant="outline" size="sm" onClick={() => setPreview([])}>Start Over</Button>
            </div>
            {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}
            
            <div className="rounded-md border max-h-[400px] overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Date of Birth</TableHead>
                    <TableHead>Service</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {preview.slice(0, 100).map((row, i) => (
                    <TableRow key={i}>
                      <TableCell>{row.name}</TableCell>
                      <TableCell>{row.email}</TableCell>
                      <TableCell>{row.phone}</TableCell>
                      <TableCell>{row.dateOfBirth || "—"}</TableCell>
                      <TableCell>{row.service}</TableCell>
                      <TableCell>{row.status}</TableCell>
                    </TableRow>
                  ))}
                  {preview.length > 100 && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground">
                        ... and {preview.length - 100} more rows
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => onOpenChange(false)} disabled={uploading}>Cancel</Button>
              <Button onClick={handleImport} disabled={uploading}>
                {uploading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Confirm Import
              </Button>
            </DialogFooter>
          </div>
        )}

        {results && (
          <div className="grid gap-4 py-6 text-center">
            <h3 className="text-lg font-semibold text-green-600">Import Complete!</h3>
            <div className="grid grid-cols-3 gap-4 text-sm max-w-lg mx-auto">
                <div className="p-3 bg-muted rounded-md border flex flex-col items-center justify-center">
                    <span className="block text-2xl font-bold text-green-600">{results.imported}</span>
                    <span className="text-muted-foreground">New Clients Imported</span>
                </div>
                <div className="p-3 bg-muted rounded-md border flex flex-col items-center justify-center">
                    <span className="block text-2xl font-bold text-blue-600">{results.merged}</span>
                    <span className="text-muted-foreground">Existing Clients Merged</span>
                </div>
                <div className="p-3 bg-muted rounded-md border flex flex-col items-center justify-center">
                    <span className="block text-2xl font-bold text-muted-foreground">{results.skipped}</span>
                    <span className="text-muted-foreground">Skipped (No New Data)</span>
                </div>
            </div>
            
            {results.errors.length > 0 && (
                <div className="mt-4 text-left border rounded-md p-4 bg-destructive/10">
                    <h4 className="font-semibold mb-2">Errors ({results.errors.length})</h4>
                    <ul className="text-sm list-disc pl-5 max-h-[100px] overflow-auto">
                        {results.errors.map((err, i) => <li key={i} className="text-destructive">{err}</li>)}
                    </ul>
                </div>
            )}
            
            <Button onClick={reset} className="mt-4">Close Document</Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
