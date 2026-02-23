export interface ExportColumn<T> {
  header: string;
  key: keyof T | ((item: T) => string | number | boolean | null | undefined);
}

/**
 * Escapes a string for CSV, handling commas, quotes, and newlines.
 */
function escapeCSVValue(value: any): string {
  if (value === null || value === undefined) {
    return "";
  }

  const stringValue = String(value);
  
  // If the value contains a comma, quote, or newline, it needs to be wrapped in quotes.
  // Additionally, any existing double quotes must be doubled up ("").
  if (
    stringValue.includes(",") ||
    stringValue.includes('"') ||
    stringValue.includes("\n") ||
    stringValue.includes("\r")
  ) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }
  
  return stringValue;
}

/**
 * Converts an array of objects to a CSV string and triggers a browser download.
 *
 * @param data Array of objects to export
 * @param columns Configuration of headers and data accessors
 * @param filename Name of the file to be downloaded (without .csv extension)
 */
export function exportToCSV<T>(
  data: T[],
  columns: ExportColumn<T>[],
  filename: string = "export"
) {
  if (!data || data.length === 0) {
    console.warn("No data provided to export.");
    return;
  }

  // 1. Generate Header Row
  const headers = columns.map((col) => escapeCSVValue(col.header));
  const csvRows = [headers.join(",")];

  // 2. Generate Data Rows
  for (const row of data) {
    const values = columns.map((col) => {
      let val: any;
      if (typeof col.key === "function") {
        val = col.key(row);
      } else {
        val = row[col.key];
      }
      return escapeCSVValue(val);
    });
    csvRows.push(values.join(","));
  }

  // 3. Create the CSV blob
  const csvString = csvRows.join("\n");
  const blob = new Blob([csvString], { type: "text/csv;charset=utf-8;" });

  // 4. Trigger download
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", `${filename}_${new Date().toISOString().split("T")[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
