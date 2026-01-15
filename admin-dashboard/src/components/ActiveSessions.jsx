import { useState, useEffect } from 'react';
import api from '../services/api';

function ActiveSessions() {
    const [sessions, setSessions] = useState([]);
    const [selectedSession, setSelectedSession] = useState(null);
    const [sessionDetails, setSessionDetails] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        loadSessions();
        const interval = setInterval(loadSessions, 5000); // Refresh every 5 seconds
        return () => clearInterval(interval);
    }, []);

    async function loadSessions() {
        try {
            const data = await api.getSessions();
            setSessions(data);

            // Refresh selected session details if one is selected
            if (selectedSession) {
                const details = await api.getSession(selectedSession.busId);
                setSessionDetails(details);
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }

    async function handleSelectSession(session) {
        setSelectedSession(session);
        try {
            const details = await api.getSession(session.busId);
            setSessionDetails(details);
        } catch (err) {
            setError(err.message);
        }
    }

    async function handleCloseSession(busId) {
        if (!confirm('האם אתה בטוח שברצונך לסגור את הצ\'אט? כל המשתתפים ינותקו.')) {
            return;
        }

        try {
            await api.closeSession(busId);
            setSelectedSession(null);
            setSessionDetails(null);
            await loadSessions();
        } catch (err) {
            setError(err.message);
        }
    }

    function formatTime(date) {
        return new Date(date).toLocaleTimeString('he-IL', {
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    function getTimeRemaining(endsAt) {
        const now = new Date();
        const end = new Date(endsAt);
        const diff = end - now;

        if (diff <= 0) return 'מסתיים עכשיו';

        const minutes = Math.floor(diff / 60000);
        if (minutes < 60) {
            return `${minutes} דקות נותרו`;
        }

        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        return `${hours}:${String(mins).padStart(2, '0')} שעות נותרות`;
    }

    if (loading) {
        return <div className="loading">טוען צ'אטים פעילים...</div>;
    }

    return (
        <div className="section">
            <div className="section-header">
                <h2>צ'אטים פעילים</h2>
                <button onClick={loadSessions} className="secondary-btn">
                    🔄 רענון
                </button>
            </div>

            {error && <div className="error-banner">{error}</div>}

            {sessions.length === 0 ? (
                <div className="empty-state">
                    <p>אין צ'אטים פעילים כרגע</p>
                    <p className="hint">צ'אטים ייפתחו אוטומטית לפי הזמנים שהוגדרו</p>
                </div>
            ) : (
                <div className="sessions-layout">
                    <div className="sessions-list">
                        {sessions.map(session => (
                            <div
                                key={session.sessionId}
                                className={`session-card ${selectedSession?.sessionId === session.sessionId ? 'selected' : ''}`}
                                onClick={() => handleSelectSession(session)}
                            >
                                <div className="session-header">
                                    <h3>{session.scheduleName}</h3>
                                    <span className="status-badge active">פעיל</span>
                                </div>

                                <div className="session-info">
                                    <div className="info-item">
                                        <span className="icon">🚌</span>
                                        <span>{session.busName}</span>
                                    </div>
                                    <div className="info-item">
                                        <span className="icon">👥</span>
                                        <span>{session.participantCount} משתתפים</span>
                                    </div>
                                    <div className="info-item">
                                        <span className="icon">💬</span>
                                        <span>{session.messageCount} הודעות</span>
                                    </div>
                                    <div className="info-item">
                                        <span className="icon">⏰</span>
                                        <span>{getTimeRemaining(session.endsAt)}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {selectedSession && sessionDetails && (
                        <div className="session-details">
                            <div className="details-header">
                                <h3>{sessionDetails.scheduleName}</h3>
                                <button
                                    onClick={() => handleCloseSession(sessionDetails.busId)}
                                    className="danger-btn"
                                >
                                    סגור צ'אט
                                </button>
                            </div>

                            <div className="details-section">
                                <h4>משתתפים ({sessionDetails.participants.length})</h4>
                                <div className="participants-list">
                                    {sessionDetails.participants.map((p, i) => (
                                        <div key={i} className="participant-item">
                                            <span className="participant-name">{p.username}</span>
                                            <span className="participant-time">
                                                הצטרף {formatTime(p.joinedAt)}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="details-section">
                                <h4>הודעות ({sessionDetails.messages.length})</h4>
                                <div className="messages-list">
                                    {sessionDetails.messages.slice(-20).reverse().map((msg) => (
                                        <div key={msg.id} className="message-item">
                                            <div className="message-header-admin">
                                                <span className="message-username-admin">{msg.username}</span>
                                                <span className="message-time-admin">{formatTime(msg.timestamp)}</span>
                                            </div>
                                            <div className="message-text-admin">{msg.text}</div>
                                            {msg.reported && (
                                                <div className="message-flag">🚩 דווח {msg.reportCount} פעמים</div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

export default ActiveSessions;
