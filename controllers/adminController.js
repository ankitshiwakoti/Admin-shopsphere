import Admin from '../models/Admin.js';
import bcrypt from 'bcryptjs';
import Category from '../models/Category.js';
import Product from '../models/Product.js';
import { notifyAdmins } from './notificationController.js';

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
        
        console.log('Creating new admin:', { username, email, role });
        
        // Check if admin exists
        const existingAdmin = await Admin.findOne({ email });
        if (existingAdmin) {
            console.log('Admin already exists with email:', email);
            req.flash('error_msg', 'Email already registered');
            return res.redirect('/admin/admins');
        }

        // Create admin with plain password - the pre-save hook will hash it
        const admin = new Admin({
            username,
            email,
            password, // Plain password - will be hashed by pre-save hook
            role: role || 'admin',
            status: 'active'
        });

        console.log('Saving new admin...');
        await admin.save();
        console.log('Admin saved successfully:', admin._id);
        
        // Verify the password was hashed correctly
        const savedAdmin = await Admin.findById(admin._id);
        console.log('Password in database:', savedAdmin.password ? 'Hashed' : 'Not found');
        
        // Create notification for other admins
        await notifyAdmins(
            'New Admin Created',
            `${req.session.admin.username} has created a new admin: ${username}`,
            'success',
            `/admin/admins/${admin._id}`,
            req.session.admin._id
        );
        
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
        
        // Create notification for other admins
        await notifyAdmins(
            'Admin Updated',
            `${req.session.admin.username} has updated admin: ${username}`,
            'info',
            `/admin/admins/${id}`,
            req.session.admin._id
        );
        
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

        // Get admin details before deletion for notification
        const adminToDelete = await Admin.findById(id);
        
        // Delete the admin
        await Admin.findByIdAndDelete(id);
        
        // Create notification for other admins
        await notifyAdmins(
            'Admin Deleted',
            `${req.session.admin.username} has deleted admin: ${adminToDelete.username}`,
            'warning',
            null,
            req.session.admin._id
        );
        
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

// Get product management page
export const getProductManagement = async (req, res) => {
    try {
        const products = await Product.find()
            .populate('category')
            .populate('createdBy', 'username')
            .sort({ createdAt: -1 });
            
        const categories = await Category.find();
        
        res.render('admin/products/manage', {
            title: 'Product Management',
            products,
            categories
        });
    } catch (error) {
        console.error('Error fetching products:', error);
        req.flash('error_msg', 'Error fetching products');
        res.redirect('/admin/dashboard');
    }
};

// Get products
export const getProducts = async (req, res) => {
    try {
        const products = await Product.find()
            .populate('category')
            .populate('createdBy', 'username')
            .sort({ createdAt: -1 });
            
        res.json(products);
    } catch (error) {
        console.error('Error fetching products:', error);
        res.status(500).json({ message: 'Error fetching products' });
    }
};

// Get product edit page
export const getProductEdit = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id)
            .populate('category')
            .populate('createdBy', 'username');
            
        const categories = await Category.find();
        
        if (!product) {
            req.flash('error_msg', 'Product not found');
            return res.redirect('/admin/products/manage');
        }
        
        res.render('admin/products/edit', {
            title: 'Edit Product',
            product,
            categories
        });
    } catch (error) {
        console.error('Error fetching product:', error);
        req.flash('error_msg', 'Error fetching product details');
        res.redirect('/admin/products/manage');
    }
};

// Get categories
export const getCategories = async (req, res) => {
    try {
        const categories = await Category.find()
            .populate('parent')
            .sort({ createdAt: -1 });
            
        res.json(categories);
    } catch (error) {
        console.error('Error fetching categories:', error);
        res.status(500).json({ message: 'Error fetching categories' });
    }
};

// Get admin profile
export const getProfile = async (req, res) => {
    try {
        const admin = await Admin.findById(req.session.adminId)
            .select('-password')
            .populate('roles');

        if (!admin) {
            req.flash('error_msg', 'Admin not found');
            return res.redirect('/admin/dashboard');
        }

        res.render('admin/profile', {
            title: 'My Profile',
            admin,
            currentAdmin: req.session.admin
        });
    } catch (error) {
        console.error('Error fetching profile:', error);
        req.flash('error_msg', 'Error fetching profile details');
        res.redirect('/admin/dashboard');
    }
};

// Update admin profile
export const updateProfile = async (req, res) => {
    try {
        const { username, email } = req.body;
        const admin = await Admin.findById(req.session.adminId);

        if (!admin) {
            req.flash('error_msg', 'Admin not found');
            return res.redirect('/admin/profile');
        }

        // Update basic info
        admin.username = username;
        admin.email = email;

        await admin.save();

        // Update session data
        req.session.admin = {
            ...req.session.admin,
            username,
            email
        };

        req.flash('success_msg', 'Profile updated successfully');
        res.redirect('/admin/profile');
    } catch (error) {
        console.error('Error updating profile:', error);
        req.flash('error_msg', 'Error updating profile');
        res.redirect('/admin/profile');
    }
};

// Change password
export const changePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword, confirmPassword } = req.body;
        const admin = await Admin.findById(req.session.adminId);

        if (!admin) {
            req.flash('error_msg', 'Admin not found');
            return res.redirect('/admin/profile');
        }

        // Verify current password
        const isMatch = await admin.comparePassword(currentPassword);
        if (!isMatch) {
            req.flash('error_msg', 'Current password is incorrect');
            return res.redirect('/admin/profile');
        }

        // Check if new passwords match
        if (newPassword !== confirmPassword) {
            req.flash('error_msg', 'New passwords do not match');
            return res.redirect('/admin/profile');
        }

        // Update password
        const salt = await bcrypt.genSalt(10);
        admin.password = await bcrypt.hash(newPassword, salt);
        await admin.save();

        req.flash('success_msg', 'Password changed successfully');
        res.redirect('/admin/profile');
    } catch (error) {
        console.error('Error changing password:', error);
        req.flash('error_msg', 'Error changing password');
        res.redirect('/admin/profile');
    }
}; 