import express from 'express';
import mongoose from 'mongoose';
import session from 'express-session';
import flash from 'connect-flash';
import expressLayouts from 'express-ejs-layouts';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import dotenv from 'dotenv';

// Import routes
import indexRoutes from './routes/index.js';
import adminRoutes from './routes/admin.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config();

const app = express();

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/shopsphere')
    .then(() => console.log('MongoDB Connected: localhost'))
    .catch(err => console.log('MongoDB Connection Error:', err));

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// View engine setup
app.use(expressLayouts);
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.set('layout', 'layouts/dashboard'); // Set default layout

// Session configuration
app.use(session({
    secret: 'your-secret-key',
    resave: true,
    saveUninitialized: false,
    cookie: {
        secure: false, // Set to true if using HTTPS
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
}));

// Flash messages
app.use(flash());

// Global variables for flash messages
app.use((req, res, next) => {
    console.log('Session:', req.session);
    console.log('Flash messages:', {
        success_msg: req.flash('success_msg'),
        error_msg: req.flash('error_msg'),
        error: req.flash('error')
    });
    res.locals.success_msg = req.flash('success_msg');
    res.locals.error_msg = req.flash('error_msg');
    res.locals.error = req.flash('error');
    res.locals.path = req.path;
    res.locals.title = 'ShopSphere Admin';
    next();
});

// Admin routes with conditional layout
app.use('/admin', (req, res, next) => {
    console.log('Admin route:', req.path);
    console.log('Current layout:', res.locals.layout);
    // Skip dashboard layout for login and signup pages
    if (req.path === '/login' || req.path === '/signup') {
        res.locals.layout = 'layouts/auth';
        console.log('Setting auth layout for:', req.path);
    }
    next();
}, adminRoutes);

// Routes
app.use('/', indexRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server is running on port ${PORT}`)); 