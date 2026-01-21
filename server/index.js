import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import session from 'express-session';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

import { config } from './config/config.js';
import adminRoutes from './routes/adminRoutes.js';
import chatRoutes from './routes/chatRoutes.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import { startScheduler } from './services/schedulerService.js';
import * as sessionService from './services/sessionService.js';
import * as moderationService from './services/moderationService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Express app
const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST']
    }
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Trust proxy for Railway/Heroku (required for secure cookies behind reverse proxy)
if (config.environment === 'production') {
    app.set('trust proxy', 1);
}

// Session middleware
app.use(session({
    secret: config.sessionSecret,
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: config.environment === 'production',
        httpOnly: true,
        sameSite: config.environment === 'production' ? 'strict' : 'lax',
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
}));

// Serve static files
app.use(express.static(path.join(__dirname, '../public')));

// Serve admin dashboard (built React app)
const adminPath = path.join(__dirname, '../admin-dashboard/dist');
app.use('/admin', express.static(adminPath));
app.get('/admin/*', (req, res) => {
    res.sendFile(path.join(adminPath, 'index.html'));
});

// Make io available to routes
app.set('io', io);

// Routes
app.use('/api/admin', adminRoutes);
app.use('/', chatRoutes);

// Error handlers
app.use(notFoundHandler);
app.use(errorHandler);

// Socket.IO connection handling
io.on('connection', (socket) => {
    console.log(`🔌 Socket connected: ${socket.id}`);

    let currentBusId = null;
    let lastMessageTime = 0;

    /**
     * Join chat
     */
    socket.on('join-chat', ({ busId, username }) => {
        try {
            // Validate username
            const sanitized = moderationService.sanitizeUsername(username);
            if (!moderationService.isValidUsername(sanitized, config.minUsernameLength, config.maxUsernameLength)) {
                socket.emit('error', { message: 'שם משתמש לא תקין' });
                return;
            }

            // Check if session exists
            const session = sessionService.getSession(busId);
            if (!session) {
                socket.emit('error', { message: 'אין צ\'אט פעיל כרגע' });
                return;
            }

            // Add participant
            const participant = sessionService.addParticipant(busId, socket.id, sanitized);
            if (!participant) {
                socket.emit('error', { message: 'לא ניתן להצטרף לצ\'אט' });
                return;
            }

            // Join socket room
            socket.join(busId);
            currentBusId = busId;

            // Send confirmation to user
            socket.emit('chat-joined', {
                sessionId: session.sessionId,
                chatName: session.scheduleName,
                participants: Array.from(session.participants.values()).map(p => ({
                    username: p.username,
                    joinedAt: p.joinedAt
                })),
                messages: session.messages.map(m => ({
                    id: m.id,
                    username: m.username,
                    text: m.text,
                    timestamp: m.timestamp
                }))
            });

            // Notify others
            socket.to(busId).emit('user-joined', {
                username: sanitized
            });

            console.log(`👤 ${sanitized} joined bus ${busId}`);

        } catch (error) {
            console.error('Error joining chat:', error);
            socket.emit('error', { message: 'שגיאה בהצטרפות לצ\'אט' });
        }
    });

    /**
     * Send message
     */
    socket.on('send-message', ({ text }) => {
        try {
            if (!currentBusId) {
                socket.emit('error', { message: 'לא מחובר לצ\'אט' });
                return;
            }

            // Rate limiting
            const now = Date.now();
            if (now - lastMessageTime < config.messageCooldown) {
                socket.emit('error', { message: 'אנא המתן לפני שליחת הודעה נוספת' });
                return;
            }
            lastMessageTime = now;

            // Validate message
            if (!moderationService.isValidMessage(text, config.maxMessageLength)) {
                socket.emit('error', { message: 'הודעה לא תקינה' });
                return;
            }

            // Moderate content
            const moderation = moderationService.moderateMessage(text);

            if (!moderation.isValid) {
                if (moderation.action === 'warn' || moderation.action === 'delete') {
                    // Track violation
                    const violations = sessionService.addUserViolation(currentBusId, socket.id);

                    socket.emit('error', { message: moderation.reason });

                    // Kick if threshold reached
                    if (violations >= config.profanityKickThreshold) {
                        sessionService.banUser(currentBusId, socket.id);
                        socket.emit('kicked', { reason: 'הוצאת מהצ\'אט בגלל הפרות חוזרות' });
                        socket.leave(currentBusId);
                        socket.disconnect(true);

                        io.to(currentBusId).emit('user-left', {
                            username: sessionService.getParticipant(currentBusId, socket.id)?.username
                        });
                    }

                    return;
                }
            }

            // Add message
            const message = sessionService.addMessage(currentBusId, socket.id, text);
            if (!message) {
                socket.emit('error', { message: 'שגיאה בשליחת הודעה' });
                return;
            }

            // Broadcast to all in room
            io.to(currentBusId).emit('new-message', {
                id: message.id,
                username: message.username,
                text: message.text,
                timestamp: message.timestamp
            });

        } catch (error) {
            console.error('Error sending message:', error);
            socket.emit('error', { message: 'שגיאה בשליחת הודעה' });
        }
    });

    /**
     * Report message
     */
    socket.on('report-message', ({ messageId }) => {
        try {
            if (!currentBusId) {
                return;
            }

            const message = sessionService.reportMessage(currentBusId, messageId, socket.id);
            if (!message) {
                return;
            }

            console.log(`🚩 Message ${messageId} reported (count: ${message.reportCount})`);

            // Auto-delete if threshold reached
            if (message.reportCount >= config.reportDeleteThreshold) {
                sessionService.deleteMessage(currentBusId, messageId);
                io.to(currentBusId).emit('message-deleted', { messageId });
                console.log(`🗑️ Message ${messageId} auto-deleted after ${message.reportCount} reports`);
            }

            socket.emit('report-received', { messageId });

        } catch (error) {
            console.error('Error reporting message:', error);
        }
    });

    /**
     * Leave chat
     */
    socket.on('leave-chat', () => {
        handleDisconnect();
    });

    /**
     * Disconnect
     */
    socket.on('disconnect', () => {
        handleDisconnect();
    });

    /**
     * Handle user disconnect/leave
     */
    function handleDisconnect() {
        if (currentBusId) {
            const participant = sessionService.getParticipant(currentBusId, socket.id);

            if (participant) {
                sessionService.removeParticipant(currentBusId, socket.id);

                socket.to(currentBusId).emit('user-left', {
                    username: participant.username
                });

                console.log(`👋 ${participant.username} left bus ${currentBusId}`);
            }

            socket.leave(currentBusId);
            currentBusId = null;
        }

        console.log(`🔌 Socket disconnected: ${socket.id}`);
    }
});

// Start scheduler
startScheduler(io);

// Start server
httpServer.listen(config.port, () => {
    console.log(`
╔════════════════════════════════════════╗
║      🚌 BusTogether Server Running     ║
╠════════════════════════════════════════╣
║  Port: ${config.port}                           ║
║  Environment: ${config.environment}            ║
║  Admin Dashboard: http://localhost:${config.port}/admin ║
╚════════════════════════════════════════╝
  `);
});

export default app;
