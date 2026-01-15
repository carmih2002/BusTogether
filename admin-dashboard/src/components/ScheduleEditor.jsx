import { useState, useEffect } from 'react';
import api from '../services/api';

const DAYS = [
    { value: 0, label: 'ראשון' },
    { value: 1, label: 'שני' },
    { value: 2, label: 'שלישי' },
    { value: 3, label: 'רביעי' },
    { value: 4, label: 'חמישי' },
    { value: 5, label: 'שישי' },
    { value: 6, label: 'שבת' }
];

function ScheduleEditor({ selectedBus }) {
    const [buses, setBuses] = useState([]);
    const [currentBus, setCurrentBus] = useState(selectedBus);
    const [schedules, setSchedules] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [formData, setFormData] = useState({
        busId: selectedBus?.id || '',
        daysOfWeek: [],
        startTime: '',
        endTime: '',
        chatName: ''
    });
    const [error, setError] = useState('');

    useEffect(() => {
        loadBuses();
    }, []);

    useEffect(() => {
        if (selectedBus) {
            setCurrentBus(selectedBus);
            setFormData({ ...formData, busId: selectedBus.id, chatName: selectedBus.name });
            loadSchedules(selectedBus.id);
        }
    }, [selectedBus]);

    useEffect(() => {
        if (currentBus) {
            loadSchedules(currentBus.id);
        }
    }, [currentBus]);

    async function loadBuses() {
        try {
            const data = await api.getBuses();
            setBuses(data);
            if (!currentBus && data.length > 0) {
                setCurrentBus(data[0]);
                setFormData({ ...formData, busId: data[0].id, chatName: data[0].name });
            }
        } catch (err) {
            setError(err.message);
        }
    }

    async function loadSchedules(busId) {
        setLoading(true);
        try {
            const data = await api.getSchedules(busId);
            setSchedules(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }

    async function handleCreate(e) {
        e.preventDefault();
        setError('');

        if (formData.daysOfWeek.length === 0) {
            setError('יש לבחור לפחות יום אחד');
            return;
        }

        try {
            await api.createSchedule(formData);
            setFormData({
                busId: currentBus.id,
                daysOfWeek: [],
                startTime: '',
                endTime: '',
                chatName: currentBus.name
            });
            setShowForm(false);
            await loadSchedules(currentBus.id);
        } catch (err) {
            setError(err.message);
        }
    }

    async function handleDelete(scheduleId) {
        if (!confirm('האם אתה בטוח שברצונך למחוק זמן זה?')) {
            return;
        }

        try {
            await api.deleteSchedule(scheduleId);
            await loadSchedules(currentBus.id);
        } catch (err) {
            setError(err.message);
        }
    }

    function toggleDay(day) {
        const days = formData.daysOfWeek.includes(day)
            ? formData.daysOfWeek.filter(d => d !== day)
            : [...formData.daysOfWeek, day].sort();

        setFormData({ ...formData, daysOfWeek: days });
    }

    function getDaysText(days) {
        return days.map(d => DAYS.find(day => day.value === d)?.label).join(', ');
    }

    if (buses.length === 0) {
        return (
            <div className="section">
                <div className="empty-state">
                    <p>אין אוטובוסים במערכת</p>
                    <p className="hint">צור אוטובוס ראשון בלשונית "ניהול אוטובוסים"</p>
                </div>
            </div>
        );
    }

    return (
        <div className="section">
            <div className="section-header">
                <div>
                    <h2>ניהול זמנים</h2>
                    <div className="bus-selector">
                        <label>בחר אוטובוס:</label>
                        <select
                            value={currentBus?.id || ''}
                            onChange={(e) => {
                                const bus = buses.find(b => b.id === e.target.value);
                                setCurrentBus(bus);
                                setFormData({ ...formData, busId: bus.id, chatName: bus.name });
                            }}
                        >
                            {buses.map(bus => (
                                <option key={bus.id} value={bus.id}>
                                    {bus.name} (#{bus.id})
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
                <button onClick={() => setShowForm(!showForm)} className="primary-btn">
                    {showForm ? 'ביטול' : '+ זמן חדש'}
                </button>
            </div>

            {error && <div className="error-banner">{error}</div>}

            {showForm && (
                <form onSubmit={handleCreate} className="form-card">
                    <h3>זמן חדש - {currentBus?.name}</h3>

                    <div className="form-group">
                        <label>ימים בשבוע</label>
                        <div className="days-selector">
                            {DAYS.map(day => (
                                <button
                                    key={day.value}
                                    type="button"
                                    className={`day-btn ${formData.daysOfWeek.includes(day.value) ? 'selected' : ''}`}
                                    onClick={() => toggleDay(day.value)}
                                >
                                    {day.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label>שעת התחלה</label>
                            <input
                                type="time"
                                value={formData.startTime}
                                onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label>שעת סיום</label>
                            <input
                                type="time"
                                value={formData.endTime}
                                onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                                required
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label>שם הצ'אט</label>
                        <input
                            type="text"
                            value={formData.chatName}
                            onChange={(e) => setFormData({ ...formData, chatName: e.target.value })}
                            placeholder="לדוגמה: קו 51"
                            required
                        />
                    </div>

                    <button type="submit" className="primary-btn">יצירה</button>
                </form>
            )}

            {loading ? (
                <div className="loading">טוען זמנים...</div>
            ) : schedules.length === 0 ? (
                <div className="empty-state">
                    <p>אין זמנים מוגדרים לאוטובוס זה</p>
                    <p className="hint">צור זמן ראשון כדי להתחיל</p>
                </div>
            ) : (
                <div className="schedules-list">
                    {schedules.map(schedule => (
                        <div key={schedule.id} className="schedule-card">
                            <div className="schedule-header">
                                <h3>{schedule.chatName}</h3>
                                <button
                                    onClick={() => handleDelete(schedule.id)}
                                    className="delete-icon-btn"
                                >
                                    🗑️
                                </button>
                            </div>

                            <div className="schedule-details">
                                <div className="detail-row">
                                    <span className="label">ימים:</span>
                                    <span className="value">{getDaysText(schedule.daysOfWeek)}</span>
                                </div>
                                <div className="detail-row">
                                    <span className="label">שעות:</span>
                                    <span className="value">{schedule.startTime} - {schedule.endTime}</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

export default ScheduleEditor;
