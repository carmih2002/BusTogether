import { useState, useEffect } from 'react';
import api from './services/api';
import Login from './components/Login';
import BusManager from './components/BusManager';
import ScheduleEditor from './components/ScheduleEditor';
import ActiveSessions from './components/ActiveSessions';

function App() {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('buses');
    const [selectedBus, setSelectedBus] = useState(null);

    useEffect(() => {
        checkAuth();
    }, []);

    async function checkAuth() {
        try {
            const result = await api.checkAuth();
            setIsAuthenticated(result.isAuthenticated);
        } catch (error) {
            console.error('Auth check failed:', error);
        } finally {
            setLoading(false);
        }
    }

    async function handleLogin(password) {
        try {
            await api.login(password);
            setIsAuthenticated(true);
        } catch (error) {
            throw error;
        }
    }

    async function handleLogout() {
        try {
            await api.logout();
            setIsAuthenticated(false);
            setActiveTab('buses');
            setSelectedBus(null);
        } catch (error) {
            console.error('Logout failed:', error);
        }
    }

    if (loading) {
        return (
            <div className="loading-screen">
                <div className="spinner"></div>
                <p>טוען...</p>
            </div>
        );
    }

    if (!isAuthenticated) {
        return <Login onLogin={handleLogin} />;
    }

    return (
        <div className="admin-container">
            <header className="admin-header">
                <div className="header-content">
                    <h1>🚌 BusTogether - ניהול</h1>
                    <button onClick={handleLogout} className="logout-btn">
                        יציאה
                    </button>
                </div>
            </header>

            <nav className="admin-nav">
                <button
                    className={`nav-btn ${activeTab === 'buses' ? 'active' : ''}`}
                    onClick={() => setActiveTab('buses')}
                >
                    🚌 ניהול אוטובוסים
                </button>
                <button
                    className={`nav-btn ${activeTab === 'schedules' ? 'active' : ''}`}
                    onClick={() => setActiveTab('schedules')}
                >
                    📅 ניהול זמנים
                </button>
                <button
                    className={`nav-btn ${activeTab === 'sessions' ? 'active' : ''}`}
                    onClick={() => setActiveTab('sessions')}
                >
                    💬 צ'אטים פעילים
                </button>
            </nav>

            <main className="admin-main">
                {activeTab === 'buses' && (
                    <BusManager
                        onSelectBus={(bus) => {
                            setSelectedBus(bus);
                            setActiveTab('schedules');
                        }}
                    />
                )}

                {activeTab === 'schedules' && (
                    <ScheduleEditor selectedBus={selectedBus} />
                )}

                {activeTab === 'sessions' && (
                    <ActiveSessions />
                )}
            </main>
        </div>
    );
}

export default App;
