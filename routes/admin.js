import express from 'express';
import { isAuthenticated } from '../middleware/auth.js';
import * as authController from '../controllers/authController.js';

const router = express.Router();

// Auth routes
router.get('/login', authController.getLogin);
router.post('/login', authController.postLogin);
router.get('/signup', authController.getSignup);
router.post('/signup', authController.postSignup);
router.get('/logout', authController.logout);

// Protected routes
router.get('/dashboard', isAuthenticated, (req, res) => {
    res.render('admin/dashboard', {
        title: 'Admin Dashboard',
        isAdmin: true
    });
});

export default router; 