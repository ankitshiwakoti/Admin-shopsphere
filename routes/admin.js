import express from 'express';
import { isAdmin, isAuthenticated, isSuperAdmin } from '../middleware/auth.js';
import * as authController from '../controllers/authController.js';
import * as adminController from '../controllers/adminController.js';
import * as roleViewController from '../controllers/roleViewController.js';
import * as roleController from '../controllers/roleController.js';

const router = express.Router();

// Auth routes (no layout)
router.get('/login', authController.getLogin);
router.post('/login', authController.postLogin);
router.get('/signup', authController.getSignup);
router.post('/signup', authController.postSignup);
router.get('/logout', authController.getLogout);

// Admin routes (with dashboard layout)
router.get('/dashboard', isAdmin, adminController.getDashboard);

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

export default router; 