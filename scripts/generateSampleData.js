const mongoose = require('mongoose');
const Customer = require('../models/customer');
const Order = require('../models/order');
const Product = require('../models/product');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

const sampleCustomers = [
    {
        name: 'John Doe',
        email: 'john@example.com',
        phone: '1234567890',
        address: {
            street: '123 Main St',
            city: 'New York',
            state: 'NY',
            zipCode: '10001',
            country: 'USA'
        },
        status: 'active'
    },
    {
        name: 'Jane Smith',
        email: 'jane@example.com',
        phone: '0987654321',
        address: {
            street: '456 Oak Ave',
            city: 'Los Angeles',
            state: 'CA',
            zipCode: '90001',
            country: 'USA'
        },
        status: 'active'
    },
    {
        name: 'Mike Johnson',
        email: 'mike@example.com',
        phone: '5551234567',
        address: {
            street: '789 Pine St',
            city: 'Chicago',
            state: 'IL',
            zipCode: '60601',
            country: 'USA'
        },
        status: 'active'
    }
];

async function generateSampleData() {
    try {
        // Clear existing data
        await Customer.deleteMany({});
        await Order.deleteMany({});

        // Create customers
        const customers = await Customer.insertMany(sampleCustomers);
        console.log('Created customers:', customers.length);

        // Get all products
        const products = await Product.find({});
        if (products.length === 0) {
            console.log('No products found. Please create products first.');
            process.exit(1);
        }

        // Create sample orders
        const orders = [];
        for (let i = 0; i < 5; i++) {
            const customer = customers[Math.floor(Math.random() * customers.length)];
            const orderItems = [];
            const numItems = Math.floor(Math.random() * 3) + 1; // 1-3 items per order

            for (let j = 0; j < numItems; j++) {
                const product = products[Math.floor(Math.random() * products.length)];
                const quantity = Math.floor(Math.random() * 3) + 1; // 1-3 quantity per item

                orderItems.push({
                    product: product._id,
                    quantity: quantity,
                    price: product.price
                });

                // Update product stock
                product.stock -= quantity;
                await product.save();
            }

            const order = new Order({
                customer: customer._id,
                items: orderItems,
                totalAmount: orderItems.reduce((sum, item) => sum + (item.price * item.quantity), 0),
                status: ['pending', 'processing', 'shipped', 'delivered'][Math.floor(Math.random() * 4)],
                shippingAddress: customer.address,
                paymentStatus: ['pending', 'paid', 'failed'][Math.floor(Math.random() * 3)]
            });

            orders.push(order);
        }

        await Order.insertMany(orders);
        console.log('Created orders:', orders.length);

        console.log('Sample data generation completed successfully!');
        process.exit(0);
    } catch (error) {
        console.error('Error generating sample data:', error);
        process.exit(1);
    }
}

generateSampleData(); 