import Product from '../models/product.js';
import Category from '../models/Category.js';
import mongoose from 'mongoose';

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
        const product = await Product.findByIdAndDelete(req.params.id);
        
        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Product not found'
            });
        }
        
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
        const products = await Product.find()
            .populate('category', 'name')
            .populate('createdBy', 'username')
            .populate('updatedBy', 'username')
            .sort('-createdAt');

        console.log('Products:', products);

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