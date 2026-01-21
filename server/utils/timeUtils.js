/**
 * Time utility functions for schedule management
 */

// Israel timezone
const TIMEZONE = 'Asia/Jerusalem';

/**
 * Get current time in Israel timezone
 */
export function getIsraelTime() {
    return new Date(new Date().toLocaleString('en-US', { timeZone: TIMEZONE }));
}

/**
 * Format Date to HH:MM string (in Israel timezone)
 */
export function formatTime(date) {
    const israelDate = new Date(date.toLocaleString('en-US', { timeZone: TIMEZONE }));
    const hours = String(israelDate.getHours()).padStart(2, '0');
    const minutes = String(israelDate.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
}

/**
 * Parse HH:MM string to minutes since midnight
 */
export function timeToMinutes(timeStr) {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + minutes;
}

/**
 * Check if current time is within schedule window
 */
export function isTimeInWindow(currentTime, startTime, endTime) {
    const current = timeToMinutes(currentTime);
    const start = timeToMinutes(startTime);
    const end = timeToMinutes(endTime);

    return current >= start && current < end;
}

/**
 * Check if schedule should be active now
 */
export function isScheduleActive(schedule) {
    const now = getIsraelTime();
    const currentDay = now.getDay(); // 0 = Sunday, 6 = Saturday
    const currentTime = formatTime(new Date());

    // Check if today is in the schedule's days
    if (!schedule.daysOfWeek.includes(currentDay)) {
        return false;
    }

    // Check if current time is within the window
    return isTimeInWindow(currentTime, schedule.startTime, schedule.endTime);
}

/**
 * Get end time as Date object for a schedule starting now
 */
export function getScheduleEndTime(schedule) {
    const now = new Date();
    const [hours, minutes] = schedule.endTime.split(':').map(Number);

    const endTime = new Date(now);
    endTime.setHours(hours, minutes, 0, 0);

    return endTime;
}

/**
 * Calculate time remaining in minutes
 */
export function getTimeRemaining(endTime) {
    const now = new Date();
    const diff = endTime - now;
    return Math.max(0, Math.floor(diff / 60000)); // Convert to minutes
}
