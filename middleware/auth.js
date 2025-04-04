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
        // First check if user is authenticated
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

        // Check if admin has admin or superadmin role
        if (admin.role !== 'admin' && admin.role !== 'superadmin') {
            req.flash('error_msg', 'You do not have permission to access this page');
            return res.redirect('/admin/unauthorized');
        }

        // Set admin in request for later use
        req.admin = admin;
        next();
    } catch (error) {
        console.error('Admin middleware error:', error);
        req.flash('error_msg', 'Error checking admin status');
        res.redirect('/admin/login');
    }
};

export const isSuperAdmin = async (req, res, next) => {
    try {
        // First check if user is authenticated
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

        // Check if admin has superadmin role
        if (admin.role !== 'superadmin') {
            req.flash('error_msg', 'You do not have permission to access this page');
            return res.redirect('/admin/unauthorized');
        }

        // Set admin in request for later use
        req.admin = admin;
        next();
    } catch (error) {
        console.error('SuperAdmin middleware error:', error);
        req.flash('error_msg', 'Error checking superadmin status');
        res.redirect('/admin/login');
    }
};

export const protect = async (req, res, next) => {
    try {
        // Check if user is authenticated
        if (!req.session.isAdmin) {
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
            // Check if it's an API request
            if (req.path.startsWith('/api/')) {
                return res.status(401).json({
                    success: false,
                    message: 'Admin not found'
                });
            }
            req.flash('error_msg', 'Admin not found');
            return res.redirect('/admin/login');
        }

        // Set admin in request for later use
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
    return async (req, res, next) => {
        try {
            // Super admin bypasses all permission checks
            if (req.admin.role === 'superadmin') {
                console.log('Superadmin access granted');
                return next();
            }
            
            // Check if the admin's role is in the allowed roles
            if (!roles.includes(req.admin.role)) {
                console.log(`User role ${req.admin.role} is not authorized to access this route`);
                if (req.path.startsWith('/api/')) {
                    return res.status(403).json({
                        success: false,
                        message: `User role ${req.admin.role} is not authorized to access this route`
                    });
                }
                req.flash('error_msg', 'You do not have permission to access this page');
                return res.redirect('/admin/unauthorized');
            }
            
            // Get admin with populated roles
            const admin = await Admin.findById(req.admin._id).populate('roles');
            let requiredPermission = null;
            
            // Determine required permission based on route
            if (req.path.startsWith('/admin/products')) {
                console.log('Checking product permission for path:', req.path);
                requiredPermission = 'manage_products';
            } else if (req.path.startsWith('/admin/categories')) {
                console.log('Checking category permission for path:', req.path);
                requiredPermission = 'manage_categories';
            } else if (req.path.startsWith('/admin/customers')) {
                console.log('Checking customer permission for path:', req.path);
                requiredPermission = 'manage_customers';
            }
            
            // If a permission check is required
            if (requiredPermission) {
                const hasPermission = admin.roles.some(role => 
                    role.permissions.includes(requiredPermission)
                );
                
                if (!hasPermission) {
                    console.log(`User does not have ${requiredPermission} permission`);
                    if (req.path.startsWith('/api/')) {
                        return res.status(403).json({
                            success: false,
                            message: `User does not have permission to ${requiredPermission}`
                        });
                    }
                    req.flash('error_msg', `You do not have permission to ${requiredPermission.replace('_', ' ')}`);
                    return res.redirect('/admin/unauthorized');
                }
                console.log(`${requiredPermission} permission granted`);
            }
            
            next();
        } catch (error) {
            console.error('Authorization error:', error);
            if (req.path.startsWith('/api/')) {
                return res.status(500).json({
                    success: false,
                    message: error.message
                });
            }
            req.flash('error_msg', 'An error occurred during authorization');
            res.redirect('/admin/unauthorized');
        }
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
                if (req.xhr || req.headers.accept.includes('application/json')) {
                    return res.status(403).json({
                        success: false,
                        message: `User does not have permission to ${permission}`
                    });
                }
                req.flash('error_msg', `You do not have permission to ${permission.replace('_', ' ')}`);
                return res.redirect('/admin/unauthorized');
            }
            next();
        } catch (error) {
            if (req.xhr || req.headers.accept.includes('application/json')) {
                return res.status(500).json({
                    success: false,
                    message: error.message
                });
            }
            req.flash('error_msg', 'An error occurred during permission check');
            res.redirect('/admin/unauthorized');
        }
    };
}; 