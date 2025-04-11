import Role from '../models/Role.js';
import Admin from '../models/Admin.js';

// Get roles management page
export const getRolesPage = async (req, res) => {
    try {
        console.log('Fetching roles page data...');
        
        // Fetch all roles with populated assignedAdmins
        const roles = await Role.find()
            .populate('assignedAdmins', 'username email role')
            .sort({ createdAt: -1 });
        
        console.log('Roles fetched:', roles.map(role => ({
            name: role.name,
            permissions: role.permissions,
            adminCount: role.assignedAdmins.length
        })));
        
        // Fetch all non-superadmin admins for role assignment
        const admins = await Admin.find({ role: { $ne: 'superadmin' } })
            .select('username email role')
            .sort({ username: 1 });
        
        console.log('Admins fetched:', admins.map(admin => ({
            username: admin.username,
            email: admin.email,
            role: admin.role
        })));
        
        // Get the list of available permissions from the Role model
        const availablePermissions = Role.schema.path('permissions.0').enumValues;
        console.log('Available permissions:', availablePermissions);
        
        // Log the data being passed to the view
        const viewData = {
            title: 'Role Management',
            path: '/admin/roles',
            roles,
            admins,
            availablePermissions,
            messages: {
                success: req.flash('success_msg'),
                error: req.flash('error_msg')
            }
        };
        
        res.render('admin/roles', viewData);
    } catch (error) {
        console.error('Error fetching roles page:', error);
        req.flash('error_msg', 'Error loading roles page');
        res.redirect('/admin/dashboard');
    }
}; 