import Product from '../models/Product.js';
import Category from '../models/Category.js';
import Order from '../models/Order.js';
import Customer from '../models/Customer.js';

export const getDashboardStats = async (req, res) => {
    try {
        // Get date ranges
        const today = new Date();
        const startOfToday = new Date(today.setHours(0, 0, 0, 0));
        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        const startOfYear = new Date(today.getFullYear(), 0, 1);

        // Get counts
        const totalProducts = await Product.countDocuments();
        const totalCategories = await Category.countDocuments();
        const totalCustomers = await Customer.countDocuments();
        const totalOrders = await Order.countDocuments();

        // Get recent orders
        const recentOrders = await Order.find()
            .sort({ createdAt: -1 })
            .limit(5)
            .populate('customer', 'name email')
            .populate('products.product', 'name price');

        // Get low stock products (less than 10 items)
        const lowStockProducts = await Product.find({ stock: { $lt: 10 } })
            .select('name stock price')
            .limit(5);

        // Get top selling products
        const topSellingProducts = await Order.aggregate([
            { $unwind: '$products' },
            {
                $group: {
                    _id: '$products.product',
                    totalSold: { $sum: '$products.quantity' }
                }
            },
            { $sort: { totalSold: -1 } },
            { $limit: 5 }
        ]);

        // Populate top selling products with product details
        await Product.populate(topSellingProducts, { path: '_id', select: 'name price' });

        // Get monthly revenue data for chart
        const monthlyRevenue = await Order.aggregate([
            {
                $match: {
                    createdAt: { $gte: startOfYear }
                }
            },
            {
                $group: {
                    _id: { $month: '$createdAt' },
                    total: { $sum: '$totalAmount' }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        // Get daily orders count for the current month
        const dailyOrders = await Order.aggregate([
            {
                $match: {
                    createdAt: { $gte: startOfMonth }
                }
            },
            {
                $group: {
                    _id: { $dayOfMonth: '$createdAt' },
                    count: { $sum: 1 },
                    revenue: { $sum: '$totalAmount' }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        // Calculate revenue statistics
        const todayRevenue = await Order.aggregate([
            {
                $match: {
                    createdAt: { $gte: startOfToday }
                }
            },
            {
                $group: {
                    _id: null,
                    total: { $sum: '$totalAmount' }
                }
            }
        ]);

        const monthlyRevenueTotal = await Order.aggregate([
            {
                $match: {
                    createdAt: { $gte: startOfMonth }
                }
            },
            {
                $group: {
                    _id: null,
                    total: { $sum: '$totalAmount' }
                }
            }
        ]);

        // Get order status distribution
        const orderStatusDistribution = await Order.aggregate([
            {
                $group: {
                    _id: '$status',
                    count: { $sum: 1 }
                }
            }
        ]);

        // Prepare dashboard data
        const dashboardData = {
            counts: {
                products: totalProducts,
                categories: totalCategories,
                customers: totalCustomers,
                orders: totalOrders
            },
            recentOrders,
            lowStockProducts,
            topSellingProducts,
            revenue: {
                today: todayRevenue[0]?.total || 0,
                monthly: monthlyRevenueTotal[0]?.total || 0
            },
            charts: {
                monthlyRevenue,
                dailyOrders,
                orderStatus: orderStatusDistribution
            }
        };

        res.render('admin/dashboard', {
            title: 'Admin Dashboard',
            data: dashboardData
        });
    } catch (error) {
        console.error('Error getting dashboard stats:', error);
        req.flash('error_msg', 'Error loading dashboard data');
        res.render('admin/dashboard', {
            title: 'Admin Dashboard',
            data: null
        });
    }
}; 