import { DocumentFolder } from "@/types/file-types";

export interface FolderTreeNode {
  id: string;
  name: string;
  depth: number;
  fullPath: string; // e.g. "Canada / Visitor Visa / Financials"
  parentPath: string | null; // e.g. "Canada / Visitor Visa"
  parent_id: string | null;
  folder: DocumentFolder;
}

/**
 * Returns the chain of folder names from root down to the specified folder.
 */
export function getFolderPathSegments(
  folderId: string | null | undefined,
  foldersById: Map<string, DocumentFolder>
): string[] {
  if (!folderId || folderId === "root") {
    return ["Root"];
  }

  const segments: string[] = [];
  let current = foldersById.get(folderId);
  const visited = new Set<string>();

  while (current && !visited.has(current.id)) {
    visited.add(current.id);
    segments.unshift(current.name);
    current = current.parent_id ? foldersById.get(current.parent_id) : undefined;
  }

  return segments.length > 0 ? segments : ["Root"];
}

/**
 * Returns a human-readable path string for a folder ID (e.g. "Canada / Visitor Visa").
 */
export function formatFolderPath(
  folderId: string | null | undefined,
  foldersById: Map<string, DocumentFolder>
): string {
  if (!folderId || folderId === "root") {
    return "Root Folder";
  }
  const segments = getFolderPathSegments(folderId, foldersById);
  return segments.join(" / ");
}

/**
 * Builds a depth-first ordered list of folders with nesting depth and full path.
 * Top-level folders are sorted alphabetically, followed by their children recursively.
 */
export function buildFolderTree(
  folders: DocumentFolder[],
  excludeFolderId?: string | null
): FolderTreeNode[] {
  const foldersById = new Map<string, DocumentFolder>(
    folders.map((f) => [f.id, f])
  );

  // If excludeFolderId is provided (e.g. when moving a folder),
  // find that folder and all its descendants to prevent circular reference.
  const excludedIds = new Set<string>();
  if (excludeFolderId) {
    excludedIds.add(excludeFolderId);
    let changed = true;
    while (changed) {
      changed = false;
      for (const f of folders) {
        if (f.parent_id && excludedIds.has(f.parent_id) && !excludedIds.has(f.id)) {
          excludedIds.add(f.id);
          changed = true;
        }
      }
    }
  }

  // Group direct children by parent_id
  const childrenByParent = new Map<string | null, DocumentFolder[]>();
  for (const f of folders) {
    if (excludedIds.has(f.id)) continue;

    // If parent is missing or also excluded, treat as root-level
    const effectiveParentId =
      f.parent_id && foldersById.has(f.parent_id) && !excludedIds.has(f.parent_id)
        ? f.parent_id
        : null;

    const list = childrenByParent.get(effectiveParentId) || [];
    list.push(f);
    childrenByParent.set(effectiveParentId, list);
  }

  // Sort each sibling group alphabetically (case-insensitive)
  for (const list of childrenByParent.values()) {
    list.sort((a, b) =>
      a.name.localeCompare(b.name, undefined, { sensitivity: "base" })
    );
  }

  const result: FolderTreeNode[] = [];
  const visited = new Set<string>();

  function traverse(parentId: string | null, depth: number) {
    const children = childrenByParent.get(parentId) || [];
    for (const child of children) {
      if (visited.has(child.id)) continue;
      visited.add(child.id);

      const segments = getFolderPathSegments(child.id, foldersById);
      const fullPath = segments.join(" / ");
      const parentSegments = segments.slice(0, -1);
      const parentPath = parentSegments.length > 0 ? parentSegments.join(" / ") : null;

      result.push({
        id: child.id,
        name: child.name,
        depth,
        fullPath,
        parentPath,
        parent_id: child.parent_id,
        folder: child,
      });

      traverse(child.id, depth + 1);
    }
  }

  // Start depth-first traversal from root (null parent)
  traverse(null, 0);

  // Safety fallback: capture any detached nodes not yet visited
  for (const f of folders) {
    if (!visited.has(f.id) && !excludedIds.has(f.id)) {
      visited.add(f.id);
      const segments = getFolderPathSegments(f.id, foldersById);
      result.push({
        id: f.id,
        name: f.name,
        depth: 0,
        fullPath: segments.join(" / "),
        parentPath: null,
        parent_id: f.parent_id,
        folder: f,
      });
    }
  }

  return result;
}
