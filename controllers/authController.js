import Admin from '../models/Admin.js';
import bcrypt from 'bcryptjs';
import { generateTokens, verifyRefreshToken } from '../config/jwt.js';

// Login page
export const getLogin = (req, res) => {
    // If already logged in, redirect to dashboard
    if (req.session.isAdmin) {
        return res.redirect('/admin/dashboard');
    }

    res.render('admin/login', {
        title: 'Admin Login'
    });
};

// Handle login
export const postLogin = async (req, res) => {
    try {
        console.log('Login attempt:', req.body);
        const { email, password } = req.body;
        
        // Validate input
        if (!email || !password) {
            console.log('Missing credentials:', { email, password });
            req.flash('error_msg', 'Please provide both email and password');
            return res.redirect('/admin/login');
        }

        // Find admin
        console.log('Looking for admin with email:', email);
        const admin = await Admin.findOne({ email });
        if (!admin) {
            console.log('Admin not found with email:', email);
            req.flash('error_msg', 'Invalid credentials');
            return res.redirect('/admin/login');
        }
        console.log('Admin found:', { id: admin._id, email: admin.email, role: admin.role });

        // Check password using model's method
        console.log('Comparing passwords...');
        const isMatch = await admin.comparePassword(password);
        if (!isMatch) {
            console.log('Password mismatch');
            req.flash('error_msg', 'Invalid credentials');
            return res.redirect('/admin/login');
        }
        console.log('Password matched successfully');

        // Set session
        console.log('Setting session...');
        req.session.adminId = admin._id;
        req.session.isAdmin = true;
        req.session.admin = {
            id: admin._id,
            username: admin.username,
            email: admin.email,
            role: admin.role
        };
        console.log('Session set:', req.session);

        // Save session before redirect
        req.session.save((err) => {
            if (err) {
                console.error('Session save error:', err);
                req.flash('error_msg', 'An error occurred during login');
                return res.redirect('/admin/login');
            }
            console.log('Session saved successfully');
            req.flash('success_msg', 'Welcome back!');
            res.redirect('/admin/dashboard');
        });
    } catch (error) {
        console.error('Login error:', error);
        req.flash('error_msg', 'An error occurred during login');
        res.redirect('/admin/login');
    }
};

// Signup page
export const getSignup = (req, res) => {
    // If already logged in, redirect to dashboard
    if (req.session.isAdmin) {
        return res.redirect('/admin/dashboard');
    }

    res.render('admin/signup', {
        title: 'Admin Signup'
    });
};

// Handle signup
export const postSignup = async (req, res) => {
    try {
        const { username, email, password, confirmPassword } = req.body;

        // Validate input
        if (!username || !email || !password || !confirmPassword) {
            req.flash('error_msg', 'Please fill in all fields');
            return res.redirect('/admin/signup');
        }

        if (password !== confirmPassword) {
            req.flash('error_msg', 'Passwords do not match');
            return res.redirect('/admin/signup');
        }

        // Check if admin exists
        const existingAdmin = await Admin.findOne({ email });
        if (existingAdmin) {
            req.flash('error_msg', 'Email already registered');
            return res.redirect('/admin/signup');
        }

        // Create admin (password will be hashed by the model's pre-save hook)
        const admin = new Admin({
            username,
            email,
            password,
            role: 'superadmin' // First admin is superadmin
        });

        await admin.save();

        req.flash('success_msg', 'Registration successful! Please login.');
        res.redirect('/admin/login');
    } catch (error) {
        console.error('Signup error:', error);
        req.flash('error_msg', 'An error occurred during registration');
        res.redirect('/admin/signup');
    }
};

// Handle logout
export const getLogout = (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error('Error destroying session:', err);
        }
        res.redirect('/admin/login');
    });
};

// Refresh token
export const refreshToken = async (req, res) => {
    try {
        const refreshToken = req.cookies.refreshToken;
        
        if (!refreshToken) {
            return res.status(401).json({ message: 'Refresh token required' });
        }

        const decoded = verifyRefreshToken(refreshToken);
        if (!decoded) {
            return res.status(403).json({ message: 'Invalid or expired refresh token' });
        }

        const { accessToken, refreshToken: newRefreshToken } = generateTokens(decoded.id);

        // Set new tokens in cookies
        res.cookie('accessToken', accessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            maxAge: 15 * 60 * 1000 // 15 minutes
        });

        res.cookie('refreshToken', newRefreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
        });

        res.json({ message: 'Token refreshed successfully' });
    } catch (error) {
        console.error('Token refresh error:', error);
        res.status(500).json({ message: 'Error refreshing token' });
    }
}; 