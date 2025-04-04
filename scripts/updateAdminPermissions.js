import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Admin from '../models/Admin.js';
import Role from '../models/Role.js';

// Load environment variables
dotenv.config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('Connected to MongoDB'))
    .catch(err => {
        console.error('MongoDB connection error:', err);
        process.exit(1);
    });

// Function to update admin permissions
const updateAdminPermissions = async () => {
    try {
        // Get email from command line arguments
        const email = process.argv[2];
        
        if (!email) {
            console.error('Usage: node updateAdminPermissions.js <email>');
            process.exit(1);
        }
        
        console.log(`Updating permissions for admin: ${email}`);
        
        // Find admin by email
        const admin = await Admin.findOne({ email }).populate('roles');
        if (!admin) {
            console.error(`Admin with email ${email} not found`);
            process.exit(1);
        }
        
        console.log('Admin found:', {
            id: admin._id,
            email: admin.email,
            role: admin.role,
            roles: admin.roles.map(role => role.name)
        });
        
        // Check if admin has a role with manage_products permission
        const hasProductPermission = admin.roles.some(role => 
            role.permissions.includes('manage_products')
        );
        
        console.log(`Has product permission: ${hasProductPermission}`);
        
        if (!hasProductPermission) {
            // Find or create a role with manage_products permission
            let productRole = await Role.findOne({ 
                permissions: { $in: ['manage_products'] } 
            });
            
            if (!productRole) {
                console.log('Creating new role with product permissions');
                productRole = new Role({
                    name: 'Product Manager',
                    description: 'Can manage products and categories',
                    permissions: [
                        'manage_products',
                        'manage_categories',
                        'manage_orders',
                        'manage_customers',
                        'view_dashboard'
                    ]
                });
                await productRole.save();
                console.log('New role created:', productRole.name);
            } else {
                // Update existing role to include all necessary permissions
                if (!productRole.permissions.includes('manage_categories')) {
                    productRole.permissions.push('manage_categories');
                }
                if (!productRole.permissions.includes('manage_orders')) {
                    productRole.permissions.push('manage_orders');
                }
                if (!productRole.permissions.includes('manage_customers')) {
                    productRole.permissions.push('manage_customers');
                }
                if (!productRole.permissions.includes('view_dashboard')) {
                    productRole.permissions.push('view_dashboard');
                }
                await productRole.save();
                console.log('Updated role permissions:', productRole.permissions);
            }
            
            // Add the role to the admin
            if (!admin.roles.includes(productRole._id)) {
                admin.roles.push(productRole._id);
                await admin.save();
                console.log(`Added ${productRole.name} role to admin`);
            }
            
            // Update the role's assignedAdmins
            if (!productRole.assignedAdmins.includes(admin._id)) {
                productRole.assignedAdmins.push(admin._id);
                await productRole.save();
                console.log(`Added admin to ${productRole.name} role`);
            }
        }
        
        // Verify the admin has the correct role and permissions
        const updatedAdmin = await Admin.findOne({ email }).populate('roles');
        console.log('\nUpdated admin:', {
            id: updatedAdmin._id,
            email: updatedAdmin.email,
            role: updatedAdmin.role,
            roles: updatedAdmin.roles.map(role => ({
                name: role.name,
                permissions: role.permissions
            }))
        });
        
        process.exit(0);
    } catch (error) {
        console.error('Error updating admin permissions:', error);
        process.exit(1);
    }
};

// Run the function
updateAdminPermissions(); 