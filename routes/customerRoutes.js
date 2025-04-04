import express from 'express';
import { isAdmin } from '../middleware/auth.js';
import * as customerController from '../controllers/customerController.js';

const router = express.Router();

// Customer management routes
router.get('/', isAdmin, customerController.getAllCustomers);
router.get('/:id', isAdmin, customerController.getCustomerDetails);
router.put('/:id/status', isAdmin, customerController.updateCustomerStatus);
router.get('/:id/orders', isAdmin, customerController.getCustomerOrders);
router.put('/orders/:id/status', isAdmin, customerController.updateOrderStatus);

export default router; 