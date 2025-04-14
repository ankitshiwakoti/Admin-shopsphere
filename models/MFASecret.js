import mongoose from 'mongoose';

const mfaSecretSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true
    },
    secret: {
        type: String,
        required: true
    },
    isEnabled: {
        type: Boolean,
        default: false
    },
    backupCodes: [{
        code: String,
        used: {
            type: Boolean,
            default: false
        }
    }],
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Update the updatedAt field before saving
mfaSecretSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

const MFASecret = mongoose.model('MFASecret', mfaSecretSchema);

export default MFASecret; 