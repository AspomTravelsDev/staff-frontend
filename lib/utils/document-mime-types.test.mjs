import test from "node:test";
import assert from "node:assert/strict";
import {
  isAllowedDocumentFile,
  getFileExtension,
  ALLOWED_DOCUMENT_EXTENSIONS,
  ALLOWED_DOCUMENT_MIME_TYPES,
  DOCUMENT_ACCEPT_STRING,
} from "./document-mime-types.ts";

test("isAllowedDocumentFile allows PDF files", () => {
  assert.equal(isAllowedDocumentFile({ name: "handbook.pdf", type: "application/pdf" }), true);
  assert.equal(isAllowedDocumentFile({ name: "handbook.pdf", type: "" }), true);
  assert.equal(isAllowedDocumentFile({ name: "HANDBOOK.PDF", type: "application/octet-stream" }), true);
});

test("isAllowedDocumentFile allows Word documents (doc, docx)", () => {
  assert.equal(isAllowedDocumentFile({ name: "contract.doc", type: "application/msword" }), true);
  assert.equal(
    isAllowedDocumentFile({
      name: "policy.docx",
      type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    }),
    true
  );
  assert.equal(isAllowedDocumentFile({ name: "policy.docx", type: "" }), true);
});

test("isAllowedDocumentFile allows Excel and spreadsheet files (xls, xlsx, csv)", () => {
  assert.equal(isAllowedDocumentFile({ name: "budget.xls", type: "application/vnd.ms-excel" }), true);
  assert.equal(
    isAllowedDocumentFile({
      name: "roster.xlsx",
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    }),
    true
  );
  assert.equal(isAllowedDocumentFile({ name: "staff.csv", type: "text/csv" }), true);
  assert.equal(isAllowedDocumentFile({ name: "export.xlsx", type: "application/octet-stream" }), true);
});

test("isAllowedDocumentFile allows PowerPoint presentations (ppt, pptx)", () => {
  assert.equal(
    isAllowedDocumentFile({ name: "training.ppt", type: "application/vnd.ms-powerpoint" }),
    true
  );
  assert.equal(
    isAllowedDocumentFile({
      name: "orientation.pptx",
      type: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    }),
    true
  );
  assert.equal(isAllowedDocumentFile({ name: "deck.pptx", type: "" }), true);
});

test("isAllowedDocumentFile allows text and scanned images", () => {
  assert.equal(isAllowedDocumentFile({ name: "notes.txt", type: "text/plain" }), true);
  assert.equal(isAllowedDocumentFile({ name: "scan.jpg", type: "image/jpeg" }), true);
  assert.equal(isAllowedDocumentFile({ name: "id_card.png", type: "image/png" }), true);
});

test("isAllowedDocumentFile rejects unauthorized file formats", () => {
  assert.equal(isAllowedDocumentFile({ name: "virus.exe", type: "application/x-msdownload" }), false);
  assert.equal(isAllowedDocumentFile({ name: "archive.zip", type: "application/zip" }), false);
  assert.equal(isAllowedDocumentFile({ name: "video.mp4", type: "video/mp4" }), false);
  assert.equal(isAllowedDocumentFile({ name: "script.sh", type: "text/x-sh" }), false);
});

test("getFileExtension returns lowercase file extension", () => {
  assert.equal(getFileExtension("Employee.PDF"), "pdf");
  assert.equal(getFileExtension("sheet.XLSX"), "xlsx");
  assert.equal(getFileExtension("noextension"), "");
  assert.equal(getFileExtension(undefined), "");
});

test("DOCUMENT_ACCEPT_STRING contains essential document extensions", () => {
  assert.ok(DOCUMENT_ACCEPT_STRING.includes(".pdf"));
  assert.ok(DOCUMENT_ACCEPT_STRING.includes(".doc"));
  assert.ok(DOCUMENT_ACCEPT_STRING.includes(".docx"));
  assert.ok(DOCUMENT_ACCEPT_STRING.includes(".xls"));
  assert.ok(DOCUMENT_ACCEPT_STRING.includes(".xlsx"));
  assert.ok(DOCUMENT_ACCEPT_STRING.includes(".csv"));
  assert.ok(DOCUMENT_ACCEPT_STRING.includes(".ppt"));
  assert.ok(DOCUMENT_ACCEPT_STRING.includes(".pptx"));
});

