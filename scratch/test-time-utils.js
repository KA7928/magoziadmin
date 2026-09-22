function extractTimeTokens(timeStr) {
  if (!timeStr) return [];
  const cleaned = timeStr.trim().toUpperCase();
  const results = [];

  const regex = /(\d{1,2})(?::(\d{2}))?\s*(AM|PM)?/gi;

  let match;
  while ((match = regex.exec(cleaned)) !== null) {
    const hasColon = match[2] !== undefined;
    const hasPeriod = match[3] !== undefined;

    if (!hasColon && !hasPeriod) continue;

    const rawHours = parseInt(match[1], 10);
    const rawMinutes = hasColon ? parseInt(match[2], 10) : 0;
    const period = hasPeriod ? match[3].toUpperCase() : null;

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

function parseTimeToMinutes(timeStr, isCloseTime = false) {
  const tokens = extractTimeTokens(timeStr);
  if (tokens.length === 0) return null;

  if (isCloseTime && tokens.length > 1) {
    return tokens[tokens.length - 1].totalMinutes;
  }
  return tokens[0].totalMinutes;
}

function isCurrentTimeWithinOperatingHours(openTimeStr, closeTimeStr, targetDate = new Date()) {
  const openMins = parseTimeToMinutes(openTimeStr, false);
  const closeMins = parseTimeToMinutes(closeTimeStr, true);

  if (openMins === null || closeMins === null) {
    return true;
  }

  const currentMins = targetDate.getHours() * 60 + targetDate.getMinutes();

  if (openMins <= closeMins) {
    return currentMins >= openMins && currentMins <= closeMins;
  } else {
    return currentMins >= openMins || currentMins <= closeMins;
  }
}

console.log('--- TEST TIME TOKENS ---');
console.log('06:00 AM:', parseTimeToMinutes('06:00 AM', false));
console.log('11:30 PM:', parseTimeToMinutes('11:30 PM', true));
console.log('06:00 AM (Open Now):', parseTimeToMinutes('06:00 AM (Open Now)', false));
console.log('Range 06:00 AM - 11:30 PM (open):', parseTimeToMinutes('06:00 AM - 11:30 PM', false));
console.log('Range 06:00 AM - 11:30 PM (close):', parseTimeToMinutes('06:00 AM - 11:30 PM', true));
console.log('23:30:', parseTimeToMinutes('23:30'));

console.log('\n--- TEST OPERATING HOURS EVALUATION ---');
const date10am = new Date(2026, 8, 20, 10, 0); // 10:00 AM
const date1145pm = new Date(2026, 8, 20, 23, 45); // 11:45 PM
const date2am = new Date(2026, 8, 20, 2, 0); // 02:00 AM

console.log('06:00 AM to 11:30 PM at 10:00 AM ->', isCurrentTimeWithinOperatingHours('06:00 AM', '11:30 PM', date10am), '(Expected: true)');
console.log('06:00 AM to 11:30 PM at 11:45 PM ->', isCurrentTimeWithinOperatingHours('06:00 AM', '11:30 PM', date1145pm), '(Expected: false)');
console.log('06:00 AM to 11:30 PM at 02:00 AM ->', isCurrentTimeWithinOperatingHours('06:00 AM', '11:30 PM', date2am), '(Expected: false)');

console.log('\n--- OVERNIGHT SCHEDULE (10:00 PM to 02:00 AM) ---');
console.log('Overnight at 10:00 AM ->', isCurrentTimeWithinOperatingHours('10:00 PM', '02:00 AM', date10am), '(Expected: false)');
console.log('Overnight at 11:45 PM ->', isCurrentTimeWithinOperatingHours('10:00 PM', '02:00 AM', date1145pm), '(Expected: true)');
console.log('Overnight at 02:00 AM ->', isCurrentTimeWithinOperatingHours('10:00 PM', '02:00 AM', date2am), '(Expected: true)');
