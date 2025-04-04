import mongoose from 'mongoose';
import Customer from '../models/customer.js';
import dotenv from 'dotenv';
import connectDB from '../config/database.js';

// Connect to database
connectDB();

const dummyCustomers = [
    {
        name: 'John Doe',
        email: 'john.doe@example.com',
        phone: '+1 234-567-8901',
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
        email: 'jane.smith@example.com',
        phone: '+1 234-567-8902',
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
        name: 'Robert Johnson',
        email: 'robert.j@example.com',
        phone: '+1 234-567-8903',
        address: {
            street: '789 Pine St',
            city: 'Chicago',
            state: 'IL',
            zipCode: '60601',
            country: 'USA'
        },
        status: 'inactive'
    },
    {
        name: 'Emily Davis',
        email: 'emily.d@example.com',
        phone: '+1 234-567-8904',
        address: {
            street: '321 Elm St',
            city: 'Houston',
            state: 'TX',
            zipCode: '77001',
            country: 'USA'
        },
        status: 'active'
    },
    {
        name: 'Michael Brown',
        email: 'michael.b@example.com',
        phone: '+1 234-567-8905',
        address: {
            street: '654 Maple Ave',
            city: 'Phoenix',
            state: 'AZ',
            zipCode: '85001',
            country: 'USA'
        },
        status: 'blocked'
    }
];

const seedCustomers = async () => {
    try {
        // Clear existing customers
        await Customer.deleteMany({});
        console.log('Cleared existing customers');

        // Insert new customers
        const customers = await Customer.insertMany(dummyCustomers);
        console.log(`Successfully seeded ${customers.length} customers`);

        // Close the database connection
        await mongoose.connection.close();
        console.log('Database connection closed');
    } catch (error) {
        console.error('Error seeding customers:', error);
        process.exit(1);
    }
};

seedCustomers(); 