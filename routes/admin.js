import express from 'express';
import { 
    getLogin, 
    getSignup, 
    postSignup, 
    postLogin, 
    logout,
    refreshToken
} from '../controllers/authController.js';
import { isAuthenticated, authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Auth routes
router.get('/login', getLogin);
router.get('/signup', getSignup);
router.post('/signup', postSignup);
router.post('/login', postLogin);
router.get('/logout', logout);

// JWT routes
router.post('/refresh-token', refreshToken);

// Protected routes
router.get('/dashboard', isAuthenticated, (req, res) => {
    res.render('admin/dashboard', { title: 'Admin Dashboard' });
});

// API routes (protected with JWT)
router.get('/api/profile', authenticateToken, (req, res) => {
    res.json({ message: 'Protected route accessed successfully' });
});

export default router; 