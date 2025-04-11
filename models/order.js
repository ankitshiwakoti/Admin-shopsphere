import mongoose from 'mongoose';
import Product from './Product.js';

const orderSchema = new mongoose.Schema({
    orderNumber: {
        type: String,
        required: true,
        unique: true
    },
    customer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Customer',
        required: true
    },
    products: [{
        product: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Product',
            required: true
        },
        quantity: {
            type: Number,
            required: true,
            min: 1
        },
        price: {
            type: Number,
            required: true
        },
        total: {
            type: Number,
            required: true
        }
    }],
    status: {
        type: String,
        enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled'],
        default: 'pending'
    },
    shippingAddress: {
        street: String,
        city: String,
        state: String,
        zipCode: String,
        country: String
    },
    billingAddress: {
        street: String,
        city: String,
        state: String,
        zipCode: String,
        country: String
    },
    paymentMethod: {
        type: String,
        required: true
    },
    paymentStatus: {
        type: String,
        enum: ['pending', 'paid', 'failed', 'refunded'],
        default: 'pending'
    },
    subtotal: {
        type: Number,
        required: true
    },
    tax: {
        type: Number,
        required: true,
        default: 0
    },
    shippingCost: {
        type: Number,
        required: true,
        default: 0
    },
    discount: {
        type: Number,
        default: 0
    },
    totalAmount: {
        type: Number,
        required: true
    },
    notes: String,
    trackingNumber: String,
    estimatedDeliveryDate: Date,
    actualDeliveryDate: Date,
    cancelReason: String,
    refundAmount: {
        type: Number,
        default: 0
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Admin'
    },
    updatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Admin'
    }
}, {
    timestamps: true
});

// Calculate totals before saving
orderSchema.pre('save', function(next) {
    // Calculate product totals
    this.products.forEach(item => {
        item.total = item.quantity * item.price;
    });

    // Calculate subtotal
    this.subtotal = this.products.reduce((sum, item) => sum + item.total, 0);

    // Calculate total amount
    this.totalAmount = this.subtotal + this.tax + this.shippingCost - this.discount;

    next();
});

// Indexes for better query performance
orderSchema.index({ orderNumber: 1 });
orderSchema.index({ customer: 1 });
orderSchema.index({ status: 1 });
orderSchema.index({ createdAt: -1 });
orderSchema.index({ paymentStatus: 1 });

// Update product stock when order is created
orderSchema.post('save', async function(doc) {
    try {
        for (const item of doc.products) {
            await Product.findByIdAndUpdate(
                item.product,
                { $inc: { stock: -item.quantity } }
            );
        }
    } catch (error) {
        console.error('Error updating product stock:', error);
    }
});

// Generate order number before saving
orderSchema.pre('save', async function(next) {
    if (!this.orderNumber) {
        try {
            const count = await mongoose.connection.db.collection('orders').countDocuments();
            this.orderNumber = `ORD${new Date().getFullYear()}${String(count + 1).padStart(6, '0')}`;
        } catch (error) {
            console.error('Error generating order number:', error);
        }
    }
    next();
});

// Export the model using a different approach
export default mongoose.models.Order || mongoose.model('Order', orderSchema); 