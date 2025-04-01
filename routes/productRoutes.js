import express from 'express';
import {
    createProduct,
    getAllProducts,
    getProduct,
    updateProduct,
    deleteProduct
} from '../controllers/productController.js';
import { protect, authorize, checkPermission } from '../middleware/auth.js';

const router = express.Router();

// Public routes
router.get('/', getAllProducts);
router.get('/:id', getProduct);

// Protected routes
router.use(protect);

// Create product - Only Super Admin & Product Manager
router.post('/create',
    authorize('superadmin', 'product_manager'),
    checkPermission('manage_products'),
    createProduct
);

// Update product - Only authorized roles
router.patch('/update/:id',
    checkPermission('manage_products'),
    updateProduct
);

// Delete product - Only Super Admin
router.delete('/delete/:id',
    authorize('superadmin'),
    deleteProduct
);

export default router; 