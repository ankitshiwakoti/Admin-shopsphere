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

// Function to verify password
const verifyPassword = async () => {
    try {
        // Get email and password from command line arguments
        const email = process.argv[2];
        const password = process.argv[3];
        
        if (!email || !password) {
            console.error('Usage: node verifyPassword.js <email> <password>');
            process.exit(1);
        }
        
        console.log(`Verifying password for admin: ${email}`);
        
        // Find admin by email
        const admin = await Admin.findOne({ email });
        if (!admin) {
            console.error(`Admin with email ${email} not found`);
            process.exit(1);
        }
        
        console.log('Admin found:', {
            id: admin._id,
            email: admin.email,
            role: admin.role,
            hasPassword: !!admin.password,
            passwordLength: admin.password ? admin.password.length : 0
        });
        
        // Direct bcrypt comparison
        console.log('\nDirect bcrypt comparison:');
        const isMatch = await bcrypt.compare(password, admin.password);
        console.log(`Password match result: ${isMatch}`);
        
        // Model method comparison
        console.log('\nModel method comparison:');
        const modelMatch = await admin.comparePassword(password);
        console.log(`Model method match result: ${modelMatch}`);
        
        // Log hash details
        console.log('\nHash details:');
        console.log('Stored hash:', admin.password);
        console.log('Hash rounds:', admin.password.split('$')[2]);
        
        process.exit(0);
    } catch (error) {
        console.error('Error verifying password:', error);
        process.exit(1);
    }
};

// Run the function
verifyPassword(); 