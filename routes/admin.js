import express from 'express';
import { isAdmin, isAuthenticated, isSuperAdmin } from '../middleware/auth.js';
import * as authController from '../controllers/authController.js';
import * as adminController from '../controllers/adminController.js';
import * as roleViewController from '../controllers/roleViewController.js';
import * as roleController from '../controllers/roleController.js';
import { upload } from '../middleware/upload.js';

const router = express.Router();

// Auth routes (no layout)
router.get('/login', authController.getLogin);
router.post('/login', authController.postLogin);
router.get('/signup', authController.getSignup);
router.post('/signup', authController.postSignup);
router.get('/logout', authController.getLogout);

// Admin routes (with dashboard layout)
router.get('/dashboard', isAdmin, adminController.getDashboard);
router.get('/products/manage', isAdmin, adminController.getProductManagement);
router.get('/categories/manage', isAdmin, adminController.getCategoryManagement);

// Admin management routes
router.get('/admins', isAdmin, adminController.getAdmins);
router.get('/admins/:id/edit', isAdmin, adminController.getEditAdmin);
router.post('/admins', isAdmin, adminController.createAdmin);
router.post('/admins/:id/update', isAdmin, adminController.updateAdmin);
router.post('/admins/:id/delete', isAdmin, adminController.deleteAdmin);

// Role management routes
router.get('/roles', isAuthenticated, isSuperAdmin, roleViewController.getRolesPage);
router.get('/roles/:roleId/admins', isAuthenticated, isSuperAdmin, roleController.getAssignedAdmins);
router.post('/roles', isAuthenticated, isSuperAdmin, roleController.createRole);
router.post('/roles/assign', isAuthenticated, isSuperAdmin, roleController.assignRole);
router.post('/roles/remove', isAuthenticated, isSuperAdmin, roleController.removeRole);

// Category management routes
router.get('/categories', isAdmin, adminController.getCategoryManagement);
router.get('/categories/:id/edit', isAdmin, adminController.getCategoryEdit);
router.post('/categories/create', isAdmin, adminController.createCategory);
router.post('/categories/:id', isAdmin, adminController.updateCategory);
router.post('/categories/:id/delete', isAdmin, adminController.deleteCategory);

// Product management routes
router.get('/products', isAdmin, adminController.getProducts);
router.get('/products/:id/edit', isAdmin, adminController.getProductEdit);
router.post('/products/create', isAdmin, upload.array('images', 5), adminController.createProduct);
router.post('/products/:id', isAdmin, upload.array('images', 5), adminController.updateProduct);
router.post('/products/:id/delete', isAdmin, adminController.deleteProduct);

export default router; 