import connectDB from '../config/database.js';
import Admin from '../models/Admin.js';

const createAdmin = async () => {
    try {
        // Connect to database
        await connectDB();

        const adminData = {
            username: 'admin',
            password: 'admin123', // Change this in production
            email: 'admin@shopsphere.com'
        };

        const existingAdmin = await Admin.findOne({ username: adminData.username });
        
        if (existingAdmin) {
            console.log('Admin user already exists');
            process.exit(0);
        }

        const admin = new Admin(adminData);
        await admin.save();
        
        console.log('Admin user created successfully');
        process.exit(0);
    } catch (error) {
        console.error('Error creating admin user:', error);
        process.exit(1);
    }
};

createAdmin(); 