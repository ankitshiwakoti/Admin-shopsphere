import Product from '../models/Product.js';
import Category from '../models/Category.js';
import mongoose from 'mongoose';
import Admin from '../models/Admin.js';
import { notifyAdmins } from './notificationController.js';

// Create a new product
export const createProduct = async (req, res) => {
    try {
        // Extract form data
        const {
            name,
            description,
            shortDescription,
            price,
            stock,
            category,
            status,
            specifications,
            attributes
        } = req.body;

        // Validate required fields
        if (!name || !description || !price || !category) {
            if (req.xhr || req.headers.accept.includes('application/json')) {
                return res.status(400).json({
                    success: false,
                    error: 'Please fill in all required fields'
                });
            }
            req.flash('error_msg', 'Please fill in all required fields');
            return res.redirect('/admin/products/create');
        }

        // Parse specifications and attributes
        let parsedSpecifications = [];
        let parsedAttributes = { color: [], size: [] };

        try {
            if (specifications) {
                parsedSpecifications = JSON.parse(specifications);
            }
            if (attributes) {
                parsedAttributes = JSON.parse(attributes);
            }
        } catch (error) {
            console.error('Error parsing JSON:', error);
            if (req.xhr || req.headers.accept.includes('application/json')) {
                return res.status(400).json({
                    success: false,
                    error: 'Invalid data format'
                });
            }
            req.flash('error_msg', 'Invalid data format');
            return res.redirect('/admin/products/create');
        }

        // Create product object
        const productData = {
            name,
            description,
            shortDescription,
            price: parseFloat(price),
            stock: parseInt(stock),
            category,
            status: status || 'draft',
            specifications: parsedSpecifications,
            attributes: parsedAttributes,
            createdBy: req.admin._id,
            updatedBy: req.admin._id
        };

        // Handle image uploads
        if (req.files && req.files.length > 0) {
            const images = req.files.map(file => ({
                url: '/uploads/' + file.filename,
                isMain: false
            }));
            // Set the first image as main
            if (images.length > 0) {
                images[0].isMain = true;
            }
            productData.images = images;
        } else {
            if (req.xhr || req.headers.accept.includes('application/json')) {
                return res.status(400).json({
                    success: false,
                    error: 'At least one product image is required'
                });
            }
            req.flash('error_msg', 'At least one product image is required');
            return res.redirect('/admin/products/create');
        }

        // Create the product
        const product = new Product(productData);
        await product.save();

        // Create notification for other admins
        await notifyAdmins(
            'New Product Created',
            `${req.admin.username} has created a new product: ${name}`,
            req.admin._id,
            null,
            `/admin/products/view/${product._id}`
        );

        if (req.xhr || req.headers.accept.includes('application/json')) {
            return res.status(201).json({
                success: true,
                message: 'Product created successfully',
                product: product
            });
        }

        req.flash('success_msg', 'Product created successfully');
        res.redirect('/admin/products');
    } catch (error) {
        console.error('Error creating product:', error);
        
        if (req.xhr || req.headers.accept.includes('application/json')) {
            return res.status(500).json({
                success: false,
                error: 'Error creating product: ' + error.message
            });
        }

        req.flash('error_msg', 'Error creating product: ' + error.message);
        res.redirect('/admin/products/create');
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
        const productId = req.params.id;
        const {
            name,
            description,
            shortDescription,
            price,
            stock,
            category,
            status,
            specifications,
            attributes,
            imagesData
        } = req.body;

        // Find the product
        const product = await Product.findById(productId);
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

        // Update product data
        product.name = name;
        product.description = description;
        product.shortDescription = shortDescription;
        product.price = parseFloat(price);
        product.stock = parseInt(stock);
        product.category = category;
        product.status = status;
        product.updatedBy = req.admin._id;

        // Update specifications if provided
        if (specifications) {
            try {
                product.specifications = JSON.parse(specifications);
            } catch (error) {
                console.error('Error parsing specifications:', error);
                if (req.xhr || req.headers.accept.includes('application/json')) {
                    return res.status(400).json({
                        success: false,
                        error: 'Invalid specifications format'
                    });
                }
                req.flash('error_msg', 'Invalid specifications format');
                return res.redirect(`/admin/products/edit/${productId}`);
            }
        }

        // Update attributes if provided
        if (attributes) {
            try {
                product.attributes = JSON.parse(attributes);
            } catch (error) {
                console.error('Error parsing attributes:', error);
                if (req.xhr || req.headers.accept.includes('application/json')) {
                    return res.status(400).json({
                        success: false,
                        error: 'Invalid attributes format'
                    });
                }
                req.flash('error_msg', 'Invalid attributes format');
                return res.redirect(`/admin/products/edit/${productId}`);
            }
        }

        // Handle image updates
        if (imagesData) {
            try {
                const parsedImages = JSON.parse(imagesData);
                // Only update images if there are any
                if (parsedImages && parsedImages.length > 0) {
                    product.images = parsedImages;
                }
            } catch (error) {
                console.error('Error parsing images data:', error);
                if (req.xhr || req.headers.accept.includes('application/json')) {
                    return res.status(400).json({
                        success: false,
                        error: 'Invalid images data format'
                    });
                }
                req.flash('error_msg', 'Invalid images data format');
                return res.redirect(`/admin/products/edit/${productId}`);
            }
        }

        // Handle new image uploads
        if (req.files && req.files.length > 0) {
            const newImages = req.files.map(file => ({
                url: '/uploads/' + file.filename,
                isMain: false
            }));
            // Set the first new image as main if no main image exists
            if (newImages.length > 0 && !product.images.some(img => img.isMain)) {
                newImages[0].isMain = true;
            }
            product.images = [...product.images, ...newImages];
        }

        // Save the updated product
        await product.save();

        // Create notification for other admins
        await notifyAdmins(
            'Product Updated',
            `${req.admin.username} has updated product: ${name}`,
            req.admin._id,
            null,
            `/admin/products/view/${productId}`
        );

        if (req.xhr || req.headers.accept.includes('application/json')) {
            return res.status(200).json({
                success: true,
                message: 'Product updated successfully',
                product: product
            });
        }

        req.flash('success_msg', 'Product updated successfully');
        res.redirect('/admin/products/manage');
    } catch (error) {
        console.error('Error updating product:', error);
        if (req.xhr || req.headers.accept.includes('application/json')) {
            return res.status(500).json({
                success: false,
                error: 'Error updating product: ' + error.message
            });
        }
        req.flash('error_msg', 'Error updating product: ' + error.message);
        res.redirect(`/admin/products/edit/${req.params.id}`);
    }
};

// Delete product
export const deleteProduct = async (req, res) => {
    try {
        const productId = req.params.id;
        
        // Get product details before deletion for notification
        const productToDelete = await Product.findById(productId);
        
        // Delete the product
        await Product.findByIdAndDelete(productId);
        
        // Create notification for other admins
        await notifyAdmins(
            'Product Deleted',
            `${req.admin.username} has deleted product: ${productToDelete.name}`,
            req.admin._id
        );
        
        res.status(200).json({
            success: true,
            data: {}
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Render product management view
export const renderProductManagement = async (req, res) => {
    try {
        console.log('MongoDB connection state:', mongoose.connection.readyState);
        
        const products = await Product.find()
            .populate('category', 'name')
            .populate('createdBy', 'username')
            .populate('updatedBy', 'username')
            .sort('-createdAt');

        console.log('Products count:', products.length);
        
        // Log the first few products for debugging
        if (products.length > 0) {
            console.log('First product:', {
                id: products[0]._id,
                name: products[0].name,
                category: products[0].category ? products[0].category.name : 'N/A'
            });
            
            // Check if the problematic product ID exists in the results
            const problematicId = '67ef15e0d2017b725bcd67a2';
            const problematicProduct = products.find(p => p._id.toString() === problematicId);
            console.log('Problematic product found:', problematicProduct ? 'Yes' : 'No');
            if (problematicProduct) {
                console.log('Problematic product details:', {
                    id: problematicProduct._id,
                    name: problematicProduct.name,
                    category: problematicProduct.category ? problematicProduct.category.name : 'N/A'
                });
            }
        }

        res.render('admin/products/manage', {
            title: 'Product Management',
            products: products
        });
    } catch (error) {
        console.error('Error fetching products:', error);
        res.render('admin/products/manage', {
            title: 'Product Management',
            products: [],
            error: 'Failed to fetch products'
        });
    }
};

// Render product creation view
export const renderProductCreation = async (req, res) => {
    try {
        // Fetch all categories for the dropdown
        const categories = await Category.find().sort('name');

        res.render('admin/products/create', {
            title: 'Create New Product',
            categories: categories,
            success_msg: req.flash('success_msg'),
            error_msg: req.flash('error_msg')
        });
    } catch (error) {
        console.error('Error rendering product creation page:', error);
        req.flash('error_msg', 'Error loading product creation page');
        res.redirect('/admin/products');
    }
};

// Render product edit page
export const renderProductEdit = async (req, res) => {
    try {
        const productId = req.params.id;
        
        // Find the product
        const product = await Product.findById(productId)
            .populate('category', 'name');
            
        if (!product) {
            req.flash('error_msg', 'Product not found');
            return res.redirect('/admin/products/manage');
        }
        
        // Get all categories for the dropdown
        const categories = await Category.find().sort('name');
        
        // Render the edit page
        res.render('admin/products/edit', {
            title: 'Edit Product',
            product,
            categories,
            success_msg: req.flash('success_msg'),
            error_msg: req.flash('error_msg')
        });
    } catch (error) {
        console.error('Error rendering product edit page:', error);
        req.flash('error_msg', 'Error loading product: ' + error.message);
        res.redirect('/admin/products/manage');
    }
};

// Get product details
export const getProductDetails = async (req, res) => {
    try {
        console.log('getProductDetails called with ID:', req.params.id);
        console.log('Request headers:', req.headers);
        
        // Validate the ID format
        if (!req.params.id || !/^[0-9a-fA-F]{24}$/.test(req.params.id)) {
            console.log('Invalid ID format:', req.params.id);
            if (req.xhr || req.headers.accept.includes('application/json')) {
                return res.status(400).json({
                    success: false,
                    error: 'Invalid product ID format'
                });
            }
            req.flash('error_msg', 'Invalid product ID format');
            return res.redirect('/admin/products/manage');
        }
        
        // Log the MongoDB connection state
        console.log('MongoDB connection state:', mongoose.connection.readyState);
        
        // Try to find the product with a more detailed query
        console.log('Attempting to find product with ID:', req.params.id);
        
        // First try to find the product without population
        const rawProduct = await Product.findById(req.params.id);
        console.log('Raw product found:', rawProduct ? 'Yes' : 'No');
        if (rawProduct) {
            console.log('Raw product details:', {
                id: rawProduct._id,
                name: rawProduct.name,
                category: rawProduct.category ? 'Present' : 'Missing',
                createdBy: rawProduct.createdBy ? 'Present' : 'Missing',
                updatedBy: rawProduct.updatedBy ? 'Present' : 'Missing'
            });
        }
        
        // Now try with population
        const product = await Product.findById(req.params.id)
            .populate('category')
            .populate('createdBy', 'username email')
            .populate('updatedBy', 'username email');
        
        console.log('Product found with population:', product ? 'Yes' : 'No');
        if (product) {
            console.log('Product details with population:', {
                id: product._id,
                name: product.name,
                category: product.category ? product.category.name : 'N/A',
                createdBy: product.createdBy ? product.createdBy.username : 'N/A',
                updatedBy: product.updatedBy ? product.updatedBy.username : 'N/A'
            });
        } else {
            // If raw product exists but populated product doesn't, there might be an issue with references
            if (rawProduct) {
                console.log('Product exists but population failed. Checking references:');
                
                // Check category reference
                if (rawProduct.category) {
                    const category = await Category.findById(rawProduct.category);
                    console.log('Category reference valid:', category ? 'Yes' : 'No');
                }
                
                // Check createdBy reference
                if (rawProduct.createdBy) {
                    const createdBy = await Admin.findById(rawProduct.createdBy);
                    console.log('CreatedBy reference valid:', createdBy ? 'Yes' : 'No');
                }
                
                // Check updatedBy reference
                if (rawProduct.updatedBy) {
                    const updatedBy = await Admin.findById(rawProduct.updatedBy);
                    console.log('UpdatedBy reference valid:', updatedBy ? 'Yes' : 'No');
                }
            }
        }

        if (!product) {
            if (req.xhr || req.headers.accept.includes('application/json')) {
                console.log('Returning 404 JSON response');
                return res.status(404).json({
                    success: false,
                    error: 'Product not found'
                });
            }
            req.flash('error_msg', 'Product not found');
            return res.redirect('/admin/products/manage');
        }

        // Check if it's an AJAX request
        const isAjax = req.xhr || 
                      (req.headers.accept && req.headers.accept.includes('application/json')) || 
                      (req.headers['x-requested-with'] === 'XMLHttpRequest');
        
        if (isAjax) {
            console.log('Returning JSON response');
            return res.json({
                success: true,
                product
            });
        }

        console.log('Rendering view template');
        res.render('admin/products/view', {
            product,
            title: 'View Product',
            path: '/admin/products'
        });
    } catch (error) {
        console.error('Error fetching product details:', error);
        if (req.xhr || req.headers.accept.includes('application/json')) {
            return res.status(500).json({
                success: false,
                error: 'Error fetching product details: ' + error.message
            });
        }
        req.flash('error_msg', 'Error fetching product details: ' + error.message);
        res.redirect('/admin/products/manage');
    }
}; 