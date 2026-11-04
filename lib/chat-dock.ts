export type ChatDock = { edge: "left" | "right"; level: "top" | "middle" | "bottom" };
export const DEFAULT_CHAT_DOCK: ChatDock = { edge: "right", level: "bottom" };
export const CHAT_DOCK_STORAGE_KEY = "aspom:chat-dock";
export const CHAT_BUTTON_SIZE = 56;

export function parseChatDock(value: string | null): ChatDock {
  try {
    const dock = JSON.parse(value || "null");
    if (dock && ["left", "right"].includes(dock.edge) && ["top", "middle", "bottom"].includes(dock.level)) return { edge: dock.edge, level: dock.level };
  } catch { /* A blocked or outdated preference must not affect chat access. */ }
  return DEFAULT_CHAT_DOCK;
}

export function clampChatPoint(x: number, y: number, width: number, height: number) {
  return { x: Math.max(0, Math.min(x, width - CHAT_BUTTON_SIZE)), y: Math.max(0, Math.min(y, height - CHAT_BUTTON_SIZE)) };
}

export function snapChatDock(x: number, y: number, width: number, height: number): ChatDock {
  const maxX = Math.max(0, width - CHAT_BUTTON_SIZE);
  const maxY = Math.max(0, height - CHAT_BUTTON_SIZE);
  const level = maxY === 0 || y < maxY / 4 ? "top" : y > maxY * 3 / 4 ? "bottom" : "middle";
  return { edge: x < maxX / 2 ? "left" : "right", level };
}
