import express, { Request, Response } from 'express';
import { chatWithAI, smartSearch } from '../services/ai.js';

const router = express.Router();

interface AuthenticatedRequest extends Request {
    user?: { id: string };
}

// Chat with AI assistant
router.post('/chat', async (req: AuthenticatedRequest, res: Response) => {
    try {
        const { message } = req.body;
        const userId = req.user?.id || 'anonymous';

        if (!message || typeof message !== 'string' || message.trim() === '') {
            return res.status(400).json({ success: false, message: 'A valid message is required.' });
        }

        const response = await chatWithAI(userId, message);
        res.json(response);
    } catch (error: unknown) {
        console.error('Chat endpoint error:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

// AI-powered smart search
router.post('/smart-search', async (req: Request, res: Response) => {
    try {
        const { query } = req.body;
        if (!query || typeof query !== 'string' || query.trim() === '') {
            return res.status(400).json({ success: false, results: [], message: 'A valid search query is required.' });
        }

        const response = await smartSearch(query);
        res.json(response);
    } catch (error: unknown) {
        console.error('Smart search error:', error);
        res.status(500).json({ success: false, results: [] });
    }
});

// Other AI routes...

export default router;
