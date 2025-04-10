import Category from '../models/Category.js';
import Product from '../models/Product.js';
import { notifyAdmins } from './notificationController.js';

// ===== VIEW RENDERING FUNCTIONS =====

// Render category management page
export const renderCategoryManagement = async (req, res) => {
    try {
        const categories = await Category.find()
            .populate('parent', 'name')
            .populate('createdBy', 'username')
            .populate('updatedBy', 'username');

        res.render('admin/categories/manage', {
            title: 'Category Management',
            admin: req.session.admin,
            categories
        });
    } catch (error) {
        req.flash('error', 'Error loading categories');
        res.redirect('/admin/dashboard');
    }
};

// Render category view page
export const renderCategoryView = async (req, res) => {
    try {
        const category = await Category.findById(req.params.id)
            .populate('parent', 'name')
            .populate('createdBy', 'username')
            .populate('updatedBy', 'username');

        if (!category) {
            req.flash('error', 'Category not found');
            return res.redirect('/admin/categories/manage');
        }

        res.render('admin/categories/view', {
            title: 'View Category',
            admin: req.session.admin,
            category
        });
    } catch (error) {
        console.error('Error viewing category:', error);
        req.flash('error', 'Error loading category');
        res.redirect('/admin/categories/manage');
    }
};

// Render category edit page
export const renderCategoryEdit = async (req, res) => {
    try {
        const category = await Category.findById(req.params.id)
            .populate('parent', 'name')
            .populate('createdBy', 'username')
            .populate('updatedBy', 'username');

        if (!category) {
            req.flash('error', 'Category not found');
            return res.redirect('/admin/categories/manage');
        }

        // Get all categories for parent selection (excluding current category and its children)
        const categories = await Category.find({
            _id: { $ne: category._id }
        }).select('name');

        res.render('admin/categories/edit', {
            title: 'Edit Category',
            admin: req.session.admin,
            category,
            categories
        });
    } catch (error) {
        req.flash('error', 'Error loading category');
        res.redirect('/admin/categories/manage');
    }
};

// ===== API FUNCTIONS =====

// Create a new category
export const createCategory = async (req, res) => {
    try {
        const { name, description, parent, status } = req.body;

        // If parent category is provided and not empty, validate it exists
        if (parent && parent.trim() !== '') {
            const parentCategory = await Category.findById(parent);
            if (!parentCategory) {
                return res.status(404).json({
                    success: false,
                    message: 'Parent category not found'
                });
            }
        }

        // Create category with admin ID
        const category = new Category({
            name,
            description,
            parent: parent && parent.trim() !== '' ? parent : null,
            status: status || 'active',
            createdBy: req.admin._id
        });

        await category.save();

        // Create notification for other admins
        await notifyAdmins(
            'New Category Created',
            `${req.admin.username} has created a new category: ${name}`,
            'success',
            `/admin/categories/view/${category._id}`,
            req.admin._id
        );

        // If it's an AJAX request, return JSON
        if (req.xhr || req.headers.accept.indexOf('json') > -1) {
            return res.status(201).json({
                success: true,
                data: category
            });
        }

        // Otherwise redirect with flash message
        req.flash('success', 'Category created successfully');
        res.redirect('/admin/categories/manage');
    } catch (error) {
        // If it's an AJAX request, return JSON error
        if (req.xhr || req.headers.accept.indexOf('json') > -1) {
            return res.status(400).json({
                success: false,
                message: error.message
            });
        }

        // Otherwise redirect with flash message
        req.flash('error', `Error creating category: ${error.message}`);
        res.redirect('/admin/categories/manage');
    }
};

// Get all categories
export const getAllCategories = async (req, res) => {
    try {
        const categories = await Category.find()
            .populate('parent', 'name')
            .populate('createdBy', 'username')
            .populate('updatedBy', 'username');

        res.status(200).json({
            success: true,
            count: categories.length,
            data: categories
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Get single category
export const getCategory = async (req, res) => {
    try {
        const category = await Category.findById(req.params.id)
            .populate('parent', 'name')
            .populate('createdBy', 'username')
            .populate('updatedBy', 'username');

        if (!category) {
            return res.status(404).json({
                success: false,
                message: 'Category not found'
            });
        }

        res.status(200).json({
            success: true,
            data: category
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Update category
export const updateCategory = async (req, res) => {
    try {
        const { name, description, parent, status } = req.body;

        // Check if category exists
        const category = await Category.findById(req.params.id);
        if (!category) {
            return res.status(404).json({
                success: false,
                message: 'Category not found'
            });
        }

        // If parent category is being updated and not empty, validate it exists
        if (parent && parent.trim() !== '') {
            const parentCategory = await Category.findById(parent);
            if (!parentCategory) {
                return res.status(404).json({
                    success: false,
                    message: 'Parent category not found'
                });
            }
        }

        // Update fields
        category.name = name;
        category.description = description;
        category.parent = parent && parent.trim() !== '' ? parent : null;
        category.status = status;
        category.updatedBy = req.admin._id;

        await category.save();

        // Create notification for other admins
        await notifyAdmins(
            'Category Updated',
            `${req.admin.username} has updated category: ${name}`,
            'info',
            `/admin/categories/view/${category._id}`,
            req.admin._id
        );

        // If it's an AJAX request, return JSON
        if (req.xhr || req.headers.accept.indexOf('json') > -1) {
            return res.status(200).json({
                success: true,
                data: category
            });
        }

        // Otherwise redirect with flash message
        req.flash('success', 'Category updated successfully');
        res.redirect('/admin/categories/manage');
    } catch (error) {
        // If it's an AJAX request, return JSON error
        if (req.xhr || req.headers.accept.indexOf('json') > -1) {
            return res.status(400).json({
                success: false,
                message: error.message
            });
        }

        // Otherwise redirect with flash message
        req.flash('error', `Error updating category: ${error.message}`);
        res.redirect('/admin/categories/manage');
    }
};

// Delete category
export const deleteCategory = async (req, res) => {
    try {
        const category = await Category.findById(req.params.id);

        if (!category) {
            return res.status(404).json({
                success: false,
                message: 'Category not found'
            });
        }

        // Check if category has products
        const productsCount = await Product.countDocuments({ category: category._id });
        if (productsCount > 0) {
            return res.status(400).json({
                success: false,
                message: 'Cannot delete category with associated products'
            });
        }

        // Store category name for notification
        const categoryName = category.name;

        // Delete the category
        await Category.findByIdAndDelete(req.params.id);

        // Create notification for other admins
        await notifyAdmins(
            'Category Deleted',
            `${req.admin.username} has deleted category: ${categoryName}`,
            'warning',
            null,
            req.admin._id
        );

        // If it's an AJAX request, return JSON
        if (req.xhr || req.headers.accept.indexOf('json') > -1) {
            return res.status(200).json({
                success: true,
                message: 'Category deleted successfully'
            });
        }

        // Otherwise redirect with flash message
        req.flash('success', 'Category deleted successfully');
        res.redirect('/admin/categories/manage');
    } catch (error) {
        // If it's an AJAX request, return JSON error
        if (req.xhr || req.headers.accept.indexOf('json') > -1) {
            return res.status(400).json({
                success: false,
                message: error.message
            });
        }

        // Otherwise redirect with flash message
        req.flash('error', `Error deleting category: ${error.message}`);
        res.redirect('/admin/categories/manage');
    }
}; 