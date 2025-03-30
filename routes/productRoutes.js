import express from 'express';
import pool from '../config/database.js';
import { isAdmin, isAuthenticated } from '../middleware/auth.js';
import {
  getAllProducts,
  getProductById,
  addProduct,
  updateProduct,
  deleteProduct,
} from '../controllers/productController.js';

const router = express.Router();

//  Customers & Admins can view all products
router.get('/', getAllProducts);

//  Customers & Admins can view a single product
router.get('/:id', getProductById);

//  Admin Only: Add Product
router.post('/addproduct', isAuthenticated, isAdmin, addProduct);

// Admin Only: Update Product
router.post('/update/:id', isAuthenticated, isAdmin, updateProduct);

// Admin Only: Delete Product
router.post('/delete/:id', isAuthenticated, isAdmin, deleteProduct);

export default router;




