import Order from '../models/Order.js';
import Product from '../models/Product.js';
import Customer from '../models/Customer.js';
import Category from '../models/Category.js';
import mongoose from 'mongoose';

// Render reports page with initial data
export const getReportsPage = async (req, res) => {
    try {
        // Get initial data for all reports
        const [categories, salesData, inventoryData, customerData] = await Promise.all([
            Category.find().select('name'),
            getInitialSalesData(),
            getInitialInventoryData(),
            getInitialCustomerData()
        ]);

        res.render('admin/reports/index', {
            title: 'Reports',
            categories,
            initialData: {
                sales: salesData,
                inventory: inventoryData,
                customers: customerData
            }
        });
    } catch (error) {
        console.error('Error loading reports page:', error);
        req.flash('error_msg', 'Error loading reports page');
        res.redirect('/admin/dashboard');
    }
};

// Helper function to get initial sales data with more detailed analytics
async function getInitialSalesData() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Get sales by time period
    const salesData = await Order.aggregate([
        {
            $match: {
                createdAt: { $gte: today },
                status: { $ne: 'cancelled' }
            }
        },
        {
            $group: {
                _id: {
                    year: { $year: '$createdAt' },
                    month: { $month: '$createdAt' },
                    day: { $dayOfMonth: '$createdAt' },
                    hour: { $hour: '$createdAt' }
                },
                totalSales: { $sum: '$totalAmount' },
                orderCount: { $sum: 1 },
                avgOrderValue: { $avg: '$totalAmount' },
                itemsSold: { $sum: { $size: '$items' } }
            }
        },
        { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1, '_id.hour': 1 } }
    ]);

    // Get sales by product category
    const categorySales = await Order.aggregate([
        {
            $match: {
                createdAt: { $gte: today },
                status: { $ne: 'cancelled' }
            }
        },
        { $unwind: '$items' },
        {
            $lookup: {
                from: 'products',
                localField: 'items.product',
                foreignField: '_id',
                as: 'product'
            }
        },
        { $unwind: '$product' },
        {
            $lookup: {
                from: 'categories',
                localField: 'product.category',
                foreignField: '_id',
                as: 'category'
            }
        },
        { $unwind: '$category' },
        {
            $group: {
                _id: '$category.name',
                totalSales: { $sum: { $multiply: ['$items.quantity', '$items.price'] } },
                quantitySold: { $sum: '$items.quantity' },
                orderCount: { $sum: 1 }
            }
        },
        { $sort: { totalSales: -1 } }
    ]);

    // Get payment method distribution
    const paymentMethods = await Order.aggregate([
        {
            $match: {
                createdAt: { $gte: today },
                status: { $ne: 'cancelled' }
            }
        },
        {
            $group: {
                _id: '$paymentMethod',
                count: { $sum: 1 },
                totalAmount: { $sum: '$totalAmount' }
            }
        }
    ]);

    return {
        salesData,
        categorySales,
        paymentMethods,
        summary: {
            totalRevenue: salesData.reduce((sum, item) => sum + item.totalSales, 0),
            totalOrders: salesData.reduce((sum, item) => sum + item.orderCount, 0),
            averageOrderValue: salesData.reduce((sum, item) => sum + item.avgOrderValue, 0) / salesData.length,
            totalItemsSold: salesData.reduce((sum, item) => sum + item.itemsSold, 0)
        }
    };
}

// Helper function to get initial inventory data with more detailed analysis
async function getInitialInventoryData() {
    try {
        const inventoryData = await Product.aggregate([
            {
                $lookup: {
                    from: 'categories',
                    localField: 'category',
                    foreignField: '_id',
                    as: 'categoryData'
                }
            },
            { $unwind: { path: '$categoryData', preserveNullAndEmptyArrays: true } },
            {
                $lookup: {
                    from: 'orders',
                    let: { productId: '$_id' },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $and: [
                                        { $ne: ['$status', 'cancelled'] },
                                        { $in: ['$$productId', '$items.product'] }
                                    ]
                                }
                            }
                        },
                        { $unwind: '$items' },
                        {
                            $match: {
                                $expr: { $eq: ['$items.product', '$$productId'] }
                            }
                        },
                        {
                            $group: {
                                _id: null,
                                totalSold: { $sum: '$items.quantity' }
                            }
                        }
                    ],
                    as: 'orderStats'
                }
            },
            {
                $addFields: {
                    totalValue: { 
                        $multiply: [
                            { $ifNull: ['$price', 0] }, 
                            { $ifNull: ['$stock', 0] }
                        ]
                    },
                    totalSold: { 
                        $ifNull: [{ $arrayElemAt: ['$orderStats.totalSold', 0] }, 0]
                    }
                }
            },
            {
                $project: {
                    name: 1,
                    stock: { $ifNull: ['$stock', 0] },
                    price: { $ifNull: ['$price', 0] },
                    category: { $ifNull: ['$categoryData.name', 'Uncategorized'] },
                    totalValue: 1,
                    totalSold: 1,
                    status: {
                        $switch: {
                            branches: [
                                { case: { $lte: [{ $ifNull: ['$stock', 0] }, 5] }, then: 'Critical' },
                                { case: { $lte: [{ $ifNull: ['$stock', 0] }, 10] }, then: 'Low' },
                                { case: { $lte: [{ $ifNull: ['$stock', 0] }, 20] }, then: 'Moderate' }
                            ],
                            default: 'Good'
                        }
                    }
                }
            }
        ]);

        // Calculate summary with proper null checks and accurate calculations
        const summary = {
            totalInventoryValue: inventoryData.reduce((sum, item) => {
                const itemValue = (item.price || 0) * (item.stock || 0);
                return sum + itemValue;
            }, 0),
            lowStockCount: inventoryData.filter(item => (item.stock || 0) <= 10).length,
            averageStockLevel: inventoryData.length > 0 ? 
                (inventoryData.reduce((sum, item) => sum + (item.stock || 0), 0) / inventoryData.length) : 0,
            totalProducts: inventoryData.length
        };

        // Get inventory value by category
        const categoryValue = await Product.aggregate([
            {
                $group: {
                    _id: '$category',
                    totalValue: { 
                        $sum: { 
                            $multiply: [
                                { $ifNull: ['$price', 0] }, 
                                { $ifNull: ['$stock', 0] }
                            ] 
                        }
                    },
                    totalItems: { $sum: 1 },
                    lowStockItems: {
                        $sum: {
                            $cond: [{ $lte: ['$stock', 10] }, 1, 0]
                        }
                    }
                }
            },
            {
                $lookup: {
                    from: 'categories',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'category'
                }
            },
            { $unwind: { path: '$category', preserveNullAndEmptyArrays: true } },
            {
                $project: {
                    name: { $ifNull: ['$category.name', 'Uncategorized'] },
                    totalValue: 1,
                    totalItems: 1,
                    lowStockItems: 1
                }
            },
            { $sort: { totalValue: -1 } }
        ]);

        return {
            inventoryData,
            categoryValue,
            summary
        };
    } catch (error) {
        console.error('Error in getInitialInventoryData:', error);
        return {
            inventoryData: [],
            categoryValue: [],
            summary: {
                totalInventoryValue: 0,
                lowStockCount: 0,
                averageStockLevel: 0,
                totalProducts: 0
            }
        };
    }
}

// Helper function to get initial customer data with more detailed insights
async function getInitialCustomerData() {
    const customerData = await Customer.aggregate([
        {
            $lookup: {
                from: 'orders',
                localField: '_id',
                foreignField: 'customer',
                as: 'orders'
            }
        },
        {
            $project: {
                name: 1,
                email: 1,
                totalOrders: { $size: '$orders' },
                totalSpent: { $sum: '$orders.totalAmount' },
                lastPurchase: { $max: '$orders.createdAt' },
                averageOrderValue: {
                    $cond: {
                        if: { $gt: [{ $size: '$orders' }, 0] },
                        then: { $divide: [{ $sum: '$orders.totalAmount' }, { $size: '$orders' }] },
                        else: 0
                    }
                },
                orderFrequency: {
                    $cond: {
                        if: { $gt: [{ $size: '$orders' }, 0] },
                        then: {
                            $divide: [
                                { $subtract: [new Date(), { $min: '$orders.createdAt' }] },
                                { $size: '$orders' }
                            ]
                        },
                        else: 0
                    }
                }
            }
        },
        { $sort: { totalSpent: -1 } }
    ]);

    // Get customer segments
    const segments = {
        highValue: customerData.filter(c => c.totalSpent > 1000).length,
        mediumValue: customerData.filter(c => c.totalSpent > 500 && c.totalSpent <= 1000).length,
        lowValue: customerData.filter(c => c.totalSpent <= 500).length
    };

    // Get customer acquisition over time
    const acquisitionData = await Customer.aggregate([
        {
            $group: {
                _id: {
                    year: { $year: '$createdAt' },
                    month: { $month: '$createdAt' }
                },
                count: { $sum: 1 }
            }
        },
        { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    return {
        customerData,
        segments,
        acquisitionData,
        summary: {
            totalCustomers: customerData.length,
            averageSpent: customerData.reduce((sum, c) => sum + c.totalSpent, 0) / customerData.length,
            averageOrderFrequency: customerData.reduce((sum, c) => sum + c.orderFrequency, 0) / customerData.length
        }
    };
}

// Get quick stats for the dashboard
export const getQuickStats = async (req, res) => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        const thisMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);

        // Get today's revenue and orders
        const todayStats = await Order.aggregate([
            {
                $match: {
                    createdAt: { $gte: today },
                    status: { $ne: 'cancelled' }
                }
            },
            {
                $group: {
                    _id: null,
                    revenue: { $sum: '$totalAmount' },
                    orders: { $sum: 1 }
                }
            }
        ]);

        // Get yesterday's revenue and orders
        const yesterdayStats = await Order.aggregate([
            {
                $match: {
                    createdAt: { $gte: yesterday, $lt: today },
                    status: { $ne: 'cancelled' }
                }
            },
            {
                $group: {
                    _id: null,
                    revenue: { $sum: '$totalAmount' },
                    orders: { $sum: 1 }
                }
            }
        ]);

        // Get this month's customers
        const thisMonthCustomers = await Customer.countDocuments({
            createdAt: { $gte: thisMonth }
        });

        // Get last month's customers
        const lastMonthCustomers = await Customer.countDocuments({
            createdAt: { $gte: lastMonth, $lt: thisMonth }
        });

        // Get low stock items
        const lowStockCount = await Product.countDocuments({
            stock: { $lte: 10 }
        });

        // Calculate changes
        const todayRevenue = todayStats[0]?.revenue || 0;
        const yesterdayRevenue = yesterdayStats[0]?.revenue || 0;
        const revenueChange = yesterdayRevenue ? 
            ((todayRevenue - yesterdayRevenue) / yesterdayRevenue * 100).toFixed(1) : 0;

        const todayOrders = todayStats[0]?.orders || 0;
        const yesterdayOrders = yesterdayStats[0]?.orders || 0;
        const ordersChange = yesterdayOrders ? 
            ((todayOrders - yesterdayOrders) / yesterdayOrders * 100).toFixed(1) : 0;

        const customerChange = lastMonthCustomers ? 
            ((thisMonthCustomers - lastMonthCustomers) / lastMonthCustomers * 100).toFixed(1) : 0;

        res.json({
            success: true,
            data: {
                todayRevenue,
                todayOrders,
                lowStockCount,
                activeCustomers: thisMonthCustomers,
                revenueChange,
                ordersChange,
                customerChange
            }
        });
    } catch (error) {
        console.error('Error getting quick stats:', error);
        res.status(500).json({
            success: false,
            message: 'Error getting quick stats'
        });
    }
};

// Generate sales report
export const generateSalesReport = async (req, res) => {
    try {
        const { dateRange, startDate, endDate, groupBy } = req.body;
        
        let matchQuery = { status: { $ne: 'cancelled' } };
        let groupQuery = {};

        // Set date range
        const now = new Date();
        switch (dateRange) {
            case 'today':
                const today = new Date(now);
                today.setHours(0, 0, 0, 0);
                matchQuery.createdAt = { $gte: today };
                break;
            case 'week':
                const weekAgo = new Date(now);
                weekAgo.setDate(weekAgo.getDate() - 7);
                matchQuery.createdAt = { $gte: weekAgo };
                break;
            case 'month':
                const monthAgo = new Date(now);
                monthAgo.setMonth(monthAgo.getMonth() - 1);
                matchQuery.createdAt = { $gte: monthAgo };
                break;
            case 'year':
                const yearAgo = new Date(now);
                yearAgo.setFullYear(yearAgo.getFullYear() - 1);
                matchQuery.createdAt = { $gte: yearAgo };
                break;
            case 'custom':
                if (startDate && endDate) {
                    matchQuery.createdAt = {
                        $gte: new Date(startDate),
                        $lte: new Date(endDate)
                    };
                }
                break;
        }

        // Set grouping
        switch (groupBy) {
            case 'day':
                groupQuery = {
                    year: { $year: '$createdAt' },
                    month: { $month: '$createdAt' },
                    day: { $dayOfMonth: '$createdAt' }
                };
                break;
            case 'week':
                groupQuery = {
                    year: { $year: '$createdAt' },
                    week: { $week: '$createdAt' }
                };
                break;
            case 'month':
                groupQuery = {
                    year: { $year: '$createdAt' },
                    month: { $month: '$createdAt' }
                };
                break;
        }

        // Get sales data with proper aggregation
        const salesData = await Order.aggregate([
            { $match: matchQuery },
            {
                $group: {
                    _id: groupQuery,
                    totalSales: { $sum: '$total' },
                    orderCount: { $sum: 1 },
                    avgOrderValue: { $avg: '$total' },
                    itemsSold: { $sum: { $size: '$items' } }
                }
            },
            { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
        ]);

        // Get sales by category with proper lookup
        const categorySales = await Order.aggregate([
            { $match: matchQuery },
            { $unwind: '$items' },
            {
                $lookup: {
                    from: 'products',
                    localField: 'items.product',
                    foreignField: '_id',
                    as: 'product'
                }
            },
            { $unwind: '$product' },
            {
                $lookup: {
                    from: 'categories',
                    localField: 'product.category',
                    foreignField: '_id',
                    as: 'category'
                }
            },
            { $unwind: '$category' },
            {
                $group: {
                    _id: '$category.name',
                    totalSales: { $sum: { $multiply: ['$items.quantity', '$items.price'] } },
                    itemCount: { $sum: '$items.quantity' }
                }
            },
            { $sort: { totalSales: -1 } }
        ]);

        // Get payment methods distribution
        const paymentMethods = await Order.aggregate([
            { $match: matchQuery },
            {
                $group: {
                    _id: '$paymentMethod',
                    count: { $sum: 1 },
                    totalAmount: { $sum: '$total' }
                }
            },
            { $sort: { count: -1 } }
        ]);

        // Calculate summary with proper error handling
        const summary = {
            totalRevenue: salesData.reduce((sum, item) => sum + (item.totalSales || 0), 0),
            totalOrders: salesData.reduce((sum, item) => sum + (item.orderCount || 0), 0),
            averageOrderValue: salesData.length > 0 ? 
                salesData.reduce((sum, item) => sum + (item.avgOrderValue || 0), 0) / salesData.length : 0,
            totalItemsSold: salesData.reduce((sum, item) => sum + (item.itemsSold || 0), 0)
        };

        res.json({
            success: true,
            data: {
                salesData,
                categorySales,
                paymentMethods,
                summary
            }
        });
    } catch (error) {
        console.error('Error generating sales report:', error);
        res.status(500).json({
            success: false,
            message: 'Error generating sales report: ' + error.message
        });
    }
};

// Generate inventory report
export const generateInventoryReport = async (req, res) => {
    try {
        const { reportType, category, sortBy } = req.body;
        
        let matchQuery = {};
        let sortQuery = { stock: 1 }; // Default sort

        // Set category filter
        if (category && category !== 'all') {
            try {
                matchQuery.category = new mongoose.Types.ObjectId(category);
            } catch (error) {
                console.error('Invalid category ID:', error);
            }
        }

        // Set report type filter
        switch (reportType) {
            case 'low':
                matchQuery.stock = { $lte: 10 };
                break;
            case 'movement':
                sortQuery = { totalSold: -1 };
                break;
            case 'turnover':
                matchQuery.stock = { $gt: 0 };
                sortQuery = { turnoverRate: -1 };
                break;
        }

        // Set sort order
        switch (sortBy) {
            case 'stock':
                sortQuery = { stock: 1 };
                break;
            case 'value':
                sortQuery = { totalValue: -1 };
                break;
            case 'turnover':
                sortQuery = { turnoverRate: -1 };
                break;
        }

        // Get all products with their sales data
        const inventoryData = await Product.aggregate([
            { $match: matchQuery },
            {
                $lookup: {
                    from: 'categories',
                    localField: 'category',
                    foreignField: '_id',
                    as: 'categoryData'
                }
            },
            { $unwind: { path: '$categoryData', preserveNullAndEmptyArrays: true } },
            {
                $lookup: {
                    from: 'orders',
                    let: { productId: '$_id' },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $and: [
                                        { $ne: ['$status', 'cancelled'] },
                                        { $in: ['$$productId', '$items.product'] }
                                    ]
                                }
                            }
                        },
                        { $unwind: '$items' },
                        {
                            $match: {
                                $expr: { $eq: ['$items.product', '$$productId'] }
                            }
                        },
                        {
                            $group: {
                                _id: null,
                                totalSold: { $sum: '$items.quantity' }
                            }
                        }
                    ],
                    as: 'orderStats'
                }
            },
            {
                $addFields: {
                    totalValue: { 
                        $multiply: [
                            { $ifNull: ['$price', 0] }, 
                            { $ifNull: ['$stock', 0] }
                        ]
                    },
                    totalSold: { 
                        $ifNull: [{ $arrayElemAt: ['$orderStats.totalSold', 0] }, 0]
                    },
                    turnoverRate: {
                        $cond: {
                            if: { $gt: [{ $ifNull: ['$stock', 0] }, 0] },
                            then: {
                                $divide: [
                                    { $ifNull: [{ $arrayElemAt: ['$orderStats.totalSold', 0] }, 0] },
                                    { $add: [{ $ifNull: ['$stock', 1] }, 0.001] } // Avoid division by zero
                                ]
                            },
                            else: 0
                        }
                    }
                }
            },
            {
                $project: {
                    name: 1,
                    stock: { $ifNull: ['$stock', 0] },
                    price: { $ifNull: ['$price', 0] },
                    category: { $ifNull: ['$categoryData.name', 'Uncategorized'] },
                    totalValue: 1,
                    totalSold: 1,
                    turnoverRate: 1,
                    status: {
                        $switch: {
                            branches: [
                                { case: { $lte: [{ $ifNull: ['$stock', 0] }, 5] }, then: 'Critical' },
                                { case: { $lte: [{ $ifNull: ['$stock', 0] }, 10] }, then: 'Low' },
                                { case: { $lte: [{ $ifNull: ['$stock', 0] }, 20] }, then: 'Moderate' }
                            ],
                            default: 'Good'
                        }
                    }
                }
            },
            { $sort: sortQuery }
        ]);

        // Calculate accurate summary statistics
        const summary = {
            totalInventoryValue: inventoryData.reduce((sum, item) => {
                const itemValue = (item.price || 0) * (item.stock || 0);
                return sum + itemValue;
            }, 0),
            lowStockCount: inventoryData.filter(item => (item.stock || 0) <= 10).length,
            averageStockLevel: inventoryData.length > 0 ? 
                (inventoryData.reduce((sum, item) => sum + (item.stock || 0), 0) / inventoryData.length) : 0,
            totalProducts: inventoryData.length
        };

        res.json({
            success: true,
            data: {
                inventoryData,
                summary
            }
        });
    } catch (error) {
        console.error('Error generating inventory report:', error);
        res.status(500).json({
            success: false,
            message: 'Error generating inventory report: ' + error.message
        });
    }
};

// Generate customer report
export const generateCustomerReport = async (req, res) => {
    try {
        const { reportType, timePeriod, segmentBy } = req.body;
        
        let matchQuery = {};
        let sortQuery = {};

        // Set time period filter
        if (timePeriod) {
            const daysAgo = new Date();
            daysAgo.setDate(daysAgo.getDate() - parseInt(timePeriod));
            matchQuery.createdAt = { $gte: daysAgo };
        }

        const customerData = await Customer.aggregate([
            { $match: matchQuery },
            {
                $lookup: {
                    from: 'orders',
                    let: { customerId: '$_id' },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $and: [
                                        { $eq: ['$user', '$$customerId'] },
                                        { $ne: ['$status', 'cancelled'] }
                                    ]
                                }
                            }
                        }
                    ],
                    as: 'orders'
                }
            },
            {
                $addFields: {
                    totalOrders: { $size: '$orders' },
                    totalSpent: { $sum: '$orders.total' },
                    lastPurchase: { $max: '$orders.createdAt' },
                    averageOrderValue: {
                        $cond: {
                            if: { $gt: [{ $size: '$orders' }, 0] },
                            then: { $divide: [{ $sum: '$orders.total' }, { $size: '$orders' }] },
                            else: 0
                        }
                    },
                    segment: {
                        $switch: {
                            branches: [
                                { case: { $gte: [{ $sum: '$orders.total' }, 1000] }, then: 'High Value' },
                                { case: { $gte: [{ $sum: '$orders.total' }, 500] }, then: 'Medium Value' }
                            ],
                            default: 'Low Value'
                        }
                    }
                }
            },
            {
                $project: {
                    name: 1,
                    email: 1,
                    totalOrders: 1,
                    totalSpent: 1,
                    averageOrderValue: 1,
                    lastPurchase: 1,
                    segment: 1,
                    daysSinceLastPurchase: {
                        $round: [
                            {
                                $divide: [
                                    { $subtract: [new Date(), '$lastPurchase'] },
                                    1000 * 60 * 60 * 24
                                ]
                            },
                            1
                        ]
                    }
                }
            }
        ]);

        // Set sort based on segment criteria
        switch (segmentBy) {
            case 'spending':
                customerData.sort((a, b) => b.totalSpent - a.totalSpent);
                break;
            case 'frequency':
                customerData.sort((a, b) => b.totalOrders - a.totalOrders);
                break;
            case 'recency':
                customerData.sort((a, b) => a.daysSinceLastPurchase - b.daysSinceLastPurchase);
                break;
        }

        // Calculate summary statistics
        const summary = {
            totalCustomers: customerData.length,
            averageSpent: customerData.reduce((sum, c) => sum + c.totalSpent, 0) / customerData.length || 0,
            averageOrderValue: customerData.reduce((sum, c) => sum + c.averageOrderValue, 0) / customerData.length || 0,
            segments: {
                highValue: customerData.filter(c => c.segment === 'High Value').length,
                mediumValue: customerData.filter(c => c.segment === 'Medium Value').length,
                lowValue: customerData.filter(c => c.segment === 'Low Value').length
            }
        };

        res.json({
            success: true,
            data: {
                customerData,
                summary
            }
        });
    } catch (error) {
        console.error('Error generating customer report:', error);
        res.status(500).json({
            success: false,
            message: 'Error generating customer report: ' + error.message
        });
    }
}; 