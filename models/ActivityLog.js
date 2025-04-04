import mongoose from 'mongoose';

const activityLogSchema = new mongoose.Schema({
    admin: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Admin',
        required: true
    },
    action: {
        type: String,
        required: true,
        enum: ['create', 'update', 'delete', 'login', 'logout']
    },
    entityType: {
        type: String,
        required: true,
        enum: ['product', 'category', 'order', 'customer', 'admin', 'role']
    },
    entityId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true
    },
    details: {
        type: String,
        required: true
    },
    ipAddress: String,
    userAgent: String
}, {
    timestamps: true
});

// Index for better query performance
activityLogSchema.index({ admin: 1, createdAt: -1 });
activityLogSchema.index({ entityType: 1, entityId: 1 });

export default mongoose.model('ActivityLog', activityLogSchema); 