import Admin from '../models/Admin.js';
import { generateTokens, verifyRefreshToken } from '../config/jwt.js';

// Login page
export const getLogin = (req, res) => {
    res.render('admin/login', {
        title: 'Admin Login',
        messages: {
            error: req.flash('error'),
            success_msg: req.flash('success_msg'),
            error_msg: req.flash('error_msg')
        }
    });
};

// Signup page
export const getSignup = (req, res) => {
    res.render('admin/signup', {
        title: 'Admin Signup',
        messages: {
            error: req.flash('error'),
            success_msg: req.flash('success_msg'),
            error_msg: req.flash('error_msg')
        }
    });
};

// Signup handle
export const postSignup = async (req, res) => {
    try {
        const { username, email, password, confirmPassword } = req.body;

        // Validation
        if (password !== confirmPassword) {
            req.flash('error_msg', 'Passwords do not match');
            return res.redirect('/admin/signup');
        }

        // Check if username exists
        const existingUsername = await Admin.findOne({ username });
        if (existingUsername) {
            req.flash('error_msg', 'Username already exists');
            return res.redirect('/admin/signup');
        }

        // Check if email exists
        const existingEmail = await Admin.findOne({ email });
        if (existingEmail) {
            req.flash('error_msg', 'Email already exists');
            return res.redirect('/admin/signup');
        }

        // Create new admin
        const admin = new Admin({
            username,
            email,
            password
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

// Login handle
export const postLogin = async (req, res) => {
    try {
        const { username, password } = req.body;
        
        // Find admin by username
        const admin = await Admin.findOne({ username });
        
        if (!admin) {
            req.flash('error_msg', 'Invalid credentials');
            return res.redirect('/admin/login');
        }

        // Check password
        const isMatch = await admin.comparePassword(password);
        
        if (!isMatch) {
            req.flash('error_msg', 'Invalid credentials');
            return res.redirect('/admin/login');
        }

        // Generate JWT tokens
        const { accessToken, refreshToken } = generateTokens(admin._id);

        // Set session
        req.session.adminId = admin._id;
        req.session.isAdmin = true;
        
        // Set tokens in cookies
        res.cookie('accessToken', accessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            maxAge: 15 * 60 * 1000 // 15 minutes
        });

        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
        });
        
        req.flash('success_msg', 'Welcome back!');
        res.redirect('/admin/dashboard');
    } catch (error) {
        console.error('Login error:', error);
        req.flash('error_msg', 'An error occurred during login');
        res.redirect('/admin/login');
    }
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

// Logout handle
export const logout = (req, res) => {
    // Clear cookies
    res.clearCookie('accessToken');
    res.clearCookie('refreshToken');
    
    // Destroy session
    req.session.destroy((err) => {
        if (err) {
            console.error('Logout error:', err);
        }
        res.redirect('/admin/login');
    });
}; 