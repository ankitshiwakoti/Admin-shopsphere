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

// Function to reset admin password
const resetAdminPassword = async () => {
    try {
        // Get email from command line arguments
        const email = process.argv[2];
        const newPassword = process.argv[3];
        
        if (!email || !newPassword) {
            console.error('Usage: node resetAdminPassword.js <email> <new_password>');
            process.exit(1);
        }
        
        console.log(`Resetting password for admin with email: ${email}`);
        
        // Find admin by email
        const admin = await Admin.findOne({ email });
        if (!admin) {
            console.error(`Admin with email ${email} not found`);
            process.exit(1);
        }
        
        console.log(`Admin found: ${admin.username} (${admin.role})`);
        
        // Hash the new password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);
        
        // Update the admin's password
        admin.password = hashedPassword;
        await admin.save();
        
        console.log(`Password reset successful for ${admin.username}`);
        process.exit(0);
    } catch (error) {
        console.error('Error resetting password:', error);
        process.exit(1);
    }
};

// Run the function
resetAdminPassword(); 