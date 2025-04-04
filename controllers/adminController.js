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
            req.session.admin._id,
            null,
            `/admin/admins/${admin._id}`
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
            req.session.admin._id,
            null,
            `/admin/admins/${id}`
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
            .populate('category', 'name')
            .populate('createdBy', 'username')
            .populate('updatedBy', 'username');

        const categories = await Category.find({ status: 'active' });

        res.render('admin/products/manage', {
            title: 'Product Management',
            admin: req.session.admin,
            products,
            categories
        });
    } catch (error) {
        console.error('Error loading products:', error);
        req.flash('error', 'Error loading products');
        res.redirect('/admin/dashboard');
    }
};

export const getProducts = async (req, res) => {
    try {
        const products = await Product.find()
            .populate('category', 'name')
            .populate('createdBy', 'username')
            .populate('updatedBy', 'username');

        res.render('admin/products/partials/productList', {
            products
        });
    } catch (error) {
        res.status(500).send('Error loading products');
    }
};

export const getProductEdit = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id)
            .populate('category', 'name');

        if (!product) {
            req.flash('error', 'Product not found');
            return res.redirect('/admin/products/manage');
        }

        const categories = await Category.find({ status: 'active' });

        res.render('admin/products/edit', {
            title: 'Edit Product',
            admin: req.session.admin,
            product,
            categories
        });
    } catch (error) {
        console.error('Error loading product:', error);
        req.flash('error', 'Error loading product');
        res.redirect('/admin/products/manage');
    }
};

export const createProduct = async (req, res) => {
    try {
        const { name, description, price, stock, category, status } = req.body;
        
        // Validate category exists
        const categoryExists = await Category.findById(category);
        if (!categoryExists) {
            req.flash('error', 'Category not found');
            return res.redirect('/admin/products/manage');
        }

        // Handle file uploads
        let images = [];
        if (req.files && req.files.length > 0) {
            images = req.files.map(file => `/uploads/${file.filename}`);
        }

        const product = await Product.create({
            name,
            description,
            price: parseFloat(price),
            stock: parseInt(stock),
            category: category,
            status,
            images,
            createdBy: req.session.adminId
        });

        req.flash('success', 'Product created successfully');
        res.redirect('/admin/products/manage');
    } catch (error) {
        console.error('Error creating product:', error);
        req.flash('error', 'Error creating product');
        res.redirect('/admin/products/manage');
    }
};

export const updateProduct = async (req, res) => {
    try {
        const { name, description, price, stock, category, status } = req.body;
        const productId = req.params.id;

        // Validate category exists
        const categoryExists = await Category.findById(category);
        if (!categoryExists) {
            req.flash('error', 'Category not found');
            return res.redirect('/admin/products/manage');
        }

        // Handle file uploads
        let images = [];
        if (req.files && req.files.length > 0) {
            images = req.files.map(file => `/uploads/${file.filename}`);
        }

        const updateData = {
            name,
            description,
            price: parseFloat(price),
            stock: parseInt(stock),
            category,
            status
        };

        // Only update images if new ones are uploaded
        if (images.length > 0) {
            updateData.images = images;
        }

        const product = await Product.findByIdAndUpdate(
            productId,
            updateData,
            { new: true }
        );

        if (!product) {
            req.flash('error', 'Product not found');
            return res.redirect('/admin/products/manage');
        }

        req.flash('success', 'Product updated successfully');
        res.redirect('/admin/products/manage');
    } catch (error) {
        console.error('Error updating product:', error);
        req.flash('error', 'Error updating product');
        res.redirect('/admin/products/manage');
    }
};

export const deleteProduct = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);

        if (!product) {
            req.flash('error', 'Product not found');
            return res.redirect('/admin/products/manage');
        }

        await Product.findByIdAndDelete(req.params.id);
        req.flash('success', 'Product deleted successfully');
        res.redirect('/admin/products/manage');
    } catch (error) {
        console.error('Error deleting product:', error);
        req.flash('error', error.message);
        res.redirect('/admin/products/manage');
    }
};

export const getCategories = async (req, res) => {
    try {
        const categories = await Category.find()
            .populate('parent', 'name')
            .populate('createdBy', 'username')
            .populate('updatedBy', 'username');

        res.render('admin/categories/partials/categoryList', {
            categories
        });
    } catch (error) {
        res.status(500).send('Error loading categories');
    }
}; 