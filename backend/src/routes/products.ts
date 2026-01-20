import express, { Request, Response } from 'express';
import Product from '../models/Product.js';
import StockMovement from '../models/StockMovement.js';
import { chatWithAI } from '../services/ai.js';

const router = express.Router();

// GET all products with filtering and pagination
router.get('/', async (req: Request, res: Response) => {
    try {
        const { category, search, page = 1, limit = 20 } = req.query;

        const query: any = { isActive: true };
        if (category) query.category = category as string;
        if (search) {
            const searchRegex = { $regex: search as string, $options: 'i' };
            query.$or = [{ name: searchRegex }, { sku: searchRegex }];
        }

        const pageNum = parseInt(page as string, 10);
        const limitNum = parseInt(limit as string, 10);

        const products = await Product.find(query)
            .populate('category', 'name')
            .skip((pageNum - 1) * limitNum)
            .limit(limitNum)
            .sort({ createdAt: -1 });

        const total = await Product.countDocuments(query);

        res.json({
            success: true,
            data: products,
            pagination: {
                page: pageNum,
                limit: limitNum,
                total,
                pages: Math.ceil(total / limitNum)
            }
        });
    } catch (error: unknown) {
        res.status(500).json({ success: false, message: (error as Error).message });
    }
});

// AI-powered product description generator
router.post('/generate-description', async (req: Request, res: Response) => {
    try {
        const { productName, category, features } = req.body;
        const prompt = `Generate a compelling product description for a product named "${productName}" in the category "${category}". Highlight the following features: ${features}.`;

        const description = await chatWithAI('product-description', prompt);

        res.json({ success: true, data: description });
    } catch (error: unknown) {
        res.status(500).json({ success: false, message: (error as Error).message });
    }
});

// Other product routes...

export default router;
