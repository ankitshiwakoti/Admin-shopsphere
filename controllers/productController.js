import Product from "../models/product.js";

/**
 * GET - Fetch all products and render the product list page
 */
export const getAllProducts = async (req, res) => {
    try {
        const products = await Product.find(); // Fetch all products from MongoDB
        res.render("admin/product-list", { 
            title: "Admin - Product List",
            isAdmin: req.user && req.user.role === "admin",
            products
        });
    } catch (error) {
        console.error("Error fetching products:", error);
        res.status(500).send("Error fetching products");
    }
};

/**
 * GET - Fetch a single product by ID
 */
export const getProductById = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (!product) {
            return res.status(404).send("Product not found");
        }
        res.json(product); // Send product details as JSON response
    } catch (error) {
        console.error("Error fetching product:", error);
        res.status(500).send("Error fetching product");
    }
};

/**
 * GET - Render Add Product Page
 */
export const showAddProductPage = (req, res) => {
    res.render("admin/add-product", { 
        title: "Add Product", 
        isAdmin: req.user && req.user.role === "admin"
    });
};

/**
 * POST - Handle Add Product Form Submission
 */
export const addProduct = async (req, res) => {
    try {
        const { name, category, price, description, image } = req.body;
        
        if (!name || !category || !price || !description) {
            return res.status(400).send("All fields are required.");
        }

        const newProduct = new Product({ name, category, price, description, image });
        await newProduct.save();
        
        res.redirect("/admin/products");
    } catch (error) {
        console.error("Error adding product:", error);
        res.status(500).send("Error adding product");
    }
};

/**
 * POST - Update Product by ID
 */
export const updateProduct = async (req, res) => {
    try {
        const { name, category, price, description, image } = req.body;
        const updatedProduct = await Product.findByIdAndUpdate(
            req.params.id,
            { name, category, price, description, image },
            { new: true }
        );
        if (!updatedProduct) {
            return res.status(404).send("Product not found");
        }
        res.redirect("/admin/products");
    } catch (error) {
        console.error("Error updating product:", error);
        res.status(500).send("Error updating product");
    }
};

/**
 * POST - Delete Product by ID
 */
export const deleteProduct = async (req, res) => {
    try {
        await Product.findByIdAndDelete(req.params.id);
        res.redirect("/admin/products");
    } catch (error) {
        console.error("Error deleting product:", error);
        res.status(500).send("Error deleting product");
    }
};
