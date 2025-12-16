import express from 'express';
import SalesEntry from '../models/SalesEntry.js';

const router = express.Router();

// Get all sales entries with filters and pagination
router.get('/', async (req, res) => {
    try {
        const { search, fromDate, toDate, page = 1, limit = 20 } = req.query;

        const query = {};

        // Search by invoice number or customer name
        if (search) {
            query.$or = [
                { invoiceNumber: { $regex: search, $options: 'i' } },
                { 'customer.name': { $regex: search, $options: 'i' } }
            ];
        }

        // Date range filter
        if (fromDate || toDate) {
            query.date = {};
            if (fromDate) query.date.$gte = new Date(fromDate);
            if (toDate) query.date.$lte = new Date(toDate);
        }

        const entries = await SalesEntry.find(query)
            .skip((page - 1) * limit)
            .limit(parseInt(limit))
            .sort({ date: -1, createdAt: -1 });

        const total = await SalesEntry.countDocuments(query);

        res.json({
            success: true,
            data: entries,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Get single sales entry by ID
router.get('/:id', async (req, res) => {
    try {
        const entry = await SalesEntry.findById(req.params.id);
        if (!entry) {
            return res.status(404).json({ success: false, message: 'Sales entry not found' });
        }
        res.json({ success: true, data: entry });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Create new sales entry
router.post('/', async (req, res) => {
    try {
        const { customer, date, invoiceNumber, items, notes } = req.body;

        // Calculate totals
        let subtotal = 0;
        let totalCgst = 0;
        let totalSgst = 0;
        let totalIgst = 0;

        const processedItems = items.map(item => {
            const amount = (parseFloat(item.quantity) || 0) * (parseFloat(item.rate) || 0);
            const cgstAmount = (amount * (parseFloat(item.cgst) || 0)) / 100;
            const sgstAmount = (amount * (parseFloat(item.sgst) || 0)) / 100;
            const igstAmount = (amount * (parseFloat(item.igst) || 0)) / 100;
            const total = amount + cgstAmount + sgstAmount + igstAmount;

            subtotal += amount;
            totalCgst += cgstAmount;
            totalSgst += sgstAmount;
            totalIgst += igstAmount;

            return {
                particular: item.particular,
                size: item.size || '',
                quantity: parseFloat(item.quantity) || 0,
                rate: parseFloat(item.rate) || 0,
                amount,
                cgst: parseFloat(item.cgst) || 0,
                sgst: parseFloat(item.sgst) || 0,
                igst: parseFloat(item.igst) || 0,
                total
            };
        });

        const totalTax = totalCgst + totalSgst + totalIgst;
        const grandTotal = subtotal + totalTax;

        const entry = new SalesEntry({
            invoiceNumber: invoiceNumber || undefined, // Will be auto-generated if not provided
            date: date || new Date(),
            customer: {
                name: customer.name || customer,
                mobile: customer.mobile || '',
                gstin: customer.gstin || '',
                address: customer.address || ''
            },
            items: processedItems,
            subtotal,
            totalCgst,
            totalSgst,
            totalIgst,
            totalTax,
            grandTotal,
            notes
        });

        await entry.save();
        res.status(201).json({ success: true, data: entry });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Update sales entry
router.put('/:id', async (req, res) => {
    try {
        const { customer, date, items, notes, status } = req.body;

        // Recalculate totals if items are updated
        let updateData = { notes, status };

        if (date) updateData.date = date;
        if (customer) {
            updateData.customer = {
                name: customer.name || customer,
                mobile: customer.mobile || '',
                gstin: customer.gstin || '',
                address: customer.address || ''
            };
        }

        if (items && items.length > 0) {
            let subtotal = 0;
            let totalCgst = 0;
            let totalSgst = 0;
            let totalIgst = 0;

            const processedItems = items.map(item => {
                const amount = (parseFloat(item.quantity) || 0) * (parseFloat(item.rate) || 0);
                const cgstAmount = (amount * (parseFloat(item.cgst) || 0)) / 100;
                const sgstAmount = (amount * (parseFloat(item.sgst) || 0)) / 100;
                const igstAmount = (amount * (parseFloat(item.igst) || 0)) / 100;
                const total = amount + cgstAmount + sgstAmount + igstAmount;

                subtotal += amount;
                totalCgst += cgstAmount;
                totalSgst += sgstAmount;
                totalIgst += igstAmount;

                return {
                    particular: item.particular,
                    size: item.size || '',
                    quantity: parseFloat(item.quantity) || 0,
                    rate: parseFloat(item.rate) || 0,
                    amount,
                    cgst: parseFloat(item.cgst) || 0,
                    sgst: parseFloat(item.sgst) || 0,
                    igst: parseFloat(item.igst) || 0,
                    total
                };
            });

            const totalTax = totalCgst + totalSgst + totalIgst;
            const grandTotal = subtotal + totalTax;

            updateData = {
                ...updateData,
                items: processedItems,
                subtotal,
                totalCgst,
                totalSgst,
                totalIgst,
                totalTax,
                grandTotal
            };
        }

        const entry = await SalesEntry.findByIdAndUpdate(
            req.params.id,
            updateData,
            { new: true }
        );

        if (!entry) {
            return res.status(404).json({ success: false, message: 'Sales entry not found' });
        }

        res.json({ success: true, data: entry });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Delete sales entry
router.delete('/:id', async (req, res) => {
    try {
        const entry = await SalesEntry.findByIdAndDelete(req.params.id);
        if (!entry) {
            return res.status(404).json({ success: false, message: 'Sales entry not found' });
        }
        res.json({ success: true, message: 'Sales entry deleted successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

export default router;
