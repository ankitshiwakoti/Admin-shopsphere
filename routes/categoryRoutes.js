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

// Create category - Only users with manage_categories permission
router.post('/create',
    checkPermission('manage_categories'),
    createCategory
);

// Update category - Only users with manage_categories permission
router.patch('/update/:id',
    checkPermission('manage_categories'),
    updateCategory
);

// Delete category - Only Super Admin
router.delete('/delete/:id',
    authorize('superadmin'),
    deleteCategory
);

export default router; 