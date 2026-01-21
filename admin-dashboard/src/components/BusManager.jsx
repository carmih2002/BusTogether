import { useState, useEffect } from 'react';
import api from '../services/api';

function BusManager({ onSelectBus }) {
    const [buses, setBuses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [formData, setFormData] = useState({ id: '', name: '' });
    const [error, setError] = useState('');

    useEffect(() => {
        loadBuses();
    }, []);

    async function loadBuses() {
        try {
            const data = await api.getBuses();
            setBuses(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }

    async function handleCreate(e) {
        e.preventDefault();
        setError('');

        try {
            await api.createBus(formData);
            setFormData({ id: '', name: '' });
            setShowForm(false);
            await loadBuses();
        } catch (err) {
            setError(err.message);
        }
    }

    async function handleDelete(busId) {
        if (!confirm('האם אתה בטוח? כל הזמנים והצ\'אטים של האוטובוס יימחקו.')) {
            return;
        }

        try {
            await api.deleteBus(busId);
            await loadBuses();
        } catch (err) {
            setError(err.message);
        }
    }

    function downloadQR(busId) {
        window.open(`/api/admin/buses/${busId}/qr`, '_blank');
    }

    if (loading) {
        return <div className="loading">טוען אוטובוסים...</div>;
    }

    return (
        <div className="section">
            <div className="section-header">
                <h2>ניהול אוטובוסים</h2>
                <button onClick={() => setShowForm(!showForm)} className="primary-btn">
                    {showForm ? 'ביטול' : '+ אוטובוס חדש'}
                </button>
            </div>

            {error && <div className="error-banner">{error}</div>}

            {showForm && (
                <form onSubmit={handleCreate} className="form-card">
                    <h3>אוטובוס חדש</h3>

                    <div className="form-group">
                        <label>מזהה אוטובוס (מספר ייחודי)</label>
                        <input
                            type="text"
                            value={formData.id}
                            onChange={(e) => setFormData({ ...formData, id: e.target.value })}
                            placeholder="לדוגמה: 343535"
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label>שם תיאורי</label>
                        <input
                            type="text"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            placeholder="לדוגמה: קו 51"
                            required
                        />
                    </div>

                    <button type="submit" className="primary-btn">יצירה</button>
                </form>
            )}

            <div className="cards-grid">
                {buses.length === 0 ? (
                    <div className="empty-state">
                        <p>אין אוטובוסים במערכת</p>
                        <p className="hint">צור אוטובוס ראשון כדי להתחיל</p>
                    </div>
                ) : (
                    buses.map((bus) => (
                        <div key={bus.id} className="card">
                            <div className="card-header">
                                <h3>{bus.name}</h3>
                                <span className="badge">#{bus.id}</span>
                            </div>

                            <div className="card-body">
                                <p className="info-text">
                                    {bus.schedules?.length || 0} זמנים מוגדרים
                                </p>

                                {bus.qrDataUrl && (
                                    <div className="qr-preview">
                                        <img src={bus.qrDataUrl} alt="QR Code" />
                                    </div>
                                )}

                                <div className="link-section">
                                    <label>קישור לצ'אט:</label>
                                    <div className="link-copy-container">
                                        <input
                                            type="text"
                                            value={`${window.location.origin}/bus/${bus.id}`}
                                            readOnly
                                            className="link-input"
                                            onClick={(e) => e.target.select()}
                                        />
                                        <button
                                            onClick={() => {
                                                navigator.clipboard.writeText(`${window.location.origin}/bus/${bus.id}`);
                                                alert('הקישור הועתק!');
                                            }}
                                            className="copy-btn"
                                            title="העתק קישור"
                                        >
                                            📋
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div className="card-actions">
                                <button
                                    onClick={() => onSelectBus(bus)}
                                    className="secondary-btn"
                                >
                                    ניהול זמנים
                                </button>
                                <button
                                    onClick={() => downloadQR(bus.id)}
                                    className="secondary-btn"
                                >
                                    הורדת QR
                                </button>
                                <button
                                    onClick={() => handleDelete(bus.id)}
                                    className="danger-btn"
                                >
                                    מחיקה
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}

export default BusManager;
