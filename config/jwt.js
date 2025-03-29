import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-key';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'your-super-secret-refresh-key';

export const generateTokens = (adminId) => {
    const accessToken = jwt.sign(
        { id: adminId },
        JWT_SECRET,
        { expiresIn: '15m' } // Access token expires in 15 minutes
    );

    const refreshToken = jwt.sign(
        { id: adminId },
        JWT_REFRESH_SECRET,
        { expiresIn: '7d' } // Refresh token expires in 7 days
    );

    return { accessToken, refreshToken };
};

export const verifyAccessToken = (token) => {
    try {
        return jwt.verify(token, JWT_SECRET);
    } catch (error) {
        return null;
    }
};

export const verifyRefreshToken = (token) => {
    try {
        return jwt.verify(token, JWT_REFRESH_SECRET);
    } catch (error) {
        return null;
    }
}; 