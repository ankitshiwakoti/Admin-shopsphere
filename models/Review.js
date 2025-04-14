import mongoose from 'mongoose';

const reviewSchema = new mongoose.Schema({
    product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Customer',
        required: true
    },
    rating: {
        type: Number,
        required: true,
        min: 1,
        max: 5
    },
    title: {
        type: String,
        required: true,
        trim: true
    },
    comment: {
        type: String,
        required: true,
        trim: true
    },
    verifiedPurchase: {
        type: Boolean,
        default: false
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Add index for faster queries
reviewSchema.index({ product: 1, user: 1 }, { unique: true });

// Add method to check if user can review
reviewSchema.statics.canReview = async function(userId, productId) {
    // Check if user has purchased the product
    const Order = mongoose.model('Order');
    const hasPurchased = await Order.exists({
        user: userId,
        'items.product': productId,
        status: 'completed'
    });

    // Check if user has already reviewed
    const hasReviewed = await this.exists({
        user: userId,
        product: productId
    });

    return hasPurchased && !hasReviewed;
};

const Review = mongoose.model('Review', reviewSchema);

export default Review; 