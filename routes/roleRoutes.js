import express from 'express';
import { protect, isSuperAdmin } from '../middleware/auth.js';
import {
    getRoles,
    createRole,
    assignRole,
    removeRole,
    getAssignedAdmins
} from '../controllers/roleController.js';

const router = express.Router();

// Protected routes
router.use(protect);

// Get all roles (API endpoint)
router.get('/', isSuperAdmin, getRoles);

// Get admins assigned to a role (API endpoint)
router.get('/:roleId/admins', isSuperAdmin, getAssignedAdmins);

// Create new role
router.post('/', isSuperAdmin, createRole);

// Assign role to admin
router.post('/assign', isSuperAdmin, assignRole);

// Remove role from admin
router.post('/remove', isSuperAdmin, removeRole);

export default router; 