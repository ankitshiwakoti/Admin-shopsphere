import Admin from '../models/Admin.js';

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

        // Set session
        req.session.adminId = admin._id;
        req.session.isAdmin = true;
        
        req.flash('success_msg', 'Welcome back!');
        res.redirect('/admin/dashboard');
    } catch (error) {
        console.error('Login error:', error);
        req.flash('error_msg', 'An error occurred during login');
        res.redirect('/admin/login');
    }
};

// Logout handle
export const logout = (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error('Logout error:', err);
        }
        res.redirect('/admin/login');
    });
}; 