import Admin from '../models/Admin.js';
import bcrypt from 'bcryptjs';

// Get admin dashboard
export const getDashboard = (req, res) => {
    res.render('admin/dashboard', {
        title: 'Admin Dashboard',
        admin: req.session.admin
    });
};

// Get admin list
export const getAdmins = async (req, res) => {
    try {
        const admins = await Admin.find().select('-password');
        res.render('admin/admins', {
            title: 'Manage Admins',
            admins
        });
    } catch (error) {
        console.error('Error fetching admins:', error);
        req.flash('error_msg', 'Error fetching admins');
        res.redirect('/admin/dashboard');
    }
};

// Get edit admin page
export const getEditAdmin = async (req, res) => {
    try {
        const admin = await Admin.findById(req.params.id).select('-password');
        if (!admin) {
            req.flash('error_msg', 'Admin not found');
            return res.redirect('/admin/admins');
        }
        res.render('admin/edit-admin', {
            title: 'Edit Admin',
            admin
        });
    } catch (error) {
        console.error('Error fetching admin:', error);
        req.flash('error_msg', 'Error fetching admin details');
        res.redirect('/admin/admins');
    }
};

// Create new admin
export const createAdmin = async (req, res) => {
    try {
        const { username, email, password, role } = req.body;
        
        // Check if admin exists
        const existingAdmin = await Admin.findOne({ email });
        if (existingAdmin) {
            req.flash('error_msg', 'Email already registered');
            return res.redirect('/admin/admins');
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create admin
        const admin = new Admin({
            username,
            email,
            password: hashedPassword,
            role: role || 'admin'
        });

        await admin.save();
        req.flash('success_msg', 'Admin created successfully');
        res.redirect('/admin/admins');
    } catch (error) {
        console.error('Error creating admin:', error);
        req.flash('error_msg', 'Error creating admin');
        res.redirect('/admin/admins');
    }
};

// Update admin
export const updateAdmin = async (req, res) => {
    try {
        const { id } = req.params;
        const { username, email, role, password } = req.body;

        const admin = await Admin.findById(id);
        if (!admin) {
            req.flash('error_msg', 'Admin not found');
            return res.redirect('/admin/admins');
        }

        // Update fields
        admin.username = username;
        admin.email = email;
        admin.role = role;

        // Update password if provided
        if (password) {
            const salt = await bcrypt.genSalt(10);
            admin.password = await bcrypt.hash(password, salt);
        }

        await admin.save();
        req.flash('success_msg', 'Admin updated successfully');
        res.redirect('/admin/admins');
    } catch (error) {
        console.error('Error updating admin:', error);
        req.flash('error_msg', 'Error updating admin');
        res.redirect('/admin/admins');
    }
};

// Delete admin
export const deleteAdmin = async (req, res) => {
    try {
        const { id } = req.params;
        
        // Prevent deleting superadmin
        const admin = await Admin.findById(id);
        if (!admin) {
            req.flash('error_msg', 'Admin not found');
            return res.redirect('/admin/admins');
        }
        if (admin.role === 'superadmin') {
            req.flash('error_msg', 'Cannot delete superadmin');
            return res.redirect('/admin/admins');
        }

        await Admin.findByIdAndDelete(id);
        req.flash('success_msg', 'Admin deleted successfully');
        res.redirect('/admin/admins');
    } catch (error) {
        console.error('Error deleting admin:', error);
        req.flash('error_msg', 'Error deleting admin');
        res.redirect('/admin/admins');
    }
};

// Get single admin
export const getAdmin = async (req, res) => {
    try {
        const { id } = req.params;

        const admin = await Admin.findById(id, '-password');
        if (!admin) {
            return res.status(404).json({ message: 'Admin not found' });
        }

        res.json(admin);
    } catch (error) {
        console.error('Error fetching admin:', error);
        res.status(500).json({ message: 'Error fetching admin details' });
    }
}; 