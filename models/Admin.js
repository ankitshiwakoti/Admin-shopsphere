import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const adminSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    password: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    role: {
        type: String,
        enum: ['admin', 'superadmin'],
        default: 'admin'
    },
    roles: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Role'
    }],
    status: {
        type: String,
        enum: ['active', 'inactive'],
        default: 'active'
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Hash password before saving
adminSchema.pre('save', async function(next) {
    try {
        // Only hash the password if it's been modified or is new
        if (!this.isModified('password')) {
            console.log('Password not modified, skipping hash');
            return next();
        }
        
        console.log('Hashing password for admin:', this.username || this.email);
        
        // Generate a salt
        const salt = await bcrypt.genSalt(10);
        console.log('Salt generated');
        
        // Hash the password
        this.password = await bcrypt.hash(this.password, salt);
        console.log('Password hashed successfully');
        
        next();
    } catch (error) {
        console.error('Error hashing password:', error);
        next(error);
    }
});

// Method to compare password
adminSchema.methods.comparePassword = async function(candidatePassword) {
    try {
        console.log(`Comparing password for admin: ${this.username || this.email}`);
        console.log(`Stored password hash: ${this.password ? 'Present' : 'Missing'}`);
        console.log(`Candidate password length: ${candidatePassword ? candidatePassword.length : 0}`);
        console.log(`Stored hash length: ${this.password ? this.password.length : 0}`);
        
        if (!this.password) {
            console.error('No password hash found in database');
            return false;
        }
        
        if (!candidatePassword) {
            console.error('No candidate password provided');
            return false;
        }
        
        // Ensure both values are strings
        const candidate = String(candidatePassword);
        const stored = String(this.password);
        
        console.log('Starting password comparison...');
        const isMatch = await bcrypt.compare(candidate, stored);
        console.log(`Password match result: ${isMatch}`);
        
        return isMatch;
    } catch (error) {
        console.error('Error comparing passwords:', error);
        console.error('Error details:', {
            message: error.message,
            stack: error.stack
        });
        throw error;
    }
};

const Admin = mongoose.model('Admin', adminSchema);

export default Admin; 