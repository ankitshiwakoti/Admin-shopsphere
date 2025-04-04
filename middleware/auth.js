import { verifyAccessToken } from '../config/jwt.js';
import jwt from 'jsonwebtoken';
import Admin from '../models/Admin.js';

export const isAuthenticated = (req, res, next) => {
    if (req.session && req.session.isAdmin) {
        return next();
    }
    
    // Check if session exists but isAdmin is false (session expired)
    if (req.session && !req.session.isAdmin) {
        req.flash('error_msg', 'Your session has expired. Please login again.');
    } else {
        req.flash('error_msg', 'Please log in to access this page');
    }
    
    // Clear session data but preserve flash messages
    req.session.isAdmin = false;
    req.session.adminId = null;
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
        // First check if user is authenticated
        if (!req.session.isAdmin) {
            // Check if session exists but isAdmin is false (session expired)
            if (req.session && !req.session.isAdmin) {
                req.flash('error_msg', 'Your session has expired. Please login again.');
            } else {
                req.flash('error_msg', 'Please login to access this page');
            }
            // Clear session data but preserve flash messages
            req.session.isAdmin = false;
            req.session.adminId = null;
            return res.redirect('/admin/login');
        }

        // Get admin from session
        const admin = await Admin.findById(req.session.adminId);
        if (!admin) {
            req.flash('error_msg', 'Admin not found');
            // Clear session data but preserve flash messages
            req.session.isAdmin = false;
            req.session.adminId = null;
            return res.redirect('/admin/login');
        }

        // Check if admin has admin or superadmin role
        if (admin.role !== 'admin' && admin.role !== 'superadmin') {
            req.flash('error_msg', 'You do not have permission to access this page');
            return res.redirect('/admin/unauthorized');
        }

        // Add admin to request object
        req.admin = admin;
        next();
    } catch (error) {
        console.error('Error in isAdmin middleware:', error);
        req.flash('error_msg', 'An error occurred');
        // Clear session data but preserve flash messages
        req.session.isAdmin = false;
        req.session.adminId = null;
        return res.redirect('/admin/login');
    }
};

export const isSuperAdmin = async (req, res, next) => {
    try {
        // First check if user is authenticated
        if (!req.session.isAdmin) {
            // Check if session exists but isAdmin is false (session expired)
            if (req.session && !req.session.isAdmin) {
                req.flash('error_msg', 'Your session has expired. Please login again.');
            } else {
                req.flash('error_msg', 'Please login to access this page');
            }
            // Clear session data but preserve flash messages
            req.session.isAdmin = false;
            req.session.adminId = null;
            return res.redirect('/admin/login');
        }

        // Get admin from session
        const admin = await Admin.findById(req.session.adminId);
        if (!admin) {
            req.flash('error_msg', 'Admin not found');
            // Clear session data but preserve flash messages
            req.session.isAdmin = false;
            req.session.adminId = null;
            return res.redirect('/admin/login');
        }

        // Check if admin has superadmin role
        if (admin.role !== 'superadmin') {
            req.flash('error_msg', 'You do not have permission to access this page');
            return res.redirect('/admin/unauthorized');
        }

        // Add admin to request object
        req.admin = admin;
        next();
    } catch (error) {
        console.error('Error in isSuperAdmin middleware:', error);
        req.flash('error_msg', 'An error occurred');
        // Clear session data but preserve flash messages
        req.session.isAdmin = false;
        req.session.adminId = null;
        return res.redirect('/admin/login');
    }
};

export const protect = async (req, res, next) => {
    try {
        // Check if user is authenticated
        if (!req.session.isAdmin) {
            // Check if session exists but isAdmin is false (session expired)
            if (req.session && !req.session.isAdmin) {
                req.flash('error_msg', 'Your session has expired. Please login again.');
            } else {
                req.flash('error_msg', 'Please login to access this resource');
            }
            // Clear session data but preserve flash messages
            req.session.isAdmin = false;
            req.session.adminId = null;
            return res.redirect('/admin/login');
        }

        // Get admin from session
        const admin = await Admin.findById(req.session.adminId);
        if (!admin) {
            req.flash('error_msg', 'Admin not found');
            // Clear session data but preserve flash messages
            req.session.isAdmin = false;
            req.session.adminId = null;
            return res.redirect('/admin/login');
        }

        // Add admin to request object
        req.admin = admin;
        next();
    } catch (error) {
        console.error('Error in protect middleware:', error);
        req.flash('error_msg', 'An error occurred');
        // Clear session data but preserve flash messages
        req.session.isAdmin = false;
        req.session.adminId = null;
        return res.redirect('/admin/login');
    }
};

export const authorize = (...roles) => {
    return async (req, res, next) => {
        try {
            // Check if user is authenticated
            if (!req.session.isAdmin) {
                // Check if session exists but isAdmin is false (session expired)
                if (req.session && !req.session.isAdmin) {
                    req.flash('error_msg', 'Your session has expired. Please login again.');
                } else {
                    req.flash('error_msg', 'Please login to access this resource');
                }
                // Clear session data but preserve flash messages
                req.session.isAdmin = false;
                req.session.adminId = null;
                return res.redirect('/admin/login');
            }

            // Get admin from session
            const admin = await Admin.findById(req.session.adminId);
            if (!admin) {
                req.flash('error_msg', 'Admin not found');
                // Clear session data but preserve flash messages
                req.session.isAdmin = false;
                req.session.adminId = null;
                return res.redirect('/admin/login');
            }

            // Check if admin has required role
            if (!roles.includes(admin.role)) {
                req.flash('error_msg', 'You do not have permission to perform this action');
                return res.redirect('/admin/unauthorized');
            }

            // Add admin to request object
            req.admin = admin;
            next();
        } catch (error) {
            console.error('Error in authorize middleware:', error);
            req.flash('error_msg', 'An error occurred');
            // Clear session data but preserve flash messages
            req.session.isAdmin = false;
            req.session.adminId = null;
            return res.redirect('/admin/login');
        }
    };
};

export const checkPermission = (permission) => {
    return async (req, res, next) => {
        try {
            // Check if user is authenticated
            if (!req.session.isAdmin) {
                req.flash('error_msg', 'Please login to access this page');
                return res.redirect('/admin/login');
            }

            // Get admin from session
            const admin = await Admin.findById(req.session.adminId);
            if (!admin) {
                req.flash('error_msg', 'Admin not found');
                return res.redirect('/admin/login');
            }

            // For superadmin, grant all permissions
            if (admin.role === 'superadmin') {
                req.admin = admin;
                return next();
            }

            // Check if admin has required permission through roles
            let hasPermission = false;
            
            // Check if admin has the permission directly (if implemented in the future)
            if (admin.permissions && admin.permissions.includes(permission)) {
                hasPermission = true;
            }
            
            // Check if any of the admin's roles have the permission
            if (!hasPermission && admin.roles && admin.roles.length > 0) {
                // Populate roles if they exist
                const populatedAdmin = await Admin.findById(req.session.adminId).populate('roles');
                
                if (populatedAdmin.roles && populatedAdmin.roles.length > 0) {
                    for (const role of populatedAdmin.roles) {
                        if (role.permissions && role.permissions.includes(permission)) {
                            hasPermission = true;
                            break;
                        }
                    }
                }
            }

            if (!hasPermission) {
                req.flash('error_msg', 'You do not have permission to access this page');
                return res.redirect('/admin/unauthorized');
            }

            // Add admin to request object
            req.admin = admin;
            next();
        } catch (error) {
            console.error('Error in checkPermission middleware:', error);
            req.flash('error_msg', 'An error occurred');
            return res.redirect('/admin/login');
        }
    };
}; 