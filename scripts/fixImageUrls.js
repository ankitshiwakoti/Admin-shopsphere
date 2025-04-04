import mongoose from 'mongoose';
import Product from '../models/Product.js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('MongoDB connected...'))
    .catch(err => console.error('MongoDB connection error:', err));

const fixImageUrls = async () => {
    try {
        const products = await Product.find();
        let updatedCount = 0;

        for (const product of products) {
            let needsUpdate = false;
            
            if (product.images && product.images.length > 0) {
                product.images = product.images.map(image => {
                    if (image && image.url && (
                        image.url.includes('\\') || 
                        image.url.includes(':\\') || 
                        image.url.startsWith('file://')
                    )) {
                        // Extract just the filename from the path
                        const filename = path.basename(image.url);
                        needsUpdate = true;
                        return {
                            ...image.toObject(),
                            url: '/uploads/' + filename
                        };
                    }
                    return image;
                });

                if (needsUpdate) {
                    await product.save();
                    updatedCount++;
                    console.log(`Fixed image URLs for product: ${product.name}`);
                }
            }
        }

        console.log(`Fixed image URLs for ${updatedCount} products`);
        process.exit(0);
    } catch (error) {
        console.error('Error fixing image URLs:', error);
        process.exit(1);
    }
};

fixImageUrls(); 