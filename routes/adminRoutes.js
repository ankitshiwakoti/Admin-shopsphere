const express = require('express');
const router = express.Router();
const { isAuthenticated, isAuthorized } = require('../middleware/auth');
const productController = require('../controllers/productController');
const categoryController = require('../controllers/categoryController');
const customerController = require('../controllers/customerController');

// Dashboard
router.get('/dashboard', isAuthenticated, isAuthorized(['admin', 'manager']), (req, res) => {
    res.render('admin/dashboard', { 
        title: 'Dashboard',
        path: '/admin/dashboard'
    });
});

// Product Management Routes
router.get('/products/manage', isAuthenticated, isAuthorized(['admin', 'manager']), productController.renderProductManagement);
router.get('/products/create', isAuthenticated, isAuthorized(['admin', 'manager']), productController.renderProductCreation);
router.post('/products/create', isAuthenticated, isAuthorized(['admin', 'manager']), productController.createProduct);
router.get('/products/edit/:id', isAuthenticated, isAuthorized(['admin', 'manager']), productController.renderProductEdit);
router.post('/products/edit/:id', isAuthenticated, isAuthorized(['admin', 'manager']), productController.updateProduct);
router.delete('/products/:id', isAuthenticated, isAuthorized(['admin', 'manager']), productController.deleteProduct);

// Category Management Routes
router.get('/categories/manage', isAuthenticated, isAuthorized(['admin', 'manager']), categoryController.renderCategoryManagement);
router.post('/categories/create', isAuthenticated, isAuthorized(['admin', 'manager']), categoryController.createCategory);
router.put('/categories/:id', isAuthenticated, isAuthorized(['admin', 'manager']), categoryController.updateCategory);
router.delete('/categories/:id', isAuthenticated, isAuthorized(['admin', 'manager']), categoryController.deleteCategory);

// Customer Management Routes
router.get('/customers', isAuthenticated, isAuthorized(['admin', 'manager']), customerController.getAllCustomers);
router.get('/customers/:id', isAuthenticated, isAuthorized(['admin', 'manager']), customerController.getCustomerDetails);
router.put('/customers/:id/status', isAuthenticated, isAuthorized(['admin', 'manager']), customerController.updateCustomerStatus);
router.get('/customers/:id/orders', isAuthenticated, isAuthorized(['admin', 'manager']), customerController.getCustomerOrders);
router.put('/orders/:id/status', isAuthenticated, isAuthorized(['admin', 'manager']), customerController.updateOrderStatus);

module.exports = router; 