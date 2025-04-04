import express from 'express';
import { protect, checkPermission, isSuperAdmin, isAdmin } from '../middleware/auth.js';
import * as authController from '../controllers/authController.js';
import * as adminController from '../controllers/adminController.js';
import * as roleViewController from '../controllers/roleViewController.js';
import * as roleController from '../controllers/roleController.js';
import * as customerController from '../controllers/customerController.js';
import * as productController from '../controllers/productController.js';
import * as categoryController from '../controllers/categoryController.js';
import { upload } from '../middleware/upload.js';
import * as notificationController from '../controllers/notificationController.js';
import { getProfile } from '../controllers/activityLogController.js';

const router = express.Router();

// ===== PUBLIC ROUTES (NO AUTHENTICATION REQUIRED) =====
router.get('/login', authController.getLogin);
router.post('/login', authController.login);
router.get('/signup', authController.getSignup);
router.post('/signup', authController.postSignup);
router.get('/logout', authController.getLogout);

// ===== PROTECTED ROUTES (AUTHENTICATION REQUIRED) =====
router.use(protect);

// Dashboard
router.get('/dashboard', checkPermission('view_dashboard'), adminController.getDashboard);

// Profile routes
router.get('/profile', isAdmin, getProfile);
router.post('/profile/update', isAdmin, adminController.updateProfile);
router.post('/profile/change-password', isAdmin, adminController.changePassword);

// ===== CATEGORY MANAGEMENT ROUTES =====
// View routes
router.get('/categories/manage', checkPermission('manage_categories'), categoryController.renderCategoryManagement);
router.get('/categories/:id/edit', checkPermission('manage_categories'), categoryController.renderCategoryEdit);

// API routes
router.post('/categories/create', checkPermission('manage_categories'), categoryController.createCategory);
router.post('/categories/:id', checkPermission('manage_categories'), categoryController.updateCategory);
router.post('/categories/:id/delete', checkPermission('manage_categories'), categoryController.deleteCategory);

// ===== PRODUCT MANAGEMENT ROUTES =====
// View routes
router.get('/products/manage', checkPermission('manage_products'), productController.renderProductManagement);
router.get('/products/create', checkPermission('manage_products'), productController.renderProductCreation);
router.get('/products/view/:id', checkPermission('manage_products'), productController.getProductDetails);
router.get('/products/edit/:id', checkPermission('manage_products'), productController.renderProductEdit);

// API routes
router.post('/products/create', 
    checkPermission('manage_products'), 
    upload.array('images', 5), 
    productController.createProduct
);
router.post('/products/edit/:id',
    checkPermission('manage_products'),
    upload.array('images', 5),
    productController.updateProduct
);
router.post('/products/:id/delete', checkPermission('manage_products'), productController.deleteProduct);

// ===== CUSTOMER MANAGEMENT ROUTES =====
// View routes
router.get('/customers', checkPermission('manage_customers'), customerController.getAllCustomers);
router.get('/customers/:id', checkPermission('manage_customers'), customerController.getCustomerDetails);
router.get('/customers/:id/orders', checkPermission('manage_customers'), customerController.getCustomerOrders);

// API routes
router.put('/customers/:id/status', checkPermission('manage_customers'), customerController.updateCustomerStatus);
router.put('/orders/:id/status', checkPermission('manage_customers'), customerController.updateOrderStatus);

// ===== ADMIN MANAGEMENT ROUTES (SUPERADMIN ONLY) =====
router.get('/admins', isSuperAdmin, adminController.getAdmins);
router.get('/admins/:id/edit', isSuperAdmin, adminController.getEditAdmin);
router.post('/admins', isSuperAdmin, adminController.createAdmin);
router.post('/admins/:id/update', isSuperAdmin, adminController.updateAdmin);
router.post('/admins/:id/delete', isSuperAdmin, adminController.deleteAdmin);

// ===== ROLE MANAGEMENT ROUTES (SUPERADMIN ONLY) =====
// View routes
router.get('/roles', isSuperAdmin, roleViewController.getRolesPage);

// API routes
router.get('/roles/list', isSuperAdmin, roleController.getRoles);
router.post('/roles', isSuperAdmin, roleController.createRole);
router.post('/roles/assign', isSuperAdmin, roleController.assignRole);
router.post('/roles/remove', isSuperAdmin, roleController.removeRole);
router.get('/roles/:roleId/admins', isSuperAdmin, roleController.getAssignedAdmins);

// Notification routes
router.get('/notifications', isAdmin, notificationController.getNotifications);
router.post('/notifications', isAdmin, notificationController.createNotification);
router.put('/notifications/:id/read', isAdmin, notificationController.markAsRead);
router.put('/notifications/read-all', isAdmin, notificationController.markAllAsRead);
router.delete('/notifications/:id', isAdmin, notificationController.deleteNotification);

// ===== ERROR PAGES =====
router.get('/unauthorized', protect, authController.getUnauthorized);

export default router; 