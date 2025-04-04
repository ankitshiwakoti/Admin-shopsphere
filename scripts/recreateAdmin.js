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

// Function to recreate admin
const recreateAdmin = async () => {
    try {
        // Get email from command line arguments
        const email = process.argv[2];
        const newPassword = process.argv[3];
        
        if (!email || !newPassword) {
            console.error('Usage: node recreateAdmin.js <email> <new_password>');
            process.exit(1);
        }
        
        console.log(`Recreating admin with email: ${email}`);
        
        // Find admin by email
        const existingAdmin = await Admin.findOne({ email });
        if (!existingAdmin) {
            console.error(`Admin with email ${email} not found`);
            process.exit(1);
        }
        
        console.log(`Admin found: ${existingAdmin.username} (${existingAdmin.role})`);
        
        // Store admin details
        const username = existingAdmin.username;
        const role = existingAdmin.role;
        const roles = existingAdmin.roles;
        const status = existingAdmin.status;
        
        // Delete the existing admin
        await Admin.deleteOne({ _id: existingAdmin._id });
        console.log(`Deleted existing admin: ${username}`);
        
        // Create a new admin with the same details but a new password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);
        
        const newAdmin = new Admin({
            username,
            email,
            password: hashedPassword,
            role,
            roles,
            status
        });
        
        await newAdmin.save();
        console.log(`Created new admin: ${username} with new password`);
        
        // Verify the password works
        const isMatch = await newAdmin.comparePassword(newPassword);
        console.log(`Password verification: ${isMatch ? 'Success' : 'Failed'}`);
        
        process.exit(0);
    } catch (error) {
        console.error('Error recreating admin:', error);
        process.exit(1);
    }
};

// Run the function
recreateAdmin(); 