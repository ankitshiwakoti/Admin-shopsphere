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

export const isSuperAdmin = (req, res, next) => {
    if (!req.session.admin) {
        req.flash('error', 'Please login to access this page');
        return res.redirect('/admin/login');
    }

    if (req.session.admin.role !== 'superadmin') {
        req.flash('error', 'You do not have permission to access this page');
        return res.redirect('/admin/dashboard');
    }

    next();
};

export const protect = async (req, res, next) => {
    try {
        console.log('Session data:', req.session);
        console.log('Is admin?', req.session.isAdmin);
        console.log('Admin ID:', req.session.adminId);
        
        if (!req.session.isAdmin) {
            console.log('No admin session found');
            // Check if it's an API request
            if (req.path.startsWith('/api/')) {
                return res.status(401).json({
                    success: false,
                    message: 'Not authorized to access this route'
                });
            }
            // For web routes, redirect to login
            req.flash('error_msg', 'Please log in to access this page');
            return res.redirect('/admin/login');
        }

        // Get admin from session
        const admin = await Admin.findById(req.session.adminId).select('-password');
        if (!admin) {
            console.log('Admin not found in database:', req.session.adminId);
            if (req.path.startsWith('/api/')) {
                return res.status(401).json({
                    success: false,
                    message: 'Admin not found'
                });
            }
            req.flash('error_msg', 'Admin not found');
            return res.redirect('/admin/login');
        }

        console.log('Admin found:', admin.username, 'Role:', admin.role);
        req.admin = admin;
        next();
    } catch (error) {
        console.error('Protect middleware error:', error);
        if (req.path.startsWith('/api/')) {
            return res.status(500).json({
                success: false,
                message: error.message
            });
        }
        req.flash('error_msg', 'An error occurred');
        res.redirect('/admin/login');
    }
};

export const authorize = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.admin.role)) {
            return res.status(403).json({
                success: false,
                message: `User role ${req.admin.role} is not authorized to access this route`
            });
        }
        next();
    };
};

export const checkPermission = (permission) => {
    return async (req, res, next) => {
        try {
            // Super admin bypasses all permission checks
            if (req.admin.role === 'superadmin') {
                return next();
            }

            const admin = await Admin.findById(req.admin._id).populate('roles');
            const hasPermission = admin.roles.some(role => 
                role.permissions.includes(permission)
            );

            if (!hasPermission) {
                return res.status(403).json({
                    success: false,
                    message: `User does not have permission to ${permission}`
                });
            }
            next();
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    };
}; 