import mongoose from 'mongoose';

const roleSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    description: {
        type: String,
        trim: true
    },
    permissions: [{
        type: String,
        enum: [
            'manage_products',
            'manage_categories',
            'manage_orders',
            'manage_customers',
            'view_dashboard',
            'manage_admins'
        ]
    }],
    assignedAdmins: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Admin'
    }],
    createdAt: {
        type: Date,
        default: Date.now
    }
});

export default mongoose.model('Role', roleSchema); 