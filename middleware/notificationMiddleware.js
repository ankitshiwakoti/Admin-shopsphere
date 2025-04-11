import Notification from '../models/Notification.js';
import Admin from '../models/Admin.js';

export const loadNotifications = async (req, res, next) => {
    try {
        // Only load notifications if user is authenticated
        if (req.session.isAdmin && req.session.adminId) {
            // Add admin info to res.locals
            res.locals.admin = req.session.admin;
            
            // Get unread count
            const unreadCount = await Notification.countDocuments({
                $or: [
                    { recipients: req.session.adminId },
                    { createdBy: req.session.adminId }
                ],
                'readBy.admin': { $ne: req.session.adminId }
            });

            // Get all notifications (removed the limit)
            const notifications = await Notification.find({
                $or: [
                    { recipients: req.session.adminId },
                    { createdBy: req.session.adminId }
                ]
            })
            .sort({ createdAt: -1 })
            .populate('createdBy', 'username email')
            .populate('readBy.admin', 'username email')
            .lean();

            // Process notifications to ensure readBy is properly structured
            const processedNotifications = notifications.map(notification => {
                // Ensure readBy is an array
                if (!notification.readBy) {
                    notification.readBy = [];
                }
                
                // Ensure each readBy entry has an admin property
                notification.readBy = notification.readBy.map(read => {
                    if (!read.admin) {
                        read.admin = { _id: null };
                    }
                    return read;
                });
                
                return notification;
            });

            // Get total count
            const total = await Notification.countDocuments({
                $or: [
                    { recipients: req.session.adminId },
                    { createdBy: req.session.adminId }
                ]
            });

            // Add notifications to res.locals
            res.locals.notifications = {
                notifications: processedNotifications,
                unreadCount,
                total
            };
        } else {
            // Set empty notifications and admin for non-authenticated users
            res.locals.notifications = {
                notifications: [],
                unreadCount: 0,
                total: 0
            };
            res.locals.admin = null;
        }
        next();
    } catch (error) {
        console.error('Error loading notifications:', error);
        // Set empty notifications to prevent errors
        res.locals.notifications = {
            notifications: [],
            unreadCount: 0,
            total: 0
        };
        res.locals.admin = null;
        next();
    }
}; 