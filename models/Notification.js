import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    message: {
        type: String,
        required: true,
        trim: true
    },
    type: {
        type: String,
        enum: ['info', 'success', 'warning', 'danger'],
        default: 'info'
    },
    link: {
        type: String,
        trim: true
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Admin',
        required: true
    },
    recipients: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Admin'
    }],
    readBy: [{
        admin: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Admin'
        },
        readAt: {
            type: Date,
            default: Date.now
        }
    }],
    relatedTo: {
        model: {
            type: String,
            enum: ['Admin', 'Product', 'Category', 'Order', 'Customer']
        },
        id: {
            type: mongoose.Schema.Types.ObjectId
        }
    }
}, {
    timestamps: true
});

// Create indexes for faster queries
notificationSchema.index({ recipients: 1, createdAt: -1 });
notificationSchema.index({ 'readBy.admin': 1 });

const Notification = mongoose.model('Notification', notificationSchema);

export default Notification; 