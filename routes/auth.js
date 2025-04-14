import express from 'express';
import { login, getLogout, getLogin } from '../controllers/authController.js';
import { generateSecret, verifyToken, disableMFA, getMFAStatus } from '../controllers/mfaController.js';
import { isAuthenticated } from '../middleware/auth.js';

const router = express.Router();

// Auth routes
router.get('/login', getLogin);
router.post('/login', login);
router.get('/logout', getLogout);

// MFA routes
router.post('/mfa/generate', isAuthenticated, generateSecret);
router.post('/mfa/verify', isAuthenticated, verifyToken);
router.post('/mfa/disable', isAuthenticated, disableMFA);
router.get('/mfa/status', isAuthenticated, getMFAStatus);

// MFA verification page
router.get('/mfa-verify', (req, res) => {
    const pendingMFA = req.session.mfaPending;
    if (!pendingMFA) {
        return res.redirect('/admin/login');
    }
    res.render('auth/mfa-verify', {
        email: pendingMFA.email,
        password: pendingMFA.password
    });
});

export default router; 