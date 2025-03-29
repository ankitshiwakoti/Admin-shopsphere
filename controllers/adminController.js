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
        req.flash('error_msg', 'Error fetching admins');
        res.redirect('/admin/dashboard');
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
        req.flash('error_msg', 'Error creating admin');
        res.redirect('/admin/admins');
    }
};

// Update admin
export const updateAdmin = async (req, res) => {
    try {
        const { id } = req.params;
        const { username, email, role } = req.body;

        const admin = await Admin.findById(id);
        if (!admin) {
            req.flash('error_msg', 'Admin not found');
            return res.redirect('/admin/admins');
        }

        admin.username = username;
        admin.email = email;
        admin.role = role;

        await admin.save();
        req.flash('success_msg', 'Admin updated successfully');
        res.redirect('/admin/admins');
    } catch (error) {
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
        if (admin.role === 'superadmin') {
            req.flash('error_msg', 'Cannot delete superadmin');
            return res.redirect('/admin/admins');
        }

        await Admin.findByIdAndDelete(id);
        req.flash('success_msg', 'Admin deleted successfully');
        res.redirect('/admin/admins');
    } catch (error) {
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