import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import Admin from '../models/Admin.js';

// Load environment variables
dotenv.config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('Connected to MongoDB'))
    .catch(err => {
        console.error('MongoDB connection error:', err);
        process.exit(1);
    });

// Function to create fresh admin
const createFreshAdmin = async () => {
    try {
        // Get email and password from command line arguments
        const email = process.argv[2];
        const password = process.argv[3];
        
        if (!email || !password) {
            console.error('Usage: node createFreshAdmin.js <email> <password>');
            process.exit(1);
        }
        
        console.log(`Creating fresh admin with email: ${email}`);
        
        // Create new admin
        console.log('Generating salt...');
        const salt = await bcrypt.genSalt(10);
        console.log('Salt generated:', salt);
        
        console.log('Hashing password...');
        const hashedPassword = await bcrypt.hash(password, salt);
        console.log('Password hashed:', hashedPassword);
        
        // Create admin document directly
        const adminDoc = {
            username: email.split('@')[0],
            email,
            password: hashedPassword,
            role: 'admin',
            status: 'active',
            createdAt: new Date()
        };
        
        console.log('Creating admin document:', {
            ...adminDoc,
            password: '[HIDDEN]'
        });
        
        // Delete existing admin if any
        const existingAdmin = await Admin.findOne({ email });
        if (existingAdmin) {
            console.log('Deleting existing admin...');
            await Admin.deleteOne({ _id: existingAdmin._id });
            console.log('Existing admin deleted');
        }
        
        // Insert directly using native MongoDB driver
        const result = await mongoose.connection.db.collection('admins').insertOne(adminDoc);
        console.log('Admin document inserted:', result.insertedId);
        
        // Retrieve the admin using Mongoose to get the model instance
        const admin = await Admin.findById(result.insertedId);
        console.log('New admin created:', {
            id: admin._id,
            email: admin.email,
            role: admin.role,
            hasPassword: !!admin.password,
            passwordLength: admin.password ? admin.password.length : 0
        });
        
        // Verify the password works
        console.log('\nVerifying password with bcrypt...');
        const isMatch = await bcrypt.compare(password, admin.password);
        console.log(`Direct bcrypt verification: ${isMatch ? 'Success' : 'Failed'}`);
        
        if (isMatch) {
            console.log('\nTesting admin model comparePassword method...');
            const modelMatch = await admin.comparePassword(password);
            console.log(`Model method verification: ${modelMatch ? 'Success' : 'Failed'}`);
        }
        
        process.exit(0);
    } catch (error) {
        console.error('Error creating fresh admin:', error);
        process.exit(1);
    }
};

// Run the function
createFreshAdmin(); 