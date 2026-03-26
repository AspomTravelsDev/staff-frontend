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
import { CRMStatus, CreateClientRequest, CRM_SERVICE_OPTIONS } from "@/lib/api/crm-constants";
import { bulkCreateClientsAction } from "../actions";
import { parseFlexibleDate, formatToISODate } from "@/lib/utils/date-utils";
import { cn } from "@/lib/utils";

interface ImportClientsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface ValidationError {
  row: number;
  field: keyof CreateClientRequest;
  message: string;
}

export function ImportClientsDialog({ open, onOpenChange }: ImportClientsDialogProps) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<CreateClientRequest[]>([]);
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
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
        const parsed: CreateClientRequest[] = parseResults.data.map((rawRow: Record<string, string>) => {
          const row: Record<string, string> = {};
          Object.keys(rawRow).forEach(key => {
            row[key.toLowerCase().trim()] = rawRow[key];
          });

          let rowName = row["name"] || row["full name"] || "";
          if (!rowName && (row["first name"] || row["last name"])) {
            rowName = `${row["first name"] || ""} ${row["last name"] || ""}`.trim();
          }

          let statusStr = (row["status"] || "").toLowerCase();
          const validStatuses = ["potential", "follow_up", "negotiation", "paid", "inactive"];
          let rowStatus: CRMStatus = validStatuses.includes(statusStr) ? (statusStr as CRMStatus) : "potential";

          const rawDob = row["date of birth"] || row["dob"] || row["birth date"] || row["birthday"] || null;
          const parsedDob = parseFlexibleDate(rawDob);
          const normalizedDob = parsedDob ? formatToISODate(parsedDob) : rawDob;

          return {
            name: rowName,
            contactPerson: row["contact person"] || rowName,
            email: row["email"] || null,
            phone: row["phone"] || null,
            status: rowStatus,
            service: row["service"] || "Other",
            source: row["source"] || "Other",
            notes: row["notes"] || "Imported via CSV",
            dateOfBirth: normalizedDob,
          };
        });

        const validRows = parsed.filter(row => row.name.length > 0);

        if (validRows.length === 0) {
          setError("No valid rows found. Please ensure the CSV contains a 'Name' or 'First Name'/'Last Name' column.");
        } else {
          setPreview(validRows);
          validateData(validRows);
        }
        setLoading(false);
      },
      error: (err: Error) => {
        setError("Failed to parse CSV: " + err.message);
        setLoading(false);
      }
    });
  };

  const validateData = (data: CreateClientRequest[]) => {
    const errors: ValidationError[] = [];
    data.forEach((row, index) => {
      if (!row.name || row.name.trim() === "") {
        errors.push({ row: index, field: "name", message: "Name is required" });
      }
      
      if (row.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(row.email)) {
        errors.push({ row: index, field: "email", message: "Invalid email format" });
      }

      if (row.dateOfBirth) {
        const parsed = parseFlexibleDate(row.dateOfBirth);
        if (!parsed) {
            errors.push({ row: index, field: "dateOfBirth", message: "Invalid date format" });
        }
      }
    });
    setValidationErrors(errors);
  };

  const handleCellEdit = (index: number, field: keyof CreateClientRequest, value: any) => {
    const updated = [...preview];
    const currentRow = { ...updated[index] };
    
    if (field === "dateOfBirth") {
        const parsed = parseFlexibleDate(value);
        if (parsed) {
            currentRow.dateOfBirth = formatToISODate(parsed);
        } else {
            currentRow.dateOfBirth = value || null;
        }
    } else {
        // @ts-ignore - dynamic key assignment
        currentRow[field] = value;
    }
    
    updated[index] = currentRow;
    setPreview(updated);
    validateData(updated);
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
      
      // Try to parse backend validation errors to highlight cells
      if (res.error) {
        const errors: ValidationError[] = [];
        // Match patterns like "clients.0.email" or "clients.15.dateOfBirth"
        const regex = /clients\.(\d+)\.(\w+)/g;
        let match;
        while ((match = regex.exec(res.error)) !== null) {
          const rowIndex = parseInt(match[1]);
          const field = match[2] as keyof CreateClientRequest;
          errors.push({ 
            row: rowIndex, 
            field, 
            message: "Backend validation failed" 
          });
        }
        if (errors.length > 0) {
            setValidationErrors(prev => [...prev, ...errors]);
        }
      }
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
      <DialogContent className="max-w-[95vw] lg:max-w-6xl max-h-[90vh] overflow-y-auto">
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
            {validationErrors.length > 0 && (
              <Alert variant="destructive">
                <AlertDescription>
                  There are <strong>{validationErrors.length}</strong> validation errors. Please correct them before importing.
                </AlertDescription>
              </Alert>
            )}
            
            <div className="rounded-md border max-h-[500px] overflow-auto">
              <Table className="min-w-[1500px]">
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[200px]">Name</TableHead>
                    <TableHead className="w-[250px]">Email</TableHead>
                    <TableHead className="w-[150px]">Phone</TableHead>
                    <TableHead className="w-[180px]">Date of Birth</TableHead>
                    <TableHead className="w-[180px]">Service</TableHead>
                    <TableHead className="w-[150px]">Status</TableHead>
                    <TableHead className="w-[400px]">Notes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {preview.slice(0, 100).map((row, i) => {
                    const rowErrors = validationErrors.filter(e => e.row === i);
                    return (
                      <TableRow key={i} className={cn(rowErrors.length > 0 && "bg-destructive/5")}>
                        <TableCell className="p-1">
                          <Input 
                            value={row.name} 
                            onChange={(e) => handleCellEdit(i, "name", e.target.value)}
                            className={cn(
                                "h-8 text-sm",
                                rowErrors.some(e => e.field === "name") && "border-destructive focus-visible:ring-destructive"
                            )}
                          />
                        </TableCell>
                        <TableCell className="p-1">
                          <Input 
                            value={row.email || ""} 
                            onChange={(e) => handleCellEdit(i, "email", e.target.value)}
                            className={cn(
                                "h-8 text-sm",
                                rowErrors.some(e => e.field === "email") && "border-destructive focus-visible:ring-destructive"
                            )}
                          />
                        </TableCell>
                        <TableCell className="p-1">
                          <Input 
                            value={row.phone || ""} 
                            onChange={(e) => handleCellEdit(i, "phone", e.target.value)}
                            className={cn(
                                "h-8 text-sm",
                                rowErrors.some(e => e.field === "phone") && "border-destructive focus-visible:ring-destructive"
                            )}
                          />
                        </TableCell>
                        <TableCell className="p-1">
                          <Input 
                            value={row.dateOfBirth || ""} 
                            onChange={(e) => handleCellEdit(i, "dateOfBirth", e.target.value)}
                            placeholder="e.g. 1990-01-01 or 01/01/1990"
                            className={cn(
                                "h-8 text-sm",
                                rowErrors.some(e => e.field === "dateOfBirth") && "border-destructive focus-visible:ring-destructive"
                            )}
                          />
                        </TableCell>
                        <TableCell className="p-1">
                          <select 
                            value={row.service} 
                            onChange={(e) => handleCellEdit(i, "service", e.target.value)}
                            className={cn(
                                "h-8 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
                                rowErrors.some(e => e.field === "service") && "border-destructive focus-visible:ring-destructive"
                            )}
                          >
                            {CRM_SERVICE_OPTIONS.map(opt => (
                              <option key={opt} value={opt}>{opt}</option>
                            ))}
                          </select>
                        </TableCell>
                        <TableCell className="p-1">
                          <select 
                            value={row.status} 
                            onChange={(e) => handleCellEdit(i, "status", e.target.value as CRMStatus)}
                            className={cn(
                                "h-8 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
                                rowErrors.some(e => e.field === "status") && "border-destructive focus-visible:ring-destructive"
                            )}
                          >
                            <option value="potential">Potential</option>
                            <option value="follow_up">Follow Up</option>
                            <option value="negotiation">Negotiation</option>
                            <option value="paid">Paid</option>
                            <option value="inactive">Inactive</option>
                          </select>
                        </TableCell>
                        <TableCell className="p-1">
                          <Input 
                             value={row.notes || ""} 
                             onChange={(e) => handleCellEdit(i, "notes", e.target.value)}
                             className={cn(
                                 "h-8 text-sm min-w-[200px]",
                                 rowErrors.some(e => e.field === "notes") && "border-destructive focus-visible:ring-destructive"
                             )}
                          />
                        </TableCell>
                      </TableRow>
                    );
                  })}
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
              <Button onClick={handleImport} disabled={uploading || validationErrors.length > 0}>
                {uploading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {validationErrors.length > 0 ? "Fix Errors to Import" : "Confirm Import"}
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
