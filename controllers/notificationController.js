import Notification from '../models/Notification.js';
import Admin from '../models/Admin.js';

// Create a new notification
export const createNotification = async (req, res) => {
    try {
        const { title, message, type, link, recipients, relatedTo } = req.body;
        
        // Validate required fields
        if (!title || !message) {
            return res.status(400).json({ success: false, message: 'Title and message are required' });
        }
        
        // Create notification
        const notification = new Notification({
            title,
            message,
            type: type || 'info',
            link,
            createdBy: req.admin._id,
            recipients: recipients || [], // If no recipients specified, empty array
            relatedTo
        });
        
        await notification.save();
        
        return res.status(201).json({ 
            success: true, 
            message: 'Notification created successfully',
            notification
        });
    } catch (error) {
        console.error('Error creating notification:', error);
        return res.status(500).json({ success: false, message: 'Error creating notification' });
    }
};

// Get all notifications for the current admin
export const getNotifications = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = 10;
        const skip = (page - 1) * limit;

        // Get total count for pagination
        const totalCount = await Notification.countDocuments({
            $or: [
                { recipients: req.admin._id },
                { createdBy: req.admin._id }
            ]
        });

        const totalPages = Math.ceil(totalCount / limit);

        // Get notifications with pagination
        const notifications = await Notification.find({
            $or: [
                { recipients: req.admin._id },
                { createdBy: req.admin._id }
            ]
        })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('createdBy', 'username email')
        .populate('readBy.admin', 'username email')
        .lean();

        // If this is an API request, return JSON
        if (req.xhr || req.headers.accept.indexOf('json') > -1) {
            return res.json({
                success: true,
                notifications,
                pagination: {
                    currentPage: page,
                    totalPages,
                    totalCount
                }
            });
        }

        // For regular requests, render the page
        res.render('admin/notifications', {
            notifications,
            currentPage: page,
            totalPages,
            totalCount
        });
    } catch (error) {
        console.error('Error getting notifications:', error);
        res.status(500).json({
            success: false,
            message: 'Error getting notifications'
        });
    }
};

// Mark a notification as read
export const markAsRead = async (req, res) => {
    try {
        const notification = await Notification.findById(req.params.id);

        if (!notification) {
            return res.status(404).json({
                success: false,
                message: 'Notification not found'
            });
        }

        // Check if already marked as read by this admin
        const alreadyRead = notification.readBy.some(
            read => read.admin.toString() === req.admin._id.toString()
        );

        if (!alreadyRead) {
            notification.readBy.push({
                admin: req.admin._id,
                readAt: new Date()
            });
            await notification.save();
        }

        res.json({
            success: true,
            notification
        });
    } catch (error) {
        console.error('Error marking notification as read:', error);
        res.status(500).json({
            success: false,
            message: 'Error marking notification as read'
        });
    }
};

// Mark all notifications as read
export const markAllAsRead = async (req, res) => {
    try {
        const notifications = await Notification.find({
            $or: [
                { recipients: req.admin._id },
                { createdBy: req.admin._id }
            ],
            'readBy.admin': { $ne: req.admin._id }
        });

        for (const notification of notifications) {
            notification.readBy.push({
                admin: req.admin._id,
                readAt: new Date()
            });
            await notification.save();
        }

        res.json({
            success: true,
            message: 'All notifications marked as read'
        });
    } catch (error) {
        console.error('Error marking all notifications as read:', error);
        res.status(500).json({
            success: false,
            message: 'Error marking all notifications as read'
        });
    }
};

// Delete a notification
export const deleteNotification = async (req, res) => {
    try {
        const notification = await Notification.findById(req.params.id);

        if (!notification) {
            return res.status(404).json({
                success: false,
                message: 'Notification not found'
            });
        }

        // Only allow deletion if user is the creator or a recipient
        if (
            notification.createdBy.toString() !== req.admin._id.toString() &&
            !notification.recipients.includes(req.admin._id)
        ) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to delete this notification'
            });
        }

        await notification.remove();

        res.json({
            success: true,
            message: 'Notification deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting notification:', error);
        res.status(500).json({
            success: false,
            message: 'Error deleting notification'
        });
    }
};

// Helper function to notify admins
export const notifyAdmins = async (title, message, type = 'info', link = null, createdBy = null, recipients = [], relatedTo = null) => {
    try {
        // Find all admins with relevant permissions based on relatedTo
        let adminsToNotify = [];
        
        if (relatedTo) {
            // Get admins based on their permissions
            const admins = await Admin.find({}).populate('roles');
            
            adminsToNotify = admins.filter(admin => {
                // Superadmin gets all notifications
                if (admin.role === 'superadmin') return true;
                
                // Check if admin has relevant permissions based on relatedTo
                if (admin.roles && admin.roles.length > 0) {
                    return admin.roles.some(role => {
                        switch(relatedTo) {
                            case 'product':
                                return role.permissions.includes('manage_products') || 
                                       role.permissions.includes('view_products');
                            case 'category':
                                return role.permissions.includes('manage_categories') || 
                                       role.permissions.includes('view_categories');
                            case 'order':
                                return role.permissions.includes('manage_orders') || 
                                       role.permissions.includes('view_orders');
                            case 'customer':
                                return role.permissions.includes('manage_customers') || 
                                       role.permissions.includes('view_customers');
                            case 'admin':
                                return role.permissions.includes('manage_admins') || 
                                       role.permissions.includes('view_admins');
                            default:
                                return false;
                        }
                    });
                }
                return false;
            });
        } else {
            // If no specific relatedTo, include superadmins and specified recipients
            adminsToNotify = await Admin.find({
                $or: [
                    { role: 'superadmin' },
                    { _id: { $in: recipients } }
                ]
            });
        }
        
        // Get unique admin IDs
        const recipientIds = [...new Set([
            ...adminsToNotify.map(admin => admin._id),
            ...recipients
        ])];
        
        // Create notification
        const notification = new Notification({
            title,
            message,
            type,
            link,
            createdBy: createdBy,
            recipients: recipientIds,
            relatedTo
        });
        
        await notification.save();
        
        return {
            success: true,
            notification
        };
    } catch (error) {
        console.error('Error in notifyAdmins:', error);
        return {
            success: false,
            error: error.message
        };
    }
}; 