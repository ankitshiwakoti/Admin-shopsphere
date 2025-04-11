import Product from '../models/Product.js';
import Category from '../models/Category.js';

// Get activity logs for an admin by combining data from all relevant models
export const getActivityLogs = async (adminId) => {
    try {
        // Fetch products created or updated by the admin
        const products = await Product.find({
            $or: [
                { createdBy: adminId },
                { updatedBy: adminId }
            ]
        }).select('name createdBy updatedBy createdAt updatedAt');

        // Fetch categories created or updated by the admin
        const categories = await Category.find({
            $or: [
                { createdBy: adminId },
                { updatedBy: adminId }
            ]
        }).select('name createdBy updatedBy createdAt updatedAt');

        // Combine and format activities
        let activities = [];

        // Add product activities
        products.forEach(product => {
            if (product.createdBy?.toString() === adminId.toString()) {
                activities.push({
                    action: 'create',
                    entityType: 'product',
                    entityId: product._id,
                    details: `Created product: ${product.name}`,
                    createdAt: product.createdAt
                });
            }
            if (product.updatedBy?.toString() === adminId.toString() && 
                product.updatedAt > product.createdAt) {
                activities.push({
                    action: 'update',
                    entityType: 'product',
                    entityId: product._id,
                    details: `Updated product: ${product.name}`,
                    createdAt: product.updatedAt
                });
            }
        });

        // Add category activities
        categories.forEach(category => {
            if (category.createdBy?.toString() === adminId.toString()) {
                activities.push({
                    action: 'create',
                    entityType: 'category',
                    entityId: category._id,
                    details: `Created category: ${category.name}`,
                    createdAt: category.createdAt
                });
            }
            if (category.updatedBy?.toString() === adminId.toString() && 
                category.updatedAt > category.createdAt) {
                activities.push({
                    action: 'update',
                    entityType: 'category',
                    entityId: category._id,
                    details: `Updated category: ${category.name}`,
                    createdAt: category.updatedAt
                });
            }
        });

        // Sort activities by date (most recent first)
        activities.sort((a, b) => b.createdAt - a.createdAt);

        return activities;
    } catch (error) {
        console.error('Error getting activity logs:', error);
        return [];
    }
};

// Update profile controller to include activity logs
export const getProfile = async (req, res) => {
    try {
        const adminId = req.session.adminId;
        const activityLogs = await getActivityLogs(adminId);

        res.render('admin/profile', {
            title: 'My Profile',
            path: '/admin/profile',
            admin: req.session.admin,
            activityLogs
        });
    } catch (error) {
        console.error('Error getting profile:', error);
        req.flash('error_msg', 'Error loading profile');
        res.redirect('/admin/dashboard');
    }
}; 