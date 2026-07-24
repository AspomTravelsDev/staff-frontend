"use client";

export interface DeviceSignature {
  device_uuid: string;
  device_fingerprint: string;
  device_name: string;
}

const STORAGE_KEY = "aspom_device_uuid";

function getOrCreateDeviceUuid(): string {
  if (typeof window === "undefined") return "";

  let uuid = localStorage.getItem(STORAGE_KEY);
  if (!uuid) {
    if (typeof crypto !== "undefined" && crypto.randomUUID) {
      uuid = crypto.randomUUID();
    } else {
      uuid = `dev_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    }
    localStorage.setItem(STORAGE_KEY, uuid);
  }
  return uuid;
}

function getCanvasFingerprint(): string {
  if (typeof document === "undefined") return "no_canvas";

  try {
    const canvas = document.createElement("canvas");
    canvas.width = 200;
    canvas.height = 50;
    const ctx = canvas.getContext("2d");

    if (!ctx) return "no_ctx";

    ctx.textBaseline = "top";
    ctx.font = "14px 'Arial', sans-serif";
    ctx.textBaseline = "alphabetic";
    ctx.fillStyle = "#f60";
    ctx.fillRect(125, 1, 62, 20);

    ctx.fillStyle = "#069";
    ctx.fillText("AspomTravels,#1298!", 2, 15);
    ctx.fillStyle = "rgba(102, 204, 0, 0.7)";
    ctx.fillText("AspomTravels,#1298!", 4, 17);

    const dataUrl = canvas.toDataURL();
    let hash = 0;
    for (let i = 0; i < dataUrl.length; i++) {
      const char = dataUrl.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash |= 0;
    }
    return `cvs_${Math.abs(hash).toString(16)}`;
  } catch {
    return "canvas_error";
  }
}

function getGpuRenderer(): string {
  if (typeof document === "undefined") return "unknown_gpu";

  try {
    const canvas = document.createElement("canvas");
    const gl =
      canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
    if (!gl) return "no_webgl";

    const webgl = gl as WebGLRenderingContext;
    const debugInfo = webgl.getExtension("WEBGL_debug_renderer_info");

    if (debugInfo) {
      return webgl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) || "unknown_gpu";
    }
    return "standard_gpu";
  } catch {
    return "gpu_error";
  }
}

function getDeviceName(): string {
  if (typeof window === "undefined") return "Web Browser";

  const ua = navigator.userAgent;
  let browser = "Browser";
  if (ua.includes("Firefox")) browser = "Firefox";
  else if (ua.includes("Edg")) browser = "Edge";
  else if (ua.includes("Chrome")) browser = "Chrome";
  else if (ua.includes("Safari")) browser = "Safari";

  let os = "Desktop";
  if (ua.includes("Win")) os = "Windows";
  else if (ua.includes("Mac")) os = "macOS";
  else if (ua.includes("Linux")) os = "Linux";
  else if (ua.includes("Android")) os = "Android";
  else if (ua.includes("iPhone") || ua.includes("iPad")) os = "iOS";

  const screenRes = `${window.screen?.width || 0}x${window.screen?.height || 0}`;
  const cores = navigator.hardwareConcurrency ? `${navigator.hardwareConcurrency} Cores` : "";

  return `${browser} on ${os} (${screenRes}${cores ? `, ${cores}` : ""})`;
}

export function getDeviceSignature(): DeviceSignature {
  const device_uuid = getOrCreateDeviceUuid();
  const canvasHash = getCanvasFingerprint();
  const gpu = getGpuRenderer();
  const screenRes = `${typeof window !== "undefined" ? window.screen?.width : 0}x${typeof window !== "undefined" ? window.screen?.height : 0}`;
  const cores = typeof navigator !== "undefined" ? navigator.hardwareConcurrency || 0 : 0;
  const memory = typeof navigator !== "undefined" ? (navigator as any).deviceMemory || 0 : 0;
  const tz = typeof Intl !== "undefined" ? Intl.DateTimeFormat().resolvedOptions().timeZone : "";

  const combinedString = `${canvasHash}|${gpu}|${screenRes}|${cores}|${memory}|${tz}`;

  let hash = 0;
  for (let i = 0; i < combinedString.length; i++) {
    const char = combinedString.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  const device_fingerprint = `fp_${Math.abs(hash).toString(16)}`;
  const device_name = getDeviceName();

  return {
    device_uuid,
    device_fingerprint,
    device_name,
  };
}
