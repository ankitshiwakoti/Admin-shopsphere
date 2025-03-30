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
        const role = new Role(req.body);
        await role.save();
        req.flash('success_msg', 'Role created successfully');
        res.redirect('/admin/roles');
    } catch (error) {
        req.flash('error_msg', 'Error creating role');
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
            req.flash('error_msg', 'Admin not found');
            return res.redirect('/admin/roles');
        }
        if (admin.role === 'superadmin') {
            req.flash('error_msg', 'Cannot assign roles to superadmin');
            return res.redirect('/admin/roles');
        }

        // Check if role exists
        const role = await Role.findById(roleId);
        if (!role) {
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

        req.flash('success_msg', 'Role assigned successfully');
        res.redirect('/admin/roles');
    } catch (error) {
        console.error('Error assigning role:', error);
        req.flash('error_msg', 'Error assigning role');
        res.redirect('/admin/roles');
    }
};

// Remove role from admin
export const removeRole = async (req, res) => {
    try {
        const { roleId, adminId } = req.body;

        // Remove role from admin's roles array
        await Admin.findByIdAndUpdate(adminId, {
            $pull: { roles: roleId }
        });

        // Remove admin from role's assignedAdmins array
        await Role.findByIdAndUpdate(roleId, {
            $pull: { assignedAdmins: adminId }
        });

        req.flash('success_msg', 'Role removed successfully');
        res.redirect('/admin/roles');
    } catch (error) {
        console.error('Error removing role:', error);
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