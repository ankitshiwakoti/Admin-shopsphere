import express from 'express';

const router = express.Router();

// Home route
router.get('/', (req, res) => {
    res.redirect('/admin/login');
});

export default router; 