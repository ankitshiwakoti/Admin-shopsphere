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
            products,
            body: `
                <div class="container mt-4">
                    <h2>Admin - Product List</h2>
                    <a href="/admin/products/add" class="btn btn-success mb-3">Add Product</a>
                    <table class="table table-bordered">
                        <thead class="table-dark">
                            <tr>
                                <th>Name</th>
                                <th>Category</th>
                                <th>Price</th>
                                <th>Description</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            <% if (products.length > 0) { %>
                                <% products.forEach(product => { %>
                                    <tr>
                                        <td><%= product.name %></td>
                                        <td><%= product.category %></td>
                                        <td>$<%= product.price %></td>
                                        <td><%= product.description %></td>
                                        <td>
                                            <form action="/admin/products/delete/<%= product._id %>" method="POST" style="display:inline;">
                                                <button type="submit" class="btn btn-danger btn-sm">Delete</button>
                                            </form>
                                        </td>
                                    </tr>
                                <% }) %>
                            <% } else { %>
                                <tr>
                                    <td colspan="5" class="text-center">No products available</td>
                                </tr>
                            <% } %>
                        </tbody>
                    </table>
                </div>
            ` // Make sure you send content as body for the layout
        });
    } catch (error) {
        console.error("Error fetching products:", error);
        res.render("admin/product-list", { 
            title: "Admin - Product List",
            isAdmin: false,
            products: [],
            body: `<div class="container mt-4">
                    <h2>Admin - Product List</h2>
                    <p>No products available.</p>
                </div>`
        });
    }
};

/**
 * GET - Render Add Product Page
 */
export const showAddProductPage = (req, res) => {
    res.render("admin/add-product", { 
        title: "Add Product", 
        isAdmin: req.user && req.user.role === "admin",
        body: `
            <div class="container mt-4">
                <h2>Add Product</h2>
                <form action="/admin/products/add" method="POST">
                    <div class="mb-3">
                        <label for="name" class="form-label">Product Name</label>
                        <input type="text" class="form-control" id="name" name="name" required>
                    </div>
                    <div class="mb-3">
                        <label for="category" class="form-label">Category</label>
                        <input type="text" class="form-control" id="category" name="category" required>
                    </div>
                    <div class="mb-3">
                        <label for="price" class="form-label">Price</label>
                        <input type="number" step="0.01" class="form-control" id="price" name="price" required>
                    </div>
                    <div class="mb-3">
                        <label for="description" class="form-label">Description</label>
                        <textarea class="form-control" id="description" name="description"></textarea>
                    </div>
                    <div class="mb-3">
                        <label for="image" class="form-label">Image URL</label>
                        <input type="text" class="form-control" id="image" name="image">
                    </div>
                    <button type="submit" class="btn btn-primary">Add Product</button>
                </form>
            </div>
        `
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
        res.redirect("/admin/products");
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
        res.redirect("/admin/products");
    }
};
