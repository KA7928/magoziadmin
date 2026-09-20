/**
 * Utility functions for App Opening / Closing Operating Hours
 */

/**
 * Parses a time string (e.g., "06:00 AM", "11:30 PM", "06:00", "23:30") into total minutes from midnight (0..1439).
 * Returns null if format cannot be parsed.
 */
export function parseTimeToMinutes(timeStr: string): number | null {
  if (!timeStr) return null;
  const cleaned = timeStr.trim().toUpperCase();

  // 12-hour format with AM/PM e.g. "06:00 AM", "6:00PM", "11:30 PM", "12:00 AM", "12:30 PM"
  const ampmMatch = cleaned.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/);
  if (ampmMatch) {
    let hours = parseInt(ampmMatch[1], 10);
    const minutes = parseInt(ampmMatch[2], 10);
    const period = ampmMatch[3];

    if (hours < 1 || hours > 12 || minutes < 0 || minutes > 59) return null;

    if (period === "PM" && hours < 12) hours += 12;
    if (period === "AM" && hours === 12) hours = 0;

    return hours * 60 + minutes;
  }

  // 24-hour format e.g. "06:00", "23:30", "00:15"
  const h24Match = cleaned.match(/^(\d{1,2}):(\d{2})$/);
  if (h24Match) {
    const hours = parseInt(h24Match[1], 10);
    const minutes = parseInt(h24Match[2], 10);

    if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) return null;

    return hours * 60 + minutes;
  }

  return null;
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
 * Converts HH:MM 24-hour format string to 12-hour AM/PM string.
 */
export function convert24To12Hour(h24Time: string): string {
  const mins = parseTimeToMinutes(h24Time);
  if (mins === null) return h24Time;
  return formatMinutesTo12Hour(mins);
}

/**
 * Converts 12-hour AM/PM string or 24-hour string to HH:MM 24-hour format string for HTML <input type="time">.
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
  const openMins = parseTimeToMinutes(openTimeStr);
  const closeMins = parseTimeToMinutes(closeTimeStr);

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
