import { useState } from 'react';

function Login({ onLogin }) {
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    async function handleSubmit(e) {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            await onLogin(password);
        } catch (err) {
            setError(err.message || 'סיסמה שגויה');
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="login-container">
            <div className="login-box">
                <div className="login-logo">🚌</div>
                <h1>BusTogether</h1>
                <h2>כניסת מנהל</h2>

                <form onSubmit={handleSubmit}>
                    <input
                        type="password"
                        placeholder="סיסמה"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        disabled={loading}
                        autoFocus
                    />

                    {error && <div className="error-message">{error}</div>}

                    <button type="submit" disabled={loading || !password}>
                        {loading ? 'מתחבר...' : 'כניסה'}
                    </button>
                </form>
            </div>
        </div>
    );
}

export default Login;
