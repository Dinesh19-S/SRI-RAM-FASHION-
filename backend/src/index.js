import express from 'express';
import cors from 'cors';
import compression from 'compression';
import "dotenv/config"
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import User from './models/User.js';


// Load environment variables

// Import Routes
import authRoutes from './routes/auth.js';
import productRoutes from './routes/products.js';
import categoryRoutes from './routes/categories.js';
import billRoutes from './routes/bills.js';
import inventoryRoutes from './routes/inventory.js';
import reportRoutes from './routes/reports.js';
import settingsRoutes from './routes/settings.js';
import dashboardRoutes from './routes/dashboard.js';
import customerRoutes from './routes/customers.js';
import hsnRoutes from './routes/hsn.js';
import supplierRoutes from './routes/suppliers.js';
import paymentRoutes from './routes/payments.js';
import salesEntriesRoutes from './routes/salesEntries.js';
import purchaseEntriesRoutes from './routes/purchaseEntries.js';
import aiRoutes from './routes/ai.js';
import emailRoutes from './routes/email.js';

const app = express();

// CORS Configuration - Allow frontend
const allowedOrigins = [
    'http://localhost:5173',
    'http://localhost:5174',
    'http://localhost:5175',
    'http://localhost:3000',
    'https://dinesh19-s.github.io',
    process.env.FRONTEND_URL
].filter(Boolean);

const corsOptions = {
    origin: (origin, callback) => {
        // Allow requests from Electron/file://, localhost dev, and whitelisted web origins
        if (!origin || origin === 'file://' || origin?.startsWith('capacitor://') || allowedOrigins.includes(origin)) {
            return callback(null, true);
        }
        return callback(new Error(`CORS blocked for origin: ${origin}`));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
};

// Middleware
app.use(compression());
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// MongoDB Connection
const MONGODB_URI = process.env.MONGODB_URI || "mongodb+srv://dineshknight19_db_user:dinesh1910@cluster0.hepq0h5.mongodb.net/sri-ram-fashions"

const createDefaultAdmin = async () => {
    try {
        const adminExists = await User.findOne({ email: 'sriramfashionstrp@gmail.com' });
        if (!adminExists) {
            const hashedPassword = await bcrypt.hash('password123', 10);
            await User.create({
                name: 'Admin User',
                email: 'sriramfashionstrp@gmail.com',
                password: hashedPassword,
                phone: '9080573831',
                role: 'admin',
                isActive: true
            });
            console.log('✅ Default admin user created (sriramfashionstrp@gmail.com / password123)');
        }
    } catch (error) {
        console.error('Error creating default admin:', error);
    }
};

mongoose.connect(MONGODB_URI, {
    serverSelectionTimeoutMS: 30000, // Increase timeout to 30 seconds
    socketTimeoutMS: 45000,
    maxPoolSize: 10,
    minPoolSize: 2,
})
    .then(async () => {
        console.log('✅ Connected to MongoDB Atlas');
        console.log(`📦 Database: ${mongoose.connection.name}`);
        await createDefaultAdmin();
    })
    .catch((err) => {
        console.error('❌ MongoDB connection error:', err.message);
        console.error('💡 Please check:');
        console.error('   1. MongoDB Atlas cluster is running');
        console.error('   2. Network access allows your IP address');
        console.error('   3. Database username/password are correct');
        console.error('   4. Internet connection is stable');
    });

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/bills', billRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/hsn', hsnRoutes);
app.use('/api/suppliers', supplierRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/sales-entries', salesEntriesRoutes);
app.use('/api/purchase-entries', purchaseEntriesRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/email', emailRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'Sri Ram Fashions API is running' });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        success: false,
        message: 'Something went wrong!',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ success: false, message: 'Route not found' });
});

// Start server
const PORT = process.env.PORT || 5000;
import { initScheduler } from './services/schedulerService.js';

app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📍 API URL: http://localhost:${PORT}/api`);

    // Start automated tasks
    initScheduler();
});

export default app;
