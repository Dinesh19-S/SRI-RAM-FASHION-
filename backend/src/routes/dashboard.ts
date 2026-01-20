import express, { Request, Response } from 'express';
import Bill from '../models/Bill.js';
import Product from '../models/Product.js';
import { chatWithAI } from '../services/ai.js';

const router = express.Router();

// Dashboard stats
router.get('/stats', async (req: Request, res: Response) => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const thisMonth = new Date(today.getFullYear(), today.getMonth(), 1);

        const [thisMonthStats, customers] = await Promise.all([
            Bill.aggregate([
                { $match: { date: { $gte: thisMonth } } },
                { $group: { _id: null, revenue: { $sum: '$grandTotal' }, orders: { $sum: 1 } } }
            ]),
            Bill.distinct('customer.phone')
        ]);

        const thisMonthData = thisMonthStats[0] || { revenue: 0, orders: 0 };

        res.json({
            success: true,
            data: {
                totalRevenue: thisMonthData.revenue,
                totalOrders: thisMonthData.orders,
                avgOrderValue: thisMonthData.orders > 0 ? thisMonthData.revenue / thisMonthData.orders : 0,
                totalCustomers: customers.length
            }
        });
    } catch (error: unknown) {
        res.status(500).json({ success: false, message: (error as Error).message });
    }
});

// AI-powered sales summary
router.get('/sales-summary', async (req: Request, res: Response) => {
    try {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const salesData = await Bill.find({ date: { $gte: thirtyDaysAgo } })
            .select('grandTotal date items')
            .lean();

        const prompt = `Analyze the following sales data for the last 30 days and provide a brief summary (2-3 sentences) of the key trends. Data: ${JSON.stringify(salesData)}`;

        const summary = await chatWithAI('dashboard-summary', prompt);

        res.json({ success: true, data: summary });
    } catch (error: unknown) {
        res.status(500).json({ success: false, message: (error as Error).message });
    }
});


// Recent bills
router.get('/recent-bills', async (req: Request, res: Response) => {
    try {
        const limit = parseInt(req.query.limit as string || '5', 10);
        const bills = await Bill.find()
            .sort({ createdAt: -1 })
            .limit(limit)
            .select('billNumber customer.name grandTotal date paymentStatus');

        res.json({ success: true, data: bills });
    } catch (error: unknown) {
        res.status(500).json({ success: false, message: (error as Error).message });
    }
});

// Other routes...

export default router;
