import { getModel, systemPrompts } from '../config/aiConfig.js';
import Product from '../models/Product.js';
import Bill from '../models/Bill.js';
import Customer from '../models/Customer.js';
import Supplier from '../models/Supplier.js';
import PurchaseEntry from '../models/PurchaseEntry.js';

// Basic rate limiting
const requestCounts = new Map<string, { count: number; windowStart: number }>();
const MAX_REQUESTS = 15;
const WINDOW_MS = 60000;

const checkRateLimit = (userId: string): boolean => {
    const now = Date.now();
    const userData = requestCounts.get(userId) || { count: 0, windowStart: now };

    if (now - userData.windowStart > WINDOW_MS) {
        userData.count = 1;
        userData.windowStart = now;
    } else {
        userData.count++;
    }
    requestCounts.set(userId, userData);
    return userData.count <= MAX_REQUESTS;
};

// Main chat handler
export const chatWithAssistant = async (userId: string, message: string) => {
    if (!checkRateLimit(userId)) {
        return { success: false, message: 'Rate limit exceeded. Please wait a moment.' };
    }
    try {
        const model = getModel();
        const context = await getBusinessContext(); // Re-usable context function
        const prompt = `${systemPrompts.chatAssistant}\n\nCurrent Business Data:\n${JSON.stringify(context, null, 2)}\n\nUser Query: ${message}`;
        const result = await model.generateContent(prompt);
        return { success: true, message: result.response.text() };
    } catch (error) {
        console.error('AI Chat Error:', error);
        return { success: false, message: 'Error processing your request.' };
    }
};

// Other AI service functions...
export const generateInsights = async () => { /* ... */ };
export const getInventoryPredictions = async () => { /* ... */ };
export const smartSearch = async (query: string) => { /* ... */ };

// Helper to get a snapshot of business data
async function getBusinessContext() {
    const [products, lowStock, recentBills, customerCount, salesToday] = await Promise.all([
        Product.countDocuments(),
        Product.find({ $expr: { $lte: ['$stock', '$lowStockThreshold'] } }).limit(5).lean(),
        Bill.find().sort({ createdAt: -1 }).limit(3).lean(),
        Customer.countDocuments(),
        Bill.aggregate([
            { $match: { createdAt: { $gte: new Date(new Date().setHours(0,0,0,0)) } } },
            { $group: { _id: null, total: { $sum: '$grandTotal' }, count: { $sum: 1 } } }
        ])
    ]);
    return {
        totalProducts: products,
        lowStockItems: lowStock.map(p => p.name),
        recentBills: recentBills.length,
        customerCount,
        todaySales: salesToday[0] || { total: 0, count: 0 },
    };
}
