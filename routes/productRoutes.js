import express from 'express';
import {
    createProduct,
    getAllProducts,
    getProduct,
    updateProduct,
    deleteProduct,
    renderProductManagement,
    renderProductCreation,
    renderProductEdit
} from '../controllers/productController.js';
import { protect, authorize, checkPermission } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';

const router = express.Router();

// Log all requests
router.use((req, res, next) => {
    console.log('Product route hit:', req.method, req.path);
    console.log('Request body:', req.body);
    next();
});

// Protected admin routes
router.use(protect);

// Admin view routes - These need to come before API routes to avoid conflicts
router.get('/manage',
    checkPermission('manage_products'),
    renderProductManagement
);

router.get('/create',
    checkPermission('manage_products'),
    renderProductCreation
);

// Edit product page
router.get('/edit/:id',
    checkPermission('manage_products'),
    renderProductEdit
);

// Create product - Only users with manage_products permission
// This needs to come before the generic routes to avoid conflicts
router.post('/create', 
    checkPermission('manage_products'), 
    upload.array('images', 5), 
    (req, res, next) => {
        console.log('Create product route hit');
        console.log('Request body:', req.body);
        console.log('Files:', req.files);
        console.log('Admin:', req.admin);
        next();
    },
    createProduct
);

// Update product - Only users with manage_products permission
router.post('/edit/:id',
    checkPermission('manage_products'),
    upload.array('images', 5),
    updateProduct
);

// API routes - These come after the specific routes
router.get('/', getAllProducts);
router.get('/:id', getProduct);

// Delete product - Only Super Admin
router.delete('/:id',
    authorize('superadmin'),
    deleteProduct
);

export default router; 