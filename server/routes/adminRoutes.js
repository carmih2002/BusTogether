import express from 'express';
import { requireAuth, login, logout, checkAuth } from '../middleware/auth.js';
import * as busService from '../services/busService.js';
import * as scheduleService from '../services/scheduleService.js';
import * as sessionService from '../services/sessionService.js';
import { manuallyCloseSession } from '../services/schedulerService.js';
import { generateBusQR, generateBusQRBuffer } from '../utils/qrGenerator.js';

const router = express.Router();

// Auth routes (no auth required)
router.post('/login', login);
router.post('/logout', logout);
router.get('/auth-status', checkAuth);

// All routes below require authentication
router.use(requireAuth);

// Bus management
router.get('/buses', (req, res) => {
    const buses = busService.getAllBuses();
    res.json(buses);
});

router.post('/buses', async (req, res) => {
    try {
        const { id, name } = req.body;

        if (!id || !name) {
            return res.status(400).json({ error: 'Bus ID and name are required' });
        }

        if (busService.busExists(id)) {
            return res.status(400).json({ error: 'Bus ID already exists' });
        }

        const bus = busService.createBus({ id, name });

        // Generate QR code
        const qrData = await generateBusQR(id, 'https://wise-cooks-think.loca.lt');
        bus.qrDataUrl = qrData.qrDataUrl;

        res.json(bus);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.put('/buses/:id', (req, res) => {
    try {
        const { id } = req.params;
        const { name } = req.body;

        const bus = busService.updateBus(id, { name });

        if (!bus) {
            return res.status(404).json({ error: 'Bus not found' });
        }

        res.json(bus);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.delete('/buses/:id', (req, res) => {
    try {
        const { id } = req.params;

        // Delete all schedules for this bus
        const schedules = scheduleService.getBusSchedules(id);
        schedules.forEach(schedule => scheduleService.deleteSchedule(schedule.id));

        // Close active session if any
        const session = sessionService.getSession(id);
        if (session) {
            const io = req.app.get('io');
            manuallyCloseSession(io, id);
        }

        const deleted = busService.deleteBus(id);

        if (!deleted) {
            return res.status(404).json({ error: 'Bus not found' });
        }

        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// QR code download
router.get('/buses/:id/qr', async (req, res) => {
    try {
        const { id } = req.params;

        if (!busService.busExists(id)) {
            return res.status(404).json({ error: 'Bus not found' });
        }

        const buffer = await generateBusQRBuffer(id, 'https://wise-cooks-think.loca.lt');

        res.setHeader('Content-Type', 'image/png');
        res.setHeader('Content-Disposition', `attachment; filename="bus-${id}-qr.png"`);
        res.send(buffer);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Schedule management
router.get('/schedules', (req, res) => {
    const { busId } = req.query;

    if (busId) {
        const schedules = scheduleService.getBusSchedules(busId);
        res.json(schedules);
    } else {
        const schedules = scheduleService.getAllSchedules();
        res.json(schedules);
    }
});

router.post('/schedules', (req, res) => {
    try {
        const { busId, daysOfWeek, startTime, endTime, chatName } = req.body;

        if (!busId || !daysOfWeek || !startTime || !endTime || !chatName) {
            return res.status(400).json({ error: 'All fields are required' });
        }

        if (!busService.busExists(busId)) {
            return res.status(404).json({ error: 'Bus not found' });
        }

        const schedule = scheduleService.createSchedule({
            busId,
            daysOfWeek,
            startTime,
            endTime,
            chatName
        });

        res.json(schedule);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.put('/schedules/:id', (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;

        const schedule = scheduleService.updateSchedule(id, updates);

        if (!schedule) {
            return res.status(404).json({ error: 'Schedule not found' });
        }

        res.json(schedule);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.delete('/schedules/:id', (req, res) => {
    try {
        const { id } = req.params;

        const deleted = scheduleService.deleteSchedule(id);

        if (!deleted) {
            return res.status(404).json({ error: 'Schedule not found' });
        }

        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Session monitoring
router.get('/sessions', (req, res) => {
    const sessions = sessionService.getAllSessions();

    // Convert to plain objects and include participant count
    const sessionsData = sessions.map(session => ({
        sessionId: session.sessionId,
        busId: session.busId,
        busName: session.busName,
        scheduleName: session.scheduleName,
        startedAt: session.startedAt,
        endsAt: session.endsAt,
        participantCount: session.participants.size,
        messageCount: session.messages.length,
        reportCount: session.reports.size
    }));

    res.json(sessionsData);
});

router.get('/sessions/:busId', (req, res) => {
    const { busId } = req.params;
    const session = sessionService.getSession(busId);

    if (!session) {
        return res.status(404).json({ error: 'Session not found' });
    }

    // Convert Maps to arrays
    const sessionData = {
        sessionId: session.sessionId,
        busId: session.busId,
        busName: session.busName,
        scheduleName: session.scheduleName,
        startedAt: session.startedAt,
        endsAt: session.endsAt,
        participants: Array.from(session.participants.values()),
        messages: session.messages,
        reportCount: session.reports.size
    };

    res.json(sessionData);
});

router.post('/sessions/:busId/close', (req, res) => {
    try {
        const { busId } = req.params;
        const io = req.app.get('io');

        const closed = manuallyCloseSession(io, busId);

        if (!closed) {
            return res.status(404).json({ error: 'Session not found' });
        }

        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

export default router;
