export function generateStrongPassword(length = 16): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%^&*";
  const array = new Uint8Array(length);
  if (typeof crypto !== "undefined" && crypto.getRandomValues) {
    crypto.getRandomValues(array);
    return Array.from(array)
      .map((x) => chars[x % chars.length])
      .join("");
  }
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export const SECRET_TAG_REGEX = /\[secret:([0-9a-fA-F-]{36})(?::([^\]]+))?\]/;

export function formatSecretTag(secretId: string, title?: string): string {
  return title ? `[secret:${secretId}:${title}]` : `[secret:${secretId}]`;
}

export function extractSecretInfo(text?: string | null): { secretId: string; title?: string } | null {
  if (!text) return null;
  const match = text.match(SECRET_TAG_REGEX);
  if (!match) return null;
  return {
    secretId: match[1],
    title: match[2] || undefined,
  };
}
