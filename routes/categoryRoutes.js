import express from 'express';
import {
    createCategory,
    getAllCategories,
    getCategory,
    updateCategory,
    deleteCategory
} from '../controllers/categoryController.js';
import { protect, authorize, checkPermission } from '../middleware/auth.js';

const router = express.Router();

// Public routes
router.get('/', getAllCategories);
router.get('/:id', getCategory);

// Protected routes
router.use(protect);

// Create category - Only Super Admin & Product Manager
router.post('/create',
    authorize('superadmin', 'product_manager'),
    checkPermission('manage_products'),
    createCategory
);

// Update category - Only authorized roles
router.patch('/update/:id',
    checkPermission('manage_products'),
    updateCategory
);

// Delete category - Only Super Admin
router.delete('/delete/:id',
    authorize('superadmin'),
    deleteCategory
);

export default router; 