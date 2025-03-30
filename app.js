import express from 'express';
import mongoose from 'mongoose';
import session from 'express-session';
import flash from 'connect-flash';
import expressLayouts from 'express-ejs-layouts';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import dotenv from 'dotenv';
import connectDB from './config/database.js';


// Import routes
import indexRoutes from './routes/index.js';
import adminRoutes from './routes/admin.js';
import roleRoutes from './routes/roleRoutes.js';
import productRoutes from './routes/productRoutes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config();

const app = express();

// Connect to MongoDB
connectDB();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// View engine setup
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(expressLayouts);

// Set default layout
app.set('layout', 'layouts/dashboard');

// Session configuration
app.use(session({
    secret: 'your-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: {
        maxAge: 24 * 60 * 60 * 1000 // 1 day
    }
}));

// Flash messages
app.use(flash());

// Global variables for flash messages
app.use((req, res, next) => {
    res.locals.success_msg = req.flash('success_msg');
    res.locals.error_msg = req.flash('error_msg');
    res.locals.error = req.flash('error');
    res.locals.path = req.path;
    res.locals.title = 'ShopSphere Admin';
    next();
});

// Middleware to determine layout for admin routes
app.use('/admin', (req, res, next) => {
    // Skip layout for login and signup pages
    if (req.path === '/login' || req.path === '/signup') {
        res.locals.layout = 'layouts/auth';
    } else {
        res.locals.layout = 'layouts/dashboard';
        // Set path for active menu highlighting
        res.locals.path = req.path;
    }
    next();
});

// Routes
app.use('/', indexRoutes);
app.use('/admin', adminRoutes);
app.use('/api/roles', roleRoutes);
app.use("/admin/products", productRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
}); 