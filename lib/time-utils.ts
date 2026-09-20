/**
 * Utility functions for App Opening / Closing Operating Hours
 */

export interface TimeToken {
  hours: number;
  minutes: number;
  period: "AM" | "PM" | null;
  totalMinutes: number;
}

/**
 * Extracts all time tokens found in a text string.
 * Handles formats: "06:00 AM", "6:00PM", "11:30 PM", "6 AM", "23:30", "06:00"
 * Ignores plain numbers without colons or AM/PM (e.g. "Store 1").
 */
export function extractTimeTokens(timeStr: string): TimeToken[] {
  if (!timeStr) return [];
  const cleaned = timeStr.trim().toUpperCase();
  const results: TimeToken[] = [];

  // Match pattern: 1-2 digits, optional :MM, optional AM/PM
  const regex = /(\d{1,2})(?::(\d{2}))?\s*(AM|PM)?/gi;

  let match: RegExpExecArray | null;
  while ((match = regex.exec(cleaned)) !== null) {
    const hasColon = match[2] !== undefined;
    const hasPeriod = match[3] !== undefined;

    // Must have either a colon (e.g. 06:00) or an AM/PM period (e.g. 6 AM)
    if (!hasColon && !hasPeriod) {
      continue;
    }

    const rawHours = parseInt(match[1], 10);
    const rawMinutes = hasColon ? parseInt(match[2], 10) : 0;
    const period = hasPeriod ? (match[3].toUpperCase() as "AM" | "PM") : null;

    if (isNaN(rawHours) || isNaN(rawMinutes)) continue;
    if (rawMinutes < 0 || rawMinutes > 59) continue;

    let hours = rawHours;

    if (period) {
      if (hours < 1 || hours > 12) continue;
      if (period === "PM" && hours < 12) hours += 12;
      if (period === "AM" && hours === 12) hours = 0;
    } else {
      if (hours < 0 || hours > 23) continue;
    }

    const totalMinutes = hours * 60 + rawMinutes;
    results.push({ hours, minutes: rawMinutes, period, totalMinutes });
  }

  return results;
}

/**
 * Parses a time string into total minutes from midnight (0..1439).
 * If multiple time tokens are present in the string (e.g. "06:00 AM - 11:30 PM"):
 * - isCloseTime = false returns the FIRST token (06:00 AM -> 360)
 * - isCloseTime = true returns the LAST token (11:30 PM -> 1410)
 * Returns null if no valid time token could be extracted.
 */
export function parseTimeToMinutes(timeStr: string, isCloseTime: boolean = false): number | null {
  const tokens = extractTimeTokens(timeStr);
  if (tokens.length === 0) return null;

  if (isCloseTime && tokens.length > 1) {
    return tokens[tokens.length - 1].totalMinutes;
  }
  return tokens[0].totalMinutes;
}

/**
 * Converts minutes from midnight (0..1439) to a formatted 12-hour string (e.g. "06:00 AM", "11:30 PM").
 */
export function formatMinutesTo12Hour(totalMinutes: number): string {
  const normMins = ((totalMinutes % 1440) + 1440) % 1440;
  let hours = Math.floor(normMins / 60);
  const minutes = normMins % 60;
  const period = hours >= 12 ? "PM" : "AM";

  hours = hours % 12;
  if (hours === 0) hours = 12;

  const hoursStr = String(hours).padStart(2, "0");
  const minsStr = String(minutes).padStart(2, "0");

  return `${hoursStr}:${minsStr} ${period}`;
}

/**
 * Converts HH:MM 24-hour format string or loose string to 12-hour AM/PM string.
 */
export function convert24To12Hour(h24Time: string): string {
  const mins = parseTimeToMinutes(h24Time);
  if (mins === null) return h24Time;
  return formatMinutesTo12Hour(mins);
}

/**
 * Converts 12-hour AM/PM string or loose string to HH:MM 24-hour format string for HTML <input type="time">.
 */
export function convertTo24HourInput(timeStr: string): string {
  const mins = parseTimeToMinutes(timeStr);
  if (mins === null) return "06:00";
  const hours = Math.floor(mins / 60);
  const minutes = mins % 60;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

/**
 * Checks if a given time (or current Date) falls inside the operating hours range [openTimeStr, closeTimeStr].
 * Correctly handles same-day shifts (e.g. 06:00 AM to 11:30 PM) and overnight shifts (e.g. 10:00 PM to 02:00 AM).
 */
export function isCurrentTimeWithinOperatingHours(
  openTimeStr: string,
  closeTimeStr: string,
  targetDate: Date = new Date()
): boolean {
  const openMins = parseTimeToMinutes(openTimeStr, false);
  const closeMins = parseTimeToMinutes(closeTimeStr, true);

  // If time format cannot be parsed, default to OPEN (true) to prevent accidental lockdown
  if (openMins === null || closeMins === null) {
    return true;
  }

  const currentMins = targetDate.getHours() * 60 + targetDate.getMinutes();

  if (openMins <= closeMins) {
    // Normal daytime schedule e.g., 06:00 AM (360) to 11:30 PM (1410)
    return currentMins >= openMins && currentMins <= closeMins;
  } else {
    // Overnight schedule e.g., 10:00 PM (1320) to 02:00 AM (120)
    return currentMins >= openMins || currentMins <= closeMins;
  }
}
