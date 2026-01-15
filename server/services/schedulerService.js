import cron from 'node-cron';
import { getAllSchedules } from './scheduleService.js';
import { getBus } from './busService.js';
import { createSession, closeSession, getSession, shouldCloseSession } from './sessionService.js';
import { isScheduleActive } from '../utils/timeUtils.js';

/**
 * Start the scheduler that checks for session open/close times
 */
export function startScheduler(io) {
    console.log('🕐 Starting session scheduler...');

    // Run every minute
    cron.schedule('* * * * *', () => {
        checkSchedules(io);
    });

    // Also run immediately on startup
    checkSchedules(io);
}

/**
 * Check all schedules and open/close sessions as needed
 */
function checkSchedules(io) {
    const now = new Date();
    const schedules = getAllSchedules();

    for (const schedule of schedules) {
        const bus = getBus(schedule.busId);
        if (!bus) continue;

        const existingSession = getSession(bus.id);
        const shouldBeActive = isScheduleActive(schedule);

        // Open session if it should be active but isn't
        if (shouldBeActive && !existingSession) {
            const session = createSession(bus, schedule);
            console.log(`📅 Opened chat for ${bus.name} at ${now.toLocaleTimeString('he-IL')}`);
        }

        // Close session if it exists and should be closed
        if (existingSession && shouldCloseSession(bus.id)) {
            // Notify all participants
            io.to(bus.id).emit('chat-closed', {
                message: 'הצ\'אט נסגר. תודה שהשתתפת!'
            });

            // Disconnect all sockets in this room
            const sockets = io.sockets.adapter.rooms.get(bus.id);
            if (sockets) {
                for (const socketId of sockets) {
                    const socket = io.sockets.sockets.get(socketId);
                    if (socket) {
                        socket.leave(bus.id);
                        socket.disconnect(true);
                    }
                }
            }

            closeSession(bus.id);
            console.log(`📅 Closed chat for ${bus.name} at ${now.toLocaleTimeString('he-IL')}`);
        }
    }
}

/**
 * Manually close a session (admin action)
 */
export function manuallyCloseSession(io, busId) {
    const session = getSession(busId);
    if (!session) {
        return false;
    }

    // Notify participants
    io.to(busId).emit('chat-closed', {
        message: 'הצ\'אט נסגר על ידי המנהל'
    });

    // Disconnect all sockets
    const sockets = io.sockets.adapter.rooms.get(busId);
    if (sockets) {
        for (const socketId of sockets) {
            const socket = io.sockets.sockets.get(socketId);
            if (socket) {
                socket.leave(busId);
                socket.disconnect(true);
            }
        }
    }

    closeSession(busId);
    return true;
}
