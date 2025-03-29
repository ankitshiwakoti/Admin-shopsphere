import express from 'express';
import { isAdmin } from '../middleware/auth.js';
import * as authController from '../controllers/authController.js';
import * as adminController from '../controllers/adminController.js';

const router = express.Router();

// Auth routes (no layout)
router.get('/login', authController.getLogin);
router.post('/login', authController.postLogin);
router.get('/signup', authController.getSignup);
router.post('/signup', authController.postSignup);
router.get('/logout', authController.getLogout);

// Admin routes (with dashboard layout)
router.get('/dashboard', isAdmin, adminController.getDashboard);
router.get('/admins', isAdmin, adminController.getAdmins);
router.post('/admins', isAdmin, adminController.createAdmin);
router.put('/admins/:id', isAdmin, adminController.updateAdmin);
router.delete('/admins/:id', isAdmin, adminController.deleteAdmin);

export default router; 