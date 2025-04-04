import Order from '../models/Order.js';
import Product from '../models/Product.js';
import Customer from '../models/Customer.js';
import { notifyAdmins } from './notificationController.js';

// Render order management page
export const renderOrderManagement = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const status = req.query.status;
        const search = req.query.search;

        // Build query
        let query = {};
        if (status) {
            query.status = status;
        }
        if (search) {
            query.$or = [
                { orderNumber: { $regex: search, $options: 'i' } },
                { 'customer.name': { $regex: search, $options: 'i' } },
                { 'customer.email': { $regex: search, $options: 'i' } }
            ];
        }

        // Get orders with pagination
        const orders = await Order.find(query)
            .populate('customer', 'name email')
            .populate('products.product', 'name price')
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit);

        // Get total count for pagination
        const totalOrders = await Order.countDocuments(query);

        res.render('admin/orders/manage', {
            title: 'Order Management',
            orders,
            currentPage: page,
            totalPages: Math.ceil(totalOrders / limit),
            totalOrders,
            status,
            search
        });
    } catch (error) {
        console.error('Error rendering order management:', error);
        req.flash('error_msg', 'Error loading orders');
        res.redirect('/admin/dashboard');
    }
};

// Get order details
export const getOrderDetails = async (req, res) => {
    try {
        const order = await Order.findById(req.params.id)
            .populate('customer', 'name email phone')
            .populate('products.product', 'name price images')
            .populate('createdBy', 'username')
            .populate('updatedBy', 'username');

        if (!order) {
            req.flash('error_msg', 'Order not found');
            return res.redirect('/admin/orders');
        }

        res.render('admin/orders/details', {
            title: 'Order Details',
            order
        });
    } catch (error) {
        console.error('Error getting order details:', error);
        req.flash('error_msg', 'Error loading order details');
        res.redirect('/admin/orders');
    }
};

// Update order status
export const updateOrderStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, trackingNumber, estimatedDeliveryDate } = req.body;

        const order = await Order.findById(id);
        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }

        // Update order
        order.status = status;
        order.trackingNumber = trackingNumber;
        order.estimatedDeliveryDate = estimatedDeliveryDate;
        order.updatedBy = req.session.adminId;

        if (status === 'delivered') {
            order.actualDeliveryDate = new Date();
        }

        await order.save();

        // Create notification
        await notifyAdmins(
            'Order Status Updated',
            `Order ${order.orderNumber} status updated to ${status}`,
            'info',
            `/admin/orders/${order._id}`,
            req.session.adminId,
            [],
            { model: 'Order', id: order._id }
        );

        res.json({ success: true, message: 'Order status updated successfully' });
    } catch (error) {
        console.error('Error updating order status:', error);
        res.status(500).json({ success: false, message: 'Error updating order status' });
    }
};

// Cancel order
export const cancelOrder = async (req, res) => {
    try {
        const { id } = req.params;
        const { cancelReason } = req.body;

        const order = await Order.findById(id);
        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }

        // Update order
        order.status = 'cancelled';
        order.cancelReason = cancelReason;
        order.updatedBy = req.session.adminId;

        // Restore product stock
        for (const item of order.products) {
            await Product.findByIdAndUpdate(
                item.product,
                { $inc: { stock: item.quantity } }
            );
        }

        await order.save();

        // Create notification
        await notifyAdmins(
            'Order Cancelled',
            `Order ${order.orderNumber} has been cancelled`,
            'warning',
            `/admin/orders/${order._id}`,
            req.session.adminId,
            [],
            { model: 'Order', id: order._id }
        );

        res.json({ success: true, message: 'Order cancelled successfully' });
    } catch (error) {
        console.error('Error cancelling order:', error);
        res.status(500).json({ success: false, message: 'Error cancelling order' });
    }
};

// Process refund
export const processRefund = async (req, res) => {
    try {
        const { id } = req.params;
        const { refundAmount, reason } = req.body;

        const order = await Order.findById(id);
        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }

        // Update order
        order.refundAmount = refundAmount;
        order.paymentStatus = 'refunded';
        order.notes = order.notes ? `${order.notes}\nRefund reason: ${reason}` : `Refund reason: ${reason}`;
        order.updatedBy = req.session.adminId;

        await order.save();

        // Create notification
        await notifyAdmins(
            'Refund Processed',
            `Refund processed for order ${order.orderNumber}`,
            'info',
            `/admin/orders/${order._id}`,
            req.session.adminId,
            [],
            { model: 'Order', id: order._id }
        );

        res.json({ success: true, message: 'Refund processed successfully' });
    } catch (error) {
        console.error('Error processing refund:', error);
        res.status(500).json({ success: false, message: 'Error processing refund' });
    }
};

// Generate invoice
export const generateInvoice = async (req, res) => {
    try {
        const order = await Order.findById(req.params.id)
            .populate('customer', 'name email phone shippingAddress')
            .populate('products.product', 'name price');

        if (!order) {
            req.flash('error_msg', 'Order not found');
            return res.redirect('/admin/orders');
        }

        // Generate invoice HTML
        const invoiceHtml = await generateInvoiceTemplate(order);

        res.send(invoiceHtml);
    } catch (error) {
        console.error('Error generating invoice:', error);
        req.flash('error_msg', 'Error generating invoice');
        res.redirect('/admin/orders');
    }
};

// Export orders
export const exportOrders = async (req, res) => {
    try {
        const { startDate, endDate, status } = req.query;
        
        // Build query
        let query = {};
        if (startDate && endDate) {
            query.createdAt = {
                $gte: new Date(startDate),
                $lte: new Date(endDate)
            };
        }
        if (status) {
            query.status = status;
        }

        const orders = await Order.find(query)
            .populate('customer', 'name email')
            .populate('products.product', 'name price')
            .sort({ createdAt: -1 });

        // Convert orders to CSV format
        const csv = await generateOrdersCsv(orders);

        // Set headers for file download
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename=orders-${new Date().toISOString()}.csv`);

        res.send(csv);
    } catch (error) {
        console.error('Error exporting orders:', error);
        req.flash('error_msg', 'Error exporting orders');
        res.redirect('/admin/orders');
    }
}; 