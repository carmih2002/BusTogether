import { v4 as uuidv4 } from 'uuid';
import { getScheduleEndTime } from '../utils/timeUtils.js';

/**
 * In-memory active sessions storage
 */
const activeSessions = new Map();

/**
 * Create a new chat session
 */
export function createSession(bus, schedule) {
    const session = {
        sessionId: uuidv4(),
        busId: bus.id,
        busName: bus.name,
        scheduleName: schedule.chatName,
        scheduleId: schedule.id,
        startedAt: new Date(),
        endsAt: getScheduleEndTime(schedule),
        participants: new Map(), // socketId -> participant
        messages: [],
        bannedUsers: new Set(),
        reports: new Map(), // messageId -> Set of reporter socketIds
        userViolations: new Map() // socketId -> violation count
    };

    activeSessions.set(bus.id, session);
    console.log(`✅ Session created for bus ${bus.id} (${schedule.chatName})`);

    return session;
}

/**
 * Get active session for a bus
 */
export function getSession(busId) {
    return activeSessions.get(busId);
}

/**
 * Get all active sessions
 */
export function getAllSessions() {
    return Array.from(activeSessions.values());
}

/**
 * Close and delete a session
 */
export function closeSession(busId) {
    const session = activeSessions.get(busId);
    if (!session) {
        return false;
    }

    console.log(`🔒 Closing session for bus ${busId} (${session.scheduleName})`);

    // Complete data deletion
    session.participants.clear();
    session.messages = [];
    session.bannedUsers.clear();
    session.reports.clear();
    session.userViolations.clear();

    activeSessions.delete(busId);

    return true;
}

/**
 * Add participant to session
 */
export function addParticipant(busId, socketId, username) {
    const session = activeSessions.get(busId);
    if (!session) {
        return null;
    }

    // Check if user is banned
    if (session.bannedUsers.has(socketId)) {
        return null;
    }

    const participant = {
        socketId,
        username,
        joinedAt: new Date()
    };

    session.participants.set(socketId, participant);
    return participant;
}

/**
 * Remove participant from session
 */
export function removeParticipant(busId, socketId) {
    const session = activeSessions.get(busId);
    if (!session) {
        return false;
    }

    return session.participants.delete(socketId);
}

/**
 * Get participant by socket ID
 */
export function getParticipant(busId, socketId) {
    const session = activeSessions.get(busId);
    if (!session) {
        return null;
    }

    return session.participants.get(socketId);
}

/**
 * Add message to session
 */
export function addMessage(busId, socketId, text) {
    const session = activeSessions.get(busId);
    if (!session) {
        return null;
    }

    const participant = session.participants.get(socketId);
    if (!participant) {
        return null;
    }

    const message = {
        id: uuidv4(),
        socketId,
        username: participant.username,
        text,
        timestamp: new Date(),
        reported: false,
        reportCount: 0
    };

    session.messages.push(message);
    return message;
}

/**
 * Report a message
 */
export function reportMessage(busId, messageId, reporterSocketId) {
    const session = activeSessions.get(busId);
    if (!session) {
        return null;
    }

    const message = session.messages.find(m => m.id === messageId);
    if (!message) {
        return null;
    }

    // Initialize reports set for this message if needed
    if (!session.reports.has(messageId)) {
        session.reports.set(messageId, new Set());
    }

    // Add reporter
    session.reports.get(messageId).add(reporterSocketId);
    message.reportCount = session.reports.get(messageId).size;
    message.reported = true;

    return message;
}

/**
 * Delete message
 */
export function deleteMessage(busId, messageId) {
    const session = activeSessions.get(busId);
    if (!session) {
        return false;
    }

    const index = session.messages.findIndex(m => m.id === messageId);
    if (index === -1) {
        return false;
    }

    session.messages.splice(index, 1);
    session.reports.delete(messageId);

    return true;
}

/**
 * Ban user from session
 */
export function banUser(busId, socketId) {
    const session = activeSessions.get(busId);
    if (!session) {
        return false;
    }

    session.bannedUsers.add(socketId);
    session.participants.delete(socketId);

    return true;
}

/**
 * Track user violation
 */
export function addUserViolation(busId, socketId) {
    const session = activeSessions.get(busId);
    if (!session) {
        return 0;
    }

    const current = session.userViolations.get(socketId) || 0;
    const newCount = current + 1;
    session.userViolations.set(socketId, newCount);

    return newCount;
}

/**
 * Get user violation count
 */
export function getUserViolations(busId, socketId) {
    const session = activeSessions.get(busId);
    if (!session) {
        return 0;
    }

    return session.userViolations.get(socketId) || 0;
}

/**
 * Check if session should be closed
 */
export function shouldCloseSession(busId) {
    const session = activeSessions.get(busId);
    if (!session) {
        return false;
    }

    return new Date() >= session.endsAt;
}
