import Customer from '../models/Customer.js';
import Order from '../models/Order.js';

// Get all customers with their orders
export const getAllCustomers = async (req, res) => {
    try {
        const customers = await Customer.find().sort({ createdAt: -1 });
        res.render('admin/customers/manage', { 
            customers,
            title: 'Customer Management',
            path: '/admin/customers'
        });
    } catch (error) {
        console.error('Error fetching customers:', error);
        req.flash('error', 'Error fetching customers');
        res.redirect('/admin/dashboard');
    }
};

// Get customer details with their orders
export const getCustomerDetails = async (req, res) => {
    try {
        const customer = await Customer.findById(req.params.id);
        if (!customer) {
            req.flash('error', 'Customer not found');
            return res.redirect('/admin/customers');
        }

        // Get orders for this specific customer with pagination
        const page = parseInt(req.query.page) || 1;
        const itemsPerPage = parseInt(req.query.limit) || 10;
        const status = req.query.status;
        const search = req.query.search;

        // Build query
        let query = { user: customer._id };
        if (status) {
            query.status = status;
        }
        if (search) {
            query.$or = [
                { orderNumber: { $regex: search, $options: 'i' } }
            ];
        }

        const orders = await Order.find(query)
            .populate({
                path: 'items.product',
                model: 'Product',
                select: 'name price images'
            })
            .sort({ createdAt: -1 })
            .skip((page - 1) * itemsPerPage)
            .limit(itemsPerPage);

        // Get total count for pagination
        const totalOrders = await Order.countDocuments(query);
        const totalPages = Math.ceil(totalOrders / itemsPerPage);

        res.render('admin/customers/details', {
            customer,
            orders,
            currentPage: page,
            totalPages,
            totalOrders,
            itemsPerPage,
            status,
            search,
            title: 'Customer Details',
            path: '/admin/customers'
        });
    } catch (error) {
        console.error('Error fetching customer details:', error);
        req.flash('error', 'Error fetching customer details');
        res.redirect('/admin/customers');
    }
};

// Update customer status
export const updateCustomerStatus = async (req, res) => {
    try {
        const { status } = req.body;
        const customer = await Customer.findByIdAndUpdate(
            req.params.id,
            { status },
            { new: true }
        );

        if (!customer) {
            return res.status(404).json({ error: 'Customer not found' });
        }

        res.json({ success: true, customer });
    } catch (error) {
        console.error('Error updating customer status:', error);
        res.status(500).json({ error: 'Error updating customer status' });
    }
};

// Get customer orders
export const getCustomerOrders = async (req, res) => {
    try {
        const orders = await Order.find({ customer: req.params.id })
            .populate('items.product')
            .sort({ createdAt: -1 });

        res.json(orders);
    } catch (error) {
        console.error('Error fetching customer orders:', error);
        res.status(500).json({ error: 'Error fetching customer orders' });
    }
};

// Update order status
export const updateOrderStatus = async (req, res) => {
    try {
        const { status } = req.body;
        const order = await Order.findByIdAndUpdate(
            req.params.id,
            { status },
            { new: true }
        ).populate('items.product');

        if (!order) {
            return res.status(404).json({ error: 'Order not found' });
        }

        res.json({ success: true, order });
    } catch (error) {
        console.error('Error updating order status:', error);
        res.status(500).json({ error: 'Error updating order status' });
    }
}; 