import express from 'express';
import { isAdmin, isSuperAdmin } from '../middleware/auth.js';
import {
    getRoles,
    createRole,
    assignRole,
    removeRole,
    getAssignedAdmins
} from '../controllers/roleController.js';

const router = express.Router();

// All routes require admin authentication
router.use(isAdmin);

// Get all roles (API endpoint)
router.get('/api/roles', getRoles);

// Get admins assigned to a role (API endpoint)
router.get('/api/roles/:roleId/admins', getAssignedAdmins);

// Create new role
router.post('/roles', isSuperAdmin, createRole);

// Assign role to admin
router.post('/roles/assign', isSuperAdmin, assignRole);

// Remove role from admin
router.post('/roles/remove', isSuperAdmin, removeRole);

export default router; 