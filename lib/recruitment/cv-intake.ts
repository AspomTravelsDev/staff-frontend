export const CV_UPLOAD_LIMIT = 20;
export const CV_BATCH_ANALYZE_LIMIT = 50;
export const CV_MICRO_BATCH_SIZE = 4;
export const CV_FILE_BYTES = 15 * 1024 * 1024;

export function chunkItems<T>(items: T[], size: number): T[][] {
  if (size <= 0) return items.length ? [items] : [];
  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size));
  }
  return chunks;
}
export function cvFileError(file: Pick<File, "name" | "size">) {
  if (!/\.(pdf|docx?|txt)$/i.test(file.name)) return "Use a PDF, DOCX, DOC or TXT file.";
  if (!file.size) return "This file is empty.";
  if (file.size > CV_FILE_BYTES) return "This file exceeds the 15 MB limit.";
  return "";
}

/** Independent requests preserve successful work when another item fails. */
export async function runRecruitmentBatch<T>(items: T[], work: (item: T) => Promise<void>, concurrency = 2) {
  let next = 0;
  async function worker() {
    while (next < items.length) {
      const item = items[next++];
      await work(item);
    }
  }
  await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, worker));
}
