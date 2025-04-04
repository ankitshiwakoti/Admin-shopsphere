import express from 'express';
import { protect, checkPermission } from '../middleware/auth.js';
import * as customerController from '../controllers/customerController.js';

const router = express.Router();

// Protected routes
router.use(protect);

// Customer management routes
router.get('/', checkPermission('manage_customers'), customerController.getAllCustomers);
router.get('/:id', checkPermission('manage_customers'), customerController.getCustomerDetails);
router.put('/:id/status', checkPermission('manage_customers'), customerController.updateCustomerStatus);
router.get('/:id/orders', checkPermission('manage_customers'), customerController.getCustomerOrders);
router.put('/orders/:id/status', checkPermission('manage_customers'), customerController.updateOrderStatus);

export default router; 