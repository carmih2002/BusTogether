import { v4 as uuidv4 } from 'uuid';
import { getBus } from './busService.js';

/**
 * In-memory schedule storage
 */
const schedules = new Map();

/**
 * Create a new schedule
 */
export function createSchedule(scheduleData) {
    const schedule = {
        id: uuidv4(),
        busId: scheduleData.busId,
        daysOfWeek: scheduleData.daysOfWeek, // Array of numbers 0-6
        startTime: scheduleData.startTime,   // "HH:MM"
        endTime: scheduleData.endTime,       // "HH:MM"
        chatName: scheduleData.chatName,
        isActive: true,
        createdAt: new Date()
    };

    schedules.set(schedule.id, schedule);

    // Add to bus's schedules array
    const bus = getBus(schedule.busId);
    if (bus) {
        bus.schedules.push(schedule);
    }

    return schedule;
}

/**
 * Get schedule by ID
 */
export function getSchedule(scheduleId) {
    return schedules.get(scheduleId);
}

/**
 * Get all schedules for a bus
 */
export function getBusSchedules(busId) {
    return Array.from(schedules.values()).filter(s => s.busId === busId);
}

/**
 * Get all schedules
 */
export function getAllSchedules() {
    return Array.from(schedules.values());
}

/**
 * Update schedule
 */
export function updateSchedule(scheduleId, updates) {
    const schedule = schedules.get(scheduleId);
    if (!schedule) {
        return null;
    }

    Object.assign(schedule, updates);
    schedules.set(scheduleId, schedule);

    // Update in bus's schedules array
    const bus = getBus(schedule.busId);
    if (bus) {
        const index = bus.schedules.findIndex(s => s.id === scheduleId);
        if (index !== -1) {
            bus.schedules[index] = schedule;
        }
    }

    return schedule;
}

/**
 * Delete schedule
 */
export function deleteSchedule(scheduleId) {
    const schedule = schedules.get(scheduleId);
    if (!schedule) {
        return false;
    }

    // Remove from bus's schedules array
    const bus = getBus(schedule.busId);
    if (bus) {
        bus.schedules = bus.schedules.filter(s => s.id !== scheduleId);
    }

    return schedules.delete(scheduleId);
}

/**
 * Get active schedules for current time
 */
export function getActiveSchedules() {
    const now = new Date();
    const currentDay = now.getDay();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const currentTime = `${String(currentHour).padStart(2, '0')}:${String(currentMinute).padStart(2, '0')}`;

    return Array.from(schedules.values()).filter(schedule => {
        if (!schedule.isActive) return false;
        if (!schedule.daysOfWeek.includes(currentDay)) return false;

        // Simple time comparison (works for same-day schedules)
        return currentTime >= schedule.startTime && currentTime < schedule.endTime;
    });
}
