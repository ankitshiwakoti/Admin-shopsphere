import Product from '../models/Product.js';
import Category from '../models/Category.js';
import mongoose from 'mongoose';
import Admin from '../models/Admin.js';
import { notifyAdmins } from './notificationController.js';

// Create a new product
export const createProduct = async (req, res) => {
    try {
        // Extract form data and handle file uploads
        const productData = {
            name: req.body.name,
            description: req.body.description,
            shortDescription: req.body.shortDescription,
            price: parseFloat(req.body.price),
            stock: parseInt(req.body.stock),
            category: req.body.category,
            status: req.body.status || 'draft',
            createdBy: req.session.adminId,
            updatedBy: req.session.adminId
        };

        // Handle specifications if provided
        if (req.body.specifications) {
            try {
                productData.specifications = JSON.parse(req.body.specifications);
            } catch (error) {
                console.error('Error parsing specifications:', error);
            }
        }

        // Handle attributes if provided
        if (req.body.attributes) {
            try {
                productData.attributes = JSON.parse(req.body.attributes);
            } catch (error) {
                console.error('Error parsing attributes:', error);
            }
        }

        // Handle image uploads
        if (req.files && req.files.length > 0) {
            productData.images = req.files.map((file, index) => ({
                url: '/uploads/' + file.filename,
                isMain: index === 0 // First image is main
            }));
        }

        // Create and save the product
        const product = new Product(productData);
        await product.save();

        // Create notification for admins with product permissions
        await notifyAdmins(
            'New Product Created',
            `${req.session.admin.username} has created a new product: ${product.name}`,
            'success',
            `/admin/products/${product._id}`,
            req.session.adminId,
            [],
            { model: 'Product', id: product._id }
        );

        req.flash('success_msg', 'Product created successfully');
        res.redirect('/admin/products/manage');
    } catch (error) {
        console.error('Error creating product:', error);
        req.flash('error_msg', error.message || 'Error creating product');
        res.redirect('/admin/products/manage');
    }
};

// Get all products
export const getAllProducts = async (req, res) => {
    try {
        const products = await Product.find()
            .populate('category', 'name')
            .populate('createdBy', 'username')
            .populate('updatedBy', 'username');

        res.status(200).json({
            success: true,
            count: products.length,
            data: products
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Get single product
export const getProduct = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id)
            .populate('category', 'name')
            .populate('createdBy', 'username')
            .populate('updatedBy', 'username');

        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Product not found'
            });
        }

        res.status(200).json({
            success: true,
            data: product
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Update product
export const updateProduct = async (req, res) => {
    try {
        const { id } = req.params;
        
        // Extract form data and handle file uploads
        const updateData = {
            name: req.body.name,
            description: req.body.description,
            shortDescription: req.body.shortDescription,
            price: parseFloat(req.body.price),
            stock: parseInt(req.body.stock),
            category: req.body.category,
            status: req.body.status,
            updatedBy: req.session.adminId
        };

        // Handle specifications if provided
        if (req.body.specifications) {
            try {
                updateData.specifications = JSON.parse(req.body.specifications);
            } catch (error) {
                console.error('Error parsing specifications:', error);
            }
        }

        // Handle attributes if provided
        if (req.body.attributes) {
            try {
                updateData.attributes = JSON.parse(req.body.attributes);
            } catch (error) {
                console.error('Error parsing attributes:', error);
            }
        }

        // Handle image uploads
        if (req.files && req.files.length > 0) {
            updateData.images = req.files.map((file, index) => ({
                url: '/uploads/' + file.filename,
                isMain: index === 0 // First image is main
            }));
        }

        const product = await Product.findByIdAndUpdate(
            id,
            { $set: updateData },
            { new: true, runValidators: true }
        );

        if (!product) {
            req.flash('error_msg', 'Product not found');
            return res.redirect('/admin/products/manage');
        }

        // Create notification for admins with product permissions
        await notifyAdmins(
            'Product Updated',
            `${req.session.admin.username} has updated product: ${product.name}`,
            'info',
            `/admin/products/${product._id}`,
            req.session.adminId,
            [],
            { model: 'Product', id: product._id }
        );

        req.flash('success_msg', 'Product updated successfully');
        res.redirect('/admin/products/manage');
    } catch (error) {
        console.error('Error updating product:', error);
        req.flash('error_msg', error.message || 'Error updating product');
        res.redirect('/admin/products/manage');
    }
};

// Delete product
export const deleteProduct = async (req, res) => {
    try {
        const { id } = req.params;
        const product = await Product.findById(id);
        
        if (!product) {
            req.flash('error_msg', 'Product not found');
            return res.redirect('/admin/products/manage');
        }

        const productName = product.name;
        await Product.findByIdAndDelete(id);

        // Create notification for admins with product permissions
        await notifyAdmins(
            'Product Deleted',
            `${req.session.admin.username} has deleted product: ${productName}`,
            'warning',
            null,
            req.session.adminId,
            [],
            { model: 'Product', id: id }
        );

        req.flash('success_msg', 'Product deleted successfully');
        res.redirect('/admin/products/manage');
    } catch (error) {
        console.error('Error deleting product:', error);
        req.flash('error_msg', error.message || 'Error deleting product');
        res.redirect('/admin/products/manage');
    }
};

// Render product management page
export const renderProductManagement = async (req, res) => {
    try {
        // Get all products without pagination
        const products = await Product.find()
            .populate('category')
            .populate('createdBy', 'username')
            .sort({ createdAt: -1 });
            
        console.log(`Server: Sending ${products.length} products to the client`);
            
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

// Render product creation page
export const renderProductCreation = async (req, res) => {
    try {
        const categories = await Category.find();
        
        res.render('admin/products/create', {
            title: 'Create Product',
            categories
        });
    } catch (error) {
        console.error('Error loading product creation page:', error);
        req.flash('error_msg', 'Error loading product creation page');
        res.redirect('/admin/products/manage');
    }
};

// Render product edit page
export const renderProductEdit = async (req, res) => {
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
        console.error('Error loading product edit page:', error);
        req.flash('error_msg', 'Error loading product edit page');
        res.redirect('/admin/products/manage');
    }
};

// Get product details
export const getProductDetails = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id)
            .populate('category')
            .populate('createdBy', 'username')
            .populate('updatedBy', 'username');
            
        if (!product) {
            if (req.xhr || req.headers.accept.includes('application/json')) {
                return res.status(404).json({
                    success: false,
                    error: 'Product not found'
                });
            }
            req.flash('error_msg', 'Product not found');
            return res.redirect('/admin/products/manage');
        }
        
        if (req.xhr || req.headers.accept.includes('application/json')) {
            return res.json({
                success: true,
                product
            });
        }
        
        res.render('admin/products/details', {
            title: 'Product Details',
            product
        });
    } catch (error) {
        console.error('Error loading product details:', error);
        if (req.xhr || req.headers.accept.includes('application/json')) {
            return res.status(500).json({
                success: false,
                error: 'Error loading product details'
            });
        }
        req.flash('error_msg', 'Error loading product details');
        res.redirect('/admin/products/manage');
    }
}; 