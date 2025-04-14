import speakeasy from 'speakeasy';
import QRCode from 'qrcode';
import Admin from '../models/Admin.js';

// Generate a new MFA secret for a user
export const generateSecret = async (req, res) => {
    try {
        // Get the admin from the session
        const adminId = req.session.adminId;
        if (!adminId) {
            return res.status(401).json({ success: false, message: 'Not authenticated' });
        }

        const admin = await Admin.findById(adminId);
        if (!admin) {
            return res.status(404).json({ success: false, message: 'Admin not found' });
        }

        // Generate a new secret
        const secret = speakeasy.generateSecret({
            name: `ShopSphere:${admin.email}`
        });

        // Generate QR code
        const qrCode = await QRCode.toDataURL(secret.otpauth_url);

        // Generate backup codes
        const backupCodes = Array.from({ length: 8 }, () => ({
            code: Math.random().toString(36).substring(2, 8).toUpperCase(),
            used: false
        }));

        // Update admin with MFA details
        admin.mfaSecret = secret.base32;
        admin.backupCodes = backupCodes;
        await admin.save();

        res.json({
            success: true,
            secret: secret.base32,
            qrCode,
            backupCodes: backupCodes.map(code => code.code)
        });
    } catch (error) {
        console.error('Error generating MFA secret:', error);
        res.status(500).json({ success: false, message: 'Error generating MFA secret' });
    }
};

// Verify the MFA token
export const verifyToken = async (req, res) => {
    try {
        const { token } = req.body;
        
        // Get the admin from the session
        const adminId = req.session.adminId;
        if (!adminId) {
            return res.status(401).json({ success: false, message: 'Not authenticated' });
        }

        const admin = await Admin.findById(adminId);
        if (!admin) {
            return res.status(404).json({ success: false, message: 'Admin not found' });
        }

        if (!admin.mfaSecret) {
            return res.status(400).json({ success: false, message: 'MFA not set up' });
        }

        // Check if it's a backup code
        const backupCode = admin.backupCodes.find(code => 
            code.code === token && !code.used
        );

        if (backupCode) {
            // Mark the backup code as used
            backupCode.used = true;
            await admin.save();
            return res.json({ success: true });
        }

        // Verify the TOTP token
        const verified = speakeasy.totp.verify({
            secret: admin.mfaSecret,
            encoding: 'base32',
            token: token
        });

        if (verified) {
            admin.mfaEnabled = true;
            await admin.save();
            res.json({ success: true });
        } else {
            res.status(400).json({ success: false, message: 'Invalid token' });
        }
    } catch (error) {
        console.error('Error verifying MFA token:', error);
        res.status(500).json({ success: false, message: 'Error verifying MFA token' });
    }
};

// Disable MFA for a user
export const disableMFA = async (req, res) => {
    try {
        // Get the admin from the session
        const adminId = req.session.adminId;
        if (!adminId) {
            return res.status(401).json({ success: false, message: 'Not authenticated' });
        }

        const admin = await Admin.findById(adminId);
        if (!admin) {
            return res.status(404).json({ success: false, message: 'Admin not found' });
        }

        admin.mfaEnabled = false;
        admin.mfaSecret = null;
        admin.backupCodes = [];
        await admin.save();

        res.json({ success: true, message: 'MFA disabled successfully' });
    } catch (error) {
        console.error('Error disabling MFA:', error);
        res.status(500).json({ success: false, message: 'Error disabling MFA' });
    }
};

// Get MFA status for a user
export const getMFAStatus = async (req, res) => {
    try {
        // Get the admin from the session
        const adminId = req.session.adminId;
        if (!adminId) {
            return res.status(401).json({ success: false, message: 'Not authenticated' });
        }

        const admin = await Admin.findById(adminId);
        if (!admin) {
            return res.status(404).json({ success: false, message: 'Admin not found' });
        }

        res.json({ success: true, isEnabled: admin.mfaEnabled });
    } catch (error) {
        console.error('Error getting MFA status:', error);
        res.status(500).json({ success: false, message: 'Error getting MFA status' });
    }
}; 