export type ClockInMode = "normal" | "qrcode" | "both";

/**
 * Attendance configuration.
 *
 * Mode can be controlled via NEXT_PUBLIC_CLOCK_IN_MODE in .env or environment variables:
 * - "normal": Standard header widget button only (current behavior).
 * - "qrcode": QR code scan required at office (header button guides to scan wall QR).
 * - "both": Both header widget button and wall QR scan are allowed (default, zero breakage).
 */
export const ATTENDANCE_CONFIG = {
  mode: (process.env.NEXT_PUBLIC_CLOCK_IN_MODE || "normal") as ClockInMode,

  /**
   * Helper to check if standard portal button clock-in is enabled.
   */
  isButtonEnabled(): boolean {
    return this.mode === "normal" || this.mode === "both";
  },

  /**
   * Helper to check if QR code clock-in is enabled.
   */
  isQrCodeEnabled(): boolean {
    return this.mode === "qrcode" || this.mode === "both";
  },

  /**
   * Helper to check if login should automatically attempt clock-in.
   * When mode is 'qrcode', login must NEVER automatically clock in the user.
   */
  isLoginAutoClockInEnabled(): boolean {
    if (this.mode === "qrcode") return false;
    return process.env.NEXT_PUBLIC_CLOCK_IN_ON_LOGIN !== "false";
  },
};
