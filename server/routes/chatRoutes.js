import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { getBus } from '../services/busService.js';
import { getSession } from '../services/sessionService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

/**
 * Landing page for bus chat
 */
router.get('/bus/:busId', (req, res) => {
    const { busId } = req.params;

    // Check if bus exists
    const bus = getBus(busId);
    if (!bus) {
        return res.status(404).send('אוטובוס לא נמצא');
    }

    // Serve the chat interface HTML
    res.sendFile(path.join(__dirname, '../../public/chat/index.html'));
});

/**
 * Check chat status API
 */
router.get('/api/chat/status/:busId', (req, res) => {
    const { busId } = req.params;

    const bus = getBus(busId);
    if (!bus) {
        return res.status(404).json({ error: 'Bus not found' });
    }

    const session = getSession(busId);

    if (session) {
        res.json({
            isActive: true,
            busId: bus.id,
            busName: bus.name,
            chatName: session.scheduleName,
            sessionId: session.sessionId,
            endsAt: session.endsAt
        });
    } else {
        res.json({
            isActive: false,
            busId: bus.id,
            busName: bus.name
        });
    }
});

export default router;
