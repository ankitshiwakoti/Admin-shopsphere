import { verifyAccessToken } from '../config/jwt.js';
import jwt from 'jsonwebtoken';
import Admin from '../models/Admin.js';

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

export const isAdmin = async (req, res, next) => {
    try {
        if (!req.session.isAdmin) {
            req.flash('error', 'Please login to access this page');
            return res.redirect('/admin/login');
        }

        // Get admin from session
        const admin = await Admin.findById(req.session.adminId);
        if (!admin) {
            req.flash('error', 'Admin not found');
            return res.redirect('/admin/login');
        }

        if (admin.role !== 'admin' && admin.role !== 'superadmin') {
            req.flash('error', 'You do not have permission to access this page');
            return res.redirect('/admin/dashboard');
        }

        next();
    } catch (error) {
        console.error('Admin middleware error:', error);
        req.flash('error', 'Error checking admin status');
        res.redirect('/admin/login');
    }
}; 