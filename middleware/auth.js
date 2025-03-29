import { verifyAccessToken } from '../config/jwt.js';

export const isAuthenticated = (req, res, next) => {
    if (req.session && req.session.isAdmin) {
        return next();
    }
    req.flash('error_msg', 'Please log in to access this page');
    res.redirect('/admin/login');
};

export const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
        return res.status(401).json({ message: 'Access token required' });
    }

    const decoded = verifyAccessToken(token);
    if (!decoded) {
        return res.status(403).json({ message: 'Invalid or expired token' });
    }

    req.adminId = decoded.id;
    next();
}; 