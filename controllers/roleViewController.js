import Role from '../models/Role.js';
import Admin from '../models/Admin.js';

// Get roles management page
export const getRolesPage = async (req, res) => {
    try {
        console.log('Fetching roles page data...');
        
        // Fetch all roles
        const roles = await Role.find();
        console.log('Roles fetched:', roles);
        
        // Fetch all admins for role assignment
        const admins = await Admin.find().select('username email');
        console.log('Admins fetched:', admins);
        
        // Log the data being passed to the view
        const viewData = {
            title: 'Role Management',
            path: '/admin/roles',
            roles,
            admins
        };
        console.log('View data:', viewData);
        
        res.render('admin/roles', viewData);
    } catch (error) {
        console.error('Error fetching roles page:', error);
        req.flash('error_msg', 'Error loading roles page');
        res.redirect('/admin/dashboard');
    }
}; 