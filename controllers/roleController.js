import Role from '../models/Role.js';
import Admin from '../models/Admin.js';

// Get all roles
export const getRoles = async (req, res) => {
    try {
        const roles = await Role.find().populate('assignedAdmins', 'username email');
        res.json(roles);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Create a new role
export const createRole = async (req, res) => {
    try {
        const { name, description, permissions } = req.body;
        
        // Validate required fields
        if (!name) {
            if (req.xhr || req.headers.accept.includes('application/json')) {
                return res.status(400).json({
                    success: false,
                    message: 'Role name is required'
                });
            }
            req.flash('error_msg', 'Role name is required');
            return res.redirect('/admin/roles');
        }
        
        // Ensure permissions is an array
        const permissionsArray = Array.isArray(permissions) ? permissions : [permissions].filter(Boolean);
        
        // Validate permissions against allowed values
        const allowedPermissions = Role.schema.path('permissions.0').enumValues;
        const validPermissions = permissionsArray.every(p => allowedPermissions.includes(p));
        
        if (!validPermissions) {
            if (req.xhr || req.headers.accept.includes('application/json')) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid permissions selected'
                });
            }
            req.flash('error_msg', 'Invalid permissions selected');
            return res.redirect('/admin/roles');
        }
        
        // Check if role with same name exists
        const existingRole = await Role.findOne({ name });
        if (existingRole) {
            if (req.xhr || req.headers.accept.includes('application/json')) {
                return res.status(400).json({
                    success: false,
                    message: 'A role with this name already exists'
                });
            }
            req.flash('error_msg', 'A role with this name already exists');
            return res.redirect('/admin/roles');
        }
        
        // Create and save the role
        const role = new Role({
            name,
            description,
            permissions: permissionsArray
        });
        
        await role.save();
        console.log('Role created:', {
            name: role.name,
            permissions: role.permissions
        });
        
        if (req.xhr || req.headers.accept.includes('application/json')) {
            return res.status(201).json({
                success: true,
                message: 'Role created successfully',
                data: role
            });
        }
        
        req.flash('success_msg', 'Role created successfully');
        res.redirect('/admin/roles');
    } catch (error) {
        console.error('Error creating role:', error);
        if (req.xhr || req.headers.accept.includes('application/json')) {
            return res.status(500).json({
                success: false,
                message: `Error creating role: ${error.message}`
            });
        }
        req.flash('error_msg', `Error creating role: ${error.message}`);
        res.redirect('/admin/roles');
    }
};

// Get admins assigned to a role
export const getAssignedAdmins = async (req, res) => {
    try {
        const role = await Role.findById(req.params.roleId)
            .populate('assignedAdmins', 'username email role');
        
        if (!role) {
            return res.status(404).json({ message: 'Role not found' });
        }

        // Filter out superadmins from the response
        const regularAdmins = role.assignedAdmins.filter(admin => admin.role !== 'superadmin');
        res.json(regularAdmins);
    } catch (error) {
        console.error('Error fetching assigned admins:', error);
        res.status(500).json({ message: 'Error fetching assigned admins' });
    }
};

// Assign role to admin
export const assignRole = async (req, res) => {
    try {
        const { roleId, adminId } = req.body;
        
        // Check if admin exists and is not a superadmin
        const admin = await Admin.findById(adminId);
        if (!admin) {
            if (req.xhr || req.headers.accept.includes('application/json')) {
                return res.status(404).json({
                    success: false,
                    message: 'Admin not found'
                });
            }
            req.flash('error_msg', 'Admin not found');
            return res.redirect('/admin/roles');
        }
        if (admin.role === 'superadmin') {
            if (req.xhr || req.headers.accept.includes('application/json')) {
                return res.status(403).json({
                    success: false,
                    message: 'Cannot assign roles to superadmin'
                });
            }
            req.flash('error_msg', 'Cannot assign roles to superadmin');
            return res.redirect('/admin/roles');
        }

        // Check if role exists
        const role = await Role.findById(roleId);
        if (!role) {
            if (req.xhr || req.headers.accept.includes('application/json')) {
                return res.status(404).json({
                    success: false,
                    message: 'Role not found'
                });
            }
            req.flash('error_msg', 'Role not found');
            return res.redirect('/admin/roles');
        }

        // Add role to admin's roles array if not already assigned
        if (!admin.roles.includes(roleId)) {
            admin.roles.push(roleId);
            await admin.save();
        }

        // Add admin to role's assignedAdmins array if not already assigned
        if (!role.assignedAdmins.includes(adminId)) {
            role.assignedAdmins.push(adminId);
            await role.save();
        }

        if (req.xhr || req.headers.accept.includes('application/json')) {
            return res.status(200).json({
                success: true,
                message: 'Role assigned successfully'
            });
        }

        req.flash('success_msg', 'Role assigned successfully');
        res.redirect('/admin/roles');
    } catch (error) {
        console.error('Error assigning role:', error);
        if (req.xhr || req.headers.accept.includes('application/json')) {
            return res.status(500).json({
                success: false,
                message: `Error assigning role: ${error.message}`
            });
        }
        req.flash('error_msg', 'Error assigning role');
        res.redirect('/admin/roles');
    }
};

// Remove role from admin
export const removeRole = async (req, res) => {
    try {
        const { roleId, adminId } = req.body;

        // Check if admin exists
        const admin = await Admin.findById(adminId);
        if (!admin) {
            if (req.xhr || req.headers.accept.includes('application/json')) {
                return res.status(404).json({
                    success: false,
                    message: 'Admin not found'
                });
            }
            req.flash('error_msg', 'Admin not found');
            return res.redirect('/admin/roles');
        }

        // Check if role exists
        const role = await Role.findById(roleId);
        if (!role) {
            if (req.xhr || req.headers.accept.includes('application/json')) {
                return res.status(404).json({
                    success: false,
                    message: 'Role not found'
                });
            }
            req.flash('error_msg', 'Role not found');
            return res.redirect('/admin/roles');
        }

        // Remove role from admin's roles array
        await Admin.findByIdAndUpdate(adminId, {
            $pull: { roles: roleId }
        });

        // Remove admin from role's assignedAdmins array
        await Role.findByIdAndUpdate(roleId, {
            $pull: { assignedAdmins: adminId }
        });

        if (req.xhr || req.headers.accept.includes('application/json')) {
            return res.status(200).json({
                success: true,
                message: 'Role removed successfully'
            });
        }

        req.flash('success_msg', 'Role removed successfully');
        res.redirect('/admin/roles');
    } catch (error) {
        console.error('Error removing role:', error);
        if (req.xhr || req.headers.accept.includes('application/json')) {
            return res.status(500).json({
                success: false,
                message: `Error removing role: ${error.message}`
            });
        }
        req.flash('error_msg', 'Error removing role');
        res.redirect('/admin/roles');
    }
};

// Get admin's roles
export const getAdminRoles = async (req, res) => {
    try {
        const { adminId } = req.params;

        // Find admin and populate roles
        const admin = await Admin.findById(adminId).populate('roles');
        if (!admin) {
            return res.status(404).json({ message: 'Admin not found' });
        }

        res.json(admin.roles);
    } catch (error) {
        console.error('Error fetching admin roles:', error);
        res.status(500).json({ message: 'Error fetching admin roles' });
    }
}; 