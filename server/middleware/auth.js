import { config } from '../config/config.js';

/**
 * Admin authentication middleware
 */
export function requireAuth(req, res, next) {
    if (req.session && req.session.isAdmin) {
        return next();
    }

    res.status(401).json({ error: 'Authentication required' });
}

/**
 * Login handler
 */
export function login(req, res) {
    const { password } = req.body;

    if (password === config.adminPassword) {
        req.session.isAdmin = true;
        res.json({ success: true, message: 'Login successful' });
    } else {
        res.status(401).json({ error: 'Invalid password' });
    }
}

/**
 * Logout handler
 */
export function logout(req, res) {
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).json({ error: 'Logout failed' });
        }
        res.json({ success: true, message: 'Logout successful' });
    });
}

/**
 * Check auth status
 */
export function checkAuth(req, res) {
    res.json({
        isAuthenticated: !!(req.session && req.session.isAdmin)
    });
}
