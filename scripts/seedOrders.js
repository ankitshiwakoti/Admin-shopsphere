import mongoose from 'mongoose';
import Order from '../models/order.js';
import Customer from '../models/customer.js';
import Product from '../models/Product.js';
import dotenv from 'dotenv';
import connectDB from '../config/database.js';

// Connect to database
connectDB();

const seedOrders = async () => {
    try {
        // Get all customers and products
        const customers = await Customer.find();
        const products = await Product.find();

        console.log('\n=== Database Status ===');
        console.log(`Found ${customers.length} customers:`);
        customers.forEach(customer => {
            console.log(`- ${customer.name} (${customer.email})`);
        });

        console.log(`\nFound ${products.length} products:`);
        products.forEach(product => {
            console.log(`- ${product.name} ($${product.price})`);
        });

        if (customers.length === 0) {
            console.error('\nError: No customers found in database. Please run "npm run seed-customers" first.');
            process.exit(1);
        }

        if (products.length === 0) {
            console.error('\nError: No products found in database. Please run "npm run seed-products" first.');
            process.exit(1);
        }

        // Clear existing orders
        await Order.deleteMany({});
        console.log('\nCleared existing orders');

        const dummyOrders = [
            {
                customer: customers[0]._id,
                items: [
                    {
                        product: products[0]._id,
                        quantity: 2,
                        price: products[0].price
                    },
                    {
                        product: products[1]._id,
                        quantity: 1,
                        price: products[1].price
                    }
                ],
                totalAmount: (products[0].price * 2) + products[1].price,
                status: 'pending',
                shippingAddress: customers[0].address,
                paymentStatus: 'pending'
            },
            {
                customer: customers[1]._id,
                items: [
                    {
                        product: products[2]._id,
                        quantity: 3,
                        price: products[2].price
                    }
                ],
                totalAmount: products[2].price * 3,
                status: 'processing',
                shippingAddress: customers[1].address,
                paymentStatus: 'paid'
            },
            {
                customer: customers[2]._id,
                items: [
                    {
                        product: products[3]._id,
                        quantity: 1,
                        price: products[3].price
                    },
                    {
                        product: products[4]._id,
                        quantity: 2,
                        price: products[4].price
                    }
                ],
                totalAmount: products[3].price + (products[4].price * 2),
                status: 'shipped',
                shippingAddress: customers[2].address,
                paymentStatus: 'paid'
            },
            {
                customer: customers[3]._id,
                items: [
                    {
                        product: products[0]._id,
                        quantity: 1,
                        price: products[0].price
                    }
                ],
                totalAmount: products[0].price,
                status: 'delivered',
                shippingAddress: customers[3].address,
                paymentStatus: 'paid'
            },
            {
                customer: customers[4]._id,
                items: [
                    {
                        product: products[1]._id,
                        quantity: 2,
                        price: products[1].price
                    }
                ],
                totalAmount: products[1].price * 2,
                status: 'cancelled',
                shippingAddress: customers[4].address,
                paymentStatus: 'refunded'
            }
        ];

        // Insert new orders
        const orders = await Order.insertMany(dummyOrders);
        console.log(`\nSuccessfully seeded ${orders.length} orders`);

        // Display created orders
        console.log('\nCreated Orders:');
        orders.forEach(order => {
            const customer = customers.find(c => c._id.toString() === order.customer.toString());
            console.log(`\nOrder ID: ${order._id}`);
            console.log(`Customer: ${customer.name}`);
            console.log(`Status: ${order.status}`);
            console.log(`Payment Status: ${order.paymentStatus}`);
            console.log(`Total Amount: $${order.totalAmount}`);
        });

        // Close the database connection
        await mongoose.connection.close();
        console.log('\nDatabase connection closed');
    } catch (error) {
        console.error('Error seeding orders:', error);
        process.exit(1);
    }
};

seedOrders(); 