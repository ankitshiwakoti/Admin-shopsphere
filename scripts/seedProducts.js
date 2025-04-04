import mongoose from 'mongoose';
import Product from '../models/product.js';
import Category from '../models/Category.js';
import dotenv from 'dotenv';
import connectDB from '../config/database.js';

// Connect to database
connectDB();

const seedProducts = async () => {
    try {
        // Get or create a default category
        let category = await Category.findOne({ name: 'Electronics' });
        if (!category) {
            category = await Category.create({ name: 'Electronics', description: 'Electronic devices and accessories' });
        }

        // Clear existing products
        await Product.deleteMany({});
        console.log('Cleared existing products');

        const dummyProducts = [
            {
                name: 'Smartphone X',
                description: 'Latest smartphone with advanced features',
                price: 999.99,
                stock: 50,
                category: category._id,
                status: 'active',
                specifications: [
                    { key: 'Screen Size', value: '6.5 inches' },
                    { key: 'RAM', value: '8GB' },
                    { key: 'Storage', value: '128GB' }
                ],
                attributes: {
                    colors: ['Black', 'White', 'Blue'],
                    sizes: ['Standard']
                }
            },
            {
                name: 'Laptop Pro',
                description: 'High-performance laptop for professionals',
                price: 1499.99,
                stock: 30,
                category: category._id,
                status: 'active',
                specifications: [
                    { key: 'Processor', value: 'Intel Core i7' },
                    { key: 'RAM', value: '16GB' },
                    { key: 'Storage', value: '512GB SSD' }
                ],
                attributes: {
                    colors: ['Silver', 'Space Gray'],
                    sizes: ['13-inch', '15-inch']
                }
            },
            {
                name: 'Wireless Earbuds',
                description: 'Premium wireless earbuds with noise cancellation',
                price: 199.99,
                stock: 100,
                category: category._id,
                status: 'active',
                specifications: [
                    { key: 'Battery Life', value: '8 hours' },
                    { key: 'Charging Case', value: 'Yes' },
                    { key: 'Water Resistance', value: 'IPX4' }
                ],
                attributes: {
                    colors: ['Black', 'White'],
                    sizes: ['One Size']
                }
            },
            {
                name: 'Smart Watch',
                description: 'Feature-rich smartwatch with health tracking',
                price: 299.99,
                stock: 75,
                category: category._id,
                status: 'active',
                specifications: [
                    { key: 'Display', value: '1.4 inch AMOLED' },
                    { key: 'Battery Life', value: '7 days' },
                    { key: 'Water Resistance', value: '5ATM' }
                ],
                attributes: {
                    colors: ['Black', 'Silver', 'Rose Gold'],
                    sizes: ['42mm', '46mm']
                }
            },
            {
                name: 'Tablet Air',
                description: 'Lightweight tablet with powerful performance',
                price: 799.99,
                stock: 40,
                category: category._id,
                status: 'active',
                specifications: [
                    { key: 'Screen Size', value: '10.9 inches' },
                    { key: 'RAM', value: '8GB' },
                    { key: 'Storage', value: '256GB' }
                ],
                attributes: {
                    colors: ['Space Gray', 'Silver'],
                    sizes: ['Wi-Fi', 'Wi-Fi + Cellular']
                }
            }
        ];

        // Insert new products
        const products = await Product.insertMany(dummyProducts);
        console.log(`Successfully seeded ${products.length} products`);

        // Close the database connection
        await mongoose.connection.close();
        console.log('Database connection closed');
    } catch (error) {
        console.error('Error seeding products:', error);
        process.exit(1);
    }
};

seedProducts(); 